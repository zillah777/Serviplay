import { useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { motion } from 'framer-motion';
import {
  ArrowLeftIcon,
  MapPinIcon,
  CurrencyDollarIcon,
  CalendarIcon,
  ClockIcon,
  PhotoIcon
} from '@heroicons/react/24/outline';
import { APP_CONFIG, BRAND_TERMS } from '@/utils/constants';
import { authService } from '@/services/api';
import toast from 'react-hot-toast';

interface SearchForm {
  titulo: string;
  descripcion: string;
  categoria: string;
  direccion_trabajo: string;
  localidad: string;
  provincia: string;
  presupuesto_minimo: number;
  presupuesto_maximo: number;
  fecha_necesaria: string;
  urgencia: 'baja' | 'media' | 'alta';
  detalles_adicionales: string;
}

const CATEGORIAS = [
  'Plomería',
  'Electricidad', 
  'Carpintería',
  'Albañilería',
  'Pintura',
  'Jardinería',
  'Limpieza',
  'Técnico en PC',
  'Mecánica',
  'Otro'
];

const PROVINCIAS = [
  'Buenos Aires',
  'CABA',
  'Córdoba',
  'Santa Fe',
  'Mendoza',
  'Tucumán',
  'Entre Ríos',
  'Salta',
  'Misiones',
  'Corrientes',
  'Santiago del Estero',
  'San Juan',
  'Jujuy',
  'Río Negro',
  'Neuquén',
  'Formosa',
  'Chubut',
  'San Luis',
  'Catamarca',
  'La Rioja',
  'La Pampa',
  'Santa Cruz',
  'Tierra del Fuego'
];

export default function NewSearchPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<SearchForm>({
    titulo: '',
    descripcion: '',
    categoria: '',
    direccion_trabajo: '',
    localidad: '',
    provincia: '',
    presupuesto_minimo: 0,
    presupuesto_maximo: 0,
    fecha_necesaria: '',
    urgencia: 'media',
    detalles_adicionales: ''
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    if (name === 'presupuesto_minimo' || name === 'presupuesto_maximo') {
      setFormData(prev => ({
        ...prev,
        [name]: parseInt(value) || 0
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!authService.isAuthenticated()) {
      toast.error('Debes iniciar sesión para crear una búsqueda');
      router.push('/auth/login');
      return;
    }

    // Validaciones
    if (!formData.titulo.trim()) {
      toast.error('El título es obligatorio');
      return;
    }

    if (!formData.descripcion.trim()) {
      toast.error('La descripción es obligatoria');
      return;
    }

    if (!formData.categoria) {
      toast.error('Selecciona una categoría');
      return;
    }

    if (!formData.direccion_trabajo.trim()) {
      toast.error('La dirección es obligatoria');
      return;
    }

    if (formData.presupuesto_minimo <= 0 || formData.presupuesto_maximo <= 0) {
      toast.error('Los presupuestos deben ser mayor a 0');
      return;
    }

    if (formData.presupuesto_minimo >= formData.presupuesto_maximo) {
      toast.error('El presupuesto máximo debe ser mayor al mínimo');
      return;
    }

    setLoading(true);
    try {
      // TODO: Implementar creación de búsqueda en backend
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      toast.success('¡Búsqueda creada exitosamente!');
      router.push('/my-searches');
    } catch (error) {
      console.error('Error creating search:', error);
      toast.error('Error al crear la búsqueda');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Head>
        <title>Nueva Búsqueda - {APP_CONFIG.NAME}</title>
        <meta name="description" content="Crea una nueva búsqueda de servicios" />
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-primary-blue-light via-white to-secondary-green/20">
        {/* Header */}
        <div className="bg-white shadow-sm border-b">
          <div className="max-w-4xl mx-auto px-4 py-4">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.back()}
                className="p-2 text-neutral-600 hover:text-primary-blue transition-colors"
              >
                <ArrowLeftIcon className="w-5 h-5" />
              </button>
              <div>
                <h1 className="font-display text-2xl font-bold text-neutral-900">
                  Nueva Búsqueda
                </h1>
                <p className="text-neutral-600">
                  Describe qué tipo de {BRAND_TERMS.AS} necesitas
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
            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Información básica */}
              <div>
                <h3 className="text-lg font-semibold text-neutral-900 mb-4">
                  Información básica
                </h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-1">
                      Título de la búsqueda *
                    </label>
                    <input
                      type="text"
                      name="titulo"
                      value={formData.titulo}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-blue focus:border-transparent"
                      placeholder="Ej: Necesito plomero para reparar cañería"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-1">
                      Descripción detallada *
                    </label>
                    <textarea
                      name="descripcion"
                      value={formData.descripcion}
                      onChange={handleChange}
                      rows={4}
                      className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-blue focus:border-transparent"
                      placeholder="Describe en detalle qué necesitas que hagan..."
                      required
                    />
                  </div>

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
                </div>
              </div>

              {/* Ubicación */}
              <div>
                <h3 className="text-lg font-semibold text-neutral-900 mb-4">
                  Ubicación del trabajo
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-neutral-700 mb-1">
                      Dirección *
                    </label>
                    <div className="relative">
                      <MapPinIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-neutral-400" />
                      <input
                        type="text"
                        name="direccion_trabajo"
                        value={formData.direccion_trabajo}
                        onChange={handleChange}
                        className="w-full pl-10 pr-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-blue focus:border-transparent"
                        placeholder="Dirección donde se realizará el trabajo"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-1">
                      Localidad
                    </label>
                    <input
                      type="text"
                      name="localidad"
                      value={formData.localidad}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-blue focus:border-transparent"
                      placeholder="Ciudad o localidad"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-1">
                      Provincia
                    </label>
                    <select
                      name="provincia"
                      value={formData.provincia}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-blue focus:border-transparent"
                    >
                      <option value="">Selecciona provincia</option>
                      {PROVINCIAS.map(provincia => (
                        <option key={provincia} value={provincia}>
                          {provincia}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Presupuesto */}
              <div>
                <h3 className="text-lg font-semibold text-neutral-900 mb-4">
                  Presupuesto
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-1">
                      Presupuesto mínimo *
                    </label>
                    <div className="relative">
                      <CurrencyDollarIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-neutral-400" />
                      <input
                        type="number"
                        name="presupuesto_minimo"
                        value={formData.presupuesto_minimo || ''}
                        onChange={handleChange}
                        min="0"
                        className="w-full pl-10 pr-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-blue focus:border-transparent"
                        placeholder="1000"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-1">
                      Presupuesto máximo *
                    </label>
                    <div className="relative">
                      <CurrencyDollarIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-neutral-400" />
                      <input
                        type="number"
                        name="presupuesto_maximo"
                        value={formData.presupuesto_maximo || ''}
                        onChange={handleChange}
                        min="0"
                        className="w-full pl-10 pr-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-blue focus:border-transparent"
                        placeholder="5000"
                        required
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Timing */}
              <div>
                <h3 className="text-lg font-semibold text-neutral-900 mb-4">
                  Cuándo lo necesitas
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-1">
                      Fecha necesaria
                    </label>
                    <div className="relative">
                      <CalendarIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-neutral-400" />
                      <input
                        type="date"
                        name="fecha_necesaria"
                        value={formData.fecha_necesaria}
                        onChange={handleChange}
                        min={new Date().toISOString().split('T')[0]}
                        className="w-full pl-10 pr-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-blue focus:border-transparent"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-1">
                      Urgencia
                    </label>
                    <div className="relative">
                      <ClockIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-neutral-400" />
                      <select
                        name="urgencia"
                        value={formData.urgencia}
                        onChange={handleChange}
                        className="w-full pl-10 pr-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-blue focus:border-transparent"
                      >
                        <option value="baja">Baja - Flexible con fechas</option>
                        <option value="media">Media - En las próximas semanas</option>
                        <option value="alta">Alta - Urgente</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>

              {/* Detalles adicionales */}
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">
                  Detalles adicionales
                </label>
                <textarea
                  name="detalles_adicionales"
                  value={formData.detalles_adicionales}
                  onChange={handleChange}
                  rows={3}
                  className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-blue focus:border-transparent"
                  placeholder="Cualquier información adicional que consideres importante..."
                />
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
                  disabled={loading}
                  className="px-6 py-2 bg-primary-blue text-white rounded-lg hover:bg-primary-blue-dark transition-colors disabled:opacity-50 flex items-center space-x-2"
                >
                  {loading && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>}
                  <span>{loading ? 'Creando...' : 'Crear Búsqueda'}</span>
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      </div>
    </>
  );
}