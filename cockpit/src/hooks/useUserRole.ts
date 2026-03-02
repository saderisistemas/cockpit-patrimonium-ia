import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

type UserRole = 'admin' | 'operador' | null;

interface UseUserRoleReturn {
    role: UserRole;
    isAdmin: boolean;
    loading: boolean;
    nomeCompleto: string | null;
}

export const useUserRole = (): UseUserRoleReturn => {
    const [role, setRole] = useState<UserRole>(null);
    const [nomeCompleto, setNomeCompleto] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchRole = async () => {
            try {
                const { data: { user } } = await supabase.auth.getUser();
                console.log('[useUserRole] auth user:', user?.id, user?.email);
                if (!user) { setLoading(false); return; }

                // Try by auth_user_id first
                const { data, error } = await supabase
                    .from('iris_usuarios')
                    .select('cargo, nome_completo')
                    .eq('auth_user_id', user.id)
                    .single();

                console.log('[useUserRole] query result:', { data, error });

                if (data) {
                    setRole(data.cargo as UserRole);
                    setNomeCompleto(data.nome_completo);
                } else if (user.email) {
                    // Fallback: try by email
                    const { data: fallback, error: fallbackErr } = await supabase
                        .from('iris_usuarios')
                        .select('cargo, nome_completo')
                        .eq('email', user.email)
                        .single();
                    console.log('[useUserRole] email fallback:', { fallback, fallbackErr });
                    if (fallback) {
                        setRole(fallback.cargo as UserRole);
                        setNomeCompleto(fallback.nome_completo);
                    }
                }
            } catch (err) {
                console.error('[useUserRole] Erro ao buscar cargo:', err);
            } finally {
                setLoading(false);
            }
        };
        fetchRole();
    }, []);

    return { role, isAdmin: role === 'admin', loading, nomeCompleto };
};
