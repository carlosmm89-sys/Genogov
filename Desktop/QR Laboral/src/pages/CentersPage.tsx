import React, { useState, useEffect } from 'react';
import { MapPin, Plus, Trash2, Edit2 } from 'lucide-react';
import type { WorkCenter } from '../types';
import { supabase } from '../services/supabase';
import { AddCenterModal } from '../components/AddCenterModal';

export const CentersPage: React.FC = () => {
    const [centers, setCenters] = useState<WorkCenter[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadCenters();
    }, []);

    const loadCenters = async () => {
        try {
            // Check if table exists, if not, create it
            const { data, error } = await supabase
                .from('work_centers')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) {
                console.error('Error loading centers:', error);
                // If table doesn't exist, we'll show empty state
                setCenters([]);
            } else {
                setCenters(data || []);
            }
        } catch (err) {
            console.error('Error:', err);
            setCenters([]);
        } finally {
            setLoading(false);
        }
    };

    const handleAddCenter = async (centerData: { name: string; address: string; description: string }) => {
        try {
            const newCenter = {
                id: crypto.randomUUID(),
                name: centerData.name,
                address: centerData.address,
                description: centerData.description,
                created_at: new Date().toISOString()
            };

            const { error } = await supabase
                .from('work_centers')
                .insert(newCenter);

            if (error) {
                console.error('Error creating center:', error);
                alert('Error al crear el centro. Verifica que la tabla work_centers existe en Supabase.');
            } else {
                loadCenters();
            }
        } catch (err) {
            console.error('Error:', err);
            alert('Error al crear el centro.');
        }
    };

    const handleDeleteCenter = async (centerId: string) => {
        if (!confirm('¿Estás seguro de que quieres eliminar este centro?')) return;

        try {
            const { error } = await supabase
                .from('work_centers')
                .delete()
                .eq('id', centerId);

            if (error) {
                console.error('Error deleting center:', error);
                alert('Error al eliminar el centro.');
            } else {
                loadCenters();
            }
        } catch (err) {
            console.error('Error:', err);
            alert('Error al eliminar el centro.');
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <p className="text-gray-500">Cargando centros...</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Gestión de Centros</h1>
                    <p className="text-gray-500 mt-1">Administra los centros de trabajo de tu empresa</p>
                </div>
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium transition-colors shadow-sm"
                >
                    <Plus className="w-4 h-4" />
                    Nuevo Centro
                </button>
            </div>

            {centers.length === 0 ? (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
                    <div className="flex justify-center mb-4">
                        <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center">
                            <MapPin className="w-8 h-8 text-indigo-600" />
                        </div>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        No hay centros de trabajo
                    </h3>
                    <p className="text-gray-500 mb-6 max-w-md mx-auto">
                        Aún no has creado ningún centro de trabajo. Crea tu primer centro para comenzar a gestionar ubicaciones.
                    </p>
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium transition-colors shadow-sm"
                    >
                        <Plus className="w-4 h-4" />
                        Crear Primer Centro
                    </button>

                    <div className="mt-8 p-4 bg-yellow-50 border border-yellow-200 rounded-lg max-w-xl mx-auto">
                        <p className="text-sm text-yellow-800">
                            <strong>💡 Nota:</strong> Si ves este mensaje y ya tenías centros creados,
                            asegúrate de que la tabla <code className="bg-yellow-100 px-1 rounded">work_centers</code> existe en Supabase.
                        </p>
                    </div>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {centers.map((center) => (
                        <div
                            key={center.id}
                            className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
                        >
                            <div className="flex items-start justify-between mb-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center">
                                        <MapPin className="w-6 h-6 text-indigo-600" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-gray-900">{center.name}</h3>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-2 mb-4">
                                <p className="text-sm text-gray-600">
                                    <strong>Dirección:</strong> {center.address}
                                </p>
                                {center.description && (
                                    <p className="text-sm text-gray-500">
                                        {center.description}
                                    </p>
                                )}
                            </div>

                            <div className="flex gap-2 pt-4 border-t border-gray-100">
                                <button
                                    className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                                    onClick={() => alert('Función de edición próximamente')}
                                >
                                    <Edit2 className="w-3.5 h-3.5" />
                                    Editar
                                </button>
                                <button
                                    onClick={() => handleDeleteCenter(center.id)}
                                    className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors"
                                >
                                    <Trash2 className="w-3.5 h-3.5" />
                                    Eliminar
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <AddCenterModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onAdd={handleAddCenter}
            />
        </div>
    );
};
