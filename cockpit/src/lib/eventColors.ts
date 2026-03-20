export type EventColorConfig = {
    borderColor: string;
    bgColor: string;
    textColor: string;
    shadowColor: string;
};

export function getEventColors(evento_codigo?: string, prioridade?: string | number): EventColorConfig {
    const prioValue = Number(prioridade);

    // E35* ou 9015* -> Comunicação/Módulo (Roxo)
    if (evento_codigo?.startsWith('E35') || evento_codigo?.startsWith('9015')) {
        return {
            borderColor: 'border-[#a855f7]',
            bgColor: 'bg-[#a855f7]/10',
            textColor: 'text-[#a855f7]',
            shadowColor: 'shadow-[0_0_15px_rgba(168,85,247,0.3)]'
        };
    }

    // 901* -> Hábito (Verde)
    if (evento_codigo?.startsWith('901')) {
        return {
            borderColor: 'border-[#00ff00]',
            bgColor: 'bg-[#00ff00]/10',
            textColor: 'text-[#00ff00]',
            shadowColor: 'shadow-[0_0_15px_rgba(0,255,0,0.3)]'
        };
    }

    // 9704 ou E301 ou 9558 -> Energia / Prioridade Crítica (Preto)
    if (evento_codigo === '9704' || evento_codigo === 'E301' || evento_codigo === '9558') {
        return {
            borderColor: 'border-black',
            bgColor: 'bg-black',
            textColor: 'text-[#ff0000]',
            shadowColor: 'shadow-[0_0_15px_rgba(255,0,0,0.4)]'
        };
    }

    // 9065 -> Deslocamento (Ciano)
    if (evento_codigo === '9065') {
        return {
            borderColor: 'border-[#00e1d9]',
            bgColor: 'bg-[#00e1d9]/10',
            textColor: 'text-[#00e1d9]',
            shadowColor: 'shadow-[0_0_15px_rgba(0,225,217,0.3)]'
        };
    }

    // 3907, 1804, 3904 -> Analítico (Branco)
    if (evento_codigo === '3907' || evento_codigo === '1804' || evento_codigo === '3904') {
        return {
            borderColor: 'border-white/50',
            bgColor: 'bg-white/5',
            textColor: 'text-white',
            shadowColor: 'shadow-[0_0_15px_rgba(255,255,255,0.1)]'
        };
    }

    // E306 -> Técnico no Local (Cinza padrão)
    if (evento_codigo === 'E306') {
        return {
            borderColor: 'border-slate-500',
            bgColor: 'bg-slate-500/10',
            textColor: 'text-slate-400',
            shadowColor: 'shadow-[0_0_15px_rgba(100,116,139,0.3)]'
        };
    }

    // E130 ou Prioridades Intrusão (0, 1) -> Crítico (Vermelho)
    if (evento_codigo === 'E130' || prioValue === 0 || prioValue === 1) {
        return {
            borderColor: 'border-[#ff0000]',
            bgColor: 'bg-[#ff0000]/10',
            textColor: 'text-[#ff0000]',
            shadowColor: 'shadow-[0_0_15px_rgba(255,0,0,0.3)]'
        };
    }

    // Prioridade 5 (Baixa) -> Azul
    if (prioValue === 5) {
        return {
            borderColor: 'border-[#007aff]',
            bgColor: 'bg-[#007aff]/10',
            textColor: 'text-[#007aff]',
            shadowColor: 'shadow-[0_0_15px_rgba(0,122,255,0.3)]'
        };
    }

    // Prioridade 4 (Analíticos/Cameras) -> Branco
    if (prioValue === 4) {
        return {
            borderColor: 'border-white/50',
            bgColor: 'bg-white/5',
            textColor: 'text-white',
            shadowColor: 'shadow-[0_0_15px_rgba(255,255,255,0.1)]'
        };
    }

    // Padrão/Restante (Cinza Escuro / Slate)
    return {
        borderColor: 'border-slate-500',
        bgColor: 'bg-slate-500/10',
        textColor: 'text-slate-400',
        shadowColor: 'shadow-[0_0_15px_rgba(100,116,139,0.3)]'
    };
}
