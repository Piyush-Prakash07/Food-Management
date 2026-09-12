import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MapPin, Package, Building, Truck, Navigation, Layers, Filter, Sparkles, ZoomIn, ZoomOut } from 'lucide-react';
import { getCoords, calculateDistanceKm, formatDistance, estimateTransitTime } from '../utils/geo';

const InteractiveFoodMap = ({ 
    donations = [], 
    requests = [], 
    deliveries = [], 
    onSelectMatch 
}) => {
    const mapContainerRef = useRef(null);
    const mapInstanceRef = useRef(null);
    const layerGroupRef = useRef(null);

    const [showDonors, setShowDonors] = useState(true);
    const [showNGOs, setShowNGOs] = useState(true);
    const [showRoutes, setShowRoutes] = useState(true);
    const [selectedCity, setSelectedCity] = useState('all');

    // Initialize Leaflet Map focused on India
    useEffect(() => {
        if (!mapContainerRef.current) return;

        if (!mapInstanceRef.current) {
            // Create map instance centered on India
            const map = L.map(mapContainerRef.current, {
                center: [22.5937, 78.9629], // Center of India
                zoom: 5,
                minZoom: 4,
                maxZoom: 18,
                zoomControl: false,
                attributionControl: false
            });

            // Modern Voyager Tile Layer (CartoDB OpenStreetMap)
            L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
                maxZoom: 19,
                subdomains: 'abcd'
            }).addTo(map);

            layerGroupRef.current = L.layerGroup().addTo(map);
            mapInstanceRef.current = map;

            // Trigger size calculation to fix any grey/blank tiles
            setTimeout(() => {
                map.invalidateSize();
            }, 250);
        }

        return () => {
            if (mapInstanceRef.current) {
                mapInstanceRef.current.remove();
                mapInstanceRef.current = null;
            }
        };
    }, []);

    // Update Markers and Routes
    useEffect(() => {
        if (!mapInstanceRef.current || !layerGroupRef.current) return;

        const layerGroup = layerGroupRef.current;
        layerGroup.clearLayers();

        const allLatLngs = [];

        // 1. Donor Pins (Green)
        if (showDonors) {
            donations.forEach((d) => {
                const city = d.Donor?.city || '';
                if (selectedCity !== 'all' && city.toLowerCase() !== selectedCity.toLowerCase()) return;

                const coords = getCoords(city, d.id);
                allLatLngs.push(coords);

                const donorIcon = L.divIcon({
                    className: 'custom-donor-pin',
                    html: `
                        <div class="relative flex items-center justify-center">
                            <span class="absolute w-8 h-8 bg-emerald-500/30 rounded-full animate-ping"></span>
                            <div class="w-8 h-8 bg-gradient-to-br from-emerald-400 to-teal-600 rounded-full border-2 border-white shadow-xl flex items-center justify-center text-white text-xs font-bold transform hover:scale-125 transition">
                                🍲
                            </div>
                        </div>
                    `,
                    iconSize: [32, 32],
                    iconAnchor: [16, 16]
                });

                const marker = L.marker(coords, { icon: donorIcon });

                // Calculate distance to closest NGO
                const candidateNGOs = requests.map(r => ({
                    request: r,
                    distKm: calculateDistanceKm(city, r.NGO?.city, d.id, r.id)
                })).sort((a, b) => (a.distKm || 9999) - (b.distKm || 9999));
                const closestNGO = candidateNGOs[0];

                const popupContent = document.createElement('div');
                popupContent.className = 'p-3 text-gray-900 min-w-[220px] font-sans';
                popupContent.innerHTML = `
                    <div style="font-family: sans-serif;">
                        <div style="font-size: 10px; font-weight: 800; text-transform: uppercase; color: #059669; letter-spacing: 0.5px;">Food Donor (Surplus)</div>
                        <div style="font-size: 14px; font-weight: 800; color: #111827; margin-top: 2px;">${d.food_type}</div>
                        <div style="font-size: 12px; color: #4b5563; margin-top: 2px;">Qty: <strong>${d.quantity} units</strong></div>
                        <div style="margin-top: 6px; font-size: 12px; color: #374151;">
                            <div>👤 <strong>${d.Donor?.name || 'Donor'}</strong></div>
                            <div>📍 ${d.Donor?.city || 'Place N/A'}</div>
                            ${d.Donor?.phone ? `<div>📞 ${d.Donor.phone}</div>` : ''}
                        </div>
                        ${closestNGO ? `
                            <div style="margin-top: 6px; padding: 4px 6px; background: #ecfdf5; border: 1px solid #a7f3d0; border-radius: 6px; font-size: 11px; color: #065f46;">
                                📍 <strong>${formatDistance(closestNGO.distKm)}</strong> to ${closestNGO.request.NGO?.name || 'NGO'} (${closestNGO.request.NGO?.city || ''})
                            </div>
                        ` : ''}
                        <button id="assign-btn-${d.id}" style="margin-top: 10px; width: 100%; padding: 6px 10px; background: #10b981; color: white; font-size: 11px; font-weight: 700; border: none; border-radius: 8px; cursor: pointer;">
                            ⚡ Match & Assign
                        </button>
                    </div>
                `;

                popupContent.querySelector(`#assign-btn-${d.id}`)?.addEventListener('click', () => {
                    if (onSelectMatch) onSelectMatch(d);
                });

                marker.bindPopup(popupContent);
                layerGroup.addLayer(marker);
            });
        }

        // 2. NGO / Receiver Pins (Blue)
        if (showNGOs) {
            requests.forEach((r) => {
                const city = r.NGO?.city || '';
                if (selectedCity !== 'all' && city.toLowerCase() !== selectedCity.toLowerCase()) return;

                const coords = getCoords(city, r.id + 50);
                allLatLngs.push(coords);

                const ngoIcon = L.divIcon({
                    className: 'custom-ngo-pin',
                    html: `
                        <div class="relative flex items-center justify-center">
                            <span class="absolute w-8 h-8 bg-blue-500/30 rounded-full animate-ping"></span>
                            <div class="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full border-2 border-white shadow-xl flex items-center justify-center text-white text-xs font-bold transform hover:scale-125 transition">
                                🏢
                            </div>
                        </div>
                    `,
                    iconSize: [32, 32],
                    iconAnchor: [16, 16]
                });

                const marker = L.marker(coords, { icon: ngoIcon });

                // Calculate distance to closest donor
                const candidateDonors = donations.map(d => ({
                    donation: d,
                    distKm: calculateDistanceKm(d.Donor?.city, city, d.id, r.id)
                })).sort((a, b) => (a.distKm || 9999) - (b.distKm || 9999));
                const closestDonor = candidateDonors[0];

                const popupContent = document.createElement('div');
                popupContent.className = 'p-3 text-gray-900 min-w-[220px] font-sans';
                popupContent.innerHTML = `
                    <div style="font-family: sans-serif;">
                        <div style="font-size: 10px; font-weight: 800; text-transform: uppercase; color: #2563eb; letter-spacing: 0.5px;">Receiver (NGO Requirement)</div>
                        <div style="font-size: 14px; font-weight: 800; color: #111827; margin-top: 2px;">${r.request_food_type}</div>
                        <div style="font-size: 12px; color: #4b5563; margin-top: 2px;">Needs: <strong>${r.required_quantity} units</strong></div>
                        <div style="margin-top: 6px; font-size: 12px; color: #374151;">
                            <div>🏢 <strong>${r.NGO?.name || 'NGO'}</strong></div>
                            <div>📍 ${r.NGO?.city || 'Place N/A'}</div>
                            ${r.NGO?.phone ? `<div>📞 ${r.NGO.phone}</div>` : ''}
                        </div>
                        ${closestDonor ? `
                            <div style="margin-top: 6px; padding: 4px 6px; background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 6px; font-size: 11px; color: #1e40af;">
                                📍 <strong>${formatDistance(closestDonor.distKm)}</strong> from ${closestDonor.donation.Donor?.name || 'Donor'} (${closestDonor.donation.Donor?.city || ''})
                            </div>
                        ` : ''}
                    </div>
                `;

                marker.bindPopup(popupContent);
                layerGroup.addLayer(marker);
            });
        }

        // 3. Active Delivery Route Polylines (Purple)
        if (showRoutes) {
            deliveries.forEach((del) => {
                const donorCity = del.DonationAssignment?.FoodDonation?.Donor?.city || '';
                const ngoCity = del.DonationAssignment?.FoodRequest?.NGO?.city || '';

                if (!donorCity || !ngoCity) return;

                const donorCoords = getCoords(donorCity, del.id);
                const ngoCoords = getCoords(ngoCity, del.id + 50);

                allLatLngs.push(donorCoords, ngoCoords);

                const distKm = calculateDistanceKm(donorCity, ngoCity, del.id, del.id + 50);

                // Draw route line
                const polyline = L.polyline([donorCoords, ngoCoords], {
                    color: '#8b5cf6',
                    weight: 3,
                    opacity: 0.8,
                    dashArray: '8, 8'
                });

                polyline.bindPopup(`
                    <div style="font-family: sans-serif; font-size: 12px; min-width: 190px;">
                        <div style="font-weight: 800; color: #7c3aed;">🚚 Active Delivery Route #${del.id}</div>
                        <div style="margin-top: 4px;"><strong>From:</strong> ${donorCity}</div>
                        <div><strong>To:</strong> ${ngoCity}</div>
                        <div style="margin-top: 4px; padding: 4px 6px; background: #f3e8ff; border-radius: 6px; color: #6b21a8; font-weight: 700; font-size: 11px;">
                            📍 ${formatDistance(distKm)} • ⏱ ${estimateTransitTime(distKm)}
                        </div>
                        <div style="margin-top: 4px; color: #4b5563;">Volunteer: <strong>${del.Volunteer?.name || 'Assigned'}</strong></div>
                        <div>Status: <span style="font-weight: 700; color: #059669;">${del.delivery_status || del.pickup_status}</span></div>
                    </div>
                `);

                layerGroup.addLayer(polyline);
            });
        }

        // Auto-fit bounds if markers exist
        if (allLatLngs.length > 0) {
            try {
                const bounds = L.latLngBounds(allLatLngs);
                mapInstanceRef.current.fitBounds(bounds, { padding: [50, 50], maxZoom: 12 });
            } catch {
                // Ignore bounds error on single point
            }
        }
    }, [donations, requests, deliveries, showDonors, showNGOs, showRoutes, selectedCity, onSelectMatch]);

    // Extract all unique cities
    const citiesList = Array.from(new Set([
        ...donations.map(d => d.Donor?.city).filter(Boolean),
        ...requests.map(r => r.NGO?.city).filter(Boolean)
    ])).sort();

    return (
        <div className="relative w-full h-[480px] sm:h-[550px] lg:h-[620px] rounded-3xl overflow-hidden border border-gray-800 shadow-2xl bg-[#0f172a]">
            {/* Top Interactive Map HUD Controls */}
            <div className="absolute top-4 left-4 right-4 z-[1000] flex flex-wrap items-center justify-between gap-3 pointer-events-none">
                {/* Layer Toggles */}
                <div className="flex items-center gap-2 bg-[#111827]/90 backdrop-blur-md p-1.5 rounded-2xl border border-gray-700/80 shadow-lg pointer-events-auto">
                    <button
                        onClick={() => setShowDonors(!showDonors)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                            showDonors 
                                ? 'bg-emerald-500 text-white shadow-md shadow-emerald-950' 
                                : 'text-gray-400 hover:text-white'
                        }`}
                    >
                        <span className="w-2 h-2 rounded-full bg-emerald-300"></span>
                        Donors ({donations.length})
                    </button>

                    <button
                        onClick={() => setShowNGOs(!showNGOs)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                            showNGOs 
                                ? 'bg-blue-600 text-white shadow-md shadow-blue-950' 
                                : 'text-gray-400 hover:text-white'
                        }`}
                    >
                        <span className="w-2 h-2 rounded-full bg-blue-300"></span>
                        NGOs ({requests.length})
                    </button>

                    <button
                        onClick={() => setShowRoutes(!showRoutes)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                            showRoutes 
                                ? 'bg-purple-600 text-white shadow-md shadow-purple-950' 
                                : 'text-gray-400 hover:text-white'
                        }`}
                    >
                        <Truck size={12} />
                        Routes ({deliveries.length})
                    </button>
                </div>

                {/* City Focus Selector */}
                <div className="flex items-center gap-2 bg-[#111827]/90 backdrop-blur-md px-3 py-1.5 rounded-2xl border border-gray-700/80 shadow-lg pointer-events-auto">
                    <MapPin size={14} className="text-emerald-400" />
                    <select
                        value={selectedCity}
                        onChange={(e) => setSelectedCity(e.target.value)}
                        className="bg-transparent text-white text-xs font-bold outline-none cursor-pointer"
                    >
                        <option value="all" className="bg-[#111827]">Worldwide / All Cities</option>
                        {citiesList.map(city => (
                            <option key={city} value={city} className="bg-[#111827]">📍 {city}</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Bottom Legend Overlay */}
            <div className="absolute bottom-4 left-4 z-[1000] bg-[#111827]/90 backdrop-blur-md px-4 py-2.5 rounded-2xl border border-gray-700/80 shadow-lg text-xs flex items-center gap-4 text-gray-300 pointer-events-auto">
                <div className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-full bg-emerald-500 border border-white"></span>
                    <span className="font-semibold text-white">Donor Surplus</span>
                </div>
                <div className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-full bg-blue-500 border border-white"></span>
                    <span className="font-semibold text-white">NGO Request</span>
                </div>
                <div className="flex items-center gap-1.5">
                    <span className="w-4 h-0.5 border-t-2 border-dashed border-purple-400"></span>
                    <span className="font-semibold text-white">Transit Route</span>
                </div>
            </div>

            {/* The Actual Leaflet Map Canvas */}
            <div ref={mapContainerRef} className="w-full h-full z-0" />
        </div>
    );
};

export default InteractiveFoodMap;
