# customer/mqtt.py

import threading
import time
import json
import requests
import subprocess
import shutil
import os
from typing import Optional, Dict, Any
from datetime import datetime, timedelta, timezone

import paho.mqtt.client as mqtt
from api_constants import BROKER_HOST, GEO_API_KEY
from inventory_manager import InventoryManager

class MQTTConnection:
    """Service handling restocks, health checks, and precise location reporting."""

    @staticmethod
    def start_mqtt_connection(hardware_id: str, inv_man: InventoryManager) -> None:
        # 1) Standard MQTT setup
        client = mqtt.Client(client_id=hardware_id, clean_session=False)
        client.on_message = lambda c, u, m: (
            print("Restocked, syncing from database:") or
            inv_man.sync_from_database()
            if m.topic == f"vm/restocked/{hardware_id}" else None
        )

        status_topic = f"vm/status/{hardware_id}"
        client.will_set(status_topic, "offline", qos=1, retain=True)
        client.on_connect = lambda c, u, f, rc: (
            c.publish(status_topic, "online", qos=1, retain=True)
        )

        client.connect(BROKER_HOST, 3306, 60)
        client.subscribe(f"vm/restocked/{hardware_id}", qos=1)
        threading.Thread(target=client.loop_forever, daemon=True).start()

        # 2) Prepare HTTP session for geolocation and IP lookup
        session = requests.Session()
        session.headers.update({'Content-Type': 'application/json'})

        def fetch_public_ip() -> Optional[str]:
            resp = session.get('https://api.ipify.org?format=json', timeout=5)
            resp.raise_for_status()
            ip = resp.json().get('ip')
            # print(f"Fetched public IP: {ip}")
            return ip

        def scan_wifi_aps() -> list:
            # First, load pre-generated Wi-Fi AP list if the JSON file exists
            json_path = os.getenv('WIFI_APS_JSON', '/app/wifi_aps.json')
            if os.path.exists(json_path):
                try:
                    with open(json_path, 'r', encoding='utf-8-sig') as f:
                        data = json.load(f)
                    aps = data.get('wifiAccessPoints', [])
                    # print(f"Loaded {len(aps)} Wi-Fi APs from {json_path}")
                    return aps
                except Exception as e:
                    # print(f"Failed to parse Wi-Fi JSON: {e}")
                    return []
            print(f"Wi-Fi JSON file not found at {json_path}, attempting live scan")

            # Fallback: Linux live scan using iwlist
            if not shutil.which('iwlist'):
                print("iwlist not found, skipping live Wi-Fi scan")
                return []
            if not shutil.which('ip'):
                print("ip command not found, skipping interface check")
                return []
            try:
                subprocess.check_call(
                    ['ip', 'link', 'show', 'wlan0'],
                    stdout=subprocess.DEVNULL,
                    stderr=subprocess.DEVNULL
                )
            except (subprocess.CalledProcessError, FileNotFoundError):
                print("Interface wlan0 unavailable, skipping live Wi-Fi scan")
                return []

            try:
                output = subprocess.check_output(
                    ['iwlist', 'wlan0', 'scan'],
                    stderr=subprocess.DEVNULL,
                    text=True
                )
                import re
                bssids = re.findall(r'Address: ([0-9A-F:]{17})', output)
                sigs   = re.findall(r'Signal level=(-?\d+) dBm', output)
                aps = [
                    {'macAddress': mac, 'signalStrength': int(sig)}
                    for mac, sig in zip(bssids, sigs)
                ]
                print(f"Scanned {len(aps)} Wi-Fi APs via live iwlist scan")
                return aps
            except subprocess.CalledProcessError as e:
                print(f"Live Wi-Fi scan error status {e.returncode}, skipping")
                return []
            except Exception as e:
                print(f"Unexpected live Wi-Fi scan failure: {e}")
                return []

        def fetch_geolocation(wifi_aps: Optional[list] = None) -> Optional[Dict[str, Any]]:
            """Call Google's Geolocation API with Wi-Fi hints for maximum accuracy."""
            # Prepare request body
            body: Dict[str, Any] = {'considerIp': not bool(wifi_aps)}
            if wifi_aps:
                body['wifiAccessPoints'] = wifi_aps

            # DEBUG: print request body
            # print(f"Geolocation request body: {json.dumps(body)}")

            geo_url = f"https://www.googleapis.com/geolocation/v1/geolocate?key={GEO_API_KEY}"
            try:
                resp = session.post(geo_url, json=body, timeout=5)
            except requests.RequestException as e:
                print(f"Geolocation request failed: {e}")
                return None

            if resp.status_code == 404:
                print("Geolocation API returned 404 Not Found; falling back to IP-only geolocation")
                # Fallback to IP-only without raising
                fallback_body = {'considerIp': True}
                # print(f"Fallback request body: {json.dumps(fallback_body)}")
                fallback = session.post(geo_url, json=fallback_body, timeout=5)
                if fallback.status_code != 200:
                    print(f"Fallback geolocation error {fallback.status_code}: {fallback.text}")
                    return None
                data = fallback.json()
                print(f"Fallback IP geolocation returned: location={data.get('location')}, accuracy={data.get('accuracy')}")
                return data.get('location')
            # Other errors
            if resp.status_code != 200:
                print(f"Geolocation API error {resp.status_code}: {resp.text}")
                return None

            data = resp.json()
            # print(f"Geolocation API returned: location={data.get('location')}, accuracy={data.get('accuracy')}")
            return data.get('location')

        # 3) Background location publisher
        def location_publisher():
            loc_topic = f"vm/location/{hardware_id}"
            last_ip = None
            last_geo_time = datetime.min.replace(tzinfo=timezone.utc)

            while True:
                now = datetime.now(timezone.utc)
                try:
                    current_ip = fetch_public_ip()
                    wifi_aps = scan_wifi_aps()
                    use_wifi = bool(wifi_aps)

                    needs_update = (
                        current_ip != last_ip
                        or (now - last_geo_time) >= timedelta(days=1)
                    )

                    if use_wifi or needs_update:
                        loc = fetch_geolocation(wifi_aps if use_wifi else None)
                        if loc:
                            payload = json.dumps({'lat': loc['lat'], 'lng': loc['lng']})
                            client.publish(loc_topic, payload, qos=1, retain=True)
                            print(f"Published location for {hardware_id}: {payload}")
                        else:
                            print(f"Geolocation API returned no location for {hardware_id}")

                        last_ip = current_ip
                        last_geo_time = now
                    else:
                        print(f"No location update needed (IP={current_ip}, last={last_geo_time.isoformat()})")
                except Exception as e:
                    print(f"Unexpected error in location publisher: {e}")

                time.sleep(60)

        threading.Thread(target=location_publisher, daemon=True).start()
