import { supabase } from './supabase';
import type { Database } from '../types/supabase';

export type Pendencia = Database['public']['Tables']['iris_pendencias']['Row'];
export type Analise = Database['public']['Tables']['iris_analises']['Row'];

export const api = {
    // Buscar pendências ativas (status pendente + últimas 2h)
    getPendencias: async () => {
        const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();
        const { data, error } = await supabase
            .from('iris_pendencias')
            .select('*')
            .eq('status', 'pendente')
            .gte('capturado_em', twoHoursAgo)
            .order('prioridade', { ascending: true })
            .order('capturado_em', { ascending: false })
            .limit(200);

        if (error) throw error;
        return data as Pendencia[];
    },

    // Escutar mudanças em tempo real (WebSockets)
    subscribePendencias: (onUpdate: () => void) => {
        return supabase
            .channel('schema-db-changes')
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'iris_pendencias' },
                (payload) => {
                    console.log('Realtime change received!', payload);
                    onUpdate();
                }
            )
            .subscribe();
    },

    // Buscar detalhes do disparo
    getDetalhesDisparo: async (id_disparo: string) => {
        const { data: pendencia, error: err1 } = await supabase
            .from('iris_pendencias')
            .select('*')
            .eq('id_disparo', id_disparo)
            .single();

        if (err1) throw err1;

        const { data: analise, error: err2 } = await supabase
            .from('iris_analises')
            .select('*')
            .eq('id_disparo', id_disparo)
            .maybeSingle();

        if (err2) throw err2;

        return { pendencia: pendencia as Pendencia, analise: analise as Analise | null };
    },

    // Webhook n8n para pedir análise via IA
    // POST direto ao webhook do N8N via proxy Vite (dev) / Netlify (prod).
    // O proxy encaminha /webhook/* → https://patrimonium-n8n.cloudfy.live/webhook/*
    solicitarAnalise: async (pendencia: Pendencia) => {
        const payload = {
            id_disparo: pendencia.id_disparo,
            evento_codigo: pendencia.evento_codigo,
            descricao: pendencia.descricao_catalogo || pendencia.desc_evento || pendencia.agrupamento || "Disparo de alarme",
            prioridade: pendencia.prioridade,
            plano: pendencia.plano_extraido || "BÁSICO",
            cliente: pendencia.nome,
            patrimonio: pendencia.patrimonio,
            operador_solicitante: 'operador_logado'
        };

        console.log('[IRIS] Disparando análise via webhook N8N para id:', pendencia.id_disparo);

        const response = await fetch('/webhook/iris-analisar', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        });

        if (!response.ok) {
            const text = await response.text().catch(() => '');
            console.error('[IRIS] Erro no webhook:', response.status, text);
            throw new Error(`Webhook retornou ${response.status}: ${text}`);
        }

        console.log('[IRIS] Webhook disparado com sucesso - N8N vai processar');
        return { status: "dispatched" };
    },

    // Ação em massa para limpar a fila
    limparFila: async () => {
        const { error } = await supabase
            .from('iris_pendencias')
            .update({ status: 'arquivado_cockpit' })
            .eq('status', 'pendente');

        if (error) throw error;
        return true;
    },

    // === GESTÃO DE USUÁRIOS (Admin) ===

    listUsuarios: async () => {
        const { data, error } = await supabase
            .from('iris_usuarios')
            .select('*')
            .order('criado_em', { ascending: false });
        if (error) throw error;
        return data;
    },

    criarUsuario: async (params: { email: string; password: string; nome_completo: string; cargo: string }) => {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) throw new Error('Sessão expirada');

        const res = await fetch(
            `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/criar-usuario`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session.access_token}`,
                    'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
                },
                body: JSON.stringify(params),
            }
        );
        const body = await res.json();
        if (!res.ok) throw new Error(body.error || 'Erro ao criar usuário');
        return body;
    },

    toggleUsuarioAtivo: async (id: string, ativo: boolean) => {
        const { error } = await supabase
            .from('iris_usuarios')
            .update({ ativo, atualizado_em: new Date().toISOString() })
            .eq('id', id);
        if (error) throw error;
        return true;
    },
};
