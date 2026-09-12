import { useContext } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { Utensils, LogOut, User } from 'lucide-react';

const Navbar = () => {
    const { user, logout } = useContext(AuthContext);

    return (
        <nav className="bg-[#111827] sticky top-0 z-40 shadow-md border-b border-gray-800">
            <div className="w-full px-4 sm:px-8 lg:px-12 py-3.5 flex justify-between items-center">
                <Link to="/" className="flex items-center gap-2.5 text-emerald-400 hover:text-emerald-300 transition">
                    <Utensils size={26} strokeWidth={2.5} />
                    <span className="font-extrabold text-xl tracking-tight text-white">FoodShare</span>
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
