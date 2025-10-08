import { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

/**
 * A custom hook to easily access the authentication context from any component.
 */
export const useAuth = () => {
  return useContext(AuthContext);
};

/**
 * The provider component that wraps the application and manages authentication state.
 */
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // This effect runs once on initial app load to check for a persisted session.
  useEffect(() => {
    try {
      const token = localStorage.getItem('token');
      const userDataString = localStorage.getItem('user');
      if (token && userDataString) {
        const userData = JSON.parse(userDataString);
        setUser({ ...userData, token });
      }
    } catch (error) {
      console.error("Failed to parse user data from localStorage", error);
    }
    setIsLoading(false);
  }, []);

  const login = (data) => {
    if (data && data.user && data.token) {
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      setUser({ ...data.user, token: data.token }); 
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  const value = {
    user,
    login,
    logout,
    isLoading,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};