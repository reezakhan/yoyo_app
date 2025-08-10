import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import {
  getAuth,
  signInWithPhoneNumber,
  signOut
} from '@react-native-firebase/auth';
import { router } from 'expo-router';
import { apiService } from '@/services/api';
import { Platform } from 'react-native';
import { NotificationService } from '@/services/notificationService';

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  avatar?: string;
  location?: string;
  hasOnboarded: boolean;
}



interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isMaintenanceMode: boolean;

  // Auth methods
  sendOTP: (phoneNumber: string, customerType: string) => Promise<any>;

  verifyOTP: (otp: string, role: string) => Promise<{
    nextScreen: string;
    success: boolean;
  }>;
  register: (userData: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  setUser: (user: User) => void;
}

interface RegisterData {
  name: string;
  email: string;
  phone: string;
  password: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}
// {
//   id: "DLJSJOIF",
//   name: 'sai',
//   email: 'saicherry93479@gmail.com',
//   phone: "+919515234212",
//   hasOnboarded: false
// }
export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [confirmation, setConfirmation] = useState<any>(null);
  const [user, setUser] = useState<User | null>(
    null
    // {
    //   id: "DLJSJOIF",
    //   name: 'Sophia Carter',
    //   email: 'sophia.carter@example.com',
    //   phone: "+919515234212",
    //   hasOnboarded: true,
    //   avatar: 'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=200'
    // }
  );
  const [isLoading, setIsLoading] = useState(true);
  const [isMaintenanceMode, setIsMaintenanceMode] = useState(false);


  const isAuthenticated = !!user;

  useEffect(() => {
    initializeAuth();

    // Setup notification listeners
    const cleanup = NotificationService.setupNotificationListeners();

    return cleanup;
  }, []);

  const initializeAuth = async () => {
    try {
      const [accessToken, userProfile] = await AsyncStorage.multiGet([
        'accessToken',
        'userProfile',
      ]);


      if (accessToken[1] && userProfile[1]) {
        const parsedUser = JSON.parse(userProfile[1]);
        setUser(parsedUser);
        console.log('parsed user ', parsedUser)

        try {
          await refreshUser();
        } catch (error) {
          // If refresh fails during initialization, clear everything
          console.log('Token validation failed during initialization');
          await clearAuthData();
          setUser(null);

        }
      }
    } catch (error) {
      console.log('Auth initialization error:', error);
      await clearAuthData();
    } finally {
      setIsLoading(false);
    }
  };

  const sendOTP = async (phoneNumber: string, customerType: string = 'user'): Promise<any> => {
    try {
      console.log('=== Starting OTP Process ===');
      console.log('Phone number:', phoneNumber);
      console.log('Customer type:', customerType);
      console.log('Platform:', Platform.OS);

      const formattedPhone = '+91' + phoneNumber.replace(/\D/g, '');
      console.log('Formatted phone:', formattedPhone);




      const confirmation = await signInWithPhoneNumber(getAuth(), formattedPhone);
      console.log('=== OTP Sent Successfully ===');
      setConfirmation(confirmation);
      return confirmation;

    } catch (error) {
      console.log('=== OTP Error ===');
      console.log('Error details:', error);
      throw error;
    }
  };


  const verifyOTP = async (otp: string, role: string): Promise<{
    nextScreen: string;
    success: boolean;
  }> => {
    try {
      setIsLoading(true);
      if (!confirmation) {
        throw new Error('No OTP confirmation found. Please request a new OTP.');
      }

      // Verify OTP
      const result = await confirmation.confirm(otp);
      const idToken = await result.user.getIdToken();

      console.log('OTP verification successful, sending to backend...');

      // Send idToken and role to backend for authentication
      const response = await apiService.post('/auth/login', {
        idToken,
        role: 'user' // Send the role that was selected during login
      });

      console.log('Backend login response:', response);

      if (response.success) {
        const { accessToken, refreshToken, user: userData } = response.data;

        console.log('userData', userData);

        // Store tokens and user data
        await AsyncStorage.multiSet([
          ['accessToken', accessToken],
          ['refreshToken', refreshToken],
          ['userProfile', JSON.stringify(userData)],
        ]);

        setUser(userData);
        setConfirmation(null); // Clear confirmation after successful verification

        // Register for push notifications after successful login
        await NotificationService.registerDeviceToken();

        if (userData.hasOnboarded) {
          router.replace('/(tabs)');
        } else {
          router.replace('/onboarding');
        }



      } else {
        throw new Error(response.error || 'Login failed');
      }
    } catch (error: any) {
      console.log('Verify OTP error:', error);

      // Clear confirmation on error so user can try again
      setConfirmation(null);

      // Re-throw with a user-friendly message
      if (error.code === 'auth/invalid-verification-code') {
        throw new Error('Invalid OTP. Please check the code and try again.');
      } else if (error.code === 'auth/code-expired') {
        throw new Error('OTP has expired. Please request a new code.');
      } else {
        throw new Error(error.message || 'OTP verification failed. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };



  const register = async (userData: RegisterData): Promise<void> => {
    try {
      setIsLoading(true);

      const response = await apiService.post('/auth/register', userData);

      if (response.success) {
        const { accessToken, refreshToken, user: newUser } = response.data;

        // Store tokens and user data
        await AsyncStorage.multiSet([
          ['accessToken', accessToken],
          ['refreshToken', refreshToken],
          ['userProfile', JSON.stringify(newUser)],
        ]);

        setUser(newUser);
        // router.replace('/onboarding');
        router.replace('/(tabs)');
      } else {
        throw new Error(response.error || 'Registration failed');
      }
    } catch (error: any) {
      throw new Error(error.message || 'Registration failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      setIsLoading(true);

      // Remove notification token from backend
      await NotificationService.removeTokenFromBackend();

      // Clear local notification token
      await NotificationService.clearLocalToken();

      await signOut(getAuth());

      // Clear local storage
      await clearAuthData();

      // Reset state
      setUser(null);
      setConfirmation(null);
      router.replace('/(auth)')

    } catch (error) {
      console.log('Logout error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const clearAuthData = async () => {
    await AsyncStorage.multiRemove([
      'accessToken',
      'refreshToken',
      'userProfile',
    ]);
  };

  const refreshUser = async () => {
    try {
      const response = await apiService.get('/auth/me');

      console.log('response in me ', response)

      if (response.success) {
        const updatedUser = {
          ...response.data.user,
          hasOnboarded: response.data.user.hasOnboarded,
        };

        setUser(updatedUser);

        // Update stored user data
        await AsyncStorage.setItem('userProfile', JSON.stringify(updatedUser));

        if(updatedUser.hasOnboarded){
          router.replace('/(tabs)');
        }else{
          router.replace('/onboarding');
        }

        // if (updatedUser.hasOnboarded) {
        //   router.replace('/(tabs)');
        // } else {
        //   router.replace('/onboarding');
        // }
      } else {
        throw new Error('Failed to refresh user data');
      }
    } catch (error: any) {
      console.log('Refresh user error:', error);

      // Clear auth data when refresh fails
      await clearAuthData();
      setUser(null);
      router.replace('/(auth)');
    }
  };

  const checkMaintenanceMode = async () => {
    try {
      const response = await apiService.get('/configurations/app_maintenance_mode');
      if (response.success) {
        setIsMaintenanceMode(response.data.value === true);
      }
    } catch (error) {
      console.error('Maintenance mode check failed:', error);
      setIsMaintenanceMode(false);
    }
  };

  const checkAuthState = async () => {
    try {
      // Check maintenance mode first
      await checkMaintenanceMode();

      const token = await AsyncStorage.getItem('accessToken');

      if (token) {
        const response = await apiService.get('/auth/me');

        if (response.success) {
          setUser(response.data.user);
          setIsAuthenticated(true);
        } else {
          await clearAuthData();
        }
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      await clearAuthData();
    } finally {
      setIsLoading(false);
    }
  };

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated,
    isMaintenanceMode,
    register,
    logout,
    refreshUser,
    setUser,
    verifyOTP,
    sendOTP
  };

  return (
    <AuthContext.Provider 
      value={{
        isAuthenticated,
        isLoading,
        isMaintenanceMode,
        user,
        login,
        register,
        logout,
        updateUser,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};