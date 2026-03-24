import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { BrainCircuit, ShieldAlert, Activity, Crosshair, Building2, Tag, Sun, Cloud, CloudRain, CloudLightning, CloudSnow, CloudFog, AlertTriangle, Wrench } from 'lucide-react';
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
    evento_enriquecido?: any;
    os_status?: string | null;
    solicitar_os?: boolean | null;
}

// Helper para traduzir clima
const getWeatherDisplay = (clima: any) => {
    if (!clima || typeof clima !== 'object' || clima.code === undefined || clima.code === null) return null;
    const code = Number(clima.code);
    let Icon = Cloud;
    let color = "text-slate-400";
    let bgGlow = "shadow-[0_0_30px_rgba(148,163,184,0.4)]";
    let anim = "animate-[pulse_1.5s_ease-in-out_infinite]";
    let desc = "Nublado";

    if (code === 0) { Icon = Sun; color = "text-yellow-300"; bgGlow = "shadow-[0_0_40px_rgba(253,224,71,0.6)]"; anim = "animate-[spin_4s_linear_infinite]"; desc = "Céu Limpo"; }
    else if (code >= 1 && code <= 3) { Icon = Cloud; color = "text-cyan-200"; bgGlow = "shadow-[0_0_35px_rgba(165,243,252,0.5)]"; anim = "animate-[bounce_3s_infinite]"; desc = "Parc. Nublado"; }
    else if (code === 45 || code === 48) { Icon = CloudFog; color = "text-slate-200"; bgGlow = "shadow-[0_0_35px_rgba(226,232,240,0.5)]"; anim = "animate-pulse"; desc = "Nevoeiro"; }
    else if ((code >= 51 && code <= 67) || (code >= 80 && code <= 82)) { Icon = CloudRain; color = "text-blue-400"; bgGlow = "shadow-[0_0_40px_rgba(59,130,246,0.7)]"; anim = "animate-bounce"; desc = "Chuva"; }
    else if ((code >= 71 && code <= 77) || (code >= 85 && code <= 86)) { Icon = CloudSnow; color = "text-white"; bgGlow = "shadow-[0_0_40px_rgba(255,255,255,0.7)]"; anim = "animate-pulse"; desc = "Neve/Gelo"; }
    else if (code >= 95 && code <= 99) { Icon = CloudLightning; color = "text-fuchsia-400"; bgGlow = "shadow-[0_0_45px_rgba(192,132,252,0.8)]"; anim = "animate-bounce"; desc = "Tempestade"; }

    return { Icon, color, bgGlow, anim, desc, temp: clima.temp };
};

// Helper para traduzir o plano
const getPlanoLabel = (plano: string) => {
    switch (String(plano)) {
        case '0000': return 'TÁTICO / VISUALIZAÇÃO';
        case '1000': return 'PATRIMONIUM SMART';
        case '2000': return 'BRONZE';
        case '3000': return 'PRATA';
        case '4000': return 'OURO';
        case '5000': return 'PREMIUM';
        case '6000': return 'DISPARO POR IMAGEM';
        case '7000': return 'ANALÍTICO – CFTV';
        case '8000': return 'ANALÍTICO PLUS – CFTV + ALARME';
        case '9000': return 'PATRIMONIUM MOBILE';
        default: return 'GERAL';
    }
};

const getScoreColor = (score: number) => {
    if (score >= 70) return { bg: 'from-brand-red/20 to-brand-dark', text: 'text-brand-red', border: 'border-brand-red/30', glow: 'shadow-brand-red/20', label: 'Suspeita Crítica' };
    if (score >= 40) return { bg: 'from-orange-500/20 to-brand-dark', text: 'text-orange-500', border: 'border-orange-500/30', glow: 'shadow-orange-500/20', label: 'Suspeita Moderada' };
    return { bg: 'from-emerald-500/20 to-brand-dark', text: 'text-emerald-500', border: 'border-emerald-500/30', glow: 'shadow-emerald-500/20', label: 'Situação Normal' };
};

const formatTime = (isoString: string) => {
    return new Date(isoString).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
};


type PendenciaSimples = Pick<Pendencia, 'id_disparo' | 'nome' | 'patrimonio' | 'endereco' | 'evento_codigo' | 'desc_evento' | 'descricao_catalogo' | 'hora_evento' | 'data_evento' | 'setor' | 'viatura' | 'particao' | 'zona' | 'agrupamento' | 'prioridade' | 'analise_abrir_os'>;

const osStatusColors: Record<string, string> = {
    solicitada: 'bg-yellow-500 text-black border-yellow-400 shadow-[0_0_50px_rgba(234,179,8,1)] animate-[pulse_0.6s_ease-in-out_infinite]',
    criada: 'bg-yellow-500 text-black border-yellow-400 shadow-[0_0_50px_rgba(234,179,8,1)] animate-[pulse_0.6s_ease-in-out_infinite]',
    aberta: 'bg-yellow-500 text-black border-yellow-400 shadow-[0_0_50px_rgba(234,179,8,1)] animate-[pulse_0.6s_ease-in-out_infinite]',
    falha: 'bg-red-600 text-white border-red-500 shadow-[0_0_50px_rgba(220,38,38,1)] animate-[pulse_0.6s_ease-in-out_infinite]',
    recusada: 'bg-red-600 text-white border-red-500 shadow-[0_0_50px_rgba(220,38,38,0.8)]',
    default: 'bg-yellow-500 text-black border-yellow-400 shadow-[0_0_50px_rgba(234,179,8,1)] animate-[pulse_0.6s_ease-in-out_infinite]'
};

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

                const { data: ordem } = await supabase
                    .from('iris_ordens_servico')
                    .select('status_os')
                    .eq('id_disparo', analise.id_disparo)
                    .maybeSingle();

                return { ...analise, pendencia: pend || undefined, os_status: ordem?.status_os || null };
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
                return prio === 0 || prio === 1 || p.evento_codigo === '9704' || p.evento_codigo === '9558';
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
            .on('postgres_changes', { event: '*', schema: 'public', table: 'iris_analises' }, () => {
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

            {/* TOP BAR — Compacted */}
            <div className="h-20 border-b border-white/5 bg-black/40 backdrop-blur-xl flex items-center justify-between px-6 relative z-30">
                <div className="flex items-center gap-6">
                    <img src={logo} alt="Patrimonium" className="h-16 drop-shadow-lg" />
                    <div>
                        <div className="text-2xl font-black italic tracking-tight">
                            <span className="text-white">COCKPIT IA</span> <span className="text-brand-red">TV</span>
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

                <div className="flex items-center gap-6">
                    <div className="flex gap-6">
                        <div className="text-right">
                            <div className="text-[0.65rem] font-black text-slate-500 uppercase tracking-[0.2em] mb-0.5">Suspeitas</div>
                            <div className="text-3xl font-black text-brand-red tabular-nums leading-none">{totalCriticos}</div>
                        </div>
                        <div className="w-px h-8 self-center bg-white/10" />
                        <div className="text-right">
                            <div className="text-[0.65rem] font-black text-slate-500 uppercase tracking-[0.2em] mb-0.5">Pendentes</div>
                            <div className="text-3xl font-black text-white tabular-nums leading-none">{totalPendentes}</div>
                        </div>
                    </div>
                    <div className="text-right border-l border-white/10 pl-6 ml-2">
                        <div className="text-4xl font-black tabular-nums font-mono text-white/90 drop-shadow-md leading-none">{currentTime.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</div>
                        <div className="text-[10px] text-white/40 font-mono tracking-widest uppercase mt-1">{currentTime.toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: '2-digit' })}</div>
                    </div>
                </div>
            </div>

            {/* MAIN CONTENT */}
            <div className="h-[calc(100vh-5rem)] flex">
                {/* LEFT — LATEST ANALYSIS */}
                <div className="flex-1 p-6 flex flex-col overflow-hidden">
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
                            <div className={`mb-4 flex items-center gap-5 ${isNew ? 'animate-pulse' : ''}`}>
                                <BrainCircuit className={`w-8 h-8 ${colors.textColor}`} />
                                <h2 className="text-3xl font-black uppercase tracking-widest italic drop-shadow-md">
                                    ANÁLISE <span className={colors.textColor}>POR IA</span>
                                </h2>
                                <span className="text-base font-mono text-white/30 ml-auto border border-white/5 bg-black/20 px-4 py-1 rounded-lg">
                                    LOG ID: {latest.id_disparo.substring(0, 8)} • {formatTime(latest.criado_em)}
                                </span>
                            </div>

                            {/* SCORE + EVENT INFO */}
                            <div className={`flex flex-col gap-6 mb-6 ${isNew ? 'animate-in slide-in-from-left duration-700' : ''}`}>

                                {/* INDUSTRIAL OPERATIONAL BELT */}
                                <div className={`bg-black/40 border-l-[10px] ${colors.borderColor} border-t border-r border-b border-white/5 rounded-3xl p-6 flex items-center shadow-2xl relative overflow-hidden mb-4`}>
                                    <div className={`absolute right-0 top-0 bottom-0 w-1/4 bg-gradient-to-l ${colors.bgColor} to-transparent pointer-events-none opacity-20`} />

                                    {/* CLIENT ZONE */}
                                    <div className="flex-[1.5] space-y-1 z-10">
                                        <div className={`flex items-center gap-3 ${colors.textColor} opacity-60`}>
                                            <Building2 className="w-5 h-5" />
                                            <span className="text-lg font-black uppercase tracking-[0.3em]">Cliente & Patrimônio</span>
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-7xl font-black text-white italic leading-[1.1] tracking-tighter truncate">{latest.pendencia?.nome || "CLIENTE NÃO IDENTIFICADO"}</span>
                                            {latest.pendencia?.patrimonio && (
                                                <div className="mt-1 flex items-center gap-3">
                                                    <span className="text-4xl font-black text-white/90 bg-white/10 px-4 py-0.5 rounded-lg border border-white/20 shadow-lg">
                                                        ID: {latest.pendencia?.patrimonio}
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* WEATHER HUB */}
                                    <div className="flex-1 flex items-center justify-center border-x border-white/10 px-8 z-10">
                                        {(() => {
                                            let parsedEnriquecido = latest?.evento_enriquecido;
                                            if (typeof parsedEnriquecido === 'string') {
                                                try { parsedEnriquecido = JSON.parse(parsedEnriquecido); } catch (e) { }
                                            }
                                            if (typeof parsedEnriquecido === 'string') {
                                                try { parsedEnriquecido = JSON.parse(parsedEnriquecido); } catch (e) { }
                                            }
                                            const climaInfo = (parsedEnriquecido as any)?.clima;
                                            const weather = getWeatherDisplay(climaInfo);
                                            if (weather) {
                                                const { Icon, color, anim, desc, temp, bgGlow } = weather;
                                                return (
                                                    <div className={`flex items-center gap-6 bg-black/60 border border-white/10 px-8 py-4 rounded-[2rem] ${bgGlow} transition-all duration-300`}>
                                                        <Icon size={56} className={`${color} ${anim}`} style={{ filter: 'drop-shadow(0 0 15px currentColor)' }} />
                                                        <div className="flex flex-col items-start leading-none">
                                                            <span className="text-5xl font-black text-white tracking-tighter">{temp}°C</span>
                                                            <span className={`text-[12px] font-black uppercase tracking-[0.3em] mt-1 ${color}`}>{desc}</span>
                                                        </div>
                                                    </div>
                                                );
                                            }
                                            return (
                                                <div className="opacity-10 grayscale py-4">
                                                    <Cloud size={64} />
                                                </div>
                                            );
                                        })()}
                                    </div>

                                    {/* EVENT ZONE */}
                                    <div className="flex-1 text-right z-10 space-y-1 pl-8">
                                        <div className={`flex items-center gap-2 justify-end ${colors.textColor} opacity-60`}>
                                            <Crosshair className="w-5 h-5" />
                                            <span className="text-lg font-black uppercase tracking-[0.3em]">Evento Capturado</span>
                                        </div>
                                        <div className="flex flex-col items-end">
                                            <div className="flex items-center gap-4">
                                                <span className="text-7xl font-black text-white italic leading-none tracking-tighter">{latest.pendencia?.evento_codigo || "---"}</span>
                                            </div>
                                            <span className={`text-3xl font-black mt-1 leading-tight ${colors.textColor} max-w-[400px] text-right truncate`}>{getEventDescription(latest.pendencia?.evento_codigo, latest.pendencia?.descricao_catalogo, latest.pendencia?.desc_evento, "Processando Descrição...")}</span>
                                            <div className="flex flex-col items-end gap-2 mt-2">
                                                {(latest.pendencia?.zona || latest.pendencia?.particao) && (
                                                    <span className="text-xl font-bold text-white/50 bg-white/5 px-4 py-1 rounded-lg border border-white/10 uppercase tracking-widest italic">SETOR: {latest.pendencia.zona || latest.pendencia.particao}</span>
                                                )}
                                                {(() => {
                                                    let abrirOs = false;
                                                    if (latest?.evento_enriquecido) {
                                                        let parsed = latest.evento_enriquecido;
                                                        if (typeof parsed === 'string') {
                                                            try { parsed = JSON.parse(parsed); } catch (e) { }
                                                        }
                                                        if (typeof parsed === 'string') {
                                                            try { parsed = JSON.parse(parsed); } catch (e) { }
                                                        }
                                                        abrirOs = !!(parsed as any)?.abrir_os;
                                                    }

                                                    if (latest.os_status) {
                                                        const statusKey = latest.os_status.toLowerCase();
                                                        const colorClass = osStatusColors[statusKey] || osStatusColors.default;
                                                        return (
                                                            <div className={`mt-3 inline-flex items-center justify-center gap-3 px-6 py-3 rounded-xl text-3xl font-black uppercase tracking-widest border-2 ${colorClass}`}>
                                                                <Wrench className="w-8 h-8" /> SOLICITAÇÃO DE O.S. REALIZADA
                                                            </div>
                                                        );
                                                    }

                                                    if (abrirOs || latest.pendencia?.analise_abrir_os) {
                                                        return (
                                                            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-lg text-xl font-black uppercase tracking-wider bg-yellow-500/20 text-yellow-500 border border-yellow-500/30">
                                                                <AlertTriangle className="w-6 h-6" /> OS SOLICITADA
                                                            </div>
                                                        );
                                                    }
                                                    return null;
                                                })()}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* MEIO: Score e Veredito IA em Lado a Lado para Máximo Impacto */}
                                <div className="flex gap-4">
                                    {/* Score — SLIGHTLY COMPACTED SCALE */}
                                    <div className={`w-64 shrink-0 bg-gradient-to-br ${getScoreColor(latest.score).bg} ${getScoreColor(latest.score).border} border rounded-3xl p-4 flex flex-col items-center justify-center shadow-2xl ${getScoreColor(latest.score).glow} relative overflow-hidden`}>
                                        <BrainCircuit className="absolute -right-8 -top-8 w-40 h-40 opacity-10" />
                                        <div className={`text-[7.5rem] font-black ${getScoreColor(latest.score).text} tabular-nums leading-none tracking-tighter`}>{latest.score}</div>
                                        <div className="text-sm font-black uppercase tracking-[0.34em] text-white/50 mt-1">Score de Suspeita</div>
                                        <div className={`text-xl font-black uppercase tracking-[0.2em] text-center mt-1 ${getScoreColor(latest.score).text}`}>
                                            {getScoreColor(latest.score).label}
                                        </div>
                                    </div>

                                    {/* Veredito IA Gigante - COM CORES DINAMICAS */}
                                    <div className={`flex-1 flex flex-col justify-center ${colors.bgColor} border-l-[12px] ${colors.borderColor} rounded-r-3xl p-10 ${colors.shadowColor} relative transition-all duration-500`}>
                                        <div className={`absolute right-6 top-6 border-2 ${colors.borderColor} px-6 py-2 bg-black/80 rounded-xl backdrop-blur-md shadow-2xl z-20`}>
                                            {latest.plano_utilizado && (
                                                <div className={`flex items-center gap-2 ${colors.textColor}`}>
                                                    <Tag className="w-5 h-5" />
                                                    <span className="font-black text-xl uppercase tracking-[0.2em] drop-shadow-lg">
                                                        {getPlanoLabel(latest.plano_utilizado)}
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                        <div className={`text-2xl font-black ${colors.textColor} uppercase tracking-[0.3em] mb-4 drop-shadow-sm`}>Veredito da Inteligência Artificial</div>
                                        <div className="text-white font-black text-[2.4rem] leading-[1.2] line-clamp-3 pr-10 drop-shadow-2xl">{latest.hipotese}</div>
                                    </div>
                                </div>

                                {/* ACTION + EVIDENCE — TV BOTTOM SECTION */}
                                <div className="grid grid-cols-2 gap-6 flex-1 min-h-0">
                                    <div className="bg-black/40 border border-white/10 rounded-3xl p-8 flex flex-col shadow-inner overflow-hidden relative">
                                        <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${colors.bgColor}`} />
                                        <div className="text-2xl font-black text-slate-400 uppercase tracking-[0.4em] mb-6 flex items-center gap-3 shrink-0">
                                            <ShieldAlert className={`w-8 h-8 ${colors.textColor}`} /> Diretriz Sistêmica (Ação Recomendada)
                                        </div>
                                        <div className={`text-white font-black text-[2.2rem] leading-tight flex-1 p-6 rounded-2xl bg-white/[0.03] border border-white/5 content-start overflow-y-auto custom-scrollbar shadow-2xl`}>
                                            {latest.acao_recomendada}
                                        </div>
                                    </div>

                                    <div className="bg-black/40 border border-white/10 rounded-3xl p-8 flex flex-col shadow-inner overflow-hidden">
                                        <div className="text-2xl font-black text-slate-400 uppercase tracking-[0.4em] mb-6 shrink-0">Fatos Encontrados (Evidências)</div>
                                        <div className="space-y-4 flex-1 overflow-y-auto custom-scrollbar pr-4">
                                            {latest.evidencias && Array.isArray(latest.evidencias) && latest.evidencias.map((ev: any, i: number) => (
                                                <div key={i} className="flex gap-6 text-[1.8rem] items-start bg-white/[0.04] p-5 rounded-2xl border border-white/5 hover:bg-white/[0.08] transition-all">
                                                    <span className={`${colors.textColor} font-black shrink-0 mt-1 drop-shadow-lg`}>[E{i + 1}]</span>
                                                    <span className="text-white/90 font-bold leading-tight tracking-tight">{typeof ev === 'string' ? ev : ev.dado || JSON.stringify(ev)}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </>
                    )}
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
