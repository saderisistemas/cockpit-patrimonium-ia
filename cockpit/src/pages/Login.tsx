import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';
import logo from '../assets/logo.png';

export const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) {
            toast.error('Credencial inválida. Acesso negado.', {
                style: { background: '#1a0a0a', color: '#fff', border: '1px solid #8b2323', fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, letterSpacing: '0.1em' }
            });
        } else {
            toast.success('Acesso autorizado. Carregando terminal...', {
                style: { background: '#0a1a0a', color: '#4ade80', border: '1px solid #166534', fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, letterSpacing: '0.1em' }
            });
            navigate('/');
        }
        setLoading(false);
    };

    return (
        <div
            style={{
                minHeight: '100vh',
                background: '#0a0a0a',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '2rem',
                position: 'relative',
                overflow: 'hidden',
                fontFamily: "'Barlow Condensed', sans-serif",
            }}
        >
            {/* Background red glow */}
            <div style={{
                position: 'absolute',
                top: '20%',
                left: '50%',
                transform: 'translateX(-50%)',
                width: '600px',
                height: '400px',
                background: 'radial-gradient(ellipse, rgba(139,35,35,0.15) 0%, transparent 70%)',
                pointerEvents: 'none',
            }} />

            {/* Corner decorators */}
            <div style={{ position: 'absolute', top: '1.5rem', left: '1.5rem', width: '40px', height: '40px', borderTop: '2px solid rgba(139,35,35,0.5)', borderLeft: '2px solid rgba(139,35,35,0.5)' }} />
            <div style={{ position: 'absolute', top: '1.5rem', right: '1.5rem', width: '40px', height: '40px', borderTop: '2px solid rgba(139,35,35,0.5)', borderRight: '2px solid rgba(139,35,35,0.5)' }} />
            <div style={{ position: 'absolute', bottom: '1.5rem', left: '1.5rem', width: '40px', height: '40px', borderBottom: '2px solid rgba(139,35,35,0.5)', borderLeft: '2px solid rgba(139,35,35,0.5)' }} />
            <div style={{ position: 'absolute', bottom: '1.5rem', right: '1.5rem', width: '40px', height: '40px', borderBottom: '2px solid rgba(139,35,35,0.5)', borderRight: '2px solid rgba(139,35,35,0.5)' }} />

            {/* Status bar top */}
            <div style={{
                position: 'absolute',
                top: '1.5rem',
                left: '50%',
                transform: 'translateX(-50%)',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: '0.65rem',
                color: 'rgba(255,255,255,0.25)',
                letterSpacing: '0.15em',
            }}>
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#22c55e', display: 'inline-block', boxShadow: '0 0 6px #22c55e', animation: 'pulse 2s infinite' }} />
                SISTEMA OPERACIONAL — COCKPIT IA PATRIMONIUM v1.0
            </div>

            {/* Main card */}
            <div style={{
                width: '100%',
                maxWidth: '420px',
                background: 'rgba(15,15,15,0.95)',
                border: '1px solid rgba(139,35,35,0.25)',
                borderRadius: '4px',
                overflow: 'hidden',
                boxShadow: '0 0 80px rgba(139,35,35,0.08), 0 40px 80px rgba(0,0,0,0.8)',
                position: 'relative',
            }}>

                {/* Top accent stripe */}
                <div style={{ height: '3px', background: 'linear-gradient(90deg, transparent, #8b2323, transparent)' }} />

                {/* Logo section */}
                <div style={{
                    padding: '2.5rem 2.5rem 2rem',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '1.25rem',
                    borderBottom: '1px solid rgba(255,255,255,0.04)',
                }}>
                    <img
                        src={logo}
                        alt="Patrimonium"
                        style={{ height: '80px', width: 'auto', filter: 'drop-shadow(0 0 20px rgba(139,35,35,0.3))' }}
                    />
                    <div style={{ textAlign: 'center' }}>
                        <div style={{
                            fontSize: '1.8rem',
                            fontWeight: 900,
                            letterSpacing: '0.25em',
                            color: '#ffffff',
                            textTransform: 'uppercase',
                            lineHeight: 1,
                        }}>
                            COCKPIT <span style={{ color: '#8b2323' }}>IA</span>
                        </div>
                        <div style={{
                            fontFamily: "'JetBrains Mono', monospace",
                            fontSize: '0.6rem',
                            color: 'rgba(255,255,255,0.3)',
                            letterSpacing: '0.3em',
                            marginTop: '0.4rem',
                        }}>
                            CENTRO DE MONITORAMENTO TÁTICO
                        </div>
                    </div>
                </div>

                {/* Form */}
                <form onSubmit={handleLogin} style={{ padding: '2rem 2.5rem 2.5rem' }}>

                    <div style={{
                        fontFamily: "'JetBrains Mono', monospace",
                        fontSize: '0.6rem',
                        color: 'rgba(255,255,255,0.2)',
                        letterSpacing: '0.2em',
                        marginBottom: '1.5rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem'
                    }}>
                        <span style={{ width: '20px', height: '1px', background: 'rgba(139,35,35,0.5)' }} />
                        AUTENTICAÇÃO BIOMÉTRICA
                        <span style={{ flex: 1, height: '1px', background: 'rgba(139,35,35,0.2)' }} />
                    </div>

                    {/* Email field */}
                    <div style={{ marginBottom: '1rem' }}>
                        <label style={{
                            display: 'block',
                            fontFamily: "'JetBrains Mono', monospace",
                            fontSize: '0.6rem',
                            color: 'rgba(255,255,255,0.3)',
                            letterSpacing: '0.2em',
                            textTransform: 'uppercase',
                            marginBottom: '0.4rem',
                        }}>
                            Identificador / E-mail
                        </label>
                        <div style={{ position: 'relative' }}>
                            <svg style={{ position: 'absolute', left: '0.875rem', top: '50%', transform: 'translateY(-50%)', width: '16px', height: '16px', color: 'rgba(255,255,255,0.2)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                            </svg>
                            <input
                                className="input-tactical"
                                type="email"
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                                placeholder="agente@patrimonium.com.br"
                                required
                                autoComplete="email"
                            />
                        </div>
                    </div>

                    {/* Password field */}
                    <div style={{ marginBottom: '1.75rem' }}>
                        <label style={{
                            display: 'block',
                            fontFamily: "'JetBrains Mono', monospace",
                            fontSize: '0.6rem',
                            color: 'rgba(255,255,255,0.3)',
                            letterSpacing: '0.2em',
                            textTransform: 'uppercase',
                            marginBottom: '0.4rem',
                        }}>
                            Chave de Acesso
                        </label>
                        <div style={{ position: 'relative' }}>
                            <svg style={{ position: 'absolute', left: '0.875rem', top: '50%', transform: 'translateY(-50%)', width: '16px', height: '16px', color: 'rgba(255,255,255,0.2)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                            </svg>
                            <input
                                className="input-tactical"
                                type="password"
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                                placeholder="••••••••••••"
                                required
                                autoComplete="current-password"
                            />
                        </div>
                    </div>

                    {/* Submit button */}
                    <button
                        type="submit"
                        disabled={loading}
                        style={{
                            width: '100%',
                            background: loading ? 'rgba(139,35,35,0.5)' : '#8b2323',
                            color: 'white',
                            fontFamily: "'Barlow Condensed', sans-serif",
                            fontWeight: 900,
                            fontSize: '0.95rem',
                            letterSpacing: '0.25em',
                            textTransform: 'uppercase',
                            padding: '0.9rem 2rem',
                            borderRadius: '4px',
                            border: 'none',
                            cursor: loading ? 'not-allowed' : 'pointer',
                            position: 'relative',
                            overflow: 'hidden',
                            transition: 'all 0.2s',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '0.6rem',
                            boxShadow: loading ? 'none' : '0 4px 20px rgba(139,35,35,0.3)',
                        }}
                        onMouseEnter={e => { if (!loading) (e.target as HTMLButtonElement).style.background = '#b02d2d'; }}
                        onMouseLeave={e => { if (!loading) (e.target as HTMLButtonElement).style.background = '#8b2323'; }}
                    >
                        {loading ? (
                            <>
                                <svg style={{ width: '18px', height: '18px', animation: 'spin 1s linear infinite' }} fill="none" viewBox="0 0 24 24">
                                    <circle style={{ opacity: 0.25 }} cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                    <path style={{ opacity: 0.75 }} fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                </svg>
                                Autenticando...
                            </>
                        ) : (
                            <>
                                <svg style={{ width: '18px', height: '18px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                                </svg>
                                Acessar Terminal
                            </>
                        )}
                    </button>

                    {/* Footer note */}
                    <div style={{
                        textAlign: 'center',
                        marginTop: '1.5rem',
                        fontFamily: "'JetBrains Mono', monospace",
                        fontSize: '0.6rem',
                        color: 'rgba(255,255,255,0.15)',
                        letterSpacing: '0.1em',
                        lineHeight: 1.8,
                    }}>
                        PATRIMONIUM SEGURANÇA 24H<br />
                        <span style={{ color: 'rgba(255,255,255,0.08)' }}>Acesso restrito a operadores autorizados</span>
                    </div>

                    {/* TV Cockpit link */}
                    <Link
                        to="/tv"
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '0.5rem',
                            marginTop: '1.25rem',
                            padding: '0.6rem 1rem',
                            background: 'rgba(168,85,247,0.05)',
                            border: '1px solid rgba(168,85,247,0.15)',
                            borderRadius: '4px',
                            color: 'rgba(168,85,247,0.6)',
                            fontFamily: "'JetBrains Mono', monospace",
                            fontSize: '0.6rem',
                            fontWeight: 800,
                            letterSpacing: '0.2em',
                            textTransform: 'uppercase' as const,
                            textDecoration: 'none',
                            transition: 'all 0.2s',
                            cursor: 'pointer',
                        }}
                        onMouseEnter={e => {
                            (e.currentTarget as HTMLAnchorElement).style.background = 'rgba(168,85,247,0.1)';
                            (e.currentTarget as HTMLAnchorElement).style.borderColor = 'rgba(168,85,247,0.3)';
                            (e.currentTarget as HTMLAnchorElement).style.color = 'rgba(168,85,247,0.9)';
                        }}
                        onMouseLeave={e => {
                            (e.currentTarget as HTMLAnchorElement).style.background = 'rgba(168,85,247,0.05)';
                            (e.currentTarget as HTMLAnchorElement).style.borderColor = 'rgba(168,85,247,0.15)';
                            (e.currentTarget as HTMLAnchorElement).style.color = 'rgba(168,85,247,0.6)';
                        }}
                    >
                        <svg style={{ width: '14px', height: '14px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                        Abrir Modo TV — Central
                    </Link>
                </form>

                {/* Bottom accent stripe */}
                <div style={{ height: '1px', background: 'linear-gradient(90deg, transparent, rgba(139,35,35,0.4), transparent)' }} />
            </div>

            <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }
      `}</style>
        </div>
    );
};
