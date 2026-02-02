import React from 'react';
import type { WorkLog, User } from '../types';
import { format } from 'date-fns';
import { X } from 'lucide-react';

interface PrintModalProps {
    isOpen: boolean;
    onClose: () => void;
    logs: WorkLog[];
    user?: User;
}

export const PrintModal: React.FC<PrintModalProps> = ({ isOpen, onClose, logs, user }) => {
    if (!isOpen || !user) return null;

    const totalHours = logs.reduce((acc, l) => acc + l.totalHours, 0);

    const handlePrint = () => {
        window.print();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm print:bg-white print:static print:block">

            {/* Action Bar (Hidden when printing) */}
            <div className="absolute top-4 right-4 flex gap-4 print:hidden">
                <button
                    onClick={handlePrint}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-medium shadow-lg"
                >
                    Imprimir / Guardar PDF
                </button>
                <button
                    onClick={onClose}
                    className="bg-white hover:bg-gray-100 text-gray-700 px-4 py-2 rounded-lg font-medium shadow-lg flex items-center gap-2"
                >
                    <X className="w-4 h-4" /> Cerrar
                </button>
            </div>

            {/* A4 Page Preview */}
            <div className="bg-white w-[210mm] min-h-[297mm] p-[10mm] shadow-2xl overflow-y-auto print:shadow-none print:w-full print:h-auto print:p-0">

                {/* Header */}
                <div className="border-b-2 border-gray-800 pb-4 mb-8 flex justify-between items-end">
                    <div>
                        <h1 className="text-3xl font-serif font-bold text-gray-900 mb-1">REPORTE MENSUAL DE HORAS</h1>
                        <p className="text-gray-500 text-sm uppercase tracking-widest">QR Laboral Systems</p>
                    </div>
                    <div className="text-right">
                        <p className="text-sm font-bold">PERIODO</p>
                        <p className="text-lg">{format(new Date(), 'MMMM yyyy').toUpperCase()}</p>
                    </div>
                </div>

                {/* Employee Info */}
                <div className="grid grid-cols-2 gap-8 mb-8 bg-gray-50 p-6 rounded-lg border border-gray-100 print:bg-transparent print:border-none print:p-0">
                    <div>
                        <p className="text-xs text-gray-400 uppercase tracking-widest mb-1">EMPLEADO</p>
                        <p className="font-bold text-xl">{user.name}</p>
                        <p className="text-sm text-gray-600">{user.email}</p>
                    </div>
                    <div>
                        <p className="text-xs text-gray-400 uppercase tracking-widest mb-1">DEPARTAMENTO</p>
                        <p className="font-bold text-xl">{user.department}</p>
                        <p className="text-sm text-gray-600">ID: {user.id}</p>
                    </div>
                </div>

                {/* Table */}
                <table className="w-full text-left text-sm mb-8 border-collapse">
                    <thead>
                        <tr className="border-b-2 border-gray-800">
                            <th className="py-2 text-gray-600 uppercase text-xs">Fecha</th>
                            <th className="py-2 text-gray-600 uppercase text-xs">Entrada</th>
                            <th className="py-2 text-gray-600 uppercase text-xs">Salida</th>
                            <th className="py-2 text-gray-600 uppercase text-xs text-right">Pausas</th>
                            <th className="py-2 text-gray-600 uppercase text-xs text-right">Horas Efec.</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                        {logs.map(log => (
                            <tr key={log.id}>
                                <td className="py-3 font-medium">{log.date}</td>
                                <td className="py-3 text-gray-600">{format(new Date(log.startTime), 'HH:mm')}</td>
                                <td className="py-3 text-gray-600">{log.endTime ? format(new Date(log.endTime), 'HH:mm') : '-'}</td>
                                <td className="py-3 text-gray-600 text-right text-xs">
                                    {log.breaks.map(b => `${format(new Date(b.start), 'HH:mm')}-${b.end ? format(new Date(b.end), 'HH:mm') : '...'}`).join(', ')}
                                </td>
                                <td className="py-3 font-bold text-right">{log.totalHours.toFixed(2)}</td>
                            </tr>
                        ))}
                    </tbody>
                    <tfoot>
                        <tr className="border-t-2 border-gray-800">
                            <td colSpan={4} className="py-4 text-right font-bold uppercase">Total Horas Mensuales</td>
                            <td className="py-4 text-right font-bold text-lg">{totalHours.toFixed(2)}</td>
                        </tr>
                    </tfoot>
                </table>

                {/* Signatures */}
                <div className="mt-20 grid grid-cols-2 gap-20">
                    <div className="text-center">
                        <div className="border-t border-gray-400 w-4/5 mx-auto pt-2"></div>
                        <p className="text-sm font-bold uppercase mt-2">Firma del Empleado</p>
                        <p className="text-xs text-gray-400">{user.name}</p>
                    </div>
                    <div className="text-center">
                        <div className="border-t border-gray-400 w-4/5 mx-auto pt-2"></div>
                        <p className="text-sm font-bold uppercase mt-2">Firma de la Empresa</p>
                        <p className="text-xs text-gray-400">QR Laboral Dept.</p>
                    </div>
                </div>

            </div>
        </div>
    );
};
