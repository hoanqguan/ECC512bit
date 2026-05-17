import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';

import { appParams } from '@/lib/app-params';
import { LocalAuth } from './localAuth';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [isLoadingPublicSettings, setIsLoadingPublicSettings] = useState(true);
  const [authError, setAuthError] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [appPublicSettings, setAppPublicSettings] = useState(null); // Contains only { id, public_settings }

  useEffect(() => {
    checkAppState();
  }, []);

  const checkAppState = async () => {
    // Local mode: no backend calls needed
    setIsLoadingPublicSettings(false);
    setIsLoadingAuth(true);
    // check local session
    const session = LocalAuth.getSession();
    if (session) {
      const fullUser = LocalAuth.getUserById(session.userId);
      setUser(fullUser);
      setIsAuthenticated(true);
    } else {
      setUser(null);
      setIsAuthenticated(false);
    }
    setIsLoadingAuth(false);
    setAuthChecked(true);
  };

  const checkUserAuth = async () => {
    setIsLoadingAuth(true);
    const session = LocalAuth.getSession();
    if (session) {
      const fullUser = LocalAuth.getUserById(session.userId);
      setUser(fullUser);
      setIsAuthenticated(true);
      setAuthError(null);
    } else {
      setUser(null);
      setIsAuthenticated(false);
    }
    setIsLoadingAuth(false);
    setAuthChecked(true);
  };

  const logout = useCallback(() => {
    LocalAuth.logout();
    setUser(null);
    setIsAuthenticated(false);
  }, []);

  const navigateToLogin = () => {
    // placeholder for app-level navigation helper
  };

  const isAuthorized = (allowedRoles) => {
    return LocalAuth.isAuthorized(allowedRoles);
  };

  return (
    <AuthContext.Provider value={{ 
        user,
        isAuthenticated,
        isLoadingAuth,
        isLoadingPublicSettings,
        authError,
        appPublicSettings,
        authChecked,
        logout,
        navigateToLogin,
        checkUserAuth,
        checkAppState,
        isAuthorized
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};