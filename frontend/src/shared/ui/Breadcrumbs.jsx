import { Link } from 'react-router-dom'

export default function Breadcrumbs({ items }) {
  if (!items || items.length === 0) return null

  return (
    <nav className="text-xs uppercase tracking-widest font-bold text-base-content/40 mb-2">
      <ul className="flex items-center gap-2 flex-wrap">
        {items.map((item, index) => (
          <li key={index} className="flex items-center gap-2">
            {index > 0 && <span className="opacity-30">/</span>}
            {item.to ? (
              <Link to={item.to} className="hover:text-primary transition-standard">
                {item.label}
              </Link>
            ) : (
              <span className="text-base-content/70">{item.label}</span>
            )}
          </li>
        ))}
      </ul>
    </nav>
  )
}
