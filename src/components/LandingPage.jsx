'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import LoginModal from './LoginModal';
import { useTier } from '../lib/TierContext';

const LandingPage = () => {
  const [scrollY, setScrollY] = useState(0);
  const [visibleSections, setVisibleSections] = useState({});
  const [showLoginModal, setShowLoginModal] = useState(false);
  const { login, isLoggedIn, user, logout } = useTier();

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const observerOptions = {
      threshold: 0.15,
      rootMargin: '0px 0px -100px 0px',
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          setVisibleSections((prev) => ({
            ...prev,
            [entry.target.id]: true,
          }));
        }
      });
    }, observerOptions);

    document.querySelectorAll('[data-observe]').forEach((el) => {
      observer.observe(el);
    });

    return () => observer.disconnect();
  }, []);

  const scrollToSection = (id) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleLogin = ({ email, tier }) => {
    login({ email, tier });
    setShowLoginModal(false);
  };

  // CSS Variables for theming
  const theme = {
    dark: '#292524',
    teal: '#2DD4A8',
    amber: '#F59E0B',
    stone700: '#3F3F46',
    stone600: '#52525B',
    stone400: '#A1A1AA',
    stone300: '#D4D4D8',
    stone50: '#FAFAFA',
  };

  return (
    <div
      style={{
        '--primary-dark': theme.dark,
        '--accent-teal': theme.teal,
        '--accent-amber': theme.amber,
        '--stone-700': theme.stone700,
        '--stone-600': theme.stone600,
        '--stone-400': theme.stone400,
        '--stone-300': theme.stone300,
        '--stone-50': theme.stone50,
      }}
    >
      {/* Navigation */}
      <nav
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 100,
          backgroundColor: 'rgba(41, 37, 36, 0.95)',
          backdropFilter: 'blur(10px)',
          borderBottom: `1px solid ${theme.stone700}`,
          padding: '1rem 0',
        }}
      >
        <div
          style={{
            maxWidth: '1280px',
            margin: '0 auto',
            padding: '0 1.5rem',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <div
            style={{
              fontSize: '1.5rem',
              fontWeight: 700,
              color: theme.teal,
              fontFamily: 'DM Sans, sans-serif',
              letterSpacing: '-0.02em',
            }}
          >
            SlideForge
          </div>
          <div
            style={{
              display: 'flex',
              gap: '2rem',
              alignItems: 'center',
            }}
          >
            <button
              onClick={() => scrollToSection('how-it-works')}
              style={{
                background: 'none',
                border: 'none',
                color: theme.stone300,
                cursor: 'pointer',
                fontSize: '0.95rem',
                fontFamily: 'DM Sans, sans-serif',
                transition: 'color 0.3s',
                padding: '0.5rem 1rem',
              }}
              onMouseEnter={(e) => (e.target.style.color = theme.teal)}
              onMouseLeave={(e) => (e.target.style.color = theme.stone300)}
            >
              Come funziona
            </button>
            {isLoggedIn ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <span
                  style={{
                    fontSize: '0.875rem',
                    color: theme.teal,
                    fontFamily: 'DM Sans, sans-serif',
                    fontWeight: 600,
                  }}
                >
                  {user?.email}
                </span>
                <button
                  onClick={logout}
                  style={{
                    background: 'none',
                    border: `1px solid ${theme.stone600}`,
                    color: theme.stone300,
                    padding: '0.625rem 1.25rem',
                    borderRadius: '0.375rem',
                    fontSize: '0.95rem',
                    fontWeight: 600,
                    fontFamily: 'DM Sans, sans-serif',
                    transition: 'all 0.3s',
                    cursor: 'pointer',
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.borderColor = theme.teal;
                    e.target.style.color = theme.teal;
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.borderColor = theme.stone600;
                    e.target.style.color = theme.stone300;
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
                  padding: '0.625rem 1.25rem',
                  borderRadius: '0.375rem',
                  fontSize: '0.95rem',
                  fontWeight: 600,
                  fontFamily: 'DM Sans, sans-serif',
                  transition: 'all 0.3s',
                  cursor: 'pointer',
                }}
                onMouseEnter={(e) => {
                  e.target.style.borderColor = theme.teal;
                  e.target.style.color = theme.teal;
                }}
                onMouseLeave={(e) => {
                  e.target.style.borderColor = theme.stone600;
                  e.target.style.color = theme.stone300;
                }}
              >
                Accedi
              </button>
            )}
            <Link
              href="/app"
              style={{
                backgroundColor: theme.amber,
                color: theme.dark,
                padding: '0.625rem 1.5rem',
                borderRadius: '0.375rem',
                textDecoration: 'none',
                fontSize: '0.95rem',
                fontWeight: 600,
                fontFamily: 'DM Sans, sans-serif',
                transition: 'all 0.3s',
                display: 'inline-block',
                cursor: 'pointer',
              }}
              onMouseEnter={(e) => {
                e.target.style.backgroundColor = '#FBBF24';
                e.target.style.transform = 'scale(1.05)';
              }}
              onMouseLeave={(e) => {
                e.target.style.backgroundColor = theme.amber;
                e.target.style.transform = 'scale(1)';
              }}
            >
              Carica il tuo PDF
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section
        id="hero"
        data-observe
        style={{
          backgroundColor: theme.dark,
          background: `linear-gradient(135deg, ${theme.dark} 0%, #3a3431 100%)`,
          color: theme.stone50,
          padding: '120px 1.5rem',
          textAlign: 'center',
          position: 'relative',
          overflow: 'hidden',
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {/* Animated background gradient orbs */}
        <div
          style={{
            position: 'absolute',
            width: '400px',
            height: '400px',
            background: `radial-gradient(circle, ${theme.teal}20 0%, transparent 70%)`,
            borderRadius: '50%',
            top: '-100px',
            right: '-100px',
            opacity: visibleSections.hero ? 1 : 0,
            transition: 'opacity 1s ease-out',
            animation: visibleSections.hero ? 'float 6s ease-in-out infinite' : 'none',
            pointerEvents: 'none',
          }}
        />
        <div
          style={{
            position: 'absolute',
            width: '300px',
            height: '300px',
            background: `radial-gradient(circle, ${theme.teal}10 0%, transparent 70%)`,
            borderRadius: '50%',
            bottom: '-50px',
            left: '-50px',
            opacity: visibleSections.hero ? 1 : 0,
            transition: 'opacity 1s ease-out',
            animation: visibleSections.hero ? 'float 8s ease-in-out infinite reverse' : 'none',
            pointerEvents: 'none',
          }}
        />

        <div
          style={{
            maxWidth: '900px',
            position: 'relative',
            zIndex: 10,
            animation: visibleSections.hero ? 'slideUp 0.8s ease-out' : 'none',
          }}
        >
          {/* Hero Illustration */}
          <div
            style={{
              marginBottom: '2rem',
              height: '280px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              perspective: '1000px',
            }}
          >
            <svg
              viewBox="0 0 400 250"
              style={{
                width: '100%',
                maxWidth: '400px',
                height: 'auto',
                filter: visibleSections.hero
                  ? 'drop-shadow(0 20px 40px rgba(45, 212, 168, 0.15))'
                  : 'none',
                transition: 'filter 0.8s ease-out',
              }}
            >
              {/* PDF Document */}
              <g
                style={{
                  animation: visibleSections.hero
                    ? 'slideInLeft 0.8s ease-out'
                    : 'none',
                }}
              >
                <rect
                  x="20"
                  y="50"
                  width="80"
                  height="110"
                  rx="4"
                  fill={theme.stone600}
                  stroke={theme.stone400}
                  strokeWidth="2"
                />
                <rect
                  x="25"
                  y="55"
                  width="70"
                  height="100"
                  fill={theme.stone700}
                />
                <line
                  x1="30"
                  y1="70"
                  x2="85"
                  y2="70"
                  stroke={theme.stone400}
                  strokeWidth="1.5"
                />
                <line
                  x1="30"
                  y1="80"
                  x2="85"
                  y2="80"
                  stroke={theme.stone400}
                  strokeWidth="1.5"
                />
                <line
                  x1="30"
                  y1="90"
                  x2="85"
                  y2="90"
                  stroke={theme.stone400}
                  strokeWidth="1.5"
                />
                <rect
                  x="30"
                  y="100"
                  width="20"
                  height="20"
                  rx="2"
                  fill={theme.stone500 || theme.stone600}
                />
              </g>

              {/* Magic Arrow */}
              <g
                style={{
                  animation: visibleSections.hero
                    ? 'pulse 2s ease-in-out infinite'
                    : 'none',
                  animationDelay: '0.3s',
                }}
              >
                <path
                  d="M 120 120 Q 160 100 200 120"
                  stroke={theme.teal}
                  strokeWidth="2.5"
                  fill="none"
                  strokeLinecap="round"
                  strokeDasharray="80"
                  strokeDashoffset={visibleSections.hero ? '0' : '80'}
                  style={{
                    transition: 'stroke-dashoffset 1s ease-out',
                  }}
                />
                <polygon
                  points="200,120 210,115 205,125"
                  fill={theme.teal}
                />
                {/* Sparkle effects */}
                <circle
                  cx="145"
                  cy="95"
                  r="3"
                  fill={theme.teal}
                  opacity={visibleSections.hero ? 0.6 : 0}
                  style={{
                    animation: visibleSections.hero
                      ? 'twinkle 1.5s ease-in-out infinite'
                      : 'none',
                  }}
                />
                <circle
                  cx="175"
                  cy="110"
                  r="2"
                  fill={theme.amber}
                  opacity={visibleSections.hero ? 0.6 : 0}
                  style={{
                    animation: visibleSections.hero
                      ? 'twinkle 1.5s ease-in-out infinite'
                      : 'none',
                    animationDelay: '0.3s',
                  }}
                />
              </g>

              {/* PPTX Document */}
              <g
                style={{
                  animation: visibleSections.hero
                    ? 'slideInRight 0.8s ease-out'
                    : 'none',
                }}
              >
                <rect
                  x="300"
                  y="50"
                  width="80"
                  height="110"
                  rx="4"
                  fill={theme.teal}
                  opacity="0.1"
                  stroke={theme.teal}
                  strokeWidth="2"
                />
                <rect
                  x="305"
                  y="55"
                  width="70"
                  height="100"
                  fill={theme.teal}
                  opacity="0.05"
                />
                <line
                  x1="310"
                  y1="70"
                  x2="365"
                  y2="70"
                  stroke={theme.teal}
                  strokeWidth="2"
                />
                <rect
                  x="310"
                  y="80"
                  width="30"
                  height="15"
                  rx="2"
                  fill={theme.teal}
                  opacity="0.6"
                />
                <line
                  x1="310"
                  y1="102"
                  x2="365"
                  y2="102"
                  stroke={theme.teal}
                  strokeWidth="1.5"
                  opacity="0.4"
                />
                <line
                  x1="310"
                  y1="112"
                  x2="365"
                  y2="112"
                  stroke={theme.teal}
                  strokeWidth="1.5"
                  opacity="0.4"
                />
                <circle
                  cx="345"
                  cy="132"
                  r="4"
                  fill={theme.teal}
                  opacity="0.6"
                />
              </g>
            </svg>
          </div>

          {/* Headline */}
          <h1
            style={{
              fontSize: 'clamp(2rem, 8vw, 3.5rem)',
              fontWeight: 800,
              lineHeight: 1.1,
              marginBottom: '1rem',
              fontFamily: 'DM Sans, sans-serif',
              letterSpacing: '-0.02em',
              color: theme.stone50,
              animation: visibleSections.hero
                ? 'slideUp 0.8s ease-out 0.1s both'
                : 'none',
            }}
          >
            Le tue slide NotebookLM,{' '}
            <span style={{ color: theme.teal }}>finalmente editabili</span>
          </h1>

          {/* Subheadline */}
          <p
            style={{
              fontSize: 'clamp(1rem, 2.5vw, 1.25rem)',
              lineHeight: 1.6,
              color: theme.stone300,
              marginBottom: '2.5rem',
              maxWidth: '700px',
              margin: '0 auto 2.5rem',
              fontFamily: 'DM Sans, sans-serif',
              fontWeight: 400,
              animation: visibleSections.hero
                ? 'slideUp 0.8s ease-out 0.2s both'
                : 'none',
            }}
          >
            Carica il PDF esportato da NotebookLM e ottieni un PPTX con testo, immagini
            e layout editabili. In 30 secondi, senza rifare nulla da zero.
          </p>

          {/* CTA Buttons */}
          <div
            style={{
              display: 'flex',
              gap: '1rem',
              justifyContent: 'center',
              flexWrap: 'wrap',
              animation: visibleSections.hero
                ? 'slideUp 0.8s ease-out 0.3s both'
                : 'none',
            }}
          >
            <Link
              href="/app"
              style={{
                backgroundColor: theme.amber,
                color: theme.dark,
                padding: '1rem 2rem',
                borderRadius: '0.5rem',
                textDecoration: 'none',
                fontSize: '1.05rem',
                fontWeight: 700,
                fontFamily: 'DM Sans, sans-serif',
                cursor: 'pointer',
                border: 'none',
                transition: 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
                boxShadow: `0 10px 30px ${theme.amber}33`,
                display: 'inline-block',
              }}
              onMouseEnter={(e) => {
                e.target.style.backgroundColor = '#FBBF24';
                e.target.style.boxShadow = `0 20px 50px ${theme.amber}55`;
                e.target.style.transform = 'translateY(-2px)';
              }}
              onMouseLeave={(e) => {
                e.target.style.backgroundColor = theme.amber;
                e.target.style.boxShadow = `0 10px 30px ${theme.amber}33`;
                e.target.style.transform = 'translateY(0)';
              }}
            >
              Carica il tuo PDF
            </Link>
            <button
              onClick={() => scrollToSection('how-it-works')}
              style={{
                backgroundColor: 'transparent',
                color: theme.teal,
                padding: '1rem 2rem',
                borderRadius: '0.5rem',
                border: `2px solid ${theme.teal}`,
                fontSize: '1.05rem',
                fontWeight: 700,
                fontFamily: 'DM Sans, sans-serif',
                cursor: 'pointer',
                transition: 'all 0.3s',
              }}
              onMouseEnter={(e) => {
                e.target.style.backgroundColor = `${theme.teal}15`;
                e.target.style.transform = 'translateY(-2px)';
              }}
              onMouseLeave={(e) => {
                e.target.style.backgroundColor = 'transparent';
                e.target.style.transform = 'translateY(0)';
              }}
            >
              Guarda come funziona
            </button>
          </div>
        </div>
      </section>

      {/* Problem/Solution Section */}
      <section
        id="problem-solution"
        data-observe
        style={{
          backgroundColor: theme.dark,
          color: theme.stone50,
          padding: '80px 1.5rem',
          background: `linear-gradient(180deg, ${theme.dark} 0%, #3a3431 100%)`,
        }}
      >
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
              gap: '3rem',
              marginTop: '3rem',
            }}
          >
            {/* Problem Card */}
            <article
              style={{
                backgroundColor: theme.stone700,
                backgroundImage: `linear-gradient(135deg, ${theme.stone700} 0%, ${theme.stone600} 100%)`,
                padding: '2.5rem',
                borderRadius: '0.75rem',
                border: `1px solid ${theme.stone600}`,
                backdropFilter: 'blur(10px)',
                opacity: visibleSections['problem-solution'] ? 1 : 0,
                transform: visibleSections['problem-solution']
                  ? 'translateY(0)'
                  : 'translateY(40px)',
                transition: 'all 0.6s ease-out',
              }}
            >
              <h3
                style={{
                  fontSize: '1.75rem',
                  fontWeight: 700,
                  marginBottom: '1rem',
                  color: '#EF4444',
                  fontFamily: 'DM Sans, sans-serif',
                }}
              >
                Il problema
              </h3>
              <p
                style={{
                  fontSize: '1rem',
                  lineHeight: 1.7,
                  color: theme.stone300,
                  fontFamily: 'DM Sans, sans-serif',
                }}
              >
                NotebookLM genera slide bellissime, ma sono PDF rasterizzati. Ogni slide è un'immagine
                piatta — zero testo estraibile, impossibile da modificare senza rifare tutto da zero.
              </p>
            </article>

            {/* Solution Card */}
            <article
              style={{
                backgroundColor: `${theme.teal}20`,
                background: `linear-gradient(135deg, ${theme.teal}15 0%, ${theme.teal}05 100%)`,
                padding: '2.5rem',
                borderRadius: '0.75rem',
                border: `2px solid ${theme.teal}`,
                backdropFilter: 'blur(10px)',
                opacity: visibleSections['problem-solution'] ? 1 : 0,
                transform: visibleSections['problem-solution']
                  ? 'translateY(0)'
                  : 'translateY(40px)',
                transition: 'all 0.6s ease-out 0.1s',
              }}
            >
              <h3
                style={{
                  fontSize: '1.75rem',
                  fontWeight: 700,
                  marginBottom: '1rem',
                  color: theme.teal,
                  fontFamily: 'DM Sans, sans-serif',
                }}
              >
                La soluzione
              </h3>
              <p
                style={{
                  fontSize: '1rem',
                  lineHeight: 1.7,
                  color: theme.stone300,
                  fontFamily: 'DM Sans, sans-serif',
                }}
              >
                SlideForge usa AI Vision per riconoscere testo, immagini e layout dalle tue slide
                NotebookLM. Li ricostruisce come elementi editabili in un PPTX perfetto.
              </p>
            </article>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section
        id="how-it-works"
        data-observe
        style={{
          backgroundColor: theme.dark,
          color: theme.stone50,
          padding: '80px 1.5rem',
          background: `linear-gradient(180deg, #3a3431 0%, ${theme.dark} 100%)`,
        }}
      >
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <h2
            style={{
              fontSize: 'clamp(2rem, 5vw, 2.75rem)',
              fontWeight: 800,
              textAlign: 'center',
              marginBottom: '0.5rem',
              fontFamily: 'DM Sans, sans-serif',
              letterSpacing: '-0.02em',
            }}
          >
            Come funziona
          </h2>
          <p
            style={{
              fontSize: '1.1rem',
              textAlign: 'center',
              color: theme.stone400,
              marginBottom: '3.5rem',
              fontFamily: 'DM Sans, sans-serif',
            }}
          >
            Tre semplici step
          </p>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
              gap: '2rem',
            }}
          >
            {[
              {
                number: '1',
                title: 'Carica il PDF da NotebookLM',
                description: 'Seleziona il PDF esportato dalle tue slide',
              },
              {
                number: '2',
                title: "L'AI riconosce testo e immagini",
                description:
                  'AI Vision estrae ogni elemento dalla slide rasterizzata',
              },
              {
                number: '3',
                title: 'Scarica il PPTX editabile',
                description:
                  'Modifica il testo nell\'editor e esporta in PowerPoint',
              },
            ].map((step, idx) => (
              <article
                key={idx}
                data-observe
                id={`step-${idx}`}
                style={{
                  backgroundColor: theme.stone700,
                  backgroundImage: `linear-gradient(135deg, ${theme.stone700} 0%, ${theme.stone600} 100%)`,
                  padding: '2rem',
                  borderRadius: '0.75rem',
                  border: `1px solid ${theme.stone600}`,
                  position: 'relative',
                  overflow: 'hidden',
                  opacity: visibleSections['how-it-works'] ? 1 : 0,
                  transform: visibleSections['how-it-works']
                    ? 'translateY(0)'
                    : 'translateY(40px)',
                  transition: `all 0.6s ease-out ${idx * 0.1}s`,
                  backdropFilter: 'blur(10px)',
                }}
              >
                <div
                  style={{
                    position: 'absolute',
                    top: '-1px',
                    left: '-1px',
                    right: '-1px',
                    height: '1px',
                    background: `linear-gradient(90deg, transparent, ${theme.teal}, transparent)`,
                  }}
                />
                <div
                  style={{
                    width: '48px',
                    height: '48px',
                    backgroundColor: theme.teal,
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1.5rem',
                    fontWeight: 800,
                    color: theme.dark,
                    marginBottom: '1rem',
                    fontFamily: 'DM Sans, sans-serif',
                  }}
                >
                  {step.number}
                </div>
                <h3
                  style={{
                    fontSize: '1.25rem',
                    fontWeight: 700,
                    marginBottom: '0.75rem',
                    fontFamily: 'DM Sans, sans-serif',
                  }}
                >
                  {step.title}
                </h3>
                <p
                  style={{
                    fontSize: '0.95rem',
                    color: theme.stone400,
                    lineHeight: 1.6,
                    fontFamily: 'DM Sans, sans-serif',
                  }}
                >
                  {step.description}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section
        id="features"
        data-observe
        style={{
          backgroundColor: theme.dark,
          color: theme.stone50,
          padding: '80px 1.5rem',
          background: `linear-gradient(180deg, ${theme.dark} 0%, #3a3431 100%)`,
        }}
      >
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <h2
            style={{
              fontSize: 'clamp(2rem, 5vw, 2.75rem)',
              fontWeight: 800,
              textAlign: 'center',
              marginBottom: '0.5rem',
              fontFamily: 'DM Sans, sans-serif',
              letterSpacing: '-0.02em',
            }}
          >
            Funzionalità potenti
          </h2>
          <p
            style={{
              fontSize: '1.1rem',
              textAlign: 'center',
              color: theme.stone400,
              marginBottom: '3.5rem',
              fontFamily: 'DM Sans, sans-serif',
            }}
          >
            Tutto quello che serve
          </p>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: '1.5rem',
            }}
          >
            {[
              {
                icon: '🤖',
                title: 'AI Vision multi-modello',
                desc: 'Nemotron, Gemini, Qwen e altri',
              },
              {
                icon: '✏️',
                title: 'Editor visuale',
                desc: 'Drag & resize di testo e forme',
              },
              {
                icon: '📊',
                title: 'Export PPTX nativo',
                desc: 'PptxGenJS con full compatibility',
              },
              {
                icon: '🔓',
                title: 'OCR offline',
                desc: 'Tesseract per funzionamento senza AI',
              },
              {
                icon: '💻',
                title: 'Browser-based',
                desc: 'Nessuna installazione, tutto nel browser',
              },
              {
                icon: '🔒',
                title: 'Privacy-first',
                desc: 'File non lasciano mai il tuo dispositivo',
              },
            ].map((feat, idx) => (
              <article
                key={idx}
                style={{
                  backgroundColor: `${theme.teal}08`,
                  border: `1px solid ${theme.teal}30`,
                  padding: '1.75rem',
                  borderRadius: '0.625rem',
                  backdropFilter: 'blur(10px)',
                  opacity: visibleSections.features ? 1 : 0,
                  transform: visibleSections.features
                    ? 'translateY(0)'
                    : 'translateY(20px)',
                  transition: `all 0.5s ease-out ${idx * 0.05}s`,
                  hoverEffects: true,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = theme.teal;
                  e.currentTarget.style.backgroundColor = `${theme.teal}15`;
                  e.currentTarget.style.transform = 'translateY(-4px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = `${theme.teal}30`;
                  e.currentTarget.style.backgroundColor = `${theme.teal}08`;
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                <div
                  style={{
                    fontSize: '2rem',
                    marginBottom: '0.75rem',
                  }}
                >
                  {feat.icon}
                </div>
                <h3
                  style={{
                    fontSize: '1rem',
                    fontWeight: 700,
                    marginBottom: '0.5rem',
                    fontFamily: 'DM Sans, sans-serif',
                  }}
                >
                  {feat.title}
                </h3>
                <p
                  style={{
                    fontSize: '0.875rem',
                    color: theme.stone400,
                    lineHeight: 1.5,
                    fontFamily: 'DM Sans, sans-serif',
                  }}
                >
                  {feat.desc}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section
        id="pricing"
        data-observe
        style={{
          backgroundColor: theme.dark,
          color: theme.stone50,
          padding: '80px 1.5rem',
          background: `linear-gradient(180deg, #3a3431 0%, ${theme.dark} 100%)`,
        }}
      >
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <h2
            style={{
              fontSize: 'clamp(2rem, 5vw, 2.75rem)',
              fontWeight: 800,
              textAlign: 'center',
              marginBottom: '0.5rem',
              fontFamily: 'DM Sans, sans-serif',
              letterSpacing: '-0.02em',
            }}
          >
            Piani semplici e trasparenti
          </h2>
          <p
            style={{
              fontSize: '1.1rem',
              textAlign: 'center',
              color: theme.stone400,
              marginBottom: '2rem',
              fontFamily: 'DM Sans, sans-serif',
            }}
          >
            Scegli quello che fa per te
          </p>

          <div
            style={{
              backgroundColor: `${theme.teal}15`,
              border: `1px solid ${theme.teal}50`,
              borderRadius: '0.5rem',
              padding: '1rem 1.5rem',
              textAlign: 'center',
              marginBottom: '2.5rem',
              fontFamily: 'DM Sans, sans-serif',
              fontSize: '0.95rem',
              color: theme.stone300,
            }}
          >
            Sei un abbonato de{' '}
            <span style={{ color: theme.teal, fontWeight: 700 }}>
              La Cassetta degli AI-trezzi
            </span>
            ? Accedi con la tua email per sbloccare il piano Pro gratuitamente.
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
              gap: '2rem',
              marginTop: '2rem',
            }}
          >
            {[
              {
                name: 'FREE',
                price: '€0',
                period: '',
                features: [
                  '3 pagine/PDF',
                  'OCR offline',
                  'Export con watermark',
                ],
                cta: 'Carica il tuo PDF',
                highlighted: false,
              },
              {
                name: 'PRO',
                price: '€9.99',
                period: '/mese',
                description: 'Gratuito per gli abbonati de La Cassetta degli AI-trezzi',
                features: [
                  '50 pagine/PDF',
                  'AI Vision (4 modelli)',
                  'Nessun watermark',
                  'Drag & resize testo',
                  'Supporto email',
                ],
                cta: 'Accedi con email',
                highlighted: true,
              },
              {
                name: 'ENTERPRISE',
                price: '€29.99',
                period: '/mese',
                features: [
                  '200 pagine/PDF',
                  'Tutti i modelli AI',
                  'API REST dedicata',
                  'Batch processing',
                  'Brand personalizzato',
                  'Supporto prioritario',
                ],
                cta: 'Contattaci',
                highlighted: false,
              },
            ].map((plan, idx) => (
              <article
                key={idx}
                style={{
                  backgroundColor: plan.highlighted
                    ? `${theme.teal}15`
                    : theme.stone700,
                  background: plan.highlighted
                    ? `linear-gradient(135deg, ${theme.teal}15 0%, ${theme.teal}05 100%)`
                    : `linear-gradient(135deg, ${theme.stone700} 0%, ${theme.stone600} 100%)`,
                  border: plan.highlighted
                    ? `2px solid ${theme.teal}`
                    : `1px solid ${theme.stone600}`,
                  padding: '2.5rem',
                  borderRadius: '0.75rem',
                  position: 'relative',
                  opacity: visibleSections.pricing ? 1 : 0,
                  transform: visibleSections.pricing
                    ? 'translateY(0) scale(1)'
                    : 'translateY(40px) scale(0.95)',
                  transition: `all 0.6s ease-out ${idx * 0.1}s`,
                  backdropFilter: 'blur(10px)',
                  display: 'flex',
                  flexDirection: 'column',
                }}
              >
                {plan.highlighted && (
                  <div
                    style={{
                      position: 'absolute',
                      top: '-12px',
                      left: '50%',
                      transform: 'translateX(-50%)',
                      backgroundColor: theme.amber,
                      color: theme.dark,
                      padding: '0.375rem 1rem',
                      borderRadius: '0.25rem',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      fontFamily: 'DM Sans, sans-serif',
                      letterSpacing: '0.05em',
                    }}
                  >
                    PIÙ POPOLARE
                  </div>
                )}

                <h3
                  style={{
                    fontSize: '1.5rem',
                    fontWeight: 700,
                    marginBottom: '0.5rem',
                    fontFamily: 'DM Sans, sans-serif',
                  }}
                >
                  {plan.name}
                </h3>

                <div style={{ marginBottom: '1.5rem' }}>
                  <div
                    style={{
                      fontSize: '2.75rem',
                      fontWeight: 800,
                      fontFamily: 'DM Sans, sans-serif',
                    }}
                  >
                    {plan.price}
                  </div>
                  <div
                    style={{
                      fontSize: '0.875rem',
                      color: theme.stone400,
                      fontFamily: 'DM Sans, sans-serif',
                    }}
                  >
                    {plan.period}
                  </div>
                  {plan.description && (
                    <div
                      style={{
                        marginTop: '0.625rem',
                        fontSize: '0.8rem',
                        color: theme.teal,
                        fontFamily: 'DM Sans, sans-serif',
                        fontWeight: 600,
                      }}
                    >
                      {plan.description}
                    </div>
                  )}
                </div>

                <ul
                  style={{
                    flex: 1,
                    listStyle: 'none',
                    padding: 0,
                    marginBottom: '2rem',
                  }}
                >
                  {plan.features.map((feature, fidx) => (
                    <li
                      key={fidx}
                      style={{
                        fontSize: '0.95rem',
                        padding: '0.75rem 0',
                        color: theme.stone300,
                        borderBottom: `1px solid ${theme.stone600}`,
                        fontFamily: 'DM Sans, sans-serif',
                        display: 'flex',
                        alignItems: 'center',
                      }}
                    >
                      <span
                        style={{
                          color: theme.teal,
                          marginRight: '0.75rem',
                          fontSize: '1.1rem',
                        }}
                      >
                        ✓
                      </span>
                      {feature}
                    </li>
                  ))}
                </ul>

                {plan.name === 'PRO' ? (
                  <button
                    onClick={() => setShowLoginModal(true)}
                    style={{
                      backgroundColor: theme.amber,
                      color: theme.dark,
                      border: 'none',
                      padding: '0.875rem 1.5rem',
                      borderRadius: '0.375rem',
                      fontSize: '0.95rem',
                      fontWeight: 700,
                      fontFamily: 'DM Sans, sans-serif',
                      textAlign: 'center',
                      cursor: 'pointer',
                      transition: 'all 0.3s',
                      display: 'inline-block',
                      width: '100%',
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.backgroundColor = '#FBBF24';
                      e.target.style.transform = 'translateY(-2px)';
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.backgroundColor = theme.amber;
                      e.target.style.transform = 'translateY(0)';
                    }}
                  >
                    {plan.cta}
                  </button>
                ) : (
                  <Link
                    href={plan.name === 'FREE' ? '/app' : '#'}
                    style={{
                      backgroundColor: 'transparent',
                      color: theme.teal,
                      border: `2px solid ${theme.teal}`,
                      padding: '0.875rem 1.5rem',
                      borderRadius: '0.375rem',
                      textDecoration: 'none',
                      fontSize: '0.95rem',
                      fontWeight: 700,
                      fontFamily: 'DM Sans, sans-serif',
                      textAlign: 'center',
                      cursor: 'pointer',
                      transition: 'all 0.3s',
                      display: 'inline-block',
                      width: '100%',
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.backgroundColor = `${theme.teal}20`;
                      e.target.style.transform = 'translateY(-2px)';
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.backgroundColor = 'transparent';
                      e.target.style.transform = 'translateY(0)';
                    }}
                  >
                    {plan.cta}
                  </Link>
                )}
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Social Proof / Trust Section */}
      <section
        id="trust"
        data-observe
        style={{
          backgroundColor: theme.dark,
          color: theme.stone50,
          padding: '80px 1.5rem',
          textAlign: 'center',
          background: `linear-gradient(180deg, ${theme.dark} 0%, #3a3431 100%)`,
        }}
      >
        <div style={{ maxWidth: '900px', margin: '0 auto' }}>
          <h2
            style={{
              fontSize: 'clamp(1.75rem, 4vw, 2.5rem)',
              fontWeight: 800,
              marginBottom: '1rem',
              fontFamily: 'DM Sans, sans-serif',
              letterSpacing: '-0.02em',
            }}
          >
            Pensato per chi lavora con le slide ogni giorno
          </h2>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '1.5rem',
              marginTop: '3rem',
            }}
          >
            {[
              { emoji: '💼', label: 'Consulenti' },
              { emoji: '🎓', label: 'Formatori' },
              { emoji: '🏢', label: 'PMI' },
              { emoji: '🏛️', label: 'Pubblica Amministrazione' },
            ].map((target, idx) => (
              <div
                key={idx}
                style={{
                  backgroundColor: theme.stone700,
                  backgroundImage: `linear-gradient(135deg, ${theme.stone700} 0%, ${theme.stone600} 100%)`,
                  padding: '2rem',
                  borderRadius: '0.625rem',
                  border: `1px solid ${theme.stone600}`,
                  opacity: visibleSections.trust ? 1 : 0,
                  transform: visibleSections.trust
                    ? 'translateY(0)'
                    : 'translateY(20px)',
                  transition: `all 0.5s ease-out ${idx * 0.08}s`,
                }}
              >
                <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>
                  {target.emoji}
                </div>
                <div
                  style={{
                    fontSize: '1rem',
                    fontWeight: 600,
                    fontFamily: 'DM Sans, sans-serif',
                  }}
                >
                  {target.label}
                </div>
              </div>
            ))}
          </div>

          <div
            style={{
              display: 'flex',
              gap: '1.5rem',
              justifyContent: 'center',
              flexWrap: 'wrap',
              marginTop: '4rem',
            }}
          >
            {[
              '🇮🇹 Made in Italy',
              '🔒 Privacy-first',
              '⚡ No server-side processing',
              '🧰 La Cassetta degli AI-trezzi',
            ].map((badge, idx) => (
              <div
                key={idx}
                style={{
                  backgroundColor: `${theme.teal}20`,
                  border: `1px solid ${theme.teal}40`,
                  padding: '0.75rem 1.5rem',
                  borderRadius: '0.375rem',
                  fontSize: '0.95rem',
                  fontWeight: 600,
                  fontFamily: 'DM Sans, sans-serif',
                  opacity: visibleSections.trust ? 1 : 0,
                  transform: visibleSections.trust
                    ? 'scale(1)'
                    : 'scale(0.9)',
                  transition: `all 0.5s ease-out ${0.3 + idx * 0.1}s`,
                }}
              >
                {badge}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer
        style={{
          backgroundColor: theme.stone700,
          color: theme.stone400,
          padding: '3rem 1.5rem',
          borderTop: `1px solid ${theme.stone600}`,
        }}
      >
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
              gap: '2rem',
              marginBottom: '2rem',
            }}
          >
            <div>
              <div
                style={{
                  fontSize: '1.25rem',
                  fontWeight: 700,
                  color: theme.teal,
                  marginBottom: '0.5rem',
                  fontFamily: 'DM Sans, sans-serif',
                }}
              >
                SlideForge
              </div>
              <p
                style={{
                  fontSize: '0.9rem',
                  lineHeight: 1.6,
                  fontFamily: 'DM Sans, sans-serif',
                }}
              >
                Uno strumento de La Cassetta degli AI-trezzi
              </p>
            </div>

            <div>
              <h4
                style={{
                  fontSize: '0.95rem',
                  fontWeight: 700,
                  marginBottom: '1rem',
                  color: theme.stone50,
                  fontFamily: 'DM Sans, sans-serif',
                }}
              >
                Link legali
              </h4>
              <ul style={{ listStyle: 'none', padding: 0 }}>
                <li style={{ marginBottom: '0.5rem' }}>
                  <a
                    href="#"
                    style={{
                      color: theme.stone400,
                      textDecoration: 'none',
                      fontSize: '0.9rem',
                      fontFamily: 'DM Sans, sans-serif',
                      transition: 'color 0.3s',
                    }}
                    onMouseEnter={(e) => (e.target.style.color = theme.teal)}
                    onMouseLeave={(e) => (e.target.style.color = theme.stone400)}
                  >
                    Privacy Policy
                  </a>
                </li>
                <li style={{ marginBottom: '0.5rem' }}>
                  <a
                    href="#"
                    style={{
                      color: theme.stone400,
                      textDecoration: 'none',
                      fontSize: '0.9rem',
                      fontFamily: 'DM Sans, sans-serif',
                      transition: 'color 0.3s',
                    }}
                    onMouseEnter={(e) => (e.target.style.color = theme.teal)}
                    onMouseLeave={(e) => (e.target.style.color = theme.stone400)}
                  >
                    Termini di Servizio
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <h4
                style={{
                  fontSize: '0.95rem',
                  fontWeight: 700,
                  marginBottom: '1rem',
                  color: theme.stone50,
                  fontFamily: 'DM Sans, sans-serif',
                }}
              >
                Contatti
              </h4>
              <a
                href="mailto:info@slideforge.io"
                style={{
                  color: theme.stone400,
                  textDecoration: 'none',
                  fontSize: '0.9rem',
                  fontFamily: 'DM Sans, sans-serif',
                  transition: 'color 0.3s',
                }}
                onMouseEnter={(e) => (e.target.style.color = theme.teal)}
                onMouseLeave={(e) => (e.target.style.color = theme.stone400)}
              >
                info@slideforge.io
              </a>
            </div>
          </div>

          <div
            style={{
              borderTop: `1px solid ${theme.stone600}`,
              paddingTop: '1.5rem',
              textAlign: 'center',
              fontSize: '0.85rem',
              fontFamily: 'DM Sans, sans-serif',
            }}
          >
            © 2026 Valentino Grossi. Tutti i diritti riservati.
          </div>
        </div>
      </footer>

      {/* Login Modal */}
      <LoginModal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        onLogin={handleLogin}
      />

      {/* Global Keyframe Animations */}
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap');

        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes slideInLeft {
          from {
            opacity: 0;
            transform: translateX(-50px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        @keyframes slideInRight {
          from {
            opacity: 0;
            transform: translateX(50px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        @keyframes float {
          0%, 100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(30px);
          }
        }

        @keyframes pulse {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.7;
          }
        }

        @keyframes twinkle {
          0%, 100% {
            opacity: 0;
          }
          50% {
            opacity: 0.8;
          }
        }

        * {
          box-sizing: border-box;
        }

        html {
          scroll-behavior: smooth;
        }

        body {
          margin: 0;
          padding: 0;
          background-color: #292524;
          color: #fafafa;
          font-family: 'DM Sans', sans-serif;
          overflow-x: hidden;
        }

        a {
          outline: none;
        }

        button {
          outline: none;
        }

        button:focus {
          outline: none;
        }

        a:focus {
          outline: none;
        }
      `}</style>
    </div>
  );
};

export default LandingPage;
