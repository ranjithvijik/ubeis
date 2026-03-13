import React, { createContext, useState, useEffect } from 'react';
import { safeGetItem, safeSetItem } from '../utils/storage';

type Theme = 'light' | 'dark';

export interface ThemeContextType {
    theme: Theme;
    toggleTheme: () => void;
    setTheme: (theme: Theme) => void;
}

export const ThemeContext = createContext<ThemeContextType | null>(null);

function getSystemTheme(): Theme {
    if (typeof window === 'undefined' || !window.matchMedia) return 'light';
    try {
        return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    } catch {
        return 'light';
    }
}

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [theme, setThemeState] = useState<Theme>(() => {
        const stored = safeGetItem('theme');
        if (stored === 'light' || stored === 'dark') {
            return stored;
        }
        return getSystemTheme();
    });

    useEffect(() => {
        safeSetItem('theme', theme);
        document.documentElement.classList.toggle('dark', theme === 'dark');
    }, [theme]);

    // Listen for OS-level theme changes (cross-browser)
    useEffect(() => {
        if (typeof window === 'undefined' || !window.matchMedia) return;
        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

        const handleChange = (e: MediaQueryListEvent) => {
            const storedTheme = safeGetItem('theme');
            if (!storedTheme) {
                setThemeState(e.matches ? 'dark' : 'light');
            }
        };

        mediaQuery.addEventListener('change', handleChange);
        return () => mediaQuery.removeEventListener('change', handleChange);
    }, []);

    const toggleTheme = () => {
        setThemeState((prev) => (prev === 'light' ? 'dark' : 'light'));
    };

    const setTheme = (newTheme: Theme) => {
        setThemeState(newTheme);
    };

    return (
        <ThemeContext.Provider value= {{ theme, toggleTheme, setTheme }
}>
    { children }
    </ThemeContext.Provider>
  );
};
