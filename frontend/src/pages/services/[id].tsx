import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { motion } from 'framer-motion';
import {
  StarIcon,
  MapPinIcon,
  ClockIcon,
  CheckBadgeIcon,
  CurrencyDollarIcon,
  PhoneIcon,
  ChatBubbleLeftRightIcon,
  HeartIcon,
  ShareIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import { StarIcon as StarIconSolid } from '@heroicons/react/24/solid';
import Layout from '@/components/common/Layout';
import Loading from '@/components/common/Loading';
import { Servicio, PerfilAs } from '@/types';
import { BRAND_TERMS, APP_CONFIG } from '@/utils/constants';
import { servicesApi } from '@/services/api';
import toast from 'react-hot-toast';

export default function ServiceDetailPage() {
  const router = useRouter();
  const { id } = router.query;
  const [service, setService] = useState<Servicio | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFavorite, setIsFavorite] = useState(false);

  useEffect(() => {
    if (id && typeof id === 'string') {
      fetchService(id);
    }
  }, [id]);

  const fetchService = async (serviceId: string) => {
    try {
      setLoading(true);
      setError(null);
      
      // Llamada real a la API
      const response = await servicesApi.getService(serviceId);
      
      if (response.success && response.data) {
        setService(response.data);
      } else {
        setError('Servicio no encontrado');
      }
      
    } catch (error) {
      console.error('Error fetching service:', error);
      setError('Error al cargar el servicio. Por favor, inténtalo de nuevo.');
      toast.error('Error al cargar el servicio');
    } finally {
      setLoading(false);
    }
  };

  const handleContact = (method: 'phone' | 'chat' | 'whatsapp') => {
    if (!service?.as) return;
    
    switch (method) {
      case 'phone':
        window.open(`tel:${service.as.telefono}`, '_self');
        break;
      case 'whatsapp':
        const message = encodeURIComponent(`Hola ${service.as.nombre}, estoy interesado en tu servicio: ${service.titulo}`);
        window.open(`https://wa.me/${service.as.telefono.replace(/\D/g, '')}?text=${message}`, '_blank');
        break;
      case 'chat':
        // TODO: Implementar chat interno
        console.log('Abrir chat interno');
        break;
    }
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: service?.titulo,
        text: `Mirá este servicio en ${APP_CONFIG.NAME}`,
        url: window.location.href,
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      // TODO: Mostrar toast de confirmación
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="container mx-auto py-8">
          <Loading />
        </div>
      </Layout>
    );
  }

  if (error || !service) {
    return (
      <Layout>
        <div className="container mx-auto py-8 text-center">
          <ExclamationTriangleIcon className="w-16 h-16 text-neutral-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-neutral-900 mb-2">Servicio no encontrado</h1>
          <p className="text-neutral-600 mb-6">{error || 'El servicio que buscás no existe o ya no está disponible.'}</p>
          <button
            onClick={() => router.push('/explore')}
            className="px-6 py-3 bg-primary-blue text-white rounded-lg hover:bg-primary-blue-dark transition-colors"
          >
            Explorar otros servicios
          </button>
        </div>
      </Layout>
    );
  }

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => {
      const filled = i < Math.floor(rating);
      const partial = i === Math.floor(rating) && rating % 1 !== 0;
      
      return (
        <div key={i} className="relative">
          <StarIcon className="w-5 h-5 text-neutral-300" />
          {(filled || partial) && (
            <StarIconSolid 
              className={`absolute inset-0 w-5 h-5 text-yellow-400 ${
                partial ? 'clip-path-half' : ''
              }`} 
            />
          )}
        </div>
      );
    });
  };

  return (
    <Layout title={service.titulo}>
      <div className="container mx-auto py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          {/* Header */}
          <div className="bg-white rounded-2xl shadow-sm border border-neutral-200 overflow-hidden mb-6">
            <div className="p-6">
              <div className="flex flex-col lg:flex-row gap-6">
                {/* Imagen del servicio o avatar del AS */}
                <div className="flex-shrink-0">
                  <div className="w-32 h-32 bg-gradient-to-br from-primary-blue/10 to-secondary-green/10 rounded-2xl flex items-center justify-center">
                    {service.as?.foto_perfil ? (
                      <img
                        src={service.as.foto_perfil}
                        alt={service.as.nombre}
                        className="w-full h-full object-cover rounded-2xl"
                      />
                    ) : (
                      <span className="text-6xl">🛠️</span>
                    )}
                  </div>
                </div>

                {/* Información principal */}
                <div className="flex-1 space-y-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h1 className="font-display text-3xl font-bold text-neutral-900 mb-2">
                        {service.titulo}
                      </h1>
                      <div className="flex items-center space-x-4 text-sm text-neutral-600">
                        <div className="flex items-center space-x-1">
                          <MapPinIcon className="w-4 h-4" />
                          <span>{service.distancia?.toFixed(1)} km</span>
                        </div>
                        {service.rating && (
                          <div className="flex items-center space-x-1">
                            <div className="flex space-x-0.5">
                              {renderStars(service.rating)}
                            </div>
                            <span className="font-medium">{service.rating}</span>
                          </div>
                        )}
                        {service.as?.identidad_verificada && (
                          <div className="flex items-center space-x-1 text-secondary-green">
                            <CheckBadgeIcon className="w-4 h-4" />
                            <span>Verificado</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Acciones */}
                    <div className="flex space-x-2">
                      <button
                        onClick={() => setIsFavorite(!isFavorite)}
                        className={`p-2 rounded-full transition-colors ${
                          isFavorite
                            ? 'bg-secondary-red text-white'
                            : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                        }`}
                      >
                        <HeartIcon className="w-5 h-5" />
                      </button>
                      <button
                        onClick={handleShare}
                        className="p-2 bg-neutral-100 text-neutral-600 rounded-full hover:bg-neutral-200 transition-colors"
                      >
                        <ShareIcon className="w-5 h-5" />
                      </button>
                    </div>
                  </div>

                  {/* Precio */}
                  <div className="flex items-center space-x-2">
                    <CurrencyDollarIcon className="w-5 h-5 text-secondary-green" />
                    <span className="text-2xl font-bold text-neutral-900">
                      ${service.precio_desde.toLocaleString()}
                      {service.precio_hasta && service.precio_hasta !== service.precio_desde && (
                        <span className="text-lg font-normal text-neutral-600">
                          - ${service.precio_hasta.toLocaleString()}
                        </span>
                      )}
                    </span>
                    <span className="text-neutral-600">
                      {service.tipo_precio === 'por_hora' && 'por hora'}
                      {service.tipo_precio === 'por_trabajo' && 'por trabajo'}
                      {service.tipo_precio === 'por_semana' && 'por semana'}
                      {service.tipo_precio === 'por_mes' && 'por mes'}
                    </span>
                  </div>

                  {/* Badges */}
                  <div className="flex flex-wrap gap-2">
                    {service.urgente && (
                      <span className="px-3 py-1 bg-secondary-red/10 text-secondary-red text-sm rounded-full">
                        Urgente
                      </span>
                    )}
                    {service.destacado && (
                      <span className="px-3 py-1 bg-secondary-orange/10 text-secondary-orange text-sm rounded-full">
                        Destacado
                      </span>
                    )}
                    {service.as?.tiene_movilidad && (
                      <span className="px-3 py-1 bg-primary-blue/10 text-primary-blue text-sm rounded-full">
                        Con movilidad
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Botones de contacto */}
            <div className="bg-neutral-50 p-6 border-t border-neutral-200">
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={() => handleContact('whatsapp')}
                  className="flex-1 flex items-center justify-center space-x-2 px-6 py-3 bg-secondary-green text-white rounded-lg hover:bg-secondary-green-dark transition-colors"
                >
                  <ChatBubbleLeftRightIcon className="w-5 h-5" />
                  <span>WhatsApp</span>
                </button>
                <button
                  onClick={() => handleContact('phone')}
                  className="flex-1 flex items-center justify-center space-x-2 px-6 py-3 bg-primary-blue text-white rounded-lg hover:bg-primary-blue-dark transition-colors"
                >
                  <PhoneIcon className="w-5 h-5" />
                  <span>Llamar</span>
                </button>
                <button
                  onClick={() => handleContact('chat')}
                  className="flex-1 flex items-center justify-center space-x-2 px-6 py-3 border border-neutral-300 text-neutral-700 rounded-lg hover:bg-neutral-50 transition-colors"
                >
                  <ChatBubbleLeftRightIcon className="w-5 h-5" />
                  <span>Chat</span>
                </button>
              </div>
            </div>
          </div>

          {/* Descripción */}
          <div className="bg-white rounded-2xl shadow-sm border border-neutral-200 p-6 mb-6">
            <h2 className="font-display text-xl font-bold text-neutral-900 mb-4">
              Descripción del servicio
            </h2>
            <p className="text-neutral-700 leading-relaxed whitespace-pre-line">
              {service.descripcion}
            </p>
          </div>

          {/* Información del AS */}
          {service.as && (
            <div className="bg-white rounded-2xl shadow-sm border border-neutral-200 p-6">
              <h2 className="font-display text-xl font-bold text-neutral-900 mb-4">
                Sobre {service.as.nombre}
              </h2>
              <div className="flex items-start space-x-4">
                <div className="w-16 h-16 bg-gradient-to-br from-primary-blue/10 to-secondary-green/10 rounded-xl flex items-center justify-center">
                  {service.as.foto_perfil ? (
                    <img
                      src={service.as.foto_perfil}
                      alt={service.as.nombre}
                      className="w-full h-full object-cover rounded-xl"
                    />
                  ) : (
                    <span className="text-2xl">👤</span>
                  )}
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-lg text-neutral-900">
                    {service.as.nombre} {service.as.apellido}
                  </h3>
                  <p className="text-neutral-600 mb-2">{service.as.direccion}</p>
                  <div className="flex flex-wrap gap-2">
                    {service.as.identidad_verificada && (
                      <span className="px-2 py-1 bg-secondary-green/10 text-secondary-green text-xs rounded-full">
                        ✓ Identidad verificada
                      </span>
                    )}
                    {service.as.profesional_verificado && (
                      <span className="px-2 py-1 bg-primary-blue/10 text-primary-blue text-xs rounded-full">
                        ✓ Profesional verificado
                      </span>
                    )}
                    {service.as.suscripcion_activa && (
                      <span className="px-2 py-1 bg-secondary-orange/10 text-secondary-orange text-xs rounded-full">
                        ✓ Suscriptor activo
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </Layout>
  );
}