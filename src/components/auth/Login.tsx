import React, { useState } from 'react';
import type { Plan } from '@/types';
import Logo from '@components/ui/Logo';
import { apiService } from '@/services/api';
import { useToast } from '@/contexts/ToastContext';

type AuthView = 'login' | 'signup' | 'forgot';

const Login: React.FC = () => {
    const [view, setView] = useState<AuthView>('login');
    const [isLoading, setIsLoading] = useState(false);
    const { addToast } = useToast();

    // Login State
    const [loginEmail, setLoginEmail] = useState('');
    const [loginPassword, setLoginPassword] = useState('');
    const [rememberMe, setRememberMe] = useState(false);
    const [loginError, setLoginError] = useState('');

    // Signup State
    const [signupData, setSignupData] = useState({
        nombreEmpresa: '',
        nit: '',
        email: '',
        password: '',
        plan: 'freemium' as Plan
    });
    const [signupError, setSignupError] = useState('');
    
    // Forgot Password State
    const [forgotEmail, setForgotEmail] = useState('');

    const handleLoginSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (isLoading) return;
        setLoginError('');
        setIsLoading(true);
        try {
            // The apiService.login will now throw an error on failure,
            // which we catch below. Success is handled by the onAuthStateChange listener in App.tsx
            await apiService.login(loginEmail, loginPassword);
        } catch (err: any) {
            if (err.message && err.message.toLowerCase().includes('email not confirmed')) {
                setLoginError('Email no confirmado. Por favor, revisa tu bandeja de entrada para el enlace de activación.');
            } else if (err.message && err.message.toLowerCase().includes('invalid login credentials')) {
                setLoginError('Email o contraseña incorrectos.');
            } else {
                setLoginError('Error de red. Por favor, revisa tu conexión e inténtalo de nuevo.');
                console.error('Login error:', err.message);
            }
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleSignupSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSignupError('');
        setIsLoading(true);
        try {
            await apiService.signupUser(signupData);
            addToast('¡Registro exitoso! Por favor, revisa tu email para confirmar tu cuenta.', 'success');
            setView('login');
        } catch (err: any) {
            if (err.message && (err.message.toLowerCase().includes('user already registered') || err.message.toLowerCase().includes('already exists'))) {
                setSignupError('Este email ya está registrado. Intenta iniciar sesión.');
            } else {
                setSignupError('Ocurrió un error en el registro. Inténtalo de nuevo.');
            }
            console.error('Signup error:', err.message);
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleForgotSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            const { error } = await apiService.sendPasswordReset(forgotEmail);
            if (error) {
                addToast(error.message, 'error');
            } else {
                addToast(`Si existe una cuenta, se ha enviado un email de recuperación a ${forgotEmail}.`, 'info');
                setView('login');
            }
        } catch (err) {
            addToast('Ocurrió un error al enviar el email de recuperación.', 'error');
        } finally {
            setIsLoading(false);
        }
    };

    const renderLogin = () => (
         <form onSubmit={handleLoginSubmit} className="space-y-4">
            {loginError && <p className="text-center text-red-500 bg-red-100 p-3 rounded-lg text-sm">{loginError}</p>}
            <div>
              <label htmlFor="login-email" className="sr-only">Email</label>
              <input id="login-email" name="email" type="email" placeholder="tu@empresa.com" value={loginEmail} onChange={e => setLoginEmail(e.target.value)} required className="form-control" />
            </div>
            <div>
                <label htmlFor="login-password" className="sr-only">Contraseña</label>
                <input id="login-password" name="password" type="password" placeholder="••••••••" value={loginPassword} onChange={e => setLoginPassword(e.target.value)} required className="form-control" />
            </div>
            <div className="flex items-center justify-between text-sm">
                <label htmlFor="remember-me" className="flex items-center text-text-secondary-light dark:text-text-secondary-dark cursor-pointer">
                    <input id="remember-me" name="rememberMe" type="checkbox" checked={rememberMe} onChange={(e) => setRememberMe(e.target.checked)} className="h-4 w-4 rounded border-border-light text-brand-primary focus:ring-brand-primary" />
                    <span className="ml-2">Recuérdame</span>
                </label>
                <button type="button" onClick={() => setView('forgot')} className="font-medium text-brand-primary hover:underline">¿Olvidaste la contraseña?</button>
            </div>
            <button type="submit" disabled={isLoading} className="w-full bg-brand-primary text-white py-2.5 rounded-lg font-semibold hover:bg-brand-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-primary disabled:bg-opacity-50 flex justify-center">
                {isLoading ? 'Ingresando...' : 'Iniciar Sesión'}
            </button>
        </form>
    );
    
    const renderSignup = () => (
         <form onSubmit={handleSignupSubmit} className="space-y-4">
             {signupError && <p className="text-center text-red-500 bg-red-100 p-3 rounded-lg text-sm">{signupError}</p>}
            <input id="signup-nombre" name="nombreEmpresa" placeholder="Nombre de la Empresa" value={signupData.nombreEmpresa} onChange={e => setSignupData({...signupData, nombreEmpresa: e.target.value})} required className="form-control" />
            <input id="signup-nit" name="nit" placeholder="NIT" value={signupData.nit} onChange={e => setSignupData({...signupData, nit: e.target.value})} required className="form-control" />
            <input id="signup-email" name="email" type="email" placeholder="Email de la Empresa" value={signupData.email} onChange={e => setSignupData({...signupData, email: e.target.value})} required className="form-control" />
            <input id="signup-password" name="password" type="password" placeholder="Crear Contraseña" value={signupData.password} onChange={e => setSignupData({...signupData, password: e.target.value})} required className="form-control" />
             <div>
                <label htmlFor="signup-plan" className="sr-only">Seleccionar Plan</label>
                <select 
                    id="signup-plan"
                    name="plan"
                    value={signupData.plan} 
                    onChange={e => setSignupData({...signupData, plan: e.target.value as Plan})} 
                    required 
                    className="form-control"
                >
                    <option value="freemium">Plan Freemium</option>
                    <option value="basico">Plan Básico</option>
                    <option value="profesional">Plan Profesional</option>
                    <option value="empresarial">Plan Empresarial</option>
                </select>
            </div>
             <button type="submit" disabled={isLoading} className="w-full bg-brand-primary text-white py-2.5 rounded-lg font-semibold hover:bg-brand-primary-dark disabled:bg-opacity-50 flex justify-center">
                {isLoading ? 'Creando cuenta...' : 'Crear Cuenta'}
            </button>
        </form>
    );

    const renderForgot = () => (
         <form onSubmit={handleForgotSubmit} className="space-y-4">
             <p className="text-sm text-center text-text-secondary-light dark:text-text-secondary-dark">Ingresa tu email y te enviaremos un enlace para restablecer tu contraseña.</p>
             <div>
                <label htmlFor="forgot-email" className="sr-only">Email</label>
                <input id="forgot-email" name="email" type="email" placeholder="tu@empresa.com" value={forgotEmail} onChange={e => setForgotEmail(e.target.value)} required className="form-control" />
             </div>
             <button type="submit" disabled={isLoading} className="w-full bg-brand-primary text-white py-2.5 rounded-lg font-semibold hover:bg-brand-primary-dark disabled:bg-opacity-50 flex justify-center">
                {isLoading ? 'Enviando...' : 'Enviar Email de Recuperación'}
            </button>
        </form>
    );
    
    return (
        <div className="min-h-screen bg-background-light dark:bg-background-dark flex flex-col justify-center items-center p-4">
            <div className="w-full max-w-md">
                <div className="text-center mb-8">
                    <Logo className="justify-center" />
                    <h1 className="mt-4 text-3xl font-bold text-text-primary-light dark:text-text-primary-dark"></h1>
                </div>
                
                <div className="bg-card-light dark:bg-card-dark p-8 rounded-2xl shadow-lg">
                    <div className="flex justify-center border-b border-border-light dark:border-border-dark mb-6">
                        <button onClick={() => setView('login')} className={`py-2 px-4 text-sm font-medium transition-colors ${view === 'login' ? 'border-b-2 border-brand-primary text-brand-primary' : 'text-text-secondary-light dark:text-text-secondary-dark'}`}>Iniciar Sesión</button>
                        <button onClick={() => setView('signup')} className={`py-2 px-4 text-sm font-medium transition-colors ${view === 'signup' ? 'border-b-2 border-brand-primary text-brand-primary' : 'text-text-secondary-light dark:text-text-secondary-dark'}`}>Registrarse</button>
                    </div>
                    <div key={view} className="animate-fade-in">
                        {view === 'login' && renderLogin()}
                        {view === 'signup' && renderSignup()}
                        {view === 'forgot' && renderForgot()}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Login;
