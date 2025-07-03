import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { motion } from 'framer-motion';
import {
  StarIcon,
  ArrowLeftIcon,
  UserIcon,
  CheckBadgeIcon
} from '@heroicons/react/24/outline';
import { StarIcon as StarSolidIcon } from '@heroicons/react/24/solid';
import { APP_CONFIG, BRAND_TERMS } from '@/utils/constants';
import { authService } from '@/services/api';
import toast from 'react-hot-toast';

interface ReviewForm {
  calificacion: number;
  comentario: string;
  recomendaria: boolean;
  aspectos: {
    puntualidad: number;
    calidad: number;
    comunicacion: number;
    precio: number;
  };
}

interface ServiceInfo {
  id: string;
  titulo: string;
  categoria: string;
  fecha_servicio: string;
  precio_final: number;
}

interface UserInfo {
  id: string;
  nombre: string;
  apellido: string;
  tipo_usuario: 'as' | 'explorador';
  foto_perfil?: string;
  verificado: boolean;
  calificacion_promedio: number;
  total_calificaciones: number;
}

export default function NewReviewPage() {
  const router = useRouter();
  const { serviceId, userId, type } = router.query;
  
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [currentUser, setCurrentUser] = useState<UserInfo | null>(null);
  const [targetUser, setTargetUser] = useState<UserInfo | null>(null);
  const [serviceInfo, setServiceInfo] = useState<ServiceInfo | null>(null);
  
  const [formData, setFormData] = useState<ReviewForm>({
    calificacion: 0,
    comentario: '',
    recomendaria: true,
    aspectos: {
      puntualidad: 0,
      calidad: 0,
      comunicacion: 0,
      precio: 0
    }
  });

  useEffect(() => {
    if (serviceId && userId && type) {
      loadReviewData();
    }
  }, [serviceId, userId, type]);

  const loadReviewData = async () => {
    try {
      if (!authService.isAuthenticated()) {
        router.push('/auth/login');
        return;
      }

      setLoading(true);
      
      // TODO: Cargar datos reales del backend
      console.log('Loading review data:', { serviceId, userId, type });
      
      // Mock data para demostración
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setCurrentUser({
        id: 'current-user',
        nombre: 'Juan',
        apellido: 'Pérez',
        tipo_usuario: type === 'as-to-explorer' ? 'as' : 'explorador',
        verificado: true,
        calificacion_promedio: 4.5,
        total_calificaciones: 12
      });

      setTargetUser({
        id: userId as string,
        nombre: 'María',
        apellido: 'González',
        tipo_usuario: type === 'as-to-explorer' ? 'explorador' : 'as',
        verificado: true,
        calificacion_promedio: 4.8,
        total_calificaciones: 25
      });

      setServiceInfo({
        id: serviceId as string,
        titulo: 'Reparación de plomería',
        categoria: 'Plomería',
        fecha_servicio: '2024-01-15',
        precio_final: 15000
      });

    } catch (error) {
      console.error('Error loading review data:', error);
      toast.error('Error al cargar información');
      router.push('/dashboard');
    } finally {
      setLoading(false);
    }
  };

  const handleStarClick = (rating: number, aspect?: keyof typeof formData.aspectos) => {
    if (aspect) {
      setFormData(prev => ({
        ...prev,
        aspectos: {
          ...prev.aspectos,
          [aspect]: rating
        }
      }));
    } else {
      setFormData(prev => ({ ...prev, calificacion: rating }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validaciones
    if (formData.calificacion === 0) {
      toast.error('Debes seleccionar una calificación general');
      return;
    }

    if (formData.comentario.trim().length < 10) {
      toast.error('El comentario debe tener al menos 10 caracteres');
      return;
    }

    if (formData.comentario.length > 1500) {
      toast.error('El comentario no puede superar los 1500 caracteres');
      return;
    }

    // Verificar que todos los aspectos estén calificados
    const aspectosVacios = Object.values(formData.aspectos).some(value => value === 0);
    if (aspectosVacios) {
      toast.error('Debes calificar todos los aspectos');
      return;
    }

    setSubmitting(true);
    try {
      // TODO: Enviar calificación al backend
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      toast.success('¡Calificación enviada exitosamente!');
      router.push('/reviews');
    } catch (error) {
      console.error('Error submitting review:', error);
      toast.error('Error al enviar la calificación');
    } finally {
      setSubmitting(false);
    }
  };

  const renderStars = (rating: number, onStarClick: (rating: number) => void, size = 'w-8 h-8') => {
    return (
      <div className="flex items-center space-x-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => onStarClick(star)}
            className={`${size} transition-colors hover:scale-110`}
          >
            {star <= rating ? (
              <StarSolidIcon className="text-yellow-500" />
            ) : (
              <StarIcon className="text-neutral-300 hover:text-yellow-400" />
            )}
          </button>
        ))}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-blue-light via-white to-secondary-green/20 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary-blue border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-neutral-600">Cargando información...</p>
        </div>
      </div>
    );
  }

  const isAsToExplorer = type === 'as-to-explorer';
  const reviewingText = isAsToExplorer ? 'cliente' : BRAND_TERMS.AS;

  return (
    <>
      <Head>
        <title>Nueva Calificación - {APP_CONFIG.NAME}</title>
        <meta name="description" content="Califica tu experiencia de servicio" />
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-primary-blue-light via-white to-secondary-green/20">
        {/* Header */}
        <div className="bg-white shadow-sm border-b">
          <div className="max-w-4xl mx-auto px-4 py-6">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.back()}
                className="p-2 text-neutral-600 hover:text-primary-blue transition-colors"
              >
                <ArrowLeftIcon className="w-5 h-5" />
              </button>
              <StarSolidIcon className="w-8 h-8 text-yellow-500" />
              <div>
                <h1 className="font-display text-2xl font-bold text-neutral-900">
                  Calificar {reviewingText}
                </h1>
                <p className="text-neutral-600">
                  Comparte tu experiencia para ayudar a otros usuarios
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-4 py-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl shadow-lg p-8"
          >
            {/* Service & User Info */}
            <div className="border-b border-neutral-200 pb-6 mb-8">
              <div className="flex items-start space-x-4">
                <img
                  src={targetUser?.foto_perfil || '/images/default-avatar.png'}
                  alt={`${targetUser?.nombre} ${targetUser?.apellido}`}
                  className="w-16 h-16 rounded-full object-cover"
                />
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    <h3 className="font-semibold text-xl text-neutral-900">
                      {targetUser?.nombre} {targetUser?.apellido}
                    </h3>
                    {targetUser?.verificado && (
                      <CheckBadgeIcon className="w-5 h-5 text-primary-blue" />
                    )}
                    <span className="px-2 py-1 bg-neutral-100 text-neutral-600 text-sm rounded-full">
                      {targetUser?.tipo_usuario === 'as' ? BRAND_TERMS.AS : BRAND_TERMS.EXPLORADOR}
                    </span>
                  </div>
                  
                  <div className="flex items-center space-x-4 text-sm text-neutral-600 mb-3">
                    <div className="flex items-center space-x-1">
                      <StarSolidIcon className="w-4 h-4 text-yellow-500" />
                      <span>{targetUser?.calificacion_promedio}/5</span>
                      <span>({targetUser?.total_calificaciones} calificaciones)</span>
                    </div>
                  </div>

                  <div className="bg-neutral-50 rounded-lg p-4">
                    <h4 className="font-medium text-neutral-900 mb-2">Servicio realizado:</h4>
                    <div className="space-y-1 text-sm text-neutral-600">
                      <p><strong>Servicio:</strong> {serviceInfo?.titulo}</p>
                      <p><strong>Categoría:</strong> {serviceInfo?.categoria}</p>
                      <p><strong>Fecha:</strong> {serviceInfo?.fecha_servicio ? new Date(serviceInfo.fecha_servicio).toLocaleDateString() : 'N/A'}</p>
                      <p><strong>Precio final:</strong> ${serviceInfo?.precio_final?.toLocaleString()}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Calificación General */}
              <div>
                <label className="block text-lg font-semibold text-neutral-900 mb-4">
                  Calificación general *
                </label>
                <div className="flex items-center space-x-4">
                  {renderStars(formData.calificacion, (rating) => handleStarClick(rating))}
                  <span className="text-neutral-600">
                    {formData.calificacion > 0 && `${formData.calificacion}/5`}
                  </span>
                </div>
              </div>

              {/* Aspectos Específicos */}
              <div>
                <label className="block text-lg font-semibold text-neutral-900 mb-4">
                  Califica aspectos específicos *
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {[
                    { key: 'puntualidad', label: 'Puntualidad' },
                    { key: 'calidad', label: 'Calidad del trabajo' },
                    { key: 'comunicacion', label: 'Comunicación' },
                    { key: 'precio', label: 'Relación precio-calidad' }
                  ].map((aspecto) => (
                    <div key={aspecto.key} className="flex items-center justify-between">
                      <span className="font-medium text-neutral-900">{aspecto.label}</span>
                      {renderStars(
                        formData.aspectos[aspecto.key as keyof typeof formData.aspectos],
                        (rating) => handleStarClick(rating, aspecto.key as keyof typeof formData.aspectos),
                        'w-5 h-5'
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Comentario */}
              <div>
                <label className="block text-lg font-semibold text-neutral-900 mb-2">
                  Comentario detallado *
                </label>
                <p className="text-sm text-neutral-600 mb-3">
                  Comparte los detalles de tu experiencia (mínimo 10 caracteres, máximo 1500)
                </p>
                <textarea
                  value={formData.comentario}
                  onChange={(e) => setFormData(prev => ({ ...prev, comentario: e.target.value }))}
                  rows={6}
                  maxLength={1500}
                  className="w-full px-4 py-3 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-blue focus:border-transparent"
                  placeholder={isAsToExplorer 
                    ? "Describe cómo fue trabajar con este cliente: fue puntual, comunicó bien sus necesidades, respetó los acuerdos..."
                    : "Describe tu experiencia: el trabajo realizado, la atención recibida, si cumplió con lo acordado..."
                  }
                  required
                />
                <div className="flex justify-between items-center mt-2 text-sm">
                  <span className={`${formData.comentario.length < 10 ? 'text-red-500' : 'text-neutral-600'}`}>
                    Mínimo 10 caracteres
                  </span>
                  <span className={`${formData.comentario.length > 1400 ? 'text-orange-500' : 'text-neutral-600'}`}>
                    {formData.comentario.length}/1500
                  </span>
                </div>
              </div>

              {/* Recomendación */}
              <div>
                <label className="block text-lg font-semibold text-neutral-900 mb-4">
                  ¿Recomendarías a {targetUser?.nombre}?
                </label>
                <div className="flex items-center space-x-6">
                  <label className="flex items-center cursor-pointer">
                    <input
                      type="radio"
                      name="recomendaria"
                      checked={formData.recomendaria === true}
                      onChange={() => setFormData(prev => ({ ...prev, recomendaria: true }))}
                      className="mr-2"
                    />
                    <span className="text-green-600 font-medium">Sí, lo recomiendo</span>
                  </label>
                  <label className="flex items-center cursor-pointer">
                    <input
                      type="radio"
                      name="recomendaria"
                      checked={formData.recomendaria === false}
                      onChange={() => setFormData(prev => ({ ...prev, recomendaria: false }))}
                      className="mr-2"
                    />
                    <span className="text-red-600 font-medium">No lo recomiendo</span>
                  </label>
                </div>
              </div>

              {/* Nota sobre visibilidad */}
              <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                <h4 className="font-medium text-blue-900 mb-2">
                  📝 Sobre tu calificación
                </h4>
                <div className="text-sm text-blue-700 space-y-1">
                  <p>• Tu calificación y comentario serán <strong>visibles públicamente</strong> en el perfil de {targetUser?.nombre}</p>
                  <p>• Esto ayuda a otros usuarios a tomar mejores decisiones</p>
                  <p>• {targetUser?.nombre} también podrá calificarte como {currentUser?.tipo_usuario === 'as' ? BRAND_TERMS.AS : 'cliente'}</p>
                  <p>• Sé honesto y constructivo en tu comentario</p>
                </div>
              </div>

              {/* Buttons */}
              <div className="flex items-center justify-end space-x-4 pt-6 border-t">
                <button
                  type="button"
                  onClick={() => router.back()}
                  className="px-6 py-2 border border-neutral-300 text-neutral-700 rounded-lg hover:bg-neutral-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-2 bg-primary-blue text-white rounded-lg hover:bg-primary-blue-dark transition-colors disabled:opacity-50 flex items-center space-x-2"
                >
                  {submitting && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>}
                  <span>{submitting ? 'Enviando...' : 'Enviar Calificación'}</span>
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      </div>
    </>
  );
}