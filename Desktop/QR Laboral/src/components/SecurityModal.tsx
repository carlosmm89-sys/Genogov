import React, { useState } from 'react';
import { AlertTriangle, Lock } from 'lucide-react';

interface SecurityModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    description: string;
    confirmKeyword?: string; // e.g. "ELIMINAR"
}

export const SecurityModal: React.FC<SecurityModalProps> = ({
    isOpen,
    onClose,
    onConfirm,
    title,
    description,
    confirmKeyword = "ELIMINAR"
}) => {
    const [input, setInput] = useState('');

    if (!isOpen) return null;

    const handleConfirm = () => {
        if (input === confirmKeyword) {
            onConfirm();
            onClose();
            setInput('');
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-xl shadow-2xl max-w-md w-full overflow-hidden border border-red-100 animate-in fade-in zoom-in duration-200">
                {/* Header */}
                <div className="bg-red-50 p-6 flex flex-col items-center justify-center text-center border-b border-red-100">
                    <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-3">
                        <AlertTriangle className="w-6 h-6 text-red-600" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900">{title}</h3>
                </div>

                {/* Content */}
                <div className="p-6">
                    <p className="text-sm text-gray-600 mb-6 text-center">
                        {description}
                    </p>

                    <div className="space-y-4">
                        <div className="relative">
                            <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase text-center">
                                Escribe <span className="text-red-600 font-bold">"{confirmKeyword}"</span> para confirmar
                            </label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-3 text-gray-400 w-4 h-4" />
                                <input
                                    type="text"
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none text-center font-bold tracking-widest uppercase"
                                    placeholder={confirmKeyword}
                                    autoFocus
                                />
                            </div>
                        </div>

                        <div className="flex gap-3 pt-2">
                            <button
                                onClick={() => { setInput(''); onClose(); }}
                                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleConfirm}
                                disabled={input !== confirmKeyword}
                                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-red-500/30"
                            >
                                Confirmar Acción
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
