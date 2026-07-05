import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { authApi, LoginCredentials, RegisterCredentials, User } from "../services/api/auth";
import { SESSION_EXPIRED_EVENT } from "../services/api/base";

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

    useEffect(() => {
        // An expired access token is refreshed transparently by the API client, so a failure
        // here means there is no valid session (never logged in, or the refresh token is gone).
        const checkAuth = async () => {
            try {
                const response = await authApi.getCurrentUser();
                setUser(response.data?.user ?? null);
            } catch {
                setUser(null);
            } finally {
                setLoading(false);
            }
        };
        checkAuth();
    }, []);

    // The API client fires this when a session can no longer be refreshed
    useEffect(() => {
        const handleSessionExpired = () => setUser(null);
        window.addEventListener(SESSION_EXPIRED_EVENT, handleSessionExpired);
        return () => window.removeEventListener(SESSION_EXPIRED_EVENT, handleSessionExpired);
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
            // Registration requires email verification, so the user is not signed in here
        } catch (error) {
            console.error("Registration failed:", error);
            throw error;
        }
    };

    const logout = async () => {
        try {
            await authApi.logout();
        } catch (error) {
            // The token is cleared client-side regardless; the server session just expires on its own
            console.error("Logout request failed:", error);
        } finally {
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

// The hook lives with its provider on purpose; splitting them would only move the import
// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
};
