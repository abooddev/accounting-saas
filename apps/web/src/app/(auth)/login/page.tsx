'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Mail, Lock, AlertCircle, ArrowRight } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email'),
  password: z.string().min(1, 'Password is required'),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const { login, isLoggingIn, loginError } = useAuth();
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = (data: LoginFormData) => {
    setError(null);
    login(data, {
      onError: (err: Error) => {
        setError(err.message || 'Invalid email or password');
      },
    });
  };

  return (
    <div className="card-premium p-8 animate-slide-up">
      {/* Header */}
      <div className="text-center mb-8">
        <h2 className="text-3xl font-display font-bold text-foreground">
          Welcome back
        </h2>
        <p className="mt-2 text-muted-foreground">
          Enter your credentials to access your account
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Error Alert */}
        {(error || loginError) && (
          <div className="flex items-center gap-3 p-4 rounded-lg bg-terracotta/10 border border-terracotta/20 text-terracotta animate-fade-in">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <p className="text-sm font-medium">
              {error || 'An error occurred. Please try again.'}
            </p>
          </div>
        )}

        {/* Email Field */}
        <div className="space-y-2">
          <Label htmlFor="email" className="text-sm font-medium text-foreground">
            Email address
          </Label>
          <div className="relative">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              id="email"
              type="email"
              placeholder="you@example.com"
              className="input-warm pl-12"
              {...register('email')}
            />
          </div>
          {errors.email && (
            <p className="text-sm text-terracotta flex items-center gap-1">
              <AlertCircle className="w-3 h-3" />
              {errors.email.message}
            </p>
          )}
        </div>

        {/* Password Field */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="password" className="text-sm font-medium text-foreground">
              Password
            </Label>
            <Link
              href="/forgot-password"
              className="text-sm text-accent hover:text-accent/80 transition-colors"
            >
              Forgot password?
            </Link>
          </div>
          <div className="relative">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              id="password"
              type="password"
              placeholder="Enter your password"
              className="input-warm pl-12"
              {...register('password')}
            />
          </div>
          {errors.password && (
            <p className="text-sm text-terracotta flex items-center gap-1">
              <AlertCircle className="w-3 h-3" />
              {errors.password.message}
            </p>
          )}
        </div>

        {/* Submit Button */}
        <Button
          type="submit"
          className="btn-cedar w-full group"
          disabled={isLoggingIn}
        >
          <span className="flex items-center justify-center gap-2">
            {isLoggingIn ? (
              <>
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                    fill="none"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                Signing in...
              </>
            ) : (
              <>
                Sign in
                <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
              </>
            )}
          </span>
        </Button>

        {/* Divider */}
        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-border" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-4 bg-card text-muted-foreground">
              New to Lebanese Accounting?
            </span>
          </div>
        </div>

        {/* Register Link */}
        <Link
          href="/register"
          className="block w-full text-center py-3 px-4 rounded-lg border-2 border-primary/20 text-primary font-semibold transition-all hover:bg-primary/5 hover:border-primary/40"
        >
          Create an account
        </Link>
      </form>
    </div>
  );
}
