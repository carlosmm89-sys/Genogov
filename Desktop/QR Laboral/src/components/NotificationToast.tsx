import React, { useEffect } from 'react';
import { CheckCircle, XCircle, X } from 'lucide-react';

export type NotificationType = 'success' | 'error';

interface NotificationToastProps {
    message: string | null;
    type: NotificationType;
    onClose: () => void;
}

export const NotificationToast: React.FC<NotificationToastProps> = ({ message, type, onClose }) => {
    useEffect(() => {
        if (message) {
            const timer = setTimeout(() => {
                onClose();
            }, 3000);
            return () => clearTimeout(timer);
        }
    }, [message, onClose]);

    if (!message) return null;

    return (
        <div className="fixed top-6 right-6 z-50 animate-in fade-in slide-in-from-top-4 duration-300">
            <div className={`flex items-center gap-4 px-6 py-4 rounded-xl shadow-2xl border ${type === 'success'
                ? 'bg-white border-emerald-100 text-slate-800'
                : 'bg-white border-rose-100 text-slate-800'
                }`}>
                <div className={`p-2 rounded-full ${type === 'success' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                    {type === 'success' ? <CheckCircle size={20} /> : <XCircle size={20} />}
                </div>

                <div className="flex-1">
                    <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-0.5">
                        {type === 'success' ? 'Éxito' : 'Error'}
                    </p>
                    <p className="text-sm font-semibold text-slate-700">{message}</p>
                </div>

                <button
                    onClick={onClose}
                    className="p-1 hover:bg-slate-100 rounded-lg transition-colors text-slate-400"
                >
                    <X size={16} />
                </button>
            </div>
        </div>
    );
};
