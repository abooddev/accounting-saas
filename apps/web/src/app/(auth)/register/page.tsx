'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { User, Mail, Lock, Building2, Link as LinkIcon, AlertCircle, ArrowRight } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  businessName: z.string().min(2, 'Business name must be at least 2 characters'),
  businessSlug: z
    .string()
    .min(2, 'URL must be at least 2 characters')
    .max(100, 'URL must be at most 100 characters')
    .regex(/^[a-z0-9-]+$/, 'URL can only contain lowercase letters, numbers, and hyphens'),
});

type RegisterFormData = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const { register: registerUser, isRegistering, registerError } = useAuth();
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      businessSlug: '',
    },
  });

  const businessName = watch('businessName');

  const generateSlug = () => {
    if (businessName) {
      const slug = businessName
        .toLowerCase()
        .trim()
        .replace(/[^\w\s-]/g, '')
        .replace(/[\s_-]+/g, '-')
        .replace(/^-+|-+$/g, '');
      setValue('businessSlug', slug);
    }
  };

  const onSubmit = (data: RegisterFormData) => {
    setError(null);
    registerUser(data, {
      onError: (err: Error) => {
        setError(err.message || 'Registration failed. Please try again.');
      },
    });
  };

  return (
    <div className="card-premium p-8 animate-slide-up">
      {/* Header */}
      <div className="text-center mb-8">
        <h2 className="text-3xl font-display font-bold text-foreground">
          Create your account
        </h2>
        <p className="mt-2 text-muted-foreground">
          Start managing your business finances today
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        {/* Error Alert */}
        {(error || registerError) && (
          <div className="flex items-center gap-3 p-4 rounded-lg bg-terracotta/10 border border-terracotta/20 text-terracotta animate-fade-in">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <p className="text-sm font-medium">
              {error || 'An error occurred. Please try again.'}
            </p>
          </div>
        )}

        {/* Name Field */}
        <div className="space-y-2">
          <Label htmlFor="name" className="text-sm font-medium text-foreground">
            Your name
          </Label>
          <div className="relative">
            <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              id="name"
              placeholder="John Doe"
              className="input-warm pl-12"
              {...register('name')}
            />
          </div>
          {errors.name && (
            <p className="text-sm text-terracotta flex items-center gap-1">
              <AlertCircle className="w-3 h-3" />
              {errors.name.message}
            </p>
          )}
        </div>

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
          <Label htmlFor="password" className="text-sm font-medium text-foreground">
            Password
          </Label>
          <div className="relative">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              id="password"
              type="password"
              placeholder="At least 8 characters"
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

        {/* Business Name Field */}
        <div className="space-y-2">
          <Label htmlFor="businessName" className="text-sm font-medium text-foreground">
            Business name
          </Label>
          <div className="relative">
            <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              id="businessName"
              placeholder="My Store"
              className="input-warm pl-12"
              {...register('businessName')}
              onBlur={generateSlug}
            />
          </div>
          {errors.businessName && (
            <p className="text-sm text-terracotta flex items-center gap-1">
              <AlertCircle className="w-3 h-3" />
              {errors.businessName.message}
            </p>
          )}
        </div>

        {/* Business URL Field */}
        <div className="space-y-2">
          <Label htmlFor="businessSlug" className="text-sm font-medium text-foreground">
            Business URL
          </Label>
          <div className="relative flex items-center">
            <LinkIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground z-10" />
            <span className="absolute left-12 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
              app.com/
            </span>
            <Input
              id="businessSlug"
              placeholder="my-store"
              className="input-warm pl-[7.5rem]"
              {...register('businessSlug')}
            />
          </div>
          {errors.businessSlug && (
            <p className="text-sm text-terracotta flex items-center gap-1">
              <AlertCircle className="w-3 h-3" />
              {errors.businessSlug.message}
            </p>
          )}
        </div>

        {/* Submit Button */}
        <Button
          type="submit"
          className="btn-cedar w-full group mt-6"
          disabled={isRegistering}
        >
          <span className="flex items-center justify-center gap-2">
            {isRegistering ? (
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
                Creating account...
              </>
            ) : (
              <>
                Create account
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
              Already have an account?
            </span>
          </div>
        </div>

        {/* Login Link */}
        <Link
          href="/login"
          className="block w-full text-center py-3 px-4 rounded-lg border-2 border-primary/20 text-primary font-semibold transition-all hover:bg-primary/5 hover:border-primary/40"
        >
          Sign in instead
        </Link>
      </form>
    </div>
  );
}
