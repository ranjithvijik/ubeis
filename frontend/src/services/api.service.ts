import axios, { AxiosInstance, AxiosError, InternalAxiosRequestConfig } from 'axios';
import { fetchAuthSession } from 'aws-amplify/auth';

// Prefer VITE_API_BASE_URL (what we set), fall back to VITE_API_URL, then /api.
// Cast import.meta to any to keep TypeScript happy in non-Vite tooling.
const API_BASE_URL =
  (import.meta as any).env?.VITE_API_BASE_URL ||
  (import.meta as any).env?.VITE_API_URL ||
  '/api';

class ApiService {
    private client: AxiosInstance;

    constructor() {
        this.client = axios.create({
            baseURL: API_BASE_URL,
            timeout: 30000,
            headers: {
                'Content-Type': 'application/json',
            },
        });

        // Request interceptor - add auth token
        this.client.interceptors.request.use(
            async (config: InternalAxiosRequestConfig) => {
                try {
                    const session = await fetchAuthSession();
                    const token = session.tokens?.idToken?.toString();

                    if (token) {
                        config.headers.Authorization = `Bearer ${token}`;
                    }
                } catch (error) {
                    // eslint-disable-next-line no-console -- intentional: token fetch failure
                    console.warn('Failed to get auth token:', error);
                }

                return config;
            },
            (error) => Promise.reject(error)
        );

        // Response interceptor - handle errors
        this.client.interceptors.response.use(
            (response) => response,
            (error: AxiosError) => {
                if (error.response?.status === 401) {
                    // FIX: Dispatch event instead of hard page reload
                    window.dispatchEvent(new CustomEvent('api:unauthorized'));
                }

                return Promise.reject(this.handleError(error));
            }
        );
    }

    private handleError(error: AxiosError): Error {
        if (error.response?.data) {
            const data = error.response.data as { error?: { message?: string }; message?: string };
            const msg = data.error?.message ?? data.message;
            if (msg) return new Error(String(msg));
            if (error.response.status === 401) return new Error('Not logged in or session expired. Please sign in again.');
            return new Error('An error occurred');
        }

        if (error.request) {
            return new Error('Network error. Please check your connection.');
        }

        return new Error(error.message || 'An unexpected error occurred');
    }

    async get<T>(url: string, params?: Record<string, unknown>): Promise<T> {
        const response = await this.client.get<{ data: T }>(url, { params });
        return response.data.data;
    }

    async post<T>(url: string, data?: unknown): Promise<T> {
        const response = await this.client.post<{ data: T }>(url, data);
        return response.data.data;
    }

    async put<T>(url: string, data?: unknown): Promise<T> {
        const response = await this.client.put<{ data: T }>(url, data);
        return response.data.data;
    }

    async delete<T>(url: string): Promise<T> {
        const response = await this.client.delete<{ data: T }>(url);
        return response.data.data;
    }
}

export const apiService = new ApiService();
