import { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { supabase } from './lib/supabase';
import { Dashboard } from './pages/Dashboard';
import { DetalhesDisparo } from './pages/DetalheDisparo';
import { Login } from './pages/Login';
import { LogOut } from 'lucide-react';
import logo from './assets/logo.png';
import type { Session } from '@supabase/supabase-js';

// Shared auth context via module-level state
function useSession() {
  const [session, setSession] = useState<Session | null | undefined>(undefined);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  return session;
}

const Layout = ({ children }: { children: React.ReactNode }) => {
  const navigate = useNavigate();
  const session = useSession();
  const user = session?.user ?? null;

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/login');
  };

  // Still loading auth
  if (session === undefined) {
    return (
      <div style={{
        minHeight: '100vh',
        background: '#0a0a0a',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: "'Barlow Condensed', sans-serif",
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: '32px',
            height: '32px',
            border: '2px solid #8b2323',
            borderTopColor: 'transparent',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 1rem',
          }} />
          <div style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: '0.65rem',
            color: 'rgba(255,255,255,0.3)',
            letterSpacing: '0.3em',
            textTransform: 'uppercase',
          }}>
            Verificando Sessão...
          </div>
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  // Not logged in — just render children (login page)
  if (!user) return <>{children}</>;

  return (
    <div style={{ minHeight: '100vh', background: '#0a0a0a', color: '#e2e8f0', fontFamily: "'Barlow Condensed', sans-serif" }}>
      {/* HEADER */}
      <header style={{
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        background: 'rgba(10,10,10,0.8)',
        backdropFilter: 'blur(12px)',
        position: 'sticky',
        top: 0,
        zIndex: 50,
      }}>
        <div style={{
          maxWidth: '82rem',
          margin: '0 auto',
          padding: '0 1.5rem',
          height: '4.5rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          position: 'relative',
        }}>
          {/* Centered modest developer credit */}
          <div style={{
            position: 'absolute',
            top: '0.4rem',
            left: '50%',
            transform: 'translateX(-50%)',
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: '0.5rem',
            color: 'rgba(255,255,255,0.15)',
            letterSpacing: '0.25em',
            textTransform: 'uppercase',
            pointerEvents: 'none'
          }}>
            Desenvolvido por DANILO SADERI
          </div>

          {/* Logo */}
          <div
            style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer' }}
            onClick={() => navigate('/')}
          >
            <img src={logo} alt="Patrimonium" style={{ height: '40px', width: 'auto' }} />
            <div>
              <div style={{
                fontSize: '1.3rem',
                fontWeight: 900,
                letterSpacing: '0.15em',
                color: '#fff',
                lineHeight: 1,
              }}>
                IRIS <span style={{ color: '#8b2323' }}>COCKPIT DE EVENTOS REAL TIME</span>
              </div>
              <div style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: '0.55rem',
                color: 'rgba(255,255,255,0.25)',
                letterSpacing: '0.2em',
              }}>
                MONITORAMENTO TÁTICO 24H
              </div>
            </div>
          </div>

          {/* User info + logout */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ textAlign: 'right' }}>
              <div style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: '0.7rem',
                color: '#fff',
                fontWeight: 700,
              }}>
                {user.email}
              </div>
              <div style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: '0.55rem',
                color: 'rgba(255,255,255,0.25)',
                letterSpacing: '0.2em',
              }}>
                OPERADOR ATIVO
              </div>
            </div>
            <button
              onClick={handleLogout}
              style={{
                padding: '0.5rem',
                background: 'transparent',
                border: '1px solid rgba(255,255,255,0.06)',
                borderRadius: '0.375rem',
                cursor: 'pointer',
                color: 'rgba(255,255,255,0.4)',
                transition: 'all 0.2s',
                display: 'flex',
              }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLButtonElement).style.color = '#8b2323';
                (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(139,35,35,0.3)';
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLButtonElement).style.color = 'rgba(255,255,255,0.4)';
                (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(255,255,255,0.06)';
              }}
              title="Encerrar Sessão"
            >
              <LogOut style={{ width: '16px', height: '16px' }} />
            </button>
          </div>
        </div>

        {/* Bottom accent line */}
        <div style={{ height: '1px', background: 'linear-gradient(90deg, transparent, rgba(139,35,35,0.4), transparent)' }} />
      </header>

      <main style={{ position: 'relative' }}>
        {/* Decorative background glow */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: '50%',
          transform: 'translateX(-50%)',
          width: '600px',
          height: '300px',
          background: 'radial-gradient(ellipse, rgba(139,35,35,0.06) 0%, transparent 70%)',
          pointerEvents: 'none',
        }} />
        <div style={{ position: 'relative', zIndex: 10 }}>
          {children}
        </div>
      </main>
    </div>
  );
};

// Protected route wrapper
const RequireAuth = ({ children }: { children: React.ReactElement }) => {
  const session = useSession();
  const location = useLocation();

  // Still loading
  if (session === undefined) return null;

  // Not authenticated
  if (!session) return <Navigate to="/login" state={{ from: location }} replace />;

  return children;
};

function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<RequireAuth><Dashboard /></RequireAuth>} />
          <Route path="/disparo/:id" element={<RequireAuth><DetalhesDisparo /></RequireAuth>} />
        </Routes>
      </Layout>
      <Toaster position="top-right" toastOptions={{
        style: {
          background: '#111',
          color: '#fff',
          border: '1px solid rgba(139,35,35,0.3)',
          fontFamily: "'Barlow Condensed', sans-serif",
          fontWeight: 700,
          letterSpacing: '0.05em',
        }
      }} />
    </Router>
  );
}

export default App;
