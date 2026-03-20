import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ShieldCheck, Activity, ChevronLeft, MapPin, BrainCircuit, History, Loader2, Building2, Crosshair, Tag, Sun, Cloud, CloudRain, CloudLightning, CloudSnow, CloudFog, RefreshCw } from 'lucide-react';
import { api } from '../lib/api';
import type { Pendencia, Analise } from '../lib/api';
import { supabase } from '../lib/supabase';
import { getPriorityConfig } from '../lib/priorityConfig';
import { getEventColors } from '../lib/eventColors';
import toast from 'react-hot-toast';

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
const getPlanoLabel = (plano: any) => {
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

// Helper para corrigir caracteres estranhos provindos da IA (ex: ≥ corrompido para ?)
export const sanitizeText = (text: string | null | undefined) => {
    if (!text) return '';
    // Substitui ? ou U+FFFD por >= (maior ou igual) que é o símbolo geralmente corrompido nesses logs
    return text.replace(/\?/g, '>=').replace(/\uFFFD/g, '');
};

export const DetalhesDisparo = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [pendencia, setPendencia] = useState<Pendencia | null>(null);
    const [analise, setAnalise] = useState<Analise | null>(null);
    const [loading, setLoading] = useState(true);
    const [analyzing, setAnalyzing] = useState(false);

    const fetchDados = async () => {
        try {
            const data = await api.getDetalhesDisparo(id!);
            setPendencia(data.pendencia);
            setAnalise(data.analise);
        } catch (error) {
            console.error('Erro ao buscar detalhes:', error);
            toast.error('Gatilho não encontrado no banco ativo.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (id) {
            fetchDados();
        }

        // Supabase Realtime: escuta INSERT na tabela iris_analises
        // Quando o N8N gravar o resultado da IA, a tela atualiza automaticamente
        const subscription = supabase
            .channel('detalhe-analise-realtime')
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'iris_analises' }, (payload: any) => {
                if (payload.new && payload.new.id_disparo === id) {
                    setAnalise(payload.new as Analise);
                    setAnalyzing(false);
                    toast.success('Análise da IA finalizada!', { duration: 4000 });
                }
            })
            .subscribe();

        return () => {
            subscription.unsubscribe();
        };
    }, [id]);

    const handleAnalise = async () => {
        if (!id || !pendencia) return;
        setAnalyzing(true);
        const disparadoEm = new Date().toISOString();

        // Fire-and-forget: dispara o webhook sem esperar resposta
        // O proxy (Vite local / Netlify produção) encaminha server-side, sem CORS
        console.log('[IRIS] Disparando webhook para id:', id, 'payload pendencia:', pendencia.id_disparo);
        api.solicitarAnalise(pendencia).catch((err) => {
            console.warn('[IRIS] Catch no webhook (normal se proxy teve 500):', err?.message);
        });
        toast.success('Auditoria disparada! Aguardando o motor da IA...', { duration: 4000 });

        // Polling de fallback: verifica a cada 5s se a análise apareceu no banco
        let tentativas = 0;
        const maxTentativas = 12; // 12 x 5s = 60s máximo
        const interval = setInterval(async () => {
            tentativas++;
            console.log(`[IRIS] Polling tentativa ${tentativas}/${maxTentativas} para id: ${id}`);
            try {
                const dados = await api.getDetalhesDisparo(id);
                console.log('[IRIS] Resultado do polling:', dados.analise ? `analise encontrada: ${dados.analise.id_analise}` : 'sem analise ainda');
                // Aceita análise nova (criada após o disparo) OU qualquer análise se for a 1a vez
                if (dados.analise && dados.analise.analisado_em && dados.analise.analisado_em >= disparadoEm) {
                    setAnalise(dados.analise);
                    setAnalyzing(false);
                    toast.success('Análise da IA finalizada!', { duration: 4000 });
                    clearInterval(interval);
                } else if (tentativas >= maxTentativas) {
                    // Última tentativa: exibe o que tiver (pode ser análise antiga)
                    if (dados.analise) {
                        setAnalise(dados.analise);
                        toast.success('Análise carregada!', { duration: 3000 });
                    } else {
                        toast.error('IA ainda processando. Aguarde e recarregue.', { duration: 6000 });
                    }
                    setAnalyzing(false);
                    clearInterval(interval);
                }
            } catch (err) {
                console.error('[IRIS] Erro no polling:', err);
                if (tentativas >= maxTentativas) {
                    setAnalyzing(false);
                    clearInterval(interval);
                }
            }
        }, 5000);
    };

    if (loading) {
        return (
            <div className="p-8 flex justify-center items-center h-[calc(100vh-4rem)]">
                <div className="w-12 h-12 border-4 border-brand-red border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    if (!pendencia) {
        return (
            <div className="p-8 text-center text-slate-500 font-medium">Disparo não encontrado.</div>
        );
    }

    const prioConfig = getPriorityConfig(Number(pendencia.prioridade ?? 5));
    const PrioIcon = prioConfig.icon;
    const eventColors = getEventColors(pendencia.evento_codigo, pendencia.prioridade ?? 5);

    let displayPrioLabel = prioConfig.label;
    if (pendencia.evento_codigo === '9704' || pendencia.evento_codigo === 'E301') displayPrioLabel = 'ENERGIA';
    if (pendencia.evento_codigo === '9558') displayPrioLabel = 'PRIORIDADE CRÍTICA';
    if (pendencia.evento_codigo === '9065') displayPrioLabel = 'DESLOCAMENTO TÁTICO';
    if (pendencia.evento_codigo?.startsWith('901') && !pendencia.evento_codigo?.startsWith('9015')) displayPrioLabel = 'HÁBITO';
    if (pendencia.evento_codigo?.startsWith('9015') || pendencia.evento_codigo?.startsWith('E35')) displayPrioLabel = 'COMUNICAÇÃO';

    return (
        <div className="p-4 md:p-8 max-w-[1400px] mx-auto min-h-[calc(100vh-4rem)] flex flex-col">
            <button
                onClick={() => navigate('/')}
                className="mb-6 flex flex-row items-center gap-2 text-white/50 hover:text-white transition-colors duration-300 uppercase tracking-widest text-[10px] font-black group w-fit"
            >
                <div className="w-6 h-6 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-brand-red group-hover:shadow-[0_0_15px_rgba(255,0,0,0.4)] transition-all">
                    <ChevronLeft className="w-4 h-4" />
                </div>
                Voltar ao Terminal
            </button>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8 flex-1">
                {/* COLUNA ESQUERDA - DADOS DO EVENTO */}
                <div className="space-y-6 flex flex-col">
                    <div className="glass-card p-6 md:p-8 shadow-xl flex-1 border-t-4 border-brand-red relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-brand-red/5 blur-3xl rounded-full" />
                        <div className="flex items-center gap-3 mb-8 relative z-10">
                            <Crosshair className="w-8 h-8 text-brand-red" />
                            <h2 className="text-xl font-black text-white italic uppercase tracking-wider drop-shadow-sm">EVENTO <span className="text-brand-red">REAL-TIME</span></h2>
                        </div>

                        <div className="space-y-8 relative z-10">
                            <div>
                                <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] mb-2">Protocolo</p>
                                <div className="bg-black/40 border border-white/5 rounded-xl px-4 py-3 font-mono font-bold text-white shadow-inner">
                                    {pendencia.id_disparo}
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4 pb-6 border-b border-white/5">
                                <div>
                                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] mb-2 flex items-center gap-1.5"><History className="w-3.5 h-3.5" /> Horário</p>
                                    <div className="font-black text-2xl tracking-tighter text-white drop-shadow-sm">{pendencia.hora_evento}</div>
                                    <div className="text-[10px] text-slate-400 font-bold tracking-widest">{pendencia.data_evento}</div>
                                </div>
                                <div className="text-right">
                                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] mb-2">Suspeita</p>
                                    <div className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-xl text-[10px] font-black tracking-widest uppercase border border-red-500/20 bg-red-500/10 text-red-500 shadow-[0_0_15px_rgba(255,0,0,0.15)]`}>
                                        <PrioIcon className="w-3.5 h-3.5" /> {displayPrioLabel}
                                    </div>
                                </div>
                            </div>

                            <div>
                                <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] mb-2 flex items-center gap-1.5"><Building2 className="w-3.5 h-3.5" /> Titular</p>
                                <div className="font-black text-xl italic leading-tight text-white mb-1 drop-shadow-md">{pendencia.nome}</div>
                                <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Cod. Cliente: <span className="text-white/70">{pendencia.id_cliente}</span></div>
                            </div>

                            <div>
                                <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] mb-2 flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5" /> Local / Patrimônio</p>
                                <div className="font-bold text-sm text-slate-300 uppercase leading-snug tracking-wide">{pendencia.endereco}</div>
                                {pendencia.patrimonio && (
                                    <div className="inline-block mt-3 px-4 py-1.5 bg-brand-red/20 text-brand-red border border-brand-red/30 rounded-xl shadow-inner text-sm font-black tracking-widest uppercase">
                                        Patrimônio: {pendencia.patrimonio}
                                    </div>
                                )}
                            </div>

                            {pendencia.plano_extraido && (
                                <div className="pb-4">
                                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] mb-2 flex items-center gap-1.5"><Tag className="w-3.5 h-3.5" /> Plano Contratado</p>
                                    <div className="inline-flex items-center gap-2 px-5 py-2.5 bg-amber-500/20 border border-amber-500/30 rounded-xl text-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.2)]">
                                        <span className="font-black text-sm tracking-[0.2em] uppercase">{pendencia.plano_extraido}</span>
                                    </div>
                                </div>
                            )}

                            <div className="bg-gradient-to-br from-brand-red/20 to-brand-dark border border-brand-red/30 rounded-2xl p-5 relative overflow-hidden group">
                                <div className="absolute -right-4 -bottom-4 opacity-10 group-hover:opacity-20 transition-opacity">
                                    <Activity className="w-24 h-24" />
                                </div>
                                <p className="text-[10px] font-black text-brand-red uppercase tracking-[0.2em] mb-2">Código do Evento</p>
                                <p className="text-white font-black text-2xl italic">{pendencia.evento_codigo} {(pendencia.descricao_catalogo || pendencia.desc_evento) ? `- ${pendencia.descricao_catalogo || pendencia.desc_evento}` : ''}</p>
                                <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mt-1">
                                    {pendencia.agrupamento} • Zona: {pendencia.zona || pendencia.particao || '--'}
                                    {pendencia.setor ? ` • Setor ${pendencia.setor}` : ''}
                                </p>
                                {pendencia.viatura && (
                                    <div className="mt-3 inline-block px-3 py-1 bg-amber-500/20 text-amber-500 text-[10px] font-black tracking-widest uppercase rounded border border-amber-500/30">
                                        Viatura: {pendencia.viatura}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* COLUNA DIREITA - ANÁLISE DE IA */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="glass-card p-5 md:p-8 shadow-xl h-full flex flex-col relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/5 blur-3xl rounded-full opacity-30" />
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-5 md:mb-8 gap-3 relative z-10">
                            <h2 className="text-xl font-black text-white flex items-center gap-3 italic uppercase">
                                <BrainCircuit className={`w-8 h-8 ${eventColors.textColor} not-italic`} /> IA <span className={`${eventColors.textColor} not-italic`}>AUDIT</span>
                            </h2>
                            {analise && (
                                <div className="flex flex-col sm:flex-row items-end sm:items-center gap-2 sm:gap-4 animate-in slide-in-from-right duration-500">
                                    <button 
                                        onClick={handleAnalise}
                                        disabled={analyzing}
                                        className="px-4 py-1.5 rounded-full text-[10px] font-black bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 border border-purple-500/20 flex items-center gap-2 uppercase tracking-widest transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        <RefreshCw className={`w-3.5 h-3.5 ${analyzing ? 'animate-spin' : ''}`} /> Reanalisar
                                    </button>
                                    <div className="px-4 py-1.5 rounded-full text-[10px] font-black bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 flex items-center gap-2 uppercase tracking-widest">
                                        <ShieldCheck className="w-4 h-4" /> Relatório Emitido
                                    </div>
                                </div>
                            )}
                        </div>

                        {!analise && !analyzing && (
                            <div className="flex-1 flex flex-col items-center justify-center text-center p-12 bg-white/[0.02] rounded-3xl border border-dashed border-white/10 relative group">
                                <BrainCircuit className="w-20 h-20 text-slate-700 mb-6 group-hover:text-purple-500/30 transition-colors duration-500" />
                                <h3 className="text-xl font-black text-white mb-3 uppercase tracking-tighter italic">Processamento Indisponível</h3>
                                <p className="text-slate-500 mb-8 max-w-sm font-medium text-sm">O motor de inferência IA aguarda instrução para auditoria automatizada deste disparo.</p>
                                <button
                                    onClick={handleAnalise}
                                    className="w-full sm:w-auto px-8 py-4 bg-purple-600 hover:bg-purple-500 text-white font-black uppercase tracking-[0.2em] text-xs rounded-2xl shadow-2xl shadow-purple-500/30 transition-all hover:scale-105 active:scale-95 flex items-center justify-center gap-3 relative overflow-hidden group/btn min-h-[48px]"
                                >
                                    <BrainCircuit className="w-5 h-5" /> Iniciar Auditoria IA
                                </button>
                            </div>
                        )}

                        {analyzing && (
                            <div className="flex-1 flex flex-col items-center justify-center text-center p-12 bg-white/[0.02] rounded-3xl border border-white/5">
                                <div className="relative mb-8">
                                    <div className="absolute inset-0 bg-purple-500/20 blur-2xl animate-pulse rounded-full" />
                                    <Loader2 className="w-16 h-16 text-purple-500 animate-spin relative" />
                                </div>
                                <h3 className="text-xl font-black text-white mb-2 uppercase tracking-tighter italic">Auditando Padrões</h3>
                                <p className="text-slate-400 font-bold text-xs uppercase tracking-[0.3em] animate-pulse">Cruzando histórico corporativo...</p>
                            </div>
                        )}

                        {analise && !analyzing && (
                            <div className="space-y-8 flex-1 animate-in fade-in slide-in-from-bottom-4 duration-700">
                                <div className="flex flex-col sm:flex-row gap-6 sm:items-center p-6 rounded-2xl bg-white/[0.03] border border-white/5 shadow-inner">
                                    <div className={`shrink-0 text-4xl font-black w-24 h-24 flex items-center justify-center rounded-3xl shadow-2xl ${(analise.score || 0) > 70 ? 'bg-brand-red/20 text-brand-red border border-brand-red/30 shadow-brand-red/10' :
                                        (analise.score || 0) > 40 ? 'bg-orange-500/20 text-orange-500 border border-orange-500/30 shadow-orange-500/10' :
                                            'bg-emerald-500/20 text-emerald-500 border border-emerald-500/30 shadow-emerald-500/10'
                                        }`}>
                                        {analise.score}
                                    </div>
                                    <div className="text-center sm:text-left flex flex-col items-center sm:items-start">
                                        <h3 className="font-black text-white uppercase tracking-widest italic text-sm">Score de Suspeita</h3>
                                        <p className="text-sm text-slate-500 font-medium max-w-xs mt-1">Nível de criticidade calculado via algoritmos de Processamento de Linguagem Natural (LLM).</p>
                                        {analise.plano_utilizado && (
                                            <div className={`mt-3 inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-black/40 border ${eventColors.borderColor} shadow-inner`}>
                                                <Tag className={`w-4 h-4 ${eventColors.textColor}`} />
                                                <span className={`text-xs font-black uppercase tracking-widest ${eventColors.textColor}`}>
                                                    Plano {getPlanoLabel(analise.plano_utilizado)}
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                    <div className="mt-4 sm:mt-0 sm:ml-auto flex items-center justify-center sm:justify-end w-full sm:w-auto">
                                        {/* INÍCIO INFORMAÇÃO DO CLIMA */}
                                        {(() => {
                                            let parsedEnriquecido = analise?.evento_enriquecido;
                                            if (typeof parsedEnriquecido === 'string') {
                                                try { parsedEnriquecido = JSON.parse(parsedEnriquecido); } catch (e) { }
                                            }
                                            if (typeof parsedEnriquecido === 'string') {
                                                try { parsedEnriquecido = JSON.parse(parsedEnriquecido); } catch (e) { }
                                            }
                                            let climaInfo = (parsedEnriquecido as any)?.clima;
                                            if (typeof climaInfo === 'string') {
                                                try { climaInfo = JSON.parse(climaInfo); } catch (e) { }
                                            }
                                            const weather = getWeatherDisplay(climaInfo);
                                            if (weather) {
                                                const { Icon, color, anim, desc, temp, bgGlow } = weather;
                                                return (
                                                    <div className={`flex items-center justify-center gap-4 sm:gap-6 bg-black/95 px-6 sm:px-8 py-4 sm:py-5 rounded-[2rem] sm:rounded-[2.5rem] border-2 border-white/20 ${bgGlow} transition-all duration-300 transform sm:scale-110 sm:origin-right w-full sm:w-auto`}>
                                                        <Icon size={48} className={`${color} ${anim} shrink-0 sm:w-[56px] sm:h-[56px]`} style={{ filter: 'drop-shadow(0 0 20px currentColor)' }} />
                                                        <div className="flex flex-col items-start leading-tight">
                                                            <span className="text-3xl sm:text-4xl font-black text-white tracking-tight" style={{ textShadow: '0 4px 15px rgba(255,255,255,0.4)' }}>{temp}°C</span>
                                                            <span className={`text-[11px] sm:text-[13px] font-black uppercase tracking-[0.25em] mt-1 ${color}`}>{desc}</span>
                                                        </div>
                                                    </div>
                                                );
                                            }
                                            return null;
                                        })()}
                                        {/* FIM INFORMAÇÃO DO CLIMA */}
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] ml-1">Veredito da IA</h4>
                                    <div className={`text-white text-lg font-bold leading-relaxed ${eventColors.bgColor} p-6 rounded-2xl border-l-[6px] ${eventColors.borderColor} backdrop-blur-sm shadow-sm transition-all duration-500`}>
                                        {sanitizeText(analise.hipotese)}
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] ml-1">Diretriz Operacional</h4>
                                    <div className="bg-brand-dark/50 p-6 rounded-2xl border border-white/5 text-slate-300 font-medium text-sm leading-relaxed italic">
                                        {sanitizeText(analise.acao_recomendada)}
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] ml-1">Evidências Listadas</h4>
                                    <div className="space-y-2">
                                        {analise.evidencias && Array.isArray(analise.evidencias) ? (
                                            analise.evidencias.map((ev: any, idx: number) => (
                                                <div key={idx} className="flex gap-4 p-4 rounded-xl bg-white/[0.02] border border-white/5">
                                                    <span className={`${eventColors.textColor} font-black mt-0.5`}>[E{idx + 1}]</span>
                                                    <span className="text-white/80 font-medium leading-relaxed">
                                                        {sanitizeText(typeof ev === 'string' ? ev : ev.dado || JSON.stringify(ev))}
                                                    </span>
                                                </div>
                                            ))
                                        ) : (
                                            <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5 text-slate-400 italic">Nenhuma evidência capturada no payload.</div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
