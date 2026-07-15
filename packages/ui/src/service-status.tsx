export interface ServiceStatusProps {
  label: string;
  state: "checking" | "available" | "unavailable";
}

export function ServiceStatus({ label, state }: ServiceStatusProps) {
  return (
    <p aria-live="polite" className={`service-status service-status--${state}`}>
      <span aria-hidden="true" className="service-status__indicator" />
      <span>{label}</span>
      <strong>{state}</strong>
    </p>
  );
}
