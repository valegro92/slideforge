'use client';

import { useTier } from '@/lib/TierContext';
import { useEffect, useState } from 'react';
import styles from './DevTierSwitcher.module.css';

export default function DevTierSwitcher() {
  const { tier, setTier } = useTier();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      setIsVisible(true);
    }
  }, []);

  if (!isVisible) {
    return null;
  }

  return (
    <div className={styles.switcher}>
      <div className={styles.label}>Tier:</div>
      <button
        className={`${styles.button} ${tier === 'free' ? styles.active : ''}`}
        onClick={() => setTier('free')}
      >
        Free
      </button>
      <button
        className={`${styles.button} ${tier === 'pro' ? styles.active : ''}`}
        onClick={() => setTier('pro')}
      >
        Pro
      </button>
      <button
        className={`${styles.button} ${tier === 'enterprise' ? styles.active : ''}`}
        onClick={() => setTier('enterprise')}
      >
        Enterprise
      </button>
    </div>
  );
}
