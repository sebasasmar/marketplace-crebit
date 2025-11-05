import React, { useState, useCallback, useEffect, useRef } from 'react';
import type { UserProfile, Empresa } from './types';
import type { Session } from '@supabase/supabase-js';
import Login from './components/auth/Login';
import AdminDashboard from './components/admin/AdminDashboard';
import EmpresaDashboard from './components/empresa/EmpresaDashboard';
import { apiService } from './services/api';
import { ToastProvider, useToast } from './contexts/ToastContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { supabase } from './services/supabase';

type AuthenticatedUser = UserProfile & { empresa?: Empresa | null };

const LoadingSpinner: React.FC = () => (
  <div className="flex items-center justify-center h-screen bg-background-light dark:bg-background-dark">
    <div className="animate-spin rounded-full h-32 w-32 border-t-4 border-b-4 border-brand-primary-dark"></div>
  </div>
);

const AppContent: React.FC = () => {
  const [user, setUser] = useState<AuthenticatedUser | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const { addToast } = useToast();
  const initialCheckCompleted = useRef(false);

  const processSession = useCallback(async (session: Session | null, event?: string) => {
    try {
      if (session?.user) {
        const profile = await apiService.getProfile(session.user.id);

        if (profile) {
          let finalUser: AuthenticatedUser = profile;
          if (profile.rol === 'empresa') {
            const empresaData = await apiService.getEmpresaForUser(profile.id);
            finalUser = { ...profile, empresa: empresaData };
          }
          setUser(finalUser);

          if (event === 'SIGNED_IN') {
            addToast(`¡Bienvenido de nuevo, ${profile.nombre}!`, 'success');
          }
        } else {
          addToast('No se pudo encontrar tu perfil. Por favor, contacta a soporte.', 'error');
          await apiService.logout();
          setUser(null);
        }
      } else {
        setUser(null);
      }
    } catch (error) {
      console.error("Error processing session:", (error as Error).message);
      addToast('Ocurrió un error al procesar tu sesión.', 'error');
      setUser(null);
    }
  }, [addToast]);

  useEffect(() => {
    const { data: authListener } = supabase.auth.onAuthStateChange(
      (event, session) => {
        // The listener fires immediately with an 'INITIAL_SESSION' event.
        // We process the session to determine if a user is logged in.
        processSession(session, event);

        // We only want to hide the main loading screen once, after this initial check is complete.
        if (!initialCheckCompleted.current) {
          setLoading(false);
          initialCheckCompleted.current = true;
        }
      }
    );

    // Cleanup subscription on component unmount.
    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [processSession]);


  const handleLogout = useCallback(async () => {
    await apiService.logout();
    // The onAuthStateChange listener will handle setting user to null.
    addToast('Sesión cerrada exitosamente.', 'info');
  }, [addToast]);

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!user) {
    return <Login />;
  }

  // Handle inconsistent state: user is 'empresa' but empresa data is missing
  if (user.rol === 'empresa' && !user.empresa) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-background-light dark:bg-background-dark p-4 text-center">
        <h1 className="text-2xl font-bold text-brand-danger mb-4">Error de Cuenta</h1>
        <p className="text-text-secondary-light dark:text-text-secondary-dark mb-6 max-w-md">
          Tu perfil de usuario está activo, pero no pudimos cargar los datos de tu empresa.
          Esto puede deberse a un problema durante el registro.
        </p>
        <p className="text-text-secondary-light dark:text-text-secondary-dark mb-6">
          Por favor, contacta a soporte para resolver este inconveniente.
        </p>
        <button
          onClick={handleLogout}
          className="bg-brand-primary text-white py-2 px-6 rounded-lg font-semibold hover:bg-brand-primary-dark"
        >
          Cerrar Sesión
        </button>
      </div>
    );
  }
  
  if (user.rol === 'admin') {
    return <AdminDashboard user={user} onLogout={handleLogout} />;
  }

  if (user.rol === 'empresa' && user.empresa) {
    return <EmpresaDashboard user={user as UserProfile & { empresa: Empresa }} onLogout={handleLogout} />;
  }

  // This fallback should not be reached with the new logic, but is a safe default.
  return <Login />;
}


function App() {
  return (
    <ThemeProvider>
      <ToastProvider>
        <AppContent />
      </ToastProvider>
    </ThemeProvider>
  );
}

export default App;
