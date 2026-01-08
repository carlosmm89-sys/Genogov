
import React, { useState, useEffect } from 'react';
import { User } from './types';
import { db, supabase } from './services/supabaseService';
import LoginView from './views/LoginView';
import AdminDashboard from './views/AdminDashboard';
import EmployeePortal from './views/EmployeePortal';

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Escuchar cambios de sesión de Supabase
    if (!supabase) {
      setLoading(false);
      return;
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        // Cargar perfil completo
        db.getProfile(session.user.id).then(user => {
          setCurrentUser(user);
          setLoading(false);
        });
      } else {
        setLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        db.getProfile(session.user.id).then(setCurrentUser);
      } else {
        setCurrentUser(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleLogin = (user: User) => {
    setCurrentUser(user);
    // No necesitamos actualizar localStorage manualmente, Supabase lo maneja
  };

  const handleLogout = async () => {
    if (supabase) await supabase.auth.signOut();
    setCurrentUser(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#1e1b4b] flex items-center justify-center text-white">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="font-medium animate-pulse">Cargando Sistema...</p>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return <LoginView onLogin={handleLogin} />;
  }

  return currentUser.role === 'ADMIN' ? (
    <AdminDashboard user={currentUser} onLogout={handleLogout} />
  ) : (
    <EmployeePortal user={currentUser} onLogout={handleLogout} />
  );
};

export default App;
