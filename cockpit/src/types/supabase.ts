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
                    id_analise: string;
                    id_disparo: string;
                    score: number | null;
                    hipotese: string | null;
                    acao_recomendada: string | null;
                    evidencias: Json | null;
                    agrupamento: string | null;
                    analisado_em: string | null;
                    operador_solicitante: string | null;
                    plano_utilizado: string | null;
                    evento_enriquecido: Json | null;
                };
                Insert: {
                    id_analise?: string;
                    id_disparo: string;
                    score?: number | null;
                    hipotese?: string | null;
                    acao_recomendada?: string | null;
                    evidencias?: Json | null;
                    agrupamento?: string | null;
                    analisado_em?: string | null;
                    operador_solicitante?: string | null;
                };
                Update: {
                    id_analise?: string;
                    id_disparo?: string;
                    score?: number | null;
                    hipotese?: string | null;
                    acao_recomendada?: string | null;
                    evidencias?: Json | null;
                    agrupamento?: string | null;
                    analisado_em?: string | null;
                    operador_solicitante?: string | null;
                    plano_utilizado?: string | null;
                    evento_enriquecido?: Json | null;
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