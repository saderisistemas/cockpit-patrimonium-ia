import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import type { Session } from '@supabase/supabase-js';

/**
 * Hook unificado de sessão Supabase.
 * Retorna:
 *   undefined → carregando
 *   null      → não autenticado
 *   Session   → autenticado
 * 
 * Em caso de erro no refresh (504/timeout), limpa a sessão corrompida
 * e redireciona para login.
 */
export function useSession(): Session | null | undefined {
  const [session, setSession] = useState<Session | null | undefined>(undefined);

  useEffect(() => {
    let mounted = true;

    // Sessão inicial (cache local)
    supabase.auth.getSession().then(({ data: { session: s }, error }) => {
      if (!mounted) return;
      if (error) {
        console.warn('[useSession] Erro ao obter sessão:', error.message);
        // Sessão corrompida — limpar e forçar re-login
        supabase.auth.signOut().catch(() => {});
        setSession(null);
        return;
      }
      setSession(s);
    }).catch((err) => {
      if (!mounted) return;
      console.warn('[useSession] Exceção ao obter sessão:', err);
      setSession(null);
    });

    // Escuta mudanças (login, logout, refresh)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, s) => {
      if (!mounted) return;
      setSession(s);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  return session;
}
