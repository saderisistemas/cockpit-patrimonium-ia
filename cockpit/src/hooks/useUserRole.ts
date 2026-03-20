import { useEffect, useState } from 'react';
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
            return;
        }

        const fetchRole = async () => {
            setLoading(true);
            try {
                const user = session.user;
                
                const { data } = await supabase
                    .from('iris_usuarios')
                    .select('cargo, nome_completo')
                    .eq('auth_user_id', user.id)
                    .single();

                if (data) {
                    setRole(data.cargo as UserRole);
                    setNomeCompleto(data.nome_completo);
                } else if (user.email) {
                    // Fallback para email
                    const { data: fallback } = await supabase
                        .from('iris_usuarios')
                        .select('cargo, nome_completo')
                        .eq('email', user.email)
                        .single();
                    if (fallback) {
                        setRole(fallback.cargo as UserRole);
                        setNomeCompleto(fallback.nome_completo);
                    } else {
                        setRole(null);
                        setNomeCompleto(null);
                    }
                }
            } catch (err) {
                console.error('[useUserRole] Erro ao buscar cargo:', err);
                setRole(null);
                setNomeCompleto(null);
            } finally {
                setLoading(false);
            }
        };
        fetchRole();
    }, [session]);

    return { role, isAdmin: role === 'admin', loading, nomeCompleto };
};
