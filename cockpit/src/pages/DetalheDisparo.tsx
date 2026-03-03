import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ShieldCheck, Activity, ChevronLeft, MapPin, BrainCircuit, History, Loader2, Building2, Crosshair, Tag } from 'lucide-react';
import { api } from '../lib/api';
import type { Pendencia, Analise } from '../lib/api';
import { supabase } from '../lib/supabase';
import { getPriorityConfig } from '../lib/priorityConfig';
import { getEventColors } from '../lib/eventColors';
import toast from 'react-hot-toast';

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
                                <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] mb-2">Protocolo Iris</p>
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
                                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] mb-2">Prioridade</p>
                                    <div className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-xl text-[10px] font-black tracking-widest uppercase border border-red-500/20 bg-red-500/10 text-red-500 shadow-[0_0_15px_rgba(255,0,0,0.15)]`}>
                                        <PrioIcon className="w-3.5 h-3.5" /> {prioConfig.label}
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
                                <div className="text-xs font-black text-brand-red mt-2 tracking-widest">{pendencia.patrimonio}</div>
                            </div>

                            {pendencia.plano_extraido && (
                                <div className="pb-4">
                                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] mb-2 flex items-center gap-1.5"><Tag className="w-3.5 h-3.5" /> Plano Contratado</p>
                                    <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-500 shadow-inner">
                                        <span className="font-black text-[10px] tracking-widest uppercase">{pendencia.plano_extraido}</span>
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
                                <div className="px-4 py-1.5 rounded-full text-[10px] font-black bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 flex items-center gap-2 uppercase tracking-widest animate-in slide-in-from-right duration-500">
                                    <ShieldCheck className="w-4 h-4" /> Relatório Emitido
                                </div>
                            )}
                        </div>

                        {!analise && !analyzing && (
                            <div className="flex-1 flex flex-col items-center justify-center text-center p-12 bg-white/[0.02] rounded-3xl border border-dashed border-white/10 relative group">
                                <BrainCircuit className="w-20 h-20 text-slate-700 mb-6 group-hover:text-purple-500/30 transition-colors duration-500" />
                                <h3 className="text-xl font-black text-white mb-3 uppercase tracking-tighter italic">Processamento Indisponível</h3>
                                <p className="text-slate-500 mb-8 max-w-sm font-medium text-sm">O motor de inferência IRIS aguarda instrução para auditoria automatizada deste disparo.</p>
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
                                <div className="flex gap-6 items-center p-6 rounded-2xl bg-white/[0.03] border border-white/5 shadow-inner">
                                    <div className={`text-4xl font-black w-24 h-24 flex items-center justify-center rounded-3xl shadow-2xl ${(analise.score || 0) > 70 ? 'bg-brand-red/20 text-brand-red border border-brand-red/30 shadow-brand-red/10' :
                                        (analise.score || 0) > 40 ? 'bg-orange-500/20 text-orange-500 border border-orange-500/30 shadow-orange-500/10' :
                                            'bg-emerald-500/20 text-emerald-500 border border-emerald-500/30 shadow-emerald-500/10'
                                        }`}>
                                        {analise.score}
                                    </div>
                                    <div>
                                        <h3 className="font-black text-white uppercase tracking-widest italic text-sm">Score de Risco</h3>
                                        <p className="text-sm text-slate-500 font-medium max-w-xs mt-1">Nível de criticidade calculado via algoritmos de Processamento de Linguagem Natural (LLM).</p>
                                        {analise.plano_utilizado && (
                                            <p className={`text-[10px] font-bold mt-2 uppercase tracking-widest ${eventColors.textColor}`}>
                                                Agente: Plano {analise.plano_utilizado}
                                            </p>
                                        )}
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] ml-1">Veredito da IA</h4>
                                    <div className={`text-white text-lg font-bold leading-relaxed ${eventColors.bgColor} p-6 rounded-2xl border-l-[6px] ${eventColors.borderColor} backdrop-blur-sm shadow-sm transition-all duration-500`}>
                                        {analise.hipotese}
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] ml-1">Diretriz Operacional</h4>
                                    <div className="bg-brand-dark/50 p-6 rounded-2xl border border-white/5 text-slate-300 font-medium text-sm leading-relaxed italic">
                                        {analise.acao_recomendada}
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
                                                        {typeof ev === 'string' ? ev : ev.dado || JSON.stringify(ev)}
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
