import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ClipboardList, ChevronLeft, AlertTriangle, Wrench, Search, Filter, Clock, CheckCircle2, CircleDot, ArrowUpDown, BarChart3 } from 'lucide-react';
import { api } from '../lib/api';
import type { OrdemServico } from '../lib/api';
import toast from 'react-hot-toast';

// Helpers de badge
const getStatusConfig = (status: string | null) => {
    switch (status?.toLowerCase()) {
        case 'aberta':
            return { label: 'ABERTA', bg: 'rgba(239,68,68,0.12)', border: 'rgba(239,68,68,0.3)', color: '#ef4444', icon: CircleDot };
        case 'em_andamento':
            return { label: 'EM ANDAMENTO', bg: 'rgba(245,158,11,0.12)', border: 'rgba(245,158,11,0.3)', color: '#f59e0b', icon: Clock };
        case 'fechada':
            return { label: 'FECHADA', bg: 'rgba(34,197,94,0.12)', border: 'rgba(34,197,94,0.3)', color: '#22c55e', icon: CheckCircle2 };
        default:
            return { label: status || 'N/D', bg: 'rgba(148,163,184,0.12)', border: 'rgba(148,163,184,0.3)', color: '#94a3b8', icon: CircleDot };
    }
};

const getSuspeitaConfig = (prioridade: string | null) => {
    switch (prioridade?.toLowerCase()) {
        case 'alta':
            return { label: 'ALTA', bg: 'rgba(239,68,68,0.15)', border: 'rgba(239,68,68,0.35)', color: '#ef4444' };
        case 'média':
        case 'media':
            return { label: 'MÉDIA', bg: 'rgba(245,158,11,0.15)', border: 'rgba(245,158,11,0.35)', color: '#f59e0b' };
        case 'baixa':
            return { label: 'BAIXA', bg: 'rgba(34,197,94,0.15)', border: 'rgba(34,197,94,0.35)', color: '#22c55e' };
        default:
            return { label: prioridade || 'N/D', bg: 'rgba(148,163,184,0.15)', border: 'rgba(148,163,184,0.35)', color: '#94a3b8' };
    }
};

const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '--';
    try {
        const d = new Date(dateStr);
        return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' }) +
            ' ' + d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    } catch {
        return dateStr;
    }
};

// Helper para corrigir caracteres estranhos provindos da IA (ex: ≥ corrompido para ?)
const sanitizeText = (text: string | null | undefined) => {
    if (!text) return '';
    // Substitui ? ou U+FFFD por >= (maior ou igual) que é o símbolo geralmente corrompido nesses logs
    return text.replace(/\?/g, '>=').replace(/\uFFFD/g, '');
};

export const OrdensServico = () => {
    const navigate = useNavigate();
    const [ordens, setOrdens] = useState<OrdemServico[]>([]);
    const [loading, setLoading] = useState(true);
    const [filtroStatus, setFiltroStatus] = useState<string>('');
    const [filtroSuspeita, setFiltroSuspeita] = useState<string>('');
    const [filtroTipo, setFiltroTipo] = useState<string>('');
    const [busca, setBusca] = useState<string>('');

    const fetchOrdens = useCallback(async () => {
        try {
            const filters: any = {};
            if (filtroStatus) filters.status_os = filtroStatus;
            if (filtroSuspeita) filters.prioridade_os = filtroSuspeita;
            if (filtroTipo) filters.tipo_os = filtroTipo;
            const data = await api.getOrdensServico(filters);
            setOrdens(data);
        } catch (error) {
            console.error('Erro ao buscar ordens de serviço:', error);
            toast.error('Erro ao carregar ordens de serviço.');
        } finally {
            setLoading(false);
        }
    }, [filtroStatus, filtroSuspeita, filtroTipo]);

    useEffect(() => {
        fetchOrdens();
    }, [fetchOrdens]);

    // Realtime
    useEffect(() => {
        const sub = api.subscribeOrdensServico(() => {
            fetchOrdens();
        });
        return () => { sub.unsubscribe(); };
    }, [fetchOrdens]);

    // Filtrar por busca local
    const ordensFiltradas = ordens.filter(os => {
        if (!busca) return true;
        const termo = busca.toLowerCase();
        return (
            (os.patrimonio || '').toLowerCase().includes(termo) ||
            (os.patrimonio_normalizado || '').toLowerCase().includes(termo) ||
            (os.endereco || '').toLowerCase().includes(termo) ||
            (os.codigo_evento || '').toLowerCase().includes(termo) ||
            (os.motivo_os || '').toLowerCase().includes(termo) ||
            (os.id_disparo || '').toLowerCase().includes(termo) ||
            (os.tipo_os || '').toLowerCase().includes(termo)
        );
    });

    // KPIs
    const totalAbertas = ordens.filter(o => o.status_os === 'aberta').length;
    const totalAndamento = ordens.filter(o => o.status_os === 'em_andamento').length;
    const totalFechadas = ordens.filter(o => o.status_os === 'fechada').length;
    const totalAlta = ordens.filter(o => o.prioridade_os?.toLowerCase() === 'alta').length;

    // KPIs BI avançados
    const comTecnico = ordens.filter(o => o.tecnico_responsavel).length;
    const semTecnico = ordens.filter(o => !o.tecnico_responsavel && o.status_os !== 'fechada').length;
    const requerRetorno = ordens.filter(o => o.requer_retorno).length;

    // Tempo médio de resolução (em dias)
    const fechadasComDatas = ordens.filter(o => o.status_os === 'fechada' && o.criado_em && o.data_conclusao);
    const tempoMedioMs = fechadasComDatas.length > 0
        ? fechadasComDatas.reduce((acc, o) => {
            return acc + (new Date(o.data_conclusao!).getTime() - new Date(o.criado_em!).getTime());
        }, 0) / fechadasComDatas.length
        : 0;
    const tempoMedioDias = tempoMedioMs > 0 ? (tempoMedioMs / (1000 * 60 * 60 * 24)).toFixed(1) : '--';

    // Breakdown por técnico
    const porTecnico: Record<string, { total: number; abertas: number; fechadas: number }> = {};
    ordens.forEach(o => {
        const tec = o.tecnico_responsavel || 'Sem atribuição';
        if (!porTecnico[tec]) porTecnico[tec] = { total: 0, abertas: 0, fechadas: 0 };
        porTecnico[tec].total++;
        if (o.status_os === 'aberta' || o.status_os === 'em_andamento') porTecnico[tec].abertas++;
        if (o.status_os === 'fechada') porTecnico[tec].fechadas++;
    });

    // Tipos únicos para filtro
    const tiposUnicos = [...new Set(ordens.map(o => o.tipo_os).filter(Boolean))] as string[];

    const selectStyle: React.CSSProperties = {
        padding: '0.5rem 0.75rem',
        background: 'rgba(255,255,255,0.04)',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: '0.5rem',
        color: '#e2e8f0',
        fontSize: '0.7rem',
        fontWeight: 700,
        fontFamily: "'JetBrains Mono', monospace",
        letterSpacing: '0.1em',
        textTransform: 'uppercase' as const,
        cursor: 'pointer',
        outline: 'none',
        minHeight: '36px',
    };

    return (
        <div style={{ padding: '1.5rem', maxWidth: '90rem', margin: '0 auto' }}>
            {/* Botão Voltar */}
            <button
                onClick={() => navigate('/')}
                style={{
                    marginBottom: '1.5rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    color: 'rgba(255,255,255,0.4)',
                    background: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: '0.6rem',
                    fontWeight: 900,
                    letterSpacing: '0.3em',
                    textTransform: 'uppercase' as const,
                    transition: 'color 0.2s',
                }}
                onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = '#fff'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = 'rgba(255,255,255,0.4)'; }}
            >
                <ChevronLeft style={{ width: '14px', height: '14px' }} /> Voltar ao Terminal
            </button>

            {/* Header */}
            <div style={{ marginBottom: '2rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                    <ClipboardList style={{ width: '2rem', height: '2rem', color: '#f59e0b' }} />
                    <h1 style={{
                        fontSize: '1.5rem',
                        fontWeight: 900,
                        color: '#fff',
                        fontStyle: 'italic',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                        margin: 0,
                    }}>
                        ORDENS DE SERVIÇO — <span style={{ color: '#f59e0b' }}>COCKPIT IA</span>
                    </h1>
                </div>
                <p style={{
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: '0.6rem',
                    color: 'rgba(255,255,255,0.3)',
                    letterSpacing: '0.2em',
                    textTransform: 'uppercase',
                    margin: 0,
                }}>
                    Solicitações geradas automaticamente pelo motor de inferência
                </p>
            </div>

            {/* KPIs */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                gap: '1rem',
                marginBottom: '1.5rem',
            }}>
                {[
                    { label: 'ABERTAS', valor: totalAbertas, color: '#ef4444', bgColor: 'rgba(239,68,68,0.08)', borderColor: 'rgba(239,68,68,0.2)' },
                    { label: 'EM ANDAMENTO', valor: totalAndamento, color: '#f59e0b', bgColor: 'rgba(245,158,11,0.08)', borderColor: 'rgba(245,158,11,0.2)' },
                    { label: 'FECHADAS', valor: totalFechadas, color: '#22c55e', bgColor: 'rgba(34,197,94,0.08)', borderColor: 'rgba(34,197,94,0.2)' },
                    { label: 'SUSPEITA ALTA', valor: totalAlta, color: '#f97316', bgColor: 'rgba(249,115,22,0.08)', borderColor: 'rgba(249,115,22,0.2)' },
                ].map(kpi => (
                    <div key={kpi.label} style={{
                        background: kpi.bgColor,
                        border: `1px solid ${kpi.borderColor}`,
                        borderRadius: '1rem',
                        padding: '1.25rem',
                        textAlign: 'center',
                    }}>
                        <div style={{
                            fontSize: '2rem',
                            fontWeight: 900,
                            color: kpi.color,
                            lineHeight: 1,
                            marginBottom: '0.4rem',
                        }}>{kpi.valor}</div>
                        <div style={{
                            fontFamily: "'JetBrains Mono', monospace",
                            fontSize: '0.55rem',
                            color: 'rgba(255,255,255,0.35)',
                            fontWeight: 800,
                            letterSpacing: '0.2em',
                            textTransform: 'uppercase',
                        }}>{kpi.label}</div>
                    </div>
                ))}
            </div>

            {/* Painel BI — Métricas Técnicas */}
            <div style={{
                background: 'rgba(96,165,250,0.04)',
                border: '1px solid rgba(96,165,250,0.12)',
                borderRadius: '1rem',
                padding: '1.25rem',
                marginBottom: '1.5rem',
            }}>
                <div style={{
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: '0.6rem',
                    color: 'rgba(96,165,250,0.7)',
                    letterSpacing: '0.2em',
                    textTransform: 'uppercase',
                    fontWeight: 800,
                    marginBottom: '1rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                }}>
                    <BarChart3 size={14} />
                    RELATÓRIO TÉCNICO — BI
                </div>

                {/* Grid de métricas */}
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
                    gap: '0.75rem',
                    marginBottom: '1rem',
                }}>
                    {[
                        { label: 'COM TÉCNICO', valor: comTecnico, color: '#60a5fa', icon: '👨‍🔧' },
                        { label: 'SEM TÉCNICO', valor: semTecnico, color: '#f87171', icon: '⚠️' },
                        { label: 'REQUER RETORNO', valor: requerRetorno, color: '#fbbf24', icon: '🔄' },
                        { label: 'TEMPO MÉDIO (dias)', valor: tempoMedioDias, color: '#34d399', icon: '⏱️' },
                    ].map(m => (
                        <div key={m.label} style={{
                            background: 'rgba(255,255,255,0.03)',
                            border: '1px solid rgba(255,255,255,0.06)',
                            borderRadius: '0.75rem',
                            padding: '0.75rem',
                            textAlign: 'center',
                        }}>
                            <div style={{ fontSize: '0.9rem', marginBottom: '0.25rem' }}>{m.icon}</div>
                            <div style={{
                                fontSize: '1.5rem',
                                fontWeight: 900,
                                color: m.color,
                                lineHeight: 1,
                                marginBottom: '0.3rem',
                            }}>{m.valor}</div>
                            <div style={{
                                fontFamily: "'JetBrains Mono', monospace",
                                fontSize: '0.5rem',
                                color: 'rgba(255,255,255,0.3)',
                                fontWeight: 800,
                                letterSpacing: '0.15em',
                                textTransform: 'uppercase',
                            }}>{m.label}</div>
                        </div>
                    ))}
                </div>

                {/* Tabela por técnico */}
                {Object.keys(porTecnico).length > 0 && (
                    <div style={{
                        background: 'rgba(255,255,255,0.02)',
                        border: '1px solid rgba(255,255,255,0.04)',
                        borderRadius: '0.75rem',
                        overflow: 'hidden',
                    }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.75rem' }}>
                            <thead>
                                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                                    <th style={{ padding: '0.6rem 1rem', textAlign: 'left', fontFamily: "'JetBrains Mono', monospace", fontSize: '0.55rem', color: 'rgba(255,255,255,0.3)', letterSpacing: '0.15em', textTransform: 'uppercase', fontWeight: 800 }}>Técnico</th>
                                    <th style={{ padding: '0.6rem 1rem', textAlign: 'center', fontFamily: "'JetBrains Mono', monospace", fontSize: '0.55rem', color: 'rgba(255,255,255,0.3)', letterSpacing: '0.15em', textTransform: 'uppercase', fontWeight: 800 }}>Total</th>
                                    <th style={{ padding: '0.6rem 1rem', textAlign: 'center', fontFamily: "'JetBrains Mono', monospace", fontSize: '0.55rem', color: 'rgba(255,255,255,0.3)', letterSpacing: '0.15em', textTransform: 'uppercase', fontWeight: 800 }}>Em aberto</th>
                                    <th style={{ padding: '0.6rem 1rem', textAlign: 'center', fontFamily: "'JetBrains Mono', monospace", fontSize: '0.55rem', color: 'rgba(255,255,255,0.3)', letterSpacing: '0.15em', textTransform: 'uppercase', fontWeight: 800 }}>Fechadas</th>
                                </tr>
                            </thead>
                            <tbody>
                                {Object.entries(porTecnico).sort((a, b) => b[1].total - a[1].total).map(([tec, dados]) => (
                                    <tr key={tec} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                                        <td style={{ padding: '0.5rem 1rem', color: tec === 'Sem atribuição' ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.7)', fontStyle: tec === 'Sem atribuição' ? 'italic' : 'normal' }}>{tec}</td>
                                        <td style={{ padding: '0.5rem 1rem', textAlign: 'center', color: 'rgba(255,255,255,0.6)', fontWeight: 700 }}>{dados.total}</td>
                                        <td style={{ padding: '0.5rem 1rem', textAlign: 'center', color: '#f59e0b', fontWeight: 700 }}>{dados.abertas}</td>
                                        <td style={{ padding: '0.5rem 1rem', textAlign: 'center', color: '#22c55e', fontWeight: 700 }}>{dados.fechadas}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Filtros */}
            <div style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: '0.75rem',
                marginBottom: '1.5rem',
                padding: '1rem',
                background: 'rgba(255,255,255,0.02)',
                border: '1px solid rgba(255,255,255,0.05)',
                borderRadius: '0.75rem',
                alignItems: 'center',
            }}>
                <Filter style={{ width: '14px', height: '14px', color: 'rgba(255,255,255,0.3)', flexShrink: 0 }} />

                <div style={{ position: 'relative', flex: '1', minWidth: '200px' }}>
                    <Search style={{ width: '12px', height: '12px', position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.25)' }} />
                    <input
                        type="text"
                        placeholder="Buscar por patrimônio, evento, endereço..."
                        value={busca}
                        onChange={e => setBusca(e.target.value)}
                        style={{
                            ...selectStyle,
                            paddingLeft: '2rem',
                            width: '100%',
                            textTransform: 'none',
                        }}
                    />
                </div>

                <select value={filtroStatus} onChange={e => setFiltroStatus(e.target.value)} style={selectStyle}>
                    <option value="" style={{ background: '#1a1a1a', color: '#fff' }}>Todos Status</option>
                    <option value="aberta" style={{ background: '#1a1a1a', color: '#fff' }}>Aberta</option>
                    <option value="em_andamento" style={{ background: '#1a1a1a', color: '#fff' }}>Em Andamento</option>
                    <option value="fechada" style={{ background: '#1a1a1a', color: '#fff' }}>Fechada</option>
                </select>

                <select value={filtroSuspeita} onChange={e => setFiltroSuspeita(e.target.value)} style={selectStyle}>
                    <option value="" style={{ background: '#1a1a1a', color: '#fff' }}>Todas Suspeitas</option>
                    <option value="Alta" style={{ background: '#1a1a1a', color: '#fff' }}>Alta</option>
                    <option value="Média" style={{ background: '#1a1a1a', color: '#fff' }}>Média</option>
                    <option value="Baixa" style={{ background: '#1a1a1a', color: '#fff' }}>Baixa</option>
                </select>

                <select value={filtroTipo} onChange={e => setFiltroTipo(e.target.value)} style={selectStyle}>
                    <option value="" style={{ background: '#1a1a1a', color: '#fff' }}>Todos Tipos</option>
                    {tiposUnicos.map(t => <option key={t} value={t} style={{ background: '#1a1a1a', color: '#fff' }}>{t}</option>)}
                </select>
            </div>

            {/* Loading */}
            {loading && (
                <div style={{ textAlign: 'center', padding: '4rem' }}>
                    <div style={{
                        width: '48px', height: '48px',
                        border: '4px solid #8b2323',
                        borderTopColor: 'transparent',
                        borderRadius: '50%',
                        animation: 'spin 1s linear infinite',
                        margin: '0 auto 1rem',
                    }} />
                    <div style={{
                        fontFamily: "'JetBrains Mono', monospace",
                        fontSize: '0.65rem',
                        color: 'rgba(255,255,255,0.3)',
                        letterSpacing: '0.3em',
                        textTransform: 'uppercase',
                    }}>Carregando Ordens de Serviço...</div>
                    <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
                </div>
            )}

            {/* Empty State */}
            {!loading && ordensFiltradas.length === 0 && (
                <div style={{
                    textAlign: 'center',
                    padding: '5rem 2rem',
                    background: 'rgba(255,255,255,0.02)',
                    border: '1px dashed rgba(255,255,255,0.08)',
                    borderRadius: '1.5rem',
                }}>
                    <Wrench style={{ width: '3rem', height: '3rem', color: 'rgba(255,255,255,0.1)', margin: '0 auto 1rem' }} />
                    <h3 style={{
                        fontWeight: 900,
                        fontSize: '1.1rem',
                        color: '#fff',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                        fontStyle: 'italic',
                        marginBottom: '0.5rem',
                    }}>Nenhuma Ordem Encontrada</h3>
                    <p style={{
                        color: 'rgba(255,255,255,0.3)',
                        fontSize: '0.8rem',
                        maxWidth: '360px',
                        margin: '0 auto',
                    }}>
                        {busca || filtroStatus || filtroSuspeita || filtroTipo
                            ? 'Tente ajustar os filtros para visualizar resultados.'
                            : 'O motor IA ainda não gerou solicitações de abertura de OS.'}
                    </p>
                </div>
            )}

            {/* Tabela de OS */}
            {!loading && ordensFiltradas.length > 0 && (
                <div style={{
                    background: 'rgba(255,255,255,0.02)',
                    border: '1px solid rgba(255,255,255,0.06)',
                    borderRadius: '1rem',
                    overflow: 'hidden',
                }}>
                    {/* Contagem */}
                    <div style={{
                        padding: '0.75rem 1.25rem',
                        borderBottom: '1px solid rgba(255,255,255,0.05)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                    }}>
                        <span style={{
                            fontFamily: "'JetBrains Mono', monospace",
                            fontSize: '0.6rem',
                            color: 'rgba(255,255,255,0.4)',
                            fontWeight: 700,
                            letterSpacing: '0.15em',
                            textTransform: 'uppercase',
                        }}>
                            <ArrowUpDown style={{ width: '10px', height: '10px', display: 'inline', verticalAlign: 'middle', marginRight: '0.4rem' }} />
                            {ordensFiltradas.length} ordems encontradas
                        </span>
                    </div>

                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '900px' }}>
                            <thead>
                                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                                    {['Status', 'Suspeita', 'Tipo OS', 'Patrimônio', 'Evento', 'Zona', 'Motivo', 'Criado em'].map(h => (
                                        <th key={h} style={{
                                            padding: '0.75rem 1rem',
                                            textAlign: 'left',
                                            fontFamily: "'JetBrains Mono', monospace",
                                            fontSize: '0.55rem',
                                            fontWeight: 900,
                                            color: 'rgba(255,255,255,0.25)',
                                            letterSpacing: '0.2em',
                                            textTransform: 'uppercase',
                                            whiteSpace: 'nowrap',
                                        }}>{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {ordensFiltradas.map((os) => {
                                    const statusCfg = getStatusConfig(os.status_os);
                                    const StatusIcon = statusCfg.icon;
                                    const prioCfg = getSuspeitaConfig(os.prioridade_os);

                                    return (
                                        <tr key={os.id} style={{
                                            borderBottom: '1px solid rgba(255,255,255,0.03)',
                                            transition: 'background 0.15s',
                                            cursor: 'pointer',
                                        }}
                                            onClick={() => navigate(`/ordens-servico/${os.id}`)}
                                            onMouseEnter={e => { (e.currentTarget as HTMLTableRowElement).style.background = 'rgba(255,255,255,0.03)'; }}
                                            onMouseLeave={e => { (e.currentTarget as HTMLTableRowElement).style.background = 'transparent'; }}
                                        >
                                            {/* Status */}
                                            <td style={{ padding: '0.75rem 1rem' }}>
                                                <span style={{
                                                    display: 'inline-flex',
                                                    alignItems: 'center',
                                                    gap: '0.35rem',
                                                    padding: '0.3rem 0.6rem',
                                                    borderRadius: '0.4rem',
                                                    background: statusCfg.bg,
                                                    border: `1px solid ${statusCfg.border}`,
                                                    color: statusCfg.color,
                                                    fontSize: '0.6rem',
                                                    fontWeight: 800,
                                                    fontFamily: "'JetBrains Mono', monospace",
                                                    letterSpacing: '0.1em',
                                                    whiteSpace: 'nowrap',
                                                }}>
                                                    <StatusIcon style={{ width: '10px', height: '10px' }} />
                                                    {statusCfg.label}
                                                </span>
                                            </td>

                                            {/* Suspeita */}
                                            <td style={{ padding: '0.75rem 1rem' }}>
                                                <span style={{
                                                    display: 'inline-flex',
                                                    alignItems: 'center',
                                                    gap: '0.35rem',
                                                    padding: '0.3rem 0.6rem',
                                                    borderRadius: '0.4rem',
                                                    background: prioCfg.bg,
                                                    border: `1px solid ${prioCfg.border}`,
                                                    color: prioCfg.color,
                                                    fontSize: '0.6rem',
                                                    fontWeight: 800,
                                                    fontFamily: "'JetBrains Mono', monospace",
                                                    letterSpacing: '0.1em',
                                                    whiteSpace: 'nowrap',
                                                }}>
                                                    {prioCfg.label === 'ALTA' && <AlertTriangle style={{ width: '10px', height: '10px' }} />}
                                                    {prioCfg.label}
                                                </span>
                                            </td>

                                            {/* Tipo OS */}
                                            <td style={{
                                                padding: '0.75rem 1rem',
                                                fontFamily: "'JetBrains Mono', monospace",
                                                fontSize: '0.65rem',
                                                fontWeight: 700,
                                                color: '#e2e8f0',
                                                whiteSpace: 'nowrap',
                                            }}>
                                                {os.tipo_os || '--'}
                                            </td>

                                            {/* Patrimônio */}
                                            <td style={{
                                                padding: '0.75rem 1rem',
                                            }}>
                                                <div style={{
                                                    fontWeight: 800,
                                                    fontSize: '0.8rem',
                                                    color: '#fff',
                                                }}>{os.patrimonio || os.patrimonio_normalizado || '--'}</div>
                                                {os.endereco && (
                                                    <div style={{
                                                        fontSize: '0.6rem',
                                                        color: 'rgba(255,255,255,0.3)',
                                                        marginTop: '0.15rem',
                                                        maxWidth: '200px',
                                                        overflow: 'hidden',
                                                        textOverflow: 'ellipsis',
                                                        whiteSpace: 'nowrap',
                                                    }}>{os.endereco}</div>
                                                )}
                                            </td>

                                            {/* Evento */}
                                            <td style={{ padding: '0.75rem 1rem' }}>
                                                <div style={{
                                                    fontFamily: "'JetBrains Mono', monospace",
                                                    fontSize: '0.7rem',
                                                    fontWeight: 800,
                                                    color: '#f59e0b',
                                                }}>{os.codigo_evento || '--'}</div>
                                                {os.descricao_evento && (
                                                    <div style={{
                                                        fontSize: '0.55rem',
                                                        color: 'rgba(255,255,255,0.35)',
                                                        marginTop: '0.15rem',
                                                        maxWidth: '180px',
                                                        overflow: 'hidden',
                                                        textOverflow: 'ellipsis',
                                                        whiteSpace: 'nowrap',
                                                    }}>{os.descricao_evento}</div>
                                                )}
                                            </td>

                                            {/* Zona */}
                                            <td style={{
                                                padding: '0.75rem 1rem',
                                                fontFamily: "'JetBrains Mono', monospace",
                                                fontSize: '0.7rem',
                                                fontWeight: 700,
                                                color: 'rgba(255,255,255,0.6)',
                                            }}>
                                                {os.zona || '--'}
                                            </td>

                                            {/* Motivo */}
                                            <td style={{
                                                padding: '0.75rem 1rem',
                                                fontSize: '0.7rem',
                                                color: 'rgba(255,255,255,0.5)',
                                                maxWidth: '250px',
                                            }}>
                                                <div style={{
                                                    overflow: 'hidden',
                                                    textOverflow: 'ellipsis',
                                                    display: '-webkit-box',
                                                    WebkitLineClamp: 2,
                                                    WebkitBoxOrient: 'vertical',
                                                    lineHeight: '1.4',
                                                }}>
                                                    {sanitizeText(os.motivo_os) || '--'}
                                                </div>
                                            </td>

                                            {/* Criado em */}
                                            <td style={{
                                                padding: '0.75rem 1rem',
                                                fontFamily: "'JetBrains Mono', monospace",
                                                fontSize: '0.6rem',
                                                fontWeight: 700,
                                                color: 'rgba(255,255,255,0.4)',
                                                whiteSpace: 'nowrap',
                                            }}>
                                                {formatDate(os.criado_em)}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
};

export default OrdensServico;
