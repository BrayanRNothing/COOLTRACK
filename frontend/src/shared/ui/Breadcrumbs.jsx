import { Link } from 'react-router-dom'

export default function Breadcrumbs({ items }) {
  if (!items || items.length === 0) return null

  return (
    <nav className="text-[10px] uppercase tracking-[0.2em] font-black text-slate-400">
      <ul className="flex items-center gap-3 flex-wrap">
        {items.map((item, index) => (
          <li key={index} className="flex items-center gap-3">
            {index > 0 && <span className="text-slate-300 font-normal">/</span>}
            {item.to ? (
              <Link to={item.to} className="hover:text-blue-600 transition-colors">
                {item.label}
              </Link>
            ) : (
              <span className="text-slate-900">{item.label}</span>
            )}
          </li>
        ))}
      </ul>
    </nav>
  )
}
