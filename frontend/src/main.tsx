import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { Amplify } from 'aws-amplify';
import { Toaster } from 'react-hot-toast';
import { ErrorBoundary } from 'react-error-boundary';

import App from './App';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { ErrorFallback } from './components/common/ErrorFallback';
import { awsConfig } from './config/aws.config';
import './styles/globals.css';

// Configure AWS Amplify
Amplify.configure(awsConfig);

// Create React Query client
const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            staleTime: 1000 * 60 * 5, // 5 minutes
            gcTime: 1000 * 60 * 30, // 30 minutes
            retry: 3,
            refetchOnWindowFocus: false,
        },
    },
});

ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
    <ErrorBoundary FallbackComponent={ ErrorFallback } >
<QueryClientProvider client={ queryClient } >
<BrowserRouter>
<ThemeProvider>
<AuthProvider>
<App />
< Toaster
                position = "top-right"
                toastOptions = {{
    duration: 4000,
    style: {
        background: '#1f2937',
        color: '#fff',
    },
}}
              />
    </AuthProvider>
    </ThemeProvider>
    </BrowserRouter>
    < ReactQueryDevtools initialIsOpen = { false} />
    </QueryClientProvider>
    </ErrorBoundary>
    </React.StrictMode>
);
