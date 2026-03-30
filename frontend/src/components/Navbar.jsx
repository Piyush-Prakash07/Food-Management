import { useContext } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { Utensils, LogOut, User } from 'lucide-react';

const Navbar = () => {
    const { user, logout } = useContext(AuthContext);

    return (
        <nav className="bg-gray-900 shadow-sm border-b border-gray-800">
            <div className="container mx-auto px-4 py-3 flex justify-between items-center">
                <Link to="/" className="flex items-center gap-2 text-emerald-500 hover:text-emerald-400 transition">
                    <Utensils size={28} strokeWidth={2.5} />
                    <span className="font-bold text-xl tracking-tight text-white">FoodShare</span>
                </Link>

                <div className="flex items-center gap-6">
                    {user ? (
                        <>
                            <span className="text-gray-300 font-medium flex items-center gap-2">
                                <User size={16} />
                                {user.name}
                            </span>
                            <Link to={`/${user.role.toLowerCase()}/dashboard`} className="text-gray-400 hover:text-emerald-500 font-medium transition">
                                Dashboard
                            </Link>
                            <button
                                onClick={logout}
                                className="flex items-center gap-2 text-gray-400 hover:text-white transition font-medium"
                            >
                                <LogOut size={18} />
                                Logout
                            </button>
                        </>
                    ) : (
                        <Link
                            to="/login"
                            className="bg-emerald-500 hover:bg-emerald-600 text-white px-5 py-2 rounded-lg font-medium transition shadow-sm"
                        >
                            Sign In
                        </Link>
                    )}
                </div>
            </div>
        </nav>
    );
};

export default Navbar;
