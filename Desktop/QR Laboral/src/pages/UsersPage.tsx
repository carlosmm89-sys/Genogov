import React, { useState, useEffect } from 'react';
import { StorageService } from '../services/storage';
import type { User, WorkLog } from '../types';
import { Printer, Plus } from 'lucide-react';
import { PrintModal } from '../components/PrintModal';
import { SecurityModal } from '../components/SecurityModal';
import { AddUserModal } from '../components/AddUserModal';

export const UsersPage: React.FC = () => {
    const [users, setUsers] = useState<User[]>([]);
    const [logs, setLogs] = useState<WorkLog[]>([]);

    // Modal states
    const [isAddUserOpen, setIsAddUserOpen] = useState(false);
    const [isPrintOpen, setIsPrintOpen] = useState(false);
    const [isSecurityOpen, setIsSecurityOpen] = useState(false);

    // Selection state
    const [selectedUser, setSelectedUser] = useState<User | null>(null);

    // Print Data
    const [printLogs, setPrintLogs] = useState<WorkLog[]>([]);

    const loadData = async () => {
        const allUsers = await StorageService.getUsers();
        setUsers(allUsers);
        const allLogs = await StorageService.getLogs();
        setLogs(allLogs);
    };

    useEffect(() => {
        loadData();
    }, []);

    const handleOpenPrint = (user: User) => {
        const userLogs = logs.filter(l => l.userId === user.id);
        setSelectedUser(user);
        setPrintLogs(userLogs);
        setIsPrintOpen(true);
    };

    const handleDeleteClick = (user: User) => {
        setSelectedUser(user);
        setIsSecurityOpen(true);
    };

    const handleConfirmDelete = async () => {
        if (selectedUser) {
            await StorageService.deleteUser(selectedUser.id);
            await loadData();
            setIsSecurityOpen(false);
            setSelectedUser(null);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-gray-900">Gestión de Empleados</h1>
                <button
                    onClick={() => setIsAddUserOpen(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium shadow-sm transition-colors"
                >
                    <Plus className="w-4 h-4" /> Nuevo Empleado
                </button>
            </div>

            {users.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-xl border border-gray-200 border-dashed">
                    <p className="text-gray-500 mb-2">No hay empleados registrados.</p>
                    <button onClick={() => setIsAddUserOpen(true)} className="text-indigo-600 font-bold hover:underline">
                        Añadir el primero
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {users.map(user => (
                        <div key={user.id} className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 flex flex-col items-center text-center hover:shadow-md transition-shadow relative group">

                            <button
                                onClick={() => handleDeleteClick(user)}
                                className="absolute top-4 right-4 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                                title="Eliminar empleado"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                                </svg>
                            </button>

                            <div className="w-20 h-20 rounded-full bg-gray-100 mb-4 overflow-hidden border-4 border-white shadow-sm">
                                <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
                            </div>

                            <h3 className="text-lg font-bold text-gray-900">{user.name}</h3>
                            <p className="text-sm text-gray-500 mb-1">{user.department}</p>
                            <span className="inline-block px-2 py-0.5 bg-indigo-50 text-indigo-700 text-xs rounded-full font-medium mb-6">
                                {user.role}
                            </span>

                            <button
                                onClick={() => handleOpenPrint(user)}
                                className="w-full flex items-center justify-center gap-2 px-4 py-2 border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 hover:text-indigo-600 font-medium transition-all"
                            >
                                <Printer className="w-4 h-4" /> Firmar Horas (PDF)
                            </button>
                        </div>
                    ))}
                </div>
            )}

            <PrintModal
                isOpen={isPrintOpen}
                onClose={() => setIsPrintOpen(false)}
                logs={printLogs}
                user={selectedUser || undefined}
            />

            <SecurityModal
                isOpen={isSecurityOpen}
                onClose={() => setIsSecurityOpen(false)}
                onConfirm={handleConfirmDelete}
                title="¿Eliminar Empleado?"
                description={`Estás a punto de eliminar a ${selectedUser?.name}. Esta acción es irreversible y se perderán todos los registros asociados.`}
                confirmKeyword="ELIMINAR"
            />

            <AddUserModal
                isOpen={isAddUserOpen}
                onClose={() => setIsAddUserOpen(false)}
                onUserAdded={loadData}
            />
        </div>
    );
};
