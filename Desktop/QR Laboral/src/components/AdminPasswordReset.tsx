import React, { useState } from 'react';
import { Key, Save, X } from 'lucide-react';
import { supabase } from '../services/supabaseService';

interface AdminPasswordResetProps {
    userId: string;
    userEmail: string;
    onClose: () => void;
}

export const AdminPasswordReset: React.FC<AdminPasswordResetProps> = ({ userId, userEmail, onClose }) => {
    const [newPassword, setNewPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    const handleResetPassword = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setMessage(null);

        try {
            // Usar Admin API para actualizar contraseña directamente
            const { error } = await supabase.auth.admin.updateUserById(userId, {
                password: newPassword
            });

            if (error) {
                setMessage({ type: 'error', text: 'Error: ' + error.message });
            } else {
                setMessage({ type: 'success', text: '¡Contraseña actualizada correctamente!' });
                setTimeout(() => {
                    onClose();
                }, 2000);
            }
        } catch (err) {
            console.error('Error:', err);
            setMessage({
                type: 'error',
                text: 'Error al actualizar contraseña. Verifica que tengas permisos de administrador.'
            });
        }

        setLoading(false);
    };

    return (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl relative">
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 p-2 bg-slate-100 rounded-full hover:bg-slate-200 transition-colors"
                >
                    <X size={20} />
                </button>

                <div className="text-center mb-6">
                    <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Key className="text-indigo-600" size={32} />
                    </div>
                    <h3 className="text-xl font-bold text-slate-800">Restablecer Contraseña</h3>
                    <p className="text-sm text-slate-500 mt-2">{userEmail}</p>
                </div>

                <form onSubmit={handleResetPassword} className="space-y-4">
                    <div>
                        <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">
                            Nueva Contraseña
                        </label>
                        <input
                            type="text"
                            value={newPassword}
                            onChange={e => setNewPassword(e.target.value)}
                            className="w-full mt-2 px-4 py-3 bg-slate-50 border-2 border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500 transition-colors"
                            placeholder="Mínimo 6 caracteres"
                            required
                            minLength={6}
                        />
                    </div>

                    {message && (
                        <div className={`px-4 py-3 rounded-xl text-sm font-semibold ${message.type === 'error'
                                ? 'bg-red-50 text-red-600'
                                : 'bg-green-50 text-green-600'
                            }`}>
                            {message.text}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
                    >
                        {loading ? 'Actualizando...' : 'Actualizar Contraseña'}
                        <Save size={18} />
                    </button>
                </form>
            </div>
        </div>
    );
};
