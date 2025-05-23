// VMMap.jsx
import React, { useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import resolveAssetSource from 'react-native/Libraries/Image/resolveAssetSource';

// Metro-compatible URI for the base marker image
const iconUri = resolveAssetSource(require('./assets/icon.png')).uri;

/* ────── helper: build an icon with a coloured border ────── */
const makeIcon = colour =>
  L.divIcon({
    className: '',
    iconSize:   [45, 45],
    iconAnchor: [22, 45],
    popupAnchor:[0, -45],
    html: `
      <div style="
        width:45px;height:45px;border-radius:50%;
        border:3px solid ${colour};
        box-shadow:0 0 4px rgba(0,0,0,.4);
        display:flex;justify-content:center;align-items:center;
        background:#fff;
      ">
        <img src='${iconUri}' width='41' height='41' style="border-radius:50%" />
      </div>
    `,
  });

export default function VMMap({ markers }) {
  if (!markers.length) return null;

  /* centre map on average lat/lng */
  const centre = useMemo(() => {
    const lat = markers.reduce((s, m) => s + m.lat, 0) / markers.length;
    const lng = markers.reduce((s, m) => s + m.lng, 0) / markers.length;
    return [lat, lng];
  }, [markers]);

  return (
    <div style={{ height: 300, margin: '10px 0' }}>
      <MapContainer
        center={centre}
        zoom={13}
        scrollWheelZoom
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution="&copy; OpenStreetMap contributors"
        />

        {markers.map(({ vm_id, vm_name, lat, lng, inventory = [] }) => {
          /* ─ choose border colour ─ */
          const stocks  = inventory.map(i => Number(i.stock));
          let borderCol = '#4caf50';
          if (stocks.some(s => s === 0))      borderCol = '#f44336';
          else if (stocks.some(s => s < 5))   borderCol = '#ff9800';

          /* ─ build alert messages ─ */
          const alerts = inventory.reduce((arr, itm) => {
            const s = Number(itm.stock);
            if (s === 0)       arr.push(`${itm.item_name} out of stock`);
            else if (s < 5)    arr.push(`${itm.item_name} stock is low`);
            return arr;
          }, []);

          return (
            <Marker
              key={vm_id}
              position={[lat, lng]}
              icon={makeIcon(borderCol)}
            >
              <Popup>
                <div style={{ lineHeight: 1.4 }}>
                  <strong>{vm_name}</strong><br />
                  ID: {vm_id}<br />
                  {alerts.map((msg, idx) => (
                    <div key={idx} style={{ color: '#d32f2f' }}>{msg}</div>
                  ))}
                  {alerts.length > 0 && <hr />}
                  <a
                    href={`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Get Directions
                  </a>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
}
