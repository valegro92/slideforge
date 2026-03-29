'use client';

import { createContext, useContext, useState, useEffect, useCallback } from 'react';

const STORAGE_KEY = 'slideforge_auth';

const TierContext = createContext({
  tier: 'free',
  setTier: () => {},
  user: null,
  login: () => {},
  logout: () => {},
  isLoggedIn: false,
});

export function TierProvider({ children }) {
  const [tier, setTier] = useState('free');
  const [user, setUser] = useState(null);

  // Restore session from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed && parsed.email && parsed.tier) {
          setUser(parsed);
          setTier(parsed.tier);
        }
      }
    } catch {
      localStorage.removeItem(STORAGE_KEY);
    }
  }, []);

  const login = useCallback((userData) => {
    const { email, tier: userTier } = userData;
    const session = { email, tier: userTier };
    setUser(session);
    setTier(userTier);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
    } catch {
      // localStorage not available
    }
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    setTier('free');
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // localStorage not available
    }
  }, []);

  const isLoggedIn = user !== null;

  return (
    <TierContext.Provider value={{ tier, setTier, user, login, logout, isLoggedIn }}>
      {children}
    </TierContext.Provider>
  );
}

export function useTier() {
  return useContext(TierContext);
}
