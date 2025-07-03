import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  HeartIcon,
  TrashIcon,
  EyeIcon,
  StarIcon,
  MapPinIcon,
  PhoneIcon,
  ShareIcon,
  ArrowLeftIcon
} from '@heroicons/react/24/outline';
import { HeartIcon as HeartSolidIcon } from '@heroicons/react/24/solid';
import { APP_CONFIG, BRAND_TERMS } from '@/utils/constants';
import { authService } from '@/services/api';
import toast from 'react-hot-toast';

interface FavoriteService {
  id: string;
  titulo: string;
  descripcion: string;
  categoria: string;
  precio_desde: number;
  precio_hasta: number;
  ubicacion: string;
  calificacion: number;
  reviews_count: number;
  as: {
    id: string;
    nombre: string;
    apellido: string;
    foto_perfil?: string;
    verificado: boolean;
  };
  fecha_agregado: string;
  disponible: boolean;
}

export default function FavoritesPage() {
  const router = useRouter();
  const [favorites, setFavorites] = useState<FavoriteService[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'todos' | 'disponibles' | 'no_disponibles'>('todos');

  useEffect(() => {
    loadFavorites();
  }, []);

  const loadFavorites = async () => {
    try {
      if (!authService.isAuthenticated()) {
        router.push('/auth/login');
        return;
      }

      setLoading(true);
      // TODO: Implementar llamada real a la API
      console.log('🔍 Loading user favorites from backend...');
      
      // Mock data para demostración
      await new Promise(resolve => setTimeout(resolve, 1000));
      setFavorites([]);
    } catch (error) {
      console.error('Error loading favorites:', error);
      toast.error('Error al cargar favoritos');
    } finally {
      setLoading(false);
    }
  };

  const removeFavorite = async (serviceId: string) => {
    try {
      // TODO: API call to remove favorite
      setFavorites(prev => prev.filter(fav => fav.id !== serviceId));
      toast.success('Servicio removido de favoritos');
    } catch (error) {
      console.error('Error removing favorite:', error);
      toast.error('Error al remover favorito');
    }
  };

  const shareService = (service: FavoriteService) => {
    if (navigator.share) {
      navigator.share({
        title: service.titulo,
        text: `${service.descripcion.substring(0, 100)}...`,
        url: `${window.location.origin}/services/${service.id}`
      });
    } else {
      navigator.clipboard.writeText(`${window.location.origin}/services/${service.id}`);
      toast.success('Link copiado al portapapeles');
    }
  };

  const filteredFavorites = favorites.filter(favorite => {
    if (filter === 'todos') return true;
    if (filter === 'disponibles') return favorite.disponible;
    if (filter === 'no_disponibles') return !favorite.disponible;
    return false;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-blue-light via-white to-secondary-green/20 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary-blue border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-neutral-600">Cargando favoritos...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Mis Favoritos - {APP_CONFIG.NAME}</title>
        <meta name="description" content="Gestiona tus servicios favoritos" />
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-primary-blue-light via-white to-secondary-green/20">
        {/* Header */}
        <div className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 py-6">
            <div className="flex items-center space-x-4 mb-4">
              <button
                onClick={() => router.back()}
                className="p-2 text-neutral-600 hover:text-primary-blue transition-colors"
              >
                <ArrowLeftIcon className="w-5 h-5" />
              </button>
              <HeartSolidIcon className="w-8 h-8 text-red-500" />
              <div>
                <h1 className="font-display text-3xl font-bold text-neutral-900">
                  Mis Favoritos
                </h1>
                <p className="text-neutral-600">
                  Servicios que has guardado para más tarde
                </p>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="flex items-center space-x-6 text-sm text-neutral-600">
              <span>{favorites.length} servicios guardados</span>
              <span>
                {favorites.filter(f => f.disponible).length} disponibles
              </span>
              <span>
                {favorites.filter(f => !f.disponible).length} no disponibles
              </span>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 py-8">
          {/* Filters */}
          <div className="flex items-center space-x-4 mb-8">
            {[
              { key: 'todos', label: 'Todos' },
              { key: 'disponibles', label: 'Disponibles' },
              { key: 'no_disponibles', label: 'No Disponibles' }
            ].map((filterOption) => (
              <button
                key={filterOption.key}
                onClick={() => setFilter(filterOption.key as any)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  filter === filterOption.key
                    ? 'bg-primary-blue text-white'
                    : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                }`}
              >
                {filterOption.label}
              </button>
            ))}
          </div>

          {/* Favorites List */}
          {filteredFavorites.length > 0 ? (
            <div className="grid gap-6">
              {filteredFavorites.map((favorite, index) => (
                <motion.div
                  key={favorite.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className={`bg-white rounded-2xl shadow-lg p-6 border ${
                    favorite.disponible ? 'border-neutral-200' : 'border-neutral-300 opacity-75'
                  }`}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="font-semibold text-neutral-900 text-lg">
                          {favorite.titulo}
                        </h3>
                        {!favorite.disponible && (
                          <span className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full">
                            No disponible
                          </span>
                        )}
                      </div>
                      
                      <p className="text-neutral-600 mb-3">
                        {favorite.descripcion}
                      </p>

                      {/* AS Info */}
                      <div className="flex items-center space-x-3 mb-4">
                        <img
                          src={favorite.as.foto_perfil || '/images/default-avatar.png'}
                          alt={`${favorite.as.nombre} ${favorite.as.apellido}`}
                          className="w-10 h-10 rounded-full object-cover"
                        />
                        <div>
                          <div className="flex items-center space-x-2">
                            <span className="font-medium text-neutral-900">
                              {favorite.as.nombre} {favorite.as.apellido}
                            </span>
                            {favorite.as.verificado && (
                              <div className="w-4 h-4 bg-primary-blue rounded-full flex items-center justify-center">
                                <span className="text-white text-xs">✓</span>
                              </div>
                            )}
                          </div>
                          <div className="flex items-center space-x-1">
                            <StarIcon className="w-4 h-4 text-yellow-500" />
                            <span className="text-sm text-neutral-600">
                              {favorite.calificacion}/5 ({favorite.reviews_count} reseñas)
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      {/* Service Details */}
                      <div className="flex items-center flex-wrap gap-4 text-sm text-neutral-500">
                        <div className="flex items-center space-x-1">
                          <span className="px-2 py-1 bg-neutral-100 rounded-full text-xs">
                            {favorite.categoria}
                          </span>
                        </div>
                        
                        <div className="flex items-center space-x-1">
                          <MapPinIcon className="w-4 h-4" />
                          <span>{favorite.ubicacion}</span>
                        </div>
                        
                        <div className="flex items-center space-x-1">
                          <span>💰</span>
                          <span>
                            ${favorite.precio_desde.toLocaleString()} - ${favorite.precio_hasta.toLocaleString()}
                          </span>
                        </div>

                        <div className="flex items-center space-x-1">
                          <span>📅</span>
                          <span>
                            Agregado: {new Date(favorite.fecha_agregado).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    {/* Actions */}
                    <div className="flex items-center space-x-2 ml-4">
                      <Link
                        href={`/services/${favorite.id}`}
                        className="p-2 text-neutral-400 hover:text-primary-blue transition-colors"
                        title="Ver servicio"
                      >
                        <EyeIcon className="w-5 h-5" />
                      </Link>
                      
                      <button
                        onClick={() => shareService(favorite)}
                        className="p-2 text-neutral-400 hover:text-primary-blue transition-colors"
                        title="Compartir"
                      >
                        <ShareIcon className="w-5 h-5" />
                      </button>
                      
                      <button
                        onClick={() => removeFavorite(favorite.id)}
                        className="p-2 text-neutral-400 hover:text-red-500 transition-colors"
                        title="Remover de favoritos"
                      >
                        <TrashIcon className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            /* Empty State */
            <div className="text-center py-16">
              <div className="w-24 h-24 bg-neutral-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <HeartIcon className="w-12 h-12 text-neutral-400" />
              </div>
              
              <h3 className="font-semibold text-neutral-900 text-xl mb-2">
                {filter === 'todos' 
                  ? 'No tienes servicios favoritos aún'
                  : `No tienes favoritos ${filter === 'disponibles' ? 'disponibles' : 'no disponibles'}`
                }
              </h3>
              
              <p className="text-neutral-600 mb-8 max-w-md mx-auto">
                {filter === 'todos'
                  ? `Explora servicios y guarda los que más te interesen para encontrarlos fácilmente`
                  : `Cambia el filtro o explora nuevos servicios`
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

          {/* Tips */}
          {favorites.length > 0 && (
            <div className="mt-12 bg-blue-50 rounded-2xl p-6 border border-blue-200">
              <h4 className="font-semibold text-blue-900 mb-2">
                💡 Consejos para usar favoritos
              </h4>
              <div className="text-sm text-blue-700 space-y-1">
                <p>• Guarda servicios que te interesen para compararlos después</p>
                <p>• Los servicios marcados como "No disponibles" pueden volver a estar activos</p>
                <p>• Comparte servicios favoritos con amigos y familiares</p>
                <p>• Contacta directamente a los {BRAND_TERMS.ASES} desde la vista detallada</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}