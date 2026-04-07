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
 * IMPORTANTE: erros transitórios na inicialização (timeout, rede) NÃO
 * disparam signOut automático. Apenas ausência real de sessão resulta em null.
 */
export function useSession(): Session | null | undefined {
  const [session, setSession] = useState<Session | null | undefined>(undefined);

  useEffect(() => {
    let mounted = true;

    // Sessão inicial (cache local do storage)
    supabase.auth.getSession().then(({ data: { session: s }, error }) => {
      if (!mounted) return;
      if (error) {
        console.warn('[useSession] Erro ao obter sessão:', error.message);
        // Não forçar signOut por erro transitório — apenas marcar como null
        // Um signOut automático aqui causaria logout indevido em redes lentas
        setSession(null);
        return;
      }
      setSession(s);
    }).catch((err) => {
      if (!mounted) return;
      console.warn('[useSession] Exceção ao obter sessão:', err);
      // Idem: não signOut — pode ser erro de rede temporário
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
