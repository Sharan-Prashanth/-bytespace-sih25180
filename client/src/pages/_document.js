import { Html, Head, Main, NextScript } from 'next/document';

export default function Document() {
  return (
    <Html lang="en">
      <Head>
        {/* Favicon configuration */}
        <link rel="icon" href="/favicon.ico" />
        <link rel="icon" type="image/ico" href="/favicon.ico" />
        <link rel="shortcut icon" href="/favicon.ico" />
        
        {/* For better browser compatibility */}
        <link rel="apple-touch-icon" href="/favicon.ico" />
        <link rel="icon" type="image/x-icon" href="/favicon.ico" />
        
        {/* Meta tags for better SEO */}
        <meta name="theme-color" content="#ea580c" />
        <meta name="description" content="NaCCER Portal - National Centre for Coal & Energy Research" />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}