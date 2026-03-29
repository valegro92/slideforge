import './globals.css';
import { TierProvider } from '../lib/TierContext';
import DevTierSwitcher from '../components/DevTierSwitcher';

export const metadata = {
  title: 'SlideForge — Da PDF a PPTX editabile con AI',
  description: 'Trasforma i PDF in presentazioni PPTX modificabili con l\'intelligenza artificiale. Conversione gratuita o con modelli AI premium.',
  keywords: [
    'PDF to PowerPoint',
    'slide conversion',
    'presentation editor',
    'OCR',
    'AI Vision',
    'SlideForge'
  ],
  authors: [{ name: 'SlideForge' }],
  openGraph: {
    title: 'SlideForge — Da PDF a PPTX editabile con AI',
    description: 'Trasforma i PDF in presentazioni PPTX modificabili con l\'intelligenza artificiale',
    url: process.env.NEXT_PUBLIC_APP_URL || 'https://slideforge.app',
    type: 'website',
    image: process.env.NEXT_PUBLIC_OG_IMAGE || 'https://slideforge.app/og-image.png'
  },
  twitter: {
    card: 'summary_large_image',
    title: 'SlideForge — Da PDF a PPTX editabile con AI',
    description: 'Trasforma i PDF in presentazioni PPTX modificabili con l\'intelligenza artificiale'
  }
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1
};

export default function RootLayout({ children }) {
  return (
    <html lang="it">
      <head>
        <meta charSet="utf-8" />
        <meta name="theme-color" content="#292524" />
      </head>
      <body>
        <TierProvider>
          {children}
          <DevTierSwitcher />
        </TierProvider>
      </body>
    </html>
  );
}
