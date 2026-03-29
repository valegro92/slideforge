'use client';

import { useState } from 'react';
import { useTier } from '@/lib/TierContext';
import LoginModal from './LoginModal';
import Link from 'next/link';
import styles from './EditorLayout.module.css';

export default function EditorLayout({ children }) {
  const { tier, login, logout, isLoggedIn, user } = useTier();
  const [showLoginModal, setShowLoginModal] = useState(false);

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
        {children}
      </main>

      <LoginModal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        onLogin={(userData) => {
          login(userData);
          setShowLoginModal(false);
        }}
      />
    </div>
  );
}
