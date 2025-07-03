import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Layout from '@/components/common/Layout';
import SearchBar from '@/components/search/SearchBar';
import SearchResults from '@/components/search/SearchResults';
import { Servicio, Categoria } from '@/types';
import { SearchFilters, SearchResult } from '@/types/search';
import { defaultFilters, calculateRelevance } from '@/utils/searchHelpers';
import { BRAND_TERMS } from '@/utils/constants';
import { authService } from '@/services/api';

// Basic categories for when no data is available
const fallbackCategories: Categoria[] = [
  { id: '1', nombre: 'Limpieza', icono: '✨', color: '#10b981', activa: true, orden: 1 },
  { id: '2', nombre: 'Plomería', icono: '🚰', color: '#3b82f6', activa: true, orden: 2 },
  { id: '3', nombre: 'Electricidad', icono: '💡', color: '#f59e0b', activa: true, orden: 3 },
  { id: '4', nombre: 'Jardinería', icono: '🌿', color: '#22c55e', activa: true, orden: 4 },
];

export default function ExplorePage() {
  const [allServices, setAllServices] = useState<Servicio[]>([]);
  const [searchResults, setSearchResults] = useState<SearchResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState<SearchFilters>(defaultFilters);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    // Verificar autenticación del usuario
    if (authService.isAuthenticated()) {
      const currentUser = authService.getCurrentUser();
      setUser(currentUser);
    }
    
    // TODO: Implementar carga de servicios reales desde backend
    // Por ahora mostramos un mensaje informativo
    console.log('🔍 Explore page loaded - services will be loaded from backend when available');
  }, []);

  const performSearch = (searchFilters: SearchFilters) => {
    setLoading(true);
    setFilters(searchFilters);

    // TODO: Implementar búsqueda real en backend
    setTimeout(() => {
      setSearchResults({
        servicios: [],
        total: 0,
        pagina: 1,
        por_pagina: 20,
        filtros_aplicados: searchFilters,
        tiempo_busqueda: 100
      });
      
      setLoading(false);
    }, 800);
  };

  const handleServiceClick = (service: Servicio) => {
    // Navegar al detalle del servicio
    console.log('Clicked service:', service.id);
    // router.push(`/services/${service.id}`);
  };

  return (
    <Layout 
      title="Explorar Servicios" 
      description={`Descubrí los mejores ${BRAND_TERMS.ASES} cerca tuyo`}
      showSearch={false}
      user={user}
    >
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-8"
          >
            <h1 className="font-display text-4xl font-bold text-neutral-900 mb-2">
              Explorá {BRAND_TERMS.ASES} Increíbles
            </h1>
            <p className="text-xl text-neutral-600 mb-8">
              {BRAND_TERMS.EXPLORERS_FIND} 🔍✨
            </p>

            {/* Search Bar Principal */}
            <SearchBar 
              onSearch={performSearch}
              placeholder={`Buscá ${BRAND_TERMS.ASES} increíbles... ej: 'plomero urgente', 'limpieza profunda'`}
              size="lg"
            />
          </motion.div>
        </div>

        {/* Search Results */}
        <SearchResults
          results={searchResults}
          loading={loading}
          filters={filters}
          onFiltersChange={performSearch}
          onServiceClick={handleServiceClick}
        />
      </div>
    </Layout>
  );
}