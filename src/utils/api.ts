const API_BASE_URL = 'https://3f25ffb1-fd21-45d0-9f20-7a17d9f0b479-00-1cr33wz8zfbwv.sisko.replit.dev';

export const api = {
  get: async (endpoint: string) => {
    try {
      const userData = localStorage.getItem('crm_user');
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      };

      // Add authorization header if user is logged in
      if (userData) {
        const user = JSON.parse(userData);
        headers['Authorization'] = `Bearer ${user.id}`;
      }

      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'GET',
        headers,
        mode: 'cors'
      });
      if (!response.ok) {
        throw new Error(`API Error: ${response.status} ${response.statusText}`);
      }
      return response.json();
    } catch (error) {
      console.error('API GET Error:', error);
      throw error;
    }
  },

  post: async (endpoint: string, data: any) => {
    try {
      const userData = localStorage.getItem('crm_user');
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      };

      // Add authorization header if user is logged in
      if (userData) {
        const user = JSON.parse(userData);
        headers['Authorization'] = `Bearer ${user.id}`;
      }

      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'POST',
        headers,
        mode: 'cors',
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        throw new Error(`API Error: ${response.status} ${response.statusText}`);
      }
      return response.json();
    } catch (error) {
      console.error('API POST Error:', error);
      throw error;
    }
  },

  put: async (endpoint: string, data: any) => {
    try {
      const userData = localStorage.getItem('crm_user');
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      };

      // Add authorization header if user is logged in
      if (userData) {
        const user = JSON.parse(userData);
        headers['Authorization'] = `Bearer ${user.id}`;
      }

      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'PUT',
        headers,
        mode: 'cors',
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        throw new Error(`API Error: ${response.status} ${response.statusText}`);
      }
      return response.json();
    } catch (error) {
      console.error('API PUT Error:', error);
      throw error;
    }
  },

  delete: async (endpoint: string) => {
    try {
      const userData = localStorage.getItem('crm_user');
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      };

      // Add authorization header if user is logged in
      if (userData) {
        const user = JSON.parse(userData);
        headers['Authorization'] = `Bearer ${user.id}`;
      }

      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'DELETE',
        headers,
        mode: 'cors'
      });
      if (!response.ok) {
        throw new Error(`API Error: ${response.status} ${response.statusText}`);
      }
      
      // Handle 204 No Content response (successful deletion with no body)
      if (response.status === 204) {
        return { success: true };
      }
      
      // For other successful responses, try to parse JSON
      const text = await response.text();
      return text ? JSON.parse(text) : { success: true };
    } catch (error) {
      console.error('API DELETE Error:', error);
      throw error;
    }
  },
};

// ✅ ADDED: Messaging service functions
export const messageService = {
  // Get message history for a client
  getClientMessages: async (clientId: string) => {
    return api.get(`/api/messages/client/${clientId}`);
  },

  // Send SMS to a client
  sendMessage: async (clientId: string, content: string, phoneNumber?: string) => {
    return api.post('/api/messages/send', {
      client_id: clientId,
      content,
      phone_number: phoneNumber
    });
  },

  // Get all phone numbers for a client
  getClientPhoneNumbers: async (clientId: string) => {
    return api.get(`/api/messages/client/${clientId}/phone-numbers`);
  }
};