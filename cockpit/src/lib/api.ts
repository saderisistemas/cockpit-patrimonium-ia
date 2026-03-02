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
    solicitarAnalise: async (id_disparo: string) => {
        // URL do Webhook do Workflow 2 do n8n (Mockada para este MVP Front-end)
        const n8nWebhookUrl = import.meta.env.VITE_N8N_ANALYSE_WEBHOOK_URL;

        if (!n8nWebhookUrl) {
            console.warn("Webhook n8n URL não configurada. Usando mock.");
            await new Promise(r => setTimeout(r, 2000));
            return { status: "mock_success" };
        }

        const response = await fetch(n8nWebhookUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id_disparo, operador_solicitante: 'operador_logado' })
        });

        if (!response.ok) throw new Error('Falha ao comunicar com o agente de IA.');
        return await response.json();
    },

    // Ação em massa para limpar a fila
    limparFila: async () => {
        const { error } = await supabase
            .from('iris_pendencias')
            .update({ status: 'arquivado_cockpit' })
            .eq('status', 'pendente');

        if (error) throw error;
        return true;
    }
};
