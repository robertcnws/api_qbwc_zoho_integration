import React from 'react';
import { CheckCircle, Clock, RefreshCw, XCircle, CopyCheck } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import {
  Tooltip, TooltipContent, TooltipProvider, TooltipTrigger,
} from '@/components/ui/tooltip';

const STATE_CONFIG = {
  confirmed: {
    variant: 'success',
    label: 'Synced',
    Icon: CheckCircle,
    tooltip: (f) => f.qb_txn_id
      ? `Confirmed in QuickBooks (TxnID: ${f.qb_txn_id})`
      : 'Confirmed in QuickBooks',
  },
  sent: {
    variant: 'default',
    label: 'Sending…',
    Icon: RefreshCw,
    iconClass: 'animate-spin',
    tooltip: () => 'Sent to QuickBooks, awaiting confirmation',
  },
  pending: {
    variant: 'secondary',
    label: 'Pending',
    Icon: Clock,
    tooltip: () => 'Pending sync',
  },
  failed: {
    variant: 'destructive',
    label: 'Failed',
    Icon: XCircle,
    tooltip: (f) => f.last_qb_error
      ? `Failed: ${f.last_qb_error}`
      : 'Failed in QuickBooks',
  },
  skipped_duplicate: {
    variant: 'warning',
    label: 'Already in QB',
    Icon: CopyCheck,
    tooltip: (f) => f.qb_txn_id
      ? `Already exists in QuickBooks (TxnID: ${f.qb_txn_id})`
      : 'Already exists in QuickBooks',
  },
};

// Fallback para filas serializadas antes de la migración (no debería ocurrir
// gracias al backfill, pero es defensa por si algún payload viejo sobrevive).
function deriveFallbackState(fields) {
  if (fields?.inserted_in_qb) return 'confirmed';
  return 'pending';
}

export const SyncStateBadge = ({ invoice }) => {
  const fields = invoice || {};
  const state = fields.sync_state || deriveFallbackState(fields);
  const config = STATE_CONFIG[state] || STATE_CONFIG.pending;
  const { variant, label, Icon, iconClass, tooltip } = config;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge variant={variant} className="gap-1">
            <Icon size={12} className={iconClass} />
            {label}
          </Badge>
        </TooltipTrigger>
        <TooltipContent>{tooltip(fields)}</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default SyncStateBadge;
