import React, { useEffect, useState } from 'react';
import { WorkSite } from '../types';
import { X, MapPin, ExternalLink } from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix for default marker icon in React Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface WorkSitesMapModalProps {
    isOpen: boolean;
    onClose: () => void;
    sites: WorkSite[];
}

// Component to recenter map
const RecenterAutomatically = ({ sites }: { sites: WorkSite[] }) => {
    const map = useMap();
    useEffect(() => {
        if (sites.length > 0) {
            const group = new L.FeatureGroup(sites.map(s => L.marker([s.location_lat, s.location_lng])));
            map.fitBounds(group.getBounds().pad(0.1));
        }
    }, [sites, map]);
    return null;
};

export const WorkSitesMapModal: React.FC<WorkSitesMapModalProps> = ({ isOpen, onClose, sites }) => {
    if (!isOpen) return null;

    // Filter valid sites (non-zero coordinates)
    const validSites = sites.filter(s => s.location_lat !== 0 && s.location_lng !== 0);
    const centerLat = validSites.length > 0 ? validSites[0].location_lat : 40.4168;
    const centerLng = validSites.length > 0 ? validSites[0].location_lng : -3.7038;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose}></div>
            <div className="bg-white rounded-[2rem] w-full max-w-5xl h-[85vh] relative z-10 flex flex-col shadow-2xl animate-in fade-in zoom-in duration-300">
                {/* Header */}
                <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50 rounded-t-[2rem]">
                    <div>
                        <h2 className="text-xl font-black text-slate-800 uppercase italic tracking-tighter">Mapa de Obras</h2>
                        <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">{validSites.length} Ubicaciones Geolocalizadas</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
                        <X size={24} className="text-slate-500" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 relative bg-slate-100 overflow-hidden flex">
                    {/* Sidebar List */}
                    <div className="w-80 bg-white border-r border-slate-200 overflow-y-auto p-4 space-y-3 custom-scrollbar hidden md:block">
                        {sites.map(site => (
                            <div key={site.id} className="p-4 rounded-xl border border-slate-100 hover:border-indigo-500 hover:bg-indigo-50/30 transition-all cursor-pointer group">
                                <div className="flex justify-between items-start mb-2">
                                    <h3 className="font-bold text-slate-700 leading-tight">{site.name}</h3>
                                    <span className={`w-2 h-2 shrink-0 rounded-full mt-1 ${site.is_active ? 'bg-emerald-500' : 'bg-slate-300'}`}></span>
                                </div>
                                <div className="text-[10px] text-slate-400 font-mono space-y-1">
                                    <p className="flex items-center gap-1"><MapPin size={10} /> {site.location_lat.toFixed(4)}, {site.location_lng.toFixed(4)}</p>
                                    <p>Radio: {site.location_radius}m</p>
                                </div>
                                <a
                                    href={`https://www.google.com/maps/search/?api=1&query=${site.location_lat},${site.location_lng}`}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="mt-3 text-[10px] uppercase font-black text-indigo-500 flex items-center gap-1 hover:underline"
                                >
                                    Abrir en Google Maps <ExternalLink size={10} />
                                </a>
                            </div>
                        ))}
                        {sites.length === 0 && <p className="text-xs text-slate-400 text-center py-4">No hay obras registradas</p>}
                    </div>

                    {/* Map Area */}
                    <div className="flex-1 relative z-0">
                        <MapContainer
                            center={[centerLat, centerLng]}
                            zoom={13}
                            style={{ height: '100%', width: '100%' }}
                            className="z-0"
                        >
                            <TileLayer
                                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                            />
                            {validSites.map(site => (
                                <Marker key={site.id} position={[site.location_lat, site.location_lng]}>
                                    <Popup className="custom-popup">
                                        <div className="p-2 min-w-[200px]">
                                            <h3 className="font-bold text-slate-800 mb-1">{site.name}</h3>
                                            <p className="text-xs text-slate-500 mb-2">Radio: {site.location_radius}m</p>
                                            <a
                                                href={`https://www.google.com/maps/search/?api=1&query=${site.location_lat},${site.location_lng}`}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="text-xs text-indigo-600 font-bold hover:underline"
                                            >
                                                Ver en Google Maps
                                            </a>
                                        </div>
                                    </Popup>
                                </Marker>
                            ))}
                            <RecenterAutomatically sites={validSites} />
                        </MapContainer>
                    </div>
                </div>
            </div>
        </div>
    );
};
