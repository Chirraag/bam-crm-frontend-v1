import { supabase } from '../utils/supabaseClient';

interface User {
  id: string;
  email: string;
  name?: string;
  phone_number?: string;
}

interface LoginCredentials {
  email: string;
  password: string;
}

class AuthService {
  // Convert string to base64
  private toBase64(str: string): string {
    return btoa(str);
  }

  // Verify password against base64 hash
  private verifyPassword(password: string, hash: string): boolean {
    const passwordBase64 = this.toBase64(password);
    return passwordBase64 === hash;
  }

  async login(credentials: LoginCredentials): Promise<{ user?: User; session?: any; error?: string }> {
    try {
      const { email, password } = credentials;

      // Verify credentials against crm_users table
      const { data: userData, error: userError } = await supabase
        .from('crm_users')
        .select('id, email, password_hash, name, phone_number')
        .eq('email', email.toLowerCase())
        .single();

      if (userError || !userData) {
        return { error: 'Invalid email or password' };
      }

      // Verify password
      if (!this.verifyPassword(password, userData.password_hash)) {
        return { error: 'Invalid email or password' };
      }

      // Create a custom session object
      const customSession = {
        access_token: `custom_${userData.id}`,
        user: {
          id: userData.id,
          email: userData.email
        }
      };

      const user: User = {
        id: userData.id,
        email: userData.email,
        name: userData.name,
        phone_number: userData.phone_number
      };

      return { user, session: customSession };
    } catch (error) {
      console.error('Login error:', error);
      return { error: 'Login failed. Please try again.' };
    }
  }

  // Store user session in localStorage
  storeSession(user: User, session?: any): void {
    localStorage.setItem('crm_user', JSON.stringify(user));
    if (session) {
      localStorage.setItem('crm_session', JSON.stringify(session));
    }
  }

  // Get current user from localStorage
  getCurrentUser(): User | null {
    try {
      const userData = localStorage.getItem('crm_user');
      return userData ? JSON.parse(userData) : null;
    } catch (error) {
      console.error('Error parsing user data:', error);
      this.clearSession();
      return null;
    }
  }

  // Get current session from localStorage
  getCurrentSession(): any | null {
    try {
      const sessionData = localStorage.getItem('crm_session');
      return sessionData ? JSON.parse(sessionData) : null;
    } catch (error) {
      console.error('Error parsing session data:', error);
      return null;
    }
  }

  // Clear user session
  clearSession(): void {
    localStorage.removeItem('crm_user');
    localStorage.removeItem('crm_session');
  }

  // Check if user is authenticated
  isAuthenticated(): boolean {
    return this.getCurrentUser() !== null;
  }
}

export const authService = new AuthService();