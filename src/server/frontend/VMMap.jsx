// VMMap.jsx
import React from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import iconUrl from 'leaflet/dist/images/marker-icon.png';
import iconShadowUrl from 'leaflet/dist/images/marker-shadow.png';

const DefaultIcon = L.icon({ iconUrl, shadowUrl: iconShadowUrl });
L.Marker.prototype.options.icon = DefaultIcon;

export default function VMMap({ markers }) {
  if (!markers.length) return null;

  const avgLat = markers.reduce((sum, m) => sum + m.lat, 0) / markers.length;
  const avgLng = markers.reduce((sum, m) => sum + m.lng, 0) / markers.length;

  return (
    <div style={{ height: 300, marginVertical: 10 }}>
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
            <Popup>{`${vm_name} (ID: ${vm_id})`}</Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
