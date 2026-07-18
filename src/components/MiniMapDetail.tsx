'use client';

import { MapContainer, TileLayer, Circle } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

interface MiniMapProps {
  latitude: number;
  longitude: number;
}

export default function MiniMapDetail({ latitude, longitude }: MiniMapProps) {
  const position: [number, number] = [latitude, longitude];

  return (
    <MapContainer 
      center={position} 
      zoom={14} 
      scrollWheelZoom={false} 
      zoomControl={false}
      dragging={false}
      doubleClickZoom={false}
      className="w-full h-full z-0"
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {/* Rayon de sécurité indicatif de 800 mètres autour du repère */}
      <Circle 
        center={position} 
        radius={800} 
        pathOptions={{ color: '#f59e0b', fillColor: '#f59e0b', fillOpacity: 0.2 }} 
      />
    </MapContainer>
  );
}