import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  StarIcon,
  EyeIcon,
  CalendarIcon,
  UserIcon,
  CheckBadgeIcon,
  FunnelIcon,
  MagnifyingGlassIcon
} from '@heroicons/react/24/outline';
import { StarIcon as StarSolidIcon } from '@heroicons/react/24/solid';
import { APP_CONFIG, BRAND_TERMS } from '@/utils/constants';
import { authService } from '@/services/api';

interface Review {
  id: string;
  calificacion: number;
  comentario: string;
  fecha: string;
  recomendaria: boolean;
  aspectos: {
    puntualidad: number;
    calidad: number;
    comunicacion: number;
    precio: number;
  };
  servicio: {
    id: string;
    titulo: string;
    categoria: string;
  };
  calificador: {
    id: string;
    nombre: string;
    apellido: string;
    tipo_usuario: 'as' | 'explorador';
    foto_perfil?: string;
    verificado: boolean;
  };
  calificado: {
    id: string;
    nombre: string;
    apellido: string;
    tipo_usuario: 'as' | 'explorador';
    foto_perfil?: string;
    verificado: boolean;
  };
  tipo: 'dada' | 'recibida';
}

export default function ReviewsPage() {
  const router = useRouter();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'todas' | 'dadas' | 'recibidas'>('todas');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadReviews();
  }, []);

  const loadReviews = async () => {
    try {
      if (!authService.isAuthenticated()) {
        router.push('/auth/login');
        return;
      }

      setLoading(true);
      // TODO: Implementar llamada real a la API
      console.log('🔍 Loading user reviews from backend...');
      
      // Mock data para demostración
      await new Promise(resolve => setTimeout(resolve, 1000));
      setReviews([]);
    } catch (error) {
      console.error('Error loading reviews:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredReviews = reviews.filter(review => {
    const matchesFilter = filter === 'todas' || review.tipo === filter.slice(0, -1); // 'dadas' -> 'dada'
    const matchesSearch = !searchTerm || 
      review.comentario.toLowerCase().includes(searchTerm.toLowerCase()) ||
      review.servicio.titulo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      `${review.calificado.nombre} ${review.calificado.apellido}`.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesFilter && matchesSearch;
  });

  const stats = {
    total: reviews.length,
    dadas: reviews.filter(r => r.tipo === 'dada').length,
    recibidas: reviews.filter(r => r.tipo === 'recibida').length,
    promedio: reviews.length > 0 ? reviews.reduce((acc, r) => acc + r.calificacion, 0) / reviews.length : 0
  };

  const renderStars = (rating: number, size = 'w-4 h-4') => {
    return (
      <div className="flex items-center space-x-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <div key={star} className={size}>
            {star <= rating ? (
              <StarSolidIcon className="text-yellow-500" />
            ) : (
              <StarIcon className="text-neutral-300" />
            )}
          </div>
        ))}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen no-overflow bg-gradient-to-br from-primary-blue-light via-white to-secondary-green/20 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary-blue border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-neutral-600">Cargando calificaciones...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Mis Calificaciones - {APP_CONFIG.NAME}</title>
        <meta name="description" content="Gestiona tus calificaciones y comentarios" />
      </Head>

      <div className="min-h-screen no-overflow bg-gradient-to-br from-primary-blue-light via-white to-secondary-green/20">
        {/* Header */}
        <div className="bg-white shadow-sm border-b">
          <div className="container mx-auto py-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <StarSolidIcon className="w-8 h-8 text-yellow-500" />
                <div>
                  <h1 className="font-display text-3xl font-bold text-neutral-900">
                    Mis Calificaciones
                  </h1>
                  <p className="text-neutral-600">
                    Historial de calificaciones dadas y recibidas
                  </p>
                </div>
              </div>
              
              <Link
                href="/dashboard"
                className="px-4 py-2 border border-neutral-300 text-neutral-700 rounded-lg hover:bg-neutral-50 transition-colors"
              >
                Volver al Dashboard
              </Link>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
              <div className="bg-white rounded-lg p-4 border border-neutral-200">
                <div className="text-2xl font-bold text-neutral-900">{stats.total}</div>
                <div className="text-sm text-neutral-600">Total</div>
              </div>
              <div className="bg-white rounded-lg p-4 border border-neutral-200">
                <div className="text-2xl font-bold text-primary-blue">{stats.dadas}</div>
                <div className="text-sm text-neutral-600">Dadas</div>
              </div>
              <div className="bg-white rounded-lg p-4 border border-neutral-200">
                <div className="text-2xl font-bold text-secondary-green">{stats.recibidas}</div>
                <div className="text-sm text-neutral-600">Recibidas</div>
              </div>
              <div className="bg-white rounded-lg p-4 border border-neutral-200">
                <div className="flex items-center space-x-2">
                  <div className="text-2xl font-bold text-yellow-600">
                    {stats.promedio > 0 ? stats.promedio.toFixed(1) : '0.0'}
                  </div>
                  <StarSolidIcon className="w-6 h-6 text-yellow-500" />
                </div>
                <div className="text-sm text-neutral-600">Promedio</div>
              </div>
            </div>
          </div>
        </div>

        <div className="container mx-auto py-8">
          {/* Search and Filters */}
          <div className="flex flex-col md:flex-row gap-4 mb-8">
            <div className="flex-1 relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-neutral-400" />
              <input
                type="text"
                placeholder="Buscar por comentario, servicio o persona..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-blue focus:border-transparent"
              />
            </div>
            
            <div className="flex items-center space-x-2">
              <FunnelIcon className="w-5 h-5 text-neutral-400" />
              {['todas', 'dadas', 'recibidas'].map((filterOption) => (
                <button
                  key={filterOption}
                  onClick={() => setFilter(filterOption as any)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    filter === filterOption
                      ? 'bg-primary-blue text-white'
                      : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                  }`}
                >
                  {filterOption.charAt(0).toUpperCase() + filterOption.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Reviews List */}
          {filteredReviews.length > 0 ? (
            <div className="space-y-6">
              {filteredReviews.map((review, index) => (
                <motion.div
                  key={review.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-white rounded-2xl shadow-lg p-6 border border-neutral-200"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-start space-x-4 flex-1">
                      {/* User Info */}
                      <img
                        src={review.tipo === 'dada' ? review.calificado.foto_perfil : review.calificador.foto_perfil || '/images/default-avatar.png'}
                        alt="Usuario"
                        className="w-12 h-12 rounded-full object-cover"
                      />
                      
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <h3 className="font-semibold text-neutral-900">
                            {review.tipo === 'dada' ? 'Calificaste a' : 'Te calificó'}: {' '}
                            {review.tipo === 'dada' 
                              ? `${review.calificado.nombre} ${review.calificado.apellido}`
                              : `${review.calificador.nombre} ${review.calificador.apellido}`
                            }
                          </h3>
                          {(review.tipo === 'dada' ? review.calificado.verificado : review.calificador.verificado) && (
                            <CheckBadgeIcon className="w-4 h-4 text-primary-blue" />
                          )}
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            review.tipo === 'dada' 
                              ? 'bg-primary-blue/10 text-primary-blue'
                              : 'bg-secondary-green/10 text-secondary-green'
                          }`}>
                            {review.tipo === 'dada' ? 'Calificación dada' : 'Calificación recibida'}
                          </span>
                        </div>
                        
                        {/* Service Info */}
                        <div className="flex items-center space-x-4 text-sm text-neutral-600 mb-3">
                          <span><strong>Servicio:</strong> {review.servicio.titulo}</span>
                          <span><strong>Categoría:</strong> {review.servicio.categoria}</span>
                          <div className="flex items-center space-x-1">
                            <CalendarIcon className="w-4 h-4" />
                            <span>{new Date(review.fecha).toLocaleDateString()}</span>
                          </div>
                        </div>
                        
                        {/* Rating */}
                        <div className="flex items-center space-x-4 mb-3">
                          <div className="flex items-center space-x-2">
                            {renderStars(review.calificacion)}
                            <span className="font-medium text-neutral-900">
                              {review.calificacion}/5
                            </span>
                          </div>
                          {review.recomendaria && (
                            <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                              Recomendado
                            </span>
                          )}
                        </div>
                        
                        {/* Comment */}
                        <div className="bg-neutral-50 rounded-lg p-4 mb-4">
                          <p className="text-neutral-700 leading-relaxed">
                            "{review.comentario}"
                          </p>
                        </div>
                        
                        {/* Detailed Ratings */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                          {[
                            { key: 'puntualidad', label: 'Puntualidad' },
                            { key: 'calidad', label: 'Calidad' },
                            { key: 'comunicacion', label: 'Comunicación' },
                            { key: 'precio', label: 'Precio/Calidad' }
                          ].map((aspecto) => (
                            <div key={aspecto.key} className="text-center">
                              <div className="text-neutral-600 mb-1">{aspecto.label}</div>
                              <div className="flex justify-center">
                                {renderStars(review.aspectos[aspecto.key as keyof typeof review.aspectos], 'w-3 h-3')}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                    
                    {/* Actions */}
                    <div className="flex items-center space-x-2">
                      <Link
                        href={`/services/${review.servicio.id}`}
                        className="p-2 text-neutral-400 hover:text-primary-blue transition-colors"
                        title="Ver servicio"
                      >
                        <EyeIcon className="w-5 h-5" />
                      </Link>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            /* Empty State */
            <div className="text-center py-16">
              <div className="w-24 h-24 bg-neutral-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <StarIcon className="w-12 h-12 text-neutral-400" />
              </div>
              
              <h3 className="font-semibold text-neutral-900 text-xl mb-2">
                {filter === 'todas' 
                  ? 'No tienes calificaciones aún'
                  : `No tienes calificaciones ${filter}`
                }
              </h3>
              
              <p className="text-neutral-600 mb-8 max-w-md mx-auto">
                {filter === 'todas'
                  ? 'Cuando completes servicios podrás calificar y ser calificado'
                  : searchTerm 
                    ? 'No se encontraron resultados para tu búsqueda'
                    : `Cambia el filtro para ver otras calificaciones`
                }
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link
                  href="/explore"
                  className="inline-flex items-center space-x-2 bg-primary-blue text-white px-6 py-3 rounded-full hover:bg-primary-blue-dark transition-colors"
                >
                  <span>Explorar Servicios</span>
                </Link>
                
                <Link
                  href="/dashboard"
                  className="inline-flex items-center space-x-2 border border-neutral-300 text-neutral-700 px-6 py-3 rounded-full hover:bg-neutral-50 transition-colors"
                >
                  <span>Ir al Dashboard</span>
                </Link>
              </div>
            </div>
          )}

          {/* Info Box */}
          <div className="mt-12 bg-blue-50 rounded-2xl p-6 border border-blue-200">
            <h4 className="font-semibold text-blue-900 mb-2">
              📋 Sobre las calificaciones
            </h4>
            <div className="text-sm text-blue-700 space-y-1">
              <p>• Las calificaciones son públicas y ayudan a generar confianza en la plataforma</p>
              <p>• Tanto exploradores como {BRAND_TERMS.ASES} pueden calificarse mutuamente</p>
              <p>• Los comentarios tienen un límite de 1500 caracteres</p>
              <p>• Sé honesto y constructivo en tus calificaciones</p>
              <p>• Tu promedio de calificaciones afecta tu visibilidad en la plataforma</p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}