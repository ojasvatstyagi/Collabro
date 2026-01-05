import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AuthLayout from '../components/ui/AuthLayout';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import { validateLogin } from '../utils/validation';
import { LoginCredentials } from '../services/api/auth';
import { AlertCircle, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Login: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [credentials, setCredentials] = useState<LoginCredentials>({
    username: '',
    password: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setCredentials((prev) => ({ ...prev, [name]: value }));

    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }

    if (formError) setFormError(null);
    if (formSuccess) setFormSuccess(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Trim spaces here - 2 lines
    const trimmedCredentials = {
      username: credentials.username.trim(),
      password: credentials.password.trim(),
    };

    const validation = validateLogin(trimmedCredentials);
    if (!validation.valid) {
      setErrors(validation.errors);
      return;
    }

    setFormError(null);
    setFormSuccess(null);
    setIsLoading(true);

    try {
      await login(trimmedCredentials);
      setFormSuccess('Login successful! Redirecting...');
      setTimeout(() => {
        navigate('/explore');
      }, 1500);
    } catch (error: any) {
      setFormError(error.message || 'Login failed. Please try again.');
      console.error('Login error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Sign in to your account"
      subtitle="Welcome back! Please enter your details"
    >
      {formError && (
        <div className="mb-4 flex items-center rounded-lg bg-brand-red/10 p-4 text-sm text-brand-red dark:bg-brand-red/5">
          <AlertCircle className="mr-2 h-4 w-4" />
          {formError}
        </div>
      )}

      {formSuccess && (
        <div className="mb-4 flex items-center rounded-lg bg-brand-yellow/10 p-4 text-sm text-brand-orange dark:bg-brand-yellow/5 dark:text-brand-yellow">
          <CheckCircle2 className="mr-2 h-4 w-4" />
          {formSuccess}
        </div>
      )}

      <form onSubmit={handleSubmit} className="mt-8 space-y-4">
        <Input
          label="Username"
          id="username"
          name="username"
          type="text"
          autoComplete="username"
          required
          value={credentials.username}
          onChange={handleChange}
          error={errors.username}
        />

        <Input
          label="Password"
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          value={credentials.password}
          onChange={handleChange}
          error={errors.password}
        />

        <Button
          type="submit"
          className="w-full"
          size="lg"
          isLoading={isLoading}
          loadingText="Signing in..."
        >
          Sign in
        </Button>

        <div className="flex justify-center">
          <a
            href="/forgot-password"
            className="text-sm font-medium text-brand-orange hover:text-brand-red dark:text-brand-yellow dark:hover:text-brand-orange"
          >
            Forgot your password?
          </a>
        </div>

        <div className="mt-4 text-center text-sm text-brand-dark/60 dark:text-brand-light/60">
          Don't have an account?{' '}
          <Link
            to="/register"
            className="font-medium text-brand-orange hover:text-brand-red dark:text-brand-yellow dark:hover:text-brand-orange"
          >
            Sign up
          </Link>
        </div>
      </form>
    </AuthLayout>
  );
};

export default Login;
