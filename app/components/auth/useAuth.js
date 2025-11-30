// components/auth/useAuth.js
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '../../components/ui/use-toast';

export function useAuth(requiredRole = null) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  // Function to check authentication status
  const checkAuth = useCallback(async () => {
    try {
      const res = await fetch('/api/auth/check', {
        method: 'GET',
        credentials: 'include', // Important for cookies
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!res.ok) {
        throw new Error('Authentication failed');
      }

      const data = await res.json();
      
      if (!data.user) {
        throw new Error('No user data received');
      }

      // Check if user has required role
      if (requiredRole && data.user.role !== requiredRole) {
        toast({
          title: "Unauthorized",
          description: "You don't have permission to access this page",
          variant: "destructive",
        });
        router.push(`/auth/${data.user.role}/login`);
        return false;
      }

      setUser(data.user);
      setIsAuthenticated(true);
      return true;

    } catch (error) {
      console.error('Auth check failed:', error);
      setUser(null);
      setIsAuthenticated(false);
      if (requiredRole) {
        router.push(`/auth/${requiredRole}/login`);
      }
      return false;
    } finally {
      setLoading(false);
    }
  }, [requiredRole, router, toast]);

  // Login function
  const login = async (credentials, role) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/auth/${role}/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Login failed');
      }

      await checkAuth(); // Verify authentication after login

      toast({
        title: "Success",
        description: "Logged in successfully",
      });

      // Redirect based on role
      router.push(`/dashboard/${role}`);
      return true;

    } catch (error) {
      toast({
        title: "Error",
        description: error.message || "Login failed",
        variant: "destructive",
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Logout function
  const logout = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/auth/logout`, {
        method: 'POST',
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Logout failed');
      }

      // Clear user state
      setUser(null);
      setIsAuthenticated(false);

      toast({
        title: "Success",
        description: "Logged out successfully",
      });

      // Redirect to home
      router.push('/');

    } catch (error) {
      toast({
        title: "Error",
        description: "Logout failed",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Function to update user data
  const updateUser = async (updatedData) => {
    try {
      const response = await fetch(`/api/user/update`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(updatedData),
      });

      if (!response.ok) {
        throw new Error('Failed to update user data');
      }

      await checkAuth(); // Refresh user data
      toast({
        title: "Success",
        description: "Profile updated successfully",
      });
      return true;

    } catch (error) {
      toast({
        title: "Error",
        description: error.message || "Failed to update profile",
        variant: "destructive",
      });
      return false;
    }
  };

  // Check auth status on mount and when required role changes
  useEffect(() => {
    checkAuth();

    // Optional: Set up periodic auth check
    const interval = setInterval(checkAuth, 5 * 60 * 1000); // Check every 5 minutes

    return () => clearInterval(interval);
  }, []);

  // Function to get auth headers for API requests
  const getAuthHeaders = useCallback(() => {
    return {
      'Content-Type': 'application/json',
      // Add any other headers needed for authentication
    };
  }, []);

  // Function to handle unauthorized responses
  const handleUnauthorized = useCallback(() => {
    setUser(null);
    setIsAuthenticated(false);
    router.push(`/auth/${requiredRole}/login`);
  }, [requiredRole, router]);

  // Utility function for authenticated API calls
  const authFetch = useCallback(async (url, options = {}) => {
    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          ...getAuthHeaders(),
          ...options.headers,
        },
        credentials: 'include',
      });

      if (response.status === 401) {
        handleUnauthorized();
        throw new Error('Unauthorized');
      }

      return response;
    } catch (error) {
      console.error('API call failed:', error);
      throw error;
    }
  }, [getAuthHeaders, handleUnauthorized]);

  return {
    user,
    loading,
    isAuthenticated,
    login,
    logout,
    updateUser,
    checkAuth,
    authFetch,
    getAuthHeaders,
  };
}
