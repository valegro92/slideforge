'use client';

import { useState } from 'react';

export default function LoginModal({ isOpen, onClose, onLogin, required = false }) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const trimmed = email.trim().toLowerCase();
    if (!trimmed || !trimmed.includes('@')) {
      setError('Inserisci un indirizzo email valido.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/auth/check-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: trimmed }),
      });

      const data = await res.json();

      if (res.status === 429) {
        setError('Troppi tentativi. Riprova tra un minuto.');
        return;
      }

      if (data.authorized) {
        onLogin({ email: data.email, tier: data.tier });
      } else {
        setError(
          'Questa email non è associata a un abbonamento attivo de La Cassetta degli AI-trezzi. Puoi continuare con il piano Free.'
        );
      }
    } catch {
      setError('Errore di connessione. Riprova.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Overlay */}
      <div
        onClick={required ? undefined : onClose}
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.6)',
          backdropFilter: 'blur(4px)',
          zIndex: 1000,
        }}
      />

      {/* Modal */}
      <div
        style={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          background: '#1E1E1E',
          border: '1px solid #454545',
          borderRadius: '16px',
          padding: '2rem',
          maxWidth: '420px',
          width: '90%',
          zIndex: 1001,
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.6)',
          fontFamily: "'DM Sans', system-ui, sans-serif",
        }}
      >
        {/* Close button — nascosto in modalita' bloccante */}
        {!required && (
          <button
            onClick={onClose}
            style={{
              position: 'absolute',
              top: '12px',
              right: '16px',
              background: 'none',
              border: 'none',
              color: '#A9A8A7',
              fontSize: '1.5rem',
              cursor: 'pointer',
              lineHeight: 1,
            }}
            aria-label="Chiudi"
          >
            ×
          </button>
        )}

        {/* Header */}
        <h2
          style={{
            fontSize: '1.35rem',
            fontWeight: 700,
            color: '#FFFFFF',
            marginBottom: '0.5rem',
          }}
        >
          Accedi con la tua email
        </h2>
        <p
          style={{
            fontSize: '0.9rem',
            color: '#A9A8A7',
            lineHeight: 1.5,
            marginBottom: '1.5rem',
          }}
        >
          Se sei un abbonato de{' '}
          <span style={{ color: '#2DD4A8', fontWeight: 600 }}>
            La Cassetta degli AI-trezzi
          </span>
          , inserisci l&apos;email per sbloccare il piano Pro gratuitamente.
        </p>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <input
            type="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              setError('');
            }}
            placeholder="la-tua@email.com"
            autoFocus
            style={{
              width: '100%',
              padding: '12px 16px',
              background: '#292524',
              border: '1px solid #454545',
              borderRadius: '8px',
              color: '#FFFFFF',
              fontSize: '1rem',
              fontFamily: 'inherit',
              outline: 'none',
              marginBottom: '0.75rem',
              boxSizing: 'border-box',
              transition: 'border-color 0.2s',
            }}
            onFocus={(e) => (e.target.style.borderColor = '#2DD4A8')}
            onBlur={(e) => (e.target.style.borderColor = '#454545')}
          />

          {/* Error message */}
          {error && (
            <p
              style={{
                fontSize: '0.85rem',
                color: error.includes('Free') ? '#F59E0B' : '#F87171',
                lineHeight: 1.4,
                marginBottom: '0.75rem',
              }}
            >
              {error}
            </p>
          )}

          {/* Buttons */}
          <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
            {!required && (
              <button
                type="button"
                onClick={onClose}
                style={{
                  flex: 1,
                  padding: '12px 16px',
                  background: 'transparent',
                  border: '1px solid #454545',
                  borderRadius: '8px',
                  color: '#A9A8A7',
                  fontSize: '0.9rem',
                  fontWeight: 600,
                  fontFamily: 'inherit',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
              >
                Continua senza login
              </button>
            )}
            <button
              type="submit"
              disabled={loading || !email.trim()}
              style={{
                flex: 1,
                padding: '12px 16px',
                background: loading ? '#0D9488' : '#2DD4A8',
                border: 'none',
                borderRadius: '8px',
                color: '#1E1E1E',
                fontSize: '0.9rem',
                fontWeight: 700,
                fontFamily: 'inherit',
                cursor: loading ? 'wait' : 'pointer',
                transition: 'all 0.2s',
                opacity: !email.trim() ? 0.5 : 1,
              }}
            >
              {loading ? 'Verifica...' : 'Accedi'}
            </button>
          </div>
        </form>
      </div>
    </>
  );
}
