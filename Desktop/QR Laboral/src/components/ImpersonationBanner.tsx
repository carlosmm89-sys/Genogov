import React from 'react';
import { EyeOff } from 'lucide-react';
import { User } from '../types';

interface ImpersonationBannerProps {
    user: User;
    onExit: () => void;
}

export const ImpersonationBanner: React.FC<ImpersonationBannerProps> = ({ user, onExit }) => {
    return (
        <div className="fixed top-0 left-0 right-0 z-40 bg-orange-600 text-white px-2 md:px-4 py-2 flex items-center justify-between shadow-md h-12">
            <div className="flex items-center gap-2 text-xs md:text-sm font-bold overflow-hidden">
                <EyeOff size={16} className="text-white/80 shrink-0" />
                <span className="uppercase tracking-wide truncate">
                    <span className="md:hidden">Vista: {user.full_name.split(' ')[0]}</span>
                    <span className="hidden md:inline">Modo Vista: Estás viendo la plataforma como {user.full_name}</span>
                </span>
            </div>
            <button
                onClick={onExit}
                className="bg-white text-orange-600 hover:bg-orange-50 px-2 pl-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-colors shadow-sm whitespace-nowrap shrink-0 flex items-center gap-1"
            >
                SALIR <span className="hidden sm:inline">VISTA</span>
            </button>
        </div>
    );
};
