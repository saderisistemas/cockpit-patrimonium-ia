import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { BrainCircuit, ShieldAlert, Activity, Crosshair, Building2, Tag } from 'lucide-react';
import logo from '../assets/logo.png';
import type { Pendencia } from '../lib/api';
import { getEventColors } from '../lib/eventColors';
import { getEventDescription } from '../lib/eventUtils';

interface AnaliseTV {
    id: string;
    id_disparo: string;
    hipotese: string;
    acao_recomendada: string;
    score: number;
    evidencias: any;
    criado_em: string;
    plano_utilizado: string;
}

// Helper para traduzir o plano
const getPlanoLabel = (plano: string) => {
    switch (plano) {
        case '1000': return 'Bronze';
        case '2000': return 'Prata';
        case '3000': return 'Ouro';
        case '4000': return 'Platina';
        case '5000': return 'Diamante';
        default: return 'Geral';
    }
};

const getScoreColor = (score: number) => {
    if (score >= 70) return { bg: 'from-brand-red/20 to-brand-dark', text: 'text-brand-red', border: 'border-brand-red/30', glow: 'shadow-brand-red/20', label: 'Risco Crítico' };
    if (score >= 40) return { bg: 'from-orange-500/20 to-brand-dark', text: 'text-orange-500', border: 'border-orange-500/30', glow: 'shadow-orange-500/20', label: 'Risco Moderado' };
    return { bg: 'from-emerald-500/20 to-brand-dark', text: 'text-emerald-500', border: 'border-emerald-500/30', glow: 'shadow-emerald-500/20', label: 'Situação Normal' };
};

const formatTime = (isoString: string) => {
    return new Date(isoString).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
};

const formatDate = (isoString: string) => {
    return new Date(isoString).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
};

type PendenciaSimples = Pick<Pendencia, 'id_disparo' | 'nome' | 'patrimonio' | 'endereco' | 'evento_codigo' | 'desc_evento' | 'descricao_catalogo' | 'hora_evento' | 'data_evento' | 'setor' | 'viatura' | 'particao' | 'zona' | 'agrupamento' | 'prioridade'>;

export const TVCockpit = () => {
    const [analises, setAnalises] = useState<(AnaliseTV & { pendencia?: PendenciaSimples })[]>([]);
    const [isNew, setIsNew] = useState(false);
    const [currentTime, setCurrentTime] = useState(new Date());
    const [totalCriticos, setTotalCriticos] = useState(0);
    const [totalPendentes, setTotalPendentes] = useState(0);

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    const fetchAnalises = async () => {
        const { data, error } = await supabase
            .from('iris_analises')
            .select('*')
            .order('criado_em', { ascending: false })
            .limit(5);

        if (error) { console.error('Erro ao buscar análises:', error); return; }
        if (!data || data.length === 0) return;

        const enriched = await Promise.all(
            data.map(async (analise: AnaliseTV) => {
                const { data: pend } = await supabase
                    .from('iris_pendencias')
                    .select('id_disparo, nome, patrimonio, endereco, evento_codigo, desc_evento, descricao_catalogo, hora_evento, data_evento, setor, viatura, particao, zona, agrupamento, prioridade')
                    .eq('id_disparo', analise.id_disparo)
                    .maybeSingle();
                return { ...analise, pendencia: pend || undefined };
            })
        );

        setAnalises(enriched);
    };

    const fetchKPIs = async () => {
        const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();
        const { data } = await supabase
            .from('iris_pendencias')
            .select('prioridade, evento_codigo')
            .eq('status', 'pendente')
            .gte('capturado_em', twoHoursAgo);

        if (data) {
            const criticos = data.filter(p => {
                const prio = Number(p.prioridade);
                return prio === 0 || prio === 1 || p.evento_codigo === '9704';
            }).length;
            setTotalCriticos(criticos);
            setTotalPendentes(data.length);
        }
    };

    useEffect(() => {
        fetchAnalises();
        fetchKPIs();

        const subscription = supabase
            .channel('tv-analises-realtime')
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'iris_analises' }, () => {
                setIsNew(true);
                fetchAnalises();
                fetchKPIs();
                setTimeout(() => setIsNew(false), 5000);
            })
            .subscribe();

        const pendSub = supabase
            .channel('tv-pendencias-realtime')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'iris_pendencias' }, () => { fetchKPIs(); })
            .subscribe();

        const kpiTimer = setInterval(fetchKPIs, 30000);

        return () => {
            subscription.unsubscribe();
            pendSub.unsubscribe();
            clearInterval(kpiTimer);
        };
    }, []);

    const latest = analises[0];
    const previous = analises.slice(1, 5);

    // Obter cores de acordo com a prioridade/evento se o 'latest' tiver dados de pendência
    const colors = latest?.pendencia ? getEventColors(latest.pendencia.evento_codigo, latest.pendencia.prioridade ?? 5) : getEventColors();

    return (
        <div className="fixed inset-0 bg-[#050508] text-white overflow-hidden" style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>
            {/* SCANLINES */}
            <div className="fixed inset-0 pointer-events-none z-50 opacity-[0.03]"
                style={{ background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.03) 2px, rgba(255,255,255,0.03) 4px)' }} />

            {/* CORNER ACCENTS */}
            <div className="fixed top-0 left-0 w-16 h-16 border-t-2 border-l-2 border-red-500/30 z-40" />
            <div className="fixed top-0 right-0 w-16 h-16 border-t-2 border-r-2 border-red-500/30 z-40" />
            <div className="fixed bottom-0 left-0 w-16 h-16 border-b-2 border-l-2 border-red-500/30 z-40" />
            <div className="fixed bottom-0 right-0 w-16 h-16 border-b-2 border-r-2 border-red-500/30 z-40" />

            {/* TOP BAR — Bigger */}
            <div className="h-24 border-b border-white/5 bg-black/40 backdrop-blur-xl flex items-center justify-between px-8 relative z-30">
                <div className="flex items-center gap-6">
                    <img src={logo} alt="Patrimonium" className="h-16 drop-shadow-lg" />
                    <div>
                        <div className="text-3xl font-black italic tracking-wider">
                            <span className="text-white">COCKPIT</span> <span className="text-red-500">IRIS TV</span>
                        </div>
                        <div className="text-sm font-black text-slate-500 uppercase tracking-[0.4em]">
                            Central Operacional Tática Inteligente
                        </div>
                    </div>
                </div>

                <div className="text-center">
                    <div className="flex items-center gap-3">
                        <span className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse" />
                        <span className="text-base font-black text-emerald-500 uppercase tracking-[0.3em] drop-shadow-sm">Monitoramento 24h</span>
                    </div>
                </div>

                <div className="flex items-center gap-10">
                    <div className="flex gap-8">
                        <div className="text-right">
                            <div className="text-xs font-black text-slate-500 uppercase tracking-widest">Críticos</div>
                            <div className="text-4xl font-black text-red-500 tabular-nums leading-none">{totalCriticos}</div>
                        </div>
                        <div className="w-px bg-white/10" />
                        <div className="text-right">
                            <div className="text-xs font-black text-slate-500 uppercase tracking-widest">Pendentes</div>
                            <div className="text-4xl font-black text-white tabular-nums leading-none">{totalPendentes}</div>
                        </div>
                    </div>
                    <div className="text-right">
                        <div className="text-5xl font-black tabular-nums font-mono text-white/90 drop-shadow-md">{currentTime.toLocaleTimeString('pt-BR')}</div>
                        <div className="text-sm text-white/40 font-mono tracking-wider">{currentTime.toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' })}</div>
                    </div>
                </div>
            </div>

            {/* MAIN CONTENT */}
            <div className="h-[calc(100vh-6rem)] flex">
                {/* LEFT — LATEST ANALYSIS */}
                <div className="flex-1 p-8 flex flex-col">
                    {!latest ? (
                        <div className="flex-1 flex flex-col items-center justify-center text-center">
                            <BrainCircuit className="w-40 h-40 text-white/5 mb-10" />
                            <h2 className="text-5xl font-black text-white/30 uppercase tracking-tight italic mb-4">Aguardando Análise</h2>
                            <p className="text-xl text-white/15 font-medium max-w-lg">
                                O painel será atualizado automaticamente quando um operador solicitar uma análise de IA profunda.
                            </p>
                            <div className="mt-10 flex items-center gap-3">
                                <Activity className="w-6 h-6 text-purple-500 animate-pulse" />
                                <span className="text-base text-purple-500/60 font-black uppercase tracking-[0.3em]">IA em Stand-by</span>
                            </div>
                        </div>
                    ) : (
                        <>
                            {/* HEADER - "ANÁLISE POR INTELIGÊNCIA ARTIFICIAL" */}
                            <div className={`mb-5 flex items-center gap-5 ${isNew ? 'animate-pulse' : ''}`}>
                                <BrainCircuit className={`w-10 h-10 ${colors.textColor}`} />
                                <h2 className="text-4xl font-black uppercase tracking-widest italic drop-shadow-md">
                                    ANÁLISE <span className={colors.textColor}>POR IA</span>
                                </h2>
                                <span className="text-lg font-mono text-white/30 ml-auto border border-white/5 bg-black/20 px-4 py-1 rounded-xl">
                                    {formatTime(latest.criado_em)} • {formatDate(latest.criado_em)}
                                </span>
                            </div>

                            {/* SCORE + EVENT INFO */}
                            <div className={`flex flex-col gap-6 mb-6 ${isNew ? 'animate-in slide-in-from-left duration-700' : ''}`}>

                                {/* TOPO DESTAQUE MÁXIMO: Cliente e Evento */}
                                <div className={`bg-black/30 border-l-[8px] ${colors.borderColor} border-t border-r border-b border-white/5 rounded-3xl p-6 flex justify-between items-center shadow-lg relative overflow-hidden`}>
                                    <div className={`absolute right-0 top-0 bottom-0 w-1/3 bg-gradient-to-l ${colors.bgColor} to-transparent pointer-events-none opacity-50`} />

                                    <div className="flex-1 space-y-2 z-10">
                                        <div className={`flex items-center gap-3 mb-1 ${colors.textColor} opacity-80`}>
                                            <Building2 className="w-6 h-6" />
                                            <span className="text-2xl font-black uppercase tracking-[0.2em]">Cliente & Patrimônio</span>
                                        </div>
                                        <div className="flex items-end gap-4">
                                            <span className="text-6xl font-black text-white italic leading-none">{latest.pendencia?.nome || "CLIENTE NÃO IDENTIFICADO"}</span>
                                            {latest.pendencia?.patrimonio && (
                                                <span className="text-4xl font-bold text-white/50 bg-white/10 px-4 py-1 rounded-xl border border-white/10 mb-1 shadow-inner">
                                                    Cod: {latest.pendencia?.patrimonio}
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    <div className="text-right z-10 space-y-2 border-l border-white/10 pl-8 ml-8">
                                        <div className={`flex items-center gap-2 justify-end mb-1 ${colors.textColor}`}>
                                            <Crosshair className="w-6 h-6" />
                                            <span className="text-2xl font-black uppercase tracking-[0.2em]">Evento Capturado</span>
                                        </div>
                                        <div className="flex flex-col items-end">
                                            <span className="text-6xl font-black text-white italic leading-none">{latest.pendencia?.evento_codigo || "---"}</span>
                                            <span className={`text-3xl font-bold mt-2 ${colors.textColor}`}>{getEventDescription(latest.pendencia?.evento_codigo, latest.pendencia?.descricao_catalogo, latest.pendencia?.desc_evento, "Processando Descrição...")}</span>
                                            {(latest.pendencia?.zona || latest.pendencia?.particao) && (
                                                <span className="text-lg font-mono text-white/40 mt-1 bg-white/5 px-3 py-0.5 rounded-lg border border-white/10">Zona: {latest.pendencia.zona || latest.pendencia.particao}</span>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* MEIO: Score e Veredito IA em Lado a Lado para Máximo Impacto */}
                                <div className="flex gap-4">
                                    {/* Score — MAXIMUM SIZE */}
                                    <div className={`w-72 shrink-0 bg-gradient-to-br ${getScoreColor(latest.score).bg} ${getScoreColor(latest.score).border} border rounded-3xl p-4 flex flex-col items-center justify-center shadow-2xl ${getScoreColor(latest.score).glow} relative overflow-hidden`}>
                                        <BrainCircuit className="absolute -right-8 -top-8 w-40 h-40 opacity-10" />
                                        <div className={`text-[8.5rem] font-black ${getScoreColor(latest.score).text} tabular-nums leading-none tracking-tighter`}>{latest.score}</div>
                                        <div className="text-lg font-black uppercase tracking-[0.2em] text-white/50 mt-2">Score de Risco</div>
                                        <div className={`text-xl font-black uppercase tracking-[0.15em] text-center mt-1 ${getScoreColor(latest.score).text}`}>
                                            {getScoreColor(latest.score).label}
                                        </div>
                                    </div>

                                    {/* Veredito IA Gigante - COM CORES DINAMICAS */}
                                    <div className={`flex-1 flex flex-col justify-center ${colors.bgColor} border-l-[12px] ${colors.borderColor} rounded-r-3xl p-8 ${colors.shadowColor} relative transition-all duration-500`}>
                                        <div className="absolute right-6 bottom-6 border border-white/10 px-4 py-2 bg-black/40 rounded-xl backdrop-blur-md">
                                            {latest.plano_utilizado && (
                                                <div className={`flex items-center gap-2 opacity-80 ${colors.textColor}`}>
                                                    <Tag className="w-5 h-5" />
                                                    <span className="font-bold text-lg uppercase tracking-wider">
                                                        Motor {latest.plano_utilizado} — {getPlanoLabel(latest.plano_utilizado)}
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                        <div className={`text-2xl font-black ${colors.textColor} uppercase tracking-[0.2em] mb-4 drop-shadow-sm`}>Veredito da Inteligência Artificial</div>
                                        <div className="text-white font-bold text-4xl leading-tight line-clamp-4 pr-40 drop-shadow-md">{latest.hipotese}</div>
                                    </div>
                                </div>

                                {/* ACTION + EVIDENCE — TV BOTTOM SECTION */}
                                <div className="grid grid-cols-2 gap-4 flex-1 min-h-0">
                                    <div className="bg-white/[0.02] border border-white/5 rounded-3xl p-6 flex flex-col shadow-inner overflow-hidden">
                                        <div className="text-xl font-black text-slate-500 uppercase tracking-[0.3em] mb-4 flex items-center gap-3 shrink-0">
                                            <ShieldAlert className={`w-7 h-7 ${colors.textColor}`} /> Diretriz Sistêmica (Ação Recomendada)
                                        </div>
                                        <div className={`text-white/90 ${colors.bgColor} font-bold text-[1.65rem] leading-snug flex-1 p-5 rounded-2xl border border-white/10 content-start overflow-y-auto custom-scrollbar`}>
                                            {latest.acao_recomendada}
                                        </div>
                                    </div>

                                    <div className="bg-white/[0.02] border border-white/5 rounded-3xl p-6 flex flex-col shadow-inner overflow-hidden">
                                        <div className="text-xl font-black text-slate-500 uppercase tracking-[0.3em] mb-4 shrink-0">Fatos Encontrados (Evidências)</div>
                                        <div className="space-y-3 flex-1 overflow-y-auto custom-scrollbar pr-2">
                                            {latest.evidencias && Array.isArray(latest.evidencias) && latest.evidencias.map((ev: any, i: number) => (
                                                <div key={i} className="flex gap-4 text-[1.4rem] items-start bg-white/[0.03] p-4 rounded-xl border border-white/5 hover:bg-white/[0.05] transition-colors">
                                                    <span className={`${colors.textColor} font-black shrink-0 mt-0.5 drop-shadow`}>[E{i + 1}]</span>
                                                    <span className="text-white/80 font-medium leading-normal">{typeof ev === 'string' ? ev : ev.dado || JSON.stringify(ev)}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </>
                    )}
                </div>

                {/* RIGHT SIDEBAR — BIGGER */}
                <div className="w-[400px] border-l border-white/5 bg-black/30 flex flex-col">
                    <div className="p-5 border-b border-white/5 bg-white/[0.02]">
                        <div className="text-lg font-black text-slate-500 uppercase tracking-[0.3em] shadow-sm">Atividades Recentes</div>
                    </div>
                    <div className="flex-1 overflow-hidden">
                        {previous.length === 0 && (
                            <div className="p-8 text-center text-white/10 text-lg font-medium italic">
                                Histórico vázio
                            </div>
                        )}
                        {previous.map((a, idx) => {
                            const sc = getScoreColor(a.score);
                            // Resgatar cor do sidebar baseada nas pendencias das analisadas
                            const historyColors = a.pendencia ? getEventColors(a.pendencia.evento_codigo, a.pendencia.prioridade ?? 5) : getEventColors();
                            return (
                                <div key={a.id} className={`p-6 border-b border-white/5 bg-black/20 ${idx === 0 && isNew ? 'animate-in slide-in-from-top duration-500' : ''}`}>
                                    <div className="flex items-center gap-4 mb-3">
                                        <div className={`w-16 h-16 rounded-xl bg-gradient-to-br ${sc.bg} ${sc.border} border flex items-center justify-center shadow-lg ${sc.glow}`}>
                                            <span className={`text-2xl font-black ${sc.text} tabular-nums`}>{a.score}</span>
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className={`text-lg font-black truncate ${historyColors.textColor}`}>
                                                {a.pendencia?.evento_codigo || a.id_disparo.slice(0, 12)}
                                                {(a.pendencia?.zona || a.pendencia?.particao) && <span className="text-white/30 font-mono text-sm ml-1">[Z:{a.pendencia.zona || a.pendencia.particao}]</span>}
                                                <span className="text-white/60 font-bold ml-2"> — {getEventDescription(a.pendencia?.evento_codigo, a.pendencia?.descricao_catalogo, a.pendencia?.desc_evento)}</span>
                                            </div>
                                            <div className="text-sm text-white/50 font-bold truncate mt-0.5">{a.pendencia?.nome}</div>
                                            <div className="text-xs text-white/20 font-mono mt-1">{formatTime(a.criado_em)}</div>
                                        </div>
                                    </div>
                                    <div className="text-sm text-white/40 font-medium leading-snug line-clamp-3">{a.hipotese}</div>
                                </div>
                            );
                        })}
                    </div>

                    <div className="p-6 border-t border-white/5 bg-black/40">
                        <div className="text-center">
                            <div className="text-sm font-black text-white/20 uppercase tracking-[0.4em] drop-shadow">Patrimonium Segurança 24H</div>
                            <div className="text-[10px] font-mono text-white/10 tracking-widest mt-1">IRIS COCKPIT TV v1.0 — by Saderi Sistemas</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* NEW ANALYSIS FLASH */}
            {isNew && (
                <div className="fixed inset-0 pointer-events-none z-40 animate-in fade-in duration-300">
                    <div className="absolute inset-0 bg-brand-red/[0.03] animate-pulse" />
                    <div className="absolute top-24 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-white/50 to-transparent animate-pulse" />
                </div>
            )}
        </div>
    );
};
