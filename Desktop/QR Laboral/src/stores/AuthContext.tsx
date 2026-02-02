import React, { createContext, useContext, useState, useEffect } from 'react';
import type { User } from '../types';
import { StorageService } from '../services/storage';

interface AuthContextType {
    user: User | null;
    login: (email: string, pass: string) => Promise<boolean>;
    loginByPin: (pin: string) => Promise<boolean>;
    logout: () => void;
    isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        // Check initial user
        const savedUser = StorageService.getCurrentUser();
        if (savedUser) {
            setUser(savedUser);
        }
        setIsLoading(false);
    }, []);

    const login = async (email: string, pass: string): Promise<boolean> => {
        // Mock password check (allow any pass for non-admin for demo simplicity if needed, or check simple logic)
        // Actually, let's just check email existence for demo or hardcoded constraints
        const foundUser = await StorageService.getUserByEmail(email);
        if (foundUser) {
            // Very simple mock password check
            if (pass === '1234' || pass === 'admin123' || pass === 'Laboral2026*') { // Simple logic for demo
                setUser(foundUser);
                StorageService.setCurrentUser(foundUser);
                return true;
            }
        }
        return false;
    };

    const loginByPin = async (pin: string): Promise<boolean> => {
        // Mimic API delay
        await new Promise(r => setTimeout(r, 800));
        const foundUser = await StorageService.getUserByPin(pin);
        if (foundUser) {
            setUser(foundUser);
            StorageService.setCurrentUser(foundUser);
            return true;
        }
        return false;
    };

    const logout = () => {
        setUser(null);
        StorageService.setCurrentUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, login, loginByPin, logout, isLoading }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) throw new Error('useAuth must be used within an AuthProvider');
    return context;
};
