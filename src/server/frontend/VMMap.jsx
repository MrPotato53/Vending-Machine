// VMMap.jsx
import React, { useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import resolveAssetSource from 'react-native/Libraries/Image/resolveAssetSource';

// Metro-compatible URI for our base PNG
const iconUri = resolveAssetSource(require('./assets/icon.png')).uri;

/* ───────── helper: generate a bordered icon ───────── */
const makeIcon = borderColor =>
  L.divIcon({
    className: '',                // no default Leaflet styles
    iconSize: [45, 45],
    iconAnchor: [22, 45],
    popupAnchor: [0, -45],
    html: `
      <div style="
        width:45px;height:45px;
        border-radius:50%;
        border:3px solid ${borderColor};
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
  const avg = useMemo(() => {
    const lat = markers.reduce((s, m) => s + m.lat, 0) / markers.length;
    const lng = markers.reduce((s, m) => s + m.lng, 0) / markers.length;
    return [lat, lng];
  }, [markers]);

  return (
    <div style={{ height: 300, margin: '10px 0' }}>
      <MapContainer
        center={avg}
        zoom={13}
        scrollWheelZoom={true}
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer
          url='https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
          attribution='&copy; OpenStreetMap contributors'
        />

        {markers.map(({ vm_id, vm_name, lat, lng, inventory = [] }) => {
          /* ─ determine border colour from inventory ─ */
          const stocks = inventory.map(i => Number(i.stock));
          let border = '#4caf50';                 // normal (green)
          if (stocks.some(s => s === 0))  border = '#f44336';   // red – out of stock
          else if (stocks.some(s => s < 5)) border = '#ff9800'; // orange – low stock

          return (
            <Marker
              key={vm_id}
              position={[lat, lng]}
              icon={makeIcon(border)}
            >
              <Popup>
                <div>
                  <strong>{vm_name}</strong><br />
                  ID: {vm_id}<br />
                  <a
                    href={`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`}
                    target='_blank'
                    rel='noopener noreferrer'
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
