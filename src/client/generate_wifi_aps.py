#!/usr/bin/env python3
import subprocess
import re
import json
from pathlib import Path

def is_locally_administered(mac: str) -> bool:
    # Second least-significant bit of the first byte = 1 → locally-administered
    first_byte = int(mac.split(':')[0], 16)
    return bool(first_byte & 0x02)

def is_iana_reserved(mac: str) -> bool:
    # MACs in 00:00:5E:00:00:00/24 are IANA-reserved
    return mac[:8].upper() == '00:00:5E'

def scan_windows_wifi() -> list:
    out = subprocess.check_output(
        ['netsh', 'wlan', 'show', 'networks', 'mode=bssid'],
        text=True, stderr=subprocess.DEVNULL
    )
    aps = []
    current_mac = None

    for line in out.splitlines():
        m = re.match(r'^\s*BSSID\s+\d+\s*:\s*(.+)$', line)
        if m:
            current_mac = m.group(1).strip().lower()
            continue

        s = re.match(r'^\s*Signal\s*:\s*(\d+)%', line)
        if s and current_mac:
            pct = int(s.group(1))
            dbm = int(pct / 2) - 100  # Map 0–100% to -100 to -50 dBm
            aps.append({
                'macAddress': current_mac,
                'signalStrength': dbm,
                'signalToNoiseRatio': 0
            })
            current_mac = None

    return [
        ap for ap in aps
        if not is_locally_administered(ap['macAddress']) and not is_iana_reserved(ap['macAddress'])
    ]

def main():
    wifi_list = scan_windows_wifi()
    out = {
        'considerIp': False,
        'wifiAccessPoints': wifi_list
    }

    dest = Path('customer') / 'wifi_aps.json'
    dest.parent.mkdir(parents=True, exist_ok=True)
    dest.write_text(json.dumps(out, indent=2))
    print(f'Wrote {len(wifi_list)} APs to {dest.resolve()}')

if __name__ == '__main__':
    main()
