export default function Button({
  children,
  type = 'button',
  variant = 'primary',
  size = 'md',
  className = '',
  ...props
}) {
  const variantClass = {
    primary: 'btn-primary shadow-sm shadow-primary/20 hover:shadow-md hover:shadow-primary/30',
    secondary: 'btn-secondary shadow-sm shadow-secondary/20 hover:shadow-md hover:shadow-secondary/30',
    neutral: 'btn-neutral',
    outline: 'btn-outline hover:bg-base-200 hover:text-base-content',
    success: 'btn-success text-white shadow-sm shadow-success/20 hover:shadow-md hover:shadow-success/30',
  }[variant]

  const sizeClass = {
    sm: 'btn-sm text-xs',
    md: '',
    lg: 'btn-lg',
  }[size]

  return (
    <button type={type} className={`btn transition-standard ${variantClass} ${sizeClass} ${className}`} {...props}>
      {children}
    </button>
  )
}
