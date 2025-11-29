'use client';

import React, { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { Search, Filter, Layers, Map as MapIcon, Info, X, Maximize2, Minimize2 } from 'lucide-react';
// Leaflet CSS is imported in _app.js to avoid Next.js global CSS errors

// Dynamically import Leaflet components to avoid SSR issues
const MapContainer = dynamic(() => import('react-leaflet').then(mod => mod.MapContainer), { ssr: false });
const TileLayer = dynamic(() => import('react-leaflet').then(mod => mod.TileLayer), { ssr: false });
const GeoJSON = dynamic(() => import('react-leaflet').then(mod => mod.GeoJSON), { ssr: false });
const Marker = dynamic(() => import('react-leaflet').then(mod => mod.Marker), { ssr: false });
const Popup = dynamic(() => import('react-leaflet').then(mod => mod.Popup), { ssr: false });

// Mock Data for Mining Sites
const MINING_SITES = [
    { id: 1, name: 'Jharia Coalfield', state: 'Jharkhand', lat: 23.75, lng: 86.42, type: 'Coal', status: 'Active', production: '15 MTPA' },
    { id: 2, name: 'Raniganj Coalfield', state: 'West Bengal', lat: 23.62, lng: 87.13, type: 'Coal', status: 'Active', production: '12 MTPA' },
    { id: 3, name: 'Singrauli Coalfield', state: 'Madhya Pradesh', lat: 24.20, lng: 82.67, type: 'Coal', status: 'Active', production: '20 MTPA' },
    { id: 4, name: 'Talcher Coalfield', state: 'Odisha', lat: 20.95, lng: 85.22, type: 'Coal', status: 'Active', production: '18 MTPA' },
    { id: 5, name: 'Korba Coalfield', state: 'Chhattisgarh', lat: 22.35, lng: 82.68, type: 'Coal', status: 'Active', production: '16 MTPA' },
];

export default function GISSection({ theme }) {
    const [geoJsonData, setGeoJsonData] = useState(null);
    const [selectedState, setSelectedState] = useState(null);
    const [selectedSite, setSelectedSite] = useState(null);
    const [loading, setLoading] = useState(true);
    const [showSidebar, setShowSidebar] = useState(true);

    const isDark = theme === 'dark' || theme === 'darkest';
    const bgClass = isDark ? 'bg-slate-900' : 'bg-white';
    const textClass = isDark ? 'text-white' : 'text-slate-900';
    const borderClass = isDark ? 'border-slate-800' : 'border-slate-200';

    useEffect(() => {
        // Fix for Leaflet icon issues in Next.js
        const fixLeafletIcons = async () => {
            const L = (await import('leaflet')).default;
            delete L.Icon.Default.prototype._getIconUrl;
            L.Icon.Default.mergeOptions({
                iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
                iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
                shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
            });
        };
        fixLeafletIcons();

        // Fetch GeoJSON Data
        fetch('https://raw.githubusercontent.com/Subhash9325/GeoJson-Data-of-Indian-States/master/Indian_States')
            .then(response => response.json())
            .then(data => {
                setGeoJsonData(data);
                setLoading(false);
            })
            .catch(error => {
                console.error("Error fetching GeoJSON:", error);
                setLoading(false);
            });
    }, []);

    const onEachFeature = (feature, layer) => {
        layer.on({
            mouseover: (e) => {
                const layer = e.target;
                layer.setStyle({
                    weight: 2,
                    color: '#666',
                    dashArray: '',
                    fillOpacity: 0.7
                });
            },
            mouseout: (e) => {
                const layer = e.target;
                layer.setStyle({
                    weight: 1,
                    color: 'white',
                    dashArray: '3',
                    fillOpacity: 0.5
                });
            },
            click: (e) => {
                setSelectedState(feature.properties);
                setSelectedSite(null);
                if (!showSidebar) setShowSidebar(true);
            }
        });
    };

    const mapStyle = {
        fillColor: isDark ? '#3b82f6' : '#3b82f6',
        weight: 1,
        opacity: 1,
        color: 'white',
        dashArray: '3',
        fillOpacity: 0.5
    };

    return (
        <div className="h-full flex flex-col relative overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800">
            {/* Map Controls / Header */}
            <div className={`absolute top-4 left-4 z-[1000] flex flex-col gap-2`}>
                <div className={`p-2 rounded-lg shadow-lg ${bgClass} ${borderClass} border`}>
                    <div className="flex items-center gap-2 mb-2">
                        <MapIcon size={20} className="text-blue-500" />
                        <span className={`font-bold ${textClass}`}>CMPDI GIS Portal</span>
                    </div>
                    <div className="flex gap-2">
                        <button className={`p-2 rounded hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors ${textClass}`} title="Layers">
                            <Layers size={18} />
                        </button>
                        <button className={`p-2 rounded hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors ${textClass}`} title="Filter">
                            <Filter size={18} />
                        </button>
                        <button className={`p-2 rounded hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors ${textClass}`} title="Search">
                            <Search size={18} />
                        </button>
                    </div>
                </div>
            </div>

            {/* Sidebar Toggle */}
            <button 
                onClick={() => setShowSidebar(!showSidebar)}
                className={`absolute top-4 right-4 z-[1000] p-2 rounded-lg shadow-lg ${bgClass} ${borderClass} border ${textClass} hover:bg-slate-100 dark:hover:bg-slate-800`}
            >
                {showSidebar ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
            </button>

            {/* Map Area */}
            <div className="flex-1 h-full w-full relative z-0">
                {loading ? (
                    <div className={`flex items-center justify-center h-full ${bgClass}`}>
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                    </div>
                ) : (
                    <MapContainer 
                        center={[22.5937, 78.9629]} 
                        zoom={5} 
                        style={{ height: '100%', width: '100%', background: isDark ? '#0f172a' : '#f8fafc' }}
                        zoomControl={false}
                    >
                        <TileLayer
                            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                            url={isDark 
                                ? "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" 
                                : "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
                            }
                        />
                        
                        {geoJsonData && (
                            <GeoJSON 
                                data={geoJsonData} 
                                style={mapStyle}
                                onEachFeature={onEachFeature}
                            />
                        )}

                        {MINING_SITES.map(site => (
                            <Marker 
                                key={site.id} 
                                position={[site.lat, site.lng]}
                                eventHandlers={{
                                    click: () => {
                                        setSelectedSite(site);
                                        setSelectedState(null);
                                        if (!showSidebar) setShowSidebar(true);
                                    },
                                }}
                            >
                                <Popup>
                                    <div className="p-2">
                                        <h3 className="font-bold text-sm">{site.name}</h3>
                                        <p className="text-xs text-slate-500">{site.state}</p>
                                    </div>
                                </Popup>
                            </Marker>
                        ))}
                    </MapContainer>
                )}
            </div>

            {/* Info Sidebar */}
            {showSidebar && (
                <div className={`absolute top-4 right-16 bottom-4 w-80 z-[1000] rounded-xl shadow-2xl overflow-hidden flex flex-col ${bgClass} ${borderClass} border`}>
                    <div className={`p-4 border-b ${borderClass} flex justify-between items-center`}>
                        <h3 className={`font-bold ${textClass}`}>
                            {selectedSite ? 'Site Details' : selectedState ? 'State Info' : 'Overview'}
                        </h3>
                        <button onClick={() => setShowSidebar(false)} className={`p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 ${textClass}`}>
                            <X size={16} />
                        </button>
                    </div>
                    
                    <div className="flex-1 overflow-y-auto p-4">
                        {selectedSite ? (
                            <div className="space-y-4">
                                <div className="aspect-video bg-slate-200 dark:bg-slate-800 rounded-lg mb-4 flex items-center justify-center">
                                    <MapIcon className="text-slate-400" size={32} />
                                </div>
                                <div>
                                    <label className="text-xs text-slate-500 uppercase tracking-wider">Name</label>
                                    <p className={`font-medium ${textClass}`}>{selectedSite.name}</p>
                                </div>
                                <div>
                                    <label className="text-xs text-slate-500 uppercase tracking-wider">Location</label>
                                    <p className={`font-medium ${textClass}`}>{selectedSite.state}</p>
                                    <p className="text-xs text-slate-400">{selectedSite.lat}, {selectedSite.lng}</p>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className={`p-3 rounded-lg ${isDark ? 'bg-slate-800' : 'bg-slate-50'}`}>
                                        <label className="text-xs text-slate-500">Type</label>
                                        <p className={`font-semibold ${textClass}`}>{selectedSite.type}</p>
                                    </div>
                                    <div className={`p-3 rounded-lg ${isDark ? 'bg-slate-800' : 'bg-slate-50'}`}>
                                        <label className="text-xs text-slate-500">Status</label>
                                        <p className="font-semibold text-emerald-500">{selectedSite.status}</p>
                                    </div>
                                </div>
                                <div>
                                    <label className="text-xs text-slate-500 uppercase tracking-wider">Annual Production</label>
                                    <p className={`text-xl font-bold ${textClass}`}>{selectedSite.production}</p>
                                </div>
                                <button className="w-full py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-medium mt-4">
                                    View Full Report
                                </button>
                            </div>
                        ) : selectedState ? (
                            <div className="space-y-4">
                                <div>
                                    <label className="text-xs text-slate-500 uppercase tracking-wider">State Name</label>
                                    <p className={`text-xl font-bold ${textClass}`}>{selectedState.NAME_1 || selectedState.name || 'Unknown'}</p>
                                </div>
                                <div className={`p-4 rounded-lg ${isDark ? 'bg-slate-800' : 'bg-blue-50'} border ${isDark ? 'border-slate-700' : 'border-blue-100'}`}>
                                    <div className="flex items-start gap-3">
                                        <Info className="text-blue-500 mt-1" size={16} />
                                        <div>
                                            <p className={`text-sm ${textClass}`}>
                                                Mining activities in this region are monitored by CMPDI regional institutes.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                                <div>
                                    <h4 className={`font-semibold ${textClass} mb-2`}>Active Projects</h4>
                                    <div className="space-y-2">
                                        {MINING_SITES.filter(s => s.state === (selectedState.NAME_1 || selectedState.name)).length > 0 ? (
                                            MINING_SITES.filter(s => s.state === (selectedState.NAME_1 || selectedState.name)).map(site => (
                                                <div key={site.id} onClick={() => setSelectedSite(site)} className={`p-3 rounded-lg border cursor-pointer hover:border-blue-500 transition-colors ${bgClass} ${borderClass}`}>
                                                    <p className={`font-medium ${textClass}`}>{site.name}</p>
                                                    <p className="text-xs text-slate-500">{site.type} • {site.production}</p>
                                                </div>
                                            ))
                                        ) : (
                                            <p className="text-sm text-slate-500 italic">No major sites listed in this view.</p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-6">
                                <div className="text-center py-6">
                                    <div className="inline-flex p-3 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 mb-3">
                                        <MapIcon size={24} />
                                    </div>
                                    <h3 className={`font-bold ${textClass}`}>Interactive GIS Map</h3>
                                    <p className="text-sm text-slate-500 mt-1">Select a state or mining site to view details.</p>
                                </div>
                                
                                <div>
                                    <h4 className={`text-xs font-bold uppercase tracking-wider text-slate-500 mb-3`}>Key Statistics</h4>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div className={`p-3 rounded-lg border ${borderClass} ${bgClass}`}>
                                            <p className="text-2xl font-bold text-blue-500">{MINING_SITES.length}</p>
                                            <p className={`text-xs ${textClass}`}>Active Sites</p>
                                        </div>
                                        <div className={`p-3 rounded-lg border ${borderClass} ${bgClass}`}>
                                            <p className="text-2xl font-bold text-emerald-500">81 MT</p>
                                            <p className={`text-xs ${textClass}`}>Total Production</p>
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <h4 className={`text-xs font-bold uppercase tracking-wider text-slate-500 mb-3`}>Legend</h4>
                                    <div className="space-y-2">
                                        <div className="flex items-center gap-2">
                                            <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                                            <span className={`text-sm ${textClass}`}>Coal Mines</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
                                            <span className={`text-sm ${textClass}`}>Reclaimed Land</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <div className="w-3 h-3 rounded-full bg-orange-500"></div>
                                            <span className={`text-sm ${textClass}`}>Exploration Zones</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
