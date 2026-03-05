import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, Activity, ShieldAlert, Search, Trash2 } from 'lucide-react';
import { api } from '../lib/api';
import type { Pendencia } from '../lib/api';
import { useUserRole } from '../hooks/useUserRole';
import { getPriorityConfig } from '../lib/priorityConfig';
import { getEventDescription } from '../lib/eventUtils';

export const Dashboard = () => {
    const [pendencias, setPendencias] = useState<Pendencia[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const navigate = useNavigate();
    const { isAdmin } = useUserRole();

    // Filtro estrito para considerar apenas as prioridades visualizadas no painel Iris
    const isRelevantEvent = (pend: Pendencia) => {
        const prioValue = Number(pend.prioridade);
        if (pend.evento_codigo === '9704') return true;
        if (pend.evento_codigo === '9065') return true;
        if (pend.evento_codigo?.startsWith('901')) return true;
        if (pend.evento_codigo?.startsWith('E35')) return true;
        if ([0, 1, 4, 5].includes(prioValue)) return true;
        return false;
    };

    const handleLimparFila = async () => {
        if (!confirm('Esta ação arquivará todas as pendências atuais do Cockpit. Deseja prosseguir?')) return;
        setLoading(true);
        try {
            await api.limparFila();
            await fetchPendencias();
        } catch (error) {
            console.error('Erro ao limpar fila:', error);
            setLoading(false);
        }
    };

    const activePendencias = pendencias.filter(p => p.status === 'pendente' && isRelevantEvent(p));

    const fetchPendencias = async () => {
        try {
            const data = await api.getPendencias();
            setPendencias(data);
        } catch (error) {
            console.error('Erro ao buscar pendências:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPendencias();
        // Inicia subscrição Realtime
        const subscription = api.subscribePendencias(() => {
            fetchPendencias(); // Recarrega ao receber WebSocket events
        });

        // Polling a cada 60s como fallback caso Realtime desconecte
        const pollingInterval = setInterval(() => {
            fetchPendencias();
        }, 60_000);

        return () => {
            subscription.unsubscribe();
            clearInterval(pollingInterval);
        };
    }, []);

    // Puxado remotamente de lib

    return (
        <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-4 md:space-y-10">
            {/* HEADER & KPIs */}
            <div className="space-y-4">
                <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                        <h1 className="text-xl md:text-4xl font-black text-white tracking-tight italic leading-tight">INTELIGÊNCIA ARTIFICIAL <span className="text-brand-red not-italic">PATRIMONIUM</span></h1>
                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                            <p className="text-slate-400 font-medium uppercase tracking-[0.2em] md:tracking-[0.3em] text-[9px] md:text-[10px]">Terminal de Monitoramento Iris</p>
                            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                                <span className="text-[8px] font-black text-emerald-500 uppercase tracking-widest">Live</span>
                            </div>
                        </div>
                    </div>
                    {/* Action buttons - compact on mobile */}
                    <div className="flex gap-2 shrink-0">
                        <button
                            onClick={() => { setLoading(true); fetchPendencias(); }}
                            disabled={loading}
                            className="glass-card p-3 md:px-4 md:py-3 flex flex-col justify-center items-center gap-1 hover:bg-white/5 transition-colors disabled:opacity-50 cursor-pointer group min-w-[48px] min-h-[48px]"
                            title="Atualizar Fila"
                        >
                            <Activity className={`w-5 h-5 text-slate-400 group-hover:text-white transition-colors ${loading ? 'animate-spin' : ''}`} />
                            <span className="text-[7px] md:text-[8px] font-black text-slate-500 uppercase tracking-widest group-hover:text-slate-300 hidden sm:block">Atualizar</span>
                        </button>
                        {isAdmin && (
                            <button
                                onClick={handleLimparFila}
                                disabled={loading}
                                className="glass-card p-3 md:px-4 md:py-3 flex flex-col justify-center items-center gap-1 hover:bg-brand-red/10 border border-transparent hover:border-brand-red/30 transition-colors disabled:opacity-50 cursor-pointer group min-w-[48px] min-h-[48px]"
                                title="Limpar Fila"
                            >
                                <Trash2 className="w-5 h-5 text-slate-400 group-hover:text-brand-red transition-colors" />
                                <span className="text-[7px] md:text-[8px] font-black text-slate-500 uppercase tracking-widest group-hover:text-brand-red opacity-80 hidden sm:block">Limpar</span>
                            </button>
                        )}
                    </div>
                </div>

                {/* KPI Cards - horizontal scroll on mobile, row on desktop */}
                <div className="grid grid-cols-2 md:flex md:flex-row gap-3 md:gap-4">
                    <div className="glass-card tactical-border p-3 md:p-5 flex items-center gap-3 md:gap-5 md:min-w-[220px] relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-1 h-full bg-brand-red opacity-50" />
                        <div className="w-10 h-10 md:w-14 md:h-14 bg-brand-red/10 rounded-xl md:rounded-2xl flex items-center justify-center shrink-0">
                            <ShieldAlert className="w-5 h-5 md:w-8 md:h-8 text-brand-red" />
                        </div>
                        <div>
                            <p className="text-[9px] md:text-[10px] font-bold text-slate-500 uppercase tracking-widest">Críticos</p>
                            <p className="text-2xl md:text-3xl font-black text-white tabular-nums">
                                {activePendencias.filter(p => Number(p.prioridade) === 0 || Number(p.prioridade) === 1 || p.evento_codigo === '9704').length}
                            </p>
                        </div>
                    </div>
                    <div className="glass-card p-3 md:p-5 flex items-center gap-3 md:gap-5 md:min-w-[220px] relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-1 h-full bg-white/20" />
                        <div className="w-10 h-10 md:w-14 md:h-14 bg-white/5 rounded-xl md:rounded-2xl flex items-center justify-center shrink-0">
                            <Eye className="w-5 h-5 md:w-8 md:h-8 text-slate-300" />
                        </div>
                        <div>
                            <p className="text-[9px] md:text-[10px] font-bold text-slate-500 uppercase tracking-widest">Pendentes</p>
                            <p className="text-2xl md:text-3xl font-black text-white tabular-nums">
                                {activePendencias.length}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* SEARCH BAR */}
            <div className="flex items-center gap-3 bg-white/[0.03] border border-white/10 rounded-xl md:rounded-2xl p-2.5 px-4 md:p-3 md:px-5 focus-within:border-brand-red focus-within:ring-1 focus-within:ring-brand-red/50 transition-all shadow-xl shadow-black/20">
                <Search className="w-5 h-5 text-slate-400 shrink-0" />
                <input
                    type="text"
                    placeholder="Buscar por Nome, Protocolo ou Patrimônio..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="bg-transparent border-none placeholder:text-slate-600 text-white font-medium focus:outline-none w-full text-sm outline-none min-h-[44px]"
                />
            </div>

            {/* DATA — Table on desktop, Cards on mobile */}
            <div className="glass-card shadow-2xl shadow-black/40 overflow-hidden relative">
                <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-white/10 to-transparent" />

                {loading ? (
                    <div className="px-8 py-20 flex flex-col items-center gap-4">
                        <div className="w-8 h-8 border-2 border-brand-red border-t-transparent rounded-full animate-spin" />
                        <span className="text-slate-500 font-bold uppercase tracking-widest text-xs">Sincronizando Banco de Dados...</span>
                    </div>
                ) : activePendencias.length === 0 ? (
                    <div className="px-8 py-20 text-center text-slate-500 font-medium italic">
                        Nenhum evento crítico na fila de monitoramento.
                    </div>
                ) : (
                    <>
                        {/* DESKTOP TABLE (hidden on mobile) */}
                        <div className="hidden md:block overflow-x-auto">
                            <table className="w-full text-left text-sm">
                                <thead>
                                    <tr className="border-b border-white/5 bg-white/[0.02]">
                                        <th className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Prioridade</th>
                                        <th className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Timestamp</th>
                                        <th className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Cliente / Patrimônio</th>
                                        <th className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Evento / Zona</th>
                                        <th className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 text-right">Ação</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                    {[...activePendencias]
                                        .sort((a, b) => {
                                            const dateA = new Date(`${a.data_evento}T${a.hora_evento}`);
                                            const dateB = new Date(`${b.data_evento}T${b.hora_evento}`);
                                            return dateB.getTime() - dateA.getTime();
                                        })
                                        .filter(p => {
                                            if (!searchTerm) return true;
                                            const term = searchTerm.toLowerCase();
                                            return (
                                                (p.nome && p.nome.toLowerCase().includes(term)) ||
                                                (p.id_disparo && p.id_disparo.toLowerCase().includes(term)) ||
                                                (p.patrimonio && p.patrimonio.toLowerCase().includes(term)) ||
                                                (p.id_cliente && p.id_cliente.toLowerCase().includes(term))
                                            );
                                        })
                                        .map((pend) => {
                                            const prioValue = Number(pend.prioridade);
                                            const prio = getPriorityConfig(prioValue);
                                            const Icon = prio.icon;
                                            let borderColor = 'border-slate-500';
                                            let badgeColor = 'bg-slate-500 text-white';
                                            let prioLabel = prio.label;
                                            if (pend.evento_codigo === '9704') { borderColor = 'border-black'; badgeColor = 'bg-black text-[#ff0000] border border-[#ff0000]/50 shadow-[0_0_15px_rgba(255,0,0,0.4)]'; prioLabel = 'ENERGIA'; }
                                            else if (pend.evento_codigo === '9065') { borderColor = 'border-[#00e1d9]'; badgeColor = 'bg-[#00e1d9] text-black shadow-[0_0_15px_rgba(0,225,217,0.3)]'; prioLabel = 'DESLOCAMENTO TÁTICO'; }
                                            else if (pend.evento_codigo?.startsWith('901') && !pend.evento_codigo?.startsWith('9015')) { borderColor = 'border-[#00ff00]'; badgeColor = 'bg-[#00ff00] text-black shadow-[0_0_15px_rgba(0,255,0,0.3)]'; prioLabel = 'HÁBITO'; }
                                            else if (pend.evento_codigo?.startsWith('9015') || pend.evento_codigo?.startsWith('E35')) { borderColor = 'border-[#a855f7]'; badgeColor = 'bg-[#a855f7] text-white shadow-[0_0_15px_rgba(168,85,247,0.4)]'; prioLabel = 'COMUNICAÇÃO'; }
                                            else if (prioValue === 0 || prioValue === 1) { borderColor = 'border-[#ff0000]'; badgeColor = 'bg-[#ff0000] text-white shadow-[0_0_15px_rgba(255,0,0,0.4)]'; }
                                            else if (prioValue === 4) { borderColor = 'border-white'; badgeColor = 'bg-white text-black shadow-[0_0_15px_rgba(255,255,255,0.3)]'; prioLabel = 'ANALÍTICOS'; }
                                            else if (prioValue === 5) { borderColor = 'border-[#007aff]'; badgeColor = 'bg-[#007aff] text-white shadow-[0_0_15px_rgba(0,122,255,0.4)]'; }
                                            return (
                                                <tr key={pend.id_disparo} className={`group hover:bg-white/[0.05] transition-all duration-300 border-b border-white/5 bg-black/20 border-l-[6px] ${borderColor}`}>
                                                    <td className="px-6 py-3">
                                                        <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${badgeColor} ${prioValue === 1 && pend.status === 'pendente' ? 'animate-pulse' : ''}`}>
                                                            <Icon className="w-3.5 h-3.5" />{prioLabel}
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-3 whitespace-nowrap">
                                                        <div className="font-bold text-base tracking-tight italic">{pend.hora_evento}</div>
                                                        <div className="text-[10px] opacity-80 font-black tracking-widest">{pend.data_evento}</div>
                                                    </td>
                                                    <td className="px-6 py-3">
                                                        <div className="font-black text-xl tracking-tight">{pend.patrimonio}</div>
                                                        <div className="text-xs opacity-90 font-bold">{pend.nome}</div>
                                                        <div className="text-[10px] opacity-70 font-medium">Cod: {pend.id_cliente}</div>
                                                    </td>
                                                    <td className="px-6 py-3">
                                                        <div className="font-bold">{pend.evento_codigo} {getEventDescription(pend.evento_codigo, pend.descricao_catalogo, pend.desc_evento) ? `- ${getEventDescription(pend.evento_codigo, pend.descricao_catalogo, pend.desc_evento)}` : ''}</div>
                                                        <div className="text-[10px] opacity-80 font-black uppercase tracking-widest">Zona: {pend.zona || pend.particao || '--'} {pend.viatura ? `• Viatura: ${pend.viatura}` : ''}</div>
                                                    </td>
                                                    <td className="px-6 py-3 text-right">
                                                        <button onClick={() => navigate(`/disparo/${pend.id_disparo}`)} className="inline-flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-brand-red text-white text-[10px] font-black uppercase tracking-[0.1em] rounded-lg transition-all duration-300 group/btn border border-white/10 hover:border-brand-red hover:shadow-xl hover:shadow-brand-red/20 min-h-[44px]">
                                                            <Activity className="w-3.5 h-3.5 group-hover/btn:animate-pulse" />ANALISAR COM IA
                                                        </button>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                </tbody>
                            </table>
                        </div>

                        {/* MOBILE CARDS (hidden on desktop) */}
                        <div className="md:hidden divide-y divide-white/5">
                            {[...activePendencias]
                                .sort((a, b) => {
                                    const dateA = new Date(`${a.data_evento}T${a.hora_evento}`);
                                    const dateB = new Date(`${b.data_evento}T${b.hora_evento}`);
                                    return dateB.getTime() - dateA.getTime();
                                })
                                .filter(p => {
                                    if (!searchTerm) return true;
                                    const term = searchTerm.toLowerCase();
                                    return (
                                        (p.nome && p.nome.toLowerCase().includes(term)) ||
                                        (p.id_disparo && p.id_disparo.toLowerCase().includes(term)) ||
                                        (p.patrimonio && p.patrimonio.toLowerCase().includes(term)) ||
                                        (p.id_cliente && p.id_cliente.toLowerCase().includes(term))
                                    );
                                })
                                .map((pend) => {
                                    const prioValue = Number(pend.prioridade);
                                    const prio = getPriorityConfig(prioValue);
                                    const Icon = prio.icon;
                                    let borderColor = 'border-slate-500';
                                    let badgeColor = 'bg-slate-500 text-white';
                                    let prioLabel = prio.label;
                                    if (pend.evento_codigo === '9704') { borderColor = 'border-black'; badgeColor = 'bg-black text-[#ff0000] border border-[#ff0000]/50 shadow-[0_0_15px_rgba(255,0,0,0.4)]'; prioLabel = 'ENERGIA'; }
                                    else if (pend.evento_codigo === '9065') { borderColor = 'border-[#00e1d9]'; badgeColor = 'bg-[#00e1d9] text-black shadow-[0_0_15px_rgba(0,225,217,0.3)]'; prioLabel = 'DESLOCAMENTO TÁTICO'; }
                                    else if (pend.evento_codigo?.startsWith('901') && !pend.evento_codigo?.startsWith('9015')) { borderColor = 'border-[#00ff00]'; badgeColor = 'bg-[#00ff00] text-black shadow-[0_0_15px_rgba(0,255,0,0.3)]'; prioLabel = 'HÁBITO'; }
                                    else if (pend.evento_codigo?.startsWith('9015') || pend.evento_codigo?.startsWith('E35')) { borderColor = 'border-[#a855f7]'; badgeColor = 'bg-[#a855f7] text-white shadow-[0_0_15px_rgba(168,85,247,0.4)]'; prioLabel = 'COMUNICAÇÃO'; }
                                    else if (prioValue === 0 || prioValue === 1) { borderColor = 'border-[#ff0000]'; badgeColor = 'bg-[#ff0000] text-white shadow-[0_0_15px_rgba(255,0,0,0.4)]'; }
                                    else if (prioValue === 4) { borderColor = 'border-white'; badgeColor = 'bg-white text-black shadow-[0_0_15px_rgba(255,255,255,0.3)]'; prioLabel = 'ANALÍTICOS'; }
                                    else if (prioValue === 5) { borderColor = 'border-[#007aff]'; badgeColor = 'bg-[#007aff] text-white shadow-[0_0_15px_rgba(0,122,255,0.4)]'; }
                                    return (
                                        <div key={pend.id_disparo} className={`p-4 border-l-[5px] ${borderColor} bg-black/20 active:bg-white/[0.05] transition-colors`}>
                                            <div className="flex items-start justify-between gap-3 mb-2">
                                                <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${badgeColor} ${prioValue === 1 && pend.status === 'pendente' ? 'animate-pulse' : ''}`}>
                                                    <Icon className="w-3 h-3" />{prioLabel}
                                                </div>
                                                <span className="text-[10px] text-slate-500 font-bold tabular-nums whitespace-nowrap">{pend.hora_evento} • {pend.data_evento}</span>
                                            </div>
                                            <div className="mb-2">
                                                <div className="font-black text-lg text-white tracking-tight leading-tight">{pend.patrimonio}</div>
                                                <div className="text-xs text-slate-300 font-bold truncate">{pend.nome}</div>
                                            </div>
                                            <div className="flex items-center justify-between gap-2">
                                                <div className="min-w-0">
                                                    <div className="text-xs font-bold text-slate-400 truncate">{pend.evento_codigo} {getEventDescription(pend.evento_codigo, pend.descricao_catalogo, pend.desc_evento) ? `- ${getEventDescription(pend.evento_codigo, pend.descricao_catalogo, pend.desc_evento)}` : ''}</div>
                                                    <div className="text-[9px] text-slate-600 font-black uppercase tracking-widest">Zona: {pend.zona || pend.particao || '--'}</div>
                                                </div>
                                                <button
                                                    onClick={() => navigate(`/disparo/${pend.id_disparo}`)}
                                                    className="shrink-0 inline-flex items-center gap-1.5 px-3 py-2.5 bg-white/5 active:bg-brand-red text-white text-[9px] font-black uppercase tracking-wider rounded-lg border border-white/10 active:border-brand-red min-h-[44px] min-w-[44px]"
                                                >
                                                    <Activity className="w-3.5 h-3.5" />
                                                    <span className="hidden xs:inline">IA</span>
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};
