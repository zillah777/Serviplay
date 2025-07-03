import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import {
  PlusIcon,
  PencilIcon,
  EyeIcon,
  TrashIcon,
  MapPinIcon,
  CurrencyDollarIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  PauseIcon
} from '@heroicons/react/24/outline';
import Layout from '@/components/common/Layout';
import Loading from '@/components/common/Loading';
import { BusquedaServicio } from '@/types';
import { BRAND_TERMS } from '@/utils/constants';

export default function MySearchesPage() {
  const [searches, setSearches] = useState<BusquedaServicio[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'todas' | 'activas' | 'pausadas' | 'finalizadas'>('todas');

  useEffect(() => {
    fetchMySearches();
  }, []);

  const fetchMySearches = async () => {
    try {
      setLoading(true);
      // TODO: Implementar llamada real a la API cuando esté disponible
      console.log('🔍 Loading user searches from backend...');
      
      // Por ahora, mostrar lista vacía hasta que se implemente el backend
      setSearches([]);
    } catch (err) {
      console.error('Error fetching searches:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (searchId: string, newStatus: 'activa' | 'pausada') => {
    try {
      // TODO: API call to update search status
      setSearches(prev => 
        prev.map(search => 
          search.id === searchId 
            ? { ...search, estado: newStatus }
            : search
        )
      );
    } catch (err) {
      console.error('Error updating search status:', err);
    }
  };

  const handleDeleteSearch = async (searchId: string) => {
    if (!confirm('¿Estás seguro de que querés eliminar esta búsqueda?')) return;
    
    try {
      // TODO: API call to delete search
      setSearches(prev => prev.filter(search => search.id !== searchId));
    } catch (err) {
      console.error('Error deleting search:', err);
    }
  };

  const filteredSearches = searches.filter(search => {
    if (filter === 'todas') return true;
    if (filter === 'activas') return search.estado === 'activa';
    if (filter === 'pausadas') return search.estado === 'pausada';
    if (filter === 'finalizadas') return search.estado === 'completada' || search.estado === 'cancelada';
    return false;
  });

  if (loading) {
    return <Loading />;
  }

  return (
    <Layout 
      title="Mis Búsquedas" 
      description="Gestiona tus búsquedas de servicios"
    >
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="font-display text-3xl font-bold text-neutral-900 mb-2">
              Mis Búsquedas
            </h1>
            <p className="text-neutral-600">
              Gestiona tus solicitudes de servicios y encuentra el {BRAND_TERMS.AS} perfecto
            </p>
          </div>
          
          <Link
            href="/searches/new"
            className="flex items-center space-x-2 bg-primary-blue text-white px-6 py-3 rounded-full hover:bg-primary-blue-dark transition-colors"
          >
            <PlusIcon className="w-5 h-5" />
            <span>Nueva Búsqueda</span>
          </Link>
        </div>

        {/* Filters */}
        <div className="flex items-center space-x-4 mb-8">
          {['todas', 'activas', 'pausadas', 'finalizadas'].map((filterOption) => (
            <button
              key={filterOption}
              onClick={() => setFilter(filterOption as any)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                filter === filterOption
                  ? 'bg-primary-blue text-white'
                  : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
              }`}
            >
              {filterOption.charAt(0).toUpperCase() + filterOption.slice(1)}
            </button>
          ))}
        </div>

        {/* Searches List */}
        {filteredSearches.length > 0 ? (
          <div className="grid gap-6">
            {filteredSearches.map((search) => (
              <motion.div
                key={search.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-2xl shadow-lg p-6 border border-neutral-200 hover:border-primary-blue transition-colors"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="font-semibold text-neutral-900 text-lg">
                        {search.titulo}
                      </h3>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        search.estado === 'activa' 
                          ? 'bg-green-100 text-green-800'
                          : search.estado === 'pausada'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-neutral-100 text-neutral-800'
                      }`}>
                        {search.estado}
                      </span>
                    </div>
                    
                    <p className="text-neutral-600 mb-4">
                      {search.descripcion}
                    </p>
                    
                    <div className="flex items-center flex-wrap gap-4 text-sm text-neutral-500">
                      <div className="flex items-center space-x-1">
                        <MapPinIcon className="w-4 h-4" />
                        <span>{search.direccion_trabajo}</span>
                      </div>
                      
                      <div className="flex items-center space-x-1">
                        <CurrencyDollarIcon className="w-4 h-4" />
                        <span>
                          ${search.presupuesto_minimo?.toLocaleString()} - ${search.presupuesto_maximo?.toLocaleString()}
                        </span>
                      </div>
                      
                      {search.fecha_necesaria && (
                        <div className="flex items-center space-x-1">
                          <ClockIcon className="w-4 h-4" />
                          <span>
                            Para: {new Date(search.fecha_necesaria).toLocaleDateString()}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2 ml-4">
                    <button
                      onClick={() => handleToggleStatus(
                        search.id, 
                        search.estado === 'activa' ? 'pausada' : 'activa'
                      )}
                      className="p-2 text-neutral-400 hover:text-primary-blue transition-colors"
                      title={search.estado === 'activa' ? 'Pausar' : 'Activar'}
                    >
                      {search.estado === 'activa' ? (
                        <PauseIcon className="w-5 h-5" />
                      ) : (
                        <CheckCircleIcon className="w-5 h-5" />
                      )}
                    </button>
                    
                    <button className="p-2 text-neutral-400 hover:text-primary-blue transition-colors">
                      <PencilIcon className="w-5 h-5" />
                    </button>
                    
                    <button className="p-2 text-neutral-400 hover:text-primary-blue transition-colors">
                      <EyeIcon className="w-5 h-5" />
                    </button>
                    
                    <button
                      onClick={() => handleDeleteSearch(search.id)}
                      className="p-2 text-neutral-400 hover:text-red-500 transition-colors"
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
              <span className="text-4xl">🔍</span>
            </div>
            
            <h3 className="font-semibold text-neutral-900 text-xl mb-2">
              {filter === 'todas' 
                ? 'No has creado ninguna búsqueda aún'
                : `No tienes búsquedas ${filter}`
              }
            </h3>
            
            <p className="text-neutral-600 mb-8 max-w-md mx-auto">
              {filter === 'todas'
                ? `Crea tu primera búsqueda para encontrar ${BRAND_TERMS.ASES} cerca tuyo`
                : `Cambia el filtro o crea una nueva búsqueda`
              }
            </p>
            
            <Link
              href="/searches/new"
              className="inline-flex items-center space-x-2 bg-primary-blue text-white px-6 py-3 rounded-full hover:bg-primary-blue-dark transition-colors"
            >
              <PlusIcon className="w-5 h-5" />
              <span>Crear mi primera búsqueda</span>
            </Link>
          </div>
        )}
      </div>
    </Layout>
  );
}