'use client';

import { useState, useEffect } from 'react';
import {
  ShoppingCart,
  LayoutDashboard,
  Wallet,
  FileText,
  CreditCard,
  BarChart3,
  Users,
  Package,
  LogOut,
  Search,
  ScanBarcode,
  Sun,
  Moon,
  TreePine,
  Wifi,
} from 'lucide-react';

// Cedar & Gold Theme Preview - Lebanese Accounting SaaS
export default function ThemePreviewPage() {
  const [darkMode, setDarkMode] = useState(false);

  // Load Google Fonts
  useEffect(() => {
    const link = document.createElement('link');
    link.href = 'https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Playfair+Display:wght@400;500;600;700&display=swap';
    link.rel = 'stylesheet';
    document.head.appendChild(link);
    return () => {
      document.head.removeChild(link);
    };
  }, []);

  return (
    <div className={darkMode ? 'dark' : ''}>
      <div
        style={{
          fontFamily: "'DM Sans', system-ui, sans-serif",
          backgroundColor: darkMode ? '#1A1915' : '#FAF8F5',
          color: darkMode ? '#F5F3EF' : '#2D2A26',
          minHeight: '100vh',
          padding: '2rem',
        }}
      >
        {/* Theme Toggle */}
        <div style={{ position: 'fixed', top: '1rem', right: '1rem', zIndex: 100 }}>
          <button
            onClick={() => setDarkMode(!darkMode)}
            style={{
              padding: '0.75rem 1.5rem',
              backgroundColor: darkMode ? '#C9A962' : '#1B4D3E',
              color: '#fff',
              border: 'none',
              borderRadius: '9999px',
              cursor: 'pointer',
              fontWeight: 600,
              boxShadow: '0 4px 14px rgba(0,0,0,0.15)',
            }}
          >
            {darkMode ? <><Sun size={16} style={{ marginRight: 8 }} /> Light Mode</> : <><Moon size={16} style={{ marginRight: 8 }} /> Dark Mode</>}
          </button>
        </div>

        {/* Header */}
        <header style={{ textAlign: 'center', marginBottom: '4rem', paddingTop: '2rem' }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '1rem',
              marginBottom: '1rem',
            }}
          >
            {/* Cedar Tree Icon */}
            <TreePine size={48} color="#1B4D3E" strokeWidth={1.5} />
            <h1
              style={{
                fontFamily: "'Playfair Display', Georgia, serif",
                fontSize: '2.5rem',
                fontWeight: 700,
                color: '#1B4D3E',
                margin: 0,
              }}
            >
              Lebanese Accounting
            </h1>
          </div>
          <p style={{ fontSize: '1.125rem', color: darkMode ? '#A8A49C' : '#6B6560', margin: 0 }}>
            Cedar & Gold Theme Preview — Mediterranean Luxury Fintech
          </p>
        </header>

        {/* Color Palette */}
        <section style={{ marginBottom: '4rem' }}>
          <h2
            style={{
              fontFamily: "'Playfair Display', Georgia, serif",
              fontSize: '1.75rem',
              marginBottom: '1.5rem',
              color: '#1B4D3E',
            }}
          >
            Color Palette
          </h2>
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            {[
              { name: 'Cedar Green', color: '#1B4D3E', text: '#fff' },
              { name: 'Forest', color: '#2D5A4A', text: '#fff' },
              { name: 'Sage', color: '#5B8A72', text: '#fff' },
              { name: 'Gold', color: '#C9A962', text: '#1A1915' },
              { name: 'Warm Gold', color: '#D4B978', text: '#1A1915' },
              { name: 'Terracotta', color: '#C75B39', text: '#fff' },
              { name: 'Cream', color: '#FAF8F5', text: '#2D2A26' },
              { name: 'Ivory', color: '#F5F3EF', text: '#2D2A26' },
              { name: 'Charcoal', color: '#2D2A26', text: '#fff' },
              { name: 'Night', color: '#1A1915', text: '#fff' },
            ].map((c) => (
              <div
                key={c.name}
                style={{
                  width: '140px',
                  height: '100px',
                  backgroundColor: c.color,
                  color: c.text,
                  borderRadius: '12px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                  border: c.color === '#FAF8F5' || c.color === '#F5F3EF' ? '1px solid #E5E0D8' : 'none',
                }}
              >
                <span style={{ fontWeight: 600, fontSize: '0.875rem' }}>{c.name}</span>
                <span style={{ fontSize: '0.75rem', opacity: 0.8, marginTop: '0.25rem' }}>{c.color}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Typography */}
        <section style={{ marginBottom: '4rem' }}>
          <h2
            style={{
              fontFamily: "'Playfair Display', Georgia, serif",
              fontSize: '1.75rem',
              marginBottom: '1.5rem',
              color: '#1B4D3E',
            }}
          >
            Typography
          </h2>
          <div
            style={{
              backgroundColor: darkMode ? '#252220' : '#fff',
              padding: '2rem',
              borderRadius: '16px',
              boxShadow: '0 4px 24px rgba(0,0,0,0.06)',
            }}
          >
            <h1
              style={{
                fontFamily: "'Playfair Display', Georgia, serif",
                fontSize: '3rem',
                fontWeight: 700,
                color: '#1B4D3E',
                marginBottom: '0.5rem',
              }}
            >
              Playfair Display
            </h1>
            <p style={{ color: darkMode ? '#A8A49C' : '#6B6560', marginBottom: '2rem' }}>
              Elegant serif for headings — timeless, editorial, sophisticated
            </p>

            <h2
              style={{
                fontFamily: "'DM Sans', system-ui, sans-serif",
                fontSize: '2rem',
                fontWeight: 600,
                marginBottom: '0.5rem',
              }}
            >
              DM Sans for Body
            </h2>
            <p style={{ fontSize: '1rem', lineHeight: 1.7, color: darkMode ? '#C4C0B8' : '#4A4540' }}>
              Clean, modern, highly legible. Perfect for data-heavy financial interfaces.
              Tracks expenses, invoices, and payments with clarity.
              الأرقام العربية مدعومة — Arabic numerals supported.
            </p>

            <div style={{ marginTop: '2rem', display: 'flex', gap: '2rem', flexWrap: 'wrap' }}>
              <div>
                <span style={{ fontSize: '3rem', fontWeight: 700, color: '#1B4D3E' }}>$12,450.00</span>
                <p style={{ fontSize: '0.875rem', color: darkMode ? '#A8A49C' : '#6B6560' }}>Amount Display</p>
              </div>
              <div>
                <span style={{ fontSize: '3rem', fontWeight: 700, color: '#C9A962' }}>89,500 LBP</span>
                <p style={{ fontSize: '0.875rem', color: darkMode ? '#A8A49C' : '#6B6560' }}>Exchange Rate</p>
              </div>
            </div>
          </div>
        </section>

        {/* Buttons */}
        <section style={{ marginBottom: '4rem' }}>
          <h2
            style={{
              fontFamily: "'Playfair Display', Georgia, serif",
              fontSize: '1.75rem',
              marginBottom: '1.5rem',
              color: '#1B4D3E',
            }}
          >
            Buttons
          </h2>
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
            <button
              style={{
                padding: '0.875rem 2rem',
                backgroundColor: '#1B4D3E',
                color: '#fff',
                border: 'none',
                borderRadius: '10px',
                fontWeight: 600,
                fontSize: '1rem',
                cursor: 'pointer',
                boxShadow: '0 4px 14px rgba(27, 77, 62, 0.35)',
                transition: 'all 0.2s',
              }}
            >
              Primary Action
            </button>
            <button
              style={{
                padding: '0.875rem 2rem',
                backgroundColor: '#C9A962',
                color: '#1A1915',
                border: 'none',
                borderRadius: '10px',
                fontWeight: 600,
                fontSize: '1rem',
                cursor: 'pointer',
                boxShadow: '0 4px 14px rgba(201, 169, 98, 0.35)',
              }}
            >
              Gold Accent
            </button>
            <button
              style={{
                padding: '0.875rem 2rem',
                backgroundColor: 'transparent',
                color: '#1B4D3E',
                border: '2px solid #1B4D3E',
                borderRadius: '10px',
                fontWeight: 600,
                fontSize: '1rem',
                cursor: 'pointer',
              }}
            >
              Secondary
            </button>
            <button
              style={{
                padding: '0.875rem 2rem',
                backgroundColor: '#C75B39',
                color: '#fff',
                border: 'none',
                borderRadius: '10px',
                fontWeight: 600,
                fontSize: '1rem',
                cursor: 'pointer',
                boxShadow: '0 4px 14px rgba(199, 91, 57, 0.35)',
              }}
            >
              Danger
            </button>
            <button
              style={{
                padding: '0.875rem 2rem',
                backgroundColor: '#5B8A72',
                color: '#fff',
                border: 'none',
                borderRadius: '10px',
                fontWeight: 600,
                fontSize: '1rem',
                cursor: 'pointer',
                boxShadow: '0 4px 14px rgba(91, 138, 114, 0.35)',
              }}
            >
              Success
            </button>
          </div>
        </section>

        {/* Cards */}
        <section style={{ marginBottom: '4rem' }}>
          <h2
            style={{
              fontFamily: "'Playfair Display', Georgia, serif",
              fontSize: '1.75rem',
              marginBottom: '1.5rem',
              color: '#1B4D3E',
            }}
          >
            Cards & Components
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
            {/* Stats Card */}
            <div
              style={{
                backgroundColor: darkMode ? '#252220' : '#fff',
                borderRadius: '16px',
                padding: '1.5rem',
                boxShadow: '0 4px 24px rgba(0,0,0,0.06)',
                borderLeft: '4px solid #1B4D3E',
              }}
            >
              <p style={{ fontSize: '0.875rem', color: darkMode ? '#A8A49C' : '#6B6560', marginBottom: '0.5rem' }}>
                Total Revenue
              </p>
              <p style={{ fontSize: '2rem', fontWeight: 700, color: '#1B4D3E', marginBottom: '0.25rem' }}>
                $24,580.00
              </p>
              <p style={{ fontSize: '0.875rem', color: '#5B8A72' }}>↑ 12.5% from last month</p>
            </div>

            {/* Gold Accent Card */}
            <div
              style={{
                background: 'linear-gradient(135deg, #1B4D3E 0%, #2D5A4A 100%)',
                borderRadius: '16px',
                padding: '1.5rem',
                color: '#fff',
                boxShadow: '0 8px 32px rgba(27, 77, 62, 0.3)',
              }}
            >
              <p style={{ fontSize: '0.875rem', opacity: 0.8, marginBottom: '0.5rem' }}>Exchange Rate</p>
              <p style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '0.25rem' }}>
                <span style={{ color: '#C9A962' }}>89,500</span> LBP/USD
              </p>
              <p style={{ fontSize: '0.875rem', opacity: 0.8 }}>Updated today at 10:30 AM</p>
            </div>

            {/* Invoice Card */}
            <div
              style={{
                backgroundColor: darkMode ? '#252220' : '#fff',
                borderRadius: '16px',
                padding: '1.5rem',
                boxShadow: '0 4px 24px rgba(0,0,0,0.06)',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                <div>
                  <p style={{ fontWeight: 600, marginBottom: '0.25rem' }}>Invoice #INV-2024-001</p>
                  <p style={{ fontSize: '0.875rem', color: darkMode ? '#A8A49C' : '#6B6560' }}>ABC Trading Co.</p>
                </div>
                <span
                  style={{
                    padding: '0.25rem 0.75rem',
                    backgroundColor: '#FEF3E2',
                    color: '#C75B39',
                    borderRadius: '9999px',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    height: 'fit-content',
                  }}
                >
                  Pending
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '1.5rem', fontWeight: 700, color: '#1B4D3E' }}>$1,250.00</span>
                <span style={{ fontSize: '0.875rem', color: darkMode ? '#A8A49C' : '#6B6560' }}>Due Jan 20</span>
              </div>
            </div>
          </div>
        </section>

        {/* POS Preview */}
        <section style={{ marginBottom: '4rem' }}>
          <h2
            style={{
              fontFamily: "'Playfair Display', Georgia, serif",
              fontSize: '1.75rem',
              marginBottom: '1.5rem',
              color: '#1B4D3E',
            }}
          >
            POS Interface Preview
          </h2>
          <div
            style={{
              backgroundColor: darkMode ? '#1A1915' : '#F5F3EF',
              borderRadius: '16px',
              overflow: 'hidden',
              boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
            }}
          >
            {/* POS Header */}
            <div
              style={{
                backgroundColor: '#1B4D3E',
                padding: '0.75rem 1.5rem',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                color: '#fff',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <ShoppingCart size={22} />
                  <span style={{ fontWeight: 700, fontSize: '1.25rem' }}>POS Terminal</span>
                </div>
                <span style={{ opacity: 0.8, fontSize: '0.875rem' }}>POS-01 | Demo User</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <div style={{ width: '10px', height: '10px', backgroundColor: '#5B8A72', borderRadius: '50%' }} />
                <span style={{ fontSize: '0.875rem' }}>Online</span>
              </div>
            </div>

            {/* POS Content */}
            <div style={{ display: 'flex', height: '400px' }}>
              {/* Left - Scan Area */}
              <div style={{ flex: 1, padding: '2rem', display: 'flex', flexDirection: 'column' }}>
                <div style={{ position: 'relative' }}>
                  <Search size={20} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#A8A49C', zIndex: 1 }} />
                  <input
                    type="text"
                    placeholder="Scan barcode or search products..."
                    style={{
                      width: '100%',
                      padding: '1rem 1.5rem 1rem 3rem',
                      fontSize: '1.125rem',
                      border: '2px solid #E5E0D8',
                      borderRadius: '12px',
                      backgroundColor: darkMode ? '#252220' : '#fff',
                      color: darkMode ? '#F5F3EF' : '#2D2A26',
                      outline: 'none',
                    }}
                  />
                </div>
                <div
                  style={{
                    flex: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexDirection: 'column',
                    color: darkMode ? '#6B6560' : '#A8A49C',
                  }}
                >
                  <ScanBarcode size={80} strokeWidth={1} />
                  <p style={{ marginTop: '1rem', fontSize: '1.125rem' }}>Scan product barcode</p>
                  <p style={{ fontSize: '0.875rem', marginTop: '0.5rem' }}>Or type PLU code and press Enter</p>
                </div>
              </div>

              {/* Right - Cart */}
              <div
                style={{
                  width: '350px',
                  backgroundColor: darkMode ? '#252220' : '#fff',
                  borderLeft: `1px solid ${darkMode ? '#3D3A35' : '#E5E0D8'}`,
                  display: 'flex',
                  flexDirection: 'column',
                }}
              >
                <div style={{ flex: 1, padding: '1rem', borderBottom: `1px solid ${darkMode ? '#3D3A35' : '#E5E0D8'}` }}>
                  {/* Sample Cart Items */}
                  {[
                    { name: 'Coca-Cola 330ml', qty: 2, price: 1.00 },
                    { name: 'Lay\'s Classic 160g', qty: 1, price: 1.75 },
                    { name: 'Water Sohat 1.5L', qty: 3, price: 1.50 },
                  ].map((item, i) => (
                    <div
                      key={i}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        padding: '0.75rem 0',
                        borderBottom: `1px solid ${darkMode ? '#3D3A35' : '#F5F3EF'}`,
                      }}
                    >
                      <div>
                        <p style={{ fontWeight: 500, marginBottom: '0.25rem' }}>{item.name}</p>
                        <p style={{ fontSize: '0.875rem', color: darkMode ? '#A8A49C' : '#6B6560' }}>
                          {item.qty} × ${item.price.toFixed(2)}
                        </p>
                      </div>
                      <span style={{ fontWeight: 600, color: '#1B4D3E' }}>
                        ${(item.qty * item.price).toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Total Section */}
                <div style={{ padding: '1.5rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                    <span style={{ color: darkMode ? '#A8A49C' : '#6B6560' }}>Subtotal</span>
                    <span>$7.25</span>
                  </div>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      marginBottom: '1rem',
                      paddingTop: '0.75rem',
                      borderTop: `2px solid ${darkMode ? '#3D3A35' : '#E5E0D8'}`,
                    }}
                  >
                    <span style={{ fontSize: '1.25rem', fontWeight: 700 }}>Total</span>
                    <div style={{ textAlign: 'right' }}>
                      <p style={{ fontSize: '1.5rem', fontWeight: 700, color: '#1B4D3E' }}>$7.25</p>
                      <p style={{ fontSize: '0.875rem', color: '#C9A962' }}>649,125 LBP</p>
                    </div>
                  </div>
                  <button
                    style={{
                      width: '100%',
                      padding: '1rem',
                      background: 'linear-gradient(135deg, #5B8A72 0%, #1B4D3E 100%)',
                      color: '#fff',
                      border: 'none',
                      borderRadius: '12px',
                      fontSize: '1.25rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      boxShadow: '0 4px 20px rgba(27, 77, 62, 0.4)',
                    }}
                  >
                    <CreditCard size={24} style={{ marginRight: '0.5rem' }} /> PAY $7.25
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Sidebar Preview */}
        <section style={{ marginBottom: '4rem' }}>
          <h2
            style={{
              fontFamily: "'Playfair Display', Georgia, serif",
              fontSize: '1.75rem',
              marginBottom: '1.5rem',
              color: '#1B4D3E',
            }}
          >
            Sidebar Navigation
          </h2>
          <div
            style={{
              display: 'flex',
              backgroundColor: darkMode ? '#252220' : '#fff',
              borderRadius: '16px',
              overflow: 'hidden',
              boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
              height: '500px',
            }}
          >
            {/* Sidebar */}
            <div
              style={{
                width: '280px',
                backgroundColor: '#1B4D3E',
                color: '#fff',
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              {/* Logo */}
              <div style={{ padding: '1.5rem', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div
                    style={{
                      width: '40px',
                      height: '40px',
                      backgroundColor: '#C9A962',
                      borderRadius: '10px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <TreePine size={24} color="#1B4D3E" />
                  </div>
                  <div>
                    <p style={{ fontWeight: 700, marginBottom: '0.125rem' }}>Demo Minimarket</p>
                    <p style={{ fontSize: '0.75rem', opacity: 0.7 }}>demo-minimarket</p>
                  </div>
                </div>
              </div>

              {/* Nav Items */}
              <nav style={{ flex: 1, padding: '1rem' }}>
                {[
                  { Icon: ShoppingCart, label: 'POS', active: false },
                  { Icon: LayoutDashboard, label: 'Dashboard', active: true },
                  { Icon: Wallet, label: 'Accounts', active: false },
                  { Icon: FileText, label: 'Invoices', active: false },
                  { Icon: CreditCard, label: 'Payments', active: false },
                  { Icon: BarChart3, label: 'Reports', active: false },
                  { Icon: Users, label: 'Contacts', active: false },
                  { Icon: Package, label: 'Products', active: false },
                ].map((item, i) => (
                  <div
                    key={i}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.75rem',
                      padding: '0.875rem 1rem',
                      borderRadius: '10px',
                      marginBottom: '0.25rem',
                      backgroundColor: item.active ? 'rgba(201, 169, 98, 0.2)' : 'transparent',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                    }}
                  >
                    <item.Icon size={20} color={item.active ? '#C9A962' : 'rgba(255,255,255,0.8)'} />
                    <span
                      style={{
                        fontWeight: item.active ? 600 : 400,
                        color: item.active ? '#C9A962' : 'rgba(255,255,255,0.8)',
                      }}
                    >
                      {item.label}
                    </span>
                  </div>
                ))}
              </nav>

              {/* Logout */}
              <div style={{ padding: '1rem', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    padding: '0.875rem 1rem',
                    borderRadius: '10px',
                    cursor: 'pointer',
                    opacity: 0.7,
                  }}
                >
                  <LogOut size={20} />
                  <span>Sign out</span>
                </div>
              </div>
            </div>

            {/* Main Content Preview */}
            <div style={{ flex: 1, padding: '2rem', backgroundColor: darkMode ? '#1A1915' : '#FAF8F5' }}>
              <h1
                style={{
                  fontFamily: "'Playfair Display', Georgia, serif",
                  fontSize: '2rem',
                  color: '#1B4D3E',
                  marginBottom: '2rem',
                }}
              >
                Dashboard
              </h1>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
                {[
                  { label: 'Total Payables', value: '$12,450', color: '#C75B39' },
                  { label: 'This Month', value: '$3,280', color: '#1B4D3E' },
                  { label: 'Products', value: '156', color: '#5B8A72' },
                ].map((stat, i) => (
                  <div
                    key={i}
                    style={{
                      backgroundColor: darkMode ? '#252220' : '#fff',
                      padding: '1.25rem',
                      borderRadius: '12px',
                      boxShadow: '0 2px 12px rgba(0,0,0,0.04)',
                    }}
                  >
                    <p style={{ fontSize: '0.875rem', color: darkMode ? '#A8A49C' : '#6B6560', marginBottom: '0.5rem' }}>
                      {stat.label}
                    </p>
                    <p style={{ fontSize: '1.75rem', fontWeight: 700, color: stat.color }}>{stat.value}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer style={{ textAlign: 'center', padding: '2rem', color: darkMode ? '#6B6560' : '#A8A49C' }}>
          <p>Cedar & Gold Theme — Inspired by Lebanese Heritage</p>
          <p style={{ marginTop: '0.5rem', fontSize: '0.875rem' }}>
            Deep cedar greens, warm golds, Mediterranean warmth
          </p>
        </footer>
      </div>
    </div>
  );
}
