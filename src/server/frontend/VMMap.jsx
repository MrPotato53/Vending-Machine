// VMMap.jsx
import React from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { Image } from 'react-native';
import resolveAssetSource from 'react-native/Libraries/Image/resolveAssetSource';

// Resolve the URI of the assets for Metro bundler
const iconUri = resolveAssetSource(require('./assets/icon.png')).uri;
const shadowUri = resolveAssetSource(require('leaflet/dist/images/marker-shadow.png')).uri;

// Create custom Leaflet icon
const CustomIcon = new L.Icon({
  iconUrl: iconUri,
  shadowUrl: shadowUri,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [0, -41],
  shadowSize: [41, 41],
  shadowAnchor: [12, 41],
});

export default function VMMap({ markers }) {
  if (!markers.length) return null;

  const avgLat = markers.reduce((sum, m) => sum + m.lat, 0) / markers.length;
  const avgLng = markers.reduce((sum, m) => sum + m.lng, 0) / markers.length;

  return (
    <div style={{ height: 300, margin: '10px 0' }}>
      <MapContainer
        center={[avgLat, avgLng]}
        zoom={13}
        scrollWheelZoom={true}
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; OpenStreetMap contributors'
        />
        {markers.map(({ vm_id, vm_name, lat, lng }) => (
          <Marker
            key={vm_id}
            position={[lat, lng]}
            icon={CustomIcon}
          >
            <Popup>
              <div>
                <strong>{vm_name}</strong><br />
                ID: {vm_id}<br />
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
        ))}
      </MapContainer>
    </div>
  );
}
