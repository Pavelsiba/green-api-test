import { formatDayLabel } from "../../lib/format"
import cls from "./DaySeparator.module.css"

/** Капсула с датой над сообщениями дня, как в ленте MAX */
export function DaySeparator({ timestamp }: { timestamp: number }) {
  return (
    <div className={cls.separator}>
      <span className={cls.capsule}>{formatDayLabel(timestamp)}</span>
    </div>
  )
}
