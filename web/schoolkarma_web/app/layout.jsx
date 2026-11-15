import './globals.css';
import Providers from './providers.jsx';
import Navbar from '../components/Navbar.jsx';
import MarqueeTicker from '../components/MarqueeTicker.jsx';
import Footer from '../components/Footer.jsx';

export const metadata = {
  metadataBase: new URL('https://schoolkarma.com'),
  title: {
    default: 'SchoolKarma — Discover, Compare & Enroll in Verified Schools',
    template: '%s | SchoolKarma'
  },
  description: 'Unbiased 5-axis parent ratings, transparent annual fee schedules, campus photo galleries, and 1-click direct admission enquiries across 3,600+ verified schools in India.',
  icons: {
    icon: '/favicon.svg'
  },
  verification: {
    google: '7gswx-VcyD3MWylMmHda-JP5IlpeTCGTRUkebCq0l8c'
  },
  openGraph: {
    title: 'SchoolKarma — India’s Premier Verified School Network',
    description: 'Find, compare, and apply directly to verified CBSE, ICSE, and International schools.',
    url: 'https://schoolkarma.com',
    siteName: 'SchoolKarma',
    locale: 'en_IN',
    type: 'website'
  }
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link 
          href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800;900&display=swap" 
          rel="stylesheet" 
        />
      </head>
      <body>
        <Providers>
          <MarqueeTicker />
          <Navbar />
          {children}
          <Footer />
        </Providers>
      </body>
    </html>
  );
}

