import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, UserPlus, Shield, User, ToggleLeft, ToggleRight } from 'lucide-react';
import toast from 'react-hot-toast';
import { api } from '../lib/api';
import { useUserRole } from '../hooks/useUserRole';

interface Usuario {
    id: string;
    auth_user_id: string;
    nome_completo: string;
    email: string;
    cargo: string;
    ativo: boolean;
    criado_em: string;
}

const Usuarios = () => {
    const navigate = useNavigate();
    const { isAdmin, loading: roleLoading } = useUserRole();
    const [usuarios, setUsuarios] = useState<Usuario[]>([]);
    const [loading, setLoading] = useState(true);

    // Form state
    const [showForm, setShowForm] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [nomeCompleto, setNomeCompleto] = useState('');
    const [cargo, setCargo] = useState('operador');
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        if (!roleLoading && !isAdmin) {
            navigate('/');
            return;
        }
        fetchUsuarios();
    }, [roleLoading, isAdmin]);

    const fetchUsuarios = async () => {
        try {
            const data = await api.listUsuarios();
            setUsuarios(data as Usuario[]);
        } catch (err) {
            toast.error('Erro ao carregar usuários');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email || !password || !nomeCompleto) {
            toast.error('Preencha todos os campos');
            return;
        }
        if (password.length < 6) {
            toast.error('Senha deve ter no mínimo 6 caracteres');
            return;
        }
        setSubmitting(true);
        try {
            await api.criarUsuario({ email, password, nome_completo: nomeCompleto, cargo });
            toast.success('Usuário criado com sucesso!');
            setEmail(''); setPassword(''); setNomeCompleto(''); setCargo('operador');
            setShowForm(false);
            fetchUsuarios();
        } catch (err: any) {
            toast.error(err.message || 'Erro ao criar usuário');
        } finally {
            setSubmitting(false);
        }
    };

    const handleToggleAtivo = async (usuario: Usuario) => {
        try {
            await api.toggleUsuarioAtivo(usuario.id, !usuario.ativo);
            toast.success(usuario.ativo ? 'Usuário desativado' : 'Usuário reativado');
            fetchUsuarios();
        } catch {
            toast.error('Erro ao alterar status');
        }
    };

    if (roleLoading) return <div className="p-8 text-center text-slate-500">Verificando permissões...</div>;
    if (!isAdmin) return null;

    return (
        <div className="p-4 md:p-8 max-w-5xl mx-auto space-y-6 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <button
                        onClick={() => navigate('/')}
                        className="text-slate-500 hover:text-brand-red flex items-center gap-2 transition-all font-bold uppercase tracking-widest text-[10px] group min-h-[44px] mb-2"
                    >
                        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> Voltar ao Terminal
                    </button>
                    <h1 className="text-xl md:text-3xl font-black text-white tracking-tight italic">
                        GESTÃO DE <span className="text-brand-red not-italic">OPERADORES</span>
                    </h1>
                    <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest mt-1">Administração de acessos do sistema COCKPIT IA</p>
                </div>
                <button
                    onClick={() => setShowForm(!showForm)}
                    className="inline-flex items-center gap-2 px-5 py-3 bg-brand-red hover:bg-red-700 text-white font-black uppercase tracking-widest text-xs rounded-xl transition-all active:scale-95 min-h-[48px] shrink-0"
                >
                    <UserPlus className="w-4 h-4" />
                    {showForm ? 'Cancelar' : 'Novo Operador'}
                </button>
            </div>

            {/* Create User Form */}
            {showForm && (
                <form onSubmit={handleSubmit} className="glass-card p-5 md:p-8 space-y-5 tactical-border animate-in slide-in-from-top duration-300">
                    <h2 className="text-lg font-black text-white flex items-center gap-2 italic">
                        <UserPlus className="w-5 h-5 text-brand-red" /> Criar Novo Operador
                    </h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Nome Completo</label>
                            <input
                                type="text"
                                value={nomeCompleto}
                                onChange={e => setNomeCompleto(e.target.value)}
                                className="w-full bg-white/[0.03] border border-white/10 rounded-xl p-3 text-white font-medium focus:outline-none focus:border-brand-red focus:ring-1 focus:ring-brand-red/50 min-h-[48px]"
                                placeholder="Ex: João da Silva"
                            />
                        </div>
                        <div>
                            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Email</label>
                            <input
                                type="email"
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                                className="w-full bg-white/[0.03] border border-white/10 rounded-xl p-3 text-white font-medium focus:outline-none focus:border-brand-red focus:ring-1 focus:ring-brand-red/50 min-h-[48px]"
                                placeholder="operador@empresa.com"
                            />
                        </div>
                        <div>
                            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Senha</label>
                            <input
                                type="password"
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                                className="w-full bg-white/[0.03] border border-white/10 rounded-xl p-3 text-white font-medium focus:outline-none focus:border-brand-red focus:ring-1 focus:ring-brand-red/50 min-h-[48px]"
                                placeholder="Mínimo 6 caracteres"
                            />
                        </div>
                        <div>
                            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Cargo</label>
                            <select
                                value={cargo}
                                onChange={e => setCargo(e.target.value)}
                                className="w-full bg-white/[0.03] border border-white/10 rounded-xl p-3 text-white font-medium focus:outline-none focus:border-brand-red focus:ring-1 focus:ring-brand-red/50 min-h-[48px] appearance-none"
                            >
                                <option value="operador" className="bg-[#0a0a0a]">Operador</option>
                                <option value="admin" className="bg-[#0a0a0a]">Administrador</option>
                            </select>
                        </div>
                    </div>
                    <button
                        type="submit"
                        disabled={submitting}
                        className="w-full sm:w-auto px-8 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-black uppercase tracking-widest text-xs rounded-xl transition-all active:scale-95 disabled:opacity-50 min-h-[48px]"
                    >
                        {submitting ? 'Criando...' : 'Criar Operador'}
                    </button>
                </form>
            )}

            {/* Users List */}
            <div className="glass-card shadow-2xl shadow-black/40 overflow-hidden relative">
                <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-white/10 to-transparent" />

                {loading ? (
                    <div className="px-8 py-16 flex flex-col items-center gap-4">
                        <div className="w-8 h-8 border-2 border-brand-red border-t-transparent rounded-full animate-spin" />
                        <span className="text-slate-500 font-bold uppercase tracking-widest text-xs">Carregando operadores...</span>
                    </div>
                ) : (
                    <>
                        {/* Desktop Table */}
                        <div className="hidden md:block overflow-x-auto">
                            <table className="w-full text-left text-sm">
                                <thead>
                                    <tr className="border-b border-white/5 bg-white/[0.02]">
                                        <th className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Nome</th>
                                        <th className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Email</th>
                                        <th className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Cargo</th>
                                        <th className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Status</th>
                                        <th className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 text-right">Ação</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                    {usuarios.map(u => (
                                        <tr key={u.id} className={`group hover:bg-white/[0.05] transition-all ${!u.ativo ? 'opacity-40' : ''}`}>
                                            <td className="px-6 py-4">
                                                <div className="font-bold text-white">{u.nome_completo}</div>
                                            </td>
                                            <td className="px-6 py-4 text-slate-400 font-medium text-xs">{u.email}</td>
                                            <td className="px-6 py-4">
                                                <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${u.cargo === 'admin' ? 'bg-brand-red/20 text-brand-red border border-brand-red/30' : 'bg-white/5 text-slate-400 border border-white/10'}`}>
                                                    {u.cargo === 'admin' ? <Shield className="w-3 h-3" /> : <User className="w-3 h-3" />}
                                                    {u.cargo}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`text-[10px] font-black uppercase tracking-widest ${u.ativo ? 'text-emerald-500' : 'text-red-500'}`}>
                                                    {u.ativo ? 'Ativo' : 'Inativo'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <button
                                                    onClick={() => handleToggleAtivo(u)}
                                                    className="inline-flex items-center gap-2 px-3 py-2 bg-white/5 hover:bg-white/10 text-white text-[10px] font-black uppercase tracking-wider rounded-lg transition-all border border-white/10 min-h-[44px]"
                                                >
                                                    {u.ativo ? <ToggleRight className="w-4 h-4 text-emerald-500" /> : <ToggleLeft className="w-4 h-4 text-red-500" />}
                                                    {u.ativo ? 'Desativar' : 'Reativar'}
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Mobile Cards */}
                        <div className="md:hidden divide-y divide-white/5">
                            {usuarios.map(u => (
                                <div key={u.id} className={`p-4 ${!u.ativo ? 'opacity-40' : ''}`}>
                                    <div className="flex items-start justify-between gap-3 mb-2">
                                        <div>
                                            <div className="font-bold text-white text-base">{u.nome_completo}</div>
                                            <div className="text-xs text-slate-500 font-medium">{u.email}</div>
                                        </div>
                                        <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-[9px] font-black uppercase tracking-widest shrink-0 ${u.cargo === 'admin' ? 'bg-brand-red/20 text-brand-red border border-brand-red/30' : 'bg-white/5 text-slate-400 border border-white/10'}`}>
                                            {u.cargo === 'admin' ? <Shield className="w-3 h-3" /> : <User className="w-3 h-3" />}
                                            {u.cargo}
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-between mt-3">
                                        <span className={`text-[10px] font-black uppercase tracking-widest ${u.ativo ? 'text-emerald-500' : 'text-red-500'}`}>
                                            {u.ativo ? '● Ativo' : '○ Inativo'}
                                        </span>
                                        <button
                                            onClick={() => handleToggleAtivo(u)}
                                            className="inline-flex items-center gap-1.5 px-3 py-2 bg-white/5 active:bg-white/10 text-white text-[9px] font-black uppercase tracking-wider rounded-lg border border-white/10 min-h-[44px]"
                                        >
                                            {u.ativo ? <ToggleRight className="w-4 h-4 text-emerald-500" /> : <ToggleLeft className="w-4 h-4 text-red-500" />}
                                            {u.ativo ? 'Desativar' : 'Reativar'}
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default Usuarios;
