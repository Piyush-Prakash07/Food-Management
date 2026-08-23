import React, { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-toastify';
import { LayoutDashboard, Users, CheckCircle, Package, ClipboardList, UserCog } from 'lucide-react';
import api from '../../api/axios';

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

            setDonations(dashRes.data.donations);
            setPendingDonations(dashRes.data.pendingDonations || []);
            setRequests(dashRes.data.requests);
            setPendingRequests(dashRes.data.pendingRequests || []);
            setVolunteers(dashRes.data.volunteers);

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

    const initiateAssignment = (donation) => {
        setSelectedDonation(donation);
        setAssignmentForm({ request_id: '', volunteer_id: '' });
    };

    const submitAssignment = async () => {
        if (!assignmentForm.volunteer_id) {
            return toast.error("Please select a volunteer");
        }

        try {
            await api.post('/api/admin/assign', {
                donation_id: selectedDonation.id,
                volunteer_id: assignmentForm.volunteer_id,
                request_id: assignmentForm.request_id || null
            });

            const updatedDonations = donations.map(d =>
                d.id === selectedDonation.id ? { ...d, status: 'Assigned' } : d
            );

            setDonations(updatedDonations);

            toast.success('Donation assigned successfully!');

            setSelectedDonation(null);

            fetchDashboardData();
        } catch {
            toast.error('Failed to assign volunteer');
        }
    };

    const getStatusBadge = (status) => {
        switch (status?.toLowerCase()) {
            case 'pending':
                return <span className="bg-yellow-900/30 text-yellow-500 text-xs px-2.5 py-1 rounded-full font-semibold border border-yellow-700/50">pending</span>;

            case 'delivered':
                return <span className="bg-emerald-900/30 text-emerald-400 text-xs px-2.5 py-1 rounded-full font-semibold border border-emerald-700/50">delivered</span>;

            case 'picked up':
            case 'picked_up':
                return <span className="bg-purple-900/30 text-purple-400 text-xs px-2.5 py-1 rounded-full font-semibold border border-purple-700/50">picked_up</span>;

            case 'assigned':
            case 'matched':
                return (
                    <span className="bg-blue-900/30 text-blue-400 text-xs px-2.5 py-1 rounded-full font-semibold border border-blue-700/50">
                        {status.toLowerCase()}
                    </span>
                );

            case 'fulfilled':
                return <span className="bg-emerald-900/30 text-emerald-400 text-xs px-2.5 py-1 rounded-full font-semibold border border-emerald-700/50">fulfilled</span>;

            case 'available':
                return <span className="bg-emerald-900/30 text-emerald-400 text-xs px-2.5 py-1 rounded-full font-semibold border border-emerald-700/50">open</span>;

            default:
                return (
                    <span className="bg-gray-800 text-gray-400 text-xs px-2.5 py-1 rounded-full font-semibold border border-gray-700/50">
                        {status?.toLowerCase() || 'unknown'}
                    </span>
                );
        }
    };

    const renderTabContent = () => {
        switch (activeTab) {
            case 'dashboard':
                return (
                    <div className="space-y-8 animate-in fade-in duration-500">
                        <div className="mb-2">
                            <h2 className="text-3xl font-bold text-white tracking-tight">Admin Dashboard</h2>
                            <p className="text-gray-400 mt-1">Welcome back, Admin!</p>
                        </div>

                        <div className="grid lg:grid-cols-4 gap-6">
                            <div className="p-6 bg-[#111827] rounded-2xl shadow-sm border border-gray-800 flex flex-col relative overflow-hidden group">
                                <Users size={20} className="text-gray-500 absolute top-6 right-6" />
                                <div className="text-gray-400 font-bold text-sm mb-2">Total Donors</div>
                                <div className="text-4xl font-extrabold text-white mb-2">{stats.donorsCount}</div>
                                <div className="text-gray-500 text-xs">Registered donors</div>
                            </div>

                            <div className="p-6 bg-[#111827] rounded-2xl shadow-sm border border-gray-800 flex flex-col relative overflow-hidden group">
                                <Users size={20} className="text-gray-500 absolute top-6 right-6" />
                                <div className="text-gray-400 font-bold text-sm mb-2">Total NGOs</div>
                                <div className="text-4xl font-extrabold text-white mb-2">{stats.ngosCount}</div>
                                <div className="text-gray-500 text-xs">Registered NGOs</div>
                            </div>

                            <div className="p-6 bg-[#111827] rounded-2xl shadow-sm border border-gray-800 flex flex-col relative overflow-hidden group">
                                <UserCog size={20} className="text-gray-500 absolute top-6 right-6" />
                                <div className="text-gray-400 font-bold text-sm mb-2">Volunteers</div>
                                <div className="text-4xl font-extrabold text-white mb-2">{stats.volunteersCount}</div>
                                <div className="text-gray-500 text-xs">Active volunteers</div>
                            </div>

                            <div className="p-6 bg-[#111827] rounded-2xl shadow-sm border border-gray-800 flex flex-col relative overflow-hidden group">
                                <Package size={20} className="text-gray-500 absolute top-6 right-6" />
                                <div className="text-gray-400 font-bold text-sm mb-2">Total Donations</div>
                                <div className="text-4xl font-extrabold text-white mb-2">{donations.length}</div>
                                <div className="text-gray-500 text-xs">Lifetime donations</div>
                            </div>
                        </div>

                        <div className="grid lg:grid-cols-3 gap-6">
                            <div className="p-6 bg-[#111827] rounded-2xl shadow-sm border border-gray-800 flex flex-col justify-between h-full">
                                <div>
                                    <h3 className="text-xl font-bold text-white mb-2">Manage Assignments</h3>
                                    <p className="text-sm text-gray-400">Match donations with requests</p>
                                </div>
                                <button onClick={() => setActiveTab('assignments')} className="mt-6 w-full py-2.5 bg-[#10b981] hover:bg-[#059669] text-white rounded-lg font-semibold transition text-sm flex items-center justify-center gap-2">
                                    Open
                                </button>
                            </div>

                            <div className="p-6 bg-[#111827] rounded-2xl shadow-sm border border-gray-800 flex flex-col justify-between h-full">
                                <div>
                                    <h3 className="text-xl font-bold text-white mb-2">User Management</h3>
                                    <p className="text-sm text-gray-400">View and manage all users</p>
                                </div>
                                <button onClick={() => setActiveTab('users')} className="mt-6 w-full py-2.5 bg-[#10b981] hover:bg-[#059669] text-white rounded-lg font-semibold transition text-sm flex items-center justify-center gap-2">
                                    <Users size={16} /> View Users
                                </button>
                            </div>

                            <div className="p-6 bg-[#111827] rounded-2xl shadow-sm border border-gray-800 flex flex-col justify-between h-full">
                                <div>
                                    <h3 className="text-xl font-bold text-white mb-2">All Donations</h3>
                                    <p className="text-sm text-gray-400">View all food donations</p>
                                </div>
                                <button onClick={() => setActiveTab('donations')} className="mt-6 w-full py-2.5 bg-gray-800 hover:bg-gray-700 text-white rounded-lg font-semibold transition border border-gray-700 text-sm">
                                    View All
                                </button>
                            </div>
                        </div>
                    </div>
                );

            case 'donations':
                return (
                    <div className="space-y-6 animate-in fade-in duration-500">
                        <div>
                            <h2 className="text-2xl font-bold text-white">All Donations</h2>
                            <p className="text-sm text-gray-400 mt-1">View all food donations in the system</p>
                        </div>

                        <div className="bg-[#111827] p-6 rounded-2xl shadow-sm border border-gray-800">
                            <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 mb-4">
                                <div>
                                    <h3 className="text-lg font-bold text-white mb-1">All Donations</h3>
                                    <p className="text-sm text-gray-500">Complete list of all food donations</p>
                                </div>

                                <div className="flex flex-wrap gap-2">
                                    <input type="text" placeholder="Food Type" value={donFilters.don_food_type} onChange={e => setDonFilters({ ...donFilters, don_food_type: e.target.value })} className="w-28 px-3 py-2 bg-[#0f172a] text-white border border-gray-700 rounded-lg focus:ring-2 focus:ring-[#10b981]/20 outline-none text-xs" />

                                    <input type="text" placeholder="Donor Name" value={donFilters.don_name} onChange={e => setDonFilters({ ...donFilters, don_name: e.target.value })} className="w-32 px-3 py-2 bg-[#0f172a] text-white border border-gray-700 rounded-lg focus:ring-2 focus:ring-[#10b981]/20 outline-none text-xs" />

                                    <select value={donFilters.don_status} onChange={e => setDonFilters({ ...donFilters, don_status: e.target.value })} className="w-28 px-3 py-2 bg-[#0f172a] text-gray-300 border border-gray-700 rounded-lg focus:ring-2 focus:ring-[#10b981]/20 outline-none text-xs appearance-none">
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
                                            <th className="px-4 py-4 font-medium">Donor</th>
                                            <th className="px-4 py-4 font-medium">Status</th>
                                            <th className="px-4 py-4 font-medium">Date</th>
                                        </tr>
                                    </thead>

                                    <tbody className="divide-y divide-gray-800/50">
                                        {donations.map((d) => (
                                            <tr key={d.id} className="hover:bg-gray-800/20 transition">
                                                <td className="px-4 py-4 text-gray-200">{d.food_type}</td>
                                                <td className="px-4 py-4 text-gray-300">{d.quantity}</td>

                                                <td className="px-4 py-4 text-gray-300">
                                                    <div className="font-medium">{d.Donor?.name || 'Unknown'}</div>

                                                    {(d.Donor?.phone || d.Donor?.city) && (
                                                        <div className="text-xs text-gray-500 mt-1 flex flex-col gap-0.5">
                                                            {d.Donor?.phone && <span>📞 {d.Donor.phone}</span>}
                                                            {d.Donor?.city && <span>📍 {d.Donor.city}</span>}
                                                        </div>
                                                    )}
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
                            <h2 className="text-2xl font-bold text-white">All Requests</h2>
                            <p className="text-sm text-gray-400 mt-1">View all food requests in the system</p>
                        </div>

                        <div className="bg-[#111827] p-6 rounded-2xl shadow-sm border border-gray-800">
                            <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 mb-4">
                                <div>
                                    <h3 className="text-lg font-bold text-white mb-1">All Requests</h3>
                                    <p className="text-sm text-gray-500">Complete list of all food requests</p>
                                </div>

                                <div className="flex flex-wrap gap-2">
                                    <input type="text" placeholder="Food Type" value={reqFilters.req_food_type} onChange={e => setReqFilters({ ...reqFilters, req_food_type: e.target.value })} className="w-28 px-3 py-2 bg-[#0f172a] text-white border border-gray-700 rounded-lg focus:ring-2 focus:ring-[#10b981]/20 outline-none text-xs" />

                                    <input type="text" placeholder="NGO Name" value={reqFilters.req_name} onChange={e => setReqFilters({ ...reqFilters, req_name: e.target.value })} className="w-32 px-3 py-2 bg-[#0f172a] text-white border border-gray-700 rounded-lg focus:ring-2 focus:ring-[#10b981]/20 outline-none text-xs" />

                                    <select value={reqFilters.req_status} onChange={e => setReqFilters({ ...reqFilters, req_status: e.target.value })} className="w-28 px-3 py-2 bg-[#0f172a] text-gray-300 border border-gray-700 rounded-lg focus:ring-2 focus:ring-[#10b981]/20 outline-none text-xs appearance-none">
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
                                            <th className="px-4 py-4 font-medium">Food Type</th>
                                            <th className="px-4 py-4 font-medium">Quantity</th>
                                            <th className="px-4 py-4 font-medium">NGO</th>
                                            <th className="px-4 py-4 font-medium">Status</th>
                                            <th className="px-4 py-4 font-medium">Date</th>
                                        </tr>
                                    </thead>

                                    <tbody className="divide-y divide-gray-800/50">
                                        {requests.map((r) => (
                                            <tr key={r.id} className="hover:bg-gray-800/20 transition">
                                                <td className="px-4 py-4 text-gray-200">{r.request_food_type}</td>
                                                <td className="px-4 py-4 text-gray-300">{r.required_quantity}</td>

                                                <td className="px-4 py-4 text-gray-300">
                                                    <div className="font-medium">{r.NGO?.name || 'Unknown'}</div>

                                                    {(r.NGO?.phone || r.NGO?.city) && (
                                                        <div className="text-xs text-gray-500 mt-1 flex flex-col gap-0.5">
                                                            {r.NGO?.phone && <span>📞 {r.NGO.phone}</span>}
                                                            {r.NGO?.city && <span>📍 {r.NGO.city}</span>}
                                                        </div>
                                                    )}
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

            case 'assignments':
                return (
                    <div className="space-y-6 animate-in fade-in duration-500">
                        <div>
                            <h2 className="text-2xl font-bold text-white">Manage Assignments</h2>
                        </div>

                        <div className="grid lg:grid-cols-2 gap-8">
                            <div className="bg-[#111827] p-6 rounded-2xl shadow-sm border border-gray-800">
                                <h3 className="text-lg font-bold text-white mb-6">Available Donations</h3>

                                <div className="overflow-x-auto custom-scrollbar">
                                    <table className="w-full text-sm text-left">
                                        <thead className="text-xs text-gray-400 uppercase border-b border-gray-800">
                                            <tr>
                                                <th className="px-2 py-3 font-medium">Food Item</th>
                                                <th className="px-2 py-3 font-medium">Qty</th>
                                                <th className="px-2 py-3 font-medium">Donor</th>
                                                <th className="px-2 py-3 text-right font-medium">Action</th>
                                            </tr>
                                        </thead>

                                        <tbody className="divide-y divide-gray-800">
                                            {pendingDonations.map((d) => (
                                                <tr key={d.id} className="hover:bg-gray-800/30 transition">
                                                    <td className="px-2 py-3.5 text-gray-200">{d.food_type}</td>
                                                    <td className="px-2 py-3.5 text-gray-400">{d.quantity}</td>

                                                    <td className="px-2 py-3.5 text-gray-400">
                                                        <div className="font-medium text-gray-300">{d.Donor?.name || 'Unknown'}</div>

                                                        {(d.Donor?.phone || d.Donor?.city) && (
                                                            <div className="text-xs text-gray-500 mt-1 flex flex-col gap-0.5">
                                                                {d.Donor?.phone && <span>📞 {d.Donor.phone}</span>}
                                                                {d.Donor?.city && <span>📍 {d.Donor.city}</span>}
                                                            </div>
                                                        )}
                                                    </td>

                                                    <td className="px-2 py-3.5 text-right">
                                                        <button onClick={() => initiateAssignment(d)} className="bg-[#10b981] text-white hover:bg-[#059669] font-semibold px-3 py-1.5 rounded-lg transition text-xs">
                                                            Assign
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}

                                            {pendingDonations.length === 0 && (
                                                <tr>
                                                    <td colSpan="4" className="text-center py-4 text-gray-500">
                                                        No pending donations to assign.
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            <div className="bg-[#111827] p-6 rounded-2xl shadow-sm border border-gray-800">
                                <div className="flex justify-between items-center mb-6">
                                    <h3 className="text-lg font-bold text-white">Active Volunteer Deliveries</h3>

                                    <select
                                        value={delFilter}
                                        onChange={e => setDelFilter(e.target.value)}
                                        className="px-3 py-1.5 bg-[#0f172a] text-gray-300 border border-gray-700 rounded-lg focus:ring-2 focus:ring-[#10b981]/20 outline-none text-xs appearance-none"
                                    >
                                        <option value="">All Deliveries</option>
                                        <option value="Pending Pickup">Pending Pickup</option>
                                        <option value="Picked_up">In Transit</option>
                                        <option value="Delivered">Delivered</option>
                                    </select>
                                </div>

                                <div className="overflow-x-auto custom-scrollbar">
                                    <table className="w-full text-sm text-left">
                                        <thead className="text-xs text-gray-400 uppercase border-b border-gray-800">
                                            <tr>
                                                <th className="px-2 py-3 font-medium">ID</th>
                                                <th className="px-2 py-3 font-medium">Volunteer</th>
                                                <th className="px-2 py-3 font-medium">Item</th>
                                                <th className="px-2 py-3 text-right font-medium">Status</th>
                                            </tr>
                                        </thead>

                                        <tbody className="divide-y divide-gray-800">
                                            {deliveries.map((del) => (
                                                <tr key={del.id} className="hover:bg-gray-800/30 transition">
                                                    <td className="px-2 py-3.5 text-gray-400">#{del.id}</td>
                                                    <td className="px-2 py-3.5 text-gray-200">{del.Volunteer?.name}</td>
                                                    <td className="px-2 py-3.5 text-gray-300">{del.DonationAssignment?.FoodDonation?.food_type}</td>

                                                    <td className="px-2 py-3.5 text-right">
                                                        {getStatusBadge(
                                                            del.delivery_status === 'Delivered'
                                                                ? 'delivered'
                                                                : del.pickup_status === 'Picked Up'
                                                                    ? 'picked_up'
                                                                    : 'pending'
                                                        )}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    </div>
                );

            case 'users':
                return (
                    <div className="space-y-6 animate-in fade-in duration-500">
                        <div>
                            <h2 className="text-2xl font-bold text-white">User Management</h2>
                            <p className="text-sm text-gray-400 mt-1">Manage all registered users</p>
                        </div>

                        <div className="bg-[#111827] p-6 rounded-2xl shadow-sm border border-gray-800">
                            <h3 className="text-lg font-bold text-white flex gap-2 items-center">
                                <Users size={18} /> Donors ({users.donors.length})
                            </h3>

                            <p className="text-sm text-gray-500 mb-6">Registered food donors</p>

                            <div className="overflow-x-auto custom-scrollbar">
                                <table className="w-full text-sm text-left">
                                    <thead className="text-xs text-gray-400 bg-gray-800/20 uppercase border-b border-gray-800">
                                        <tr>
                                            <th className="px-4 py-4 font-medium">Name</th>
                                            <th className="px-4 py-4 font-medium">Email</th>
                                            <th className="px-4 py-4 font-medium">Phone</th>
                                            <th className="px-4 py-4 font-medium">City</th>
                                            <th className="px-4 py-4 font-medium">Joined Date</th>
                                        </tr>
                                    </thead>

                                    <tbody className="divide-y divide-gray-800/50">
                                        {users.donors.map(u => (
                                            <tr key={u.id} className="hover:bg-gray-800/20 transition">
                                                <td className="px-4 py-4 text-gray-200 font-medium">{u.name}</td>
                                                <td className="px-4 py-4 text-gray-400">{u.email}</td>
                                                <td className="px-4 py-4 text-gray-400">{u.phone || '-'}</td>
                                                <td className="px-4 py-4 text-gray-400">{u.city || '-'}</td>
                                                <td className="px-4 py-4 text-gray-400">{new Date(u.createdAt).toLocaleDateString('en-GB')}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        <div className="bg-[#111827] p-6 rounded-2xl shadow-sm border border-gray-800">
                            <h3 className="text-lg font-bold text-white flex gap-2 items-center">
                                <UserCog size={18} /> NGOs ({users.ngos.length})
                            </h3>

                            <p className="text-sm text-gray-500 mb-6">Registered NGO accounts</p>

                            <div className="overflow-x-auto custom-scrollbar">
                                <table className="w-full text-sm text-left">
                                    <thead className="text-xs text-gray-400 bg-gray-800/20 uppercase border-b border-gray-800">
                                        <tr>
                                            <th className="px-4 py-4 font-medium">Name</th>
                                            <th className="px-4 py-4 font-medium">Email</th>
                                            <th className="px-4 py-4 font-medium">Contact</th>
                                            <th className="px-4 py-4 font-medium">City</th>
                                            <th className="px-4 py-4 font-medium">Joined Date</th>
                                        </tr>
                                    </thead>

                                    <tbody className="divide-y divide-gray-800/50">
                                        {users.ngos.map(u => (
                                            <tr key={u.id} className="hover:bg-gray-800/20 transition">
                                                <td className="px-4 py-4 text-gray-200 font-medium">{u.name}</td>
                                                <td className="px-4 py-4 text-gray-400">{u.email}</td>
                                                <td className="px-4 py-4 text-gray-400">{u.phone || '-'}</td>
                                                <td className="px-4 py-4 text-gray-400">{u.city || '-'}</td>
                                                <td className="px-4 py-4 text-gray-400">{new Date(u.createdAt).toLocaleDateString('en-GB')}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        <div className="bg-[#111827] p-6 rounded-2xl shadow-sm border border-gray-800">
                            <h3 className="text-lg font-bold text-white flex gap-2 items-center">
                                <ClipboardList size={18} /> Volunteers ({users.volunteers.length})
                            </h3>

                            <p className="text-sm text-gray-500 mb-6">Registered volunteers</p>

                            <div className="overflow-x-auto custom-scrollbar">
                                <table className="w-full text-sm text-left">
                                    <thead className="text-xs text-gray-400 bg-gray-800/20 uppercase border-b border-gray-800">
                                        <tr>
                                            <th className="px-4 py-4 font-medium">Name</th>
                                            <th className="px-4 py-4 font-medium">Email</th>
                                            <th className="px-4 py-4 font-medium">Phone</th>
                                            <th className="px-4 py-4 font-medium">City</th>
                                            <th className="px-4 py-4 font-medium">Joined Date</th>
                                        </tr>
                                    </thead>

                                    <tbody className="divide-y divide-gray-800/50">
                                        {users.volunteers.map(u => (
                                            <tr key={u.id} className="hover:bg-gray-800/20 transition">
                                                <td className="px-4 py-4 text-gray-200 font-medium">{u.name}</td>
                                                <td className="px-4 py-4 text-gray-400">{u.email}</td>
                                                <td className="px-4 py-4 text-gray-400">{u.phone || '-'}</td>
                                                <td className="px-4 py-4 text-gray-400">{u.city || '-'}</td>
                                                <td className="px-4 py-4 text-gray-400">{new Date(u.createdAt).toLocaleDateString('en-GB')}</td>
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
        <div className="flex -mx-4 -my-8 h-screen bg-[#0f172a]">
            <div className="w-64 bg-[#111827] border-r border-gray-800 flex flex-col hidden md:flex shrink-0 h-full overflow-y-auto pt-8">
                <nav className="flex-1 px-4 space-y-2 mt-4">
                    <button onClick={() => setActiveTab('dashboard')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition ${activeTab === 'dashboard' ? 'bg-[#10b981]/10 text-[#10b981]' : 'text-gray-400 hover:bg-gray-800 hover:text-white'}`}>
                        <LayoutDashboard size={20} />
                        <span className="font-semibold text-sm">Dashboard</span>
                    </button>

                    <button onClick={() => setActiveTab('donations')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition ${activeTab === 'donations' ? 'bg-[#10b981]/10 text-[#10b981]' : 'text-gray-400 hover:bg-gray-800 hover:text-white'}`}>
                        <Package size={20} />
                        <span className="font-semibold text-sm">All Donations</span>
                    </button>

                    <button onClick={() => setActiveTab('requests')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition ${activeTab === 'requests' ? 'bg-[#10b981]/10 text-[#10b981]' : 'text-gray-400 hover:bg-gray-800 hover:text-white'}`}>
                        <ClipboardList size={20} />
                        <span className="font-semibold text-sm">All Requests</span>
                    </button>

                    <button onClick={() => setActiveTab('assignments')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition ${activeTab === 'assignments' ? 'bg-[#10b981]/10 text-[#10b981]' : 'text-gray-400 hover:bg-gray-800 hover:text-white'}`}>
                        <CheckCircle size={20} />
                        <span className="font-semibold text-sm">Manage Assignments</span>
                    </button>

                    <button onClick={() => setActiveTab('users')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition ${activeTab === 'users' ? 'bg-[#10b981]/10 text-[#10b981]' : 'text-gray-400 hover:bg-gray-800 hover:text-white'}`}>
                        <Users size={20} />
                        <span className="font-semibold text-sm">Users</span>
                    </button>
                </nav>
            </div>

            <div className="flex-1 overflow-y-auto p-4 md:p-8 h-full bg-[#0a0f1c]">
                {renderTabContent()}

                {selectedDonation && (
                    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                        <div className="bg-[#111827] border border-gray-800 rounded-2xl shadow-2xl p-8 w-full max-w-md">
                            <div className="flex items-center gap-3 mb-2">
                                <div className="p-2 bg-emerald-900/30 text-emerald-500 rounded-lg">
                                    <CheckCircle size={24} />
                                </div>

                                <h3 className="text-xl font-bold text-white tracking-tight">Match Donation</h3>
                            </div>

                            <p className="text-sm text-gray-400 mb-6">
                                You are matching <strong className="text-gray-200">{selectedDonation.quantity}x {selectedDonation.food_type}</strong> from {selectedDonation.Donor?.name}.
                            </p>

                            <div className="space-y-5">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-300 mb-1.5">
                                        Select NGO Request (Optional Match)
                                    </label>

                                    <select
                                        className="w-full px-4 py-3 bg-[#0f172a] text-white border border-gray-700 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none appearance-none"
                                        value={assignmentForm.request_id}
                                        onChange={(e) => setAssignmentForm({ ...assignmentForm, request_id: e.target.value })}
                                    >
                                        <option value="">No specific request (Direct Dropoff)</option>

                                        {pendingRequests.map(r => (
                                            <option key={r.id} value={r.id}>
                                                {r.NGO?.name} - Needs {r.required_quantity}x {r.request_food_type}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-gray-300 mb-1.5">
                                        Assign Volunteer (Required)
                                    </label>

                                    <select
                                        className="w-full px-4 py-3 bg-[#0f172a] text-white border border-gray-700 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none appearance-none"
                                        value={assignmentForm.volunteer_id}
                                        onChange={(e) => setAssignmentForm({ ...assignmentForm, volunteer_id: e.target.value })}
                                    >
                                        <option value="">-- Choose a Volunteer --</option>

                                        {volunteers.map(v => (
                                            <option key={v.id} value={v.id}>
                                                {v.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="mt-8 flex gap-3 justify-end">
                                <button
                                    onClick={() => setSelectedDonation(null)}
                                    className="px-5 py-2.5 text-gray-400 hover:text-white hover:bg-gray-800 rounded-xl font-semibold transition"
                                >
                                    Cancel
                                </button>

                                <button
                                    onClick={submitAssignment}
                                    className="px-5 py-2.5 bg-[#10b981] hover:bg-[#059669] text-white rounded-xl font-semibold transition shadow-md"
                                >
                                    Confirm Match
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