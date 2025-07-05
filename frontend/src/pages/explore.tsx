import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Layout from '@/components/common/Layout';
import SearchBar from '@/components/search/SearchBar';
import SearchResults from '@/components/search/SearchResults';
import { Servicio, Categoria } from '@/types';
import { SearchFilters, SearchResult } from '@/types/search';
import { defaultFilters, calculateRelevance } from '@/utils/searchHelpers';
import { BRAND_TERMS } from '@/utils/constants';
import { authService, servicesApi } from '@/services/api';
import toast from 'react-hot-toast';

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
  const [initialLoading, setInitialLoading] = useState(true);
  const [filters, setFilters] = useState<SearchFilters>(defaultFilters);
  const [user, setUser] = useState<any>(null);
  const [categories, setCategories] = useState<Categoria[]>(fallbackCategories);

  useEffect(() => {
    // Verificar autenticación del usuario
    if (authService.isAuthenticated()) {
      const currentUser = authService.getCurrentUser();
      setUser(currentUser);
    }
    
    // Cargar datos iniciales
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      setInitialLoading(true);
      
      // Cargar categorías reales
      const categoriesResponse = await servicesApi.getCategories();
      if (categoriesResponse.success && categoriesResponse.data) {
        setCategories(categoriesResponse.data);
      }
      
      // Cargar servicios destacados inicialmente
      const featuredResponse = await servicesApi.getFeaturedServices();
      if (featuredResponse.success && featuredResponse.data) {
        setSearchResults({
          servicios: featuredResponse.data,
          total: featuredResponse.data.length,
          pagina: 1,
          por_pagina: 20,
          filtros_aplicados: defaultFilters,
          tiempo_busqueda: 0
        });
      }
      
    } catch (error) {
      console.error('Error loading initial data:', error);
      toast.error('Error al cargar los datos iniciales');
    } finally {
      setInitialLoading(false);
    }
  };

  const performSearch = async (searchFilters: SearchFilters) => {
    try {
      setLoading(true);
      setFilters(searchFilters);

      const startTime = Date.now();
      
      // Buscar servicios reales en el backend
      const response = await servicesApi.searchServices(searchFilters);
      
      const endTime = Date.now();
      const searchTime = endTime - startTime;

      if (response.success) {
        setSearchResults({
          servicios: response.data.servicios || [],
          total: response.data.total || 0,
          pagina: response.data.pagina || 1,
          por_pagina: response.data.por_pagina || 20,
          filtros_aplicados: searchFilters,
          tiempo_busqueda: searchTime
        });
      } else {
        toast.error('Error en la búsqueda');
        setSearchResults({
          servicios: [],
          total: 0,
          pagina: 1,
          por_pagina: 20,
          filtros_aplicados: searchFilters,
          tiempo_busqueda: searchTime
        });
      }
      
    } catch (error) {
      console.error('Error performing search:', error);
      toast.error('Error al buscar servicios');
      
      // Mostrar resultados vacíos en caso de error
      setSearchResults({
        servicios: [],
        total: 0,
        pagina: 1,
        por_pagina: 20,
        filtros_aplicados: searchFilters,
        tiempo_busqueda: 0
      });
    } finally {
      setLoading(false);
    }
  };

  const handleServiceClick = (service: Servicio) => {
    // Navegar al detalle del servicio
    window.location.href = `/services/${service.id}`;
  };

  if (initialLoading) {
    return (
      <Layout 
        title="Explorar Servicios" 
        description={`Descubrí los mejores ${BRAND_TERMS.ASES} cerca tuyo`}
        showSearch={false}
        user={user}
      >
        <div className="container mx-auto py-8">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <div className="w-16 h-16 border-4 border-primary-blue border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-neutral-600">Cargando servicios...</p>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout 
      title="Explorar Servicios" 
      description={`Descubrí los mejores ${BRAND_TERMS.ASES} cerca tuyo`}
      showSearch={false}
      user={user}
    >
      <div className="container mx-auto py-8">
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
              categories={categories}
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