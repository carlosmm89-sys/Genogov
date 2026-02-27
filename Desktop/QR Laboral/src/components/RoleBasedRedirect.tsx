import { Navigate } from 'react-router-dom';
import { useAuth } from '../stores/AuthContext';

export const RoleBasedRedirect: React.FC = () => {
    const { user, isLoading } = useAuth();

    if (isLoading) {
        return <div className="flex items-center justify-center h-screen">
            <div className="text-gray-500">Cargando...</div>
        </div>;
    }

    if (!user) {
        return <Navigate to="/login" replace />;
    }

    // Redirect based on role
    if (user.role === 'admin') {
        return <Navigate to="/dashboard" replace />;
    }

    // Default redirect for employees
    return <Navigate to="/tracker" replace />;
};
