// API Client for ARK PVP Tool Backend
import { API_URL } from './cognitoConfig';

interface ApiOptions {
    method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
    body?: unknown;
    token?: string;
}

class ApiClient {
    private baseUrl: string;

    constructor(baseUrl: string) {
        this.baseUrl = baseUrl;
    }

    async request<T>(endpoint: string, options: ApiOptions = {}): Promise<T> {
        const { method = 'GET', body, token } = options;

        const headers: Record<string, string> = {
            'Content-Type': 'application/json',
        };

        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        const response = await fetch(`${this.baseUrl}${endpoint}`, {
            method,
            headers,
            body: body ? JSON.stringify(body) : undefined,
        });

        if (!response.ok) {
            throw new Error(`API Error: ${response.status}`);
        }

        // Handle empty responses (204 No Content)
        if (response.status === 204) {
            return null as T;
        }

        return response.json();
    }

    // Favorites
    async getFavorites(token: string) {
        return this.request('/favorites', { token });
    }

    async addFavorite(token: string, data: { item_type: string; item_id: string; item_data?: unknown }) {
        return this.request('/favorites', { method: 'POST', body: data, token });
    }

    async removeFavorite(token: string, id: string) {
        return this.request(`/favorites/${id}`, { method: 'DELETE', token });
    }

    // Timers
    async getTimers(token: string) {
        return this.request('/timers', { token });
    }

    async addTimer(token: string, data: { dino_type: string; nickname: string; start_time: number; end_time: number; server_rate: number }) {
        return this.request('/timers', { method: 'POST', body: data, token });
    }

    // Sync
    async syncData(token: string) {
        return this.request('/sync', { token });
    }

    async uploadSync(token: string, data: { favorites?: unknown[]; timers?: unknown[] }) {
        return this.request('/sync', { method: 'POST', body: data, token });
    }
}

export const apiClient = new ApiClient(API_URL);
