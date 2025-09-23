import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import AuthLayout from '../components/ui/AuthLayout';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import { validatePassword } from '../utils/validation';
import { verifyOtp, resetPassword } from '../services/auth';
import { AlertCircle, CheckCircle2, ArrowLeft } from 'lucide-react';

const ResetPassword: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const email = searchParams.get('email') || '';
  
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isVerified, setIsVerified] = useState(false);

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (otp.length !== 6 || !/^\d+$/.test(otp)) {
      setError('Please enter a valid 6-digit OTP');
      return;
    }
    
    setError(null);
    setIsLoading(true);
    
    try {
      const response = await verifyOtp(email, otp);
      
      if (response.success) {
        setIsVerified(true);
        setSuccess('OTP verified successfully. Please set your new password.');
      } else {
        setError(response.message || 'Invalid OTP. Please try again.');
      }
    } catch (error) {
      setError('An unexpected error occurred. Please try again.');
      console.error('OTP verification error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const passwordError = validatePassword(newPassword);
    if (passwordError) {
      setError(passwordError);
      return;
    }
    
    setError(null);
    setSuccess(null);
    setIsLoading(true);
    
    try {
      const response = await resetPassword(email, otp, newPassword);
      
      if (response.success) {
        setSuccess('Password reset successful! Redirecting to login...');
        setTimeout(() => {
          navigate('/login');
        }, 1500);
      } else {
        setError(response.message || 'Failed to reset password. Please try again.');
      }
    } catch (error) {
      setError('An unexpected error occurred. Please try again.');
      console.error('Password reset error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthLayout
      title={isVerified ? "Set new password" : "Enter verification code"}
      subtitle={
        isVerified
          ? "Please enter your new password"
          : "Enter the 6-digit code sent to your email"
      }
    >
      {error && (
        <div className="mb-4 flex items-center rounded-lg bg-brand-red/10 p-4 text-sm text-brand-red dark:bg-brand-red/5">
          <AlertCircle className="mr-2 h-4 w-4" />
          {error}
        </div>
      )}
      
      {success && (
        <div className="mb-4 flex items-center rounded-lg bg-brand-yellow/10 p-4 text-sm text-brand-orange dark:bg-brand-yellow/5 dark:text-brand-yellow">
          <CheckCircle2 className="mr-2 h-4 w-4" />
          {success}
        </div>
      )}
      
      <form onSubmit={isVerified ? handleResetPassword : handleVerifyOtp} className="mt-8 space-y-4">
        {!isVerified ? (
          <Input
            label="Verification code"
            id="otp"
            name="otp"
            type="text"
            maxLength={6}
            pattern="\d{6}"
            required
            value={otp}
            onChange={(e) => {
              setOtp(e.target.value.replace(/\D/g, '').slice(0, 6));
              if (error) setError(null);
              if (success) setSuccess(null);
            }}
          />
        ) : (
          <Input
            label="New password"
            id="newPassword"
            name="newPassword"
            type="password"
            autoComplete="new-password"
            required
            value={newPassword}
            onChange={(e) => {
              setNewPassword(e.target.value);
              if (error) setError(null);
              if (success) setSuccess(null);
            }}
          />
        )}
        
        <Button
          type="submit"
          className="w-full"
          size="lg"
          isLoading={isLoading}
          loadingText={isVerified ? "Resetting password..." : "Verifying code..."}
        >
          {isVerified ? "Reset password" : "Verify code"}
        </Button>
        
        <div className="mt-4 text-center">
          <Link
            to="/login"
            className="inline-flex items-center text-sm font-medium text-brand-orange hover:text-brand-red dark:text-brand-yellow dark:hover:text-brand-orange"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to login
          </Link>
        </div>
      </form>
    </AuthLayout>
  );
};

export default ResetPassword;