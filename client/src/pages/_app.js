import { AuthProvider } from "../context/AuthContext";
import LoadingScreen from "../components/LoadingScreen";
import "../styles/globals.css";
import { useState, useEffect } from "react";
import Script from 'next/script';

export default function MyApp({ Component, pageProps }) {
  // Import KaTeX CSS only on client-side
  useEffect(() => {
    if (typeof window !== 'undefined') {
      import('katex/dist/katex.min.css');
    }
  }, []);

  return (
    <>
      {/* Google Analytics - Measurement ID: G-KJ636M5C63 */}
      <Script
        src="https://www.googletagmanager.com/gtag/js?id=G-KJ636M5C63"
        strategy="afterInteractive"
      />
      <Script id="gtag-init" strategy="afterInteractive">
        {`window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);} 
gtag('js', new Date());
gtag('config', 'G-KJ636M5C63', { page_path: window.location.pathname });`}
      </Script>
    <AuthProvider>
      <Component {...pageProps} />
    </AuthProvider>
    </>
  );
}