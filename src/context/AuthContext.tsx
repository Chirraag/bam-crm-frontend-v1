import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { useNavigate } from "react-router-dom";
import { authService } from "../services/authService";

interface User {
  id: string;
  email: string;
  name?: string;
  phone_number?: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    // Check for existing user session on mount
    const checkSession = async () => {
      setLoading(true);
      try {
        const currentUser = authService.getCurrentUser();
        if (currentUser) {
          setUser(currentUser);
        }
      } catch (error) {
        console.error("Error checking session:", error);
        authService.clearSession();
      } finally {
        setLoading(false);
      }
    };

    checkSession();
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      setLoading(true);

      const result = await authService.login({ email, password });

      if (result.user) {
        setUser(result.user);
        authService.storeSession(result.user, result.session);
        return { error: null };
      } else {
        return {
          error: {
            message: result.error || "Invalid email or password",
          },
        };
      }
    } catch (error: any) {
      console.error("Sign in error:", error);
      return {
        error: {
          message: error.message || "Login failed. Please try again.",
        },
      };
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    setUser(null);
    authService.clearSession();
    navigate("/login");
  };

  const value = {
    user,
    loading,
    signIn,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
