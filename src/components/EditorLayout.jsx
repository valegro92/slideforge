'use client';

import { useState, useEffect } from 'react';
import { useTier } from '@/lib/TierContext';
import LoginModal from './LoginModal';
import Link from 'next/link';
import styles from './EditorLayout.module.css';

export default function EditorLayout({ children }) {
  const { tier, login, logout, isLoggedIn, user } = useTier();
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  // Aspetta l'idratazione per evitare flash del modal mentre il context
  // rilegge la sessione da localStorage.
  useEffect(() => {
    setHydrated(true);
  }, []);

  const blocked = hydrated && !isLoggedIn;

  const tierBadgeColor = {
    free: '#6B7280',
    pro: '#2DD4A8',
    enterprise: '#F59E0B'
  };

  const tierBadgeBg = {
    free: '#374151',
    pro: '#1F3A3A',
    enterprise: '#78350F'
  };

  return (
    <div className={styles.container}>
      <nav className={styles.navbar}>
        <div className={styles.leftSection}>
          <Link href="/" className={styles.logo}>
            Slide<span className={styles.logoAccent}>Forge</span>
          </Link>
        </div>

        <div className={styles.centerSection}>
          <div
            className={styles.tierBadge}
            style={{
              background: tierBadgeBg[tier],
              color: tierBadgeColor[tier]
            }}
          >
            {tier.toUpperCase()}
          </div>
          {isLoggedIn && user?.email && (
            <span className={styles.userEmail}>{user.email}</span>
          )}
        </div>

        <div className={styles.rightSection}>
          {isLoggedIn ? (
            <button className={styles.logoutButton} onClick={logout}>
              Esci
            </button>
          ) : (
            tier !== 'pro' && tier !== 'enterprise' && (
              <button
                className={styles.upgradeButton}
                onClick={() => setShowLoginModal(true)}
              >
                Upgrade
              </button>
            )
          )}
          <Link href="/" className={styles.homeLink}>
            Home
          </Link>
        </div>
      </nav>

      <main className={styles.main}>
        {blocked ? (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              minHeight: '60vh',
              padding: '2rem',
              textAlign: 'center',
              color: '#A9A8A7',
              fontFamily: "'DM Sans', system-ui, sans-serif",
            }}
          >
            <h2 style={{ color: '#FFFFFF', fontSize: '1.5rem', marginBottom: '0.75rem' }}>
              Accesso riservato
            </h2>
            <p style={{ maxWidth: '420px', lineHeight: 1.5 }}>
              SlideForge è disponibile solo per gli abbonati de{' '}
              <span style={{ color: '#2DD4A8', fontWeight: 600 }}>
                La Cassetta degli AI-trezzi
              </span>
              . Inserisci la tua email Officina per accedere.
            </p>
          </div>
        ) : (
          children
        )}
      </main>

      <LoginModal
        isOpen={showLoginModal || blocked}
        required={blocked}
        onClose={() => setShowLoginModal(false)}
        onLogin={(userData) => {
          login(userData);
          setShowLoginModal(false);
        }}
      />
    </div>
  );
}
