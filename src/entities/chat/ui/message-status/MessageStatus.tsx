import { Check, CheckCheck, CircleAlert, Clock3, type LucideIcon } from "lucide-react"
import type { TMessageStatus } from "../../model/types"
import cls from "./MessageStatus.module.css"

type TStatusView = { icon: LucideIcon; label: string; tone?: "read" | "error" }

const STATUS_VIEWS: Record<TMessageStatus, TStatusView> = {
  sending: { icon: Clock3, label: "Отправляется" },
  pending: { icon: Clock3, label: "В очереди" },
  sent: { icon: Check, label: "Отправлено" },
  delivered: { icon: CheckCheck, label: "Доставлено" },
  read: { icon: CheckCheck, label: "Прочитано", tone: "read" },
  failed: { icon: CircleAlert, label: "Не отправлено", tone: "error" },
  noAccount: { icon: CircleAlert, label: "У номера нет WhatsApp", tone: "error" },
  notInGroup: { icon: CircleAlert, label: "Вы не участник группы", tone: "error" }
}

/** Галочки исходящего: часы → одна → две → две цветные; ошибка — красный значок */
export function MessageStatus({ status }: { status: TMessageStatus }) {
  const { icon: Icon, label, tone } = STATUS_VIEWS[status]
  return (
    <Icon className={cls.status} data-tone={tone} size={16} strokeWidth={2} aria-label={label}>
      <title>{label}</title>
    </Icon>
  )
}
