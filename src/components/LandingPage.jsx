'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import LoginModal from './LoginModal';
import { useTier } from '../lib/TierContext';

const theme = {
  dark: '#292524',
  darkAlt: '#1E1E1E',
  teal: '#2DD4A8',
  tealDim: 'rgba(45, 212, 168, 0.12)',
  tealBorder: 'rgba(45, 212, 168, 0.25)',
  stone800: '#1C1917',
  stone700: '#292524',
  stone600: '#3F3B39',
  stone500: '#57534E',
  stone400: '#A8A29E',
  stone300: '#D6D3D1',
  stone50: '#FAFAF9',
};

const LandingPage = () => {
  const [scrollY, setScrollY] = useState(0);
  const [visibleSections, setVisibleSections] = useState({});
  const [showLoginModal, setShowLoginModal] = useState(false);
  const { login, isLoggedIn, user, logout } = useTier();

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setVisibleSections((prev) => ({ ...prev, [entry.target.id]: true }));
          }
        });
      },
      { threshold: 0.12, rootMargin: '0px 0px -80px 0px' }
    );

    document.querySelectorAll('[data-observe]').forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  const scrollToSection = (id) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  const handleLogin = ({ email, tier }) => {
    login({ email, tier });
    setShowLoginModal(false);
  };

  const fadeIn = (id) => ({
    opacity: visibleSections[id] ? 1 : 0,
    transform: visibleSections[id] ? 'translateY(0)' : 'translateY(24px)',
    transition: 'opacity 0.6s ease, transform 0.6s ease',
  });

  return (
    <div
      style={{
        fontFamily: 'DM Sans, system-ui, sans-serif',
        backgroundColor: theme.dark,
        color: theme.stone300,
        minHeight: '100vh',
        overflowX: 'hidden',
      }}
    >
      {/* ── Navigation ──────────────────────────────────────────── */}
      <nav
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 100,
          backgroundColor: scrollY > 20 ? 'rgba(41, 37, 36, 0.97)' : 'transparent',
          backdropFilter: scrollY > 20 ? 'blur(12px)' : 'none',
          borderBottom: scrollY > 20 ? `1px solid ${theme.stone600}` : '1px solid transparent',
          padding: '1rem 0',
          transition: 'all 0.3s ease',
        }}
      >
        <div
          style={{
            maxWidth: '1200px',
            margin: '0 auto',
            padding: '0 1.5rem',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          {/* Logo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
            <span
              style={{
                fontSize: '1.375rem',
                fontWeight: 700,
                color: theme.teal,
                letterSpacing: '-0.02em',
              }}
            >
              SlideForge
            </span>
            <span
              style={{
                fontSize: '0.75rem',
                color: theme.stone400,
                backgroundColor: theme.stone600,
                padding: '0.2rem 0.5rem',
                borderRadius: '999px',
                fontWeight: 500,
                letterSpacing: '0.01em',
              }}
            >
              L'Officina
            </span>
          </div>

          {/* Nav links */}
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            {['Come funziona', 'Prezzi'].map((label, i) => {
              const ids = ['how-it-works', 'pricing'];
              return (
                <button
                  key={label}
                  onClick={() => scrollToSection(ids[i])}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: theme.stone400,
                    cursor: 'pointer',
                    fontSize: '0.9rem',
                    fontFamily: 'DM Sans, sans-serif',
                    padding: '0.5rem 0.875rem',
                    borderRadius: '0.375rem',
                    transition: 'color 0.2s',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = theme.teal)}
                  onMouseLeave={(e) => (e.currentTarget.style.color = theme.stone400)}
                >
                  {label}
                </button>
              );
            })}

            {isLoggedIn ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <span style={{ fontSize: '0.85rem', color: theme.teal, fontWeight: 600 }}>
                  {user?.email}
                </span>
                <button
                  onClick={logout}
                  style={{
                    background: 'none',
                    border: `1px solid ${theme.stone600}`,
                    color: theme.stone300,
                    padding: '0.5rem 1rem',
                    borderRadius: '0.375rem',
                    fontSize: '0.875rem',
                    fontWeight: 600,
                    fontFamily: 'DM Sans, sans-serif',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = theme.teal;
                    e.currentTarget.style.color = theme.teal;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = theme.stone600;
                    e.currentTarget.style.color = theme.stone300;
                  }}
                >
                  Esci
                </button>
              </div>
            ) : (
              <button
                onClick={() => setShowLoginModal(true)}
                style={{
                  background: 'none',
                  border: `1px solid ${theme.stone600}`,
                  color: theme.stone300,
                  padding: '0.5rem 1rem',
                  borderRadius: '0.375rem',
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  fontFamily: 'DM Sans, sans-serif',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = theme.teal;
                  e.currentTarget.style.color = theme.teal;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = theme.stone600;
                  e.currentTarget.style.color = theme.stone300;
                }}
              >
                Accedi
              </button>
            )}

            <Link
              href="/app"
              style={{
                backgroundColor: theme.teal,
                color: theme.dark,
                padding: '0.5rem 1.125rem',
                borderRadius: '0.375rem',
                fontSize: '0.875rem',
                fontWeight: 700,
                fontFamily: 'DM Sans, sans-serif',
                textDecoration: 'none',
                transition: 'opacity 0.2s',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.85')}
              onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
            >
              Carica PDF
            </Link>
          </div>
        </div>
      </nav>

      {/* ── Hero ────────────────────────────────────────────────── */}
      <section
        style={{
          padding: '7rem 1.5rem 5rem',
          maxWidth: '1200px',
          margin: '0 auto',
          textAlign: 'center',
        }}
      >
        {/* Badge */}
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
            backgroundColor: theme.tealDim,
            border: `1px solid ${theme.tealBorder}`,
            borderRadius: '999px',
            padding: '0.375rem 0.875rem',
            marginBottom: '2rem',
          }}
        >
          <span style={{ fontSize: '0.8rem', color: theme.teal, fontWeight: 600 }}>
            App del mese — L'Officina di La Cassetta degli AI-trezzi
          </span>
        </div>

        <h1
          style={{
            fontSize: 'clamp(2.25rem, 5vw, 3.75rem)',
            fontWeight: 800,
            color: theme.stone50,
            lineHeight: 1.15,
            letterSpacing: '-0.03em',
            marginBottom: '1.5rem',
            maxWidth: '820px',
            margin: '0 auto 1.5rem',
          }}
        >
          Le tue slide NotebookLM,{' '}
          <span style={{ color: theme.teal }}>finalmente editabili</span>
        </h1>

        <p
          style={{
            fontSize: 'clamp(1.05rem, 2vw, 1.25rem)',
            color: theme.stone400,
            lineHeight: 1.7,
            maxWidth: '600px',
            margin: '0 auto 2.75rem',
          }}
        >
          Carica il PDF esportato da NotebookLM &rarr; ottieni un PPTX con testo e immagini
          editabili. In 30 secondi.
        </p>

        {/* CTA buttons */}
        <div
          style={{
            display: 'flex',
            gap: '1rem',
            justifyContent: 'center',
            flexWrap: 'wrap',
          }}
        >
          <Link
            href="/app"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              backgroundColor: theme.teal,
              color: theme.dark,
              padding: '0.875rem 2rem',
              borderRadius: '0.5rem',
              fontSize: '1rem',
              fontWeight: 700,
              fontFamily: 'DM Sans, sans-serif',
              textDecoration: 'none',
              transition: 'opacity 0.2s, transform 0.2s',
              boxShadow: `0 0 24px rgba(45, 212, 168, 0.25)`,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.opacity = '0.9';
              e.currentTarget.style.transform = 'translateY(-1px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.opacity = '1';
              e.currentTarget.style.transform = 'translateY(0)';
            }}
          >
            Carica il tuo PDF
            <span style={{ fontSize: '1.1rem' }}>→</span>
          </Link>

          <button
            onClick={() => scrollToSection('pricing')}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              background: 'none',
              border: `1px solid ${theme.stone600}`,
              color: theme.stone300,
              padding: '0.875rem 2rem',
              borderRadius: '0.5rem',
              fontSize: '1rem',
              fontWeight: 600,
              fontFamily: 'DM Sans, sans-serif',
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = theme.teal;
              e.currentTarget.style.color = theme.teal;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = theme.stone600;
              e.currentTarget.style.color = theme.stone300;
            }}
          >
            Scopri L'Officina
          </button>
        </div>

        {/* Social proof */}
        <p
          style={{
            marginTop: '2.25rem',
            fontSize: '0.85rem',
            color: theme.stone500,
          }}
        >
          Nessuna installazione &nbsp;·&nbsp; Funziona subito &nbsp;·&nbsp; Dati non salvati
        </p>
      </section>

      {/* ── Problem ─────────────────────────────────────────────── */}
      <section
        id="problem"
        data-observe
        style={{
          padding: '5rem 1.5rem',
          backgroundColor: theme.stone800,
          borderTop: `1px solid ${theme.stone600}`,
          borderBottom: `1px solid ${theme.stone600}`,
          ...fadeIn('problem'),
        }}
      >
        <div style={{ maxWidth: '860px', margin: '0 auto', textAlign: 'center' }}>
          <p
            style={{
              fontSize: '0.8rem',
              fontWeight: 700,
              letterSpacing: '0.1em',
              color: theme.stone500,
              textTransform: 'uppercase',
              marginBottom: '1rem',
            }}
          >
            Il problema
          </p>
          <h2
            style={{
              fontSize: 'clamp(1.75rem, 3.5vw, 2.5rem)',
              fontWeight: 800,
              color: theme.stone50,
              lineHeight: 1.25,
              letterSpacing: '-0.025em',
              marginBottom: '1.5rem',
            }}
          >
            NotebookLM genera slide bellissime —{' '}
            <span style={{ color: '#F87171' }}>ma sono PDF piatti</span>
          </h2>
          <p
            style={{
              fontSize: '1.1rem',
              color: theme.stone400,
              lineHeight: 1.75,
              marginBottom: '2rem',
            }}
          >
            Immagini rasterizzate, zero testo estraibile. Ogni volta che vuoi modificare anche
            solo un titolo, devi ricominciare da zero.
          </p>

          {/* Pain points */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
              gap: '1rem',
              marginTop: '2rem',
            }}
          >
            {[
              { icon: '🔒', text: 'Testo non selezionabile' },
              { icon: '🖼️', text: 'Immagini non estraibili' },
              { icon: '✏️', text: 'Nessuna modifica possibile' },
              { icon: '⏱️', text: 'Ore perse a rifare tutto' },
            ].map(({ icon, text }) => (
              <div
                key={text}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  backgroundColor: theme.stone700,
                  border: `1px solid ${theme.stone600}`,
                  borderRadius: '0.625rem',
                  padding: '0.875rem 1.125rem',
                }}
              >
                <span style={{ fontSize: '1.25rem' }}>{icon}</span>
                <span style={{ fontSize: '0.9rem', color: theme.stone300, fontWeight: 500 }}>
                  {text}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it works ────────────────────────────────────────── */}
      <section
        id="how-it-works"
        data-observe
        style={{
          padding: '6rem 1.5rem',
          maxWidth: '1200px',
          margin: '0 auto',
          ...fadeIn('how-it-works'),
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: '3.5rem' }}>
          <p
            style={{
              fontSize: '0.8rem',
              fontWeight: 700,
              letterSpacing: '0.1em',
              color: theme.teal,
              textTransform: 'uppercase',
              marginBottom: '0.75rem',
            }}
          >
            Come funziona
          </p>
          <h2
            style={{
              fontSize: 'clamp(1.75rem, 3.5vw, 2.5rem)',
              fontWeight: 800,
              color: theme.stone50,
              letterSpacing: '-0.025em',
              lineHeight: 1.2,
            }}
          >
            Tre passi. Trenta secondi.
          </h2>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '1.5rem',
          }}
        >
          {[
            {
              step: '01',
              title: 'Carica il PDF da NotebookLM',
              description:
                'Esporta le slide da NotebookLM come PDF e caricale direttamente su SlideForge. Nessuna configurazione richiesta.',
              icon: '📄',
            },
            {
              step: '02',
              title: "L'AI riconosce testo e immagini",
              description:
                "Gemini 2.5 Flash analizza ogni pagina, estrae il testo con precisione e isola le immagini mantenendo il layout originale.",
              icon: '🔍',
            },
            {
              step: '03',
              title: 'Scarica il PPTX editabile',
              description:
                'In pochi secondi ottieni un file PowerPoint con testo modificabile, immagini separate e formattazione pulita.',
              icon: '📥',
            },
          ].map(({ step, title, description, icon }, idx) => (
            <div
              key={step}
              style={{
                position: 'relative',
                backgroundColor: theme.stone800,
                border: `1px solid ${theme.stone600}`,
                borderRadius: '0.875rem',
                padding: '2rem',
                transition: 'border-color 0.2s, transform 0.2s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = theme.tealBorder;
                e.currentTarget.style.transform = 'translateY(-3px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = theme.stone600;
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              <div
                style={{
                  position: 'absolute',
                  top: '1.5rem',
                  right: '1.5rem',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  color: theme.stone500,
                  letterSpacing: '0.05em',
                }}
              >
                {step}
              </div>
              <div
                style={{
                  fontSize: '2.25rem',
                  marginBottom: '1rem',
                }}
              >
                {icon}
              </div>
              <h3
                style={{
                  fontSize: '1.1rem',
                  fontWeight: 700,
                  color: theme.stone50,
                  marginBottom: '0.625rem',
                  lineHeight: 1.3,
                }}
              >
                {title}
              </h3>
              <p
                style={{
                  fontSize: '0.9rem',
                  color: theme.stone400,
                  lineHeight: 1.7,
                }}
              >
                {description}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Pricing ─────────────────────────────────────────────── */}
      <section
        id="pricing"
        data-observe
        style={{
          padding: '6rem 1.5rem',
          backgroundColor: theme.stone800,
          borderTop: `1px solid ${theme.stone600}`,
          ...fadeIn('pricing'),
        }}
      >
        <div style={{ maxWidth: '960px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '3.5rem' }}>
            <p
              style={{
                fontSize: '0.8rem',
                fontWeight: 700,
                letterSpacing: '0.1em',
                color: theme.teal,
                textTransform: 'uppercase',
                marginBottom: '0.75rem',
              }}
            >
              L'Officina
            </p>
            <h2
              style={{
                fontSize: 'clamp(1.75rem, 3.5vw, 2.5rem)',
                fontWeight: 800,
                color: theme.stone50,
                letterSpacing: '-0.025em',
                lineHeight: 1.2,
                marginBottom: '1rem',
              }}
            >
              Un'app AI professionale ogni mese
            </h2>
            <p
              style={{
                fontSize: '1.05rem',
                color: theme.stone400,
                maxWidth: '520px',
                margin: '0 auto',
                lineHeight: 1.65,
              }}
            >
              Iscriviti a L'Officina di La Cassetta degli AI-trezzi e ottieni accesso a
              SlideForge — e a ogni nuova app che rilasciamo.
            </p>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
              gap: '1.5rem',
              alignItems: 'start',
            }}
          >
            {/* Free plan */}
            <div
              style={{
                backgroundColor: theme.stone700,
                border: `1px solid ${theme.stone600}`,
                borderRadius: '1rem',
                padding: '2rem',
              }}
            >
              <p
                style={{
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  color: theme.stone400,
                  marginBottom: '0.5rem',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                }}
              >
                Prova gratuita
              </p>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'baseline',
                  gap: '0.375rem',
                  marginBottom: '1.5rem',
                }}
              >
                <span
                  style={{
                    fontSize: '2.5rem',
                    fontWeight: 800,
                    color: theme.stone50,
                    letterSpacing: '-0.03em',
                  }}
                >
                  €0
                </span>
              </div>
              <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 2rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {[
                  'Fino a 3 pagine per PDF',
                  'OCR offline (Tesseract)',
                  'Export PPTX',
                  'Nessuna registrazione',
                ].map((feat) => (
                  <li
                    key={feat}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.625rem',
                      fontSize: '0.9rem',
                      color: theme.stone400,
                    }}
                  >
                    <span style={{ color: theme.stone500, fontSize: '1rem' }}>·</span>
                    {feat}
                  </li>
                ))}
              </ul>
              <Link
                href="/app"
                style={{
                  display: 'block',
                  textAlign: 'center',
                  border: `1px solid ${theme.stone600}`,
                  color: theme.stone300,
                  padding: '0.75rem',
                  borderRadius: '0.5rem',
                  fontSize: '0.9rem',
                  fontWeight: 600,
                  fontFamily: 'DM Sans, sans-serif',
                  textDecoration: 'none',
                  transition: 'all 0.2s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = theme.stone400;
                  e.currentTarget.style.color = theme.stone50;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = theme.stone600;
                  e.currentTarget.style.color = theme.stone300;
                }}
              >
                Prova gratis
              </Link>
            </div>

            {/* Paid plan */}
            <div
              style={{
                backgroundColor: theme.dark,
                border: `2px solid ${theme.teal}`,
                borderRadius: '1rem',
                padding: '2rem',
                position: 'relative',
                boxShadow: `0 0 40px rgba(45, 212, 168, 0.1)`,
              }}
            >
              {/* Badge */}
              <div
                style={{
                  position: 'absolute',
                  top: '-0.875rem',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  backgroundColor: theme.teal,
                  color: theme.dark,
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  padding: '0.25rem 0.875rem',
                  borderRadius: '999px',
                  whiteSpace: 'nowrap',
                }}
              >
                Questo mese: SlideForge
              </div>

              <p
                style={{
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  color: theme.teal,
                  marginBottom: '0.5rem',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                }}
              >
                L'Officina
              </p>

              <div
                style={{
                  display: 'flex',
                  alignItems: 'baseline',
                  gap: '0.375rem',
                  marginBottom: '0.5rem',
                }}
              >
                <span
                  style={{
                    fontSize: '2.75rem',
                    fontWeight: 800,
                    color: theme.stone50,
                    letterSpacing: '-0.03em',
                  }}
                >
                  €11.90
                </span>
                <span style={{ fontSize: '0.95rem', color: theme.stone400 }}>/mese</span>
              </div>

              <p
                style={{
                  fontSize: '0.85rem',
                  color: theme.stone400,
                  marginBottom: '1.5rem',
                  lineHeight: 1.5,
                }}
              >
                Ogni mese una nuova app AI professionale. SlideForge &egrave; quella di{' '}
                {new Date().toLocaleString('it-IT', { month: 'long', year: 'numeric' })}.
              </p>

              <ul
                style={{
                  listStyle: 'none',
                  padding: 0,
                  margin: '0 0 2rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.75rem',
                }}
              >
                {[
                  'Fino a 50 pagine per PDF',
                  'AI Vision — Gemini 2.5 Flash',
                  'Riconoscimento testo e immagini',
                  'Export PPTX editabile',
                  'Nessun watermark',
                  'Accesso a tutte le app precedenti',
                ].map((feat) => (
                  <li
                    key={feat}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.625rem',
                      fontSize: '0.9rem',
                      color: theme.stone300,
                    }}
                  >
                    <span style={{ color: theme.teal, fontSize: '0.9rem', fontWeight: 700 }}>
                      ✓
                    </span>
                    {feat}
                  </li>
                ))}
              </ul>

              <a
                href="#"
                style={{
                  display: 'block',
                  textAlign: 'center',
                  backgroundColor: theme.teal,
                  color: theme.dark,
                  padding: '0.875rem',
                  borderRadius: '0.5rem',
                  fontSize: '1rem',
                  fontWeight: 700,
                  fontFamily: 'DM Sans, sans-serif',
                  textDecoration: 'none',
                  transition: 'opacity 0.2s',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.85')}
                onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
              >
                Iscriviti a L'Officina
              </a>

              <p
                style={{
                  textAlign: 'center',
                  fontSize: '0.8rem',
                  color: theme.stone500,
                  marginTop: '0.875rem',
                }}
              >
                Già iscritto?{' '}
                <button
                  onClick={() => setShowLoginModal(true)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: theme.teal,
                    cursor: 'pointer',
                    fontSize: '0.8rem',
                    fontFamily: 'DM Sans, sans-serif',
                    padding: 0,
                    textDecoration: 'underline',
                    textUnderlineOffset: '2px',
                  }}
                >
                  Accedi qui
                </button>
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── FAQ ─────────────────────────────────────────────────── */}
      <section
        id="faq"
        data-observe
        style={{
          padding: '6rem 1.5rem',
          maxWidth: '720px',
          margin: '0 auto',
          ...fadeIn('faq'),
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
          <h2
            style={{
              fontSize: 'clamp(1.5rem, 3vw, 2rem)',
              fontWeight: 800,
              color: theme.stone50,
              letterSpacing: '-0.025em',
            }}
          >
            Domande frequenti
          </h2>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {[
            {
              q: 'Funziona solo con NotebookLM?',
              a: "SlideForge funziona con qualsiasi PDF di presentazione. L'integrazione con NotebookLM è ottimizzata perché è il caso d'uso più comune, ma puoi usarlo con qualsiasi PDF di slide.",
            },
            {
              q: 'I miei file vengono salvati?',
              a: 'No. Il PDF viene elaborato in memoria e il PPTX generato viene inviato direttamente al tuo browser. Non conserviamo nessun contenuto dei tuoi documenti.',
            },
            {
              q: 'Qual è la differenza tra OCR offline e AI Vision?',
              a: "L'OCR offline (Tesseract) funziona senza connessione e ha qualità base: riconosce il testo ma può sbagliare con font particolari. AI Vision usa Gemini 2.5 Flash e riconosce testo, tabelle, formule e layout complessi con precisione molto maggiore.",
            },
            {
              q: "Come funziona L'Officina?",
              a: "L'Officina è un abbonamento mensile a €11.90 che ti dà accesso a tutte le app che costruiamo per gli iscritti de La Cassetta degli AI-trezzi. Ogni mese una nuova app professionale. SlideForge è quella attuale.",
            },
          ].map(({ q, a }) => (
            <FaqItem key={q} question={q} answer={a} theme={theme} />
          ))}
        </div>
      </section>

      {/* ── Footer ──────────────────────────────────────────────── */}
      <footer
        style={{
          borderTop: `1px solid ${theme.stone600}`,
          padding: '3rem 1.5rem',
          backgroundColor: theme.stone800,
        }}
      >
        <div
          style={{
            maxWidth: '1200px',
            margin: '0 auto',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '1.25rem',
            textAlign: 'center',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontSize: '1.125rem', fontWeight: 700, color: theme.teal }}>
              SlideForge
            </span>
            <span style={{ color: theme.stone500, fontSize: '0.875rem' }}>fa parte de</span>
            <span style={{ fontSize: '0.875rem', color: theme.stone300, fontWeight: 600 }}>
              La Cassetta degli AI-trezzi
            </span>
          </div>

          <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap', justifyContent: 'center' }}>
            <a
              href="https://lacassettadegliaitrezzi.it"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                fontSize: '0.85rem',
                color: theme.stone400,
                textDecoration: 'none',
                transition: 'color 0.2s',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = theme.teal)}
              onMouseLeave={(e) => (e.currentTarget.style.color = theme.stone400)}
            >
              Newsletter
            </a>
            <button
              onClick={() => scrollToSection('pricing')}
              style={{
                background: 'none',
                border: 'none',
                fontSize: '0.85rem',
                color: theme.stone400,
                cursor: 'pointer',
                fontFamily: 'DM Sans, sans-serif',
                padding: 0,
                transition: 'color 0.2s',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = theme.teal)}
              onMouseLeave={(e) => (e.currentTarget.style.color = theme.stone400)}
            >
              L'Officina
            </button>
            <Link
              href="/app"
              style={{
                fontSize: '0.85rem',
                color: theme.stone400,
                textDecoration: 'none',
                transition: 'color 0.2s',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = theme.teal)}
              onMouseLeave={(e) => (e.currentTarget.style.color = theme.stone400)}
            >
              Prova gratis
            </Link>
          </div>

          <p style={{ fontSize: '0.8rem', color: theme.stone500 }}>
            Costruito con AI &nbsp;·&nbsp; &copy; {new Date().getFullYear()} La Cassetta degli AI-trezzi
          </p>
        </div>
      </footer>

      {/* ── Login Modal ─────────────────────────────────────────── */}
      {showLoginModal && (
        <LoginModal
          onClose={() => setShowLoginModal(false)}
          onLogin={handleLogin}
        />
      )}
    </div>
  );
};

/* ── FAQ accordion item ─────────────────────────────────────── */
const FaqItem = ({ question, answer, theme }) => {
  const [open, setOpen] = useState(false);

  return (
    <div
      style={{
        backgroundColor: theme.stone800,
        border: `1px solid ${open ? theme.tealBorder : theme.stone600}`,
        borderRadius: '0.75rem',
        overflow: 'hidden',
        transition: 'border-color 0.2s',
      }}
    >
      <button
        onClick={() => setOpen((v) => !v)}
        style={{
          width: '100%',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '1.125rem 1.375rem',
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          fontFamily: 'DM Sans, sans-serif',
          textAlign: 'left',
          gap: '1rem',
        }}
      >
        <span
          style={{
            fontSize: '0.95rem',
            fontWeight: 600,
            color: open ? theme.stone50 : theme.stone300,
            transition: 'color 0.2s',
          }}
        >
          {question}
        </span>
        <span
          style={{
            color: theme.teal,
            fontSize: '1.1rem',
            flexShrink: 0,
            transform: open ? 'rotate(45deg)' : 'rotate(0deg)',
            transition: 'transform 0.2s',
          }}
        >
          +
        </span>
      </button>
      {open && (
        <div
          style={{
            padding: '0 1.375rem 1.125rem',
          }}
        >
          <p
            style={{
              fontSize: '0.9rem',
              color: theme.stone400,
              lineHeight: 1.75,
              margin: 0,
            }}
          >
            {answer}
          </p>
        </div>
      )}
    </div>
  );
};

export default LandingPage;
