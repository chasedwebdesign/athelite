'use client';

import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import MarkerClusterGroup from 'react-leaflet-cluster';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// 🎨 Custom Icon Generator (Fixes Next.js default icon bugs & looks premium)
const createCustomIcon = (division: string) => {
  // Color code by division!
  let color = '#3b82f6'; // Default Blue (D1)
  if (division?.includes('D2')) color = '#8b5cf6'; // Purple
  if (division?.includes('D3')) color = '#10b981'; // Green
  if (division?.includes('NAIA') || division?.includes('JUCO')) color = '#f59e0b'; // Orange

  return L.divIcon({
    html: `<div style="background-color: ${color}; width: 1.25rem; height: 1.25rem; border-radius: 50%; border: 3px solid white; box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.2);"></div>`,
    className: 'custom-leaflet-icon',
    iconSize: [20, 20],
    iconAnchor: [10, 10], // Centers the dot exactly on the coordinate
  });
};

interface MapProps {
  universities: any[];
  onCollegeSelect: (college: any) => void;
}

export default function CollegeMap({ universities, onCollegeSelect }: MapProps) {
  // Center the map on the middle of the United States
  const center = [39.8283, -98.5795];

  // Only show universities that actually have coordinates saved
  const mappableUniversities = universities.filter(u => u.latitude && u.longitude);

  return (
    <div className="w-full h-[500px] rounded-[2rem] overflow-hidden border border-slate-200 shadow-inner relative z-0 mb-8 bg-slate-100">
      <MapContainer 
        center={center as L.LatLngExpression} 
        zoom={4} 
        scrollWheelZoom={true} 
        className="w-full h-full z-0"
      >
        {/* A beautiful, clean, light-themed map layer */}
        <TileLayer
          attribution='&copy; <a href="https://carto.com/">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
        />
        
        {/* The Magic Clustering Engine! */}
        <MarkerClusterGroup chunkedLoading maxClusterRadius={40}>
          {mappableUniversities.map((uni) => (
            <Marker 
              key={uni.id} 
              position={[uni.latitude, uni.longitude]}
              icon={createCustomIcon(uni.division)}
              eventHandlers={{
                click: () => onCollegeSelect(uni), // Tells the main page which dot was clicked
              }}
            >
              <Popup className="rounded-xl overflow-hidden border-0 shadow-xl">
                <div className="font-sans px-1 pb-1">
                  <h4 className="font-black text-slate-900 text-sm mb-0.5">{uni.name}</h4>
                  <p className="text-xs font-medium text-slate-500 mb-3">{uni.city}, {uni.state}</p>
                  <button 
                    onClick={() => onCollegeSelect(uni)}
                    className="w-full text-[10px] font-black uppercase tracking-widest text-white bg-blue-600 px-3 py-2 rounded-lg hover:bg-blue-700 transition-colors shadow-md"
                  >
                    View Selected
                  </button>
                </div>
              </Popup>
            </Marker>
          ))}
        </MarkerClusterGroup>
      </MapContainer>
    </div>
  );
}