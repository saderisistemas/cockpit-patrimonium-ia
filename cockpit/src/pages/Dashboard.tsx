import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, AlertTriangle, ShieldAlert, BadgeInfo, Activity, Search } from 'lucide-react';
import { api } from '../lib/api';
import type { Pendencia } from '../lib/api';

export const Dashboard = () => {
    const [pendencias, setPendencias] = useState<Pendencia[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const navigate = useNavigate();

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

        return () => {
            subscription.unsubscribe();
        };
    }, []);

    const getPriorityConfig = (pri: number | null) => {
        if (pri === 1) return { color: 'bg-red-500/20 text-red-500 border-red-500/30', icon: ShieldAlert, label: 'Crítica' };
        if (pri === 2) return { color: 'bg-orange-500/20 text-orange-500 border-orange-500/30', icon: AlertTriangle, label: 'Alta' };
        return { color: 'bg-blue-500/20 text-blue-500 border-blue-500/30', icon: BadgeInfo, label: 'Normal' };
    };

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-10">
            {/* HEADER & KPIs */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                    <h1 className="text-4xl font-black text-white tracking-tight italic">FILA DE <span className="text-brand-red not-italic">ATENDIMENTO</span></h1>
                    <div className="flex items-center gap-3 mt-1">
                        <p className="text-slate-400 font-medium uppercase tracking-[0.3em] text-[10px]">Terminal de Monitoramento Iris</p>
                        <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                            <span className="text-[8px] font-black text-emerald-500 uppercase tracking-widest">Live Sync</span>
                        </div>
                    </div>
                </div>

                <div className="flex gap-4">
                    <button
                        onClick={() => {
                            setLoading(true);
                            fetchPendencias();
                        }}
                        disabled={loading}
                        className="glass-card px-4 flex flex-col justify-center items-center gap-1 min-w-[80px] hover:bg-white/5 transition-colors disabled:opacity-50 cursor-pointer group"
                        title="Atualizar Fila Manualmente"
                    >
                        <Activity className={`w-5 h-5 text-slate-400 group-hover:text-white transition-colors ${loading ? 'animate-spin' : ''}`} />
                        <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest group-hover:text-slate-300">Atualizar</span>
                    </button>
                    <div className="glass-card p-5 flex items-center gap-5 min-w-[220px] relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-1 h-full bg-brand-red opacity-50" />
                        <div className="w-14 h-14 bg-brand-red/10 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110 duration-300">
                            <ShieldAlert className="w-8 h-8 text-brand-red" />
                        </div>
                        <div>
                            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Críticos</p>
                            <p className="text-3xl font-black text-white tabular-nums">
                                {pendencias.filter(p => (p.prioridade === 1 || p.prioridade === 2) && p.status === 'pendente').length}
                            </p>
                        </div>
                    </div>

                    <div className="glass-card p-5 flex items-center gap-5 min-w-[220px] relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-1 h-full bg-white/20" />
                        <div className="w-14 h-14 bg-white/5 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110 duration-300">
                            <Eye className="w-8 h-8 text-slate-300" />
                        </div>
                        <div>
                            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Pendentes</p>
                            <p className="text-3xl font-black text-white tabular-nums">
                                {pendencias.filter(p => p.status === 'pendente').length}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* SEARCH BAR */}
            <div className="flex items-center gap-4 bg-white/[0.03] border border-white/10 rounded-2xl p-3 px-5 focus-within:border-brand-red focus-within:ring-1 focus-within:ring-brand-red/50 transition-all shadow-xl shadow-black/20">
                <Search className="w-5 h-5 text-slate-400" />
                <input
                    type="text"
                    placeholder="Buscar por Nome do titular, Protocolo (Disparo) ou Patrimônio..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="bg-transparent border-none placeholder:text-slate-600 text-white font-medium focus:outline-none w-full text-sm outline-none"
                />
            </div>

            {/* DATA TABLE */}
            <div className="glass-card shadow-2xl shadow-black/40 overflow-hidden relative">
                <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead>
                            <tr className="border-b border-white/5 bg-white/[0.02]">
                                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Prioridade</th>
                                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Timestamp</th>
                                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Cliente / Patrimônio</th>
                                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Evento / Zona</th>
                                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 text-right">Ação</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {loading ? (
                                <tr>
                                    <td colSpan={5} className="px-8 py-20 text-center">
                                        <div className="flex flex-col items-center gap-4">
                                            <div className="w-8 h-8 border-2 border-brand-red border-t-transparent rounded-full animate-spin" />
                                            <span className="text-slate-500 font-bold uppercase tracking-widest text-xs">Sincronizando Banco de Dados...</span>
                                        </div>
                                    </td>
                                </tr>
                            ) : pendencias.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-8 py-20 text-center text-slate-500 font-medium italic">
                                        Nenhum evento crítico na fila de monitoramento.
                                    </td>
                                </tr>
                            ) : (
                                pendencias
                                    .filter(p => p.status === 'pendente')
                                    .sort((a, b) => {
                                        // Sort newest first by date and time
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
                                        const prio = getPriorityConfig(pend.prioridade);
                                        const Icon = prio.icon;
                                        const isCritical = pend.prioridade === 1;

                                        return (
                                            <tr key={pend.id_disparo} className="group hover:bg-white/[0.03] transition-all duration-300">
                                                <td className="px-8 py-6">
                                                    <div className="flex flex-col gap-2 items-start">
                                                        <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border shadow-lg ${prio.color} ${isCritical && pend.status === 'pendente' ? 'animate-pulse' : ''}`}>
                                                            <Icon className="w-3.5 h-3.5" />
                                                            {prio.label}
                                                        </div>
                                                        {pend.status === 'pendente' ? (
                                                            <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-widest bg-amber-500/10 text-amber-500 border border-amber-500/20">
                                                                <Activity className="w-3 h-3" /> Pendente
                                                            </div>
                                                        ) : (
                                                            <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-widest bg-slate-500/10 text-slate-400 border border-slate-500/20">
                                                                Fechado
                                                            </div>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-8 py-6 whitespace-nowrap">
                                                    <div className="text-white font-bold text-base tracking-tight italic">{pend.hora_evento}</div>
                                                    <div className="text-[10px] text-slate-500 font-black tracking-widest">{pend.data_evento}</div>
                                                </td>
                                                <td className="px-8 py-6">
                                                    <div className="text-white font-bold text-base group-hover:text-brand-red transition-colors">{pend.nome}</div>
                                                    <div className="text-xs text-slate-500 font-medium">Cod: {pend.id_cliente} • <span className="text-slate-400">{pend.patrimonio}</span></div>
                                                </td>
                                                <td className="px-8 py-6">
                                                    <div className="text-white font-bold">{pend.evento_codigo} {pend.desc_evento ? `- ${pend.desc_evento}` : ''}</div>
                                                    <div className="text-[10px] text-slate-500 font-black uppercase tracking-widest">
                                                        Partição: {pend.particao} {pend.viatura ? `• Viatura: ${pend.viatura}` : ''}
                                                    </div>
                                                </td>
                                                <td className="px-8 py-6 text-right">
                                                    <button
                                                        onClick={() => navigate(`/disparo/${pend.id_disparo}`)}
                                                        className="inline-flex items-center gap-2 px-6 py-3 bg-white/5 hover:bg-brand-red text-white text-xs font-black uppercase tracking-[0.15em] rounded-xl transition-all duration-300 group/btn border border-white/5 hover:border-brand-red hover:shadow-xl hover:shadow-brand-red/20"
                                                    >
                                                        <Activity className="w-4 h-4 group-hover/btn:animate-pulse" />
                                                        Monitorar
                                                    </button>
                                                </td>
                                            </tr>
                                        )
                                    })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};
