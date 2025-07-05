import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { 
  ArrowLeftIcon,
  LockClosedIcon,
  EyeIcon,
  EyeSlashIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';
import { APP_CONFIG } from '@/utils/constants';
import { authService } from '@/services/api';
import { LogoWithText } from '@/components/common/Logo';
import toast from 'react-hot-toast';

export default function ResetPassword() {
  const router = useRouter();
  const { token } = router.query;
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [tokenValid, setTokenValid] = useState<boolean | null>(null);

  useEffect(() => {
    if (token) {
      setTokenValid(true);
    } else {
      setTokenValid(false);
    }
  }, [token]);

  const validatePassword = (password: string) => {
    const minLength = 8;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumber = /\d/.test(password);
    
    if (password.length < minLength) {
      return 'La contraseña debe tener al menos 8 caracteres';
    }
    if (!hasUpperCase) {
      return 'La contraseña debe tener al menos una mayúscula';
    }
    if (!hasLowerCase) {
      return 'La contraseña debe tener al menos una minúscula';
    }
    if (!hasNumber) {
      return 'La contraseña debe tener al menos un número';
    }
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!token || typeof token !== 'string') {
      toast.error('Token inválido');
      return;
    }

    if (!password.trim()) {
      toast.error('Ingresa tu nueva contraseña');
      return;
    }

    const passwordError = validatePassword(password);
    if (passwordError) {
      toast.error(passwordError);
      return;
    }

    if (password !== confirmPassword) {
      toast.error('Las contraseñas no coinciden');
      return;
    }

    setLoading(true);

    try {
      await authService.resetPassword(token, password);
      setSuccess(true);
    } catch (error) {
      console.error('Reset password error:', error);
      // El error ya se muestra automáticamente por el authService
    } finally {
      setLoading(false);
    }
  };

  const handleGoToLogin = () => {
    router.push('/auth/login');
  };

  if (tokenValid === false) {
    return (
      <>
        <Head>
          <title>Token Inválido - {APP_CONFIG.NAME}</title>
          <meta name="description" content="Token de recuperación inválido" />
        </Head>

        <div className="min-h-screen no-overflow bg-gradient-to-br from-primary-blue-light via-white to-secondary-green/20 flex items-center justify-center px-4">
          <div className="max-w-md w-full">
            <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <LockClosedIcon className="w-8 h-8 text-red-600" />
              </div>
              
              <h1 className="font-display text-2xl font-bold text-neutral-900 mb-2">
                Token Inválido
              </h1>
              
              <p className="text-neutral-600 mb-6">
                El enlace de recuperación es inválido o ha expirado. Por favor, solicita uno nuevo.
              </p>
              
              <div className="space-y-3">
                <Link
                  href="/auth/forgot-password"
                  className="w-full bg-primary-blue text-white py-3 rounded-lg font-semibold hover:bg-primary-blue-dark transition-colors text-center block"
                >
                  Solicitar nuevo enlace
                </Link>
                
                <Link
                  href="/auth/login"
                  className="w-full bg-neutral-100 text-neutral-700 py-3 rounded-lg font-medium hover:bg-neutral-200 transition-colors text-center block"
                >
                  Volver al login
                </Link>
              </div>
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Head>
        <title>Restablecer Contraseña - {APP_CONFIG.NAME}</title>
        <meta name="description" content="Crea una nueva contraseña para tu cuenta" />
      </Head>

      <div className="min-h-screen no-overflow bg-gradient-to-br from-primary-blue-light via-white to-secondary-green/20 flex items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="max-w-md w-full"
        >
          {/* Header */}
          <div className="text-center mb-8">
            <Link href="/" className="inline-flex items-center space-x-2 mb-6">
              <LogoWithText />
            </Link>
          </div>

          {!success ? (
            /* Formulario de nueva contraseña */
            <div className="bg-white rounded-2xl shadow-xl p-8">
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-primary-blue/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <LockClosedIcon className="w-8 h-8 text-primary-blue" />
                </div>
                <h1 className="font-display text-2xl font-bold text-neutral-900 mb-2">
                  Nueva Contraseña
                </h1>
                <p className="text-neutral-600">
                  Ingresa tu nueva contraseña segura
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-neutral-700 mb-2">
                    Nueva contraseña
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      id="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className="w-full px-4 py-3 pr-12 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-blue focus:border-transparent transition-all"
                      placeholder="Ingresa tu nueva contraseña"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-3 text-neutral-400 hover:text-neutral-600"
                    >
                      {showPassword ? (
                        <EyeSlashIcon className="w-5 h-5" />
                      ) : (
                        <EyeIcon className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                </div>

                <div>
                  <label htmlFor="confirmPassword" className="block text-sm font-medium text-neutral-700 mb-2">
                    Confirmar contraseña
                  </label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      id="confirmPassword"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      className="w-full px-4 py-3 pr-12 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-blue focus:border-transparent transition-all"
                      placeholder="Confirma tu nueva contraseña"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-3 text-neutral-400 hover:text-neutral-600"
                    >
                      {showConfirmPassword ? (
                        <EyeSlashIcon className="w-5 h-5" />
                      ) : (
                        <EyeIcon className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Requisitos de contraseña */}
                <div className="bg-neutral-50 rounded-lg p-4">
                  <p className="text-sm font-medium text-neutral-700 mb-2">
                    Requisitos de contraseña:
                  </p>
                  <ul className="text-xs text-neutral-600 space-y-1">
                    <li className={`flex items-center space-x-2 ${password.length >= 8 ? 'text-green-600' : ''}`}>
                      <span>•</span>
                      <span>Mínimo 8 caracteres</span>
                    </li>
                    <li className={`flex items-center space-x-2 ${/[A-Z]/.test(password) ? 'text-green-600' : ''}`}>
                      <span>•</span>
                      <span>Una letra mayúscula</span>
                    </li>
                    <li className={`flex items-center space-x-2 ${/[a-z]/.test(password) ? 'text-green-600' : ''}`}>
                      <span>•</span>
                      <span>Una letra minúscula</span>
                    </li>
                    <li className={`flex items-center space-x-2 ${/\d/.test(password) ? 'text-green-600' : ''}`}>
                      <span>•</span>
                      <span>Un número</span>
                    </li>
                  </ul>
                </div>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="submit"
                  disabled={loading}
                  className="w-full bg-primary-blue text-white py-3 rounded-lg font-semibold hover:bg-primary-blue-dark transition-colors disabled:opacity-50 flex items-center justify-center space-x-2"
                >
                  {loading && (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  )}
                  <span>{loading ? 'Guardando...' : 'Restablecer contraseña'}</span>
                </motion.button>
              </form>

              <div className="mt-6 text-center">
                <Link
                  href="/auth/login"
                  className="inline-flex items-center space-x-2 text-primary-blue hover:text-primary-blue-dark transition-colors"
                >
                  <ArrowLeftIcon className="w-4 h-4" />
                  <span>Volver al login</span>
                </Link>
              </div>
            </div>
          ) : (
            /* Confirmación de éxito */
            <div className="bg-white rounded-2xl shadow-xl p-8">
              <div className="text-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircleIcon className="w-8 h-8 text-green-600" />
                </div>
                
                <h1 className="font-display text-2xl font-bold text-neutral-900 mb-2">
                  ¡Contraseña Actualizada!
                </h1>
                
                <p className="text-neutral-600 mb-6">
                  Tu contraseña ha sido restablecida exitosamente. Ahora puedes iniciar sesión con tu nueva contraseña.
                </p>
                
                <div className="space-y-4">
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <p className="text-sm text-green-800">
                      <strong>🔒 Contraseña segura:</strong><br />
                      Tu nueva contraseña cumple con todos los requisitos de seguridad
                    </p>
                  </div>
                  
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <p className="text-sm text-blue-800">
                      <strong>💡 Próximos pasos:</strong><br />
                      Inicia sesión con tu nueva contraseña y actualiza tus datos si es necesario
                    </p>
                  </div>
                </div>

                <button
                  onClick={handleGoToLogin}
                  className="w-full bg-primary-blue text-white py-3 rounded-lg font-semibold hover:bg-primary-blue-dark transition-colors mt-6"
                >
                  Ir al login
                </button>
              </div>
            </div>
          )}

          {/* Footer info */}
          <div className="text-center mt-8">
            <p className="text-sm text-neutral-500">
              ¿Necesitas ayuda? Contacta a{' '}
              <Link href="/contact" className="text-primary-blue hover:underline">
                soporte técnico
              </Link>
            </p>
          </div>
        </motion.div>
      </div>
    </>
  );
}