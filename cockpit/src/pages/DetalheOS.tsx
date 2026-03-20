import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    ChevronLeft, Save, ClipboardList, CircleDot, Clock, CheckCircle2,
    AlertTriangle, User, Calendar, Wrench, FileText, Package, RotateCcw,
    Hash, BrainCircuit, Sparkles, Activity, ShieldAlert, Lightbulb
} from 'lucide-react';
import { api } from '../lib/api';
import type { OrdemServico } from '../lib/api';
import toast from 'react-hot-toast';

const formatDateDisplay = (dateStr: string | null) => {
    if (!dateStr) return '--';
    try {
        const d = new Date(dateStr);
        return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' }) +
            ' ' + d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    } catch {
        return dateStr;
    }
};

const toDatetimeLocal = (dateStr: string | null) => {
    if (!dateStr) return '';
    try {
        const d = new Date(dateStr);
        const offset = d.getTimezoneOffset();
        const local = new Date(d.getTime() - offset * 60000);
        return local.toISOString().slice(0, 16);
    } catch {
        return '';
    }
};

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

const getSuspeitaLabelConfig = (p: string | null) => {
    switch (p?.toLowerCase()) {
        case 'alta': return { label: 'ALTA', color: '#ef4444' };
        case 'média': case 'media': return { label: 'MÉDIA', color: '#f59e0b' };
        case 'baixa': return { label: 'BAIXA', color: '#22c55e' };
        default: return { label: p || 'N/D', color: '#94a3b8' };
    }
};

const getGrauSuspeitaConfig = (grau: string | null) => {
    switch (grau?.toLowerCase()) {
        case 'alta': return { color: '#ef4444', bg: 'rgba(239,68,68,0.1)' };
        case 'média': case 'media': return { color: '#f59e0b', bg: 'rgba(245,158,11,0.1)' };
        case 'baixa': return { color: '#22c55e', bg: 'rgba(34,197,94,0.1)' };
        default: return { color: '#94a3b8', bg: 'rgba(148,163,184,0.1)' };
    }
};

const getScoreColor = (score: number | null | undefined) => {
    if (score === null || score === undefined) return '#94a3b8';
    if (score >= 70) return '#ef4444'; // Alta suspeita
    if (score >= 40) return '#f59e0b'; // Média suspeita
    return '#22c55e'; // Baixa suspeita
};

// Helper para corrigir caracteres estranhos provindos da IA (ex: ≥ corrompido para ?)
const sanitizeText = (text: string | null | undefined) => {
    if (!text) return '';
    // Substitui ? ou U+FFFD por >= (maior ou igual) que é o símbolo geralmente corrompido nesses logs
    return text.replace(/\?/g, '>=').replace(/\uFFFD/g, '');
};

// Shared styles
const labelStyle: React.CSSProperties = {
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: '0.55rem',
    fontWeight: 900,
    color: 'rgba(255,255,255,0.3)',
    letterSpacing: '0.2em',
    textTransform: 'uppercase',
    marginBottom: '0.4rem',
    display: 'flex',
    alignItems: 'center',
    gap: '0.35rem',
};

const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '0.6rem 0.75rem',
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: '0.5rem',
    color: '#e2e8f0',
    fontSize: '0.8rem',
    fontFamily: "'Barlow Condensed', sans-serif",
    fontWeight: 600,
    outline: 'none',
    transition: 'border-color 0.2s',
};

const textareaStyle: React.CSSProperties = {
    ...inputStyle,
    minHeight: '80px',
    resize: 'vertical' as const,
    lineHeight: '1.5',
};

const sectionStyle: React.CSSProperties = {
    background: 'rgba(255,255,255,0.02)',
    border: '1px solid rgba(255,255,255,0.06)',
    borderRadius: '1rem',
    padding: '1.5rem',
    marginBottom: '1.5rem',
};

export const DetalheOS = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [os, setOs] = useState<OrdemServico | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // Campos editáveis
    const [statusOs, setStatusOs] = useState('');
    const [tecnico, setTecnico] = useState('');
    const [dataVisita, setDataVisita] = useState('');
    const [dataConclusao, setDataConclusao] = useState('');
    const [observacao, setObservacao] = useState('');
    const [solucao, setSolucao] = useState('');
    const [pecas, setPecas] = useState('');
    const [numOsService, setNumOsService] = useState('');
    const [requerRetorno, setRequerRetorno] = useState(false);

    const loadOS = useCallback(async () => {
        if (!id) return;
        try {
            const data = await api.getOrdemServicoById(id);
            setOs(data);
            // Preencher campos editáveis
            setStatusOs(data.status_os || 'aberta');
            setTecnico(data.tecnico_responsavel || '');
            setDataVisita(toDatetimeLocal(data.data_visita));
            setDataConclusao(toDatetimeLocal(data.data_conclusao));
            setObservacao(data.observacao_tecnica || '');
            setSolucao(data.solucao_aplicada || '');
            setPecas(data.pecas_utilizadas || '');
            setNumOsService(data.numero_os_service || '');
            setRequerRetorno(data.requer_retorno || false);
        } catch (err) {
            console.error('Erro ao carregar OS:', err);
            toast.error('Erro ao carregar Ordem de Serviço.');
        } finally {
            setLoading(false);
        }
    }, [id]);

    useEffect(() => { loadOS(); }, [loadOS]);

    // Realtime
    useEffect(() => {
        const sub = api.subscribeOrdensServico(() => loadOS());
        return () => { sub.unsubscribe(); };
    }, [loadOS]);

    const handleSave = async () => {
        if (!id) return;
        setSaving(true);
        try {
            await api.updateOrdemServico(id, {
                status_os: statusOs,
                tecnico_responsavel: tecnico || null,
                data_visita: dataVisita ? new Date(dataVisita).toISOString() : null,
                data_conclusao: dataConclusao ? new Date(dataConclusao).toISOString() : null,
                observacao_tecnica: observacao || null,
                solucao_aplicada: solucao || null,
                pecas_utilizadas: pecas || null,
                numero_os_service: numOsService || null,
                requer_retorno: requerRetorno,
            });
            toast.success('Ordem de Serviço atualizada com sucesso!');
            loadOS(); // Recarrega para refletir atualização
        } catch (err) {
            console.error('Erro ao salvar OS:', err);
            toast.error('Erro ao salvar alterações.');
        } finally {
            setSaving(false);
        }
    };

    // Loading state
    if (loading) {
        return (
            <div style={{ padding: '1.5rem', maxWidth: '60rem', margin: '0 auto' }}>
                <div style={{ textAlign: 'center', padding: '6rem' }}>
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
                    }}>Carregando OS...</div>
                    <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
                </div>
            </div>
        );
    }

    if (!os) {
        return (
            <div style={{ padding: '1.5rem', maxWidth: '60rem', margin: '0 auto', textAlign: 'center', paddingTop: '6rem' }}>
                <AlertTriangle style={{ width: '3rem', height: '3rem', color: 'rgba(255,255,255,0.15)', margin: '0 auto 1rem' }} />
                <h2 style={{ color: '#fff', fontWeight: 900, fontStyle: 'italic', textTransform: 'uppercase' }}>OS Não Encontrada</h2>
                <button onClick={() => navigate('/ordens-servico')} style={{
                    marginTop: '1rem', padding: '0.5rem 1rem',
                    background: 'rgba(139,35,35,0.1)', border: '1px solid rgba(139,35,35,0.3)',
                    borderRadius: '0.5rem', color: '#8b2323', cursor: 'pointer',
                    fontFamily: "'JetBrains Mono', monospace", fontSize: '0.7rem', fontWeight: 700,
                }}>Voltar para lista</button>
            </div>
        );
    }

    const statusCfg = getStatusConfig(os.status_os);
    const suspeitaCfg = getSuspeitaLabelConfig(os.prioridade_os);

    return (
        <div style={{ padding: '1.5rem', maxWidth: '60rem', margin: '0 auto' }}>
            {/* Botão Voltar */}
            <button
                onClick={() => navigate('/ordens-servico')}
                style={{
                    marginBottom: '1.5rem',
                    display: 'flex', alignItems: 'center', gap: '0.5rem',
                    color: 'rgba(255,255,255,0.4)',
                    background: 'transparent', border: 'none', cursor: 'pointer',
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: '0.6rem', fontWeight: 900,
                    letterSpacing: '0.3em', textTransform: 'uppercase',
                    transition: 'color 0.2s',
                }}
                onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = '#fff'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = 'rgba(255,255,255,0.4)'; }}
            >
                <ChevronLeft style={{ width: '14px', height: '14px' }} /> Voltar às Ordens de Serviço
            </button>

            {/* Header OS */}
            <div style={{ marginBottom: '2rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem', flexWrap: 'wrap' }}>
                    <ClipboardList style={{ width: '2rem', height: '2rem', color: '#f59e0b' }} />
                    <h1 style={{
                        fontSize: '1.5rem', fontWeight: 900, color: '#fff',
                        fontStyle: 'italic', textTransform: 'uppercase',
                        letterSpacing: '0.05em', margin: 0,
                    }}>
                        DETALHE DA <span style={{ color: '#f59e0b' }}>O.S.</span>
                    </h1>
                    {/* Status & Suspeita badges */}
                    <span style={{
                        display: 'inline-flex', alignItems: 'center', gap: '0.3rem',
                        padding: '0.25rem 0.6rem', borderRadius: '0.4rem',
                        background: statusCfg.bg, border: `1px solid ${statusCfg.border}`,
                        color: statusCfg.color, fontSize: '0.6rem', fontWeight: 800,
                        fontFamily: "'JetBrains Mono', monospace", letterSpacing: '0.1em',
                    }}>
                        <statusCfg.icon style={{ width: '10px', height: '10px' }} /> {statusCfg.label}
                    </span>
                    <span style={{
                        display: 'inline-flex', alignItems: 'center', gap: '0.3rem',
                        padding: '0.25rem 0.6rem', borderRadius: '0.4rem',
                        background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
                        color: suspeitaCfg.color, fontSize: '0.6rem', fontWeight: 800,
                        fontFamily: "'JetBrains Mono', monospace", letterSpacing: '0.1em',
                    }}>
                        {suspeitaCfg.label === 'ALTA' && <AlertTriangle style={{ width: '10px', height: '10px' }} />}
                        SUSPEITA {suspeitaCfg.label}
                    </span>
                </div>
                <p style={{
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: '0.5rem', color: 'rgba(255,255,255,0.2)',
                    letterSpacing: '0.2em', textTransform: 'uppercase', margin: 0,
                }}>
                    ID: {os.id} • Criado em {formatDateDisplay(os.criado_em)}
                    {os.atualizado_em && ` • Atualizado em ${formatDateDisplay(os.atualizado_em)}`}
                </p>
            </div>

            {/* === INFORMAÇÕES DA OS (read-only) === */}
            <div style={sectionStyle}>
                <h3 style={{
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: '0.6rem', fontWeight: 900,
                    color: 'rgba(255,255,255,0.4)', letterSpacing: '0.25em',
                    textTransform: 'uppercase', marginBottom: '1.25rem', margin: '0 0 1.25rem 0',
                }}>
                    📋 DADOS DO DISPARO
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                    {[
                        { label: 'Patrimônio', value: os.patrimonio || os.patrimonio_normalizado },
                        { label: 'Evento', value: os.codigo_evento },
                        { label: 'Descrição', value: os.descricao_evento },
                        { label: 'Zona', value: os.zona },
                        { label: 'Tipo OS', value: os.tipo_os },
                        { label: 'Categoria', value: os.categoria_os },
                        { label: 'Endereço', value: os.endereco },
                        { label: 'Origem', value: os.origem },
                    ].map(item => (
                        <div key={item.label}>
                            <div style={labelStyle}>{item.label}</div>
                            <div style={{
                                fontSize: '0.85rem', fontWeight: 700, color: '#e2e8f0',
                                lineHeight: 1.4,
                            }}>{item.value || '--'}</div>
                        </div>
                    ))}
                </div>
                {os.motivo_os && (
                    <div style={{ marginTop: '1rem' }}>
                        <div style={labelStyle}>Motivo da O.S.</div>
                        <div style={{
                            fontSize: '0.85rem', color: 'rgba(255,255,255,0.6)',
                            lineHeight: 1.6, background: 'rgba(245,158,11,0.04)',
                            border: '1px solid rgba(245,158,11,0.1)',
                            borderRadius: '0.5rem', padding: '0.75rem 1rem',
                        }}>{sanitizeText(os.motivo_os)}</div>
                    </div>
                )}
            </div>

            {/* === CONTEXTO DA ANÁLISE IA === */}
            {(os.score_ia !== null || os.hipotese_ia || os.regra_suspeita_aplicada) && (
                <div style={{
                    ...sectionStyle,
                    background: 'linear-gradient(145deg, rgba(88,28,135,0.05) 0%, rgba(255,255,255,0.01) 100%)',
                    border: '1px solid rgba(139,92,246,0.15)',
                    position: 'relative',
                    overflow: 'hidden'
                }}>
                    <div style={{
                        position: 'absolute', top: 0, right: 0, padding: '1rem', opacity: 0.1
                    }}>
                        <BrainCircuit style={{ width: '6rem', height: '6rem', color: '#8b5cf6' }} />
                    </div>

                    <h3 style={{
                        fontFamily: "'JetBrains Mono', monospace",
                        fontSize: '0.6rem', fontWeight: 900,
                        color: '#c4b5fd', letterSpacing: '0.25em',
                        textTransform: 'uppercase', marginBottom: '1.25rem', margin: '0 0 1.25rem 0',
                        display: 'flex', alignItems: 'center', gap: '0.5rem'
                    }}>
                        <Sparkles style={{ width: '12px', height: '12px' }} />
                        CONTEXTO DA ANÁLISE IA
                    </h3>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.25rem', position: 'relative', zIndex: 1 }}>
                        
                        {/* Score e Regra */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <div>
                                <div style={labelStyle}>Score de Suspeita</div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <span style={{
                                        fontSize: '1.5rem', fontWeight: 900, 
                                        color: getScoreColor(os.score_ia),
                                        fontFamily: "'JetBrains Mono', monospace"
                                    }}>
                                        {os.score_ia !== null ? `${os.score_ia}%` : '--'}
                                    </span>
                                    {os.grau_suspeita && (
                                        <span style={{
                                            padding: '0.2rem 0.5rem', borderRadius: '0.25rem',
                                            background: getGrauSuspeitaConfig(os.grau_suspeita).bg,
                                            color: getGrauSuspeitaConfig(os.grau_suspeita).color,
                                            fontSize: '0.6rem', fontWeight: 800, textTransform: 'uppercase',
                                            fontFamily: "'JetBrains Mono', monospace"
                                        }}>
                                            {os.grau_suspeita}
                                        </span>
                                    )}
                                </div>
                            </div>
                            
                            {os.regra_suspeita_aplicada && (
                                <div>
                                    <div style={labelStyle}>Regra Aplicada</div>
                                    <div style={{
                                        display: 'flex', alignItems: 'flex-start', gap: '0.75rem',
                                        padding: '1rem', background: 'rgba(139,92,246,0.08)',
                                        border: '1px solid rgba(139,92,246,0.2)',
                                        borderLeft: '4px solid #8b5cf6',
                                        borderRadius: '0.5rem',
                                        color: '#ddd6fe', fontSize: '0.85rem', fontWeight: 500,
                                        fontFamily: "'Inter', sans-serif"
                                    }}>
                                        <ShieldAlert style={{ width: '16px', height: '16px', marginTop: '2px', flexShrink: 0, color: '#8b5cf6' }} />
                                        <div style={{ lineHeight: 1.5 }}>
                                            {sanitizeText(os.regra_suspeita_aplicada).split('\n').map((linha: string, i: number) => (
                                                <div key={i} style={{ marginBottom: i !== sanitizeText(os.regra_suspeita_aplicada).split('\n').length - 1 ? '0.25rem' : 0 }}>
                                                    {linha}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Hipótese */}
                        <div style={{ gridColumn: '1 / -1', marginTop: '0.5rem' }}>
                            <div style={labelStyle}>Hipótese da IA</div>
                            {os.hipotese_ia ? (
                                <div style={{
                                    display: 'flex', gap: '0.75rem',
                                    fontSize: '0.9rem', color: '#e2e8f0',
                                    lineHeight: 1.6, background: 'rgba(255,255,255,0.03)',
                                    border: '1px solid rgba(255,255,255,0.08)',
                                    borderLeft: '4px solid #3b82f6',
                                    padding: '1rem', borderRadius: '0.5rem'
                                }}>
                                    <Lightbulb style={{ width: '18px', height: '18px', flexShrink: 0, color: '#3b82f6', marginTop: '2px' }} />
                                    <div>
                                        {sanitizeText(os.hipotese_ia).split('\n').map((linha: string, i: number) => (
                                            <div key={i} style={{ marginBottom: i !== sanitizeText(os.hipotese_ia).split('\n').length - 1 ? '0.5rem' : 0 }}>
                                                {linha}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ) : (
                                <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.8rem' }}>Sem hipótese gerada.</span>
                            )}
                        </div>

                        {/* Métricas E130 se aplicável */}
                        {(os.e130_total_7d || os.e130_validos_sensor_7d) ? (
                            <div style={{ gridColumn: '1 / -1', marginTop: '0.5rem', paddingTop: '1rem', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                                <div style={{...labelStyle, color: '#94a3b8'}}><Activity style={{ width: '10px', height: '10px' }} /> Métricas de Recorrência (7 dias)</div>
                                <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginTop: '0.5rem' }}>
                                    {[
                                        { label: 'Total Disparos', value: os.e130_total_7d },
                                        { label: 'Válidos no Sensor', value: os.e130_validos_sensor_7d },
                                        { label: 'Dias Distintos', value: os.dias_distintos_e130_validos_7d },
                                        { label: 'Descartados (<5min)', value: os.e130_descartados_9013_5m_7d }
                                    ].map(metric => (
                                        <div key={metric.label} style={{
                                            background: 'rgba(0,0,0,0.2)', padding: '0.5rem 0.75rem', 
                                            borderRadius: '0.4rem', border: '1px solid rgba(255,255,255,0.02)',
                                            display: 'flex', flexDirection: 'column', gap: '0.25rem'
                                        }}>
                                            <span style={{ fontSize: '0.55rem', textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)', fontWeight: 800, fontFamily: "'JetBrains Mono', monospace" }}>{metric.label}</span>
                                            <span style={{ fontSize: '1.1rem', fontWeight: 900, color: '#e2e8f0', fontFamily: "'JetBrains Mono', monospace" }}>{metric.value ?? 0}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ) : null}
                    </div>
                </div>
            )}

            {/* === ACOMPANHAMENTO TÉCNICO (editável) === */}
            <div style={{
                ...sectionStyle,
                border: '1px solid rgba(59,130,246,0.15)',
                background: 'rgba(59,130,246,0.02)',
            }}>
                <h3 style={{
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: '0.6rem', fontWeight: 900,
                    color: 'rgba(59,130,246,0.7)', letterSpacing: '0.25em',
                    textTransform: 'uppercase', margin: '0 0 1.25rem 0',
                }}>
                    🔧 ACOMPANHAMENTO TÉCNICO
                </h3>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.25rem' }}>
                    {/* Status OS */}
                    <div>
                        <div style={labelStyle}><CircleDot style={{ width: '10px', height: '10px' }} /> Status da O.S.</div>
                        <select
                            value={statusOs}
                            onChange={e => setStatusOs(e.target.value)}
                            style={{
                                ...inputStyle,
                                cursor: 'pointer',
                                fontFamily: "'JetBrains Mono', monospace",
                                fontSize: '0.7rem',
                                fontWeight: 800,
                                letterSpacing: '0.1em',
                                textTransform: 'uppercase',
                            }}
                        >
                            <option value="aberta" style={{ background: '#0f172a', color: '#e2e8f0' }}>🔴 Aberta</option>
                            <option value="em_andamento" style={{ background: '#0f172a', color: '#e2e8f0' }}>🟡 Em Andamento</option>
                            <option value="fechada" style={{ background: '#0f172a', color: '#e2e8f0' }}>🟢 Fechada</option>
                        </select>
                    </div>

                    {/* Técnico Responsável */}
                    <div>
                        <div style={labelStyle}><User style={{ width: '10px', height: '10px' }} /> Técnico Responsável</div>
                        <input
                            type="text"
                            value={tecnico}
                            onChange={e => setTecnico(e.target.value)}
                            placeholder="Nome do técnico atribuído"
                            style={inputStyle}
                        />
                    </div>

                    {/* Nº OS Service */}
                    <div>
                        <div style={labelStyle}><Hash style={{ width: '10px', height: '10px' }} /> Nº OS Service</div>
                        <input
                            type="text"
                            value={numOsService}
                            onChange={e => setNumOsService(e.target.value)}
                            placeholder="Número de referência no Service"
                            style={inputStyle}
                        />
                    </div>

                    {/* Data Visita */}
                    <div>
                        <div style={labelStyle}><Calendar style={{ width: '10px', height: '10px' }} /> Data da Visita</div>
                        <input
                            type="datetime-local"
                            value={dataVisita}
                            onChange={e => setDataVisita(e.target.value)}
                            style={{ ...inputStyle, fontFamily: "'JetBrains Mono', monospace", fontSize: '0.7rem' }}
                        />
                    </div>

                    {/* Data Conclusão */}
                    <div>
                        <div style={labelStyle}><CheckCircle2 style={{ width: '10px', height: '10px' }} /> Data de Conclusão</div>
                        <input
                            type="datetime-local"
                            value={dataConclusao}
                            onChange={e => setDataConclusao(e.target.value)}
                            style={{ ...inputStyle, fontFamily: "'JetBrains Mono', monospace", fontSize: '0.7rem' }}
                        />
                    </div>

                    {/* Requer Retorno */}
                    <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                        <div style={labelStyle}><RotateCcw style={{ width: '10px', height: '10px' }} /> Requer Retorno?</div>
                        <label style={{
                            display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer',
                            padding: '0.5rem 0.75rem',
                            background: requerRetorno ? 'rgba(239,68,68,0.08)' : 'rgba(255,255,255,0.04)',
                            border: `1px solid ${requerRetorno ? 'rgba(239,68,68,0.25)' : 'rgba(255,255,255,0.08)'}`,
                            borderRadius: '0.5rem',
                            transition: 'all 0.2s',
                        }}>
                            <input
                                type="checkbox"
                                checked={requerRetorno}
                                onChange={e => setRequerRetorno(e.target.checked)}
                                style={{ accentColor: '#ef4444', width: '16px', height: '16px', cursor: 'pointer' }}
                            />
                            <span style={{
                                fontSize: '0.8rem', fontWeight: 700,
                                color: requerRetorno ? '#ef4444' : 'rgba(255,255,255,0.5)',
                            }}>
                                {requerRetorno ? 'Sim — precisa retornar' : 'Não'}
                            </span>
                        </label>
                    </div>
                </div>

                {/* Textareas */}
                <div style={{ marginTop: '1.25rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.25rem' }}>
                    <div>
                        <div style={labelStyle}><FileText style={{ width: '10px', height: '10px' }} /> Observação Técnica</div>
                        <textarea
                            value={observacao}
                            onChange={e => setObservacao(e.target.value)}
                            placeholder="Observações gerais sobre a OS..."
                            style={textareaStyle}
                        />
                    </div>
                    <div>
                        <div style={labelStyle}><Wrench style={{ width: '10px', height: '10px' }} /> Solução Aplicada</div>
                        <textarea
                            value={solucao}
                            onChange={e => setSolucao(e.target.value)}
                            placeholder="Descreva o serviço realizado..."
                            style={textareaStyle}
                        />
                    </div>
                    <div>
                        <div style={labelStyle}><Package style={{ width: '10px', height: '10px' }} /> Peças / Materiais Utilizados</div>
                        <textarea
                            value={pecas}
                            onChange={e => setPecas(e.target.value)}
                            placeholder="Liste peças e materiais..."
                            style={textareaStyle}
                        />
                    </div>
                </div>

                {/* Botão Salvar */}
                <div style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'flex-end' }}>
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        style={{
                            display: 'flex', alignItems: 'center', gap: '0.5rem',
                            padding: '0.75rem 2rem',
                            background: saving ? 'rgba(59,130,246,0.15)' : 'rgba(59,130,246,0.12)',
                            border: '1px solid rgba(59,130,246,0.35)',
                            borderRadius: '0.625rem',
                            color: '#3b82f6',
                            fontSize: '0.75rem',
                            fontWeight: 900,
                            fontFamily: "'JetBrains Mono', monospace",
                            letterSpacing: '0.15em',
                            textTransform: 'uppercase',
                            cursor: saving ? 'not-allowed' : 'pointer',
                            opacity: saving ? 0.6 : 1,
                            transition: 'all 0.2s',
                        }}
                        onMouseEnter={e => {
                            if (!saving) {
                                (e.currentTarget as HTMLButtonElement).style.background = 'rgba(59,130,246,0.2)';
                                (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(59,130,246,0.5)';
                            }
                        }}
                        onMouseLeave={e => {
                            (e.currentTarget as HTMLButtonElement).style.background = 'rgba(59,130,246,0.12)';
                            (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(59,130,246,0.35)';
                        }}
                    >
                        <Save style={{ width: '14px', height: '14px' }} />
                        {saving ? 'Salvando...' : 'Salvar Alterações'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default DetalheOS;
