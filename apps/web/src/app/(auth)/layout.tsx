import { TreePine } from 'lucide-react';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex">
      {/* Left Panel - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-cedar relative overflow-hidden">
        {/* Decorative Pattern */}
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}
        />

        <div className="relative z-10 flex flex-col items-center justify-center w-full p-12 text-white">
          {/* Logo */}
          <div className="mb-8">
            <div className="w-20 h-20 bg-gold rounded-2xl flex items-center justify-center shadow-gold animate-fade-in">
              <TreePine className="w-12 h-12 text-cedar" />
            </div>
          </div>

          {/* Brand Name */}
          <h1 className="text-4xl font-display font-bold mb-4 text-center animate-slide-up">
            Lebanese Accounting
          </h1>

          <p className="text-lg text-white/80 text-center max-w-sm animate-slide-up stagger-1">
            Premium accounting software designed for Lebanese businesses
          </p>

          {/* Features */}
          <div className="mt-12 space-y-4 animate-slide-up stagger-2">
            <div className="flex items-center gap-3 text-white/90">
              <div className="w-2 h-2 bg-gold rounded-full" />
              <span>Multi-currency support (USD & LBP)</span>
            </div>
            <div className="flex items-center gap-3 text-white/90">
              <div className="w-2 h-2 bg-gold rounded-full" />
              <span>VAT-compliant invoicing</span>
            </div>
            <div className="flex items-center gap-3 text-white/90">
              <div className="w-2 h-2 bg-gold rounded-full" />
              <span>Real-time inventory tracking</span>
            </div>
            <div className="flex items-center gap-3 text-white/90">
              <div className="w-2 h-2 bg-gold rounded-full" />
              <span>Point of Sale integration</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right Panel - Auth Form */}
      <div className="flex-1 flex items-center justify-center bg-cream py-12 px-4 sm:px-6 lg:px-8">
        <div className="w-full max-w-md space-y-8">
          {/* Mobile Logo */}
          <div className="lg:hidden flex flex-col items-center mb-8">
            <div className="w-16 h-16 bg-cedar rounded-xl flex items-center justify-center shadow-primary">
              <TreePine className="w-10 h-10 text-gold" />
            </div>
            <h1 className="mt-4 text-2xl font-display font-bold text-cedar">
              Lebanese Accounting
            </h1>
          </div>

          {children}
        </div>
      </div>
    </div>
  );
}
