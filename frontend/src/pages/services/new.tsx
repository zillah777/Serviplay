import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { 
  ArrowLeftIcon,
  PhotoIcon,
  DocumentIcon,
  CheckIcon
} from '@heroicons/react/24/outline';
import { APP_CONFIG, BRAND_TERMS } from '@/utils/constants';
import toast from 'react-hot-toast';

// Mock categories basado en estructura real de DB
const mockCategories = [
  { id: '1', nombre: 'Limpieza', icono: '🧹', color: '#10b981' },
  { id: '2', nombre: 'Plomería', icono: '🔧', color: '#3b82f6' },
  { id: '3', nombre: 'Electricidad', icono: '⚡', color: '#f59e0b' },
  { id: '4', nombre: 'Jardinería', icono: '🌱', color: '#22c55e' },
  { id: '5', nombre: 'Pintura', icono: '🎨', color: '#8b5cf6' },
  { id: '6', nombre: 'Carpintería', icono: '🪚', color: '#a3a3a3' },
  { id: '7', nombre: 'Albañilería', icono: '🧱', color: '#dc2626' },
  { id: '8', nombre: 'Programación', icono: '💻', color: '#06b6d4' }
];

const tiposPrecio = [
  { value: 'por_hora', label: 'Por hora' },
  { value: 'por_trabajo', label: 'Por trabajo' },
  { value: 'por_semana', label: 'Por semana' },
  { value: 'por_mes', label: 'Por mes' }
];

export default function NewService() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState(mockCategories);
  
  // Datos del formulario basados en estructura real de DB
  const [formData, setFormData] = useState({
    // Campos obligatorios de la tabla servicios
    categoria_id: '',
    titulo: '',
    descripcion: '',
    tipo_precio: 'por_trabajo', // 'por_hora' | 'por_trabajo' | 'por_semana' | 'por_mes'
    precio_desde: '',
    precio_hasta: '',
    moneda: 'ARS',
    
    // Campos opcionales
    disponible: true,
    urgente: false,
    requiere_matricula: false,
    matricula_numero: '',
    titulo_profesional: '',
    
    // Archivos
    documento_respaldo: null as File | null,
    
    // Tags (separados por comas)
    tags: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validaciones
    if (!formData.categoria_id) {
      toast.error('Selecciona una categoría');
      return;
    }
    
    if (!formData.titulo.trim()) {
      toast.error('El título es obligatorio');
      return;
    }
    
    if (!formData.descripcion.trim()) {
      toast.error('La descripción es obligatoria');
      return;
    }
    
    if (!formData.precio_desde || Number(formData.precio_desde) <= 0) {
      toast.error('El precio mínimo debe ser mayor a 0');
      return;
    }
    
    if (formData.precio_hasta && Number(formData.precio_hasta) < Number(formData.precio_desde)) {
      toast.error('El precio máximo debe ser mayor al mínimo');
      return;
    }

    setLoading(true);

    try {
      // TODO: Enviar datos al backend con estructura correcta
      const serviceData = {
        categoria_id: formData.categoria_id,
        titulo: formData.titulo.trim(),
        descripcion: formData.descripcion.trim(),
        tipo_precio: formData.tipo_precio,
        precio_desde: Number(formData.precio_desde),
        precio_hasta: formData.precio_hasta ? Number(formData.precio_hasta) : null,
        moneda: formData.moneda,
        disponible: formData.disponible,
        urgente: formData.urgente,
        requiere_matricula: formData.requiere_matricula,
        matricula_numero: formData.matricula_numero || null,
        titulo_profesional: formData.titulo_profesional || null,
        documento_respaldo: formData.documento_respaldo,
        activo: true,
        destacado: false
      };

      // Procesar tags
      const tags = formData.tags
        .split(',')
        .map(tag => tag.trim())
        .filter(tag => tag.length > 0);

      console.log('Service data to send:', { serviceData, tags });
      
      // Simular envío
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      toast.success('¡Servicio publicado correctamente!');
      router.push('/profile');
    } catch (error) {
      toast.error('Error al publicar el servicio');
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const checked = 'checked' in e.target ? e.target.checked : false;
    
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFormData({
        ...formData,
        documento_respaldo: e.target.files[0]
      });
    }
  };

  const selectedCategory = categories.find(cat => cat.id === formData.categoria_id);

  return (
    <>
      <Head>
        <title>Nuevo Servicio - {APP_CONFIG.NAME}</title>
        <meta name="description" content="Publica un nuevo servicio en Serviplay" />
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-primary-blue-light via-white to-secondary-green/20">
        {/* Navigation */}
        <nav className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4">
            <div className="flex justify-between items-center h-16">
              <Link href="/" className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-primary-blue rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold">S</span>
                </div>
                <span className="font-display text-xl font-bold text-neutral-900">
                  {APP_CONFIG.NAME}
                </span>
              </Link>
              
              <Link
                href="/profile"
                className="flex items-center space-x-2 px-3 py-2 text-neutral-600 hover:text-primary-blue transition-colors"
              >
                <ArrowLeftIcon className="w-4 h-4" />
                <span>Volver al perfil</span>
              </Link>
            </div>
          </div>
        </nav>

        <div className="max-w-3xl mx-auto px-4 py-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            {/* Header */}
            <div className="text-center mb-8">
              <h1 className="font-display text-3xl font-bold text-neutral-900 mb-2">
                Publicar Nuevo Servicio
              </h1>
              <p className="text-neutral-600">
                Completa la información de tu servicio para conectar con {BRAND_TERMS.EXPLORADORES}
              </p>
            </div>

            {/* Form */}
            <div className="bg-white rounded-2xl shadow-xl p-8">
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Categoría */}
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-3">
                    Categoría del Servicio *
                  </label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {categories.map((category) => (
                      <button
                        key={category.id}
                        type="button"
                        onClick={() => setFormData({ ...formData, categoria_id: category.id })}
                        className={`p-4 border-2 rounded-xl transition-all text-center ${
                          formData.categoria_id === category.id
                            ? 'border-primary-blue bg-primary-blue/5'
                            : 'border-neutral-200 hover:border-neutral-300'
                        }`}
                      >
                        <div className="text-2xl mb-2">{category.icono}</div>
                        <div className="text-sm font-medium text-neutral-900">{category.nombre}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Título */}
                <div>
                  <label htmlFor="titulo" className="block text-sm font-medium text-neutral-700 mb-2">
                    Título del Servicio *
                  </label>
                  <input
                    type="text"
                    id="titulo"
                    name="titulo"
                    value={formData.titulo}
                    onChange={handleChange}
                    required
                    maxLength={200}
                    className="w-full px-4 py-3 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-blue focus:border-transparent transition-all"
                    placeholder="ej: Plomería de emergencia 24hs"
                  />
                  <p className="text-sm text-neutral-500 mt-1">
                    {formData.titulo.length}/200 caracteres
                  </p>
                </div>

                {/* Descripción */}
                <div>
                  <label htmlFor="descripcion" className="block text-sm font-medium text-neutral-700 mb-2">
                    Descripción Detallada *
                  </label>
                  <textarea
                    id="descripcion"
                    name="descripcion"
                    value={formData.descripcion}
                    onChange={handleChange}
                    required
                    rows={4}
                    className="w-full px-4 py-3 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-blue focus:border-transparent transition-all"
                    placeholder="Describe en detalle qué incluye tu servicio, qué materiales usas, tu experiencia, etc."
                  />
                </div>

                {/* Precios */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label htmlFor="tipo_precio" className="block text-sm font-medium text-neutral-700 mb-2">
                      Tipo de Precio *
                    </label>
                    <select
                      id="tipo_precio"
                      name="tipo_precio"
                      value={formData.tipo_precio}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-blue focus:border-transparent transition-all"
                    >
                      {tiposPrecio.map((tipo) => (
                        <option key={tipo.value} value={tipo.value}>
                          {tipo.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label htmlFor="precio_desde" className="block text-sm font-medium text-neutral-700 mb-2">
                      Precio Desde *
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-500">$</span>
                      <input
                        type="number"
                        id="precio_desde"
                        name="precio_desde"
                        value={formData.precio_desde}
                        onChange={handleChange}
                        required
                        min="0"
                        step="0.01"
                        className="w-full pl-8 pr-4 py-3 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-blue focus:border-transparent transition-all"
                        placeholder="1000"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label htmlFor="precio_hasta" className="block text-sm font-medium text-neutral-700 mb-2">
                      Precio Hasta (opcional)
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-500">$</span>
                      <input
                        type="number"
                        id="precio_hasta"
                        name="precio_hasta"
                        value={formData.precio_hasta}
                        onChange={handleChange}
                        min="0"
                        step="0.01"
                        className="w-full pl-8 pr-4 py-3 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-blue focus:border-transparent transition-all"
                        placeholder="5000"
                      />
                    </div>
                  </div>
                </div>

                {/* Tags */}
                <div>
                  <label htmlFor="tags" className="block text-sm font-medium text-neutral-700 mb-2">
                    Palabras Clave (Tags)
                  </label>
                  <input
                    type="text"
                    id="tags"
                    name="tags"
                    value={formData.tags}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-blue focus:border-transparent transition-all"
                    placeholder="emergencia, 24hs, urgente (separar por comas)"
                  />
                  <p className="text-sm text-neutral-500 mt-1">
                    Agrega palabras clave que ayuden a los {BRAND_TERMS.EXPLORADORES} a encontrar tu servicio
                  </p>
                </div>

                {/* Opciones adicionales */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-neutral-900">Opciones del Servicio</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <label className="flex items-center space-x-3 p-4 border border-neutral-200 rounded-lg hover:bg-neutral-50 cursor-pointer">
                      <input
                        type="checkbox"
                        name="urgente"
                        checked={formData.urgente}
                        onChange={handleChange}
                        className="rounded border-neutral-300 text-primary-blue focus:ring-primary-blue"
                      />
                      <div>
                        <div className="font-medium text-neutral-900">Servicio Urgente</div>
                        <div className="text-sm text-neutral-600">Atiendo emergencias y trabajos urgentes</div>
                      </div>
                    </label>

                    <label className="flex items-center space-x-3 p-4 border border-neutral-200 rounded-lg hover:bg-neutral-50 cursor-pointer">
                      <input
                        type="checkbox"
                        name="requiere_matricula"
                        checked={formData.requiere_matricula}
                        onChange={handleChange}
                        className="rounded border-neutral-300 text-primary-blue focus:ring-primary-blue"
                      />
                      <div>
                        <div className="font-medium text-neutral-900">Requiere Matrícula</div>
                        <div className="text-sm text-neutral-600">Trabajo con matrícula profesional</div>
                      </div>
                    </label>
                  </div>

                  {/* Campos adicionales para matrícula */}
                  {formData.requiere_matricula && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-neutral-50 rounded-lg">
                      <div>
                        <label htmlFor="matricula_numero" className="block text-sm font-medium text-neutral-700 mb-2">
                          Número de Matrícula
                        </label>
                        <input
                          type="text"
                          id="matricula_numero"
                          name="matricula_numero"
                          value={formData.matricula_numero}
                          onChange={handleChange}
                          className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-blue focus:border-transparent"
                          placeholder="MP-12345"
                        />
                      </div>
                      
                      <div>
                        <label htmlFor="titulo_profesional" className="block text-sm font-medium text-neutral-700 mb-2">
                          Título Profesional
                        </label>
                        <input
                          type="text"
                          id="titulo_profesional"
                          name="titulo_profesional"
                          value={formData.titulo_profesional}
                          onChange={handleChange}
                          className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-blue focus:border-transparent"
                          placeholder="Técnico en..."
                        />
                      </div>
                      
                      <div className="md:col-span-2">
                        <label htmlFor="documento_respaldo" className="block text-sm font-medium text-neutral-700 mb-2">
                          Documento de Respaldo (opcional)
                        </label>
                        <div className="flex items-center space-x-4">
                          <label htmlFor="documento_respaldo" className="cursor-pointer flex items-center space-x-2 px-4 py-2 border border-neutral-300 rounded-lg hover:bg-neutral-50 transition-colors">
                            <DocumentIcon className="w-5 h-5 text-neutral-400" />
                            <span className="text-sm">
                              {formData.documento_respaldo ? formData.documento_respaldo.name : 'Subir documento'}
                            </span>
                          </label>
                          <input
                            type="file"
                            id="documento_respaldo"
                            onChange={handleFileChange}
                            accept=".pdf,.jpg,.jpeg,.png"
                            className="hidden"
                          />
                        </div>
                        <p className="text-xs text-neutral-500 mt-1">
                          Formatos: PDF, JPG, PNG (máx. 10MB)
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Botones */}
                <div className="flex items-center justify-between pt-6 border-t">
                  <Link
                    href="/profile"
                    className="px-6 py-3 border border-neutral-300 text-neutral-700 rounded-lg hover:bg-neutral-50 transition-colors"
                  >
                    Cancelar
                  </Link>
                  
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    type="submit"
                    disabled={loading}
                    className="px-8 py-3 bg-secondary-green text-white rounded-lg font-semibold hover:bg-green-600 transition-colors disabled:opacity-50 flex items-center space-x-2"
                  >
                    {loading && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>}
                    <span>{loading ? 'Publicando...' : 'Publicar Servicio'}</span>
                  </motion.button>
                </div>
              </form>
            </div>
          </motion.div>
        </div>
      </div>
    </>
  );
}