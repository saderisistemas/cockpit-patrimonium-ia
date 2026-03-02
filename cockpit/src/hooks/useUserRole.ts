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
                if (!user) { setLoading(false); return; }

                const { data } = await supabase
                    .from('iris_usuarios')
                    .select('cargo, nome_completo')
                    .eq('auth_user_id', user.id)
                    .single();

                if (data) {
                    setRole(data.cargo as UserRole);
                    setNomeCompleto(data.nome_completo);
                }
            } catch (err) {
                console.error('Erro ao buscar cargo:', err);
            } finally {
                setLoading(false);
            }
        };
        fetchRole();
    }, []);

    return { role, isAdmin: role === 'admin', loading, nomeCompleto };
};
