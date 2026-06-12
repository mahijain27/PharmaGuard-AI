export default function PageHeader({ eyebrow, title, description, children }) {
  return (
    <div className="border-b border-navy-700 bg-navy-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 md:py-10">
        {eyebrow && (
          <p className="text-xs font-mono text-teal-500 uppercase tracking-widest mb-2">{eyebrow}</p>
        )}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="font-display font-semibold text-2xl md:text-3xl text-slate-100 leading-tight">
              {title}
            </h1>
            {description && (
              <p className="mt-1.5 text-sm text-slate-500 max-w-xl leading-relaxed">{description}</p>
            )}
          </div>
          {children && <div className="shrink-0">{children}</div>}
        </div>
      </div>
    </div>
  )
}
