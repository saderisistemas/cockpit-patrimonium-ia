import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BarChart3, TrendingUp, ShieldAlert, CheckCircle2, ArrowLeft, Loader2, AlertTriangle, Clock, Info } from 'lucide-react';
import { api } from '../lib/api';
import { getEventDescription } from '../lib/eventUtils';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    AreaChart, Area, PieChart, Pie, Cell, Legend
} from 'recharts';

const COLORS = {
    purple: '#8b5cf6',
    blue: '#3b82f6',
    red: '#ef4444',
    green: '#22c55e',
    amber: '#f59e0b',
    cyan: '#06b6d4',
    pink: '#ec4899',
    slate: '#64748b',
};

const SCORE_COLORS = [COLORS.red, COLORS.amber, COLORS.green];

export default function Relatorios() {
    const navigate = useNavigate();
    const [period, setPeriod] = useState(7);
    const [loading, setLoading] = useState(true);
    const [pendencias, setPendencias] = useState<any[]>([]);
    const [analises, setAnalises] = useState<any[]>([]);

    useEffect(() => {
        loadData();
    }, [period]);

    async function loadData() {
        setLoading(true);
        try {
            const [pend, anal] = await Promise.all([
                api.fetchPendenciasReport(period),
                api.fetchAnalisesReport(period),
            ]);
            setPendencias(pend);
            setAnalises(anal);
        } catch (e) {
            console.error('Erro ao carregar relatórios:', e);
        } finally {
            setLoading(false);
        }
    }

    // ===== KPI Calculations =====
    const totalEvents = pendencias.length;
    const scores = analises.map(a => a.score).filter((s: number) => s != null);
    const avgScore = scores.length > 0 ? Math.round(scores.reduce((a: number, b: number) => a + b, 0) / scores.length) : 0;
    const closedCount = pendencias.filter(p => p.status === 'fechado' || p.status === 'arquivado_cockpit').length;
    const closeRate = totalEvents > 0 ? Math.round((closedCount / totalEvents) * 100) : 0;
    const criticalCount = pendencias.filter(p => p.prioridade === 'E' || p.prioridade === 'H').length;

    // ===== Chart Data =====

    // Events per day
    const byDayMap: Record<string, number> = {};
    pendencias.forEach(p => {
        byDayMap[p.data_evento] = (byDayMap[p.data_evento] || 0) + 1;
    });
    const eventsByDay = Object.entries(byDayMap)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([date, count]) => ({
            dia: date.substring(5), // MM-DD
            eventos: count
        }));

    // Events per hour
    const byHourMap: Record<string, number> = {};
    for (let i = 0; i < 24; i++) byHourMap[String(i).padStart(2, '0')] = 0;
    pendencias.forEach(p => {
        if (p.hora_evento) {
            const h = p.hora_evento.split(':')[0];
            byHourMap[h] = (byHourMap[h] || 0) + 1;
        }
    });
    const eventsByHour = Object.entries(byHourMap)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([hora, count]) => ({ hora: hora + 'h', eventos: count }));

    // Top 10 events
    const byCodeMap: Record<string, { count: number, name: string, patrimonios: Set<string> }> = {};
    pendencias.forEach(p => {
        if (!byCodeMap[p.evento_codigo]) byCodeMap[p.evento_codigo] = { count: 0, name: getEventDescription(p.evento_codigo, p.descricao_catalogo || p.desc_evento || ''), patrimonios: new Set() };
        byCodeMap[p.evento_codigo].count += 1;
        if (p.patrimonio) byCodeMap[p.evento_codigo].patrimonios.add(p.patrimonio);
    });
    const topEvents = Object.entries(byCodeMap)
        .sort((a, b) => b[1].count - a[1].count)
        .slice(0, 10)
        .map(([code, data]) => ({
            codigo: code,
            nome: data.name,
            total: data.count,
            patrimonios: Array.from(data.patrimonios)
        }));

    // Score distribution
    const scoreDistribution = [
        { name: 'Crítico (71-100)', value: scores.filter((s: number) => s >= 71).length },
        { name: 'Atenção (41-70)', value: scores.filter((s: number) => s >= 41 && s <= 70).length },
        { name: 'Normal (0-40)', value: scores.filter((s: number) => s <= 40).length },
    ].filter(d => d.value > 0);


    // ===== Specific Insights (Pedidos Adicionais) =====

    // 1. Disparos Excessivos (Patrimonio + Zona)
    const excessiveMap: Record<string, { count: number, name: string, events: Set<string>, protocolos: Set<string> }> = {};
    pendencias.forEach(p => {
        if (!p.patrimonio) return;
        const key = `${p.patrimonio} - Z:${p.zona || 'N/A'}`;
        if (!excessiveMap[key]) excessiveMap[key] = { count: 0, name: p.nome || p.id_cliente, events: new Set(), protocolos: new Set() };
        excessiveMap[key].count += 1;
        excessiveMap[key].events.add(p.evento_codigo);
        if (p.id_disparo) excessiveMap[key].protocolos.add(String(p.id_disparo));
    });
    const excessiveList = Object.entries(excessiveMap)
        .filter(([_, data]) => data.count > 3) // Exibe os que dispararam mais de 3x no período
        .sort((a, b) => b[1].count - a[1].count)
        .slice(0, 5); // Top 5

    // 2. 9015 nas últimas 12 horas
    const now = new Date();
    const twelveHoursAgo = new Date(now.getTime() - 12 * 60 * 60 * 1000);
    const events9015 = pendencias.filter(p => {
        if (p.evento_codigo !== '9015') return false;
        const pDate = new Date(`${p.data_evento}T${p.hora_evento || '00:00:00'}-03:00`);
        return pDate >= twelveHoursAgo;
    });
    const byPatrimonio9015 = events9015.reduce((acc, p) => {
        if (!acc[p.patrimonio]) {
            acc[p.patrimonio] = { count: 0, name: p.nome || p.id_cliente };
        }
        acc[p.patrimonio].count += 1;
        return acc;
    }, {} as Record<string, { count: number, name: string }>);
    const top9015 = (Object.entries(byPatrimonio9015) as [string, { count: number, name: string }][])
        .sort((a, b) => b[1].count - a[1].count);


    const kpis = [
        { label: 'Total de Eventos', value: totalEvents.toLocaleString(), icon: BarChart3, color: COLORS.blue, sub: `Últimos ${period} dias`, info: 'Soma total de todos os eventos recebidos no período.' },
        { label: 'Score Médio IA', value: avgScore.toString(), icon: TrendingUp, color: avgScore > 70 ? COLORS.red : avgScore > 40 ? COLORS.amber : COLORS.green, sub: `${analises.length} análises`, info: 'Grau médio de severidade calculado pela IA (varia de 0 a 100).' },
        { label: 'Taxa de Fechamento', value: closeRate + '%', icon: CheckCircle2, color: COLORS.green, sub: `${closedCount} de ${totalEvents}`, info: 'Porcentagem de eventos que já foram concluídos/fechados pelo time.' },
        { label: 'Eventos Críticos', value: criticalCount.toLocaleString(), icon: ShieldAlert, color: COLORS.red, sub: 'Prioridade E/H', info: 'Quantidade de alertas graves (Emergência ou Alta prioridade).' },
    ];

    return (
        <div style={{
            minHeight: '100vh',
            background: 'linear-gradient(135deg, #0a0a0f 0%, #1a1a2e 50%, #16213e 100%)',
            color: '#e2e8f0',
            padding: '24px',
            fontFamily: "'Barlow Condensed', sans-serif"
        }}>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '32px', flexWrap: 'wrap', gap: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <button
                        onClick={() => navigate('/')}
                        style={{
                            background: 'rgba(255,255,255,0.05)',
                            border: '1px solid rgba(255,255,255,0.1)',
                            borderRadius: '10px',
                            color: '#94a3b8',
                            padding: '8px 12px',
                            cursor: 'pointer',
                            display: 'flex', alignItems: 'center', gap: '6px',
                            fontFamily: "'Barlow Condensed', sans-serif",
                            transition: 'all 0.2s',
                        }}
                        onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
                        onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
                    >
                        <ArrowLeft size={16} /> Voltar
                    </button>
                    <div>
                        <h1 style={{ fontSize: '28px', fontWeight: 700, margin: 0, background: 'linear-gradient(90deg, #8b5cf6, #3b82f6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', letterSpacing: '0.05em' }}>
                            RELATÓRIOS E KPI'S
                        </h1>
                        <p style={{ margin: 0, color: '#64748b', fontSize: '14px', fontFamily: "'JetBrains Mono', monospace" }}>ANALÍTICO DE INCIDENTES</p>
                    </div>
                </div>

                {/* Period selector */}
                <div style={{ display: 'flex', gap: '8px', fontFamily: "'JetBrains Mono', monospace" }}>
                    {[{ label: 'Hoje', value: 1 }, { label: '7 dias', value: 7 }, { label: '14 dias', value: 14 }].map(opt => (
                        <button
                            key={opt.value}
                            onClick={() => setPeriod(opt.value)}
                            style={{
                                padding: '8px 16px',
                                borderRadius: '8px',
                                border: period === opt.value ? '1px solid #8b5cf6' : '1px solid rgba(255,255,255,0.1)',
                                background: period === opt.value ? 'rgba(139,92,246,0.2)' : 'rgba(255,255,255,0.05)',
                                color: period === opt.value ? '#c4b5fd' : '#94a3b8',
                                cursor: 'pointer',
                                fontWeight: period === opt.value ? 600 : 400,
                                fontSize: '12px',
                                textTransform: 'uppercase',
                                transition: 'all 0.2s',
                            }}
                        >
                            {opt.label}
                        </button>
                    ))}
                </div>
            </div>

            {loading ? (
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
                    <Loader2 size={40} style={{ animation: 'spin 1s linear infinite', color: '#8b5cf6' }} />
                    <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
                </div>
            ) : (
                <>
                    {/* KPI Cards */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '24px' }}>
                        {kpis.map((kpi, i) => (
                            <div
                                key={i}
                                style={{
                                    background: 'rgba(255,255,255,0.03)',
                                    backdropFilter: 'blur(20px)',
                                    border: '1px solid rgba(255,255,255,0.06)',
                                    borderRadius: '12px',
                                    padding: '24px',
                                    position: 'relative',
                                    overflow: 'hidden',
                                    animation: `fadeSlideUp 0.5s ease ${i * 0.1}s both`,
                                }}
                            >
                                <div style={{
                                    position: 'absolute', top: '-10px', right: '-10px', width: '80px', height: '80px',
                                    borderRadius: '50%', background: kpi.color, opacity: 0.1, filter: 'blur(20px)'
                                }} />
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                                    <kpi.icon size={20} style={{ color: kpi.color }} />
                                    <span style={{ color: '#94a3b8', fontSize: '15px', fontWeight: 600, letterSpacing: '0.05em' }}>{kpi.label}</span>
                                    <div title={kpi.info} style={{ cursor: 'help', color: '#475569', display: 'flex' }}>
                                        <Info size={14} />
                                    </div>
                                </div>
                                <div style={{ fontSize: '36px', fontWeight: 800, color: '#f1f5f9', letterSpacing: '-0.02em', fontFamily: "'JetBrains Mono', monospace" }}>
                                    {kpi.value}
                                </div>
                                <div style={{ color: '#64748b', fontSize: '13px', marginTop: '4px' }}>{kpi.sub}</div>
                            </div>
                        ))}
                    </div>

                    {/* Charts Grid */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '20px', marginBottom: '20px' }}>

                        {/* Events per Day */}
                        <ChartCard title="VOLUME EVENTOS / DIA" info="Quantidade de eventos disparados por dia durante o período selecionado.">
                            <ResponsiveContainer width="100%" height={280}>
                                <BarChart data={eventsByDay} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                                    <XAxis dataKey="dia" tick={{ fill: '#64748b', fontSize: 12, fontFamily: "'JetBrains Mono', monospace" }} />
                                    <YAxis tick={{ fill: '#64748b', fontSize: 12, fontFamily: "'JetBrains Mono', monospace" }} />
                                    <Tooltip contentStyle={{ background: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#e2e8f0' }} />
                                    <Bar dataKey="eventos" fill={COLORS.purple} radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </ChartCard>

                        {/* Hourly Distribution */}
                        <ChartCard title="DISTRIBUIÇÃO DE EVENTOS / HORA" info="Horários de pico de alertas recebidos. Ajuda a entender onde há mais stress operacional.">
                            <ResponsiveContainer width="100%" height={280}>
                                <AreaChart data={eventsByHour} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                                    <defs>
                                        <linearGradient id="gradBlue" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor={COLORS.blue} stopOpacity={0.4} />
                                            <stop offset="95%" stopColor={COLORS.blue} stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                                    <XAxis dataKey="hora" tick={{ fill: '#64748b', fontSize: 11, fontFamily: "'JetBrains Mono', monospace" }} interval={1} />
                                    <YAxis tick={{ fill: '#64748b', fontSize: 12, fontFamily: "'JetBrains Mono', monospace" }} />
                                    <Tooltip contentStyle={{ background: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#e2e8f0' }} />
                                    <Area type="monotone" dataKey="eventos" stroke={COLORS.blue} fill="url(#gradBlue)" strokeWidth={2} />
                                </AreaChart>
                            </ResponsiveContainer>
                        </ChartCard>

                        {/* Top Events */}
                        <ChartCard title="TOP EVENTOS DISPARADOS" info="Os 10 códigos de alerta que tiveram maior volume no período e os principais patrimônios.">
                            <ResponsiveContainer width="100%" height={280}>
                                <BarChart data={topEvents} layout="vertical" margin={{ top: 5, right: 30, left: 30, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                                    <XAxis type="number" tick={{ fill: '#64748b', fontSize: 12, fontFamily: "'JetBrains Mono', monospace" }} />
                                    <YAxis dataKey="codigo" type="category" tick={{ fill: '#94a3b8', fontSize: 13, fontWeight: 700 }} width={60} />
                                    <Tooltip content={<CustomEventTooltip />} cursor={{ fill: 'rgba(255,255,255,0.05)' }} />
                                    <Bar dataKey="total" fill={COLORS.cyan} radius={[0, 4, 4, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </ChartCard>

                        {/* Score Distribution */}
                        <ChartCard title="DISTRIBUIÇÃO SCORE IA" info="Classificação de severidade da IA (Score de 0 a 100) para os eventos analisados no período.">
                            {scoreDistribution.length > 0 ? (
                                <ResponsiveContainer width="100%" height={280}>
                                    <PieChart>
                                        <Pie
                                            data={scoreDistribution}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={60}
                                            outerRadius={100}
                                            paddingAngle={4}
                                            dataKey="value"
                                            stroke="none"
                                        >
                                            {scoreDistribution.map((_, idx) => (
                                                <Cell key={idx} fill={SCORE_COLORS[idx]} />
                                            ))}
                                        </Pie>
                                        <Tooltip content={<CustomPieTooltip />} />
                                        <Legend wrapperStyle={{ color: '#94a3b8', fontSize: '13px', paddingTop: '20px' }} />
                                    </PieChart>
                                </ResponsiveContainer>
                            ) : (
                                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '280px', color: '#475569' }}>
                                    Nenhuma análise IA no período
                                </div>
                            )}
                        </ChartCard>
                    </div>

                    {/* Operational Insights (Tático) */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '20px', marginBottom: '20px' }}>
                        {/* Disparos Excessivos */}
                        <div style={{
                            background: 'rgba(239, 68, 68, 0.03)',
                            border: '1px solid rgba(239, 68, 68, 0.2)',
                            borderRadius: '16px',
                            padding: '20px',
                            animation: 'fadeSlideUp 0.6s ease both',
                        }}>
                            <h3 style={{
                                fontSize: '16px', fontWeight: 700, color: '#f87171',
                                margin: '0 0 16px 0', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: '8px'
                            }}>
                                <AlertTriangle size={18} /> ATENÇÃO TÁTICA: DISPAROS EXCESSIVOS (MESMA ZONA)
                            </h3>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                {excessiveList.length > 0 ? excessiveList.map(([key, data], idx) => (
                                    <div key={idx} style={{
                                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                        background: 'rgba(30, 41, 59, 0.5)', border: '1px solid rgba(255,255,255,0.05)',
                                        padding: '12px 16px', borderRadius: '8px'
                                    }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                            <div style={{
                                                width: '8px', height: '8px', borderRadius: '50%',
                                                background: data.count > 10 ? '#ef4444' : '#f59e0b',
                                                boxShadow: `0 0 8px ${data.count > 10 ? '#ef4444' : '#f59e0b'}`
                                            }} />
                                            <div>
                                                <div style={{ fontSize: '16px', fontWeight: 600, color: '#f8fafc', letterSpacing: '0.05em' }}>
                                                    PATRIMÔNIO {key.split(' - ')[0]} <span style={{ fontSize: '12px', color: '#94a3b8', marginLeft: '6px', fontWeight: 400 }}>- {data.name}</span>
                                                </div>
                                                <div style={{ fontSize: '13px', color: '#94a3b8', fontFamily: "'JetBrains Mono', monospace", marginTop: '4px' }}>
                                                    ZONA: {key.split(' - ')[1].replace('Z:', '')} | Eventos: {Array.from(data.events).join(', ')}
                                                </div>
                                                <div style={{ fontSize: '11px', color: '#64748b', fontFamily: "'JetBrains Mono', monospace", marginTop: '4px' }}>
                                                    Protocolos: {Array.from(data.protocolos).slice(0, 5).join(', ')}{data.protocolos.size > 5 ? '...' : ''}
                                                </div>
                                            </div>
                                        </div>
                                        <div style={{
                                            background: 'rgba(239, 68, 68, 0.1)', color: '#f87171', border: '1px solid rgba(239, 68, 68, 0.2)',
                                            padding: '4px 12px', borderRadius: '20px', fontSize: '14px', fontWeight: 700, fontFamily: "'JetBrains Mono', monospace"
                                        }}>
                                            {data.count}x
                                        </div>
                                    </div>
                                )) : (
                                    <div style={{ padding: '20px', textAlign: 'center', color: '#64748b' }}>Nenhum padrão crítico detectado no período filtrado.</div>
                                )}
                            </div>
                        </div>

                        {/* Eventos 9015 nas ultimas 12h */}
                        <div style={{
                            background: 'rgba(168, 85, 247, 0.03)',
                            border: '1px solid rgba(168, 85, 247, 0.2)',
                            borderRadius: '16px',
                            padding: '20px',
                            animation: 'fadeSlideUp 0.6s ease both',
                        }}>
                            <h3 style={{
                                fontSize: '16px', fontWeight: 700, color: '#a855f7',
                                margin: '0 0 16px 0', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: '8px'
                            }}>
                                <Clock size={18} /> RADAR E9015 (ÚLTIMAS 12 HORAS)
                            </h3>
                            <div style={{ fontSize: '13px', color: '#94a3b8', marginBottom: '16px' }}>
                                Painéis com perda de comunicação GPRS nas últimas 12 horas:
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '10px' }}>
                                {top9015.length > 0 ? top9015.slice(0, 10).map(([patrimonio, data], idx) => (
                                    <div key={idx} title={data.name} style={{
                                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                        background: 'rgba(15, 23, 42, 0.6)', border: '1px solid rgba(255,255,255,0.05)',
                                        padding: '12px', borderRadius: '8px', cursor: 'help'
                                    }}>
                                        <span style={{ fontWeight: 600, color: '#e2e8f0', letterSpacing: '0.05em' }}>PTR {patrimonio}</span>
                                        <div style={{
                                            background: 'rgba(168, 85, 247, 0.1)', color: '#a855f7',
                                            padding: '2px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: 700, fontFamily: "'JetBrains Mono', monospace"
                                        }}>
                                            {String(data.count)} falhas
                                        </div>
                                    </div>
                                )) : (
                                    <div style={{ padding: '20px', textAlign: 'center', color: '#64748b', gridColumn: '1 / -1' }}>Nenhuma perda de comunicação recente.</div>
                                )}
                            </div>
                        </div>
                    </div>

                    <div style={{ textAlign: 'center', marginTop: '40px', paddingBottom: '20px', color: '#475569', fontSize: '12px', letterSpacing: '0.05em' }}>
                        Desenvolvido por Danilo Saderi
                    </div>

                    <style>{`
            @keyframes fadeSlideUp {
              from { opacity: 0; transform: translateY(20px); }
              to { opacity: 1; transform: translateY(0); }
            }
          `}</style>
                </>
            )}
        </div>
    );
}

const CustomEventTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
        const data = payload[0].payload;
        return (
            <div style={{ background: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', padding: '12px', borderRadius: '8px', color: '#e2e8f0', fontFamily: "'JetBrains Mono', monospace", maxWidth: '320px', whiteSpace: 'normal', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.5)' }}>
                <p style={{ margin: '0 0 8px 0', fontSize: '14px', fontWeight: 'bold' }}>Evento {data.codigo}</p>
                <p style={{ margin: '0 0 8px 0', fontSize: '13px', color: '#38bdf8' }}>{data.nome}</p>
                <p style={{ margin: 0, fontSize: '13px', color: '#64748b' }}>Total: <span style={{ color: '#fff' }}>{data.total}</span></p>
                {data.patrimonios && data.patrimonios.length > 0 && (
                    <div style={{ marginTop: '8px', fontSize: '11px', color: '#94a3b8', lineHeight: '1.4' }}>
                        Patrimônios: <span style={{ color: '#cbd5e1' }}>{data.patrimonios.slice(0, 10).join(', ')}{data.patrimonios.length > 10 ? '...' : ''}</span>
                    </div>
                )}
            </div>
        );
    }
    return null;
};

const CustomPieTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
        return (
            <div style={{ background: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', padding: '12px', borderRadius: '8px', color: '#e2e8f0', fontFamily: "'JetBrains Mono', monospace", boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.5)' }}>
                <p style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ display: 'inline-block', width: '12px', height: '12px', backgroundColor: payload[0].payload.fill, borderRadius: '2px' }}></span>
                    <span style={{ color: '#e2e8f0', fontSize: '13px' }}>{payload[0].name}: <span style={{ fontWeight: 'bold', color: '#fff' }}>{payload[0].value}</span></span>
                </p>
            </div>
        );
    }
    return null;
};

function ChartCard({ title, children, info }: { title: string; children: React.ReactNode; info?: string }) {
    return (
        <div style={{
            background: 'rgba(255,255,255,0.03)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255,255,255,0.06)',
            borderRadius: '16px',
            padding: '24px',
            animation: 'fadeSlideUp 0.6s ease both',
        }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '12px' }}>
                <h3 style={{
                    fontSize: '16px', fontWeight: 800, color: '#f1f5f9', letterSpacing: '0.05em', margin: 0
                }}>
                    {title}
                </h3>
                {info && (
                    <div title={info} style={{ cursor: 'help', color: '#64748b', display: 'flex' }}>
                        <Info size={16} />
                    </div>
                )}
            </div>
            {children}
        </div>
    );
}
