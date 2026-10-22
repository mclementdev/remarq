export function Section({
  id,
  title,
  actions,
  children,
}: {
  id: string;
  title: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section id={id} aria-labelledby={`${id}-title`} className="panel scroll-mt-40 p-5">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 id={`${id}-title`} className="section-title">{title}</h2>
        {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
      </div>
      {children}
    </section>
  );
}
