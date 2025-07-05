import { APP_CONFIG } from '@/utils/constants';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
  className?: string;
}

export function Logo({ size = 'md', showText = true, className = '' }: LogoProps) {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16'
  };

  const logoTextSizeClasses = {
    sm: 'text-sm',
    md: 'text-xl',
    lg: 'text-2xl'
  };

  const textSizeClasses = {
    sm: 'text-lg',
    md: 'text-2xl',
    lg: 'text-3xl'
  };

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      {/* Logo Icon */}
      <div className={`${sizeClasses[size]} bg-gradient-to-r from-primary-blue to-secondary-green rounded-2xl flex items-center justify-center shadow-lg relative overflow-hidden`}>
        {/* Logo con la F de Fixia */}
        <div className="relative z-10">
          <span className={`text-white font-bold ${logoTextSizeClasses[size]}`}>F</span>
        </div>
      </div>
      
      {/* Text */}
      {showText && (
        <span className={`font-display ${textSizeClasses[size]} font-bold text-neutral-900`}>
          {APP_CONFIG.NAME}
        </span>
      )}
    </div>
  );
}

export function LogoIcon({ size = 'md', className = '' }: Pick<LogoProps, 'size' | 'className'>) {
  return <Logo size={size} showText={false} className={className} />;
}

export function LogoWithText({ size = 'md', className = '' }: Pick<LogoProps, 'size' | 'className'>) {
  return <Logo size={size} showText={true} className={className} />;
}