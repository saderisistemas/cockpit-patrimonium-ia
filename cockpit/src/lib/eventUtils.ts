export function getEventDescription(evento_codigo?: string | null, descricao_catalogo?: string | null, desc_evento?: string | null, fallback: string = 'Disparo de alarme'): string {
    if (evento_codigo === '9900') {
        return 'Realizar Ronda no Cliente';
    }
    return descricao_catalogo || desc_evento || fallback;
}
