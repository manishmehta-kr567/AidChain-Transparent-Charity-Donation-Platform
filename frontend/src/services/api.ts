import axios, { AxiosError, AxiosInstance } from 'axios';
import * as Sentry from '@sentry/react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export const api: AxiosInstance = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 20000,
});

// Attach the JWT (if present) to every outgoing request.
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('aidchain_token');
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Centralized error normalization: every failed call surfaces a clean
// message string, and unexpected (5xx / network) failures are reported to
// Sentry here rather than scattered across every call site.
api.interceptors.response.use(
  (response) => response,
  (error: AxiosError<{ message?: string; errors?: { path: string; message: string }[] }>) => {
    const status = error.response?.status;
    const data = error.response?.data;

    let message = data?.message || error.message || 'Something went wrong. Please try again.';
    if (data?.errors && data.errors.length > 0) {
      message = data.errors.map((e) => e.message).join(', ');
    }

    if (!status || status >= 500) {
      Sentry.captureException(error, {
        extra: { url: error.config?.url, method: error.config?.method },
      });
    }

    // Session expired / invalid token: clear local auth state.
    if (status === 401) {
      localStorage.removeItem('aidchain_token');
      localStorage.removeItem('aidchain_user');
    }

    return Promise.reject(new Error(message));
  }
);

export const setAuthToken = (token: string | null) => {
  if (token) {
    localStorage.setItem('aidchain_token', token);
  } else {
    localStorage.removeItem('aidchain_token');
  }
};
