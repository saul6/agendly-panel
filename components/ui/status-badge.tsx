import { cn } from '@/lib/utils'
import type { AppointmentStatus } from '@/types'

interface StatusConfig {
  label: string
  className: string
}

const STATUS_CONFIG: Record<AppointmentStatus, StatusConfig> = {
  confirmed: {
    label: 'Confirmada',
    className: 'bg-violet-100 text-violet-700',        // #EDE9FE / #6D28D9
  },
  completed: {
    label: 'Completada',
    className: 'bg-emerald-100 text-emerald-800',      // #D1FAE5 / #065F46
  },
  cancelled: {
    label: 'Cancelada',
    className: 'bg-gray-100 text-gray-500',            // #F3F4F6 / #6B7280
  },
  pending: {
    label: 'Pendiente',
    className: 'bg-amber-100 text-amber-700',
  },
  no_show: {
    label: 'No se presentó',
    className: 'bg-red-100 text-red-800',              // #FEE2E2 / #991B1B
  },
}

interface StatusBadgeProps {
  status: AppointmentStatus
  className?: string
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = STATUS_CONFIG[status] ?? STATUS_CONFIG.pending
  return (
    <span
      className={cn(
        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium whitespace-nowrap',
        config.className,
        className
      )}
    >
      {config.label}
    </span>
  )
}
