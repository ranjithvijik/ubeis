import React, { createContext, useState, useEffect, useCallback } from 'react';
import {
    signIn,
    signOut,
    getCurrentUser,
    fetchUserAttributes,
} from 'aws-amplify/auth';
import { User, UserRole } from '../types';

export interface AuthContextType {
    user: User | null;
    isLoading: boolean;
    isAuthenticated: boolean;
    login: (email: string, password: string) => Promise<void>;
    logout: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const loadUser = useCallback(async (getIsMounted?: () => boolean) => {
        try {
            // 1. Verify we have a valid session
            const currentUser = await getCurrentUser();

            if (getIsMounted && !getIsMounted()) return;

            // 2. Attempt to fetch attributes, but don't destroy session if this fails
            let attributes: Record<string, string | undefined> = {};
            try {
                attributes = await fetchUserAttributes();
            } catch (attrError) {
                // Intentional: log attribute fetch failure without destroying session
                // eslint-disable-next-line no-console
                console.warn(
                    'Failed to fetch user attributes, continuing with basic auth state',
                    attrError
                );
            }

            if (getIsMounted && !getIsMounted()) return;

            setUser({
                userId: currentUser.userId,
                email: attributes.email || (currentUser.signInDetails?.loginId as string) || '',
                firstName: attributes.given_name || 'User',
                lastName: attributes.family_name || '',
                role: (attributes['custom:role'] as UserRole) || 'viewer',
                department: attributes['custom:department'],
                college: attributes['custom:college'],
            });
        } catch (error) {
            if (getIsMounted && !getIsMounted()) return;
            // Only nullify user if getCurrentUser() throws (meaning session is actually dead)
            setUser(null);
        } finally {
            if (!getIsMounted || getIsMounted()) {
                setIsLoading(false);
            }
        }
    }, []);

    useEffect(() => {
        let isMounted = true;

        const initializeAuth = async () => {
            if (isMounted) {
                await loadUser(() => isMounted);
            }
        };

        initializeAuth();

        return () => {
            isMounted = false; // Prevent state updates on unmounted component
        };
    }, [loadUser]);

    const login = async (email: string, password: string): Promise<void> => {
        setIsLoading(true);
        try {
            await signIn({ username: email, password });
            await loadUser();
        } finally {
            setIsLoading(false);
        }
    };

    const logout = async (): Promise<void> => {
        await signOut();
        setUser(null);
    };

    return (
        <AuthContext.Provider
      value= {{
        user,
            isLoading,
            isAuthenticated: !!user,
                login,
                logout,
      }
}
    >
    { children }
    </AuthContext.Provider>
  );
};
