export default function PageHeader({ title, subtitle, actions }) {
  return (
    <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="space-y-1">
        <h1 className="text-xl sm:text-4xl font-extrabold tracking-tight text-base-content">{title}</h1>
        {subtitle && <p className="text-xs sm:text-base font-medium text-base-content/50">{subtitle}</p>}
      </div>
      {actions ? <div className="flex flex-wrap gap-3">{actions}</div> : null}
    </div>
  )
}
