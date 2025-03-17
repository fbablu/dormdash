// app/context/AuthContext.tsx
import React, { createContext, useState, useEffect, useContext } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import backendApi, { User } from '../services/backendApi';
import { router } from 'expo-router';

interface AuthState {
  isLoading: boolean;
  isSignedIn: boolean;
  user: User | null;
}

interface AuthContextType extends AuthState {
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
  refreshUser: () => Promise<void>;
  updateUser: (userData: Partial<User>) => Promise<void>;
  verifyDorm: (dormCode: string) => Promise<boolean>;
}

const defaultAuthContext: AuthContextType = {
  isLoading: true,
  isSignedIn: false,
  user: null,
  signIn: async () => {},
  signOut: async () => {},
  refreshUser: async () => {},
  updateUser: async () => {},
  verifyDorm: async () => false
};

const AuthContext = createContext<AuthContextType>(defaultAuthContext);

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<AuthState>({
    isLoading: true,
    isSignedIn: false,
    user: null
  });

  useEffect(() => {
    // Configure Google Sign In
    GoogleSignin.configure({
      iosClientId: '895573352563-bglvrv3e9visj279hc9g157787jd4on3.apps.googleusercontent.com',
      // webClientId: 'YOUR_WEB_CLIENT_ID', // Add this if you want to use web auth
      offlineAccess: true
    });

    // Check if user is already signed in
    const bootstrapAsync = async () => {
      try {
        const isAuthenticated = await backendApi.auth.checkAuth();
        
        if (isAuthenticated) {
          const user = await backendApi.auth.getCurrentUser();
          setState({
            isLoading: false,
            isSignedIn: true,
            user
          });
        } else {
          setState({
            isLoading: false,
            isSignedIn: false,
            user: null
          });
        }
      } catch (error) {
        console.error('Error checking authentication state:', error);
        setState({
          isLoading: false,
          isSignedIn: false,
          user: null
        });
      }
    };

    bootstrapAsync();
  }, []);

  const signIn = async () => {
    try {
      setState(prev => ({ ...prev, isLoading: true }));
      
      // Handle Google Sign In
      await GoogleSignin.hasPlayServices();
      const userInfo = await GoogleSignin.signIn();
      
      // Get idToken separately
      const tokens = await GoogleSignin.getTokens();
      if (!tokens.idToken) {
        throw new Error('No ID token present');
      }
      
      // Verify if email is a Vanderbilt email
      const currentUser = await GoogleSignin.getCurrentUser();
      const email = currentUser?.user?.email;
      if (!email || !email.endsWith('@vanderbilt.edu')) {
        throw new Error('Please use your Vanderbilt email address');
      }
      
      // Authenticate with our backend
      const authResponse = await backendApi.auth.loginWithGoogle(tokens.idToken);
      
      // Update auth state
      setState({
        isLoading: false,
        isSignedIn: true,
        user: authResponse.data.user
      });
      
      // Navigate to main app
      router.replace('/(tabs)');
      
    } catch (error) {
      console.error('Sign in error:', error);
      setState(prev => ({ ...prev, isLoading: false }));
      
      // Show an alert or handle error appropriately
      if ((error as Error).message.includes('Vanderbilt email')) {
        // Handle non-Vanderbilt email error
      }
    }
  };

  const signOut = async () => {
    try {
      setState(prev => ({ ...prev, isLoading: true }));
      await backendApi.auth.logout();
      
      setState({
        isLoading: false,
        isSignedIn: false,
        user: null
      });
      
      // Navigate to onboarding
      router.replace('/onboarding');
    } catch (error) {
      console.error('Sign out error:', error);
      setState(prev => ({ ...prev, isLoading: false }));
    }
  };
  
  const refreshUser = async () => {
    try {
      if (!state.isSignedIn) return;
      
      const { data: user } = await backendApi.user.getProfile();
      setState(prev => ({ ...prev, user }));
    } catch (error) {
      console.error('Error refreshing user:', error);
    }
  };
  
  const updateUser = async (userData: Partial<User>) => {
    try {
      if (!state.isSignedIn || !state.user) return;
      
      const { data: updatedUser } = await backendApi.user.updateProfile(userData);
      setState(prev => ({ ...prev, user: updatedUser }));
    } catch (error) {
      console.error('Error updating user:', error);
      throw error;
    }
  };
  
  const verifyDorm = async (dormCode: string): Promise<boolean> => {
    try {
      if (!state.isSignedIn || !state.user) return false;
      
      const { data } = await backendApi.user.verifyDorm(dormCode);
      
      if (data.isVerified) {
        // Update user with verified status
        await refreshUser();
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Error verifying dorm:', error);
      return false;
    }
  };

  return (
    <AuthContext.Provider 
      value={{ 
        ...state, 
        signIn, 
        signOut,
        refreshUser,
        updateUser,
        verifyDorm
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};