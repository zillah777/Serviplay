import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { 
  UserIcon, 
  CogIcon, 
  PencilIcon,
  MapPinIcon,
  PhoneIcon,
  EnvelopeIcon,
  StarIcon,
  EyeIcon,
  CalendarIcon,
  CheckBadgeIcon
} from '@heroicons/react/24/outline';
import { APP_CONFIG, BRAND_TERMS } from '@/utils/constants';
import { authService } from '@/services/api';
import toast from 'react-hot-toast';
import { LogoWithText } from '@/components/common/Logo';

// User type definition
interface User {
  id: string;
  email: string;
  tipo_usuario: 'explorador' | 'as';
  estado?: string;
  fecha_registro?: Date;
  email_verificado?: boolean;
  created_at?: string;
  nombre?: string;
  apellido?: string;
}

interface Profile {
  nombre?: string;
  apellido?: string;
  dni?: string;
  telefono?: string;
  direccion?: string;
  localidad?: string;
  provincia?: string;
  codigo_postal?: string;
  nivel_educativo?: string;
  referencias_laborales?: string;
  tiene_movilidad?: boolean;
  radio_notificaciones?: number;
  identidad_verificada?: boolean;
  foto_perfil?: string;
}

// Default stats
const defaultStats = {
  servicios_publicados: 0,
  total_trabajos: 0,
  rating_promedio: 0,
  total_views: 0,
  clientes_totales: 0
};

export default function Profile() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile>({});
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [editData, setEditData] = useState({
    nombre: '',
    apellido: '',
    telefono: '',
    direccion: '',
    localidad: '',
    provincia: '',
    codigo_postal: '',
    nivel_educativo: '',
    referencias_laborales: '',
    tiene_movilidad: false,
    radio_notificaciones: 10
  });

  useEffect(() => {
    const loadUserData = async () => {
      try {
        // Verificar autenticación
        if (!authService.isAuthenticated()) {
          router.push('/auth/login');
          return;
        }

        // Obtener datos del perfil desde el backend
        try {
          console.log('🔍 Loading profile data from backend...');
          const profileResponse = await authService.getProfile();
          console.log('📦 Profile response:', profileResponse);
          
          if (profileResponse.success && profileResponse.data) {
            const userData = profileResponse.data.user;
            const perfiles = profileResponse.data.perfiles;
            
            setUser(userData);
            
            // Determinar qué perfil usar (As o Explorador)
            const activeProfile = perfiles?.as || perfiles?.explorador || {};
            setProfile(activeProfile);
            
            // Inicializar datos de edición con los datos reales
            setEditData({
              nombre: activeProfile.nombre || userData.nombre || '',
              apellido: activeProfile.apellido || userData.apellido || '',
              telefono: activeProfile.telefono || '',
              direccion: activeProfile.direccion || '',
              localidad: activeProfile.localidad || '',
              provincia: activeProfile.provincia || '',
              codigo_postal: activeProfile.codigo_postal || '',
              nivel_educativo: activeProfile.nivel_educativo || '',
              referencias_laborales: activeProfile.referencias_laborales || '',
              tiene_movilidad: activeProfile.tiene_movilidad || false,
              radio_notificaciones: activeProfile.radio_notificaciones || 10
            });
            
            console.log('✅ Profile data loaded successfully:', { 
              userData, 
              activeProfile,
              profileTelefono: activeProfile.telefono,
              profileDireccion: activeProfile.direccion,
              userCreatedAt: userData.created_at
            });
          } else {
            console.warn('❌ Invalid profile response');
            throw new Error('No profile data received');
          }
        } catch (profileError) {
          console.warn('⚠️ Error fetching profile, using localStorage:', profileError);
          
          // Fallback al localStorage
          const currentUser = authService.getCurrentUser();
          if (currentUser) {
            setUser(currentUser);
            setProfile({});
            setEditData({
              nombre: currentUser.nombre || '',
              apellido: currentUser.apellido || '',
              telefono: '',
              direccion: '',
              localidad: '',
              provincia: '',
              codigo_postal: '',
              nivel_educativo: '',
              referencias_laborales: '',
              tiene_movilidad: false,
              radio_notificaciones: 10
            });
          } else {
            router.push('/auth/login');
            return;
          }
        }
      } catch (error) {
        console.error('Error loading profile:', error);
        router.push('/auth/login');
      } finally {
        setLoading(false);
      }
    };

    loadUserData();
  }, [router]);

  const handleSave = async () => {
    setLoading(true);
    try {
      // Llamar al backend para actualizar el perfil
      const token = localStorage.getItem('auth_token');
      if (!token) {
        throw new Error('No hay token de autenticación');
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'https://fixia-backend-production.up.railway.app'}/api/auth/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(editData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error al actualizar el perfil');
      }

      const result = await response.json();
      
      if (result.success) {
        // Actualizar solo las propiedades del usuario que corresponden
        if (user) {
          setUser({
            ...user,
            nombre: editData.nombre,
            apellido: editData.apellido
          });
          
          // Actualizar el perfil con el resto de datos
          setProfile({
            ...profile,
            ...editData
          });
          
          // Actualizar localStorage con datos frescos
          localStorage.setItem('user', JSON.stringify({
            ...user,
            nombre: editData.nombre,
            apellido: editData.apellido
          }));
        }
        
        setEditing(false);
        toast.success('Perfil actualizado correctamente');
      } else {
        throw new Error(result.message || 'Error al actualizar el perfil');
      }
    } catch (error: any) {
      console.error('Error updating profile:', error);
      toast.error(error.message || 'Error al actualizar el perfil');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setEditData({
      nombre: profile.nombre || user?.nombre || '',
      apellido: profile.apellido || user?.apellido || '',
      telefono: profile.telefono || '',
      direccion: profile.direccion || '',
      localidad: profile.localidad || '',
      provincia: profile.provincia || '',
      codigo_postal: profile.codigo_postal || '',
      nivel_educativo: profile.nivel_educativo || '',
      referencias_laborales: profile.referencias_laborales || '',
      tiene_movilidad: profile.tiene_movilidad || false,
      radio_notificaciones: profile.radio_notificaciones || 10
    });
    setEditing(false);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setEditData({
      ...editData,
      [e.target.name]: e.target.value
    });
  };

  if (loading && !editing) {
    return (
      <div className="min-h-screen no-overflow bg-gradient-to-br from-primary-blue-light via-white to-secondary-green/20 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary-blue border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-neutral-600">Cargando perfil...</p>
        </div>
      </div>
    );
  }

  const isAs = user?.tipo_usuario === 'as';
  const hasProfile = Object.keys(profile).length > 0;

  return (
    <>
      <Head>
        <title>Mi Perfil - {APP_CONFIG.NAME}</title>
        <meta name="description" content="Gestiona tu perfil en Fixia" />
      </Head>

      <div className="min-h-screen no-overflow bg-gradient-to-br from-primary-blue-light via-white to-secondary-green/20">
        {/* Navigation */}
        <nav className="bg-white shadow-sm border-b">
          <div className="container mx-auto">
            <div className="flex justify-between items-center h-16">
              <Link href="/" className="flex items-center">
                <LogoWithText size="sm" />
              </Link>
              
              <div className="flex items-center space-x-4">
                <Link
                  href="/dashboard"
                  className="px-3 py-2 text-neutral-600 hover:text-primary-blue transition-colors"
                >
                  Dashboard
                </Link>
                
                <Link
                  href="/settings"
                  className="p-2 text-neutral-600 hover:text-primary-blue transition-colors"
                >
                  <CogIcon className="w-5 h-5" />
                </Link>
              </div>
            </div>
          </div>
        </nav>

        <div className="container mx-auto py-8">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="bg-white rounded-2xl shadow-xl p-8 mb-8"
          >
            <div className="flex items-start justify-between mb-6">
              <div className="flex items-center space-x-6">
                <div className="relative">
                  <div className="w-24 h-24 bg-neutral-200 rounded-full flex items-center justify-center overflow-hidden">
                    {profile?.foto_perfil ? (
                      <img
                        src={profile.foto_perfil}
                        alt={`${profile?.nombre || user?.nombre} ${profile?.apellido || user?.apellido}`}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <UserIcon className="w-12 h-12 text-neutral-400" />
                    )}
                  </div>
                  
                  {/* Upload button */}
                  <label className="absolute -bottom-2 -right-2 w-8 h-8 bg-primary-blue rounded-full flex items-center justify-center cursor-pointer hover:bg-primary-blue-dark transition-colors">
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          try {
                            setLoading(true);
                            
                            // Validar archivo
                            if (file.size > 5 * 1024 * 1024) { // 5MB
                              toast.error('La imagen no puede ser mayor a 5MB');
                              return;
                            }
                            
                            if (!file.type.startsWith('image/')) {
                              toast.error('Solo se permiten archivos de imagen');
                              return;
                            }
                            
                            // Crear FormData
                            const formData = new FormData();
                            formData.append('file', file);
                            formData.append('context', 'profile_photo');
                            
                            // Subir archivo
                            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'https://fixia-production.up.railway.app'}/api/upload/single`, {
                              method: 'POST',
                              headers: {
                                'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
                              },
                              body: formData
                            });
                            
                            const result = await response.json();
                            
                            if (result.success) {
                              // Actualizar foto de perfil en el backend
                              // TODO: Implementar endpoint para actualizar foto de perfil
                              toast.success('Foto de perfil actualizada correctamente');
                              
                              // Actualizar estado local
                              setProfile(prev => ({
                                ...prev,
                                foto_perfil: result.data.file.file_url
                              }));
                            } else {
                              toast.error(result.error || 'Error al subir la imagen');
                            }
                          } catch (error) {
                            console.error('Error uploading profile photo:', error);
                            toast.error('Error al subir la imagen');
                          } finally {
                            setLoading(false);
                          }
                        }
                      }}
                    />
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                  </label>
                  
                  {profile?.identidad_verificada && (
                    <div className="absolute -top-1 -right-1 w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                      <CheckBadgeIcon className="w-5 h-5 text-white" />
                    </div>
                  )}
                </div>

                <div>
                  {editing ? (
                    <div className="space-y-3">
                      <div className="flex space-x-3">
                        <input
                          type="text"
                          name="nombre"
                          value={editData.nombre}
                          onChange={handleChange}
                          className="px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-blue focus:border-transparent"
                          placeholder="Nombre"
                        />
                        <input
                          type="text"
                          name="apellido"
                          value={editData.apellido}
                          onChange={handleChange}
                          className="px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-blue focus:border-transparent"
                          placeholder="Apellido"
                        />
                      </div>
                    </div>
                  ) : (
                    <>
                      <h1 className="font-display text-3xl font-bold text-neutral-900 mb-2">
                        {profile?.nombre || user?.nombre} {profile?.apellido || user?.apellido}
                        {profile?.identidad_verificada && (
                          <CheckBadgeIcon className="inline-block w-6 h-6 text-primary-blue ml-2" />
                        )}
                      </h1>
                      <div className="flex items-center space-x-4 text-neutral-600">
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                          isAs ? 'bg-secondary-green/10 text-secondary-green' : 'bg-primary-blue/10 text-primary-blue'
                        }`}>
                          {isAs ? BRAND_TERMS.AS : BRAND_TERMS.EXPLORADOR}
                        </span>
                        {user?.email_verificado === true && (
                          <div className="flex items-center space-x-1">
                            <CheckBadgeIcon className="w-4 h-4 text-green-500" />
                            <span className="text-sm text-green-600">Email verificado</span>
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </div>
              </div>

              <div className="flex items-center space-x-3">
                {editing ? (
                  <>
                    <button
                      onClick={handleCancel}
                      disabled={loading}
                      className="px-4 py-2 border border-neutral-300 text-neutral-700 rounded-lg hover:bg-neutral-50 transition-colors"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={handleSave}
                      disabled={loading}
                      className="px-4 py-2 bg-primary-blue text-white rounded-lg hover:bg-primary-blue-dark transition-colors disabled:opacity-50 flex items-center space-x-2"
                    >
                      {loading && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>}
                      <span>Guardar</span>
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => setEditing(true)}
                    className="flex items-center space-x-2 px-4 py-2 bg-primary-blue text-white rounded-lg hover:bg-primary-blue-dark transition-colors"
                  >
                    <PencilIcon className="w-4 h-4" />
                    <span>Editar</span>
                  </button>
                )}
              </div>
            </div>

            {/* Referencias Laborales */}
            <div className="mb-6">
              <h3 className="font-semibold text-neutral-900 mb-2">Referencias Laborales</h3>
              {editing ? (
                <textarea
                  name="referencias_laborales"
                  value={editData.referencias_laborales}
                  onChange={handleChange}
                  rows={3}
                  className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-blue focus:border-transparent"
                  placeholder="Describe tu experiencia y especialidades..."
                />
              ) : (
                <p className="text-neutral-700">
                  {profile?.referencias_laborales || 'No hay referencias disponibles'}
                </p>
              )}
            </div>

            {/* Contact Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <div className="flex items-center space-x-3 text-neutral-600">
                  <EnvelopeIcon className="w-5 h-5" />
                  <span>{user?.email}</span>
                </div>
                <div className="flex items-center space-x-3 text-neutral-600">
                  <PhoneIcon className="w-5 h-5" />
                  {editing ? (
                    <input
                      type="tel"
                      name="telefono"
                      value={editData.telefono}
                      onChange={handleChange}
                      className="px-2 py-1 border border-neutral-300 rounded focus:ring-2 focus:ring-primary-blue focus:border-transparent"
                    />
                  ) : (
                    <span>{profile?.telefono || 'No especificado'}</span>
                  )}
                </div>
                <div className="flex items-center space-x-3 text-neutral-600">
                  <MapPinIcon className="w-5 h-5" />
                  {editing ? (
                    <div className="flex space-x-2">
                      <input
                        type="text"
                        name="direccion"
                        value={editData.direccion}
                        onChange={handleChange}
                        className="px-2 py-1 border border-neutral-300 rounded focus:ring-2 focus:ring-primary-blue focus:border-transparent text-sm"
                        placeholder="Dirección"
                      />
                      <input
                        type="text"
                        name="localidad"
                        value={editData.localidad}
                        onChange={handleChange}
                        className="px-2 py-1 border border-neutral-300 rounded focus:ring-2 focus:ring-primary-blue focus:border-transparent text-sm w-24"
                        placeholder="Localidad"
                      />
                    </div>
                  ) : (
                    <span>
                      {profile?.direccion ? 
                        `${profile.direccion}${profile.localidad ? `, ${profile.localidad}` : ''}${profile.provincia ? `, ${profile.provincia}` : ''}` 
                        : 'No especificado'
                      }
                    </span>
                  )}
                </div>
              </div>
              
              <div className="space-y-3">
                <div className="flex items-center space-x-3 text-neutral-600">
                  <CalendarIcon className="w-5 h-5" />
                  <span>Miembro desde {user?.created_at ? new Date(user.created_at).toLocaleDateString('es-AR', { month: 'long', year: 'numeric' }) : 'fecha no disponible'}</span>
                </div>
                
                {/* Información para ambos tipos de usuario */}
                {hasProfile && (
                  <>
                    {/* Verificación de identidad - Disponible para todos */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3 text-neutral-600">
                        <CheckBadgeIcon className={`w-5 h-5 ${profile?.identidad_verificada ? 'text-green-500' : 'text-neutral-400'}`} />
                        <span>
                          {profile?.identidad_verificada ? 'Identidad verificada' : 'Identidad no verificada'}
                        </span>
                      </div>
                      {!profile?.identidad_verificada && (
                        <Link 
                          href="/verification"
                          className="text-sm text-primary-blue hover:text-primary-blue-dark"
                        >
                          Verificar
                        </Link>
                      )}
                    </div>

                    {/* Información específica para As */}
                    {isAs && (
                      <>
                        {profile?.nivel_educativo && (
                          <div className="flex items-center space-x-3 text-neutral-600">
                            <span className="text-sm">🎓</span>
                            <span className="capitalize">{profile?.nivel_educativo}</span>
                          </div>
                        )}
                        
                        {profile?.tiene_movilidad && (
                          <div className="flex items-center space-x-3 text-neutral-600">
                            <span className="text-sm">🚙</span>
                            <span>Movilidad propia</span>
                          </div>
                        )}
                        
                        {profile?.radio_notificaciones && (
                          <div className="flex items-center space-x-3 text-neutral-600">
                            <span className="text-sm">🔔</span>
                            <span>Radio de notificaciones: {profile?.radio_notificaciones}km</span>
                          </div>
                        )}
                      </>
                    )}

                    {/* Información específica para Exploradores */}
                    {!isAs && (
                      <>
                        <div className="flex items-center space-x-3 text-neutral-600">
                          <span className="text-sm">⭐</span>
                          <span>Calificación como cliente: 0/5 (sin calificaciones aún)</span>
                        </div>
                        
                        <div className="flex items-center space-x-3 text-neutral-600">
                          <span className="text-sm">📊</span>
                          <span>Servicios contratados: 0</span>
                        </div>
                        
                        <div className="flex items-center space-x-3 text-neutral-600">
                          <span className="text-sm">💼</span>
                          <span>Perfil de confianza: {profile?.identidad_verificada ? 'Alto' : 'Básico'}</span>
                        </div>
                      </>
                    )}
                  </>
                )}
              </div>
            </div>
          </motion.div>

          {/* Secciones específicas por tipo de usuario */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Historial y Estadísticas */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-white rounded-2xl shadow-xl p-8"
            >
              <h3 className="font-display text-xl font-bold text-neutral-900 mb-6">
                {isAs ? 'Mis Servicios' : 'Mi Actividad'}
              </h3>
              
              {isAs ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 border border-neutral-200 rounded-lg">
                    <div>
                      <p className="font-medium text-neutral-900">Servicios Activos</p>
                      <p className="text-sm text-neutral-500">0 servicios publicados</p>
                    </div>
                    <Link
                      href="/my-services"
                      className="text-primary-blue hover:text-primary-blue-dark"
                    >
                      Ver todos →
                    </Link>
                  </div>
                  
                  <div className="flex items-center justify-between p-4 border border-neutral-200 rounded-lg">
                    <div>
                      <p className="font-medium text-neutral-900">Trabajos Completados</p>
                      <p className="text-sm text-neutral-500">0 trabajos finalizados</p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 border border-neutral-200 rounded-lg">
                    <div>
                      <p className="font-medium text-neutral-900">Búsquedas Activas</p>
                      <p className="text-sm text-neutral-500">0 búsquedas en curso</p>
                    </div>
                    <Link
                      href="/my-searches"
                      className="text-primary-blue hover:text-primary-blue-dark"
                    >
                      Ver todas →
                    </Link>
                  </div>
                  
                  <div className="flex items-center justify-between p-4 border border-neutral-200 rounded-lg">
                    <div>
                      <p className="font-medium text-neutral-900">Servicios Contratados</p>
                      <p className="text-sm text-neutral-500">0 servicios finalizados</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between p-4 border border-neutral-200 rounded-lg">
                    <div>
                      <p className="font-medium text-neutral-900">Calificaciones Dadas</p>
                      <p className="text-sm text-neutral-500">0 reseñas escritas</p>
                    </div>
                    <Link
                      href="/reviews"
                      className="text-primary-blue hover:text-primary-blue-dark"
                    >
                      Ver todas →
                    </Link>
                  </div>
                </div>
              )}
            </motion.div>

            {/* Reputación y Confianza */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="bg-white rounded-2xl shadow-xl p-8"
            >
              <h3 className="font-display text-xl font-bold text-neutral-900 mb-6">
                Reputación y Confianza
              </h3>
              
              <div className="space-y-6">
                {/* Nivel de Confianza */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-neutral-900">Nivel de Confianza</span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      profile?.identidad_verificada 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {profile?.identidad_verificada ? 'Alto' : 'Básico'}
                    </span>
                  </div>
                  <div className="w-full bg-neutral-200 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full ${
                        profile?.identidad_verificada ? 'bg-green-500' : 'bg-yellow-500'
                      }`}
                      style={{ width: profile?.identidad_verificada ? '80%' : '40%' }}
                    ></div>
                  </div>
                  <p className="text-sm text-neutral-500 mt-1">
                    {profile?.identidad_verificada 
                      ? 'Perfil verificado y confiable' 
                      : 'Verifica tu identidad para aumentar la confianza'
                    }
                  </p>
                </div>

                {/* Calificación Promedio */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-neutral-900">
                      {isAs ? 'Calificación como As' : 'Calificación como Cliente'}
                    </span>
                    <div className="flex items-center space-x-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <StarIcon
                          key={star}
                          className="w-4 h-4 text-neutral-300"
                        />
                      ))}
                      <span className="text-sm text-neutral-500 ml-1">0/5</span>
                    </div>
                  </div>
                  <p className="text-sm text-neutral-500">
                    Sin calificaciones aún. {isAs ? 'Completa tu primer trabajo' : 'Contrata tu primer servicio'} para empezar a construir tu reputación.
                  </p>
                </div>

                {/* Acciones para mejorar perfil */}
                <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                  <h4 className="font-medium text-blue-900 mb-2">
                    Mejora tu perfil
                  </h4>
                  <div className="space-y-2 text-sm">
                    {!profile?.identidad_verificada && (
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                        <span className="text-blue-700">Verifica tu identidad</span>
                      </div>
                    )}
                    {!profile?.telefono && (
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                        <span className="text-blue-700">Agrega tu número de teléfono</span>
                      </div>
                    )}
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                      <span className="text-blue-700">
                        {isAs ? 'Completa tu primer trabajo' : 'Contrata tu primer servicio'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </>
  );
}