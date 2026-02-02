import React from 'react';
import { User, X, Printer, Download, Share2 } from 'lucide-react';
import QRCode from 'react-qr-code';

interface ShowQRCodeModalProps {
    isOpen: boolean;
    onClose: () => void;
    employee: User | null;
}

export const ShowQRCodeModal: React.FC<ShowQRCodeModalProps> = ({ isOpen, onClose, employee }) => {
    if (!isOpen || !employee) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-[#0f172a]/80 backdrop-blur-md" onClick={onClose}></div>

            <div className="bg-white rounded-[3rem] w-full max-w-md shadow-2xl relative z-10 overflow-hidden animate-in fade-in zoom-in duration-300">
                <div className="bg-indigo-600 p-8 text-center relative overflow-hidden">
                    <button onClick={onClose} className="absolute top-6 right-6 p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors text-white">
                        <X size={20} />
                    </button>
                    <div className="inline-flex p-4 rounded-full bg-white/10 mb-4 backdrop-blur-sm shadow-inner border border-white/20">
                        <User className="text-white" size={32} />
                    </div>
                    <h2 className="text-2xl font-black text-white uppercase italic tracking-tighter leading-none">{employee.full_name}</h2>
                    <p className="text-[10px] text-indigo-200 font-bold uppercase tracking-[0.2em] mt-2">Credencial de Acceso Digital</p>
                </div>

                <div className="p-10 flex flex-col items-center space-y-8">
                    <div className="p-6 bg-white rounded-3xl shadow-[0_20px_40px_-10px_rgba(0,0,0,0.1)] border border-slate-100">
                        <QRCode value={employee.qr_code || employee.id} size={200} viewBox={`0 0 256 256`} />
                    </div>

                    <div className="text-center space-y-2 print:hidden">
                        {/* Hidden obscure ID as requested */}
                    </div>

                    <div className="grid grid-cols-2 gap-4 w-full pt-4 border-t border-slate-50 print:hidden">
                        <button
                            onClick={() => window.print()}
                            className="flex items-center justify-center gap-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 py-3 rounded-xl font-bold text-xs uppercase tracking-wider transition-colors"
                        >
                            <Printer size={16} /> Imprimir
                        </button>
                        <button
                            onClick={() => {
                                const svg = document.querySelector('svg');
                                if (svg) {
                                    const svgData = new XMLSerializer().serializeToString(svg);
                                    const canvas = document.createElement("canvas");
                                    const ctx = canvas.getContext("2d");
                                    const img = new Image();
                                    img.onload = () => {
                                        canvas.width = img.width;
                                        canvas.height = img.height;
                                        ctx?.drawImage(img, 0, 0);
                                        const pngFile = canvas.toDataURL("image/png");
                                        const downloadLink = document.createElement("a");
                                        downloadLink.download = `QR-${employee.full_name}.png`;
                                        downloadLink.href = `${pngFile}`;
                                        downloadLink.click();
                                    };
                                    img.src = "data:image/svg+xml;base64," + btoa(svgData);
                                }
                            }}
                            className="flex items-center justify-center gap-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 py-3 rounded-xl font-bold text-xs uppercase tracking-wider transition-colors"
                        >
                            <Download size={16} /> Guardar
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
