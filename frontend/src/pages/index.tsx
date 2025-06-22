import Head from 'next/head';
import { useRouter } from 'next/router';
import { motion } from 'framer-motion';
import { MagnifyingGlassIcon, StarIcon, UserGroupIcon } from '@heroicons/react/24/outline';
import { BRAND_TERMS, APP_CONFIG } from '@/utils/constants';

export default function Home() {
  const router = useRouter();

  return (
    <>
      <Head>
        <title>{APP_CONFIG.NAME} - {APP_CONFIG.TAGLINE}</title>
        <meta name="description" content="Conecta con los mejores Ases de servicios cerca de ti. Los Exploradores encuentran todo lo que necesitan." />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className="min-h-screen bg-gradient-to-br from-primary-blue-light via-white to-secondary-green/20">
        {/* Header */}
        <header className="relative z-10 px-4 py-6">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-10 h-10 bg-primary-blue rounded-xl flex items-center justify-center">
                <span className="text-white font-bold text-lg">S</span>
              </div>
              <h1 className="font-display text-2xl font-bold text-neutral-900">
                {APP_CONFIG.NAME}
              </h1>
            </div>
            
            <div className="flex items-center space-x-4">
              <button 
                onClick={() => router.push('/auth/login')}
                className="px-4 py-2 text-neutral-600 hover:text-primary-blue transition-colors"
              >
                Iniciar Sesión
              </button>
              <button 
                onClick={() => router.push('/auth/register')}
                className="px-6 py-2 bg-primary-blue text-white rounded-full hover:bg-primary-blue-dark transition-colors"
              >
                Registrarse
              </button>
            </div>
          </div>
        </header>

        {/* Hero Section */}
        <section className="relative px-4 py-20">
          <div className="max-w-7xl mx-auto text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
            >
              <h2 className="font-display text-5xl md:text-7xl font-bold mb-6">
                <span className="text-gradient">Conectando</span>
                <br />
                <span className="text-primary-blue">{BRAND_TERMS.ASES}</span> y <span className="text-secondary-green">{BRAND_TERMS.EXPLORADORES}</span>
                <div className="mt-4 text-4xl">🤝✨</div>
              </h2>
              
              <p className="text-xl md:text-2xl text-neutral-600 mb-12 max-w-3xl mx-auto">
                {BRAND_TERMS.EXPLORERS_FIND}. {BRAND_TERMS.AS_DESCRIPTION}.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => router.push('/explore')}
                  className="px-8 py-4 bg-primary-blue text-white rounded-full text-lg font-semibold hover:bg-primary-blue-dark transition-all shadow-lg cursor-pointer"
                >
                  {BRAND_TERMS.START_EXPLORING}
                </motion.button>
                
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => router.push('/auth/register?tipo=as')}
                  className="px-8 py-4 bg-secondary-green text-white rounded-full text-lg font-semibold hover:bg-green-600 transition-all shadow-lg cursor-pointer"
                >
                  {BRAND_TERMS.JOIN_AS_AS}
                </motion.button>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Features Section */}
        <section className="px-4 py-20 bg-white/80 backdrop-blur-sm">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <h3 className="font-display text-4xl font-bold text-neutral-900 mb-4">
                ¿Cómo funciona?
              </h3>
              <p className="text-xl text-neutral-600">
                {BRAND_TERMS.MATCH_MESSAGE} de forma inteligente
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="text-center p-8 rounded-2xl bg-white shadow-lg hover:shadow-xl transition-shadow"
              >
                <div className="w-16 h-16 bg-primary-blue/10 rounded-full flex items-center justify-center mx-auto mb-6">
                  <MagnifyingGlassIcon className="w-8 h-8 text-primary-blue" />
                </div>
                <h4 className="font-display text-2xl font-bold text-neutral-900 mb-4">
                  Explorá Servicios
                </h4>
                <p className="text-neutral-600">
                  Buscá {BRAND_TERMS.ASES} verificados cerca tuyo. Filtrá por categoría, precio y distancia.
                </p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="text-center p-8 rounded-2xl bg-white shadow-lg hover:shadow-xl transition-shadow"
              >
                <div className="w-16 h-16 bg-secondary-green/10 rounded-full flex items-center justify-center mx-auto mb-6">
                  <StarIcon className="w-8 h-8 text-secondary-green" />
                </div>
                <h4 className="font-display text-2xl font-bold text-neutral-900 mb-4">
                  Match Inteligente
                </h4>
                <p className="text-neutral-600">
                  Nuestro algoritmo conecta {BRAND_TERMS.EXPLORADORES} con los {BRAND_TERMS.ASES} perfectos.
                </p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.4 }}
                className="text-center p-8 rounded-2xl bg-white shadow-lg hover:shadow-xl transition-shadow"
              >
                <div className="w-16 h-16 bg-secondary-orange/10 rounded-full flex items-center justify-center mx-auto mb-6">
                  <UserGroupIcon className="w-8 h-8 text-secondary-orange" />
                </div>
                <h4 className="font-display text-2xl font-bold text-neutral-900 mb-4">
                  Conectá Directo
                </h4>
                <p className="text-neutral-600">
                  Contactá directamente con {BRAND_TERMS.ASES} verificados. Sin intermediarios.
                </p>
              </motion.div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="px-4 py-20 bg-gradient-to-r from-primary-blue to-primary-blue-dark">
          <div className="max-w-4xl mx-auto text-center text-white">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
            >
              <h3 className="font-display text-4xl md:text-5xl font-bold mb-6">
                {BRAND_TERMS.BECOME_AS}
              </h3>
              <p className="text-xl mb-8 opacity-90">
                Mostrá tus habilidades, conectá con {BRAND_TERMS.EXPLORADORES} y hacé crecer tu negocio.
              </p>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => router.push('/auth/register?tipo=as')}
                className="px-8 py-4 bg-white text-primary-blue rounded-full text-lg font-semibold hover:bg-neutral-100 transition-all shadow-lg"
              >
                Empezar Ahora
              </motion.button>
            </motion.div>
          </div>
        </section>

        {/* Footer */}
        <footer className="bg-neutral-900 text-white px-4 py-12">
          <div className="max-w-7xl mx-auto text-center">
            <div className="flex items-center justify-center space-x-2 mb-6">
              <div className="w-8 h-8 bg-primary-blue rounded-lg flex items-center justify-center">
                <span className="text-white font-bold">S</span>
              </div>
              <span className="font-display text-xl font-bold">{APP_CONFIG.NAME}</span>
            </div>
            <p className="text-neutral-400 mb-4">
              {APP_CONFIG.TAGLINE}
            </p>
            <p className="text-neutral-500 text-sm">
              © 2024 {APP_CONFIG.NAME} - Marcelo Mata. Todos los derechos reservados.
            </p>
          </div>
        </footer>
      </main>
    </>
  );
}