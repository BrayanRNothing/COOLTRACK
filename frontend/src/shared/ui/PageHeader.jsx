export default function PageHeader({ title, subtitle, actions }) {
  return (
    <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="space-y-1">
        <h1 className="text-3xl font-extrabold tracking-tight text-base-content sm:text-4xl">{title}</h1>
        {subtitle && <p className="text-sm font-medium text-base-content/50 sm:text-base">{subtitle}</p>}
      </div>
      {actions ? <div className="flex flex-wrap gap-3">{actions}</div> : null}
    </div>
  )
}
