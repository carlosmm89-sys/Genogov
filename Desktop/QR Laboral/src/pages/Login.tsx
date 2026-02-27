import React, { useState, useEffect } from 'react';
import { useAuth } from '../stores/AuthContext';
import { useNavigate } from 'react-router-dom';
import { QrCode, Mail, Lock, LogIn, CheckCircle2, Eye, EyeOff } from 'lucide-react';
import { clsx } from 'clsx';

import { Html5QrcodeScanner } from 'html5-qrcode';

export const Login: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'email' | 'qr'>('email');
    const [showPassword, setShowPassword] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [pin, setPin] = useState('');
    const [error, setError] = useState('');
    const { login, loginByPin } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        let scanner: Html5QrcodeScanner | null = null;
        if (activeTab === 'qr') {
            // Slight delay to ensure DOM is ready
            const timer = setTimeout(() => {
                scanner = new Html5QrcodeScanner(
                    "reader",
                    { fps: 10, qrbox: { width: 250, height: 250 } },
                    /* verbose= */ false
                );
                scanner.render(async (decodedText) => {
                    // Handle scan success
                    console.log("Scanned:", decodedText);
                    const success = await loginByPin(decodedText);
                    if (success) {
                        scanner?.clear();
                        navigate('/dashboard');
                    } else {
                        setError('Código QR no válido o usuario no encontrado');
                    }
                }, (_error) => {
                    console.error("Scanner error", _error);
                    // Handle scan failure (ignore for now as it triggers frequently)
                });
            }, 100);
            return () => {
                clearTimeout(timer);
                if (scanner) {
                    scanner.clear().catch(console.error);
                }
            };
        }
    }, [activeTab, loginByPin, navigate]);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        const success = await login(email, password);
        if (success) {
            navigate('/dashboard');
        } else {
            setError('Credenciales inválidas');
        }
    };

    const handlePinLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        const success = await loginByPin(pin);
        if (success) {
            navigate('/dashboard');
        } else {
            setError('PIN inválido (Prueba: 1234)');
        }
    };

    return (
        <div className="min-h-screen flex bg-gray-50">
            {/* Brand Side */}
            <div className="hidden lg:flex w-1/2 bg-indigo-900 relative overflow-hidden items-center justify-center">
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-600 to-purple-900 opacity-90" />
                <div className="relative z-10 text-white p-12 text-center">
                    <QrCode className="w-20 h-20 mx-auto mb-6 text-indigo-200" />
                    <h1 className="text-5xl font-bold mb-4 font-tracking-tight">QR Laboral</h1>
                    <p className="text-xl text-indigo-100 max-w-md mx-auto">
                        Gestión inteligente del control horario impulsada por Tonwy Tech.
                    </p>
                    <div className="mt-12 flex justify-center space-x-6 opacity-70">
                        <div className="flex flex-col items-center">
                            <CheckCircle2 className="mb-2" />
                            <span className="text-sm">Productividad</span>
                        </div>
                        <div className="flex flex-col items-center">
                            <QrCode className="mb-2" />
                            <span className="text-sm">Acceso Rápido</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Form Side */}
            <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
                <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
                    <div className="text-center mb-8 lg:hidden">
                        <h2 className="text-3xl font-bold text-gray-900">QR Laboral</h2>
                    </div>

                    <div className="flex mb-8 bg-gray-100 p-1 rounded-lg">
                        <button
                            onClick={() => setActiveTab('email')}
                            className={clsx(
                                "flex-1 flex items-center justify-center py-2 text-sm font-medium rounded-md transition-all duration-200",
                                activeTab === 'email' ? "bg-white text-indigo-600 shadow-sm" : "text-gray-500 hover:text-gray-700"
                            )}
                        >
                            <Mail className="w-4 h-4 mr-2" /> Credenciales
                        </button>
                        <button
                            onClick={() => setActiveTab('qr')}
                            className={clsx(
                                "flex-1 flex items-center justify-center py-2 text-sm font-medium rounded-md transition-all duration-200",
                                activeTab === 'qr' ? "bg-white text-indigo-600 shadow-sm" : "text-gray-500 hover:text-gray-700"
                            )}
                        >
                            <QrCode className="w-4 h-4 mr-2" /> Login QR / PIN
                        </button>
                    </div>

                    {error && (
                        <div className="mb-4 p-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-100">
                            {error}
                        </div>
                    )}

                    {activeTab === 'email' ? (
                        <form onSubmit={handleLogin} className="space-y-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Email Corporativo</label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-3 text-gray-400 w-5 h-5" />
                                    <input
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="pl-10 w-full bg-gray-50 border border-gray-200 rounded-lg py-2.5 px-4 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                                        placeholder="nombre@empresa.com"
                                        required
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Contraseña</label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-3 text-gray-400 w-5 h-5" />
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="pl-10 pr-10 w-full bg-gray-50 border border-gray-200 rounded-lg py-2.5 px-4 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                                        placeholder="Laboral2026*"
                                        required
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3 top-3 text-gray-400 hover:text-gray-600 focus:outline-none"
                                    >
                                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                    </button>
                                </div>
                            </div>
                            <button
                                type="submit"
                                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2.5 rounded-lg flex items-center justify-center transition-all shadow-lg hover:shadow-indigo-500/30"
                            >
                                <LogIn className="w-5 h-5 mr-2" /> Iniciar Sesión
                            </button>
                        </form>
                    ) : (
                        <div className="text-center">
                            {activeTab === 'qr' && (
                                <div id="reader" className="w-full max-w-[300px] mx-auto mb-4 overflow-hidden rounded-lg"></div>
                            )}
                            <p className="text-sm text-gray-500 mb-4">Escanea tu código de acceso</p>
                            <div className="relative mb-6">
                                <div className="absolute inset-0 flex items-center">
                                    <div className="w-full border-t border-gray-300" />
                                </div>
                                <div className="relative flex justify-center text-sm">
                                    <span className="bg-white px-2 text-gray-500">O ingresa tu PIN</span>
                                </div>
                            </div>
                            <form onSubmit={handlePinLogin} className="flex gap-2">
                                <input
                                    type="text"
                                    value={pin}
                                    onChange={(e) => setPin(e.target.value)}
                                    className="flex-1 bg-gray-50 border border-gray-200 rounded-lg py-2.5 px-4 text-center tracking-widest text-lg font-bold focus:ring-2 focus:ring-indigo-500 outline-none"
                                    placeholder="0000"
                                    maxLength={4}
                                    required
                                />
                                <button
                                    type="submit"
                                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 rounded-lg font-medium transition-all"
                                >
                                    Entrar
                                </button>
                            </form>
                        </div>
                    )}

                    <div className="mt-8 text-center">
                        <p className="text-xs text-gray-400">
                            Versión 1.0.0 &bull; Powered by Tonwy Tech
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};
