import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { toast } from 'react-toastify';
import { 
    LayoutDashboard, 
    Users, 
    CheckCircle, 
    Package, 
    ClipboardList, 
    UserCog, 
    MapPin, 
    ArrowRight, 
    Sparkles, 
    Filter, 
    Truck, 
    Building, 
    Search, 
    ShieldCheck, 
    Navigation,
    CheckCircle2,
    Map as MapIcon,
    Layers
} from 'lucide-react';
import api from '../../api/axios';
import InteractiveFoodMap from '../InteractiveFoodMap';
import { calculateDistanceKm, formatDistance, estimateTransitTime } from '../../utils/geo';

const AdminView = () => {
    const [activeTab, setActiveTab] = useState('dashboard');
    const [donations, setDonations] = useState([]);
    const [pendingDonations, setPendingDonations] = useState([]);
    const [requests, setRequests] = useState([]);
    const [pendingRequests, setPendingRequests] = useState([]);
    const [volunteers, setVolunteers] = useState([]);
    const [users, setUsers] = useState({ donors: [], ngos: [], volunteers: [] });
    const [stats, setStats] = useState({ donorsCount: 0, ngosCount: 0, volunteersCount: 0 });
    const [deliveries, setDeliveries] = useState([]);

    const [donFilters, setDonFilters] = useState({ don_food_type: '', don_status: '', don_name: '' });
    const [reqFilters, setReqFilters] = useState({ req_food_type: '', req_status: '', req_name: '' });
    const [delFilter, setDelFilter] = useState('');

    // Matching Hub Specific Filters & Views
    const [hubViewMode, setHubViewMode] = useState('matrix'); // 'matrix' | 'map'
    const [assignPlaceFilter, setAssignPlaceFilter] = useState('all');
    const [assignSearchQuery, setAssignSearchQuery] = useState('');
    const [assignMatchMode, setAssignMatchMode] = useState('all'); // 'all', 'same_city', 'same_food'

    // Selected Match for Assignment
    const [selectedDonation, setSelectedDonation] = useState(null);
    const [assignmentForm, setAssignmentForm] = useState({ request_id: '', volunteer_id: '' });

    const fetchDashboardData = useCallback(async () => {
        try {
            const [dashRes, usersRes] = await Promise.all([
                api.get('/api/admin/dashboard', {
                    params: {
                        ...donFilters,
                        ...reqFilters,
                        del_status: delFilter
                    }
                }),
                api.get('/api/admin/users')
            ]);

            setDonations(dashRes.data.donations || []);
            setPendingDonations(dashRes.data.pendingDonations || []);
            setRequests(dashRes.data.requests || []);
            setPendingRequests(dashRes.data.pendingRequests || []);
            setVolunteers(dashRes.data.volunteers || []);

            if (dashRes.data.stats) {
                setStats(dashRes.data.stats);
            }

            if (dashRes.data.activeDeliveries) {
                setDeliveries(dashRes.data.activeDeliveries);
            }

            if (usersRes.data) {
                setUsers({
                    donors: usersRes.data.donors || [],
                    ngos: usersRes.data.ngos || [],
                    volunteers: usersRes.data.volunteers || []
                });
            }
        } catch {
            toast.error('Failed to load admin dashboard data');
        }
    }, [donFilters, reqFilters, delFilter]);

    useEffect(() => {
        const delayDebounceFn = setTimeout(() => {
            fetchDashboardData();
        }, 300);

        return () => clearTimeout(delayDebounceFn);
    }, [fetchDashboardData]);

    // Unique cities extracted across all donors and receivers
    const allCities = useMemo(() => {
        const cities = new Set();
        pendingDonations.forEach(d => {
            if (d.Donor?.city && d.Donor.city !== 'N/A') cities.add(d.Donor.city);
        });
        pendingRequests.forEach(r => {
            if (r.NGO?.city && r.NGO.city !== 'N/A') cities.add(r.NGO.city);
        });
        return Array.from(cities).sort();
    }, [pendingDonations, pendingRequests]);

    // Smart pair suggestions with real geographic distance calculation
    const smartSuggestions = useMemo(() => {
        const suggestions = [];
        pendingDonations.forEach(don => {
            pendingRequests.forEach(req => {
                const donCity = don.Donor?.city || '';
                const reqCity = req.NGO?.city || '';
                const isSameCity = donCity && reqCity && donCity.toLowerCase().trim() === reqCity.toLowerCase().trim() && donCity.toLowerCase() !== 'n/a';
                
                const donFood = (don.food_type || '').toLowerCase();
                const reqFood = (req.request_food_type || '').toLowerCase();
                const isFoodMatch = donFood.includes(reqFood) || reqFood.includes(donFood);

                const distKm = calculateDistanceKm(donCity, reqCity, don.id, req.id);

                suggestions.push({
                    donation: don,
                    request: req,
                    isSameCity,
                    isFoodMatch,
                    distanceKm: distKm,
                    formattedDistance: formatDistance(distKm),
                    transitTime: estimateTransitTime(distKm),
                    score: (isSameCity ? 50 : 0) + (isFoodMatch ? 30 : 0) - (distKm ? Math.min(distKm / 50, 40) : 0)
                });
            });
        });
        return suggestions.sort((a, b) => b.score - a.score || (a.distanceKm || 9999) - (b.distanceKm || 9999));
    }, [pendingDonations, pendingRequests]);

    // Filtered donations for the Side-by-Side view
    const filteredPendingDonations = useMemo(() => {
        return pendingDonations.filter(d => {
            const city = d.Donor?.city || '';
            const food = d.food_type || '';
            const donorName = d.Donor?.name || '';
            const query = assignSearchQuery.toLowerCase();

            const matchesCity = assignPlaceFilter === 'all' || city.toLowerCase() === assignPlaceFilter.toLowerCase();
            const matchesQuery = !query || food.toLowerCase().includes(query) || donorName.toLowerCase().includes(query) || city.toLowerCase().includes(query);
            
            if (assignMatchMode === 'same_city') {
                const hasMatchingReq = pendingRequests.some(r => (r.NGO?.city || '').toLowerCase() === city.toLowerCase() && city !== 'N/A');
                return matchesCity && matchesQuery && hasMatchingReq;
            }
            if (assignMatchMode === 'same_food') {
                const hasMatchingReq = pendingRequests.some(r => {
                    const rf = (r.request_food_type || '').toLowerCase();
                    const df = food.toLowerCase();
                    return rf.includes(df) || df.includes(rf);
                });
                return matchesCity && matchesQuery && hasMatchingReq;
            }

            return matchesCity && matchesQuery;
        });
    }, [pendingDonations, pendingRequests, assignPlaceFilter, assignSearchQuery, assignMatchMode]);

    // Filtered requests for the Side-by-Side view
    const filteredPendingRequests = useMemo(() => {
        return pendingRequests.filter(r => {
            const city = r.NGO?.city || '';
            const food = r.request_food_type || '';
            const ngoName = r.NGO?.name || '';
            const query = assignSearchQuery.toLowerCase();

            const matchesCity = assignPlaceFilter === 'all' || city.toLowerCase() === assignPlaceFilter.toLowerCase();
            const matchesQuery = !query || food.toLowerCase().includes(query) || ngoName.toLowerCase().includes(query) || city.toLowerCase().includes(query);

            if (assignMatchMode === 'same_city') {
                const hasMatchingDon = pendingDonations.some(d => (d.Donor?.city || '').toLowerCase() === city.toLowerCase() && city !== 'N/A');
                return matchesCity && matchesQuery && hasMatchingDon;
            }
            if (assignMatchMode === 'same_food') {
                const hasMatchingDon = pendingDonations.some(d => {
                    const df = (d.food_type || '').toLowerCase();
                    const rf = food.toLowerCase();
                    return df.includes(rf) || rf.includes(df);
                });
                return matchesCity && matchesQuery && hasMatchingDon;
            }

            return matchesCity && matchesQuery;
        });
    }, [pendingRequests, pendingDonations, assignPlaceFilter, assignSearchQuery, assignMatchMode]);

    const initiateAssignment = (donation, preselectedRequestId = '') => {
        setSelectedDonation(donation);
        setAssignmentForm({
            request_id: preselectedRequestId ? String(preselectedRequestId) : '',
            volunteer_id: ''
        });
    };

    const submitAssignment = async () => {
        if (!assignmentForm.volunteer_id) {
            return toast.error("Please select a volunteer for pickup and delivery");
        }

        try {
            await api.post('/api/admin/assign', {
                donation_id: selectedDonation.id,
                volunteer_id: assignmentForm.volunteer_id,
                request_id: assignmentForm.request_id ? Number(assignmentForm.request_id) : null
            });

            const updatedDonations = donations.map(d =>
                d.id === selectedDonation.id ? { ...d, status: 'Assigned' } : d
            );

            setDonations(updatedDonations);
            toast.success('Donation matched and volunteer assigned successfully!');
            setSelectedDonation(null);
            fetchDashboardData();
        } catch {
            toast.error('Failed to assign volunteer');
        }
    };

    const getStatusBadge = (status) => {
        switch (status?.toLowerCase()) {
            case 'pending':
                return <span className="bg-amber-900/40 text-amber-300 text-xs px-2.5 py-1 rounded-full font-semibold border border-amber-600/40">Pending</span>;

            case 'delivered':
                return <span className="bg-emerald-900/40 text-emerald-300 text-xs px-2.5 py-1 rounded-full font-semibold border border-emerald-600/40">Delivered</span>;

            case 'picked up':
            case 'picked_up':
                return <span className="bg-purple-900/40 text-purple-300 text-xs px-2.5 py-1 rounded-full font-semibold border border-purple-600/40">In Transit</span>;

            case 'assigned':
            case 'matched':
                return (
                    <span className="bg-blue-900/40 text-blue-300 text-xs px-2.5 py-1 rounded-full font-semibold border border-blue-600/40">
                        Assigned
                    </span>
                );

            case 'fulfilled':
                return <span className="bg-emerald-900/40 text-emerald-300 text-xs px-2.5 py-1 rounded-full font-semibold border border-emerald-600/40">Fulfilled</span>;

            case 'available':
                return <span className="bg-emerald-900/40 text-emerald-300 text-xs px-2.5 py-1 rounded-full font-semibold border border-emerald-600/40">Available</span>;

            default:
                return (
                    <span className="bg-gray-800 text-gray-400 text-xs px-2.5 py-1 rounded-full font-semibold border border-gray-700/50">
                        {status?.toLowerCase() || 'unknown'}
                    </span>
                );
        }
    };

    // Selected NGO request object in modal for comparison
    const activeSelectedRequest = useMemo(() => {
        if (!assignmentForm.request_id) return null;
        return pendingRequests.find(r => String(r.id) === String(assignmentForm.request_id));
    }, [assignmentForm.request_id, pendingRequests]);

    const renderTabContent = () => {
        switch (activeTab) {
            case 'dashboard':
                return (
                    <div className="space-y-8 animate-in fade-in duration-500">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div>
                                <div className="flex items-center gap-2">
                                    <h2 className="text-3xl font-extrabold text-white tracking-tight">Admin Central Command</h2>
                                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-950/80 text-emerald-400 border border-emerald-700/50">
                                        <ShieldCheck size={14} /> Sole System Admin
                                    </span>
                                </div>
                                <p className="text-gray-400 mt-1">
                                    Full administrative control over donations, receiver requests, nearby place routing, and volunteer assignments.
                                </p>
                            </div>

                            <div className="flex items-center gap-2.5">
                                <button 
                                    onClick={() => setActiveTab('map')}
                                    className="inline-flex items-center gap-2 px-4 py-2.5 bg-gray-800 hover:bg-gray-700 text-gray-200 hover:text-white rounded-xl font-bold transition border border-gray-700 text-sm shrink-0"
                                >
                                    <MapIcon size={16} className="text-emerald-400" />
                                    Live Map
                                </button>

                                <button 
                                    onClick={() => setActiveTab('assignments')}
                                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white rounded-xl font-bold transition shadow-lg shadow-emerald-900/30 text-sm shrink-0"
                                >
                                    <Sparkles size={18} />
                                    Match Nearby Donations
                                </button>
                            </div>
                        </div>

                        {/* Top Summary Metrics */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                            <div className="p-6 bg-[#111827] rounded-2xl shadow-sm border border-gray-800 flex flex-col relative overflow-hidden group hover:border-emerald-500/40 transition">
                                <Users size={22} className="text-emerald-500 absolute top-6 right-6" />
                                <div className="text-gray-400 font-bold text-sm mb-2">Total Donors</div>
                                <div className="text-4xl font-extrabold text-white mb-1">{stats.donorsCount}</div>
                                <div className="text-emerald-400 text-xs font-medium">Verified Food Donors</div>
                            </div>

                            <div className="p-6 bg-[#111827] rounded-2xl shadow-sm border border-gray-800 flex flex-col relative overflow-hidden group hover:border-emerald-500/40 transition">
                                <Building size={22} className="text-blue-500 absolute top-6 right-6" />
                                <div className="text-gray-400 font-bold text-sm mb-2">Total NGOs / Receivers</div>
                                <div className="text-4xl font-extrabold text-white mb-1">{stats.ngosCount}</div>
                                <div className="text-blue-400 text-xs font-medium">Shelters & Organizations</div>
                            </div>

                            <div className="p-6 bg-[#111827] rounded-2xl shadow-sm border border-gray-800 flex flex-col relative overflow-hidden group hover:border-emerald-500/40 transition">
                                <UserCog size={22} className="text-purple-500 absolute top-6 right-6" />
                                <div className="text-gray-400 font-bold text-sm mb-2">Volunteers</div>
                                <div className="text-4xl font-extrabold text-white mb-1">{stats.volunteersCount}</div>
                                <div className="text-purple-400 text-xs font-medium">Ready for Pickups</div>
                            </div>

                            <div className="p-6 bg-[#111827] rounded-2xl shadow-sm border border-gray-800 flex flex-col relative overflow-hidden group hover:border-emerald-500/40 transition">
                                <Package size={22} className="text-amber-500 absolute top-6 right-6" />
                                <div className="text-gray-400 font-bold text-sm mb-2">Pending Donations</div>
                                <div className="text-4xl font-extrabold text-white mb-1">{pendingDonations.length}</div>
                                <div className="text-amber-400 text-xs font-medium">Awaiting Pair & Dispatch</div>
                            </div>
                        </div>

                        {/* Interactive Geographic Map Widget on Main Dashboard */}
                        <div className="bg-[#111827] p-6 rounded-3xl border border-gray-800 shadow-xl space-y-4">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                <div>
                                    <h3 className="text-xl font-bold text-white flex items-center gap-2">
                                        <MapIcon className="text-emerald-400" />
                                        Live Geographic Food Distribution Map
                                    </h3>
                                    <p className="text-xs text-gray-400 mt-0.5">
                                        Real-time interactive map of food donors (surplus), NGO receivers (demand), and active delivery routes.
                                    </p>
                                </div>
                                <button
                                    onClick={() => setActiveTab('map')}
                                    className="text-xs text-emerald-400 hover:text-emerald-300 font-bold flex items-center gap-1 transition"
                                >
                                    Expand Fullscreen Map <ArrowRight size={14} />
                                </button>
                            </div>

                            <InteractiveFoodMap 
                                donations={pendingDonations}
                                requests={pendingRequests}
                                deliveries={deliveries}
                                onSelectMatch={(don) => initiateAssignment(don)}
                            />
                        </div>

                        {/* Quick Navigation Cards */}
                        <div className="grid lg:grid-cols-3 gap-6">
                            <div className="p-6 bg-[#111827] rounded-2xl border border-gray-800 flex flex-col justify-between h-full relative overflow-hidden">
                                <div className="space-y-2">
                                    <div className="flex items-center gap-2 text-emerald-400 font-semibold text-sm">
                                        <MapPin size={16} /> Place-Based Routing
                                    </div>
                                    <h3 className="text-xl font-bold text-white">Side-by-Side Matching Hub</h3>
                                    <p className="text-sm text-gray-400">
                                        View donor locations side-by-side with receiver locations and assign nearest volunteers.
                                    </p>
                                </div>
                                <button 
                                    onClick={() => setActiveTab('assignments')} 
                                    className="mt-6 w-full py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-bold transition text-sm flex items-center justify-center gap-2 shadow-md shadow-emerald-950"
                                >
                                    <Sparkles size={16} /> Open Matching Hub
                                </button>
                            </div>

                            <div className="p-6 bg-[#111827] rounded-2xl border border-gray-800 flex flex-col justify-between h-full">
                                <div className="space-y-2">
                                    <div className="flex items-center gap-2 text-blue-400 font-semibold text-sm">
                                        <Users size={16} /> User Directory
                                    </div>
                                    <h3 className="text-xl font-bold text-white">All Platform Users</h3>
                                    <p className="text-sm text-gray-400">
                                        Inspect donors, NGOs, and volunteers with locations, contact numbers, and activity.
                                    </p>
                                </div>
                                <button 
                                    onClick={() => setActiveTab('users')} 
                                    className="mt-6 w-full py-2.5 bg-gray-800 hover:bg-gray-700 text-white rounded-xl font-semibold transition text-sm flex items-center justify-center gap-2 border border-gray-700"
                                >
                                    <Users size={16} /> View Users
                                </button>
                            </div>

                            <div className="p-6 bg-[#111827] rounded-2xl border border-gray-800 flex flex-col justify-between h-full">
                                <div className="space-y-2">
                                    <div className="flex items-center gap-2 text-purple-400 font-semibold text-sm">
                                        <Truck size={16} /> Live Deliveries
                                    </div>
                                    <h3 className="text-xl font-bold text-white">Active Pickup Routes</h3>
                                    <p className="text-sm text-gray-400">
                                        Monitor transit routes connecting donor pickup places to receiver drop-off places.
                                    </p>
                                </div>
                                <button 
                                    onClick={() => setActiveTab('assignments')} 
                                    className="mt-6 w-full py-2.5 bg-gray-800 hover:bg-gray-700 text-white rounded-xl font-semibold transition border border-gray-700 text-sm flex items-center justify-center gap-2"
                                >
                                    <Truck size={16} /> View Routes
                                </button>
                            </div>
                        </div>
                    </div>
                );

            case 'map':
                return (
                    <div className="space-y-6 animate-in fade-in duration-500">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div>
                                <h2 className="text-2xl lg:text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
                                    <MapIcon className="text-emerald-400" />
                                    Live Geographic Food Distribution Map
                                </h2>
                                <p className="text-sm text-gray-400 mt-1">
                                    Interactive geospatial view of all donor pickup points, NGO receiver locations, and volunteer transit routes.
                                </p>
                            </div>

                            <button
                                onClick={() => setActiveTab('assignments')}
                                className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl text-xs transition shadow-lg shadow-emerald-950 shrink-0"
                            >
                                <Sparkles size={16} />
                                Open Side-by-Side Matching Hub
                            </button>
                        </div>

                        {/* Interactive Full Map */}
                        <InteractiveFoodMap 
                            donations={pendingDonations}
                            requests={pendingRequests}
                            deliveries={deliveries}
                            onSelectMatch={(don) => initiateAssignment(don)}
                        />
                    </div>
                );

            case 'assignments':
                return (
                    <div className="space-y-8 animate-in fade-in duration-500">
                        {/* Header & Controls */}
                        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                            <div>
                                <h2 className="text-2xl lg:text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
                                    <MapPin className="text-emerald-400" />
                                    Nearby Places Matching & Dispatch Hub
                                </h2>
                                <p className="text-sm text-gray-400 mt-1">
                                    Compare what Donors are giving alongside what Receivers want by location to easily dispatch nearby food.
                                </p>
                            </div>

                            {/* View Switcher & Filters */}
                            <div className="flex flex-wrap items-center gap-3">
                                {/* Dual Deck vs Map Mode Switcher */}
                                <div className="flex items-center bg-[#111827] p-1 rounded-xl border border-gray-700">
                                    <button
                                        onClick={() => setHubViewMode('matrix')}
                                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                                            hubViewMode === 'matrix' 
                                                ? 'bg-emerald-500 text-white shadow-md' 
                                                : 'text-gray-400 hover:text-white'
                                        }`}
                                    >
                                        <Layers size={14} /> Side-by-Side
                                    </button>
                                    <button
                                        onClick={() => setHubViewMode('map')}
                                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                                            hubViewMode === 'map' 
                                                ? 'bg-emerald-500 text-white shadow-md' 
                                                : 'text-gray-400 hover:text-white'
                                        }`}
                                    >
                                        <MapIcon size={14} /> Map View
                                    </button>
                                </div>

                                <div className="relative">
                                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                    <input 
                                        type="text" 
                                        placeholder="Search place, food, or name..." 
                                        value={assignSearchQuery}
                                        onChange={(e) => setAssignSearchQuery(e.target.value)}
                                        className="pl-9 pr-4 py-2 bg-[#111827] text-white border border-gray-700 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none text-xs w-52 shadow-sm"
                                    />
                                </div>

                                <div className="flex items-center gap-1.5 bg-[#111827] border border-gray-700 px-3 py-1.5 rounded-xl">
                                    <MapPin size={14} className="text-emerald-400" />
                                    <select 
                                        value={assignPlaceFilter}
                                        onChange={(e) => setAssignPlaceFilter(e.target.value)}
                                        className="bg-transparent text-gray-200 text-xs font-semibold outline-none cursor-pointer"
                                    >
                                        <option value="all" className="bg-[#111827]">All Places ({allCities.length} cities)</option>
                                        {allCities.map(city => (
                                            <option key={city} value={city} className="bg-[#111827]">📍 {city}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="flex items-center gap-1.5 bg-[#111827] border border-gray-700 px-3 py-1.5 rounded-xl">
                                    <Filter size={14} className="text-blue-400" />
                                    <select 
                                        value={assignMatchMode}
                                        onChange={(e) => setAssignMatchMode(e.target.value)}
                                        className="bg-transparent text-gray-200 text-xs font-semibold outline-none cursor-pointer"
                                    >
                                        <option value="all" className="bg-[#111827]">All Available</option>
                                        <option value="same_city" className="bg-[#111827]">⚡ Same Place / City Only</option>
                                        <option value="same_food" className="bg-[#111827]">🍲 Matching Food Type Only</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        {/* Interactive Map View Mode inside Hub */}
                        {hubViewMode === 'map' ? (
                            <div className="space-y-4">
                                <InteractiveFoodMap 
                                    donations={filteredPendingDonations}
                                    requests={filteredPendingRequests}
                                    deliveries={deliveries}
                                    onSelectMatch={(don) => initiateAssignment(don)}
                                />
                            </div>
                        ) : (
                            <>
                                {/* Smart Suggested Pairs Banner */}
                                {smartSuggestions.length > 0 && (
                                    <div className="bg-gradient-to-r from-emerald-950/40 via-teal-950/30 to-slate-900 p-5 rounded-2xl border border-emerald-700/40 shadow-xl">
                                        <div className="flex items-center justify-between mb-4">
                                            <div className="flex items-center gap-2.5">
                                                <span className="p-1.5 bg-emerald-500/20 text-emerald-400 rounded-lg">
                                                    <Sparkles size={18} />
                                                </span>
                                                <div>
                                                    <h4 className="text-sm font-bold text-white tracking-wide">
                                                        Smart Proximity & Food Matches Detected ({smartSuggestions.length})
                                                    </h4>
                                                    <p className="text-xs text-gray-400">
                                                        These donors and receivers share identical locations or compatible food requests for instant pairing.
                                                    </p>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                            {smartSuggestions.slice(0, 3).map((item, idx) => (
                                                <div key={idx} className="bg-[#0f172a]/90 border border-emerald-600/30 hover:border-emerald-500 p-4 rounded-xl flex flex-col justify-between transition group shadow-md">
                                                    <div>
                                                        <div className="flex flex-wrap items-center justify-between gap-1.5 mb-2.5">
                                                            <div className="flex flex-wrap items-center gap-1.5">
                                                                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-300 bg-emerald-950/80 px-2 py-0.5 rounded-md border border-emerald-500/40">
                                                                    <MapPin size={10} className="text-emerald-400" />
                                                                    {item.formattedDistance}
                                                                </span>
                                                                <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-gray-300 bg-gray-800/80 px-1.5 py-0.5 rounded-md border border-gray-700">
                                                                    ⏱ {item.transitTime}
                                                                </span>
                                                            </div>
                                                            {item.isFoodMatch && (
                                                                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-blue-300 bg-blue-900/60 px-1.5 py-0.5 rounded-md border border-blue-500/40">
                                                                    🍲 Food Match
                                                                </span>
                                                            )}
                                                        </div>

                                                        <div className="space-y-2 text-xs">
                                                            {/* Donor Info */}
                                                            <div className="bg-emerald-950/30 p-2.5 rounded-lg border border-emerald-900/40">
                                                                <div className="text-gray-400 text-[10px] uppercase font-bold tracking-wider">Donor Offering</div>
                                                                <div className="text-white font-bold text-sm">{item.donation.quantity}x {item.donation.food_type}</div>
                                                                <div className="text-gray-300 flex items-center justify-between mt-1">
                                                                    <span>👤 {item.donation.Donor?.name}</span>
                                                                    <span className="text-emerald-400 font-medium">📍 {item.donation.Donor?.city || 'N/A'}</span>
                                                                </div>
                                                            </div>

                                                            <div className="flex items-center justify-center gap-2 text-emerald-400 my-1 text-[11px] font-bold">
                                                                <span className="h-[1px] bg-emerald-800/60 flex-1"></span>
                                                                <span>📍 {item.formattedDistance}</span>
                                                                <span className="h-[1px] bg-emerald-800/60 flex-1"></span>
                                                            </div>

                                                            {/* Receiver Info */}
                                                            <div className="bg-blue-950/30 p-2.5 rounded-lg border border-blue-900/40">
                                                                <div className="text-gray-400 text-[10px] uppercase font-bold tracking-wider">Receiver Seeking</div>
                                                                <div className="text-white font-bold text-sm">Needs {item.request.required_quantity}x {item.request.request_food_type}</div>
                                                                <div className="text-gray-300 flex items-center justify-between mt-1">
                                                                    <span>🏢 {item.request.NGO?.name}</span>
                                                                    <span className="text-blue-400 font-medium">📍 {item.request.NGO?.city || 'N/A'}</span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <button 
                                                        onClick={() => initiateAssignment(item.donation, item.request.id)}
                                                        className="mt-3.5 w-full py-2 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white rounded-lg font-bold text-xs transition flex items-center justify-center gap-1.5 shadow-md"
                                                    >
                                                        <CheckCircle size={14} /> Quick Pair & Assign Volunteer
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* SIDE-BY-SIDE PLACES & FOOD COMPARISON DUAL DECK */}
                                <div className="grid lg:grid-cols-2 gap-8">
                                    {/* LEFT COLUMN: DONORS OFFERING FOOD */}
                                    <div className="bg-[#111827] p-6 rounded-2xl border border-gray-800 shadow-xl flex flex-col h-full">
                                        <div className="flex items-center justify-between mb-4">
                                            <div className="flex items-center gap-2.5">
                                                <div className="p-2 bg-emerald-950/80 text-emerald-400 rounded-xl border border-emerald-800/40">
                                                    <Package size={20} />
                                                </div>
                                                <div>
                                                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                                                        Donors Offering Food
                                                        <span className="text-xs bg-emerald-900/40 text-emerald-400 px-2 py-0.5 rounded-full border border-emerald-700/50">
                                                            {filteredPendingDonations.length} available
                                                        </span>
                                                    </h3>
                                                    <p className="text-xs text-gray-400">Available food donations with donor pickup places</p>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="space-y-3.5 overflow-y-auto max-h-[600px] pr-1 custom-scrollbar flex-1">
                                            {filteredPendingDonations.map((d) => {
                                                const donorCity = d.Donor?.city || 'Unknown Place';
                                                
                                                // Find candidate NGOs and compute distance
                                                const candidateNGOs = pendingRequests.map(r => ({
                                                    request: r,
                                                    distKm: calculateDistanceKm(donorCity, r.NGO?.city, d.id, r.id)
                                                })).sort((a, b) => (a.distKm || 9999) - (b.distKm || 9999));
                                                
                                                const closestNGO = candidateNGOs[0];

                                                return (
                                                    <div 
                                                        key={d.id} 
                                                        className="bg-[#0f172a] p-4 rounded-xl border border-gray-800 hover:border-emerald-500/60 transition flex flex-col justify-between group"
                                                    >
                                                        <div className="flex items-start justify-between gap-3">
                                                            <div className="flex-1">
                                                                <div className="flex items-center gap-2 flex-wrap">
                                                                    <span className="text-white font-extrabold text-base">{d.food_type}</span>
                                                                    <span className="text-xs bg-emerald-500/20 text-emerald-300 font-bold px-2 py-0.5 rounded-md border border-emerald-500/30">
                                                                        Qty: {d.quantity}
                                                                    </span>
                                                                </div>

                                                                <div className="mt-2 flex items-center gap-1.5 flex-wrap">
                                                                    <span className="inline-flex items-center gap-1 bg-emerald-950/80 text-emerald-400 text-xs font-bold px-2.5 py-1 rounded-lg border border-emerald-800/60">
                                                                        <MapPin size={12} /> {donorCity}
                                                                    </span>
                                                                    {closestNGO && (
                                                                        <span className="text-[11px] bg-emerald-900/50 text-emerald-300 px-2.5 py-1 rounded-lg border border-emerald-600/40 font-bold flex items-center gap-1">
                                                                            📍 {formatDistance(closestNGO.distKm)} to {closestNGO.request.NGO?.name || 'NGO'} ({closestNGO.request.NGO?.city})
                                                                        </span>
                                                                    )}
                                                                </div>

                                                                <div className="mt-2.5 text-xs text-gray-400 flex flex-wrap gap-x-4 gap-y-1">
                                                                    <span>👤 <strong>Donor:</strong> {d.Donor?.name || 'Anonymous'}</span>
                                                                    {d.Donor?.phone && <span>📞 {d.Donor.phone}</span>}
                                                                    <span>📅 {new Date(d.createdAt).toLocaleDateString('en-GB')}</span>
                                                                </div>
                                                            </div>

                                                            <button 
                                                                onClick={() => initiateAssignment(d)} 
                                                                className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl text-xs transition shadow-md shadow-emerald-950 shrink-0 flex items-center gap-1 self-center"
                                                            >
                                                                Match <ArrowRight size={14} />
                                                            </button>
                                                        </div>
                                                    </div>
                                                );
                                            })}

                                            {filteredPendingDonations.length === 0 && (
                                                <div className="text-center py-12 text-gray-500 border border-dashed border-gray-800 rounded-xl">
                                                    <Package size={32} className="mx-auto mb-2 opacity-40" />
                                                    <p className="text-sm font-medium">No pending donations match your filters.</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* RIGHT COLUMN: RECEIVERS (NGOS) SEEKING FOOD */}
                                    <div className="bg-[#111827] p-6 rounded-2xl border border-gray-800 shadow-xl flex flex-col h-full">
                                        <div className="flex items-center justify-between mb-4">
                                            <div className="flex items-center gap-2.5">
                                                <div className="p-2 bg-blue-950/80 text-blue-400 rounded-xl border border-blue-800/40">
                                                    <Building size={20} />
                                                </div>
                                                <div>
                                                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                                                        Receivers Seeking Food
                                                        <span className="text-xs bg-blue-900/40 text-blue-400 px-2 py-0.5 rounded-full border border-blue-700/50">
                                                            {filteredPendingRequests.length} waiting
                                                        </span>
                                                    </h3>
                                                    <p className="text-xs text-gray-400">NGOs & shelter requests with drop-off places</p>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="space-y-3.5 overflow-y-auto max-h-[600px] pr-1 custom-scrollbar flex-1">
                                            {filteredPendingRequests.map((r) => {
                                                const receiverCity = r.NGO?.city || 'Unknown Place';
                                                
                                                // Find candidate Donors and compute distance
                                                const candidateDonors = pendingDonations.map(d => ({
                                                    donation: d,
                                                    distKm: calculateDistanceKm(d.Donor?.city, receiverCity, d.id, r.id)
                                                })).sort((a, b) => (a.distKm || 9999) - (b.distKm || 9999));
                                                
                                                const closestDonor = candidateDonors[0];

                                                return (
                                                    <div 
                                                        key={r.id} 
                                                        className="bg-[#0f172a] p-4 rounded-xl border border-gray-800 hover:border-blue-500/60 transition flex flex-col justify-between group"
                                                    >
                                                        <div className="flex items-start justify-between gap-3">
                                                            <div className="flex-1">
                                                                <div className="flex items-center gap-2 flex-wrap">
                                                                    <span className="text-white font-extrabold text-base">{r.request_food_type}</span>
                                                                    <span className="text-xs bg-blue-500/20 text-blue-300 font-bold px-2 py-0.5 rounded-md border border-blue-500/30">
                                                                        Needed: {r.required_quantity}
                                                                    </span>
                                                                </div>

                                                                <div className="mt-2 flex items-center gap-1.5 flex-wrap">
                                                                    <span className="inline-flex items-center gap-1 bg-blue-950/80 text-blue-400 text-xs font-bold px-2.5 py-1 rounded-lg border border-blue-800/60">
                                                                        <MapPin size={12} /> {receiverCity}
                                                                    </span>
                                                                    {closestDonor && (
                                                                        <span className="text-[11px] bg-blue-900/50 text-blue-300 px-2.5 py-1 rounded-lg border border-blue-600/40 font-bold flex items-center gap-1">
                                                                            📍 {formatDistance(closestDonor.distKm)} from {closestDonor.donation.Donor?.name || 'Donor'} ({closestDonor.donation.Donor?.city})
                                                                        </span>
                                                                    )}
                                                                </div>

                                                                <div className="mt-2.5 text-xs text-gray-400 flex flex-wrap gap-x-4 gap-y-1">
                                                                    <span>🏢 <strong>NGO:</strong> {r.NGO?.name || 'Receiver'}</span>
                                                                    {r.NGO?.phone && <span>📞 {r.NGO.phone}</span>}
                                                                    <span>📅 {new Date(r.createdAt).toLocaleDateString('en-GB')}</span>
                                                                </div>
                                                            </div>

                                                            {pendingDonations.length > 0 && (
                                                                <button 
                                                                    onClick={() => {
                                                                        const match = closestDonor?.donation || pendingDonations[0];
                                                                        initiateAssignment(match, r.id);
                                                                    }}
                                                                    className="px-3.5 py-2 bg-blue-600/80 hover:bg-blue-600 text-white font-bold rounded-xl text-xs transition shadow-md shadow-blue-950 shrink-0 flex items-center gap-1 self-center"
                                                                >
                                                                    Match <ArrowRight size={14} />
                                                                </button>
                                                            )}
                                                        </div>
                                                    </div>
                                                );
                                            })}

                                    {filteredPendingRequests.length === 0 && (
                                        <div className="text-center py-12 text-gray-500 border border-dashed border-gray-800 rounded-xl">
                                            <Building size={32} className="mx-auto mb-2 opacity-40" />
                                            <p className="text-sm font-medium">No pending requests match your filters.</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                            </>
                        )}

                        {/* ACTIVE DELIVERIES ROUTE TRACKER */}
                        <div className="bg-[#111827] p-6 rounded-2xl border border-gray-800 shadow-xl mt-8">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                                <div>
                                    <h3 className="text-xl font-bold text-white flex items-center gap-2">
                                        <Truck className="text-emerald-400" />
                                        Active Volunteer Deliveries & Live Transit Routes
                                    </h3>
                                    <p className="text-xs text-gray-400 mt-0.5">
                                        Tracks all food transport assignments from pickup places to drop-off destinations.
                                    </p>
                                </div>

                                <select
                                    value={delFilter}
                                    onChange={e => setDelFilter(e.target.value)}
                                    className="px-3 py-1.5 bg-[#0f172a] text-gray-300 border border-gray-700 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none text-xs"
                                >
                                    <option value="">All Deliveries ({deliveries.length})</option>
                                    <option value="Pending Pickup">Pending Pickup</option>
                                    <option value="Picked_up">In Transit</option>
                                    <option value="Delivered">Delivered</option>
                                </select>
                            </div>

                            <div className="overflow-x-auto custom-scrollbar">
                                <table className="w-full text-sm text-left">
                                    <thead className="text-xs text-gray-400 bg-gray-800/30 uppercase border-b border-gray-800">
                                        <tr>
                                            <th className="px-3 py-3 font-medium">Route #</th>
                                            <th className="px-4 py-3 font-medium">Pickup (Donor & Place)</th>
                                            <th className="px-4 py-3 font-medium">Drop-off (Receiver & Place)</th>
                                            <th className="px-4 py-3 font-medium">Trip Distance & ETA</th>
                                            <th className="px-4 py-3 font-medium">Food Item</th>
                                            <th className="px-4 py-3 font-medium">Volunteer Assigned</th>
                                            <th className="px-4 py-3 text-right font-medium">Status</th>
                                        </tr>
                                    </thead>

                                    <tbody className="divide-y divide-gray-800/50">
                                        {deliveries.map((del) => {
                                            const donor = del.DonationAssignment?.FoodDonation?.Donor;
                                            const ngo = del.DonationAssignment?.FoodRequest?.NGO;
                                            const food = del.DonationAssignment?.FoodDonation?.food_type;
                                            const qty = del.DonationAssignment?.FoodDonation?.quantity;
                                            const routeDist = (donor?.city && ngo?.city) ? calculateDistanceKm(donor.city, ngo.city, del.id, del.id + 50) : null;
                                            
                                            return (
                                                <tr key={del.id} className="hover:bg-gray-800/20 transition">
                                                    <td className="px-3 py-4 text-gray-400 font-mono text-xs">#{del.id}</td>
                                                    <td className="px-4 py-4 text-gray-200">
                                                        <div className="font-bold text-white">{donor?.name || 'Direct Donor'}</div>
                                                        <div className="text-xs text-emerald-400 font-medium flex items-center gap-1 mt-0.5">
                                                            <MapPin size={12} /> {donor?.city || 'Location N/A'}
                                                        </div>
                                                        {donor?.phone && <div className="text-[11px] text-gray-400 mt-0.5">📞 {donor.phone}</div>}
                                                    </td>

                                                    <td className="px-4 py-4 text-gray-200">
                                                        <div className="font-bold text-white">{ngo?.name || 'Community Direct Drop'}</div>
                                                        <div className="text-xs text-blue-400 font-medium flex items-center gap-1 mt-0.5">
                                                            <MapPin size={12} /> {ngo?.city || 'Location N/A'}
                                                        </div>
                                                        {ngo?.phone && <div className="text-[11px] text-gray-400 mt-0.5">📞 {ngo.phone}</div>}
                                                    </td>

                                                    <td className="px-4 py-4 text-gray-200">
                                                        {routeDist !== null ? (
                                                            <div className="inline-flex flex-col">
                                                                <span className="font-bold text-emerald-400 text-xs">📍 {formatDistance(routeDist)}</span>
                                                                <span className="text-[11px] text-gray-400">⏱ {estimateTransitTime(routeDist)}</span>
                                                            </div>
                                                        ) : (
                                                            <span className="text-gray-500 text-xs">Direct Drop</span>
                                                        )}
                                                    </td>

                                                    <td className="px-4 py-4 text-gray-300">
                                                        <div className="font-semibold text-gray-100">{food}</div>
                                                        <div className="text-xs text-gray-400">Qty: {qty}</div>
                                                    </td>

                                                    <td className="px-4 py-4 text-gray-200">
                                                        <div className="font-semibold text-white">{del.Volunteer?.name}</div>
                                                        {del.Volunteer?.city && (
                                                            <div className="text-xs text-purple-400 flex items-center gap-1 mt-0.5">
                                                                <MapPin size={12} /> {del.Volunteer.city}
                                                            </div>
                                                        )}
                                                        {del.Volunteer?.phone && (
                                                            <div className="text-[11px] text-gray-400">📞 {del.Volunteer.phone}</div>
                                                        )}
                                                    </td>

                                                    <td className="px-4 py-4 text-right">
                                                        {getStatusBadge(
                                                            del.delivery_status === 'Delivered'
                                                                ? 'delivered'
                                                                : del.pickup_status === 'Picked Up'
                                                                    ? 'picked_up'
                                                                    : 'pending'
                                                        )}
                                                    </td>
                                                </tr>
                                            );
                                        })}

                                        {deliveries.length === 0 && (
                                            <tr>
                                                <td colSpan="6" className="text-center py-6 text-gray-500">
                                                    No volunteer deliveries active.
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                );

            case 'donations':
                return (
                    <div className="space-y-6 animate-in fade-in duration-500">
                        <div>
                            <h2 className="text-2xl font-bold text-white">All Platform Donations</h2>
                            <p className="text-sm text-gray-400 mt-1">Complete log of all food items registered by donors</p>
                        </div>

                        <div className="bg-[#111827] p-6 rounded-2xl shadow-sm border border-gray-800">
                            <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 mb-4">
                                <div className="flex flex-wrap gap-2">
                                    <input 
                                        type="text" 
                                        placeholder="Food Type" 
                                        value={donFilters.don_food_type} 
                                        onChange={e => setDonFilters({ ...donFilters, don_food_type: e.target.value })} 
                                        className="w-32 px-3 py-2 bg-[#0f172a] text-white border border-gray-700 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none text-xs" 
                                    />

                                    <input 
                                        type="text" 
                                        placeholder="Donor Name" 
                                        value={donFilters.don_name} 
                                        onChange={e => setDonFilters({ ...donFilters, don_name: e.target.value })} 
                                        className="w-36 px-3 py-2 bg-[#0f172a] text-white border border-gray-700 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none text-xs" 
                                    />

                                    <select 
                                        value={donFilters.don_status} 
                                        onChange={e => setDonFilters({ ...donFilters, don_status: e.target.value })} 
                                        className="w-32 px-3 py-2 bg-[#0f172a] text-gray-300 border border-gray-700 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none text-xs appearance-none"
                                    >
                                        <option value="">All Statuses</option>
                                        <option value="Available">Available</option>
                                        <option value="Assigned">Assigned</option>
                                        <option value="Completed">Completed</option>
                                    </select>
                                </div>
                            </div>

                            <div className="overflow-x-auto custom-scrollbar mt-2">
                                <table className="w-full text-sm text-left">
                                    <thead className="text-xs text-gray-400 bg-gray-800/20 uppercase border-b border-gray-800">
                                        <tr>
                                            <th className="px-4 py-4 font-medium">Food Type</th>
                                            <th className="px-4 py-4 font-medium">Quantity</th>
                                            <th className="px-4 py-4 font-medium">Donor & Place</th>
                                            <th className="px-4 py-4 font-medium">Status</th>
                                            <th className="px-4 py-4 font-medium">Date Registered</th>
                                        </tr>
                                    </thead>

                                    <tbody className="divide-y divide-gray-800/50">
                                        {donations.map((d) => (
                                            <tr key={d.id} className="hover:bg-gray-800/20 transition">
                                                <td className="px-4 py-4 text-gray-200 font-bold">{d.food_type}</td>
                                                <td className="px-4 py-4 text-gray-300">{d.quantity}</td>

                                                <td className="px-4 py-4 text-gray-300">
                                                    <div className="font-semibold text-white">{d.Donor?.name || 'Unknown'}</div>
                                                    <div className="text-xs text-emerald-400 flex items-center gap-1 mt-0.5">
                                                        <MapPin size={12} /> {d.Donor?.city || 'No City Listed'}
                                                    </div>
                                                    {d.Donor?.phone && <div className="text-xs text-gray-500 mt-0.5">📞 {d.Donor.phone}</div>}
                                                </td>

                                                <td className="px-4 py-4">{getStatusBadge(d.status)}</td>
                                                <td className="px-4 py-4 text-gray-400">{new Date(d.createdAt).toLocaleDateString('en-GB')}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                );

            case 'requests':
                return (
                    <div className="space-y-6 animate-in fade-in duration-500">
                        <div>
                            <h2 className="text-2xl font-bold text-white">All Food Requests</h2>
                            <p className="text-sm text-gray-400 mt-1">Complete list of all food requirements submitted by NGOs</p>
                        </div>

                        <div className="bg-[#111827] p-6 rounded-2xl shadow-sm border border-gray-800">
                            <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 mb-4">
                                <div className="flex flex-wrap gap-2">
                                    <input 
                                        type="text" 
                                        placeholder="Food Type" 
                                        value={reqFilters.req_food_type} 
                                        onChange={e => setReqFilters({ ...reqFilters, req_food_type: e.target.value })} 
                                        className="w-32 px-3 py-2 bg-[#0f172a] text-white border border-gray-700 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none text-xs" 
                                    />

                                    <input 
                                        type="text" 
                                        placeholder="NGO Name" 
                                        value={reqFilters.req_name} 
                                        onChange={e => setReqFilters({ ...reqFilters, req_name: e.target.value })} 
                                        className="w-36 px-3 py-2 bg-[#0f172a] text-white border border-gray-700 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none text-xs" 
                                    />

                                    <select 
                                        value={reqFilters.req_status} 
                                        onChange={e => setReqFilters({ ...reqFilters, req_status: e.target.value })} 
                                        className="w-32 px-3 py-2 bg-[#0f172a] text-gray-300 border border-gray-700 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none text-xs appearance-none"
                                    >
                                        <option value="">All Statuses</option>
                                        <option value="Pending">Pending</option>
                                        <option value="Assigned">Assigned</option>
                                        <option value="Fulfilled">Fulfilled</option>
                                    </select>
                                </div>
                            </div>

                            <div className="overflow-x-auto custom-scrollbar mt-2">
                                <table className="w-full text-sm text-left">
                                    <thead className="text-xs text-gray-400 bg-gray-800/20 uppercase border-b border-gray-800">
                                        <tr>
                                            <th className="px-4 py-4 font-medium">Food Type Requested</th>
                                            <th className="px-4 py-4 font-medium">Quantity Needed</th>
                                            <th className="px-4 py-4 font-medium">NGO & Place</th>
                                            <th className="px-4 py-4 font-medium">Status</th>
                                            <th className="px-4 py-4 font-medium">Date Requested</th>
                                        </tr>
                                    </thead>

                                    <tbody className="divide-y divide-gray-800/50">
                                        {requests.map((r) => (
                                            <tr key={r.id} className="hover:bg-gray-800/20 transition">
                                                <td className="px-4 py-4 text-gray-200 font-bold">{r.request_food_type}</td>
                                                <td className="px-4 py-4 text-gray-300">{r.required_quantity}</td>

                                                <td className="px-4 py-4 text-gray-300">
                                                    <div className="font-semibold text-white">{r.NGO?.name || 'Unknown'}</div>
                                                    <div className="text-xs text-blue-400 flex items-center gap-1 mt-0.5">
                                                        <MapPin size={12} /> {r.NGO?.city || 'No City Listed'}
                                                    </div>
                                                    {r.NGO?.phone && <div className="text-xs text-gray-500 mt-0.5">📞 {r.NGO.phone}</div>}
                                                </td>

                                                <td className="px-4 py-4">{getStatusBadge(r.status)}</td>
                                                <td className="px-4 py-4 text-gray-400">{new Date(r.createdAt).toLocaleDateString('en-GB')}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                );

            case 'users':
                return (
                    <div className="space-y-6 animate-in fade-in duration-500">
                        <div>
                            <h2 className="text-2xl font-bold text-white">Platform User Directory</h2>
                            <p className="text-sm text-gray-400 mt-1">Manage all registered accounts categorized by user role</p>
                        </div>

                        {/* Donors */}
                        <div className="bg-[#111827] p-6 rounded-2xl shadow-sm border border-gray-800">
                            <h3 className="text-lg font-bold text-white flex gap-2 items-center mb-1">
                                <Users size={18} className="text-emerald-400" /> Donors ({users.donors.length})
                            </h3>
                            <p className="text-xs text-gray-500 mb-4">All registered food donors</p>

                            <div className="overflow-x-auto custom-scrollbar">
                                <table className="w-full text-sm text-left">
                                    <thead className="text-xs text-gray-400 bg-gray-800/20 uppercase border-b border-gray-800">
                                        <tr>
                                            <th className="px-4 py-3 font-medium">Name</th>
                                            <th className="px-4 py-3 font-medium">Email</th>
                                            <th className="px-4 py-3 font-medium">Phone</th>
                                            <th className="px-4 py-3 font-medium">Place / City</th>
                                            <th className="px-4 py-3 font-medium">Joined Date</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-800/50">
                                        {users.donors.map(u => (
                                            <tr key={u.id} className="hover:bg-gray-800/20 transition">
                                                <td className="px-4 py-3 text-gray-200 font-medium">{u.name}</td>
                                                <td className="px-4 py-3 text-gray-400">{u.email}</td>
                                                <td className="px-4 py-3 text-gray-400">{u.phone || '-'}</td>
                                                <td className="px-4 py-3 text-emerald-400 font-semibold">{u.city || '-'}</td>
                                                <td className="px-4 py-3 text-gray-400">{new Date(u.createdAt).toLocaleDateString('en-GB')}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* NGOs */}
                        <div className="bg-[#111827] p-6 rounded-2xl shadow-sm border border-gray-800">
                            <h3 className="text-lg font-bold text-white flex gap-2 items-center mb-1">
                                <Building size={18} className="text-blue-400" /> NGOs & Receivers ({users.ngos.length})
                            </h3>
                            <p className="text-xs text-gray-500 mb-4">All registered NGO partner accounts</p>

                            <div className="overflow-x-auto custom-scrollbar">
                                <table className="w-full text-sm text-left">
                                    <thead className="text-xs text-gray-400 bg-gray-800/20 uppercase border-b border-gray-800">
                                        <tr>
                                            <th className="px-4 py-3 font-medium">Name</th>
                                            <th className="px-4 py-3 font-medium">Email</th>
                                            <th className="px-4 py-3 font-medium">Phone</th>
                                            <th className="px-4 py-3 font-medium">Place / City</th>
                                            <th className="px-4 py-3 font-medium">Joined Date</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-800/50">
                                        {users.ngos.map(u => (
                                            <tr key={u.id} className="hover:bg-gray-800/20 transition">
                                                <td className="px-4 py-3 text-gray-200 font-medium">{u.name}</td>
                                                <td className="px-4 py-3 text-gray-400">{u.email}</td>
                                                <td className="px-4 py-3 text-gray-400">{u.phone || '-'}</td>
                                                <td className="px-4 py-3 text-blue-400 font-semibold">{u.city || '-'}</td>
                                                <td className="px-4 py-3 text-gray-400">{new Date(u.createdAt).toLocaleDateString('en-GB')}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Volunteers */}
                        <div className="bg-[#111827] p-6 rounded-2xl shadow-sm border border-gray-800">
                            <h3 className="text-lg font-bold text-white flex gap-2 items-center mb-1">
                                <UserCog size={18} className="text-purple-400" /> Volunteers ({users.volunteers.length})
                            </h3>
                            <p className="text-xs text-gray-500 mb-4">All active delivery volunteers</p>

                            <div className="overflow-x-auto custom-scrollbar">
                                <table className="w-full text-sm text-left">
                                    <thead className="text-xs text-gray-400 bg-gray-800/20 uppercase border-b border-gray-800">
                                        <tr>
                                            <th className="px-4 py-3 font-medium">Name</th>
                                            <th className="px-4 py-3 font-medium">Email</th>
                                            <th className="px-4 py-3 font-medium">Phone</th>
                                            <th className="px-4 py-3 font-medium">Place / City</th>
                                            <th className="px-4 py-3 font-medium">Joined Date</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-800/50">
                                        {users.volunteers.map(u => (
                                            <tr key={u.id} className="hover:bg-gray-800/20 transition">
                                                <td className="px-4 py-3 text-gray-200 font-medium">{u.name}</td>
                                                <td className="px-4 py-3 text-gray-400">{u.email}</td>
                                                <td className="px-4 py-3 text-gray-400">{u.phone || '-'}</td>
                                                <td className="px-4 py-4 text-purple-400 font-semibold">{u.city || '-'}</td>
                                                <td className="px-4 py-3 text-gray-400">{new Date(u.createdAt).toLocaleDateString('en-GB')}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                );

            default:
                return null;
        }
    };

    return (
        <div className="flex w-full min-h-[calc(100vh-64px)] bg-[#0a0f1c]">
            {/* Sidebar Navigation */}
            <div className="w-64 bg-[#111827] border-r border-gray-800 flex flex-col hidden md:flex shrink-0 min-h-full sticky top-0 overflow-y-auto pt-6">
                <div className="px-6 mb-6">
                    <div className="flex items-center gap-2.5 text-emerald-400 font-bold text-sm">
                        <ShieldCheck size={20} />
                        <span>Admin Console</span>
                    </div>
                    <div className="text-[11px] text-gray-500 mt-1">Single Administrator Mode</div>
                </div>

                <nav className="flex-1 px-4 space-y-2">
                    <button 
                        onClick={() => setActiveTab('dashboard')} 
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition ${activeTab === 'dashboard' ? 'bg-emerald-500/10 text-emerald-400 font-bold border border-emerald-500/20' : 'text-gray-400 hover:bg-gray-800/60 hover:text-white'}`}
                    >
                        <LayoutDashboard size={18} />
                        <span className="text-sm">Dashboard</span>
                    </button>

                    <button 
                        onClick={() => setActiveTab('map')} 
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition ${activeTab === 'map' ? 'bg-emerald-500/10 text-emerald-400 font-bold border border-emerald-500/20' : 'text-gray-400 hover:bg-gray-800/60 hover:text-white'}`}
                    >
                        <MapIcon size={18} />
                        <span className="text-sm">Live Geographic Map</span>
                    </button>

                    <button 
                        onClick={() => setActiveTab('assignments')} 
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition ${activeTab === 'assignments' ? 'bg-emerald-500/10 text-emerald-400 font-bold border border-emerald-500/20' : 'text-gray-400 hover:bg-gray-800/60 hover:text-white'}`}
                    >
                        <MapPin size={18} />
                        <span className="text-sm">Nearby Matching Hub</span>
                    </button>

                    <button 
                        onClick={() => setActiveTab('donations')} 
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition ${activeTab === 'donations' ? 'bg-emerald-500/10 text-emerald-400 font-bold border border-emerald-500/20' : 'text-gray-400 hover:bg-gray-800/60 hover:text-white'}`}
                    >
                        <Package size={18} />
                        <span className="text-sm">All Donations</span>
                    </button>

                    <button 
                        onClick={() => setActiveTab('requests')} 
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition ${activeTab === 'requests' ? 'bg-emerald-500/10 text-emerald-400 font-bold border border-emerald-500/20' : 'text-gray-400 hover:bg-gray-800/60 hover:text-white'}`}
                    >
                        <ClipboardList size={18} />
                        <span className="text-sm">All Requests</span>
                    </button>

                    <button 
                        onClick={() => setActiveTab('users')} 
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition ${activeTab === 'users' ? 'bg-emerald-500/10 text-emerald-400 font-bold border border-emerald-500/20' : 'text-gray-400 hover:bg-gray-800/60 hover:text-white'}`}
                    >
                        <Users size={18} />
                        <span className="text-sm">User Management</span>
                    </button>
                </nav>
            </div>

            {/* Main Content Pane */}
            <div className="flex-1 min-w-0 overflow-y-auto p-4 sm:p-6 lg:p-10 space-y-8 bg-[#0a0f1c]">
                {renderTabContent()}

                {/* SIDE-BY-SIDE MATCH & ASSIGN VOLUNTEER MODAL */}
                {selectedDonation && (
                    <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
                        <div className="bg-[#111827] border border-gray-700 rounded-3xl shadow-2xl p-6 md:p-8 w-full max-w-2xl max-h-[90vh] overflow-y-auto custom-scrollbar">
                            <div className="flex items-center justify-between pb-4 border-b border-gray-800 mb-6">
                                <div className="flex items-center gap-3">
                                    <div className="p-2.5 bg-gradient-to-br from-emerald-500 to-teal-600 text-white rounded-2xl shadow-md">
                                        <Sparkles size={22} />
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-bold text-white tracking-tight">Match & Dispatch Delivery</h3>
                                        <p className="text-xs text-gray-400">Pair nearby food donation with an NGO request & assign a volunteer</p>
                                    </div>
                                </div>
                                <button 
                                    onClick={() => setSelectedDonation(null)}
                                    className="text-gray-400 hover:text-white p-2 rounded-xl hover:bg-gray-800 transition"
                                >
                                    ✕
                                </button>
                            </div>

                            {/* SIDE-BY-SIDE PREVIEW CARDS */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                                {/* Donor Card */}
                                <div className="bg-[#0f172a] p-4 rounded-2xl border border-emerald-700/40">
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-[10px] font-extrabold uppercase text-emerald-400 tracking-wider">Pickup (Donor)</span>
                                        <span className="text-xs bg-emerald-950 text-emerald-300 font-bold px-2 py-0.5 rounded-full border border-emerald-800">
                                            {selectedDonation.quantity} Units
                                        </span>
                                    </div>
                                    <div className="text-base font-extrabold text-white">{selectedDonation.food_type}</div>
                                    <div className="mt-3 space-y-1 text-xs text-gray-300">
                                        <div className="font-semibold text-white">👤 {selectedDonation.Donor?.name}</div>
                                        <div className="text-emerald-400 font-bold flex items-center gap-1">
                                            <MapPin size={13} /> {selectedDonation.Donor?.city || 'No city specified'}
                                        </div>
                                        {selectedDonation.Donor?.phone && (
                                            <div className="text-gray-400">📞 {selectedDonation.Donor.phone}</div>
                                        )}
                                    </div>
                                </div>

                                {/* Receiver / NGO Card */}
                                <div className="bg-[#0f172a] p-4 rounded-2xl border border-blue-700/40">
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-[10px] font-extrabold uppercase text-blue-400 tracking-wider">Drop-off (Receiver)</span>
                                        {activeSelectedRequest ? (
                                            <span className="text-xs bg-blue-950 text-blue-300 font-bold px-2 py-0.5 rounded-full border border-blue-800">
                                                Needs: {activeSelectedRequest.required_quantity}
                                            </span>
                                        ) : (
                                            <span className="text-xs text-gray-400">Direct Delivery</span>
                                        )}
                                    </div>

                                    {activeSelectedRequest ? (
                                        <>
                                            <div className="text-base font-extrabold text-white">{activeSelectedRequest.request_food_type}</div>
                                            <div className="mt-3 space-y-1 text-xs text-gray-300">
                                                <div className="font-semibold text-white">🏢 {activeSelectedRequest.NGO?.name}</div>
                                                <div className="text-blue-400 font-bold flex items-center gap-1">
                                                    <MapPin size={13} /> {activeSelectedRequest.NGO?.city || 'No city specified'}
                                                </div>
                                                {activeSelectedRequest.NGO?.phone && (
                                                    <div className="text-gray-400">📞 {activeSelectedRequest.NGO.phone}</div>
                                                )}
                                            </div>
                                        </>
                                    ) : (
                                        <div className="py-3 text-xs text-gray-400">
                                            No specific NGO selected. Food will be delivered directly to the community or volunteer hub.
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Live Route Distance & Proximity Banner */}
                            {activeSelectedRequest && selectedDonation.Donor?.city && activeSelectedRequest.NGO?.city && (() => {
                                const modalDist = calculateDistanceKm(
                                    selectedDonation.Donor.city,
                                    activeSelectedRequest.NGO.city,
                                    selectedDonation.id,
                                    activeSelectedRequest.id
                                );
                                return (
                                    <div className="mb-6 p-4 bg-gradient-to-r from-emerald-950/80 via-slate-900 to-blue-950/80 border border-emerald-500/40 rounded-2xl flex flex-wrap items-center justify-between gap-3 text-xs shadow-lg">
                                        <div className="flex items-center gap-2.5">
                                            <div className="p-2 bg-emerald-500/20 text-emerald-400 rounded-xl">
                                                <Navigation size={18} />
                                            </div>
                                            <div>
                                                <div className="text-white font-extrabold text-sm">
                                                    Trip Distance: {formatDistance(modalDist)}
                                                </div>
                                                <div className="text-gray-400 text-[11px]">
                                                    Route from <strong>{selectedDonation.Donor.city}</strong> (Pickup) to <strong>{activeSelectedRequest.NGO.city}</strong> (Drop-off)
                                                </div>
                                            </div>
                                        </div>
                                        <div className="bg-emerald-900/60 text-emerald-300 font-bold px-3 py-1.5 rounded-xl border border-emerald-500/40 flex items-center gap-1.5">
                                            <span>⏱ Est. Travel Time:</span>
                                            <strong className="text-white">{estimateTransitTime(modalDist)}</strong>
                                        </div>
                                    </div>
                                );
                            })()}

                            {/* ASSIGNMENT FORM */}
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-300 mb-1.5">
                                        Select Receiver Request (Optional Match)
                                    </label>
                                    <select
                                        className="w-full px-4 py-3 bg-[#0f172a] text-white border border-gray-700 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none text-sm"
                                        value={assignmentForm.request_id}
                                        onChange={(e) => setAssignmentForm({ ...assignmentForm, request_id: e.target.value })}
                                    >
                                        <option value="">No specific request (Direct Community Drop)</option>
                                        {pendingRequests.map(r => {
                                            const reqDist = calculateDistanceKm(
                                                selectedDonation.Donor?.city,
                                                r.NGO?.city,
                                                selectedDonation.id,
                                                r.id
                                            );
                                            return (
                                                <option key={r.id} value={r.id}>
                                                    📍 [{formatDistance(reqDist)}] {r.NGO?.name} ({r.NGO?.city || 'Place N/A'}) — Needs {r.required_quantity}x {r.request_food_type}
                                                </option>
                                            );
                                        })}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-300 mb-1.5">
                                        Assign Delivery Volunteer (Required)
                                    </label>
                                    <select
                                        className="w-full px-4 py-3 bg-[#0f172a] text-white border border-gray-700 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none text-sm"
                                        value={assignmentForm.volunteer_id}
                                        onChange={(e) => setAssignmentForm({ ...assignmentForm, volunteer_id: e.target.value })}
                                    >
                                        <option value="">-- Choose an Available Volunteer --</option>
                                        {volunteers.map(v => {
                                            const volDist = calculateDistanceKm(
                                                selectedDonation.Donor?.city,
                                                v.city,
                                                selectedDonation.id,
                                                v.id
                                            );
                                            return (
                                                <option key={v.id} value={v.id}>
                                                    ⚡ [{formatDistance(volDist)} from pickup] {v.name} {v.city ? `(📍 ${v.city})` : ''} {v.phone ? `— 📞 ${v.phone}` : ''}
                                                </option>
                                            );
                                        })}
                                    </select>
                                </div>
                            </div>

                            {/* Modal Actions */}
                            <div className="mt-8 pt-4 border-t border-gray-800 flex gap-3 justify-end">
                                <button
                                    onClick={() => setSelectedDonation(null)}
                                    className="px-5 py-2.5 text-gray-400 hover:text-white hover:bg-gray-800 rounded-xl font-semibold transition text-sm"
                                >
                                    Cancel
                                </button>

                                <button
                                    onClick={submitAssignment}
                                    className="px-6 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white rounded-xl font-bold transition shadow-lg shadow-emerald-950 text-sm flex items-center gap-2"
                                >
                                    <CheckCircle2 size={16} /> Confirm & Dispatch Volunteer
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AdminView;