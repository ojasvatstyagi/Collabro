import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { authApi, LoginCredentials, RegisterCredentials, User } from "../services/api/auth";

interface AuthContextType {
    user: User | null;
    loading: boolean;
    login: (credentials: LoginCredentials) => Promise<void>;
    register: (credentials: RegisterCredentials) => Promise<void>;
    logout: () => Promise<void>;
    isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    const checkAuth = async () => {
        try {
            const response = await authApi.getCurrentUser();
            if (response.data && response.data.user) {
                setUser(response.data.user);
            } else {
                setUser(null);
            }
        } catch (error) {
            console.error("Auth check failed:", error);
            setUser(null);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        checkAuth();
    }, []);

    const login = async (credentials: LoginCredentials) => {
        try {
            const response = await authApi.login(credentials);
            if (response.data && response.data.user) {
                setUser(response.data.user);
            }
        } catch (error) {
            console.error("Login failed:", error);
            throw error;
        }
    };

    const register = async (credentials: RegisterCredentials) => {
        try {
            await authApi.register(credentials);
            // Registration usually requires verification, so we don't set user immediately
            // or we could if the backend returned it and allowed login without verification (unlikely here)
        } catch (error) {
            console.error("Registration failed:", error);
            throw error;
        }
    };

    const logout = async () => {
        try {
            await authApi.logout();
            setUser(null);
        } catch (error) {
            console.error("Logout failed:", error);
            // Even if logout fails server-side, clear client state
            setUser(null);
        }
    };

    return (
        <AuthContext.Provider
            value={{
                user,
                loading,
                login,
                register,
                logout,
                isAuthenticated: !!user,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
};
