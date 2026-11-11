import React from 'react';
import { Calendar, Gauge } from 'lucide-react';
import { parseNextIntervention, formatDateIT, formatKm } from '../utils/nextIntervention';

interface NextInterventionLabelProps {
  value?: string;
  /** Mostra il prefisso "Prossimo:" */
  withPrefix?: boolean;
  className?: string;
  iconClassName?: string;
}

/**
 * Mostra il prossimo intervento riconoscendo il tipo:
 * data (calendario), km (tachimetro) o entrambi ("… o …").
 */
export const NextInterventionLabel: React.FC<NextInterventionLabelProps> = ({
  value,
  withPrefix = false,
  className = '',
  iconClassName = 'h-3 w-3',
}) => {
  const { date, km } = parseNextIntervention(value);
  if (!date && km === null) {
    // Testo libero non riconosciuto: mostralo comunque
    return value ? <span className={className}>{withPrefix ? 'Prossimo: ' : ''}{value}</span> : null;
  }

  return (
    <span className={`inline-flex flex-wrap items-center gap-x-1.5 gap-y-0.5 ${className}`}>
      {withPrefix && <span>Prossimo:</span>}
      {date && (
        <span className="inline-flex items-center gap-1">
          <Calendar className={`${iconClassName} text-amber-400`} />
          {formatDateIT(date)}
        </span>
      )}
      {date && km !== null && <span className="text-slate-500">o</span>}
      {km !== null && (
        <span className="inline-flex items-center gap-1">
          <Gauge className={`${iconClassName} text-blue-400`} />
          {formatKm(km)} km
        </span>
      )}
    </span>
  );
};
