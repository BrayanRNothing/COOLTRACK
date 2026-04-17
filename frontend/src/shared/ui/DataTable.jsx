function isInteractiveTarget(target) {
  if (!(target instanceof Element)) {
    return false
  }

  return Boolean(target.closest('a, button, input, select, textarea, [role="button"]'))
}

export default function DataTable({ columns, rows, emptyMessage = 'Sin registros por ahora.', onRowClick }) {
  if (!rows || rows.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-base-300 bg-base-100 p-12 text-center">
        <p className="text-base-content/40 font-medium italic">{emptyMessage}</p>
      </div>
    )
  }

  return (
    <div className="overflow-x-auto rounded-2xl border border-base-300 bg-base-100 shadow-sm transition-standard hover:shadow-md">
      <table className="table w-full table-fixed border-separate border-spacing-0">
        <thead>
          <tr className="bg-base-200/40">
            {columns.map((column) => {
              const isAction = ['edit', 'assign', 'delete'].includes(column.key)
              const isNumeric = ['_count', 'mantenimientos'].includes(column.key)
              
              return (
                <th 
                  key={column.key} 
                  className={`py-5 px-6 text-xs uppercase font-bold text-base-content/60 border-b border-base-300 ${
                    isAction || isNumeric ? 'text-center' : 'text-left'
                  } ${column.className || ''}`}
                >
                  <div className={isAction || isNumeric ? 'flex justify-center' : 'flex justify-start'}>
                    {column.header}
                  </div>
                </th>
              )
            })}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, rowIndex) => (
            <tr
              key={row.id ?? rowIndex}
              className={`group transition-standard ${
                onRowClick 
                  ? 'cursor-pointer hover:bg-primary/5' 
                  : ''
              }`}
              onClick={(event) => {
                if (!onRowClick || isInteractiveTarget(event.target)) {
                  return
                }
                onRowClick(row)
              }}
            >
              {columns.map((column) => {
                const isAction = ['edit', 'assign', 'delete'].includes(column.key)
                const isNumeric = ['_count', 'mantenimientos'].includes(column.key)
                
                return (
                  <td 
                    key={column.key} 
                    className={`py-4 px-6 font-medium text-base-content/80 border-b border-base-200 group-last:border-none ${
                       isAction || isNumeric ? 'text-center' : 'text-left'
                    } ${column.className || ''}`}
                  >
                    <div className={isAction || isNumeric ? 'flex justify-center' : ''}>
                      {column.render ? column.render(row) : row[column.key]}
                    </div>
                  </td>
                )
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
