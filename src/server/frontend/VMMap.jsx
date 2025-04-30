import React from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import iconUrl from './assets/icon.png'; // Adjust path as needed

// Create a custom icon
const CustomIcon = new L.Icon({
  iconUrl,
  iconSize: [25, 41],          // Default size for Leaflet
  iconAnchor: [12, 41],        // Anchor the bottom point of the icon to the location
  popupAnchor: [0, -41],       // Position popup above the marker
  shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
  shadowSize: [41, 41],
  shadowAnchor: [12, 41],
});

// Override default icon
L.Marker.prototype.options.icon = CustomIcon;

export default function VMMap({ markers }) {
  if (!markers.length) return null;

  const avgLat = markers.reduce((sum, m) => sum + m.lat, 0) / markers.length;
  const avgLng = markers.reduce((sum, m) => sum + m.lng, 0) / markers.length;

  return (
    <div style={{ height: 300, margin: '10px 0' }}>
      <MapContainer
        center={[avgLat, avgLng]}
        zoom={13}
        style={{ height: '100%', width: '100%' }}
        scrollWheelZoom={false}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; OpenStreetMap contributors'
        />
        {markers.map(({ vm_id, vm_name, lat, lng }) => (
          <Marker key={vm_id} position={[lat, lng]}>
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
