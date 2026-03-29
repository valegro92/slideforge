'use client';

import { createContext, useContext, useState } from 'react';

const TierContext = createContext({ tier: 'free', setTier: () => {} });

export function TierProvider({ children }) {
  const [tier, setTier] = useState('free');
  return (
    <TierContext.Provider value={{ tier, setTier }}>
      {children}
    </TierContext.Provider>
  );
}

export function useTier() {
  return useContext(TierContext);
}
