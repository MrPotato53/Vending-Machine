# customer/mqtt.py

import threading
import time
import json
import requests
import datetime

import paho.mqtt.client as mqtt
from api_constants import BROKER_HOST, GEO_API_KEY
from inventory_manager import InventoryManager

class MQTTConnection:
    """Message queueing service that serves automatic restocking, healthcheckups,
       and conditional location reporting based on IP changes and daily refresh."""

    @staticmethod
    def start_mqtt_connection(hardware_id: str, inv_man: InventoryManager) -> None:
        # 1) Standard MQTT setup
        def on_message(client, userdata, message) -> None:
            print("Restocked, syncing from database:")
            inv_man.sync_from_database()

        client = mqtt.Client(client_id=hardware_id, clean_session=False)
        client.on_message = on_message

        status_topic = f"vm/status/{hardware_id}"
        client.will_set(status_topic, "offline", qos=1, retain=True)
        client.on_connect = lambda c, u, f, rc: c.publish(
            status_topic, "online", qos=1, retain=True
        )

        client.connect(BROKER_HOST, 3306, 60)
        client.subscribe(f"vm/restocked/{hardware_id}", qos=1)

        # Start MQTT network loop
        threading.Thread(target=client.loop_forever, daemon=True).start()

        # 2) Background location‐publisher: only when IP changes or daily
        def location_publisher():
            loc_topic = f"vm/location/{hardware_id}"
            geo_url = f"https://www.googleapis.com/geolocation/v1/geolocate?key={GEO_API_KEY}"
            last_ip = None
            last_geo_update = datetime.datetime.min

            while True:
                try:
                    # 2a) Check current public IP
                    ip_resp = requests.get('https://api.ipify.org?format=json', timeout=5)
                    ip_resp.raise_for_status()
                    current_ip = ip_resp.json().get('ip')
                    now = datetime.datetime.utcnow()

                    # 2b) Determine if we need a geolocation call
                    if current_ip != last_ip or (now - last_geo_update) >= datetime.timedelta(days=1):
                        geo_resp = requests.post(geo_url, timeout=5)
                        geo_resp.raise_for_status()
                        loc = geo_resp.json().get('location', {})  # { "lat": ..., "lng": ... }

                        # Publish if we got valid location data
                        if loc:
                            client.publish(
                                loc_topic,
                                json.dumps(loc),
                                qos=1,
                                retain=True
                            )
                            print(f"Published location to {loc_topic}: {loc}")

                        # Update trackers
                        last_ip = current_ip
                        last_geo_update = now
                    else:
                        print(f"No location update needed (IP: {current_ip}, last update: {last_geo_update.isoformat()})")
                except Exception as e:
                    print(f"[Location error] {e}")
                # Wait 60s before checking IP again
                time.sleep(60)

        threading.Thread(target=location_publisher, daemon=True).start()
