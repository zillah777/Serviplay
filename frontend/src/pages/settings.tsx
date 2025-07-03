import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { 
  UserIcon, 
  CogIcon, 
  BellIcon,
  EyeIcon,
  ShieldCheckIcon,
  CreditCardIcon,
  QuestionMarkCircleIcon,
  ArrowRightOnRectangleIcon,
  TrashIcon,
  KeyIcon,
  DevicePhoneMobileIcon,
  EnvelopeIcon
} from '@heroicons/react/24/outline';
import { APP_CONFIG } from '@/utils/constants';
import { authService } from '@/services/api';
import toast from 'react-hot-toast';

// Default user settings
const defaultSettings = {
  notificaciones: {
    nuevos_mensajes: true,
    nuevas_solicitudes: true,
    recordatorios: false,
    marketing: false,
    push_notifications: true,
    email_notifications: true
  },
  privacidad: {
    perfil_publico: true,
    mostrar_telefono: true,
    mostrar_email: false,
    permitir_contacto: true
  },
  seguridad: {
    autenticacion_dos_factores: false,
    sesiones_activas: 1
  }
};

interface User {
  id: string;
  email: string;
  tipo_usuario: 'explorador' | 'as';
  nombre?: string;
  apellido?: string;
  email_verificado?: boolean;
  created_at?: string;
}

export default function Settings() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [settings, setSettings] = useState(defaultSettings);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('cuenta');
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const tabs = [
    { id: 'cuenta', label: 'Cuenta', icon: UserIcon },
    { id: 'notificaciones', label: 'Notificaciones', icon: BellIcon },
    { id: 'privacidad', label: 'Privacidad', icon: EyeIcon },
    { id: 'seguridad', label: 'Seguridad', icon: ShieldCheckIcon },
    { id: 'suscripcion', label: 'Suscripción', icon: CreditCardIcon },
    { id: 'ayuda', label: 'Ayuda', icon: QuestionMarkCircleIcon }
  ];

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      if (!authService.isAuthenticated()) {
        router.push('/auth/login');
        return;
      }

      const currentUser = authService.getCurrentUser();
      setUser(currentUser);

      // TODO: Cargar configuraciones del usuario desde el backend
      console.log('Loading user settings...');
    } catch (error) {
      console.error('Error loading user data:', error);
      router.push('/auth/login');
    }
  };

  const handleToggleSetting = async (section: string, key: string) => {
    setSettings(prev => {
      const currentSection = (prev as any)[section];
      const newSettings = {
        ...prev,
        [section]: {
          ...currentSection,
          [key]: !currentSection[key]
        }
      };
      
      // TODO: Guardar cambio en backend inmediatamente
      saveSettingToBackend(section, key, !currentSection[key]);
      
      return newSettings;
    });
    
    toast.success('Configuración actualizada');
  };

  const saveSettingToBackend = async (section: string, key: string, value: boolean) => {
    try {
      // TODO: Implementar llamada al backend
      console.log(`Saving setting: ${section}.${key} = ${value}`);
    } catch (error) {
      console.error('Error saving setting:', error);
      toast.error('Error al guardar la configuración');
    }
  };

  const handleChangePassword = async () => {
    if (!passwordData.currentPassword || !passwordData.newPassword) {
      toast.error('Completa todos los campos');
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('Las contraseñas no coinciden');
      return;
    }

    if (passwordData.newPassword.length < 8) {
      toast.error('La nueva contraseña debe tener al menos 8 caracteres');
      return;
    }

    setLoading(true);
    try {
      // TODO: Implementar cambio de contraseña en backend
      await new Promise(resolve => setTimeout(resolve, 1000));
      toast.success('Contraseña actualizada correctamente');
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
    } catch (error) {
      toast.error('Error al cambiar la contraseña');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await authService.logout();
      router.push('/');
    } catch (error) {
      console.error('Error during logout:', error);
      toast.error('Error al cerrar sesión');
    }
  };

  const handleDeleteAccount = () => {
    const confirmed = window.confirm(
      '¿Estás seguro de que querés eliminar tu cuenta? Esta acción no se puede deshacer.'
    );
    
    if (confirmed) {
      const doubleConfirm = window.confirm(
        'Esta acción eliminará permanentemente todos tus datos, servicios y búsquedas. ¿Estás completamente seguro?'
      );
      
      if (doubleConfirm) {
        deleteAccount();
      }
    }
  };

  const deleteAccount = async () => {
    setLoading(true);
    try {
      // TODO: Implementar eliminación de cuenta en backend
      await new Promise(resolve => setTimeout(resolve, 2000));
      toast.success('Cuenta eliminada correctamente');
      router.push('/');
    } catch (error) {
      toast.error('Error al eliminar la cuenta');
    } finally {
      setLoading(false);
    }
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'cuenta':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-neutral-900 mb-4">
                Información de la cuenta
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">
                    Email
                  </label>
                  <div className="flex items-center space-x-3">
                    <span className="text-neutral-900">{user?.email}</span>
                    {user?.email_verificado && (
                      <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                        Verificado
                      </span>
                    )}
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">
                    Tipo de cuenta
                  </label>
                  <span className="text-neutral-900 capitalize">
                    {user?.tipo_usuario === 'as' ? 'As' : 'Explorador'}
                  </span>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">
                    Miembro desde
                  </label>
                  <span className="text-neutral-900">
                    {user?.created_at 
                      ? new Date(user.created_at).toLocaleDateString('es-AR', { 
                          year: 'numeric', 
                          month: 'long', 
                          day: 'numeric' 
                        })
                      : 'No disponible'
                    }
                  </span>
                </div>
              </div>
            </div>

            <div className="border-t pt-6">
              <h3 className="text-lg font-semibold text-neutral-900 mb-4">
                Acciones de cuenta
              </h3>
              <div className="space-y-3">
                <Link
                  href="/profile"
                  className="flex items-center space-x-3 p-3 border border-neutral-200 rounded-lg hover:border-primary-blue transition-colors"
                >
                  <UserIcon className="w-5 h-5 text-neutral-500" />
                  <span>Editar perfil</span>
                </Link>
                
                <button
                  onClick={handleLogout}
                  className="flex items-center space-x-3 p-3 border border-neutral-200 rounded-lg hover:border-orange-500 transition-colors w-full text-left"
                >
                  <ArrowRightOnRectangleIcon className="w-5 h-5 text-orange-500" />
                  <span>Cerrar sesión</span>
                </button>
                
                <button
                  onClick={handleDeleteAccount}
                  disabled={loading}
                  className="flex items-center space-x-3 p-3 border border-red-200 rounded-lg hover:border-red-500 transition-colors w-full text-left text-red-600 disabled:opacity-50"
                >
                  <TrashIcon className="w-5 h-5" />
                  <span>Eliminar cuenta</span>
                </button>
              </div>
            </div>
          </div>
        );

      case 'notificaciones':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-neutral-900 mb-4">
                Notificaciones push
              </h3>
              <div className="space-y-4">
                {Object.entries(settings.notificaciones).map(([key, value]) => (
                  <div key={key} className="flex items-center justify-between">
                    <div>
                      <label className="font-medium text-neutral-900">
                        {key === 'nuevos_mensajes' && 'Nuevos mensajes'}
                        {key === 'nuevas_solicitudes' && 'Nuevas solicitudes'}
                        {key === 'recordatorios' && 'Recordatorios'}
                        {key === 'marketing' && 'Noticias y promociones'}
                        {key === 'push_notifications' && 'Notificaciones push'}
                        {key === 'email_notifications' && 'Notificaciones por email'}
                      </label>
                      <p className="text-sm text-neutral-500">
                        {key === 'nuevos_mensajes' && 'Recibir notificaciones de nuevos mensajes'}
                        {key === 'nuevas_solicitudes' && 'Notificaciones de nuevas solicitudes de trabajo'}
                        {key === 'recordatorios' && 'Recordatorios de citas y trabajos pendientes'}
                        {key === 'marketing' && 'Recibir información sobre nuevas funciones y ofertas'}
                        {key === 'push_notifications' && 'Recibir notificaciones en el dispositivo'}
                        {key === 'email_notifications' && 'Recibir notificaciones por correo electrónico'}
                      </p>
                    </div>
                    <button
                      onClick={() => handleToggleSetting('notificaciones', key)}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        value ? 'bg-primary-blue' : 'bg-neutral-200'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 rounded-full bg-white transition-transform ${
                          value ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );

      case 'privacidad':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-neutral-900 mb-4">
                Configuración de privacidad
              </h3>
              <div className="space-y-4">
                {Object.entries(settings.privacidad).map(([key, value]) => (
                  <div key={key} className="flex items-center justify-between">
                    <div>
                      <label className="font-medium text-neutral-900">
                        {key === 'perfil_publico' && 'Perfil público'}
                        {key === 'mostrar_telefono' && 'Mostrar teléfono'}
                        {key === 'mostrar_email' && 'Mostrar email'}
                        {key === 'permitir_contacto' && 'Permitir contacto directo'}
                      </label>
                      <p className="text-sm text-neutral-500">
                        {key === 'perfil_publico' && 'Tu perfil será visible para otros usuarios'}
                        {key === 'mostrar_telefono' && 'Otros usuarios podrán ver tu número de teléfono'}
                        {key === 'mostrar_email' && 'Otros usuarios podrán ver tu email'}
                        {key === 'permitir_contacto' && 'Otros usuarios podrán contactarte directamente'}
                      </p>
                    </div>
                    <button
                      onClick={() => handleToggleSetting('privacidad', key)}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        value ? 'bg-primary-blue' : 'bg-neutral-200'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 rounded-full bg-white transition-transform ${
                          value ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );

      case 'seguridad':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-neutral-900 mb-4">
                Cambiar contraseña
              </h3>
              <div className="space-y-4 max-w-md">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">
                    Contraseña actual
                  </label>
                  <input
                    type="password"
                    value={passwordData.currentPassword}
                    onChange={(e) => setPasswordData(prev => ({ ...prev, currentPassword: e.target.value }))}
                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-blue focus:border-transparent"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">
                    Nueva contraseña
                  </label>
                  <input
                    type="password"
                    value={passwordData.newPassword}
                    onChange={(e) => setPasswordData(prev => ({ ...prev, newPassword: e.target.value }))}
                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-blue focus:border-transparent"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">
                    Confirmar nueva contraseña
                  </label>
                  <input
                    type="password"
                    value={passwordData.confirmPassword}
                    onChange={(e) => setPasswordData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-blue focus:border-transparent"
                  />
                </div>
                
                <button
                  onClick={handleChangePassword}
                  disabled={loading}
                  className="px-4 py-2 bg-primary-blue text-white rounded-lg hover:bg-primary-blue-dark transition-colors disabled:opacity-50"
                >
                  {loading ? 'Cambiando...' : 'Cambiar contraseña'}
                </button>
              </div>
            </div>

            <div className="border-t pt-6">
              <h3 className="text-lg font-semibold text-neutral-900 mb-4">
                Configuración de seguridad
              </h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="font-medium text-neutral-900">
                      Autenticación de dos factores
                    </label>
                    <p className="text-sm text-neutral-500">
                      Agregar una capa extra de seguridad a tu cuenta
                    </p>
                  </div>
                  <button
                    onClick={() => handleToggleSetting('seguridad', 'autenticacion_dos_factores')}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      settings.seguridad.autenticacion_dos_factores ? 'bg-primary-blue' : 'bg-neutral-200'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 rounded-full bg-white transition-transform ${
                        settings.seguridad.autenticacion_dos_factores ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
                
                <div className="p-4 border border-neutral-200 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-medium text-neutral-900">
                        Sesiones activas
                      </span>
                      <p className="text-sm text-neutral-500">
                        {settings.seguridad.sesiones_activas} sesión activa
                      </p>
                    </div>
                    <button className="text-primary-blue hover:text-primary-blue-dark text-sm">
                      Ver todas
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case 'suscripcion':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-neutral-900 mb-4">
                Plan actual
              </h3>
              <div className="p-6 border border-neutral-200 rounded-lg">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h4 className="font-semibold text-neutral-900">Plan Básico</h4>
                    <p className="text-neutral-500">Gratis para siempre</p>
                  </div>
                  <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm">
                    Activo
                  </span>
                </div>
                
                <ul className="space-y-2 text-sm text-neutral-600 mb-4">
                  <li>• Hasta 3 servicios publicados</li>
                  <li>• Búsquedas ilimitadas</li>
                  <li>• Soporte por email</li>
                </ul>
                
                <Link
                  href="/pricing"
                  className="inline-block px-4 py-2 bg-primary-blue text-white rounded-lg hover:bg-primary-blue-dark transition-colors"
                >
                  Ver planes premium
                </Link>
              </div>
            </div>
          </div>
        );

      case 'ayuda':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-neutral-900 mb-4">
                Centro de ayuda
              </h3>
              <div className="space-y-3">
                <Link
                  href="/help"
                  className="flex items-center space-x-3 p-3 border border-neutral-200 rounded-lg hover:border-primary-blue transition-colors"
                >
                  <QuestionMarkCircleIcon className="w-5 h-5 text-neutral-500" />
                  <span>Preguntas frecuentes</span>
                </Link>
                
                <Link
                  href="/contact"
                  className="flex items-center space-x-3 p-3 border border-neutral-200 rounded-lg hover:border-primary-blue transition-colors"
                >
                  <EnvelopeIcon className="w-5 h-5 text-neutral-500" />
                  <span>Contactar soporte</span>
                </Link>
                
                <Link
                  href="/terms"
                  className="flex items-center space-x-3 p-3 border border-neutral-200 rounded-lg hover:border-primary-blue transition-colors"
                >
                  <span className="w-5 h-5 flex items-center justify-center text-neutral-500">📄</span>
                  <span>Términos de servicio</span>
                </Link>
                
                <Link
                  href="/privacy"
                  className="flex items-center space-x-3 p-3 border border-neutral-200 rounded-lg hover:border-primary-blue transition-colors"
                >
                  <ShieldCheckIcon className="w-5 h-5 text-neutral-500" />
                  <span>Política de privacidad</span>
                </Link>
              </div>
            </div>

            <div className="border-t pt-6">
              <h3 className="text-lg font-semibold text-neutral-900 mb-4">
                Información de la app
              </h3>
              <div className="space-y-2 text-sm text-neutral-600">
                <p>Versión de la app: 1.0.0</p>
                <p>Última actualización: Julio 2024</p>
                <p>Desarrollado por el equipo de {APP_CONFIG.NAME}</p>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-blue-light via-white to-secondary-green/20 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary-blue border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-neutral-600">Cargando configuración...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Configuración - {APP_CONFIG.NAME}</title>
        <meta name="description" content="Gestiona tu cuenta y configuración" />
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-primary-blue-light via-white to-secondary-green/20">
        {/* Navigation */}
        <nav className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4">
            <div className="flex justify-between items-center h-16">
              <Link href="/" className="flex items-center space-x-2">
                <div className="w-10 h-10 bg-gradient-to-r from-primary-blue to-secondary-green rounded-2xl flex items-center justify-center shadow-lg">
                  <span className="text-white font-bold text-lg">F</span>
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
                  href="/profile"
                  className="p-2 text-neutral-600 hover:text-primary-blue transition-colors"
                >
                  <UserIcon className="w-5 h-5" />
                </Link>
              </div>
            </div>
          </div>
        </nav>

        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="flex gap-8">
            {/* Sidebar */}
            <div className="w-64 flex-shrink-0">
              <div className="bg-white rounded-2xl shadow-lg p-6">
                <h2 className="font-display text-xl font-bold text-neutral-900 mb-6">
                  Configuración
                </h2>
                
                <nav className="space-y-2">
                  {tabs.map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left transition-colors ${
                        activeTab === tab.id
                          ? 'bg-primary-blue text-white'
                          : 'text-neutral-600 hover:bg-neutral-100'
                      }`}
                    >
                      <tab.icon className="w-5 h-5" />
                      <span>{tab.label}</span>
                    </button>
                  ))}
                </nav>
              </div>
            </div>

            {/* Main Content */}
            <div className="flex-1">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="bg-white rounded-2xl shadow-lg p-8"
              >
                {renderTabContent()}
              </motion.div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}