import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { Users, UserCog, ClipboardList, BookOpen } from 'lucide-react';
import api from '../../api/axios';

const UserDirectory = () => {
    const [users, setUsers] = useState({ donors: [], ngos: [], volunteers: [] });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchDirectory = async () => {
            try {
                const res = await api.get('/api/users/directory');
                setUsers({
                    donors: res.data.donors || [],
                    ngos: res.data.ngos || [],
                    volunteers: res.data.volunteers || []
                });
            } catch (err) {
                toast.error('Failed to load community directory');
            } finally {
                setLoading(false);
            }
        };
        fetchDirectory();
    }, []);

    if (loading) {
        return <div className="p-8 text-center text-gray-500 animate-pulse">Loading directory...</div>;
    }

    return (
        <div className="bg-[#111827] p-6 md:p-8 rounded-2xl shadow-sm border border-gray-800 mt-8">
            <div className="flex items-center gap-3 mb-8">
                <div className="p-2.5 bg-indigo-900/30 text-indigo-400 rounded-xl">
                    <BookOpen size={24} />
                </div>
                <div>
                    <h2 className="text-xl font-bold text-white">Community Directory</h2>
                    <p className="text-sm text-gray-400">Find other Donors, NGOs, and Volunteers in your area</p>
                </div>
            </div>

            <div className="grid lg:grid-cols-3 gap-6">
                {/* Donors List */}
                <div className="space-y-4">
                    <h3 className="text-md font-bold text-emerald-400 flex items-center gap-2 border-b border-gray-800 pb-2">
                        <Users size={18} /> Donors ({users.donors.length})
                    </h3>
                    <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                        {users.donors.map(donor => (
                            <div key={donor.id} className="p-3 bg-gray-800/30 rounded-xl border border-gray-800/50">
                                <div className="font-semibold text-gray-200 text-sm">{donor.name}</div>
                                <div className="text-xs text-gray-500 mt-1 flex justify-between">
                                    <span>{donor.city || 'City varies'}</span>
                                    <span>Joined {new Date(donor.createdAt).getFullYear()}</span>
                                </div>
                            </div>
                        ))}
                        {users.donors.length === 0 && <p className="text-xs text-gray-600">No active donors yet.</p>}
                    </div>
                </div>

                {/* NGOs List */}
                <div className="space-y-4">
                    <h3 className="text-md font-bold text-blue-400 flex items-center gap-2 border-b border-gray-800 pb-2">
                        <UserCog size={18} /> NGOs ({users.ngos.length})
                    </h3>
                    <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                        {users.ngos.map(ngo => (
                            <div key={ngo.id} className="p-3 bg-gray-800/30 rounded-xl border border-gray-800/50">
                                <div className="font-semibold text-gray-200 text-sm">{ngo.name}</div>
                                <div className="text-xs text-gray-500 mt-1 flex flex-col gap-0.5">
                                    <span>📍 {ngo.city || 'City varies'}</span>
                                    {ngo.phone && <span>📞 {ngo.phone}</span>}
                                </div>
                            </div>
                        ))}
                        {users.ngos.length === 0 && <p className="text-xs text-gray-600">No active NGOs yet.</p>}
                    </div>
                </div>

                {/* Volunteers List */}
                <div className="space-y-4">
                    <h3 className="text-md font-bold text-purple-400 flex items-center gap-2 border-b border-gray-800 pb-2">
                        <ClipboardList size={18} /> Volunteers ({users.volunteers.length})
                    </h3>
                    <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                        {users.volunteers.map(vol => (
                            <div key={vol.id} className="p-3 bg-gray-800/30 rounded-xl border border-gray-800/50">
                                <div className="font-semibold text-gray-200 text-sm">{vol.name}</div>
                                <div className="text-xs text-gray-500 mt-1 flex justify-between">
                                    <span>{vol.city || 'Service area wide'}</span>
                                </div>
                            </div>
                        ))}
                        {users.volunteers.length === 0 && <p className="text-xs text-gray-600">No active volunteers yet.</p>}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default UserDirectory;
