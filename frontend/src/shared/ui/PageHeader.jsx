export default function PageHeader({ title, subtitle, actions }) {
  return (
    <div className="mb-10 md:mb-14 flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between animate-in fade-in slide-in-from-left-4 duration-700">
      <div className="space-y-1 md:space-y-2">
        <div className="flex items-center gap-4">
          <div className="w-1.5 h-10 bg-blue-600 rounded-full hidden md:block" />
          <h1 className="text-3xl md:text-5xl font-black tracking-tighter text-slate-900 leading-none">
            {title}
          </h1>
        </div>
        {subtitle && (
          <p className="text-[10px] md:text-xs font-black text-slate-400 uppercase tracking-[0.4em] md:ml-5">
            {subtitle}
          </p>
        )}
      </div>
      {actions ? (
        <div className="flex flex-wrap gap-3 md:gap-4 items-center">
          {actions}
        </div>
      ) : null}
    </div>
  )
}

