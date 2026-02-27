import React, { useState } from 'react';
import { ShieldCheck, Eye, EyeOff, Save, X } from 'lucide-react';
import { supabase } from '../services/supabaseService';

interface PasswordResetModalProps {
    onClose: () => void;
    isOpen: boolean;
}

export const PasswordResetModal: React.FC<PasswordResetModalProps> = ({ onClose, isOpen }) => {
    const [newPassword, setNewPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    if (!isOpen) return null;

    const handleUpdatePassword = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setMessage(null);

        const { error } = await supabase.auth.updateUser({
            password: newPassword
        });

        if (error) {
            if (error.message.includes('different from the old password')) {
                setMessage({ type: 'error', text: 'Por seguridad, la nueva contraseña no puede ser igual a la anterior.' });
            } else {
                setMessage({ type: 'error', text: 'Error: ' + error.message });
            }
        } else {
            setMessage({ type: 'success', text: '¡Contraseña actualizada correctamente!' });
            setTimeout(() => {
                onClose();
                setMessage(null);
                setNewPassword('');
            }, 2000);
        }
        setLoading(false);
    };

    return (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-300">
            <div className="bg-white rounded-[2.5rem] p-10 max-w-md w-full shadow-2xl relative animate-in zoom-in-95 duration-300">
                <button
                    onClick={onClose}
                    className="absolute top-6 right-6 p-2 bg-slate-50 text-slate-400 rounded-full hover:bg-slate-100 transition-colors"
                >
                    <X size={20} />
                </button>

                <div className="text-center mb-8">
                    <div className="w-20 h-20 bg-indigo-50 rounded-full flex items-center justify-center mx-auto mb-6 text-indigo-600 shadow-inner">
                        <ShieldCheck size={40} />
                    </div>
                    <h3 className="text-2xl font-black text-slate-800 uppercase italic tracking-tighter">Nueva Contraseña</h3>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-2">Establece tu nueva clave de acceso</p>
                </div>

                <form onSubmit={handleUpdatePassword} className="space-y-6">
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Nueva Contraseña</label>
                        <div className="relative">
                            <input
                                type={showPassword ? 'text' : 'password'}
                                value={newPassword}
                                onChange={e => setNewPassword(e.target.value)}
                                className="w-full bg-slate-50 border-2 border-slate-100 rounded-[1.5rem] px-6 py-4 focus:outline-none focus:border-indigo-500 transition-all font-bold text-slate-700 pr-12"
                                placeholder="Mínimo 6 caracteres"
                                required
                                minLength={6}
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-indigo-600 transition-colors"
                            >
                                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                            </button>
                        </div>
                    </div>

                    {message && (
                        <div className={`px-6 py-4 rounded-[1.5rem] flex items-center gap-3 animate-in slide-in-from-top-2 ${message.type === 'error' ? 'bg-rose-50 text-rose-500' : 'bg-emerald-50 text-emerald-600'}`}>
                            <ShieldCheck size={20} />
                            <p className="text-xs font-black uppercase leading-tight">{message.text}</p>
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-4 rounded-[1.5rem] font-black uppercase tracking-widest flex items-center justify-center gap-3 shadow-xl transition-all active:scale-95 disabled:opacity-70 disabled:active:scale-100"
                    >
                        {loading ? 'Actualizando...' : 'Guardar Nueva Contraseña'} <Save size={18} />
                    </button>
                </form>
            </div>
        </div>
    );
};
