import React, { useState } from 'react';
import { HelpCircle, X, ChevronUp, Home } from 'lucide-react';

export const FamilyLegend = () => {
    const [isOpen, setIsOpen] = useState(false);

    if (!isOpen) {
        return (
            <button
                onClick={() => setIsOpen(true)}
                className="absolute bottom-6 left-6 z-40 bg-white px-4 py-2.5 rounded-full shadow-lg border border-slate-200 flex items-center gap-2 text-sm font-bold text-slate-600 hover:text-indigo-600 hover:border-indigo-200 transition-all"
                title="Ver Leyenda de Vínculos"
            >
                <HelpCircle size={16} />
                Leyenda de Vínculos
            </button>
        );
    }

    return (
        <div className="absolute bottom-6 left-6 z-40 bg-white rounded-2xl shadow-2xl border border-slate-200 w-80 overflow-hidden animate-in slide-in-from-bottom-4 duration-200">
            <div className="bg-slate-50 border-b border-slate-100 p-3 px-4 flex items-center justify-between">
                <h3 className="font-bold text-sm text-slate-700 flex items-center gap-2">
                    <HelpCircle size={16} className="text-indigo-500" />
                    Tipos de Vínculo (GenoPro)
                </h3>
                <button
                    onClick={() => setIsOpen(false)}
                    className="text-slate-400 hover:text-slate-600 rounded-lg p-1"
                >
                    <X size={16} />
                </button>
            </div>

            <div className="p-4 bg-white max-h-[60vh] overflow-y-auto space-y-6">

                {/* Parejas Section */}
                <div>
                    <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-3">Relaciones de Pareja</h4>
                    <div className="space-y-4">

                        <div className="flex items-center gap-3 group" title="Matrimonio">
                            <div className="w-12 h-0 border-b-2 border-slate-900 flex-shrink-0 relative">
                                <div className="absolute -left-2 -top-1 w-2 h-2 rounded bg-slate-300"></div>
                                <div className="absolute -right-2 -top-1 w-2 h-2 rounded-full bg-slate-300"></div>
                            </div>
                            <span className="text-xs font-semibold text-slate-600 group-hover:text-slate-900">Matrimonio</span>
                        </div>

                        <div className="flex items-center gap-3 group" title="Compromiso (Noviazgo)">
                            <div className="w-12 h-0 border-b-2 border-slate-900 border-dashed flex-shrink-0 relative"></div>
                            <span className="text-xs font-semibold text-slate-600 group-hover:text-slate-900">Compromiso</span>
                        </div>

                        <div className="flex items-center gap-3 group" title="Convivencia">
                            <div className="w-12 flex-shrink-0 flex items-center justify-between overflow-hidden">
                                <div className="w-2 h-0.5 bg-slate-900"></div>
                                <div className="w-1 h-0.5 bg-slate-900"></div>
                                <div className="w-2 h-0.5 bg-slate-900"></div>
                                <div className="w-1 h-0.5 bg-slate-900"></div>
                                <div className="w-2 h-0.5 bg-slate-900"></div>
                            </div>
                            <span className="text-xs font-semibold text-slate-600 group-hover:text-slate-900">Convivencia</span>
                        </div>

                        <div className="flex items-center gap-3 group" title="Pareja de hecho (Legal)">
                            <div className="w-12 flex-shrink-0 flex items-center justify-center relative">
                                <div className="absolute inset-0 flex items-center justify-between overflow-hidden">
                                    <div className="w-2 h-0.5 bg-slate-900"></div>
                                    <div className="w-1 h-0.5 bg-slate-900"></div>
                                    <div className="w-2 h-0.5 bg-slate-900"></div>
                                    <div className="w-1 h-0.5 bg-slate-900"></div>
                                    <div className="w-2 h-0.5 bg-slate-900"></div>
                                </div>
                                <div className="bg-white p-0.5 z-10 text-slate-900"><Home size={10} strokeWidth={3} /></div>
                            </div>
                            <span className="text-xs font-semibold text-slate-600 group-hover:text-slate-900">Pareja de Hecho</span>
                        </div>

                        <div className="flex items-center gap-3 group" title="Separación de hecho / Separación Legal">
                            <div className="w-12 h-0 border-b-2 border-red-600 flex-shrink-0 relative flex items-center justify-center">
                                <div className="bg-white px-0.5 text-red-600 font-bold text-[10px] leading-none z-10 transform -skew-x-12"> / </div>
                            </div>
                            <span className="text-xs font-semibold text-slate-600 group-hover:text-slate-900">Separación</span>
                        </div>

                        <div className="flex items-center gap-3 group" title="Divorcio">
                            <div className="w-12 h-0 border-b-2 border-red-600 flex-shrink-0 relative flex items-center justify-center">
                                <div className="bg-white px-0.5 text-red-600 font-bold text-[10px] leading-none z-10 transform -skew-x-12"> // </div>
                            </div>
                            <span className="text-xs font-semibold text-slate-600 group-hover:text-slate-900">Divorcio</span>
                        </div>

                        <div className="flex items-center gap-3 group" title="Nulidad Matrimonial">
                            <div className="w-12 h-0 border-b-2 border-red-600 flex-shrink-0 relative flex items-center justify-center">
                                <div className="bg-white px-0.5 text-red-600 font-bold text-[10px] leading-none z-10 transform -skew-x-12"> /// </div>
                            </div>
                            <span className="text-xs font-semibold text-slate-600 group-hover:text-slate-900">Nulidad</span>
                        </div>

                        <div className="flex items-center gap-3 group" title="Amorío / Aventura Ocasional">
                            <div className="w-12 h-0 border-b-2 border-rose-500 border-dotted flex-shrink-0 relative"></div>
                            <span className="text-xs font-semibold text-slate-600 group-hover:text-slate-900">Amorío</span>
                        </div>

                    </div>
                </div>

                {/* Sociales Section */}
                <div>
                    <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-3">Relaciones Sociales</h4>
                    <div className="space-y-4">

                        <div className="flex items-center gap-3 group" title="Consanguinidad / Hijo">
                            <div className="w-12 h-0 border-b-2 border-slate-900 flex-shrink-0 relative"></div>
                            <span className="text-xs font-semibold text-slate-600 group-hover:text-slate-900">Biológica / Consanguínea</span>
                        </div>

                        <div className="flex items-center gap-3 group" title="Relación Muy Estrecha">
                            <div className="w-12 h-1 border-y-2 border-green-500 flex-shrink-0 relative"></div>
                            <span className="text-xs font-semibold text-slate-600 group-hover:text-slate-900">Muy Estrecha</span>
                        </div>

                        <div className="flex items-center gap-3 group" title="Relación Conflictiva">
                            <div className="w-12 h-0 border-b-2 border-red-500 flex-shrink-0 relative flex items-center justify-center">
                                <div className="bg-white/80 rounded-full text-red-500 z-10 text-[10px]">⚡</div>
                            </div>
                            <span className="text-xs font-semibold text-slate-600 group-hover:text-slate-900">Conflictiva</span>
                        </div>

                    </div>
                </div>

            </div>
        </div>
    );
};
