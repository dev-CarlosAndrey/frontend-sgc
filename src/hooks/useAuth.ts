import { useContext } from "react";
import { AuthContext } from '../context/AuthContext';
import type { AuthContextData } from "../types/auth";

export function useAuth(): AuthContextData {
    const context = useContext(AuthContext) as AuthContextData;

    if(!context) {
        throw new Error('useAuth deve ser usado dentro de um AuthProvider');
    }

    return context;
}