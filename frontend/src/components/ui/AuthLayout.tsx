import React, { ReactNode } from "react";
import ThemeToggle from "./ThemeToggle";
import { Shield } from "lucide-react";
import { useTheme } from "../../context/ThemeContext";
import { ParticleBackground } from "./ParticleBackground";

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
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Particle Background - Render it here */}
      <ParticleBackground />

      <div className="absolute top-4 right-4 z-10">
        <ThemeToggle />
      </div>

      <div
        className={`w-full max-w-md space-y-8 rounded-xl p-8 shadow-lg transition-all duration-300 z-10 ${
          theme === "dark"
            ? "bg-brand-dark-lighter shadow-black/30"
            : "bg-brand-light shadow-gray-300/20"
        }`}
      >
        <div className="text-center">
          <div className="mx-auto h-12 w-12 rounded-full bg-brand-orange/20 p-2">
            <Shield className="h-8 w-8 text-brand-orange" />
          </div>
          <h2
            className={`mt-6 text-3xl font-bold tracking-tight ${
              theme === "dark" ? "text-brand-light" : "text-brand-dark"
            }`}
          >
            {title}
          </h2>
          {subtitle && (
            <p
              className={`mt-2 text-sm ${
                theme === "dark" ? "text-brand-light/60" : "text-brand-dark/60"
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
