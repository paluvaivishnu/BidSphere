import { createContext, useContext, useState, useEffect } from 'react';
import API from '../api/axios';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const checkAuth = async () => {
    const storedUser = localStorage.getItem('user');
    const token = localStorage.getItem('token');
    
    if (storedUser && token) {
      const parsedUser = JSON.parse(storedUser);
      setUser(parsedUser);
      
      // Fetch latest user data in background to sync watchlist and state
      try {
        const { data } = await API.get('/auth/me');
        if (data.success) {
          const latestUser = { ...parsedUser, ...data.data };
          setUser(latestUser);
          localStorage.setItem('user', JSON.stringify(latestUser));
        }
      } catch (err) {
        if (err.response?.status === 401) {
          logout();
        }
      }
    }
    setLoading(false);
  };

  useEffect(() => {
    checkAuth();
  }, []);

  const login = async (email, password) => {
    const { data } = await API.post('/auth/login', { email, password });
    const userData = data.data;
    localStorage.setItem('token', userData.token);
    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);
    return userData;
  };

  const register = async (name, email, password, role, phone) => {
    const { data } = await API.post('/auth/register', { name, email, password, role, phone });
    const userData = data.data;
    localStorage.setItem('token', userData.token);
    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);
    return userData;
  };

  const loginWithGoogle = async (credential, role = 'buyer') => {
    const { data } = await API.post('/auth/google', { credential, role });
    const userData = data.data;
    localStorage.setItem('token', userData.token);
    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);
    return userData;
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  const updateUser = (updatedData) => {
    const newUser = { ...user, ...updatedData };
    localStorage.setItem('user', JSON.stringify(newUser));
    setUser(newUser);
  };

  const toggleWatchlist = async (auctionId) => {
    try {
      const { data } = await API.post(`/users/watchlist/${auctionId}`);
      if (data.success) {
        updateUser({ watchlist: data.watchlist });
        return data.watchlist;
      }
    } catch (err) {
      console.error('Failed to toggle watchlist:', err);
      throw err;
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, loginWithGoogle, logout, updateUser, toggleWatchlist }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
