import { createContext, useState } from 'react';
import { useNavigate } from 'react-router-dom';

export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const navigate = useNavigate();

    const [user, setUser] = useState(() => {
        const token = localStorage.getItem('token');
        const storedUser = localStorage.getItem('user');

        if (token && storedUser) {
            try {
                return JSON.parse(storedUser);
            } catch (error) {
                console.error('Failed to parse stored user:', error);

                localStorage.removeItem('token');
                localStorage.removeItem('user');
            }
        }

        return null;
    });

    const login = (userData, token) => {
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(userData));

        setUser(userData);

        navigate(`/${userData.role.toLowerCase()}/dashboard`, {
            replace: true
        });
    };

    const logout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');

        setUser(null);

        navigate('/', {
            replace: true
        });
    };

    return (
        <AuthContext.Provider value={{ user, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
};