import { useState } from 'react';
import { BookOpen, ShieldAlert, Activity, Clock, CloudLightning, ShieldCheck, Wrench, Target, Flame, ToggleRight, Database } from 'lucide-react';

export const Ajuda = () => {
    const [activeSection, setActiveSection] = useState('gate');

    const menu = [
        { id: 'gate', icon: ShieldAlert, label: 'O Gate E130 (Anti-Flood)' },
        { id: 'scores', icon: Target, label: 'Graus de Suspeita (Score)' },
        { id: 'os', icon: Wrench, label: 'Regras de Ordem de Serviço' },
        { id: 'toggle', icon: ToggleRight, label: 'Controle de Análise' }
    ];

    return (
        <div className="p-8 max-w-7xl mx-auto text-slate-300 space-y-8 animate-in fade-in duration-500">
            <header className="mb-12">
                <div className="flex items-center gap-4 mb-4">
                    <div className="w-16 h-16 rounded-2xl bg-brand-red/10 flex items-center justify-center border border-brand-red/20 shadow-[0_0_30px_rgba(220,38,38,0.15)]">
                        <BookOpen className="w-8 h-8 text-brand-red" />
                    </div>
                    <div>
                        <h1 className="text-4xl font-black text-white tracking-widest uppercase">Base de Conhecimento</h1>
                        <p className="text-lg text-slate-400 font-medium mt-1">
                            Documentação Oficial das Regras de Inteligência e Operação do Cockpit IA
                        </p>
                    </div>
                </div>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                {/* MENU LATERAL */}
                <div className="lg:col-span-1 space-y-2">
                    {menu.map((item) => {
                        const Icon = item.icon;
                        const isActive = activeSection === item.id;
                        return (
                            <button
                                key={item.id}
                                onClick={() => setActiveSection(item.id)}
                                className={`w-full flex items-center gap-4 px-5 py-4 rounded-xl font-bold uppercase tracking-wider text-sm transition-all duration-300 ${
                                    isActive
                                        ? 'bg-brand-red/10 text-brand-red border border-brand-red/30 shadow-[0_0_20px_rgba(220,38,38,0.1)]'
                                        : 'bg-slate-900 border border-white/5 text-slate-400 hover:bg-slate-800 hover:text-white'
                                }`}
                            >
                                <Icon className={`w-5 h-5 ${isActive ? 'text-brand-red' : 'text-slate-500'}`} />
                                {item.label}
                            </button>
                        );
                    })}
                </div>

                {/* CONTEÚDO */}
                <div className="lg:col-span-3">
                    {activeSection === 'gate' && (
                        <div className="bg-slate-900/50 border border-white/10 rounded-3xl p-8 shadow-2xl backdrop-blur-sm animate-in slide-in-from-right-4 duration-300">
                            <div className="flex items-center gap-4 mb-8">
                                <Database className="w-10 h-10 text-blue-500" />
                                <div>
                                    <h2 className="text-3xl font-black text-white uppercase tracking-wider">O Gate E130 (Anti-Flood)</h2>
                                    <p className="text-blue-400 font-bold uppercase tracking-widest text-sm mt-1">Filtro de Custos e Redundância</p>
                                </div>
                            </div>
                            
                            <div className="prose prose-invert max-w-none">
                                <p className="text-xl leading-relaxed text-slate-300 mb-6">
                                    O Gate é a primeira barreira de defesa do Cockpit IA. Ele atua para impedir que o motor de inteligência artificial (LLM) seja inundado por eventos repetidos que não agregam contexto, poupando processamento do workflow e reduzindo custos operacionais.
                                </p>

                                <div className="bg-blue-500/10 border border-blue-500/20 rounded-2xl p-6 mb-8">
                                    <h3 className="text-xl font-black text-blue-400 uppercase tracking-wider flex items-center gap-2 mb-4">
                                        <Clock className="w-6 h-6" /> A Regra dos 5 Minutos
                                    </h3>
                                    <p className="text-lg">
                                        Quando um evento <strong>E130 (Alarme de Intrusão)</strong> é recebido, o sistema verifica a base de dados. Se houver um evento idêntico (mesmo cliente, mesmo setor) ocorrido em um intervalo <strong>menor que 5 minutos</strong>, o novo evento é considerado um <i>rebote</i> ou <i>eco de sensor</i>.
                                    </p>
                                    <p className="text-lg mt-4 font-bold text-white">
                                        Resultado: O evento é armazenado por questões de auditoria, mas a análise de IA é sumariamente descartada.
                                    </p>
                                </div>

                                <h3 className="text-2xl font-black text-white uppercase tracking-wider mb-4 border-b border-white/10 pb-2">Por que isso existe?</h3>
                                <ul className="space-y-4 text-lg text-slate-300">
                                    <li className="flex gap-4"><ShieldCheck className="w-6 h-6 text-emerald-500 shrink-0 mt-0.5"/> Evita que um sensor oscilando dispare 50 análises seguidas para o mesmo local.</li>
                                    <li className="flex gap-4"><ShieldCheck className="w-6 h-6 text-emerald-500 shrink-0 mt-0.5"/> Protege contra faturamento excessivo de tokens na API do Gemini/OpenAI.</li>
                                    <li className="flex gap-4"><ShieldCheck className="w-6 h-6 text-emerald-500 shrink-0 mt-0.5"/> Mantém o Dashboard tático limpo, focando apenas na "cabeça" do evento.</li>
                                </ul>
                            </div>
                        </div>
                    )}

                    {activeSection === 'scores' && (
                        <div className="bg-slate-900/50 border border-white/10 rounded-3xl p-8 shadow-2xl backdrop-blur-sm animate-in slide-in-from-right-4 duration-300">
                            <div className="flex items-center gap-4 mb-8">
                                <Target className="w-10 h-10 text-emerald-500" />
                                <div>
                                    <h2 className="text-3xl font-black text-white uppercase tracking-wider">Graus de Suspeita (Score)</h2>
                                    <p className="text-emerald-400 font-bold uppercase tracking-widest text-sm mt-1">Como a IA classifica o perigo</p>
                                </div>
                            </div>

                            <p className="text-xl leading-relaxed text-slate-300 mb-8">
                                Toda análise gera um Score de 0 a 100. Este número dita a cor do painel, a urgência visual e dita como o operador deve tratar o evento. O score leva em conta horário, histórico de chamados, setor do disparo e clima local.
                            </p>

                            <div className="grid gap-6">
                                {/* BAIXA */}
                                <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-6 relative overflow-hidden">
                                    <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-emerald-500/20 to-transparent pointer-events-none" />
                                    <h3 className="text-2xl font-black text-emerald-400 uppercase tracking-widest mb-2 flex items-center gap-3">
                                        <div className="px-3 py-1 bg-emerald-500 text-black rounded-lg">0 a 39</div> Suspeita Baixa
                                    </h3>
                                    <p className="text-lg text-slate-300">
                                        A IA determinou que não há risco imediato. Geralmente engloba falsos alarmes causados por:
                                    </p>
                                    <ul className="list-disc list-inside mt-3 text-emerald-200/70 text-lg ml-2">
                                        <li>Rajadas de vento ou tempestades afetando sensores externos.</li>
                                        <li>Condições de temperatura que ofuscam o infravermelho.</li>
                                        <li>Pequenos animais ou insetos (quando analisado com contexto).</li>
                                    </ul>
                                </div>

                                {/* MEDIA */}
                                <div className="bg-orange-500/10 border border-orange-500/20 rounded-2xl p-6 relative overflow-hidden">
                                     <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-orange-500/20 to-transparent pointer-events-none" />
                                    <h3 className="text-2xl font-black text-orange-400 uppercase tracking-widest mb-2 flex items-center gap-3">
                                        <div className="px-3 py-1 bg-orange-500 text-black rounded-lg">40 a 69</div> Suspeita Moderada
                                    </h3>
                                    <p className="text-lg text-slate-300">
                                        Situações ambíguas que exigem atenção, mas não configuram pânico absoluto. Exemplos:
                                    </p>
                                    <ul className="list-disc list-inside mt-3 text-orange-200/70 text-lg ml-2">
                                        <li>Sensor interno disparando do nada, sem histórico climático, mas isolado.</li>
                                        <li>Recorrência crônica de setor que indica provável falha de equipamento (O.S).</li>
                                        <li>Janelas de horário anômalas, porém sem disparos em sequência (caminho de intrusão nítido).</li>
                                    </ul>
                                </div>

                                {/* ALTA */}
                                <div className="bg-brand-red/10 border border-brand-red/20 rounded-2xl p-6 relative overflow-hidden">
                                    <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-brand-red/20 to-transparent pointer-events-none" />
                                    <h3 className="text-2xl font-black text-brand-red uppercase tracking-widest mb-2 flex items-center gap-3">
                                        <div className="px-3 py-1 bg-brand-red text-white rounded-lg">70 a 100</div> Suspeita Crítica!
                                    </h3>
                                    <p className="text-lg text-slate-300">
                                        Ação imediata necessária. O padrão indica alta chance de intrusão real:
                                    </p>
                                    <ul className="list-disc list-inside mt-3 text-red-200/70 text-lg ml-2">
                                        <li>Zonas disparando sequencialmente (ex: Muro, depois Garagem, depois Porta Frontal).</li>
                                        <li>Horários de extremo risco sem aviso prévio de serviço.</li>
                                        <li>Sensores blindados acionados.</li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeSection === 'os' && (
                        <div className="bg-slate-900/50 border border-white/10 rounded-3xl p-8 shadow-2xl backdrop-blur-sm animate-in slide-in-from-right-4 duration-300">
                            <div className="flex items-center gap-4 mb-8">
                                <Wrench className="w-10 h-10 text-yellow-500" />
                                <div>
                                    <h2 className="text-3xl font-black text-white uppercase tracking-wider">Abertura de O.S (Ordem de Serviço)</h2>
                                    <p className="text-yellow-400 font-bold uppercase tracking-widest text-sm mt-1">Critérios de Recomendação</p>
                                </div>
                            </div>

                            <p className="text-xl leading-relaxed text-slate-300 mb-8">
                                O Cockpit não serve apenas para acionar ronda. Ele detecta equipamentos falhos e poupa o técnico de ir até o local por motivos que são claramente ambientais.
                            </p>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="bg-black/40 border border-white/10 p-8 rounded-3xl">
                                    <CloudLightning className="w-12 h-12 text-slate-400 mb-6" />
                                    <h3 className="text-2xl font-black text-white uppercase mb-4">Quando NÃO Abrir OS</h3>
                                    <p className="text-slate-400 text-lg leading-relaxed">
                                        Se a região do alarme estiver sob condições meteorológicas severas (ventania forte constatada na API de clima, tempestades, choque térmico absurdo), a IA entende que a perturbação no sensor é obra da natureza.
                                        <br/><br/>Neste caso, o evento é mitigado e <strong>nenhuma OS é recomendada</strong>, poupando a equipe de manutenção de visitas técnicas inúteis (o famoso "cheguei lá e não tinha nada").
                                    </p>
                                </div>

                                <div className="bg-black/40 border border-yellow-500/20 shadow-[inset_0_0_50px_rgba(234,179,8,0.05)] p-8 rounded-3xl relative overflow-hidden">
                                     <div className="absolute top-0 w-full h-1 left-0 bg-yellow-500" />
                                     <Flame className="w-12 h-12 text-yellow-500 mb-6" />
                                    <h3 className="text-2xl font-black text-yellow-500 uppercase mb-4">Quando RECOMENDAR OS</h3>
                                    <p className="text-slate-300 text-lg leading-relaxed">
                                        Quando o mesmo setor apresenta <strong>recorrência crônica</strong> (vários eventos sequenciais no histórico do cliente para aquele local) e, simultaneamente, o Clima está classificado como "Normal" ou "Céu Limpo".
                                        <br/><br/>
                                        Isso sinaliza para a IA que o sensor deve estar com teia de aranha, vício elétrico ou curto. A badge <strong>OS RECOMENDADA</strong> piscará em amarelo na TV Tática e no detalhamento do evento.
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeSection === 'toggle' && (
                        <div className="bg-slate-900/50 border border-white/10 rounded-3xl p-8 shadow-2xl backdrop-blur-sm animate-in slide-in-from-right-4 duration-300">
                            <div className="flex items-center gap-4 mb-8">
                                <Activity className="w-10 h-10 text-purple-500" />
                                <div>
                                    <h2 className="text-3xl font-black text-white uppercase tracking-wider">Controle Operacional (Toggle IA)</h2>
                                    <p className="text-purple-400 font-bold uppercase tracking-widest text-sm mt-1">Armar e Desarmar o Robô</p>
                                </div>
                            </div>

                            <p className="text-xl leading-relaxed text-slate-300 mb-8">
                                No Header do Dashboard existe um interruptor global <strong>"Análise Automática IA"</strong>. Este switch dá controle total sobre os gastos e a automação para a gerência de monitoramento.
                            </p>

                            <div className="space-y-6">
                                <div className="flex bg-emerald-500/10 border border-emerald-500/20 p-6 rounded-2xl items-start gap-6">
                                    <ToggleRight className="w-10 h-10 text-emerald-500 shrink-0" />
                                    <div>
                                        <h3 className="text-2xl font-black text-emerald-400 uppercase tracking-widest mb-2">Toggle Armado (ON)</h3>
                                        <p className="text-lg text-slate-300">O comportamento padrão. Qualquer sinal que passe pelo Gate E130 cai imediatamente no pipeline do Google Gemini para ter a hipótese calculada e o score definido em tempo real.</p>
                                    </div>
                                </div>

                                <div className="flex bg-slate-800/80 border border-slate-600/50 p-6 rounded-2xl items-start gap-6">
                                    <ToggleRight className="w-10 h-10 text-slate-500 shrink-0 rotate-180" />
                                    <div>
                                        <h3 className="text-2xl font-black text-slate-400 uppercase tracking-widest mb-2">Toggle Desarmado (OFF)</h3>
                                        <p className="text-lg text-slate-300">
                                            Em momentos extremos (ex: uma tempestade que afeta metade da cidade e derruba sensores em massa), a gerência pode <strong>desarmar a IA</strong>. 
                                        </p>
                                        <div className="mt-4 p-4 bg-black/40 border border-white/5 rounded-xl text-md text-slate-400">
                                            Os eventos continuam chegando no Cockpit para o operador ver, porém eles ficam aguardando análise (símbolo cerebral cinza). O webhook <strong>não processa no LLM de forma autônoma</strong>, poupando a empresa de queimar uma fortuna de API analisando eventos que obviamente são culpa do apagão/tempestade municipal.
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
