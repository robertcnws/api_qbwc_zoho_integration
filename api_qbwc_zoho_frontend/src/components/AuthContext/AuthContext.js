import React, { createContext, useState, useEffect, useContext } from 'react';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    // Verifica el token al montar el componente
    const token = localStorage.getItem('authToken');
    if (token) {
      // Puedes hacer una solicitud para validar el token aquí
      setIsAuthenticated(true);  // Si el token es válido
    }
  }, []);

  // Lógica para iniciar sesión
  const login = (token) => {
    localStorage.setItem('authToken', token);
    setIsAuthenticated(true);
  };

  // Lógica para cerrar sesión
  const logout = () => {
    localStorage.removeItem('authToken');
    setIsAuthenticated(false);
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  return useContext(AuthContext);
};
