function isInteractiveTarget(target) {
  if (!(target instanceof Element)) {
    return false
  }
  return Boolean(target.closest('a, button, input, select, textarea, [role="button"]'))
}

export default function DataTable({ columns, rows, emptyMessage = 'Sin registros por ahora.', onRowClick }) {
  if (!rows || rows.length === 0) {
    return (
      <div className="py-20 text-center border border-dashed border-slate-200 rounded-3xl">
        <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">{emptyMessage}</p>
      </div>
    )
  }

  const dataColumns = columns.filter(col => !['edit', 'assign', 'delete', 'view', 'actions'].includes(col.key))

  return (
    <div className="w-full">
      {/* Desktop View */}
      <div className="hidden md:block bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-slate-50/50">
                {columns.map((column) => {
                  const isAction = ['edit', 'assign', 'delete', 'actions'].includes(column.key)
                  const isNumeric = ['_count', 'mantenimientos'].includes(column.key)
                  
                  return (
                    <th 
                      key={column.key} 
                      className={`py-5 px-6 text-[10px] uppercase font-bold tracking-[0.2em] text-slate-400 border-b border-slate-100 ${
                        isAction || isNumeric ? 'text-center' : 'text-left'
                      } ${column.className || ''}`}
                    >
                      {column.header}
                    </th>
                  )
                })}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {rows.map((row, rowIndex) => (
                <tr
                  key={row.id ?? rowIndex}
                  className={`group transition-all duration-150 ${
                    onRowClick 
                      ? 'cursor-pointer hover:bg-slate-50/50' 
                      : 'hover:bg-slate-50/30'
                  }`}
                  onClick={(event) => {
                    if (!onRowClick || isInteractiveTarget(event.target)) {
                      return
                    }
                    onRowClick(row)
                  }}
                >
                  {columns.map((column) => {
                    const isAction = ['edit', 'assign', 'delete', 'actions'].includes(column.key)
                    const isNumeric = ['_count', 'mantenimientos'].includes(column.key)
                    const isMain = column.key === dataColumns[0]?.key
                    
                    return (
                      <td 
                        key={column.key} 
                        className={`py-4 px-6 ${
                           isAction || isNumeric ? 'text-center' : 'text-left'
                        } ${column.className || ''}`}
                      >
                        <div className={`flex ${isAction || isNumeric ? 'justify-center' : 'justify-start'} items-center`}>
                          <div className={`
                            ${isMain ? 'font-bold text-slate-900 text-sm' : 'font-medium text-slate-500 text-xs'}
                            ${isNumeric ? 'font-bold text-slate-400 text-[11px]' : ''}
                          `}>
                            {column.render ? column.render(row) : row[column.key]}
                          </div>
                        </div>
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile View */}
      <div className="md:hidden space-y-4">
        {rows.map((row, rowIndex) => (
          <div 
            key={row.id ?? rowIndex}
            className={`bg-white border border-slate-100 rounded-2xl p-6 transition-all active:scale-[0.98] ${
              onRowClick ? 'cursor-pointer' : ''
            }`}
            onClick={(event) => {
              if (!onRowClick || isInteractiveTarget(event.target)) {
                return
              }
              onRowClick(row)
            }}
          >
            <div className="flex justify-between items-start mb-4">
              <div>
                <span className="text-[8px] uppercase font-bold tracking-widest text-blue-500 block mb-1">
                  {dataColumns[0]?.header}
                </span>
                <p className="text-lg font-bold text-slate-900">
                  {dataColumns[0]?.render ? dataColumns[0].render(row) : row[dataColumns[0]?.key]}
                </p>
              </div>
              
              {columns.find(c => c.key === '_count' || c.key === 'mantenimientos') && (
                <div className="text-right">
                  <span className="block text-[8px] uppercase font-bold tracking-widest text-slate-300 mb-0.5">
                    {columns.find(c => c.key === '_count' || c.key === 'mantenimientos').header}
                  </span>
                  <span className="text-sm font-bold text-slate-400">
                    {columns.find(c => c.key === '_count' || c.key === 'mantenimientos').render(row)}
                  </span>
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4 py-4 border-t border-slate-50">
              {dataColumns.slice(1).filter(c => c.key !== '_count' && c.key !== 'mantenimientos').map(col => (
                <div key={col.key}>
                  <span className="text-[8px] uppercase font-bold tracking-widest text-slate-300 block mb-1">
                    {col.header}
                  </span>
                  <div className="text-xs font-medium text-slate-600 truncate">
                    {col.render ? col.render(row) : (row[col.key] || '—')}
                  </div>
                </div>
              ))}
            </div>

            {/* Actions Footer */}
            {columns.some(c => ['edit', 'assign', 'delete', 'actions'].includes(c.key)) && (
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-50">
                {columns.filter(c => ['edit', 'assign', 'delete', 'actions'].includes(c.key)).map(col => (
                  <div key={col.key}>
                    {col.render(row)}
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

