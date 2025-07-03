import { useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  ArrowLeftIcon,
  EnvelopeIcon,
  PhoneIcon,
  ClockIcon,
  ChatBubbleLeftRightIcon,
  ExclamationTriangleIcon,
  QuestionMarkCircleIcon
} from '@heroicons/react/24/outline';
import { APP_CONFIG } from '@/utils/constants';
import toast from 'react-hot-toast';

interface ContactForm {
  nombre: string;
  email: string;
  asunto: string;
  categoria: string;
  mensaje: string;
  prioridad: 'baja' | 'media' | 'alta';
}

const CATEGORIAS = [
  'Problema técnico',
  'Problema con un servicio',
  'Problema de pago',
  'Cuenta suspendida',
  'Verificación de identidad',
  'Sugerencia',
  'Consulta general',
  'Otro'
];

export default function ContactPage() {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<ContactForm>({
    nombre: '',
    email: '',
    asunto: '',
    categoria: '',
    mensaje: '',
    prioridad: 'media'
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validaciones
    if (!formData.nombre.trim()) {
      toast.error('El nombre es obligatorio');
      return;
    }

    if (!formData.email.trim()) {
      toast.error('El email es obligatorio');
      return;
    }

    if (!formData.asunto.trim()) {
      toast.error('El asunto es obligatorio');
      return;
    }

    if (!formData.categoria) {
      toast.error('Selecciona una categoría');
      return;
    }

    if (!formData.mensaje.trim()) {
      toast.error('El mensaje es obligatorio');
      return;
    }

    setLoading(true);
    try {
      // TODO: Implementar envío de contacto al backend
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      toast.success('Tu mensaje ha sido enviado. Te responderemos pronto.');
      
      // Limpiar formulario
      setFormData({
        nombre: '',
        email: '',
        asunto: '',
        categoria: '',
        mensaje: '',
        prioridad: 'media'
      });
    } catch (error) {
      console.error('Error sending contact form:', error);
      toast.error('Error al enviar el mensaje');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Head>
        <title>Contactar Soporte - {APP_CONFIG.NAME}</title>
        <meta name="description" content="Contacta con nuestro equipo de soporte" />
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-primary-blue-light via-white to-secondary-green/20">
        {/* Header */}
        <div className="bg-white shadow-sm border-b">
          <div className="max-w-4xl mx-auto px-4 py-6">
            <div className="flex items-center space-x-4">
              <Link 
                href="/help/faq"
                className="p-2 text-neutral-600 hover:text-primary-blue transition-colors"
              >
                <ArrowLeftIcon className="w-5 h-5" />
              </Link>
              <EnvelopeIcon className="w-8 h-8 text-primary-blue" />
              <div>
                <h1 className="font-display text-3xl font-bold text-neutral-900">
                  Contactar Soporte
                </h1>
                <p className="text-neutral-600">
                  Estamos aquí para ayudarte
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Contact Form */}
            <div className="lg:col-span-2">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-2xl shadow-lg p-8"
              >
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold text-neutral-900 mb-4">
                      Envíanos tu consulta
                    </h3>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-neutral-700 mb-1">
                        Nombre completo *
                      </label>
                      <input
                        type="text"
                        name="nombre"
                        value={formData.nombre}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-blue focus:border-transparent"
                        placeholder="Tu nombre"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-neutral-700 mb-1">
                        Email *
                      </label>
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-blue focus:border-transparent"
                        placeholder="tu@email.com"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-1">
                      Asunto *
                    </label>
                    <input
                      type="text"
                      name="asunto"
                      value={formData.asunto}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-blue focus:border-transparent"
                      placeholder="Resumen de tu consulta"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-neutral-700 mb-1">
                        Categoría *
                      </label>
                      <select
                        name="categoria"
                        value={formData.categoria}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-blue focus:border-transparent"
                        required
                      >
                        <option value="">Selecciona una categoría</option>
                        {CATEGORIAS.map(categoria => (
                          <option key={categoria} value={categoria}>
                            {categoria}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-neutral-700 mb-1">
                        Prioridad
                      </label>
                      <select
                        name="prioridad"
                        value={formData.prioridad}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-blue focus:border-transparent"
                      >
                        <option value="baja">Baja - No es urgente</option>
                        <option value="media">Media - Consulta normal</option>
                        <option value="alta">Alta - Urgente</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-1">
                      Mensaje *
                    </label>
                    <textarea
                      name="mensaje"
                      value={formData.mensaje}
                      onChange={handleChange}
                      rows={5}
                      className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-blue focus:border-transparent"
                      placeholder="Describe tu consulta o problema en detalle..."
                      required
                    />
                  </div>

                  <div className="flex items-center justify-end space-x-4 pt-4">
                    <Link
                      href="/help/faq"
                      className="px-6 py-2 border border-neutral-300 text-neutral-700 rounded-lg hover:bg-neutral-50 transition-colors"
                    >
                      Ver FAQ
                    </Link>
                    <button
                      type="submit"
                      disabled={loading}
                      className="px-6 py-2 bg-primary-blue text-white rounded-lg hover:bg-primary-blue-dark transition-colors disabled:opacity-50 flex items-center space-x-2"
                    >
                      {loading && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>}
                      <span>{loading ? 'Enviando...' : 'Enviar Mensaje'}</span>
                    </button>
                  </div>
                </form>
              </motion.div>
            </div>

            {/* Contact Info Sidebar */}
            <div className="space-y-6">
              {/* Contact Methods */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-white rounded-2xl shadow-lg p-6"
              >
                <h3 className="font-semibold text-neutral-900 mb-4">
                  Otros medios de contacto
                </h3>
                
                <div className="space-y-4">
                  <div className="flex items-center space-x-3 text-neutral-600">
                    <EnvelopeIcon className="w-5 h-5 text-primary-blue" />
                    <div>
                      <p className="font-medium">Email directo</p>
                      <p className="text-sm">soporte@fixia.com</p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3 text-neutral-600">
                    <PhoneIcon className="w-5 h-5 text-primary-blue" />
                    <div>
                      <p className="font-medium">Teléfono</p>
                      <p className="text-sm">+54 11 1234-5678</p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3 text-neutral-600">
                    <ClockIcon className="w-5 h-5 text-primary-blue" />
                    <div>
                      <p className="font-medium">Horarios</p>
                      <p className="text-sm">Lun - Vie: 9:00 - 18:00</p>
                      <p className="text-sm">Sáb: 9:00 - 13:00</p>
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Quick Actions */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="bg-white rounded-2xl shadow-lg p-6"
              >
                <h3 className="font-semibold text-neutral-900 mb-4">
                  Acciones rápidas
                </h3>
                
                <div className="space-y-3">
                  <Link
                    href="/help/faq"
                    className="flex items-center space-x-3 p-3 border border-neutral-200 rounded-lg hover:border-primary-blue transition-colors"
                  >
                    <QuestionMarkCircleIcon className="w-5 h-5 text-neutral-500" />
                    <span className="text-sm">Ver preguntas frecuentes</span>
                  </Link>

                  <Link
                    href="/help"
                    className="flex items-center space-x-3 p-3 border border-neutral-200 rounded-lg hover:border-primary-blue transition-colors"
                  >
                    <ChatBubbleLeftRightIcon className="w-5 h-5 text-neutral-500" />
                    <span className="text-sm">Centro de ayuda</span>
                  </Link>
                </div>
              </motion.div>

              {/* Response Time */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className="bg-blue-50 rounded-2xl p-6 border border-blue-200"
              >
                <div className="flex items-start space-x-3">
                  <ExclamationTriangleIcon className="w-6 h-6 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-blue-900 mb-1">
                      Tiempo de respuesta
                    </h4>
                    <p className="text-sm text-blue-700">
                      Respondemos consultas normales en 24-48 horas. Para casos urgentes, en menos de 4 horas.
                    </p>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}