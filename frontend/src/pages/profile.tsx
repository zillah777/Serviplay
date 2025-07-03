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

// User type definition
interface User {
  id: string;
  email: string;
  tipo_usuario: 'explorador' | 'as';
  estado: string;
  fecha_registro?: Date;
  email_verificado: boolean;
  created_at: string;
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
            
            console.log('✅ Profile data loaded successfully:', { userData, activeProfile });
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
      // TODO: Actualizar datos en backend
      await new Promise(resolve => setTimeout(resolve, 1000));
      setUser({ ...user, ...editData });
      setEditing(false);
      toast.success('Perfil actualizado correctamente');
    } catch (error) {
      toast.error('Error al actualizar el perfil');
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
      <div className="min-h-screen bg-gradient-to-br from-primary-blue-light via-white to-secondary-green/20 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary-blue border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-neutral-600">Cargando perfil...</p>
        </div>
      </div>
    );
  }

  const isAs = user.tipo_usuario === 'as';
  const hasProfile = Object.keys(profile).length > 0;

  return (
    <>
      <Head>
        <title>Mi Perfil - {APP_CONFIG.NAME}</title>
        <meta name="description" content="Gestiona tu perfil en Fixia" />
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-primary-blue-light via-white to-secondary-green/20">
        {/* Navigation */}
        <nav className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4">
            <div className="flex justify-between items-center h-16">
              <Link href="/" className="flex items-center space-x-2">
                <div className="w-10 h-10 bg-gradient-to-r from-primary-blue to-secondary-green rounded-2xl shadow-lg flex items-center justify-center">
                  <span className="text-white font-bold text-lg">S</span>
                </div>
                <span className="font-display text-xl font-bold text-neutral-900">
                  {APP_CONFIG.NAME}
                </span>
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

        <div className="max-w-4xl mx-auto px-4 py-8">
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
                  {profile?.identidad_verificada && (
                    <div className="absolute -bottom-1 -right-1 w-8 h-8 bg-primary-blue rounded-full flex items-center justify-center">
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
                        {user.email_verificado && (
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
                  <span>{user.email}</span>
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
                    <span>{profile?.telefono}</span>
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
                    <span>{profile?.direccion}, {profile?.localidad}, {profile?.provincia}</span>
                  )}
                </div>
              </div>
              
              <div className="space-y-3">
                <div className="flex items-center space-x-3 text-neutral-600">
                  <CalendarIcon className="w-5 h-5" />
                  <span>Miembro desde {new Date(user.created_at).toLocaleDateString('es-AR', { month: 'long', year: 'numeric' })}</span>
                </div>
                
                {isAs && hasProfile && (
                  <>
                    {profile?.identidad_verificada && (
                      <div className="flex items-center space-x-3 text-neutral-600">
                        <CheckBadgeIcon className="w-5 h-5 text-green-500" />
                        <span>Identidad verificada</span>
                      </div>
                    )}
                    
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
              </div>
            </div>
          </motion.div>

          {/* Upcoming features */}
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-neutral-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">🚧</span>
              </div>
              <h3 className="font-semibold text-neutral-900 mb-2">
                Funcionalidades en desarrollo
              </h3>
              <p className="text-neutral-600 mb-4">
                Próximamente podrás gestionar servicios, ver estadísticas y más desde tu perfil.
              </p>
              <Link
                href="/dashboard"
                className="inline-block px-6 py-3 bg-primary-blue text-white rounded-lg hover:bg-primary-blue-dark transition-colors"
              >
                Ir al Dashboard
              </Link>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}