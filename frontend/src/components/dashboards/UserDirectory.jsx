import React, { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import {
    Users,
    UserCog,
    ClipboardList,
    BookOpen,
    RefreshCw,
    MapPin,
    Phone
} from 'lucide-react';
import api from '../../api/axios';

const UserDirectory = () => {
    const [users, setUsers] = useState({
        donors: [],
        ngos: [],
        volunteers: []
    });

    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const fetchDirectory = async (isRefresh = false) => {
        try {
            if (isRefresh) {
                setRefreshing(true);
            } else {
                setLoading(true);
            }

            const res = await api.get('/api/users/directory');

            setUsers({
                donors: Array.isArray(res.data?.donors)
                    ? res.data.donors
                    : [],
                ngos: Array.isArray(res.data?.ngos)
                    ? res.data.ngos
                    : [],
                volunteers: Array.isArray(res.data?.volunteers)
                    ? res.data.volunteers
                    : []
            });
        } catch (err) {
            console.error('Directory loading error:', err);
            toast.error(
                err.response?.data?.message ||
                'Failed to load community directory'
            );

            setUsers({
                donors: [],
                ngos: [],
                volunteers: []
            });
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchDirectory();
    }, []);

    const getJoinedYear = (createdAt) => {
        if (!createdAt) return 'Recently';

        const date = new Date(createdAt);

        if (Number.isNaN(date.getTime())) {
            return 'Recently';
        }

        return date.getFullYear();
    };

    const UserCard = ({
        user,
        type
    }) => {
        return (
            <div className="p-4 bg-[#0f172a] rounded-xl border border-gray-800 hover:border-gray-700 transition">
                <div className="font-semibold text-gray-200 text-sm truncate">
                    {user.name || 'Unknown User'}
                </div>

                <div className="text-xs text-gray-500 mt-2 space-y-1">
                    <div className="flex items-center gap-1.5">
                        <MapPin size={13} />
                        <span>
                            {user.city ||
                                (type === 'volunteer'
                                    ? 'Service area wide'
                                    : 'City varies')}
                        </span>
                    </div>

                    {type === 'ngo' && user.phone && (
                        <div className="flex items-center gap-1.5">
                            <Phone size={13} />
                            <span>{user.phone}</span>
                        </div>
                    )}

                    {type === 'donor' && (
                        <div className="text-gray-600 pt-1">
                            Joined {getJoinedYear(user.createdAt)}
                        </div>
                    )}
                </div>
            </div>
        );
    };

    if (loading) {
        return (
            <div className="bg-[#111827] p-8 rounded-2xl shadow-sm border border-gray-800 mt-8">
                <div className="flex flex-col items-center justify-center py-16">
                    <RefreshCw
                        size={28}
                        className="text-emerald-400 animate-spin mb-4"
                    />

                    <p className="text-gray-400 text-sm">
                        Loading community directory...
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-[#111827] p-6 md:p-8 rounded-2xl shadow-sm border border-gray-800 mt-8">

            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
                <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-indigo-900/30 text-indigo-400 rounded-xl">
                        <BookOpen size={24} />
                    </div>

                    <div>
                        <h2 className="text-xl font-bold text-white">
                            Community Directory
                        </h2>

                        <p className="text-sm text-gray-400">
                            Find Donors, NGOs, and Volunteers in your community
                        </p>
                    </div>
                </div>

                <button
                    onClick={() => fetchDirectory(true)}
                    disabled={refreshing}
                    className="flex items-center justify-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 disabled:opacity-50 text-gray-300 hover:text-white rounded-lg text-sm font-medium transition"
                >
                    <RefreshCw
                        size={16}
                        className={refreshing ? 'animate-spin' : ''}
                    />

                    {refreshing ? 'Refreshing...' : 'Refresh'}
                </button>
            </div>

            {/* Directory Lists */}
            <div className="grid lg:grid-cols-3 gap-6">

                {/* Donors */}
                <div className="space-y-4">
                    <h3 className="text-md font-bold text-emerald-400 flex items-center gap-2 border-b border-gray-800 pb-3">
                        <Users size={18} />

                        Donors ({users.donors.length})
                    </h3>

                    <div className="space-y-3 max-h-[350px] overflow-y-auto pr-2 custom-scrollbar">
                        {users.donors.length > 0 ? (
                            users.donors.map((donor) => (
                                <UserCard
                                    key={donor.id}
                                    user={donor}
                                    type="donor"
                                />
                            ))
                        ) : (
                            <div className="text-center py-8 text-xs text-gray-600">
                                No active donors yet.
                            </div>
                        )}
                    </div>
                </div>

                {/* NGOs */}
                <div className="space-y-4">
                    <h3 className="text-md font-bold text-blue-400 flex items-center gap-2 border-b border-gray-800 pb-3">
                        <UserCog size={18} />

                        NGOs ({users.ngos.length})
                    </h3>

                    <div className="space-y-3 max-h-[350px] overflow-y-auto pr-2 custom-scrollbar">
                        {users.ngos.length > 0 ? (
                            users.ngos.map((ngo) => (
                                <UserCard
                                    key={ngo.id}
                                    user={ngo}
                                    type="ngo"
                                />
                            ))
                        ) : (
                            <div className="text-center py-8 text-xs text-gray-600">
                                No active NGOs yet.
                            </div>
                        )}
                    </div>
                </div>

                {/* Volunteers */}
                <div className="space-y-4">
                    <h3 className="text-md font-bold text-purple-400 flex items-center gap-2 border-b border-gray-800 pb-3">
                        <ClipboardList size={18} />

                        Volunteers ({users.volunteers.length})
                    </h3>

                    <div className="space-y-3 max-h-[350px] overflow-y-auto pr-2 custom-scrollbar">
                        {users.volunteers.length > 0 ? (
                            users.volunteers.map((volunteer) => (
                                <UserCard
                                    key={volunteer.id}
                                    user={volunteer}
                                    type="volunteer"
                                />
                            ))
                        ) : (
                            <div className="text-center py-8 text-xs text-gray-600">
                                No active volunteers yet.
                            </div>
                        )}
                    </div>
                </div>

            </div>

            {/* Summary */}
            <div className="mt-8 pt-6 border-t border-gray-800 grid grid-cols-1 sm:grid-cols-3 gap-4">

                <div className="bg-[#0f172a] border border-gray-800 rounded-xl p-4 text-center">
                    <div className="text-2xl font-bold text-emerald-400">
                        {users.donors.length}
                    </div>

                    <div className="text-xs text-gray-500 mt-1">
                        Active Donors
                    </div>
                </div>

                <div className="bg-[#0f172a] border border-gray-800 rounded-xl p-4 text-center">
                    <div className="text-2xl font-bold text-blue-400">
                        {users.ngos.length}
                    </div>

                    <div className="text-xs text-gray-500 mt-1">
                        Registered NGOs
                    </div>
                </div>

                <div className="bg-[#0f172a] border border-gray-800 rounded-xl p-4 text-center">
                    <div className="text-2xl font-bold text-purple-400">
                        {users.volunteers.length}
                    </div>

                    <div className="text-xs text-gray-500 mt-1">
                        Available Volunteers
                    </div>
                </div>

            </div>
        </div>
    );
};

export default UserDirectory;