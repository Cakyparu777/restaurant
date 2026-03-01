"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { User } from "@/lib/types";
import { api } from "@/lib/api";

interface AuthContextType {
    user: User | null;
    loading: boolean;
    login: (email: string, password: string) => Promise<void>;
    register: (data: {
        email: string;
        password: string;
        full_name: string;
        restaurant_name: string;
    }) => Promise<void>;
    logout: () => void;
}

const AuthContext = createContext<AuthContextType>({
    user: null,
    loading: true,
    login: async () => { },
    register: async () => { },
    logout: () => { },
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const token = localStorage.getItem("token");
        if (token) {
            api.setToken(token);
            api
                .getMe()
                .then(setUser)
                .catch(() => {
                    api.clearToken();
                })
                .finally(() => setLoading(false));
        } else {
            setLoading(false);
        }
    }, []);

    const login = async (email: string, password: string) => {
        await api.login(email, password);
        const me = await api.getMe();
        setUser(me);
    };

    const register = async (data: {
        email: string;
        password: string;
        full_name: string;
        restaurant_name: string;
    }) => {
        await api.register(data);
        const me = await api.getMe();
        setUser(me);
    };

    const logout = () => {
        api.clearToken();
        setUser(null);
        window.location.href = "/login";
    };

    return (
        <AuthContext.Provider value={{ user, loading, login, register, logout }}>
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => useContext(AuthContext);
