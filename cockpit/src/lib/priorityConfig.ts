import { ShieldAlert, AlertTriangle, BadgeInfo } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export type PriorityConfig = {
    color: string;
    icon: LucideIcon;
    label: string;
};

export const getPriorityConfig = (pri: number | null): PriorityConfig => {
    if (pri === 1 || pri === 0) return { color: 'bg-red-500/20 text-red-500 border-red-500/30', icon: ShieldAlert, label: 'SUSPEITA CRÍTICA' };
    if (pri === 2) return { color: 'bg-orange-500/20 text-orange-500 border-orange-500/30', icon: AlertTriangle, label: 'SUSPEITA ALTA' };
    return { color: 'bg-blue-500/20 text-blue-500 border-blue-500/30', icon: BadgeInfo, label: 'SUSPEITA NORMAL' };
};
