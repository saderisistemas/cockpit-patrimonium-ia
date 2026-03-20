import { supabase } from './supabase';
import type { Database } from '../types/supabase';

export type Pendencia = Database['public']['Tables']['iris_pendencias']['Row'] & {
    analise_abrir_os?: boolean;
};
export type Analise = Database['public']['Tables']['iris_analises']['Row'];
export type OrdemServico = Database['public']['Tables']['iris_ordens_servico']['Row'];

export const api = {
    // Buscar pendências ativas (status pendente + últimas 24h)
    getPendencias: async () => {
        const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
        console.log('[api.getPendencias] Iniciando select from iris_pendencias (1 dia atrás: ' + oneDayAgo + ')');
        
        const startTime = Date.now();
        const { data, error } = await supabase
            .from('iris_pendencias')
            .select('*')
            .eq('status', 'pendente')
            .gte('capturado_em', oneDayAgo)
            .order('prioridade', { ascending: true })
            .order('capturado_em', { ascending: false })
            .limit(200);

        console.log(`[api.getPendencias] Retorno Supabase em ${Date.now() - startTime}ms. Data length: ${data?.length || 0}. Error: `, error);
        
        if (error) throw error;
        
        let pendencias = data as Pendencia[];
        
        if (pendencias.length > 0) {
            const idsDisparo = pendencias.map(p => p.id_disparo);
            const { data: analises } = await supabase
                .from('iris_analises')
                .select('id_disparo, evento_enriquecido')
                .in('id_disparo', idsDisparo);
                
            if (analises && analises.length > 0) {
                const mapAnalises = new Map();
                analises.forEach(a => {
                    let abrirOs = false;
                    try {
                        if (a.evento_enriquecido && typeof a.evento_enriquecido === 'object') {
                            abrirOs = !!(a.evento_enriquecido as any).abrir_os;
                        }
                    } catch(e) {}
                    mapAnalises.set(a.id_disparo, abrirOs);
                });
                
                pendencias = pendencias.map(p => ({
                    ...p,
                    analise_abrir_os: mapAnalises.get(p.id_disparo) || false
                }));
            }
        }
        
        return pendencias;
    },

    // Escutar mudanças em tempo real (WebSockets)
    subscribePendencias: (onUpdate: (payload?: { eventType: string; new?: Pendencia }) => void) => {
        return supabase
            .channel('schema-db-changes')
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'iris_pendencias' },
                (payload) => {
                    console.log('Realtime change received!', payload);
                    onUpdate({
                        eventType: payload.eventType,
                        new: payload.new as Pendencia | undefined,
                    });
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
        const descricao_formatada = (await import('./eventUtils')).getEventDescription(pendencia.evento_codigo, pendencia.descricao_catalogo, pendencia.desc_evento, pendencia.agrupamento || "Disparo de alarme");

        const payload = {
            id_disparo: pendencia.id_disparo,
            evento_codigo: pendencia.evento_codigo,
            descricao: descricao_formatada,
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

    // === RELATÓRIOS & KPIs ===

    fetchPendenciasReport: async (period: number | { start: string, end: string } = 7, eventCode?: string) => {
        let since = '';
        let until = '';

        if (typeof period === 'number') {
            const sinceDate = new Date();
            if (period === 1) {
                sinceDate.setHours(0, 0, 0, 0); // Midnight today
            } else {
                sinceDate.setDate(sinceDate.getDate() - period);
            }
            since = sinceDate.toISOString().split('T')[0];
        } else {
            since = period.start;
            until = period.end;
        }

        let allData: any[] = [];
        let page = 0;
        const pageSize = 1000;
        let hasMore = true;

        while (hasMore) {
            let query = supabase
                .from('iris_pendencias')
                .select('id_disparo,id_cliente,patrimonio,nome,prioridade,data_evento,hora_evento,evento_codigo,desc_evento,descricao_catalogo,zona,setor,status')
                .gte('data_evento', since)
                .order('data_evento', { ascending: false })
                .range(page * pageSize, (page + 1) * pageSize - 1);

            if (until) {
                const untilWithTime = until.includes('T') || until.includes(' ') ? until : `${until} 23:59:59`;
                query = query.lte('data_evento', untilWithTime);
            }

            if (eventCode) {
                query = query.eq('evento_codigo', eventCode);
            }

            const { data, error } = await query;

            if (error) throw error;

            if (data && data.length > 0) {
                allData = [...allData, ...data];
                if (data.length < pageSize) {
                    hasMore = false;
                } else {
                    page++;
                }
            } else {
                hasMore = false;
            }
        }
        return allData;
    },

    fetchAnalisesReport: async (period: number | { start: string, end: string } = 7) => {
        let since = '';
        let until = '';

        if (typeof period === 'number') {
            const sinceDate = new Date();
            if (period === 1) {
                sinceDate.setHours(0, 0, 0, 0);
            } else {
                sinceDate.setDate(sinceDate.getDate() - period);
            }
            since = sinceDate.toISOString();
        } else {
            since = new Date(`${period.start}T00:00:00-03:00`).toISOString();
            until = new Date(`${period.end}T23:59:59-03:00`).toISOString();
        }

        let allData: any[] = [];
        let page = 0;
        const pageSize = 1000;
        let hasMore = true;

        while (hasMore) {
            let query = supabase
                .from('iris_analises')
                .select('id,id_disparo,score,plano_utilizado,criado_em')
                .gte('criado_em', since)
                .order('criado_em', { ascending: false })
                .range(page * pageSize, (page + 1) * pageSize - 1);

            if (until) {
                query = query.lte('criado_em', until);
            }

            const { data, error } = await query;

            if (error) throw error;

            if (data && data.length > 0) {
                allData = [...allData, ...data];
                if (data.length < pageSize) hasMore = false;
                else page++;
            } else {
                hasMore = false;
            }
        }
        return allData;
    },

    // === ORDENS DE SERVIÇO ===

    getOrdensServico: async (filters?: { status_os?: string; prioridade_os?: string; tipo_os?: string }) => {
        let query = supabase
            .from('iris_ordens_servico')
            .select('*')
            .order('criado_em', { ascending: false })
            .limit(500);

        if (filters?.status_os) {
            query = query.eq('status_os', filters.status_os);
        }
        if (filters?.prioridade_os) {
            query = query.eq('prioridade_os', filters.prioridade_os);
        }
        if (filters?.tipo_os) {
            query = query.eq('tipo_os', filters.tipo_os);
        }

        const { data, error } = await query;
        if (error) throw error;
        return data as OrdemServico[];
    },

    subscribeOrdensServico: (onUpdate: () => void) => {
        return supabase
            .channel('ordens-servico-realtime')
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'iris_ordens_servico' },
                () => {
                    onUpdate();
                }
            )
            .subscribe();
    },

    getOrdemServicoById: async (id: string) => {
        const { data, error } = await supabase
            .from('iris_ordens_servico')
            .select('*')
            .eq('id', id)
            .single();
        if (error) throw error;
        return data as OrdemServico;
    },

    updateOrdemServico: async (id: string, campos: Partial<Database['public']['Tables']['iris_ordens_servico']['Update']>) => {
        const { error } = await supabase
            .from('iris_ordens_servico')
            .update({ ...campos, atualizado_em: new Date().toISOString() })
            .eq('id', id);
        if (error) throw error;
        return true;
    },

    // === CONFIG AUTO-ANÁLISE E130 ===

    getAutoAnaliseE130: async (): Promise<boolean> => {
        const { data, error } = await supabase
            .from('iris_config')
            .select('valor')
            .eq('chave', 'auto_analise_e130')
            .single();
        if (error) {
            console.warn('[IRIS] Falha ao ler config auto_analise_e130:', error.message);
            return false;
        }
        return data?.valor === true || data?.valor === 'true';
    },

    setAutoAnaliseE130: async (ativo: boolean): Promise<boolean> => {
        const { error } = await supabase
            .from('iris_config')
            .update({ valor: ativo, atualizado_em: new Date().toISOString() })
            .eq('chave', 'auto_analise_e130');
        if (error) throw error;
        return true;
    },

    subscribeConfig: (onUpdate: (chave: string, valor: unknown) => void) => {
        return supabase
            .channel('config-realtime')
            .on(
                'postgres_changes',
                { event: 'UPDATE', schema: 'public', table: 'iris_config' },
                (payload) => {
                    const row = payload.new as { chave: string; valor: unknown };
                    onUpdate(row.chave, row.valor);
                }
            )
            .subscribe();
    },

    // Verificar se um disparo já possui análise (evitar duplicatas)
    existeAnalise: async (id_disparo: string): Promise<boolean> => {
        const { data, error } = await supabase
            .from('iris_analises')
            .select('id')
            .eq('id_disparo', id_disparo)
            .maybeSingle();
        if (error) {
            console.warn('[IRIS] Erro ao verificar análise existente:', error.message);
            return false;
        }
        return !!data;
    },
};
