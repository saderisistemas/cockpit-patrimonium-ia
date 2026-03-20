export type Json =
    | string
    | number
    | boolean
    | null
    | { [key: string]: Json | undefined }
    | Json[]

export interface Database {
    public: {
        Tables: {
            iris_pendencias: {
                Row: {
                    id_disparo: string;
                    id_cliente: string;
                    nome: string;
                    patrimonio: string | null;
                    endereco: string | null;
                    evento_codigo: string;
                    desc_evento: string | null;
                    zona: string | null;
                    setor: string | null;
                    viatura: string | null;
                    status_atendimento: number | null;
                    data_evento: string;
                    hora_evento: string;
                    particao: string | null;
                    prioridade: string | null;
                    capturado_em: string | null;
                    status: string | null;
                    agrupamento: string | null;
                    permite_retardo: boolean | null;
                    pode_retardar: boolean | null;
                    tem_camera: boolean | null;
                    contagem: number | null;
                    atender_ate: string | null;
                    operador_disparo: string | null;
                    plano_extraido: string | null;
                    descricao_catalogo: string | null;
                };
                Insert: {
                    id_disparo: string;
                    id_cliente: string;
                    nome: string;
                    patrimonio?: string | null;
                    endereco?: string | null;
                    evento_codigo: string;
                    data_evento: string;
                    hora_evento: string;
                    particao?: string | null;
                    prioridade?: string | null;
                    capturado_em?: string | null;
                    status?: string | null;
                    agrupamento?: string | null;
                };
                Update: {
                    id_disparo?: string;
                    id_cliente?: string;
                    nome?: string;
                    patrimonio?: string | null;
                    endereco?: string | null;
                    evento_codigo?: string;
                    desc_evento?: string | null;
                    zona?: string | null;
                    setor?: string | null;
                    viatura?: string | null;
                    status_atendimento?: number | null;
                    data_evento?: string;
                    hora_evento?: string;
                    particao?: string | null;
                    prioridade?: string | null;
                    capturado_em?: string | null;
                    status?: string | null;
                    agrupamento?: string | null;
                };
            };
            iris_analises: {
                Row: {
                    id: string;
                    id_disparo: string;
                    score: number | null;
                    hipotese: string | null;
                    acao_recomendada: string | null;
                    evidencias: Json | null;
                    agrupamento: string | null;
                    criado_em: string | null;
                    operador_solicitante: string | null;
                    plano_utilizado: string | null;
                    evento_enriquecido: Json | null;
                };
                Insert: {
                    id?: string;
                    id_disparo: string;
                    score?: number | null;
                    hipotese?: string | null;
                    acao_recomendada?: string | null;
                    evidencias?: Json | null;
                    agrupamento?: string | null;
                    criado_em?: string | null;
                    operador_solicitante?: string | null;
                };
                Update: {
                    id?: string;
                    id_disparo?: string;
                    score?: number | null;
                    hipotese?: string | null;
                    acao_recomendada?: string | null;
                    evidencias?: Json | null;
                    agrupamento?: string | null;
                    criado_em?: string | null;
                    operador_solicitante?: string | null;
                    plano_utilizado?: string | null;
                    evento_enriquecido?: Json | null;
                };
            };
            iris_ordens_servico: {
                Row: {
                    id: string;
                    id_disparo: string;
                    id_cliente: string;
                    patrimonio: string | null;
                    patrimonio_normalizado: string | null;
                    endereco: string | null;
                    codigo_evento: string | null;
                    descricao_evento: string | null;
                    zona: string | null;
                    tipo_os: string | null;
                    categoria_os: string | null;
                    motivo_os: string | null;
                    prioridade_os: string | null;
                    status_os: string | null;
                    origem: string | null;
                    criado_em: string | null;
                    atualizado_em: string | null;
                    tecnico_responsavel: string | null;
                    data_visita: string | null;
                    data_conclusao: string | null;
                    observacao_tecnica: string | null;
                    solucao_aplicada: string | null;
                    pecas_utilizadas: string | null;
                    numero_os_service: string | null;
                    requer_retorno: boolean | null;
                    // --- Campos Enriquecimento IA ---
                    grau_suspeita: string | null;
                    score_ia: number | null;
                    hipotese_ia: string | null;
                    regra_suspeita_aplicada: string | null;
                    e130_total_7d: number | null;
                    e130_descartados_9013_5m_7d: number | null;
                    e130_validos_sensor_7d: number | null;
                    dias_distintos_e130_validos_7d: number | null;
                };
                Insert: {
                    id?: string;
                    id_disparo: string;
                    id_cliente: string;
                    patrimonio?: string | null;
                    patrimonio_normalizado?: string | null;
                    endereco?: string | null;
                    codigo_evento?: string | null;
                    descricao_evento?: string | null;
                    zona?: string | null;
                    tipo_os?: string | null;
                    categoria_os?: string | null;
                    motivo_os?: string | null;
                    prioridade_os?: string | null;
                    status_os?: string | null;
                    origem?: string | null;
                    tecnico_responsavel?: string | null;
                    data_visita?: string | null;
                    data_conclusao?: string | null;
                    observacao_tecnica?: string | null;
                    solucao_aplicada?: string | null;
                    pecas_utilizadas?: string | null;
                    numero_os_service?: string | null;
                    requer_retorno?: boolean | null;
                    // --- Campos Enriquecimento IA ---
                    grau_suspeita?: string | null;
                    score_ia?: number | null;
                    hipotese_ia?: string | null;
                    regra_suspeita_aplicada?: string | null;
                    e130_total_7d?: number | null;
                    e130_descartados_9013_5m_7d?: number | null;
                    e130_validos_sensor_7d?: number | null;
                    dias_distintos_e130_validos_7d?: number | null;
                };
                Update: {
                    id?: string;
                    id_disparo?: string;
                    id_cliente?: string;
                    patrimonio?: string | null;
                    patrimonio_normalizado?: string | null;
                    endereco?: string | null;
                    codigo_evento?: string | null;
                    descricao_evento?: string | null;
                    zona?: string | null;
                    tipo_os?: string | null;
                    categoria_os?: string | null;
                    motivo_os?: string | null;
                    prioridade_os?: string | null;
                    status_os?: string | null;
                    origem?: string | null;
                    atualizado_em?: string | null;
                    tecnico_responsavel?: string | null;
                    data_visita?: string | null;
                    data_conclusao?: string | null;
                    observacao_tecnica?: string | null;
                    solucao_aplicada?: string | null;
                    pecas_utilizadas?: string | null;
                    numero_os_service?: string | null;
                    requer_retorno?: boolean | null;
                    // --- Campos Enriquecimento IA ---
                    grau_suspeita?: string | null;
                    score_ia?: number | null;
                    hipotese_ia?: string | null;
                    regra_suspeita_aplicada?: string | null;
                    e130_total_7d?: number | null;
                    e130_descartados_9013_5m_7d?: number | null;
                    e130_validos_sensor_7d?: number | null;
                    dias_distintos_e130_validos_7d?: number | null;
                };
            };
            iris_config: {
                Row: {
                    chave: string;
                    valor: boolean | string | number | Record<string, unknown>;
                    atualizado_em: string | null;
                };
                Insert: {
                    chave: string;
                    valor?: boolean | string | number | Record<string, unknown>;
                    atualizado_em?: string | null;
                };
                Update: {
                    chave?: string;
                    valor?: boolean | string | number | Record<string, unknown>;
                    atualizado_em?: string | null;
                };
            };
        };
        Views: {
            [_ in never]: never;
        };
        Functions: {
            [_ in never]: never;
        };
        Enums: {
            [_ in never]: never;
        };
        CompositeTypes: {
            [_ in never]: never;
        };
    };
}