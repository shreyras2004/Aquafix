import React, { createContext, useState, useEffect, useContext } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../config/api';

const AuthContext = createContext({});

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if token exists in AsyncStorage on app load
    const loadStoredAuth = async () => {
      try {
        const storedToken = await AsyncStorage.getItem('token');
        if (storedToken) {
          setToken(storedToken);
          // Verify token and fetch user details
          const response = await api.get('/auth/me');
          if (response.data.success) {
            setUser(response.data.user);
          } else {
            // Clears stale token
            await AsyncStorage.removeItem('token');
          }
        }
      } catch (error) {
        console.error('Error loading stored auth:', error);
      } finally {
        setLoading(false);
      }
    };

    loadStoredAuth();
  }, []);

  const login = async (email, password) => {
    try {
      setLoading(true);
      const response = await api.post('/auth/login', { email, password });
      
      if (response.data.success) {
        const { token: userToken, user: userData } = response.data;
        await AsyncStorage.setItem('token', userToken);
        setToken(userToken);
        setUser(userData);
        return { success: true };
      }
    } catch (error) {
      console.error('Login error:', error.response?.data || error.message);
      return {
        success: false,
        message: error.response?.data?.message || 'Login failed. Please check credentials.',
      };
    } finally {
      setLoading(false);
    }
  };

  const register = async (userData) => {
    try {
      setLoading(true);
      const response = await api.post('/auth/register', userData);
      
      if (response.data.success) {
        const { token: userToken, user: newUser } = response.data;
        await AsyncStorage.setItem('token', userToken);
        setToken(userToken);
        setUser(newUser);
        return { success: true };
      }
    } catch (error) {
      console.error('Registration error:', error.response?.data || error.message);
      return {
        success: false,
        message: error.response?.data?.message || 'Registration failed. Try again.',
      };
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      setLoading(true);
      await AsyncStorage.removeItem('token');
      setToken(null);
      setUser(null);
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async (profileData) => {
    try {
      const response = await api.put('/auth/update', profileData);
      if (response.data.success) {
        setUser(response.data.user);
        return { success: true };
      }
    } catch (error) {
      console.error('Update profile error:', error.response?.data || error.message);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to update profile.',
      };
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        login,
        register,
        logout,
        updateProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
