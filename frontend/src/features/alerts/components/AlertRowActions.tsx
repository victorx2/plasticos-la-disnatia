import { Link } from "react-router-dom"
import { ExternalLink } from "lucide-react"

import { ALERT_LABELS } from "@/features/alerts/labels"
import type { OperationalAlert } from "@/features/alerts/types"
import { Button } from "@/shared/ui/button"

type AlertRowActionsProps = {
  alert: OperationalAlert
  marking: boolean
  onMarkRead: (id: number) => void
}

export function AlertRowActions({ alert, marking, onMarkRead }: AlertRowActionsProps) {
  return (
    <div className="flex flex-wrap justify-end gap-2">
      {alert.href_path ? (
        <Button type="button" variant="outline" size="sm" asChild>
          <Link to={alert.href_path} onClick={(event) => event.stopPropagation()}>
            <ExternalLink className="h-3.5 w-3.5" aria-hidden />
            {ALERT_LABELS.viewRelated}
          </Link>
        </Button>
      ) : null}
      {!alert.is_read ? (
        <Button
          type="button"
          size="sm"
          disabled={marking}
          onClick={(event) => {
            event.stopPropagation()
            onMarkRead(alert.id)
          }}
        >
          {ALERT_LABELS.markRead}
        </Button>
      ) : null}
    </div>
  )
}
