import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import type { Pendencia, Analise } from '../lib/api';
import { ShieldCheck, Crosshair, BrainCircuit, Loader2, ArrowLeft, Clock, MapPin, Building2, Activity } from 'lucide-react';
import toast from 'react-hot-toast';

export const DetalhesDisparo = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [pendencia, setPendencia] = useState<Pendencia | null>(null);
    const [analise, setAnalise] = useState<Analise | null>(null);
    const [loading, setLoading] = useState(true);
    const [analyzing, setAnalyzing] = useState(false);

    useEffect(() => {
        if (id) {
            loadData();
        }
    }, [id]);

    const loadData = async () => {
        try {
            setLoading(true);
            const data = await api.getDetalhesDisparo(id!);
            setPendencia(data.pendencia);
            setAnalise(data.analise);
        } catch (error: any) {
            toast.error('Erro ao buscar detalhes: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleAnalise = async () => {
        try {
            setAnalyzing(true);
            toast.loading('Iniciando agente de IA...', { id: 'ia-toast' });
            await api.solicitarAnalise(id!);
            toast.success('Análise concluída com sucesso!', { id: 'ia-toast' });
            await loadData(); // Recarrega para puxar a análise do BD
        } catch (error: any) {
            toast.error('Falha na análise: ' + error.message, { id: 'ia-toast' });
        } finally {
            setAnalyzing(false);
        }
    };

    if (loading) return <div className="p-12 text-center text-slate-400">Carregando dados estruturados...</div>;
    if (!pendencia) return <div className="p-12 text-center text-red-400">Pendência não encontrada.</div>;

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
            <button
                onClick={() => navigate('/')}
                className="text-slate-500 hover:text-brand-red flex items-center gap-2 transition-all font-bold uppercase tracking-widest text-[10px] group"
            >
                <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> Voltar ao Terminal
            </button>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                {/* COLUNA ESQUERDA - DADOS DO EVENTO */}
                <div className="lg:col-span-1 space-y-6">
                    <div className="glass-card p-8 shadow-xl relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-16 h-16 bg-brand-red/5 blur-2xl rounded-full" />
                        <h2 className="text-xl font-black text-white mb-8 flex items-center gap-3 italic">
                            <Crosshair className="w-6 h-6 text-brand-red not-italic" /> EVENTO <span className="text-brand-red not-italic">REAL-TIME</span>
                        </h2>

                        <div className="space-y-6">
                            <div>
                                <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-2">Protocolo Iris</p>
                                <p className="text-white font-mono bg-white/5 p-3 rounded-xl text-xs border border-white/5 select-all">{pendencia.id_disparo}</p>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-2 flex items-center gap-1"><Clock className="w-3 h-3" /> Horário</p>
                                    <p className="text-white font-bold">{pendencia.hora_evento}</p>
                                    <p className="text-[10px] text-slate-400 font-bold">{pendencia.data_evento}</p>
                                </div>
                                <div>
                                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-2">Prioridade</p>
                                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-red/10 border border-brand-red/20 text-brand-red text-[10px] font-black italic">
                                        NÍVEL {pendencia.prioridade}
                                    </div>
                                </div>
                            </div>

                            <div className="h-[1px] bg-white/5" />

                            <div>
                                <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-2 flex items-center gap-1"><Building2 className="w-3 h-3" /> Titular</p>
                                <p className="text-white font-black text-lg leading-tight uppercase italic">{pendencia.nome}</p>
                                <p className="text-slate-400 text-xs font-medium">Cod. Cliente: {pendencia.id_cliente}</p>
                            </div>

                            <div>
                                <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-2 flex items-center gap-1"><MapPin className="w-3 h-3" /> Local / Patrimônio</p>
                                <p className="text-slate-300 text-sm font-medium">{pendencia.endereco}</p>
                                <p className="text-brand-red text-[10px] font-black uppercase tracking-widest mt-1 bg-brand-red/5 px-2 py-1 rounded inline-block">{pendencia.patrimonio}</p>
                            </div>

                            <div className="bg-gradient-to-br from-brand-red/20 to-brand-dark border border-brand-red/30 rounded-2xl p-5 relative overflow-hidden group">
                                <div className="absolute -right-4 -bottom-4 opacity-10 group-hover:opacity-20 transition-opacity">
                                    <Activity className="w-24 h-24" />
                                </div>
                                <p className="text-[10px] font-black text-brand-red uppercase tracking-[0.2em] mb-2">Código do Evento</p>
                                <p className="text-white font-black text-2xl italic">{pendencia.evento_codigo} {pendencia.desc_evento ? `- ${pendencia.desc_evento}` : ''}</p>
                                <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mt-1">
                                    {pendencia.agrupamento} • PART-{pendencia.particao}
                                    {pendencia.zona ? ` • ZONA ${pendencia.zona}` : ''}
                                    {pendencia.setor ? ` • SETOR ${pendencia.setor}` : ''}
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
                    <div className="glass-card p-8 shadow-xl h-full flex flex-col relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/5 blur-3xl rounded-full" />
                        <div className="flex items-center justify-between mb-8 relative z-10">
                            <h2 className="text-xl font-black text-white flex items-center gap-3 italic uppercase">
                                <BrainCircuit className="w-8 h-8 text-purple-500 not-italic" /> IA <span className="text-purple-500 not-italic">AUDIT</span>
                            </h2>
                            {analise && (
                                <div className="px-4 py-1.5 rounded-full text-[10px] font-black bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 flex items-center gap-2 uppercase tracking-widest animate-in slide-in-from-right duration-500">
                                    <ShieldCheck className="w-4 h-4" /> Relatório Emitido
                                </div>
                            )}
                        </div>

                        {!analise && !analyzing && (
                            <div className="flex-1 flex flex-col items-center justify-center text-center p-12 bg-white/[0.02] rounded-3xl border border-dashed border-white/10 relative group">
                                <div className="absolute inset-0 bg-purple-500/0 group-hover:bg-purple-500/[0.02] transition-colors duration-500 rounded-3xl" />
                                <BrainCircuit className="w-20 h-20 text-slate-700 mb-6 group-hover:text-purple-500/30 transition-colors duration-500" />
                                <h3 className="text-xl font-black text-white mb-3 uppercase tracking-tighter italic">Processamento Indisponível</h3>
                                <p className="text-slate-500 mb-8 max-w-sm font-medium text-sm">O motor de inferência IRIS aguarda instrução para auditoria automatizada deste disparo.</p>
                                <button
                                    onClick={handleAnalise}
                                    className="px-8 py-4 bg-purple-600 hover:bg-purple-500 text-white font-black uppercase tracking-[0.2em] text-xs rounded-2xl shadow-2xl shadow-purple-500/30 transition-all hover:scale-105 active:scale-95 flex items-center gap-3 relative overflow-hidden group/btn"
                                >
                                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover/btn:animate-[shimmer_2s_infinite]" />
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
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] ml-1">Veredito da IA</h4>
                                    <div className="text-white text-lg font-bold leading-relaxed bg-brand-red/[0.03] p-6 rounded-2xl border-l-4 border-purple-500 backdrop-blur-sm">
                                        {analise.hipotese}
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] ml-1">Diretriz Operacional</h4>
                                    <div className="bg-brand-dark/50 p-6 rounded-2xl border border-white/5 text-slate-300 font-medium text-sm leading-relaxed italic">
                                        {analise.acao_recomendada}
                                    </div>
                                </div>

                                {analise.evidencias && Array.isArray(analise.evidencias) && (
                                    <div className="space-y-3">
                                        <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] ml-1">Fatos Relevantes</h4>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                            {(analise.evidencias as Array<string | { tipo: string, dado: string }>).map((ev, i) => {
                                                const isString = typeof ev === 'string';
                                                return (
                                                    <div key={i} className="bg-white/[0.02] p-4 rounded-xl border border-white/5 text-xs flex gap-3 group/ev hover:bg-white/[0.04] transition-colors">
                                                        <span className="text-brand-red font-black uppercase tracking-tighter">[{isString ? `E${i + 1}` : ev.tipo}]</span>
                                                        <span className="text-slate-400 font-medium group-hover/ev:text-slate-200 transition-colors">{isString ? ev : ev.dado}</span>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}

                                <div className="pt-6 mt-auto border-t border-white/5 flex justify-end">
                                    <button
                                        onClick={handleAnalise}
                                        className="px-5 py-2.5 hover:bg-white/5 text-slate-500 hover:text-purple-400 font-black uppercase tracking-[0.2em] text-[10px] rounded-xl transition-all flex items-center gap-2 group"
                                    >
                                        <BrainCircuit className="w-4 h-4 group-hover:rotate-12 transition-transform" /> Recalcular Auditoria
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

            </div>
        </div>
    );
};
