import React, { useState, useEffect } from 'react';
import { User } from './types';
import { db, supabase } from './services/supabaseService';
import LoginView from './views/LoginView';
import AdminDashboard from './views/AdminDashboard';
import { SuperAdminDashboardV2 } from './views/SuperAdminDashboardV2';
import EmployeePortal from './views/EmployeePortal';
import { PasswordResetModal } from './components/PasswordResetModal';
import { ImpersonationBanner } from './components/ImpersonationBanner';

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [originalUser, setOriginalUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [showResetModal, setShowResetModal] = useState(false);

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
          // --- Logic for Impersonation ---
          const impersonationTargetStr = localStorage.getItem('impersonation_target');
          let isImpersonating = false;

          if (impersonationTargetStr && user) { // Assuming if we have a user, we can try to impersonate
            try {
              const targetCompany = JSON.parse(impersonationTargetStr);
              // 1. Save original user ONLY if not already saved (though here we are mounting)
              setOriginalUser(user);

              // 2. Modify Current User Context
              user.role = 'ADMIN'; // Downgrade to ADMIN to see the AdminDashboard
              user.company_id = targetCompany.id;
              user.full_name = `SuperAdmin (simulando ${targetCompany.name})`;
              isImpersonating = true;

            } catch (e) {
              console.error("Error parsing impersonation target", e);
              localStorage.removeItem('impersonation_target');
            }
          }

          // Emergency Override for SuperAdmin (Fixing Refresh/Logout issue)
          if (!isImpersonating) { // ONLY applies if NOT impersonating
            if (!user && session.user.email === 'superadmin@qrlaboral.com') {
              user = {
                id: session.user.id,
                email: 'superadmin@qrlaboral.com',
                role: 'SUPERADMIN',
                company_id: '00000000-0000-0000-0000-000000000000',
                full_name: 'Super Admin',
                username: 'superadmin',
                department: 'Sistemas',
                position: 'Root',
                created_at: new Date().toISOString()
              } as User;
            }

            if (user && session.user.email === 'info@tonwy.com') {
              user.role = 'ADMIN'; // Emergency Override
            }
            if (user && session.user.email === 'superadmin@qrlaboral.com') {
              user.role = 'SUPERADMIN';
              user.company_id = '00000000-0000-0000-0000-000000000000'; // Force System Company
            }
          }

          setCurrentUser(user);
          setLoading(false);
        });
      } else {
        setLoading(false);
      }
    });

    // Detectar evento de recuperación de contraseña
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth Event:', event);

      if (event === 'PASSWORD_RECOVERY') {
        setShowResetModal(true);
      }

      if (session?.user) {
        db.getProfile(session.user.id).then(user => {

          // --- Logic for Impersonation (Copy for Auth Change) ---
          const impersonationTargetStr = localStorage.getItem('impersonation_target');
          let isImpersonating = false;

          if (impersonationTargetStr && user) {
            try {
              const targetCompany = JSON.parse(impersonationTargetStr);
              setOriginalUser(user);
              user.role = 'ADMIN';
              user.company_id = targetCompany.id;
              user.full_name = `SuperAdmin (simulando ${targetCompany.name})`;
              isImpersonating = true;
            } catch (e) {
              console.error("Error parsing impersonation target", e);
            }
          }

          if (!isImpersonating) {
            // Emergency Override for SuperAdmin (Fixing Refresh/Logout issue)
            if (!user && session.user.email === 'superadmin@qrlaboral.com') {
              user = {
                id: session.user.id,
                email: 'superadmin@qrlaboral.com',
                role: 'SUPERADMIN',
                company_id: '00000000-0000-0000-0000-000000000000',
                full_name: 'Super Admin',
                username: 'superadmin',
                department: 'Sistemas',
                position: 'Root',
                created_at: new Date().toISOString()
              } as User;
            }

            if (user && session.user.email === 'info@tonwy.com') {
              user.role = 'ADMIN'; // Emergency Override
            }
            if (user && session.user.email === 'superadmin@qrlaboral.com') {
              user.role = 'SUPERADMIN';
              user.company_id = '00000000-0000-0000-0000-000000000000'; // Force System Company
            }
          }
          setCurrentUser(user);
        });
      } else {
        setCurrentUser(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleLogin = (user: User) => {
    setCurrentUser(user);
  };

  const handleLogout = async () => {
    if (supabase) await supabase.auth.signOut();
    setCurrentUser(null);
    setOriginalUser(null); // Clear original user on logout
  };

  // New function for impersonation
  const handleImpersonate = (targetUser: User) => {
    if (!currentUser) return;
    if (!originalUser) {
      setOriginalUser(currentUser); // Save the real admin
    }
    setCurrentUser(targetUser);
  };

  // New function to stop impersonation
  const handleStopImpersonation = () => {
    localStorage.removeItem('impersonation_target');
    window.location.reload();
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

  const isImpersonating = !!originalUser;

  return (
    <div className={`min-h-screen bg-slate-50 ${isImpersonating ? 'pt-12' : ''}`}>
      {isImpersonating && (
        <ImpersonationBanner user={currentUser} onExit={handleStopImpersonation} />
      )}

      {!currentUser ? (
        <LoginView onLogin={handleLogin} />
      ) : currentUser.role === 'SUPERADMIN' ? (
        <SuperAdminDashboardV2
          user={currentUser}
          onLogout={handleLogout}
        />
      ) : currentUser.role === 'ADMIN' ? (
        <AdminDashboard
          user={currentUser}
          onLogout={handleLogout}
          onSwitchUser={handleImpersonate} // Updated to use handleImpersonate
        />
      ) : (
        <EmployeePortal user={currentUser} onLogout={handleLogout} />
      )}

      <PasswordResetModal isOpen={showResetModal} onClose={() => setShowResetModal(false)} />
    </div>
  );
};

export default App;
