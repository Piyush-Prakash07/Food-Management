import React, { useState, useEffect } from 'react';
import { useFormik } from 'formik';
import { toast } from 'react-toastify';
import {
    LayoutDashboard,
    HeartHandshake,
    List,
    Clock,
    ArrowRight,
    Utensils,
    Users
} from 'lucide-react';
import api from '../../api/axios';

const DonorView = () => {
    const [activeTab, setActiveTab] = useState('dashboard');
    const [donations, setDonations] = useState([]);
    const [stats, setStats] = useState({
        totalDonations: 0,
        pendingDonations: 0,
        assignedDonations: 0,
        deliveredDonations: 0
    });
    const [filters, setFilters] = useState({
        food_type: '',
        status: ''
    });
    const [editModal, setEditModal] = useState({
        isOpen: false,
        data: null
    });

    const fetchData = async () => {
        try {
            const [donationsRes, statsRes] = await Promise.all([
                api.get('/api/donor', { params: filters }),
                api.get('/api/donor/dashboard-stats')
            ]);

            setDonations(donationsRes.data);
            setStats(statsRes.data);
        } catch {
            toast.error('Failed to load dashboard data');
        }
    };

    useEffect(() => {
        const delayDebounceFn = setTimeout(() => {
            fetchData();
        }, 300);

        return () => clearTimeout(delayDebounceFn);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [filters]);

    const formik = useFormik({
        initialValues: {
            food_type: '',
            quantity: ''
        },
        validate: values => {
            const errors = {};

            if (!values.food_type) {
                errors.food_type = 'Required';
            }

            if (!values.quantity) {
                errors.quantity = 'Required';
            } else if (values.quantity <= 0) {
                errors.quantity = 'Must be > 0';
            }

            return errors;
        },
        onSubmit: async (values, { resetForm }) => {
            try {
                await api.post('/api/donor', {
                    food_type: values.food_type,
                    quantity: parseInt(values.quantity, 10)
                });

                fetchData();
                toast.success('Donation Posted Successfully!');
                resetForm();
            } catch (err) {
                console.error('Donation submission error:', err);
                toast.error(
                    err.response?.data?.message ||
                    'Failed to post donation'
                );
            }
        }
    });

    const getStatusBadge = (status) => {
        switch (status?.toLowerCase()) {
            case 'available':
            case 'pending':
                return (
                    <span className="bg-yellow-900/40 text-yellow-300 text-xs px-3 py-1 rounded-full font-medium border border-yellow-700/50">
                        pending
                    </span>
                );

            case 'assigned':
                return (
                    <span className="bg-blue-900/40 text-blue-300 text-xs px-3 py-1 rounded-full font-medium border border-blue-700/50">
                        assigned
                    </span>
                );

            case 'picked up':
            case 'picked_up':
                return (
                    <span className="bg-purple-900/40 text-purple-300 text-xs px-3 py-1 rounded-full font-medium border border-purple-700/50">
                        picked_up
                    </span>
                );

            case 'completed':
            case 'delivered':
                return (
                    <span className="bg-emerald-900/40 text-emerald-300 text-xs px-3 py-1 rounded-full font-medium border border-emerald-700/50">
                        delivered
                    </span>
                );

            default:
                return (
                    <span className="bg-gray-800 text-gray-300 text-xs px-3 py-1 rounded-full font-medium border border-gray-700/50">
                        {status || 'unknown'}
                    </span>
                );
        }
    };

    const displayStatus = (status) => {
        if (status === 'Available') return 'pending';
        if (status === 'Completed') return 'delivered';
        if (status === 'Picked Up') return 'picked_up';

        return status.toLowerCase();
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this donation?')) {
            return;
        }

        try {
            await api.delete(`/api/donor/${id}`);
            toast.success('Donation deleted.');
            fetchData();
        } catch (err) {
            toast.error(
                err.response?.data?.message || 'Failed to delete'
            );
        }
    };

    const handleUpdateSubmit = async (e) => {
        e.preventDefault();

        try {
            await api.put(`/api/donor/${editModal.data.id}`, {
                food_type: editModal.data.food_type,
                quantity: editModal.data.quantity
            });

            toast.success('Donation updated.');

            setEditModal({
                isOpen: false,
                data: null
            });

            fetchData();
        } catch (err) {
            toast.error(
                err.response?.data?.message || 'Failed to update'
            );
        }
    };

    const renderTabContent = () => {
        switch (activeTab) {
            case 'dashboard':
                return (
                    <div className="space-y-8 animate-in fade-in duration-500">
                        <div className="flex justify-between items-center">
                            <div>
                                <h2 className="text-3xl font-bold text-white tracking-tight">
                                    Donor Dashboard
                                </h2>
                                <p className="text-gray-400 mt-1">
                                    Welcome back, Donor!
                                </p>
                            </div>

                            <button
                                onClick={() => setActiveTab('donate')}
                                className="bg-[#10b981] hover:bg-[#059669] text-white px-5 py-2.5 rounded-xl font-semibold shadow-md transition flex items-center gap-2"
                            >
                                <HeartHandshake size={18} />
                                Donate Food
                            </button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                            <div className="p-6 bg-[#111827] rounded-2xl shadow-sm border border-gray-800 flex flex-col relative overflow-hidden">
                                <Utensils
                                    size={18}
                                    className="text-gray-500 absolute top-5 right-5"
                                />

                                <div className="text-sm font-bold text-gray-200 mb-2">
                                    Total Donations
                                </div>

                                <div className="text-3xl font-extrabold text-white mb-1">
                                    {stats.totalDonations}
                                </div>

                                <div className="text-xs text-gray-500">
                                    Lifetime donations
                                </div>
                            </div>

                            <div className="p-6 bg-[#111827] rounded-2xl shadow-sm border border-gray-800 flex flex-col relative overflow-hidden">
                                <Clock
                                    size={16}
                                    className="text-gray-500 absolute top-5 right-5"
                                />

                                <div className="text-sm font-bold text-gray-200 mb-2">
                                    Pending
                                </div>

                                <div className="text-3xl font-extrabold text-white mb-1">
                                    {stats.pendingDonations}
                                </div>

                                <div className="text-xs text-gray-500">
                                    Awaiting pickup
                                </div>
                            </div>

                            <div className="p-6 bg-[#111827] rounded-2xl shadow-sm border border-gray-800 flex flex-col relative overflow-hidden">
                                <Users
                                    size={18}
                                    className="text-gray-500 absolute top-5 right-5"
                                />

                                <div className="text-sm font-bold text-gray-200 mb-2">
                                    Assigned
                                </div>

                                <div className="text-3xl font-extrabold text-white mb-1">
                                    {stats.assignedDonations}
                                </div>

                                <div className="text-xs text-gray-500">
                                    In progress
                                </div>
                            </div>

                            <div className="p-6 bg-[#111827] rounded-2xl shadow-sm border border-gray-800 flex flex-col relative overflow-hidden">
                                <ArrowRight
                                    size={18}
                                    className="text-gray-500 absolute top-5 right-5"
                                />

                                <div className="text-sm font-bold text-gray-200 mb-2">
                                    Delivered
                                </div>

                                <div className="text-3xl font-extrabold text-white mb-1">
                                    {stats.deliveredDonations}
                                </div>

                                <div className="text-xs text-gray-500">
                                    Successfully delivered
                                </div>
                            </div>
                        </div>

                        <div className="grid md:grid-cols-2 gap-6">
                            <div className="bg-[#111827] border border-gray-800 rounded-2xl p-6 md:p-8">
                                <h3 className="text-xl font-bold text-white mb-2">
                                    Donate Food
                                </h3>

                                <p className="text-sm text-gray-400 mb-8">
                                    Share surplus food with those in need
                                </p>

                                <button
                                    onClick={() => setActiveTab('donate')}
                                    className="w-full bg-[#10b981] hover:bg-[#059669] text-white font-semibold py-3 px-4 rounded-xl transition-colors flex justify-center items-center gap-2"
                                >
                                    <HeartHandshake size={18} />
                                    Start Donating
                                </button>
                            </div>

                            <div className="bg-[#111827] border border-gray-800 rounded-2xl p-6 md:p-8 flex flex-col justify-between">
                                <div>
                                    <h3 className="text-xl font-bold text-white mb-2">
                                        My Donations
                                    </h3>

                                    <p className="text-sm text-gray-400 mb-8">
                                        View your donation history
                                    </p>
                                </div>

                                <button
                                    onClick={() => setActiveTab('donations')}
                                    className="w-full bg-gray-800 hover:bg-gray-700 text-white font-semibold py-3 px-4 rounded-xl transition-colors flex justify-center items-center gap-2"
                                >
                                    View History &rarr;
                                </button>
                            </div>
                        </div>
                    </div>
                );

            case 'donate':
                return (
                    <div className="space-y-6 animate-in fade-in duration-500">
                        <div>
                            <h2 className="text-2xl font-bold text-white">
                                Donate Food
                            </h2>

                            <p className="text-sm text-gray-400 mt-1">
                                Share your surplus food with those in need
                            </p>
                        </div>

                        <div className="grid md:grid-cols-2 gap-8 items-start">
                            <div className="bg-[#111827] p-6 md:p-8 rounded-2xl shadow-sm border border-gray-800">
                                <h3 className="text-lg font-bold text-white mb-1">
                                    New Donation
                                </h3>

                                <p className="text-sm text-gray-500 mb-6">
                                    Enter details about your food donation
                                </p>

                                <form
                                    onSubmit={formik.handleSubmit}
                                    className="space-y-5"
                                >
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-300 mb-1.5">
                                            Food Type
                                        </label>

                                        <input
                                            type="text"
                                            name="food_type"
                                            className={`w-full px-4 py-3 bg-[#0f172a] text-white border rounded-xl focus:ring-2 outline-none transition-colors ${
                                                formik.touched.food_type &&
                                                formik.errors.food_type
                                                    ? 'border-red-500/50 focus:ring-red-500/20'
                                                    : 'border-gray-700 focus:ring-emerald-500/20 focus:border-emerald-500'
                                            }`}
                                            placeholder="e.g., Cooked Rice, Vegetables, Bread"
                                            onChange={formik.handleChange}
                                            onBlur={formik.handleBlur}
                                            value={formik.values.food_type}
                                        />

                                        {formik.touched.food_type &&
                                        formik.errors.food_type ? (
                                            <div className="text-red-400 text-xs mt-1.5">
                                                {formik.errors.food_type}
                                            </div>
                                        ) : null}
                                    </div>

                                    <div>
                                        <label className="block text-sm font-semibold text-gray-300 mb-1.5">
                                            Quantity (servings)
                                        </label>

                                        <input
                                            type="number"
                                            name="quantity"
                                            className={`w-full px-4 py-3 bg-[#0f172a] text-white border rounded-xl focus:ring-2 outline-none transition-colors ${
                                                formik.touched.quantity &&
                                                formik.errors.quantity
                                                    ? 'border-red-500/50 focus:ring-red-500/20'
                                                    : 'border-gray-700 focus:ring-emerald-500/20 focus:border-emerald-500'
                                            }`}
                                            placeholder="e.g., 50"
                                            onChange={formik.handleChange}
                                            onBlur={formik.handleBlur}
                                            value={formik.values.quantity}
                                        />

                                        {formik.touched.quantity &&
                                        formik.errors.quantity ? (
                                            <div className="text-red-400 text-xs mt-1.5">
                                                {formik.errors.quantity}
                                            </div>
                                        ) : null}
                                    </div>

                                    <button
                                        type="submit"
                                        className="w-full bg-[#10b981] hover:bg-[#059669] text-white font-semibold py-3.5 px-4 rounded-xl transition-colors mt-6 flex justify-center items-center gap-2"
                                    >
                                        + Submit Donation
                                    </button>
                                </form>
                            </div>

                            <div className="bg-[#111827] p-6 md:p-8 rounded-2xl shadow-sm border border-gray-800">
                                <h3 className="text-lg font-bold text-white mb-1">
                                    Recent Donations
                                </h3>

                                <p className="text-sm text-gray-500 mb-6">
                                    Your donation history
                                </p>

                                <div className="space-y-4">
                                    <div className="flex justify-between items-center text-xs text-gray-500 font-medium px-1 mb-2">
                                        <div className="w-1/3">Food Type</div>
                                        <div className="w-1/3 text-center">
                                            Quantity
                                        </div>
                                        <div className="w-1/3 text-right">
                                            Status
                                        </div>
                                    </div>

                                    {donations.slice(0, 6).map(donation => (
                                        <div
                                            key={donation.id}
                                            className="flex justify-between items-center text-sm py-2 px-1"
                                        >
                                            <div className="text-gray-300 font-medium w-1/3 truncate pr-2">
                                                {donation.food_type}
                                            </div>

                                            <div className="text-gray-400 w-1/3 text-center">
                                                {donation.quantity}
                                            </div>

                                            <div className="w-1/3 text-right flex justify-end">
                                                {getStatusBadge(
                                                    displayStatus(donation.status)
                                                )}
                                            </div>
                                        </div>
                                    ))}

                                    {donations.length === 0 && (
                                        <div className="text-gray-500 text-sm py-4 text-center">
                                            No recent donations
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                );

            case 'donations':
                return (
                    <div className="space-y-6 animate-in fade-in duration-500">
                        <div>
                            <h2 className="text-2xl font-bold text-white">
                                My Donations
                            </h2>

                            <p className="text-sm text-gray-400 mt-1">
                                View your donation history
                            </p>
                        </div>

                        <div className="bg-[#111827] p-6 md:p-8 rounded-2xl shadow-sm border border-gray-800">
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                                <div>
                                    <h3 className="text-lg font-bold text-white mb-1">
                                        All Donations
                                    </h3>

                                    <p className="text-sm text-gray-500">
                                        Complete history of your food donations
                                    </p>
                                </div>

                                <div className="flex flex-wrap gap-3">
                                    <input
                                        type="text"
                                        placeholder="Food Type"
                                        value={filters.food_type}
                                        onChange={(e) =>
                                            setFilters({
                                                ...filters,
                                                food_type: e.target.value
                                            })
                                        }
                                        className="w-32 px-3 py-2 bg-[#0f172a] text-white border border-gray-700 rounded-lg focus:ring-2 focus:ring-[#10b981]/20 outline-none text-xs"
                                    />

                                    <select
                                        value={filters.status}
                                        onChange={(e) =>
                                            setFilters({
                                                ...filters,
                                                status: e.target.value
                                            })
                                        }
                                        className="w-32 px-3 py-2 bg-[#0f172a] text-gray-300 border border-gray-700 rounded-lg focus:ring-2 focus:ring-[#10b981]/20 outline-none text-xs appearance-none"
                                    >
                                        <option value="">
                                            All Statuses
                                        </option>
                                        <option value="Available">
                                            Available
                                        </option>
                                        <option value="Assigned">
                                            Assigned
                                        </option>
                                        <option value="Completed">
                                            Completed
                                        </option>
                                    </select>
                                </div>
                            </div>

                            <div className="overflow-x-auto custom-scrollbar">
                                <table className="w-full text-sm text-left">
                                    <thead className="text-xs text-gray-400 border-b border-gray-800 pb-4">
                                        <tr>
                                            <th className="px-4 py-4 font-medium">
                                                Food Type
                                            </th>
                                            <th className="px-4 py-4 font-medium">
                                                Quantity
                                            </th>
                                            <th className="px-4 py-4 font-medium">
                                                Status
                                            </th>
                                            <th className="px-4 py-4 font-medium">
                                                Date
                                            </th>
                                            <th className="px-4 py-4 font-medium text-right">
                                                Actions
                                            </th>
                                        </tr>
                                    </thead>

                                    <tbody className="divide-y divide-gray-800/50">
                                        {donations.map(donation => (
                                            <tr
                                                key={donation.id}
                                                className="hover:bg-gray-800/20 transition"
                                            >
                                                <td className="px-4 py-4 text-gray-200 font-medium whitespace-nowrap">
                                                    {donation.food_type}
                                                </td>

                                                <td className="px-4 py-4 text-emerald-400 font-medium">
                                                    {donation.quantity}
                                                </td>

                                                <td className="px-4 py-4">
                                                    {getStatusBadge(
                                                        displayStatus(
                                                            donation.status
                                                        )
                                                    )}
                                                </td>

                                                <td className="px-4 py-4 text-gray-400">
                                                    {new Date(
                                                        donation.createdAt
                                                    ).toLocaleDateString()}
                                                </td>

                                                <td className="px-4 py-4 text-right">
                                                    {donation.status ===
                                                        'Available' && (
                                                        <div className="flex justify-end gap-2">
                                                            <button
                                                                onClick={() =>
                                                                    setEditModal({
                                                                        isOpen: true,
                                                                        data: donation
                                                                    })
                                                                }
                                                                className="text-blue-400 hover:text-blue-300 text-xs font-semibold px-2 py-1 bg-blue-900/20 rounded-md"
                                                            >
                                                                Edit
                                                            </button>

                                                            <button
                                                                onClick={() =>
                                                                    handleDelete(
                                                                        donation.id
                                                                    )
                                                                }
                                                                className="text-red-400 hover:text-red-300 text-xs font-semibold px-2 py-1 bg-red-900/20 rounded-md"
                                                            >
                                                                Delete
                                                            </button>
                                                        </div>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}

                                        {donations.length === 0 && (
                                            <tr>
                                                <td
                                                    colSpan="5"
                                                    className="text-center py-8 text-gray-500"
                                                >
                                                    You haven't made any
                                                    donations yet.
                                                </td>
                                            </tr>
                                        )}
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
            {/* Sidebar */}
            <div className="w-64 bg-[#111827] border-r border-gray-800 flex flex-col hidden md:flex shrink-0 h-full overflow-y-auto pt-8">
                <nav className="flex-1 px-4 space-y-2 mt-4">
                    <button
                        onClick={() => setActiveTab('dashboard')}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition ${
                            activeTab === 'dashboard'
                                ? 'bg-[#10b981]/10 text-[#10b981]'
                                : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                        }`}
                    >
                        <LayoutDashboard size={20} />
                        <span className="font-semibold text-sm">
                            Dashboard
                        </span>
                    </button>

                    <button
                        onClick={() => setActiveTab('donate')}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition ${
                            activeTab === 'donate'
                                ? 'bg-[#10b981]/10 text-[#10b981]'
                                : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                        }`}
                    >
                        <HeartHandshake size={20} />
                        <span className="font-semibold text-sm">
                            Donate Food
                        </span>
                    </button>

                    <button
                        onClick={() => setActiveTab('donations')}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition ${
                            activeTab === 'donations'
                                ? 'bg-[#10b981]/10 text-[#10b981]'
                                : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                        }`}
                    >
                        <List size={20} />
                        <span className="font-semibold text-sm">
                            My Donations
                        </span>
                    </button>
                </nav>
            </div>

            {/* Main Content */}
            <div className="flex-1 overflow-y-auto p-4 md:p-8 h-full bg-[#0a0f1c]">
                {renderTabContent()}

                {/* Edit Modal */}
                {editModal.isOpen && (
                    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                        <div className="bg-[#111827] border border-gray-800 rounded-2xl shadow-2xl p-8 w-full max-w-sm">
                            <h3 className="text-xl font-bold text-white tracking-tight mb-4">
                                Edit Donation
                            </h3>

                            <form
                                onSubmit={handleUpdateSubmit}
                                className="space-y-4"
                            >
                                <div>
                                    <label className="block text-sm text-gray-400 mb-1">
                                        Food Type
                                    </label>

                                    <input
                                        type="text"
                                        value={editModal.data.food_type}
                                        onChange={(e) =>
                                            setEditModal(prev => ({
                                                ...prev,
                                                data: {
                                                    ...prev.data,
                                                    food_type: e.target.value
                                                }
                                            }))
                                        }
                                        className="w-full px-3 py-2 bg-[#0f172a] text-white border border-gray-700 rounded-lg outline-none focus:ring-1 focus:ring-emerald-500"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm text-gray-400 mb-1">
                                        Quantity
                                    </label>

                                    <input
                                        type="number"
                                        value={editModal.data.quantity}
                                        onChange={(e) =>
                                            setEditModal(prev => ({
                                                ...prev,
                                                data: {
                                                    ...prev.data,
                                                    quantity: e.target.value
                                                }
                                            }))
                                        }
                                        className="w-full px-3 py-2 bg-[#0f172a] text-white border border-gray-700 rounded-lg outline-none focus:ring-1 focus:ring-emerald-500"
                                        min="1"
                                        required
                                    />
                                </div>

                                <div className="mt-6 flex justify-end gap-3">
                                    <button
                                        type="button"
                                        onClick={() =>
                                            setEditModal({
                                                isOpen: false,
                                                data: null
                                            })
                                        }
                                        className="px-4 py-2 text-sm text-gray-400 hover:text-white"
                                    >
                                        Cancel
                                    </button>

                                    <button
                                        type="submit"
                                        className="px-4 py-2 text-sm bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg"
                                    >
                                        Save Changes
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default DonorView;