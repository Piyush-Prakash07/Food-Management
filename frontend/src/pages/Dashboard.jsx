import { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { Navigate } from 'react-router-dom';

// Import distinct role views
import DonorView from '../components/dashboards/DonorView';
import NGOView from '../components/dashboards/NGOView';
import AdminView from '../components/dashboards/AdminView';
import VolunteerView from '../components/dashboards/VolunteerView';

const Dashboard = () => {
    const { user } = useContext(AuthContext);

    if (!user) {
        return <Navigate to="/login" replace />;
    }

    const renderDashboard = () => {
        switch (user.role) {
            case 'Donor':
                return <DonorView />;
            case 'NGO':
                return <NGOView />;
            case 'Admin':
                return <AdminView />;
            case 'Volunteer':
                return <VolunteerView />;
            default:
                return <div>Invalid Role</div>;
        }
    };

    return (
        <div className="animate-in fade-in duration-500">
            {renderDashboard()}
        </div>
    );
};

export default Dashboard;
