export default function Button({
  children,
  type = 'button',
  variant = 'primary',
  size = 'md',
  className = '',
  ...props
}) {
  const variantClass = {
    primary: 'btn-primary shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/40 hover:-translate-y-0.5',
    secondary: 'btn-secondary shadow-lg shadow-secondary/20 hover:shadow-xl hover:shadow-secondary/40 hover:-translate-y-0.5',
    neutral: 'btn-neutral shadow-lg shadow-neutral/10 hover:shadow-xl hover:-translate-y-0.5',
    outline: 'btn-outline border-2 hover:bg-base-200 hover:text-base-content hover:-translate-y-0.5',
    success: 'btn-success text-white shadow-lg shadow-success/20 hover:shadow-xl hover:shadow-success/40 hover:-translate-y-0.5',
  }[variant]

  const sizeClass = {
    sm: 'btn-sm text-[10px] uppercase font-black tracking-widest px-4 h-10 min-h-0 rounded-xl',
    md: 'btn-md text-xs uppercase font-black tracking-widest px-6 h-12 rounded-[1rem]',
    lg: 'btn-lg text-sm uppercase font-black tracking-widest px-8 h-14 rounded-2xl',
  }[size]

  return (
    <button 
      type={type} 
      className={`btn transition-all duration-300 border-none active:scale-95 ${variantClass} ${sizeClass} ${className}`} 
      {...props}
    >
      {children}
    </button>
  )
}

