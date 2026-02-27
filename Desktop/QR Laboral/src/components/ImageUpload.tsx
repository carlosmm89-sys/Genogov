import React, { useRef, useState } from 'react';
import { Upload, Trash2, Image as ImageIcon } from 'lucide-react';

interface ImageUploadProps {
    label: string;
    value?: string;
    onChange: (value: string) => void;
    className?: string;
    maxSizeInMB?: number; // default 2MB
}

export const ImageUpload: React.FC<ImageUploadProps> = ({
    label,
    value,
    onChange,
    className = '',
    maxSizeInMB = 2
}) => {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [error, setError] = useState<string | null>(null);
    const [isDragging, setIsDragging] = useState(false);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            processFile(e.target.files[0]);
        }
    };

    const processFile = (file: File) => {
        // Validate type
        if (!file.type.startsWith('image/')) {
            setError('Solo se permiten archivos de imagen.');
            return;
        }

        // Validate size
        if (file.size > maxSizeInMB * 1024 * 1024) {
            setError(`La imagen es demasiado grande (Máx ${maxSizeInMB}MB).`);
            return;
        }

        setError(null);
        const reader = new FileReader();
        reader.onloadend = () => {
            const base64String = reader.result as string;
            onChange(base64String);
        };
        reader.readAsDataURL(file);
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);

        const file = e.dataTransfer.files?.[0];
        if (file) {
            processFile(file);
        }
    };

    return (
        <div className={`space-y-2 ${className}`}>
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{label}</label>

            <div
                className={`relative group transition-all duration-300 ${value ? '' : 'h-20'}`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
            >
                <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    className="hidden"
                    accept="image/*"
                />

                {value ? (
                    <div className="flex items-center gap-4 bg-white p-2 rounded-xl border border-slate-200 shadow-sm animate-in fade-in zoom-in duration-300">
                        <div className="h-16 w-16 bg-slate-50 rounded-lg flex-shrink-0 border border-slate-100 p-2 flex items-center justify-center overflow-hidden relative checkerboard-bg">
                            <img src={value} alt="Preview" className="max-w-full max-h-full object-contain" />
                        </div>

                        <div className="flex-1 min-w-0">
                            <p className="text-xs font-bold text-slate-700 truncate">Imagen cargada</p>
                            <p className="text-[10px] text-slate-400 truncate">Base64 • {(value.length / 1024).toFixed(1)} KB</p>
                        </div>

                        <div className="flex gap-2 mr-2">
                            <button
                                type="button"
                                onClick={() => fileInputRef.current?.click()}
                                className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                                title="Cambiar imagen"
                            >
                                <Upload size={16} />
                            </button>
                            <button
                                type="button"
                                onClick={() => onChange('')}
                                className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                title="Eliminar imagen"
                            >
                                <Trash2 size={16} />
                            </button>
                        </div>
                    </div>
                ) : (
                    <div
                        onClick={() => fileInputRef.current?.click()}
                        className={`
              w-full h-full min-h-[5rem] rounded-[1.5rem] border-2 border-dashed flex items-center justify-center gap-3 cursor-pointer transition-all duration-300
              ${isDragging
                                ? 'border-indigo-500 bg-indigo-50 scale-[1.02]'
                                : 'border-slate-200 bg-slate-50 hover:border-indigo-300 hover:bg-white'}
            `}
                    >
                        <div className="p-2 bg-white rounded-full shadow-sm border border-slate-100 text-slate-400">
                            <Upload size={16} />
                        </div>
                        <div className="text-left">
                            <p className="text-xs font-bold text-slate-600">Subir imagen</p>
                            <p className="text-[9px] text-slate-400 font-medium">PNG, JPG (Máx 2MB)</p>
                        </div>
                    </div>
                )}
            </div>

            {error && (
                <p className="text-[10px] font-bold text-red-500 animate-pulse ml-1">{error}</p>
            )}
        </div>
    );
};
