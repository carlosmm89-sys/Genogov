import React, { useState, useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import { User } from './types';
import { db, supabase } from './services/supabaseService';
import LoginView from './views/LoginView';
import AdminDashboard from './views/AdminDashboard';
import { SuperAdminDashboardV2 } from './views/SuperAdminDashboardV2';
import EmployeePortal from './views/EmployeePortal';
import { PasswordResetModal } from './components/PasswordResetModal';
import { ImpersonationBanner } from './components/ImpersonationBanner';
import { ResetPasswordPage } from './views/ResetPasswordPage';

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [originalUser, setOriginalUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [showResetModal, setShowResetModal] = useState(false);

  useEffect(() => {
    // ⚡ CRITICAL: Check URL for recovery flow FIRST (synchronous, immediate)
    const isResetPasswordRoute = window.location.pathname === '/reset-password';
    const hashParams = new URLSearchParams(window.location.hash.substring(1));
    const queryType = new URLSearchParams(window.location.search).get('type');
    const hashType = hashParams.get('type');

    const isRecoveryFlow = isResetPasswordRoute || queryType === 'recovery' || hashType === 'recovery';

    if (isRecoveryFlow) {
      console.log("🔐 Recovery flow detected - showing modal immediately");
      setShowResetModal(true);
      setLoading(false);

      // Set up auth listener ONLY, skip getSession to avoid loading issues
      if (!supabase) return;

      const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
        console.log('Auth Event (Recovery Mode):', event);

        if (event === 'PASSWORD_RECOVERY') {
          setShowResetModal(true);
          setLoading(false);
        }

        // After password is updated, redirect to login
        if (event === 'USER_UPDATED') {
          console.log('Password updated, redirecting to login...');
          setTimeout(() => {
            window.location.href = '/';
          }, 2000);
        }
      });

      return () => {
        subscription.unsubscribe();
      };
    }

    // Normal flow (non-recovery)
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
        setLoading(false); // Force loading stop to show the modal
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

    // Timeout de seguridad para evitar carga infinita
    const safetyTimeout = setTimeout(() => {
      setLoading(current => {
        if (current) {
          console.warn("Loading timed out - forcing app render");
          return false;
        }
        return current;
      });
    }, 6000);

    return () => {
      subscription.unsubscribe();
      clearTimeout(safetyTimeout);
    };
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
      <div className="min-h-screen bg-[#1e1b4b] flex items-center justify-center text-white relative">
        <div className="flex flex-col items-center gap-6 p-8 bg-[#312e81] rounded-2xl shadow-2xl border border-indigo-500/30">
          <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
          <div className="text-center space-y-2">
            <p className="font-medium animate-pulse text-lg">Verificando Credenciales...</p>
            <p className="text-xs text-indigo-300">Esto puede tardar unos segundos</p>
          </div>

          {/* Botón de escape manual tras 2 segundos */}
          <button
            onClick={() => { setLoading(false); setCurrentUser(null); }}
            className="mt-4 text-xs bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-lg transition-colors border border-white/10 animate-in fade-in slide-in-from-bottom-4 duration-1000 fill-mode-forwards opacity-0"
            style={{ animationDelay: '3s', animationFillMode: 'forwards' }}
          >
            ¿Tarda demasiado? Ir al Login
          </button>
        </div>
      </div>
    );
  }

  const isImpersonating = !!originalUser;

  return (
    <Routes>
      <Route path="/reset-password" element={<ResetPasswordPage />} />
      <Route path="*" element={
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
      } />
    </Routes>
  );
};

export default App;
