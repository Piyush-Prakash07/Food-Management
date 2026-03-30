import React, { useState, useEffect } from 'react';
import { useFormik } from 'formik';
import { toast } from 'react-toastify';
import { LayoutDashboard, FileEdit, List, ClipboardCheck, HandHeart, Activity, CheckCircle, Clock, Link as LinkIcon, Search } from 'lucide-react';
import api from '../../api/axios';

const NGOView = () => {
    const [activeTab, setActiveTab] = useState('dashboard');
    const [requests, setRequests] = useState([]);
    const [assignments, setAssignments] = useState([]);
    const [stats, setStats] = useState({ totalRequests: 0, pendingRequests: 0, fulfilledRequests: 0 });
    const [filters, setFilters] = useState({ request_food_type: '', status: '' });
    const [editModal, setEditModal] = useState({ isOpen: false, data: null });

    const fetchData = async () => {
        try {
            const [requestsRes, statsRes, assignmentsRes] = await Promise.all([
                api.get('/api/ngo', { params: filters }),
                api.get('/api/ngo/dashboard-stats'),
                api.get('/api/ngo/assignments')
            ]);
            setRequests(requestsRes.data);
            setStats(statsRes.data);
            setAssignments(assignmentsRes.data);
        } catch (err) {
            toast.error('Failed to load dashboard data');
        }
    };

    useEffect(() => {
        const delayDebounceFn = setTimeout(() => {
            fetchData();
        }, 300);
        return () => clearTimeout(delayDebounceFn);
    }, [filters]);

    const formik = useFormik({
        initialValues: {
            request_food_type: '',
            required_quantity: ''
        },
        validate: values => {
            const errors = {};
            if (!values.request_food_type) errors.request_food_type = 'Required';
            if (!values.required_quantity) errors.required_quantity = 'Required';
            else if (values.required_quantity <= 0) errors.required_quantity = 'Must be > 0';
            return errors;
        },
        onSubmit: async (values, { resetForm }) => {
            try {
                await api.post('/api/ngo', {
                    request_food_type: values.request_food_type,
                    required_quantity: parseInt(values.required_quantity, 10)
                });
                fetchData();
                toast.success('Food Request Submitted Successfully!');
                resetForm();
            } catch (err) {
                console.error('Request submission error:', err);
                toast.error(err.response?.data?.message || 'Failed to submit food request');
            }
        }
    });

    const getStatusBadge = (status) => {
        switch (status?.toLowerCase()) {
            case 'pending': return <span className="bg-yellow-900/30 text-yellow-500 text-xs px-2.5 py-1 rounded-full font-semibold border border-yellow-700/50">pending</span>;
            case 'assigned':
            case 'matched': return <span className="bg-blue-900/30 text-blue-400 text-xs px-2.5 py-1 rounded-full font-semibold border border-blue-700/50">matched</span>;
            case 'fulfilled': return <span className="bg-emerald-900/30 text-emerald-400 text-xs px-2.5 py-1 rounded-full font-semibold border border-emerald-700/50">fulfilled</span>;
            default: return <span className="bg-gray-800 text-gray-400 text-xs px-2.5 py-1 rounded-full font-semibold border border-gray-700/50">{status || 'unknown'}</span>;
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure you want to delete this request?")) return;
        try {
            await api.delete(`/api/ngo/${id}`);
            toast.success("Request deleted.");
            fetchData();
        } catch(err) {
            toast.error(err.response?.data?.message || "Failed to delete");
        }
    };

    const handleUpdateSubmit = async (e) => {
        e.preventDefault();
        try {
            await api.put(`/api/ngo/${editModal.data.id}`, {
                request_food_type: editModal.data.request_food_type,
                required_quantity: editModal.data.required_quantity
            });
            toast.success("Request updated.");
            setEditModal({ isOpen: false, data: null });
            fetchData();
        } catch(err) {
            toast.error(err.response?.data?.message || "Failed to update");
        }
    };

    const renderTabContent = () => {
        switch (activeTab) {
            case 'dashboard':
                return (
                    <div className="space-y-8 animate-in fade-in duration-500">
                        <div className="flex justify-between items-center">
                            <div>
                                <h2 className="text-3xl font-bold text-white tracking-tight">NGO Dashboard</h2>
                                <p className="text-gray-400 mt-1">Welcome back, NGO!</p>
                            </div>
                            <button onClick={() => setActiveTab('request')} className="bg-[#10b981] hover:bg-[#059669] text-white px-5 py-2.5 rounded-xl font-semibold shadow-md transition flex items-center gap-2">
                                <HandHeart size={18} />
                                Request Food
                            </button>
                        </div>

                        {/* Top Metrics Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="p-6 bg-[#111827] rounded-2xl shadow-sm border border-gray-800 flex flex-col relative overflow-hidden">
                                <LinkIcon size={18} className="text-gray-500 absolute top-5 right-5" />
                                <div className="text-sm font-bold text-gray-200 mb-2">Total Requests</div>
                                <div className="text-3xl font-extrabold text-white mb-1">{stats.totalRequests}</div>
                                <div className="text-xs text-gray-500">Lifetime requests</div>
                            </div>
                            <div className="p-6 bg-[#111827] rounded-2xl shadow-sm border border-gray-800 flex flex-col relative overflow-hidden">
                                <Clock size={18} className="text-gray-500 absolute top-5 right-5" />
                                <div className="text-sm font-bold text-gray-200 mb-2">Pending</div>
                                <div className="text-3xl font-extrabold text-white mb-1">{stats.pendingRequests}</div>
                                <div className="text-xs text-gray-500">Awaiting match</div>
                            </div>
                            <div className="p-6 bg-[#111827] rounded-2xl shadow-sm border border-gray-800 flex flex-col relative overflow-hidden">
                                <CheckCircle size={18} className="text-gray-500 absolute top-5 right-5" />
                                <div className="text-sm font-bold text-gray-200 mb-2">Fulfilled</div>
                                <div className="text-3xl font-extrabold text-white mb-1">{stats.fulfilledRequests}</div>
                                <div className="text-xs text-gray-500">Completed</div>
                            </div>
                        </div>

                        {/* Quick Action Cards */}
                        <div className="grid md:grid-cols-2 gap-6">
                            <div className="bg-[#111827] border border-gray-800 rounded-2xl p-6 md:p-8">
                                <h3 className="text-xl font-bold text-white mb-2">Request Food</h3>
                                <p className="text-sm text-gray-400 mb-8">Request food donations for your organization</p>
                                <button onClick={() => setActiveTab('request')} className="w-full bg-[#10b981] hover:bg-[#059669] text-white font-semibold py-3 px-4 rounded-xl transition-colors flex justify-center items-center gap-2">
                                    <HandHeart size={18} />
                                    Make Request
                                </button>
                            </div>
                            <div className="bg-[#111827] border border-gray-800 rounded-2xl p-6 md:p-8 flex flex-col justify-between">
                                <div>
                                    <h3 className="text-xl font-bold text-white mb-2">My Requests</h3>
                                    <p className="text-sm text-gray-400 mb-8">View your request history</p>
                                </div>
                                <button onClick={() => setActiveTab('requests')} className="w-full bg-gray-800 hover:bg-gray-700 text-white font-semibold py-3 px-4 rounded-xl transition-colors flex justify-center items-center gap-2">
                                    View History &rarr;
                                </button>
                            </div>
                        </div>
                    </div>
                );
            case 'request':
                return (
                    <div className="space-y-6 animate-in fade-in duration-500">
                        <div>
                            <h2 className="text-2xl font-bold text-white">Request Food</h2>
                            <p className="text-sm text-gray-400 mt-1">Request food donations for your organization</p>
                        </div>

                        <div className="grid md:grid-cols-2 gap-8 items-start">
                            {/* Form */}
                            <div className="bg-[#111827] p-6 md:p-8 rounded-2xl shadow-sm border border-gray-800">
                                <h3 className="text-lg font-bold text-white mb-1">New Request</h3>
                                <p className="text-sm text-gray-500 mb-6">Enter details about your food requirement</p>

                                <form onSubmit={formik.handleSubmit} className="space-y-5">
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-300 mb-1.5">Required Food Type</label>
                                        <input
                                            type="text"
                                            name="request_food_type"
                                            className={`w-full px-4 py-3 bg-[#0f172a] text-white border rounded-xl focus:ring-2 outline-none transition-colors ${formik.touched.request_food_type && formik.errors.request_food_type ? 'border-red-500/50 focus:ring-red-500/20' : 'border-gray-700 focus:ring-emerald-500/20 focus:border-emerald-500'}`}
                                            placeholder="e.g., Rice, Bread, Vegetables"
                                            onChange={formik.handleChange}
                                            onBlur={formik.handleBlur}
                                            value={formik.values.request_food_type}
                                        />
                                        {formik.touched.request_food_type && formik.errors.request_food_type ? (
                                            <div className="text-red-400 text-xs mt-1.5">{formik.errors.request_food_type}</div>
                                        ) : null}
                                    </div>

                                    <div>
                                        <label className="block text-sm font-semibold text-gray-300 mb-1.5">Required Quantity (servings)</label>
                                        <input
                                            type="number"
                                            name="required_quantity"
                                            className={`w-full px-4 py-3 bg-[#0f172a] text-white border rounded-xl focus:ring-2 outline-none transition-colors ${formik.touched.required_quantity && formik.errors.required_quantity ? 'border-red-500/50 focus:ring-red-500/20' : 'border-gray-700 focus:ring-emerald-500/20 focus:border-emerald-500'}`}
                                            placeholder="e.g., 100"
                                            onChange={formik.handleChange}
                                            onBlur={formik.handleBlur}
                                            value={formik.values.required_quantity}
                                        />
                                        {formik.touched.required_quantity && formik.errors.required_quantity ? (
                                            <div className="text-red-400 text-xs mt-1.5">{formik.errors.required_quantity}</div>
                                        ) : null}
                                    </div>

                                    <button
                                        type="submit"
                                        className="w-full bg-[#10b981] hover:bg-[#059669] text-white font-semibold py-3.5 px-4 rounded-xl transition-colors mt-6 flex justify-center items-center gap-2"
                                    >
                                        + Submit Request
                                    </button>
                                </form>
                            </div>

                            {/* Recent List */}
                            <div className="bg-[#111827] p-6 md:p-8 rounded-2xl shadow-sm border border-gray-800">
                                <h3 className="text-lg font-bold text-white mb-1">Your Requests</h3>
                                <p className="text-sm text-gray-500 mb-6">Your food request history</p>

                                <div className="space-y-4">
                                    {requests.slice(0, 5).map(req => (
                                        <div key={req.id} className="grid grid-cols-3 items-center text-sm py-2 gap-4">
                                            <div className="text-gray-300 font-medium truncate">{req.request_food_type}</div>
                                            <div className="text-gray-400 text-center">{req.required_quantity}</div>
                                            <div className="flex justify-end">{getStatusBadge(req.status)}</div>
                                        </div>
                                    ))}
                                    {requests.length === 0 && (
                                        <div className="text-gray-500 text-sm py-4">No recent requests</div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                );
            case 'requests':
                return (
                    <div className="space-y-6 animate-in fade-in duration-500">
                        <div>
                            <h2 className="text-2xl font-bold text-white">My Requests</h2>
                            <p className="text-sm text-gray-400 mt-1">View your food request history</p>
                        </div>
                        <div className="bg-[#111827] p-6 md:p-8 rounded-2xl shadow-sm border border-gray-800">
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                                <div>
                                    <h3 className="text-lg font-bold text-white mb-1">All Requests</h3>
                                    <p className="text-sm text-gray-500">Complete history of your food requests</p>
                                </div>
                                <div className="flex flex-wrap gap-3">
                                    <input 
                                        type="text" 
                                        placeholder="Food Type" 
                                        value={filters.request_food_type}
                                        onChange={(e) => setFilters({...filters, request_food_type: e.target.value})}
                                        className="w-32 px-3 py-2 bg-[#0f172a] text-white border border-gray-700 rounded-lg focus:ring-2 focus:ring-[#10b981]/20 outline-none text-xs"
                                    />
                                    <select
                                        value={filters.status}
                                        onChange={(e) => setFilters({...filters, status: e.target.value})}
                                        className="w-32 px-3 py-2 bg-[#0f172a] text-gray-300 border border-gray-700 rounded-lg focus:ring-2 focus:ring-[#10b981]/20 outline-none text-xs appearance-none"
                                    >
                                        <option value="">All Statuses</option>
                                        <option value="Pending">Pending</option>
                                        <option value="Assigned">Assigned</option>
                                        <option value="Fulfilled">Fulfilled</option>
                                    </select>
                                </div>
                            </div>

                            <div className="overflow-x-auto custom-scrollbar">
                                <table className="w-full text-sm text-left">
                                    <thead className="text-xs text-gray-400 border-b border-gray-800 pb-4">
                                        <tr>
                                            <th className="px-4 py-4 font-medium">Food Type</th>
                                            <th className="px-4 py-4 font-medium">Quantity</th>
                                            <th className="px-4 py-4 font-medium">Status</th>
                                            <th className="px-4 py-4 font-medium">Date</th>
                                            <th className="px-4 py-4 font-medium text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-800/50">
                                        {requests.map(req => (
                                            <tr key={req.id} className="hover:bg-gray-800/20 transition">
                                                <td className="px-4 py-4 text-gray-200 font-medium whitespace-nowrap">{req.request_food_type}</td>
                                                <td className="px-4 py-4 text-emerald-400 font-medium">{req.required_quantity}</td>
                                                <td className="px-4 py-4">{getStatusBadge(req.status)}</td>
                                                <td className="px-4 py-4 text-gray-400">{new Date(req.createdAt).toLocaleDateString()}</td>
                                                <td className="px-4 py-4 text-right">
                                                    {req.status === 'Pending' && (
                                                        <div className="flex justify-end gap-2">
                                                            <button 
                                                                onClick={() => setEditModal({ isOpen: true, data: req })} 
                                                                className="text-blue-400 hover:text-blue-300 text-xs font-semibold px-2 py-1 bg-blue-900/20 rounded-md"
                                                            >
                                                                Edit
                                                            </button>
                                                            <button 
                                                                onClick={() => handleDelete(req.id)} 
                                                                className="text-red-400 hover:text-red-300 text-xs font-semibold px-2 py-1 bg-red-900/20 rounded-md"
                                                            >
                                                                Delete
                                                            </button>
                                                        </div>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                        {requests.length === 0 && (
                                            <tr>
                                                <td colSpan="4" className="text-center py-8 text-gray-500">
                                                    You haven't made any requests yet.
                                                </td>
                                            </tr>
                                        )}
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
                            <h2 className="text-2xl font-bold text-white">NGO Assignments</h2>
                            <p className="text-sm text-gray-400 mt-1">View assignments for your food requests</p>
                        </div>
                        <div className="bg-[#111827] p-6 md:p-8 rounded-2xl shadow-sm border border-gray-800">
                            <h3 className="text-lg font-bold text-white mb-1">Your Assignments</h3>
                            <p className="text-sm text-gray-500 mb-8">Donations matched to your requests</p>

                            {assignments.length > 0 ? (
                                <div className="space-y-4">
                                    {assignments.map(assignment => (
                                        <div key={assignment.id} className="p-5 border border-gray-800 rounded-xl bg-[#0f172a] flex flex-col md:flex-row justify-between md:items-center gap-4">
                                            <div>
                                                <h4 className="font-bold text-lg text-gray-100 flex items-center gap-2">
                                                    Matched with: {assignment.FoodDonation?.food_type}
                                                </h4>
                                                <div className="text-sm text-gray-400 mt-2">
                                                    Donated by: {assignment.FoodDonation?.Donor?.name || 'Unknown Donor'} ({assignment.FoodDonation?.Donor?.city || 'No city'}) <br />
                                                    Quantity: {assignment.FoodDonation?.quantity} units
                                                </div>
                                            </div>
                                            <div className="flex flex-col items-end gap-2">
                                                {getStatusBadge(assignment.status)}
                                                <span className="text-xs text-gray-500">{new Date(assignment.createdAt).toLocaleDateString()}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-16 text-gray-500">
                                    No assignments yet
                                </div>
                            )}
                        </div>
                    </div>
                );
            default: return null;
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
                    <button onClick={() => setActiveTab('request')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition ${activeTab === 'request' ? 'bg-[#10b981]/10 text-[#10b981]' : 'text-gray-400 hover:bg-gray-800 hover:text-white'}`}>
                        <FileEdit size={20} />
                        <span className="font-semibold text-sm">Request Food</span>
                    </button>
                    <button onClick={() => setActiveTab('requests')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition ${activeTab === 'requests' ? 'bg-[#10b981]/10 text-[#10b981]' : 'text-gray-400 hover:bg-gray-800 hover:text-white'}`}>
                        <List size={20} />
                        <span className="font-semibold text-sm">My Requests</span>
                    </button>
                    <button onClick={() => setActiveTab('assignments')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition ${activeTab === 'assignments' ? 'bg-[#10b981]/10 text-[#10b981]' : 'text-gray-400 hover:bg-gray-800 hover:text-white'}`}>
                        <ClipboardCheck size={20} />
                        <span className="font-semibold text-sm">Assignments</span>
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
                            <h3 className="text-xl font-bold text-white tracking-tight mb-4">Edit Request</h3>
                            <form onSubmit={handleUpdateSubmit} className="space-y-4">
                                <div>
                                    <label className="block text-sm text-gray-400 mb-1">Food Type</label>
                                    <input 
                                        type="text" 
                                        value={editModal.data.request_food_type} 
                                        onChange={e => setEditModal(prev => ({...prev, data: {...prev.data, request_food_type: e.target.value}}))}
                                        className="w-full px-3 py-2 bg-[#0f172a] text-white border border-gray-700 rounded-lg outline-none focus:ring-1 focus:ring-emerald-500"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm text-gray-400 mb-1">Quantity Needed</label>
                                    <input 
                                        type="number" 
                                        value={editModal.data.required_quantity} 
                                        onChange={e => setEditModal(prev => ({...prev, data: {...prev.data, required_quantity: e.target.value}}))}
                                        className="w-full px-3 py-2 bg-[#0f172a] text-white border border-gray-700 rounded-lg outline-none focus:ring-1 focus:ring-emerald-500"
                                        min="1"
                                        required
                                    />
                                </div>
                                <div className="mt-6 flex justify-end gap-3">
                                    <button type="button" onClick={() => setEditModal({isOpen: false, data: null})} className="px-4 py-2 text-sm text-gray-400 hover:text-white">Cancel</button>
                                    <button type="submit" className="px-4 py-2 text-sm bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg">Save Changes</button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default NGOView;
