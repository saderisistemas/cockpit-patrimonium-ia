import { useEffect, useState, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { useSession } from './useSession';

type UserRole = 'admin' | 'operador' | null;

interface UseUserRoleReturn {
    role: UserRole;
    isAdmin: boolean;
    loading: boolean;
    nomeCompleto: string | null;
}

export const useUserRole = (): UseUserRoleReturn => {
    const session = useSession();
    const [role, setRole] = useState<UserRole>(null);
    const [nomeCompleto, setNomeCompleto] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    // Guarda o último user.id consultado para evitar re-fetch por TOKEN_REFRESHED
    // (que cria nova referência de objeto `session` sem trocar de usuário)
    const lastFetchedUserId = useRef<string | null>(null);

    useEffect(() => {
        // Se undefined (ainda carregando sessão), não faz nada
        if (session === undefined) {
            return;
        }

        // Se nulo (deslogado ou sessão inválida)
        if (!session) {
            setRole(null);
            setNomeCompleto(null);
            setLoading(false);
            lastFetchedUserId.current = null;
            return;
        }

        const userId = session.user.id;

        // Evita re-fetch desnecessário quando TOKEN_REFRESHED chega
        // mas o usuário é o mesmo (mesmo user.id)
        if (userId === lastFetchedUserId.current) {
            return;
        }

        let mounted = true;

        const fetchRole = async () => {
            setLoading(true);
            lastFetchedUserId.current = userId;

            try {
                const user = session.user;

                // maybeSingle() retorna null em vez de erro 406 quando não encontra registro
                // Isso evita que latência/replicação cause tratamento de erro desnecessário
                const { data, error } = await supabase
                    .from('iris_usuarios')
                    .select('cargo, nome_completo')
                    .eq('auth_user_id', user.id)
                    .maybeSingle();

                if (!mounted) return;

                if (data) {
                    setRole(data.cargo as UserRole);
                    setNomeCompleto(data.nome_completo);
                } else if (user.email) {
                    // Fallback por email (também com maybeSingle)
                    const { data: fallback } = await supabase
                        .from('iris_usuarios')
                        .select('cargo, nome_completo')
                        .eq('email', user.email)
                        .maybeSingle();

                    if (!mounted) return;

                    if (fallback) {
                        setRole(fallback.cargo as UserRole);
                        setNomeCompleto(fallback.nome_completo);
                    } else {
                        // Perfil não encontrado — NÃO deslogar; pode ser cadastro pendente
                        console.warn('[useUserRole] Perfil não encontrado para usuário:', user.id);
                        setRole(null);
                        setNomeCompleto(null);
                    }
                } else {
                    if (error) {
                        console.warn('[useUserRole] Erro ao buscar perfil:', error.message);
                    }
                    setRole(null);
                    setNomeCompleto(null);
                }
            } catch (err) {
                if (!mounted) return;
                console.error('[useUserRole] Exceção ao buscar cargo:', err);
                // Falha transitória — não resetar user.id para não retentar em loop
                // Apenas manter estado seguro sem redirecionar
                setRole(null);
                setNomeCompleto(null);
            } finally {
                if (mounted) setLoading(false);
            }
        };

        fetchRole();

        return () => {
            mounted = false;
        };

    // Dependência apenas no user.id, não no objeto session inteiro.
    // Isso previne re-disparos por TOKEN_REFRESHED (nova referência, mesmo usuário).
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [session?.user?.id ?? null]);

    return { role, isAdmin: role === 'admin', loading, nomeCompleto };
};
