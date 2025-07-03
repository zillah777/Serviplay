import { useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronDownIcon,
  ChevronUpIcon,
  ArrowLeftIcon,
  QuestionMarkCircleIcon,
  EnvelopeIcon
} from '@heroicons/react/24/outline';
import { APP_CONFIG, BRAND_TERMS } from '@/utils/constants';

interface FAQItem {
  id: string;
  question: string;
  answer: string;
  category: string;
}

const FAQ_DATA: FAQItem[] = [
  {
    id: '1',
    question: '¿Cómo funciona Fixia?',
    answer: `Fixia conecta a ${BRAND_TERMS.EXPLORADORES} que necesitan servicios con ${BRAND_TERMS.ASES} calificados. Los ${BRAND_TERMS.EXPLORADORES} publican sus necesidades y los ${BRAND_TERMS.ASES} pueden ofertar sus servicios.`,
    category: 'General'
  },
  {
    id: '2',
    question: '¿Cómo me registro como As?',
    answer: `Para registrarte como ${BRAND_TERMS.AS}, selecciona "As" durante el registro y completa tu perfil con tus habilidades, experiencia y área de cobertura.`,
    category: 'Registro'
  },
  {
    id: '3',
    question: '¿Cuánto cuesta usar Fixia?',
    answer: 'El registro y búsqueda de servicios es gratuito. Los Ases pueden elegir un plan premium para obtener más visibilidad y herramientas avanzadas.',
    category: 'Precios'
  },
  {
    id: '4',
    question: '¿Cómo puedo verificar mi identidad?',
    answer: 'Puedes verificar tu identidad subiendo documentos oficiales en tu perfil. La verificación aumenta la confianza de los clientes.',
    category: 'Verificación'
  },
  {
    id: '5',
    question: '¿Qué pasa si tengo un problema con un servicio?',
    answer: 'Contamos con un sistema de soporte y mediación. Puedes reportar problemas a través de nuestro centro de ayuda.',
    category: 'Soporte'
  },
  {
    id: '6',
    question: '¿Cómo funciona el sistema de calificaciones?',
    answer: 'Después de cada trabajo, tanto el cliente como el As pueden calificarse mutuamente. Esto ayuda a mantener la calidad del servicio.',
    category: 'Calificaciones'
  },
  {
    id: '7',
    question: '¿Puedo ser tanto Explorador como As?',
    answer: 'Sí, puedes registrarte con ambos perfiles y alternar entre buscar servicios y ofrecer tus propios servicios.',
    category: 'General'
  },
  {
    id: '8',
    question: '¿Cómo cancelo una búsqueda o servicio?',
    answer: 'Puedes cancelar desde tu dashboard. Si ya hay acuerdos en proceso, te recomendamos contactar a la otra parte antes de cancelar.',
    category: 'Cancelaciones'
  }
];

const CATEGORIES = ['Todos', 'General', 'Registro', 'Precios', 'Verificación', 'Soporte', 'Calificaciones', 'Cancelaciones'];

export default function FAQPage() {
  const [openItems, setOpenItems] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('Todos');

  const toggleItem = (id: string) => {
    setOpenItems(prev => 
      prev.includes(id) 
        ? prev.filter(item => item !== id)
        : [...prev, id]
    );
  };

  const filteredFAQs = selectedCategory === 'Todos' 
    ? FAQ_DATA 
    : FAQ_DATA.filter(item => item.category === selectedCategory);

  return (
    <>
      <Head>
        <title>Preguntas Frecuentes - {APP_CONFIG.NAME}</title>
        <meta name="description" content="Encuentra respuestas a las preguntas más frecuentes sobre Fixia" />
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-primary-blue-light via-white to-secondary-green/20">
        {/* Header */}
        <div className="bg-white shadow-sm border-b">
          <div className="max-w-4xl mx-auto px-4 py-6">
            <div className="flex items-center space-x-4 mb-4">
              <Link 
                href="/settings"
                className="p-2 text-neutral-600 hover:text-primary-blue transition-colors"
              >
                <ArrowLeftIcon className="w-5 h-5" />
              </Link>
              <QuestionMarkCircleIcon className="w-8 h-8 text-primary-blue" />
              <div>
                <h1 className="font-display text-3xl font-bold text-neutral-900">
                  Preguntas Frecuentes
                </h1>
                <p className="text-neutral-600">
                  Encuentra respuestas a las dudas más comunes
                </p>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="flex flex-wrap gap-3">
              <Link
                href="/help/contact"
                className="inline-flex items-center space-x-2 px-4 py-2 bg-primary-blue text-white rounded-lg hover:bg-primary-blue-dark transition-colors"
              >
                <EnvelopeIcon className="w-4 h-4" />
                <span>Contactar Soporte</span>
              </Link>
              <Link
                href="/help"
                className="inline-flex items-center space-x-2 px-4 py-2 border border-neutral-300 text-neutral-700 rounded-lg hover:bg-neutral-50 transition-colors"
              >
                <span>Centro de Ayuda</span>
              </Link>
            </div>
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-4 py-8">
          {/* Category Filter */}
          <div className="mb-8">
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map(category => (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                    selectedCategory === category
                      ? 'bg-primary-blue text-white'
                      : 'bg-white text-neutral-600 hover:bg-neutral-50 border border-neutral-200'
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>
          </div>

          {/* FAQ List */}
          <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
            {filteredFAQs.map((item, index) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className={`border-b border-neutral-200 last:border-b-0`}
              >
                <button
                  onClick={() => toggleItem(item.id)}
                  className="w-full px-6 py-4 text-left hover:bg-neutral-50 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-1">
                        <h3 className="font-semibold text-neutral-900">
                          {item.question}
                        </h3>
                        <span className="px-2 py-1 bg-neutral-100 text-neutral-600 text-xs rounded-full">
                          {item.category}
                        </span>
                      </div>
                    </div>
                    {openItems.includes(item.id) ? (
                      <ChevronUpIcon className="w-5 h-5 text-neutral-400" />
                    ) : (
                      <ChevronDownIcon className="w-5 h-5 text-neutral-400" />
                    )}
                  </div>
                </button>

                <AnimatePresence>
                  {openItems.includes(item.id) && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      className="overflow-hidden"
                    >
                      <div className="px-6 pb-4">
                        <p className="text-neutral-700 leading-relaxed">
                          {item.answer}
                        </p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </div>

          {/* No results */}
          {filteredFAQs.length === 0 && (
            <div className="text-center py-12">
              <QuestionMarkCircleIcon className="w-16 h-16 text-neutral-300 mx-auto mb-4" />
              <h3 className="font-semibold text-neutral-900 mb-2">
                No hay preguntas en esta categoría
              </h3>
              <p className="text-neutral-600 mb-4">
                Prueba con otra categoría o contacta directamente con soporte
              </p>
              <Link
                href="/help/contact"
                className="inline-flex items-center space-x-2 px-6 py-3 bg-primary-blue text-white rounded-lg hover:bg-primary-blue-dark transition-colors"
              >
                <EnvelopeIcon className="w-5 h-5" />
                <span>Contactar Soporte</span>
              </Link>
            </div>
          )}

          {/* Still need help? */}
          <div className="mt-12 bg-white rounded-2xl shadow-lg p-8 text-center">
            <h3 className="font-display text-xl font-bold text-neutral-900 mb-2">
              ¿No encontraste lo que buscabas?
            </h3>
            <p className="text-neutral-600 mb-6">
              Nuestro equipo de soporte está listo para ayudarte con cualquier consulta específica
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/help/contact"
                className="inline-flex items-center justify-center space-x-2 px-6 py-3 bg-primary-blue text-white rounded-lg hover:bg-primary-blue-dark transition-colors"
              >
                <EnvelopeIcon className="w-5 h-5" />
                <span>Contactar Soporte</span>
              </Link>
              <Link
                href="/help"
                className="inline-flex items-center justify-center space-x-2 px-6 py-3 border border-neutral-300 text-neutral-700 rounded-lg hover:bg-neutral-50 transition-colors"
              >
                <span>Centro de Ayuda</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}