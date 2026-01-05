import React, { ReactNode } from 'react';
import ThemeToggle from './ThemeToggle';
import { Shield } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { ParticleBackground } from './ParticleBackground';

interface AuthLayoutProps {
  children: ReactNode;
  title: string;
  subtitle?: string;
}

const AuthLayout: React.FC<AuthLayoutProps> = ({
  children,
  title,
  subtitle,
}) => {
  const { theme } = useTheme();

  return (
    <div
      className={`min-h-screen flex flex-col items-center justify-center px-4 py-12 sm:px-6 lg:px-8 relative overflow-hidden transition-colors duration-300 ${
        theme === 'dark' ? 'bg-[#050505]' : 'bg-[#f0f2f5]'
      }`}
    >
      {/* Particle Background - Render it here */}
      <ParticleBackground />

      <div className="absolute top-4 right-4 z-10">
        <ThemeToggle />
      </div>

      <div
        className={`w-full max-w-md space-y-8 rounded-xl p-8 shadow-xl transition-all duration-300 z-10 border ${
          theme === 'dark'
            ? 'bg-[#111111] border-white/5 shadow-black/50'
            : 'bg-[#fafafa] border-gray-100 shadow-gray-200/50'
        }`}
      >
        <div className="text-center">
          <div
            className={`mx-auto h-12 w-12 rounded-full p-2 flex items-center justify-center ${
              theme === 'dark' ? 'bg-brand-orange/10' : 'bg-brand-orange/10'
            }`}
          >
            <Shield className="h-8 w-8 text-brand-orange" />
          </div>
          <h2
            className={`mt-6 text-3xl font-bold tracking-tight ${
              theme === 'dark' ? 'text-white' : 'text-gray-900'
            }`}
          >
            {title}
          </h2>
          {subtitle && (
            <p
              className={`mt-2 text-sm ${
                theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
              }`}
            >
              {subtitle}
            </p>
          )}
        </div>

        {children}
      </div>
    </div>
  );
};

export default AuthLayout;
