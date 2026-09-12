import { useContext, useState, useEffect } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import api from '../api/axios';
import { toast } from 'react-toastify';
import { LogIn } from 'lucide-react';
import { GoogleLogin } from '@react-oauth/google';

const Login = () => {
    const { login, user } = useContext(AuthContext);
    const navigate = useNavigate();
    const [formData, setFormData] = useState({ email: '', password: '' });
    const [loading, setLoading] = useState(false);
    const [isLoginMode, setIsLoginMode] = useState(true);
    const [adminExists, setAdminExists] = useState(false);

    useEffect(() => {
        if (user && user.role) {
            navigate(`/${user.role.toLowerCase()}/dashboard`, { replace: true });
        }
    }, [user, navigate]);

    useEffect(() => {
        const checkAdminStatus = async () => {
            try {
                const res = await api.get('/api/auth/admin-status');
                setAdminExists(res.data.adminExists);
            } catch {
                // Ignore failure, fallback to false
            }
        };
        checkAdminStatus();
    }, [isLoginMode]);

    // Added fields for registration
    const [regData, setRegData] = useState({ name: '', role: 'Donor', phone: '', city: '' });

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        const email = formData.email.trim();
        const password = formData.password;

        try {
            if (isLoginMode) {
                // Real Backend Login
                const response = await api.post('/api/auth/login', {
                    email,
                    password
                });
                toast.success(`Welcome back, ${response.data.user.name}!`);
                login(response.data.user, response.data.token);
            } else {
                // Real Backend Registration
                const response = await api.post('/api/auth/register', {
                    name: regData.name.trim(),
                    email,
                    password,
                    role: regData.role,
                    phone: regData.phone.trim(),
                    city: regData.city.trim()
                });
                
                if (response.data.token && response.data.user) {
                    toast.success(`Welcome to FoodShare, ${response.data.user.name}!`);
                    login(response.data.user, response.data.token);
                } else {
                    toast.success('Registration successful! Please sign in.');
                    setIsLoginMode(true);
                }
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'Authentication failed. Please check your credentials.');
        } finally {
            setLoading(false);
        }
    };

    const onGoogleSuccess = async (credentialResponse) => {
        try {
            setLoading(true);
            const res = await api.post('/api/auth/google', {
                credential: credentialResponse.credential,
                role: !isLoginMode ? regData.role : 'Donor', // use selected role if signing up, else default Donor
                phone: !isLoginMode ? regData.phone : 'N/A',
                city: !isLoginMode ? regData.city : 'N/A'
            });
            toast.success(`Welcome via Google, ${res.data.user.name}!`);
            login(res.data.user, res.data.token);
        } catch (error) {
            toast.error(error.response?.data?.message || 'Google Auth Failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex justify-center items-center flex-1 py-10 px-4">
            <div className="bg-[#111827] p-8 md:p-10 rounded-2xl shadow-2xl w-full max-w-md border border-gray-800 my-auto overflow-y-auto max-h-[90vh] custom-scrollbar">
                <div className="text-center mb-8">
                    <div className="inline-block p-1 text-emerald-500 mb-2">
                        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                        </svg>
                    </div>
                    <h2 className="text-2xl font-bold text-white tracking-tight">
                        {isLoginMode ? 'Welcome Back' : 'Create Account'}
                    </h2>
                    <p className="text-sm text-gray-400 mt-2">
                        {isLoginMode ? 'Sign in to your FoodShare account' : 'Join FoodShare and make a difference'}
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                    {!isLoginMode && (
                        <>
                            <div>
                                <label className="block text-sm font-semibold text-gray-300 mb-1.5">Full Name</label>
                                <input
                                    type="text"
                                    required
                                    className="w-full px-4 py-3 bg-[#0f172a] text-white border border-gray-700 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-colors"
                                    placeholder="John Doe"
                                    value={regData.name}
                                    onChange={(e) => setRegData({ ...regData, name: e.target.value })}
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-300 mb-1.5">Phone Number</label>
                                    <input
                                        type="tel"
                                        required
                                        className="w-full px-4 py-3 bg-[#0f172a] text-white border border-gray-700 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-colors"
                                        placeholder="+1 234 567 890"
                                        value={regData.phone}
                                        onChange={(e) => setRegData({ ...regData, phone: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-300 mb-1.5">City / Location</label>
                                    <input
                                        type="text"
                                        required
                                        className="w-full px-4 py-3 bg-[#0f172a] text-white border border-gray-700 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-colors"
                                        placeholder="e.g. Delhi, Mumbai, Bengaluru, Patna"
                                        value={regData.city}
                                        onChange={(e) => setRegData({ ...regData, city: e.target.value })}
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-300 mb-1.5">Role</label>
                                <select
                                    className="w-full px-4 py-3 bg-[#0f172a] text-white border border-gray-700 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none appearance-none"
                                    value={regData.role}
                                    onChange={(e) => setRegData({ ...regData, role: e.target.value })}
                                >
                                    <option value="Donor">Donor</option>
                                    <option value="NGO">NGO (Receiver)</option>
                                    <option value="Volunteer">Volunteer</option>
                                </select>
                            </div>
                        </>
                    )}

                    <div>
                        <label className="block text-sm font-semibold text-gray-300 mb-1.5">Email</label>
                        <input
                            type="email"
                            required
                            className="w-full px-4 py-3 bg-[#e2e8f0] text-gray-900 border border-transparent rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-colors"
                            placeholder="you@example.com"
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-gray-300 mb-1.5">Password</label>
                        <input
                            type="password"
                            required
                            className="w-full px-4 py-3 bg-[#e2e8f0] text-gray-900 border border-transparent rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-colors"
                            placeholder="••••••••"
                            value={formData.password}
                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-[#10b981] hover:bg-[#059669] text-white font-semibold py-3 px-4 rounded-xl transition-colors flex justify-center items-center disabled:opacity-50 mt-2"
                    >
                        {loading ? (
                            <svg className="animate-spin h-5 w-5 mr-3 text-white" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                        ) : isLoginMode ? 'Sign In' : 'Create Account'}
                    </button>

                    <div className="relative flex items-center py-2">
                        <div className="flex-grow border-t border-gray-800"></div>
                        <span className="flex-shrink-0 mx-4 text-gray-500 text-xs font-semibold uppercase tracking-wider">
                            {isLoginMode ? 'OR CONTINUE WITH' : 'OR SIGN UP WITH'}
                        </span>
                        <div className="flex-grow border-t border-gray-800"></div>
                    </div>

                    {/* Use Google OAuth Library Component */}
                    <div className="flex justify-center mt-2 w-full">
                        <GoogleLogin
                            onSuccess={onGoogleSuccess}
                            onError={() => toast.error('Google Sign-In Failed')}
                            theme="filled_black"
                            width="100%"
                            text={isLoginMode ? "signin_with" : "signup_with"}
                            shape="pill"
                        />
                    </div>

                </form>

                <div className="mt-6 text-center text-sm text-gray-500">
                    {isLoginMode ? "Don't have an account? " : "Already have an account? "}
                    <button
                        type="button"
                        onClick={() => setIsLoginMode(!isLoginMode)}
                        className="text-emerald-500 hover:text-emerald-400 font-semibold transition"
                    >
                        {isLoginMode ? "Sign up" : "Sign in"}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Login;
