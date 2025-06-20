import { Html, Head, Main, NextScript } from 'next/document';

export default function Document() {
  return (
    <Html lang="es-AR">
      <Head>
        <meta name="application-name" content="Serviplay" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Serviplay" />
        <meta name="description" content="Conectando Ases y Exploradores - Encuentra servicios de calidad cerca tuyo" />
        <meta name="format-detection" content="telephone=no" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="msapplication-config" content="/icons/browserconfig.xml" />
        <meta name="msapplication-TileColor" content="#2563eb" />
        <meta name="msapplication-tap-highlight" content="no" />
        <meta name="theme-color" content="#2563eb" />

        <link rel="apple-touch-icon" href="/icons/icon-152x152.png" />
        <link rel="apple-touch-icon" sizes="152x152" href="/icons/icon-152x152.png" />
        <link rel="apple-touch-icon" sizes="180x180" href="/icons/icon-192x192.png" />

        <link rel="manifest" href="/manifest.json" />
        <link rel="mask-icon" href="/icons/safari-pinned-tab.svg" color="#2563eb" />
        <link rel="shortcut icon" href="/favicon.ico" />
        
        <meta name="twitter:card" content="summary" />
        <meta name="twitter:url" content="https://serviplay.com" />
        <meta name="twitter:title" content="Serviplay" />
        <meta name="twitter:description" content="Conectando Ases y Exploradores - Encuentra servicios de calidad cerca tuyo" />
        <meta name="twitter:image" content="https://serviplay.com/icons/icon-192x192.png" />
        <meta name="twitter:creator" content="@serviplay" />
        
        <meta property="og:type" content="website" />
        <meta property="og:title" content="Serviplay" />
        <meta property="og:description" content="Conectando Ases y Exploradores - Encuentra servicios de calidad cerca tuyo" />
        <meta property="og:site_name" content="Serviplay" />
        <meta property="og:url" content="https://serviplay.com" />
        <meta property="og:image" content="https://serviplay.com/icons/icon-192x192.png" />

        {/* Preload fonts */}
        <link
          rel="preload"
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap"
          as="style"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </Head>
      <body className="bg-neutral-50 text-neutral-900 antialiased">
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}