import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { LayoutDashboard, Package, Truck, CheckCircle, Navigation, MapPin } from 'lucide-react';
import api from '../../api/axios';

const VolunteerView = () => {
    const [activeTab, setActiveTab] = useState('dashboard');
    const [assignments, setAssignments] = useState([]);
    const [stats, setStats] = useState({ activeDeliveries: 0, pendingPickup: 0, inTransit: 0, completed: 0 });
    const [statusFilter, setStatusFilter] = useState('');

    const fetchTasks = async () => {
        try {
            const [tasksRes, statsRes] = await Promise.all([
                api.get('/api/volunteer', { params: { status: statusFilter } }),
                api.get('/api/volunteer/dashboard-stats')
            ]);
            setAssignments(tasksRes.data);
            setStats(statsRes.data);
        } catch (err) {
            toast.error('Failed to load volunteer tasks');
        }
    };

    useEffect(() => {
        const delayDebounceFn = setTimeout(() => {
            fetchTasks();
        }, 300);
        return () => clearTimeout(delayDebounceFn);
    }, [statusFilter]);

    const getDerivedStatus = (task) => {
        if (task.delivery_status === 'Delivered') return 'Delivered';
        if (task.pickup_status === 'Picked Up') return 'Picked Up';
        return 'Pending Pickup';
    };

    const handleStatusToggle = async (task) => {
        const currentStatus = getDerivedStatus(task);
        let statusType = '';
        let newStatus = '';

        if (currentStatus === 'Pending Pickup') {
            statusType = 'pickup_status';
            newStatus = 'Picked Up';
        } else if (currentStatus === 'Picked Up') {
            statusType = 'delivery_status';
            newStatus = 'Delivered';
        } else return;

        try {
            await api.put(`/api/volunteer/${task.id}/status`, {
                statusType,
                newStatus
            });

            // Refresh tasks
            fetchTasks();
            toast.success(`Delivery status updated to ${newStatus}!`);
        } catch (err) {
            toast.error('Failed to update status');
        }
    };

    const getStatusBadge = (status) => {
        switch (status?.toLowerCase()) {
            case 'pending pickup':
            case 'pending': return <span className="bg-yellow-900/30 text-yellow-500 text-xs px-2.5 py-1 rounded-full font-semibold border border-yellow-700/50">pending</span>;
            case 'picked up':
            case 'picked_up': return <span className="bg-purple-900/40 text-purple-300 text-xs px-2.5 py-1 rounded-full font-semibold border border-purple-700/50">picked_up</span>;
            case 'delivered': return <span className="bg-emerald-900/30 text-emerald-400 text-xs px-2.5 py-1 rounded-full font-semibold border border-emerald-700/50">delivered</span>;
            default: return <span className="bg-gray-800 text-gray-400 text-xs px-2.5 py-1 rounded-full font-semibold border border-gray-700/50">{status || 'unknown'}</span>;
        }
    };

    const renderTabContent = () => {
        switch (activeTab) {
            case 'dashboard':
                return (
                    <div className="space-y-8 animate-in fade-in duration-500">
                        <div>
                            <h2 className="text-3xl font-bold text-white tracking-tight">Volunteer Dashboard</h2>
                            <p className="text-gray-400 mt-1">Welcome back!</p>
                        </div>

                        {/* Top Metrics Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            <div className="p-6 bg-[#111827] rounded-2xl shadow-sm border border-gray-800 flex flex-col relative overflow-hidden">
                                <Package size={18} className="text-gray-500 absolute top-5 right-5" />
                                <div className="text-sm font-bold text-gray-200 mb-2">Active Deliveries</div>
                                <div className="text-3xl font-extrabold text-white mb-1">{stats.activeDeliveries}</div>
                                <div className="text-xs text-gray-500">Total assignments</div>
                            </div>
                            <div className="p-6 bg-[#111827] rounded-2xl shadow-sm border border-gray-800 flex flex-col relative overflow-hidden">
                                <Package size={18} className="text-gray-500 absolute top-5 right-5" />
                                <div className="text-sm font-bold text-gray-200 mb-2">Pending Pickup</div>
                                <div className="text-3xl font-extrabold text-white mb-1">{stats.pendingPickup}</div>
                                <div className="text-xs text-gray-500">Awaiting pickup</div>
                            </div>
                            <div className="p-6 bg-[#111827] rounded-2xl shadow-sm border border-gray-800 flex flex-col relative overflow-hidden">
                                <Truck size={18} className="text-gray-500 absolute top-5 right-5" />
                                <div className="text-sm font-bold text-gray-200 mb-2">In Transit</div>
                                <div className="text-3xl font-extrabold text-white mb-1">{stats.inTransit}</div>
                                <div className="text-xs text-gray-500">On the way</div>
                            </div>
                            <div className="p-6 bg-[#111827] rounded-2xl shadow-sm border border-gray-800 flex flex-col relative overflow-hidden">
                                <CheckCircle size={18} className="text-gray-500 absolute top-5 right-5" />
                                <div className="text-sm font-bold text-gray-200 mb-2">Completed</div>
                                <div className="text-3xl font-extrabold text-white mb-1">{stats.completed}</div>
                                <div className="text-xs text-gray-500">Deliveries done</div>
                            </div>
                        </div>

                        {/* My Deliveries Quick View */}
                        <div className="bg-[#111827] border border-gray-800 rounded-2xl p-6 md:p-8">
                            <h3 className="text-xl font-bold text-white mb-2">My Deliveries</h3>
                            <p className="text-sm text-gray-400 mb-6">Manage your pickup and delivery tasks</p>

                            <div className="space-y-4">
                                {assignments.length > 0 ? assignments.map(task => (
                                    <div key={task.id} className="p-5 border border-gray-800/80 rounded-xl bg-[#0f172a]/50 hover:bg-[#0f172a] transition">
                                        <div className="flex flex-col gap-1">
                                            <div className="font-semibold text-gray-200">
                                                {task.DonationAssignment?.FoodDonation?.food_type} - {task.DonationAssignment?.FoodDonation?.quantity} units
                                            </div>
                                            <div className="text-sm text-gray-500">
                                                From: {task.DonationAssignment?.FoodDonation?.Donor?.name || 'Unknown'} {task.DonationAssignment?.FoodDonation?.Donor?.city ? `(${task.DonationAssignment?.FoodDonation?.Donor?.city})` : ''}
                                                <span className="mx-2">|</span>
                                                To: {task.DonationAssignment?.FoodRequest?.NGO?.name || 'Local Dropoff'} {task.DonationAssignment?.FoodRequest?.NGO?.city ? `(${task.DonationAssignment?.FoodRequest?.NGO?.city})` : ''}
                                            </div>
                                            <div className="text-sm font-medium mt-1">
                                                <span className="text-gray-400">Pickup: </span> {task.pickup_status === 'Picked Up' ? 'Picked_up' : 'Pending'}
                                                <span className="mx-2 text-gray-600">|</span>
                                                <span className="text-gray-400">Delivery: </span> {task.delivery_status === 'Delivered' ? 'Delivered' : 'Pending'}
                                            </div>
                                        </div>
                                    </div>
                                )) : (
                                    <div className="text-center py-8 text-gray-500 border border-gray-800/50 rounded-xl bg-[#0f172a]/30">
                                        No active deliveries right now.
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                );
            case 'pickups':
                const pendingPickups = assignments.filter(task => task.pickup_status === 'Pending');
                return (
                    <div className="space-y-6 animate-in fade-in duration-500">
                        <div>
                            <h2 className="text-2xl font-bold text-white">Available Pickups</h2>
                            <p className="text-sm text-gray-400 mt-1">Pick up available donations to deliver</p>
                        </div>
                        <div className="bg-[#111827] p-6 md:p-8 rounded-2xl shadow-sm border border-gray-800">
                            <h3 className="text-lg font-bold text-white mb-1">Available Assignments</h3>
                            <p className="text-sm text-gray-500 mb-8">Donations ready for pickup</p>

                            {pendingPickups.length > 0 ? (
                                <div className="space-y-4">
                                    {pendingPickups.map(task => (
                                        <div key={task.id} className="p-5 border border-gray-800 rounded-xl bg-[#0f172a] hover:bg-gray-800/80 transition flex flex-col md:flex-row justify-between md:items-center gap-4">
                                            <div>
                                                <h4 className="font-bold text-lg text-gray-100 flex items-center gap-2">
                                                    {task.DonationAssignment?.FoodDonation?.food_type} <span className="text-xs font-normal text-gray-400 bg-gray-800 px-2 py-0.5 rounded-md">{task.DonationAssignment?.FoodDonation?.quantity} units</span>
                                                </h4>
                                                <div className="text-sm text-gray-400 mt-2 space-y-1">
                                                    <div className="flex items-center gap-2">
                                                        <MapPin size={14} className="text-red-400" />
                                                        <span>
                                                            <strong className="text-gray-300">From:</strong> {task.DonationAssignment?.FoodDonation?.Donor?.name || 'Unknown Donor'}
                                                            {task.DonationAssignment?.FoodDonation?.Donor?.city ? ` (${task.DonationAssignment?.FoodDonation?.Donor?.city})` : ''}
                                                            {task.DonationAssignment?.FoodDonation?.Donor?.phone ? ` - 📞 ${task.DonationAssignment?.FoodDonation?.Donor?.phone}` : ''}
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <Navigation size={14} className="text-emerald-400" />
                                                        <span>
                                                            <strong className="text-gray-300">To:</strong> {task.DonationAssignment?.FoodRequest?.NGO?.name || 'Local Dropoff'}
                                                            {task.DonationAssignment?.FoodRequest?.NGO?.city ? ` (${task.DonationAssignment?.FoodRequest?.NGO?.city})` : ''}
                                                            {task.DonationAssignment?.FoodRequest?.NGO?.phone ? ` - 📞 ${task.DonationAssignment?.FoodRequest?.NGO?.phone}` : ''}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => handleStatusToggle(task)}
                                                className="bg-[#10b981] hover:bg-[#059669] text-white px-6 py-2.5 rounded-xl font-semibold shadow-md transition whitespace-nowrap"
                                            >
                                                Mark Picked Up
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-16 text-gray-500 border border-gray-800/50 rounded-xl bg-[#0f172a]/30">
                                    No pickups available at the moment
                                </div>
                            )}
                        </div>
                    </div>
                );
            case 'deliveries':
                return (
                    <div className="space-y-6 animate-in fade-in duration-500">
                        <div>
                            <h2 className="text-2xl font-bold text-white">My Deliveries</h2>
                            <p className="text-sm text-gray-400 mt-1">Track your pickup and delivery tasks</p>
                        </div>
                        <div className="bg-[#111827] p-6 md:p-8 rounded-2xl shadow-sm border border-gray-800">
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                                <div>
                                    <h3 className="text-lg font-bold text-white mb-1">All Deliveries</h3>
                                    <p className="text-sm text-gray-500">Complete history of your delivery assignments</p>
                                </div>
                                <select 
                                    value={statusFilter}
                                    onChange={e => setStatusFilter(e.target.value)}
                                    className="w-40 px-3 py-2 bg-[#0f172a] text-gray-300 border border-gray-700 rounded-lg focus:ring-2 focus:ring-[#10b981]/20 outline-none text-xs appearance-none"
                                >
                                    <option value="">All Statuses</option>
                                    <option value="Pending Pickup">Pending Pickup</option>
                                    <option value="Picked_up">In Transit</option>
                                    <option value="Delivered">Delivered</option>
                                </select>
                            </div>

                            <div className="overflow-x-auto custom-scrollbar">
                                <table className="w-full text-sm text-left">
                                    <thead className="text-xs text-gray-400 border-b border-gray-800 pb-4">
                                        <tr>
                                            <th className="px-4 py-4 font-medium">Donation</th>
                                            <th className="px-4 py-4 font-medium">From</th>
                                            <th className="px-4 py-4 font-medium">To</th>
                                            <th className="px-4 py-4 font-medium">Pickup Status</th>
                                            <th className="px-4 py-4 font-medium">Delivery Status</th>
                                            <th className="px-4 py-4 font-medium">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-800/50">
                                        {assignments.map(task => {
                                            const status = getDerivedStatus(task);
                                            return (
                                                <tr key={task.id} className="hover:bg-gray-800/20 transition">
                                                    <td className="px-4 py-4 text-gray-200 font-medium whitespace-nowrap">
                                                        {task.DonationAssignment?.FoodDonation?.food_type} ({task.DonationAssignment?.FoodDonation?.quantity})
                                                    </td>
                                                    <td className="px-4 py-4 text-gray-300">
                                                        <div>{task.DonationAssignment?.FoodDonation?.Donor?.name || 'Unknown'}</div>
                                                        <div className="text-xs text-gray-500">{task.DonationAssignment?.FoodDonation?.Donor?.city}</div>
                                                        <div className="text-xs text-gray-500">{task.DonationAssignment?.FoodDonation?.Donor?.phone}</div>
                                                    </td>
                                                    <td className="px-4 py-4 text-gray-300">
                                                        <div>{task.DonationAssignment?.FoodRequest?.NGO?.name || 'Unknown'}</div>
                                                        <div className="text-xs text-gray-500">{task.DonationAssignment?.FoodRequest?.NGO?.city}</div>
                                                        <div className="text-xs text-gray-500">{task.DonationAssignment?.FoodRequest?.NGO?.phone}</div>
                                                    </td>
                                                    <td className="px-4 py-4">
                                                        {getStatusBadge(task.pickup_status === 'Picked Up' ? 'picked_up' : 'pending')}
                                                    </td>
                                                    <td className="px-4 py-4">
                                                        {getStatusBadge(task.delivery_status === 'Delivered' ? 'delivered' : 'pending')}
                                                    </td>
                                                    <td className="px-4 py-4">
                                                        {status !== 'Delivered' && (
                                                            <button
                                                                onClick={() => handleStatusToggle(task)}
                                                                className="bg-[#10b981] hover:bg-[#059669] text-white px-4 py-1.5 rounded-lg text-xs font-semibold transition"
                                                            >
                                                                {status === 'Pending Pickup' ? 'Pickup' : 'Deliver'}
                                                            </button>
                                                        )}
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                        {assignments.length === 0 && (
                                            <tr>
                                                <td colSpan="6" className="text-center py-8 text-gray-500">
                                                    You have no delivery assignments yet.
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                );
        }
    };

    return (
        <div className="flex -mx-4 -my-8 h-screen bg-[#0f172a]">
            {/* Sidebar */}
            <div className="w-64 bg-[#111827] border-r border-gray-800 flex flex-col hidden md:flex shrink-0 h-full overflow-y-auto pt-8">
                <nav className="flex-1 px-4 space-y-2 mt-4">
                    <button onClick={() => setActiveTab('dashboard')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition ${activeTab === 'dashboard' ? 'bg-[#10b981]/10 text-[#10b981]' : 'text-gray-400 hover:bg-gray-800 hover:text-white'}`}>
                        <LayoutDashboard size={20} />
                        <span className="font-semibold text-sm">Dashboard</span>
                    </button>
                    <button onClick={() => setActiveTab('pickups')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition ${activeTab === 'pickups' ? 'bg-[#10b981]/10 text-[#10b981]' : 'text-gray-400 hover:bg-gray-800 hover:text-white'}`}>
                        <Package size={20} />
                        <span className="font-semibold text-sm">Available Pickups</span>
                    </button>
                    <button onClick={() => setActiveTab('deliveries')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition ${activeTab === 'deliveries' ? 'bg-[#10b981]/10 text-[#10b981]' : 'text-gray-400 hover:bg-gray-800 hover:text-white'}`}>
                        <Truck size={20} />
                        <span className="font-semibold text-sm">My Deliveries</span>
                    </button>
                </nav>
            </div>

            {/* Main Content */}
            <div className="flex-1 overflow-y-auto p-4 md:p-8 h-full bg-[#0a0f1c]">
                {renderTabContent()}
            </div>
        </div>
    );
};

export default VolunteerView;

