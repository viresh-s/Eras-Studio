interface BadgeProps {
  variant?: 'default' | 'blue' | 'coral' | 'green' | 'red' | 'gray' | 'violet' | 'yellow' | 'pink';
  children: React.ReactNode;
  className?: string;
}

const variantClasses = {
  default: 'bg-[var(--color-cor-border-light)] text-[var(--color-cor-ink)]',
  blue: 'bg-[#F4F4ED] text-[var(--color-cor-ink)]',
  coral: 'bg-[#FAF5EC] text-[#865E16]',
  green: 'bg-[#F4F4ED] text-[#557153]',
  red: 'bg-[#FAF5EC] text-[#9A3B3B]',
  gray: 'bg-white border border-[var(--color-cor-border)] text-[var(--color-cor-ink-light)]',
  violet: 'bg-[#F4F4ED] text-[var(--color-cor-ink)]',
  yellow: 'bg-[#FAF5EC] text-[#865E16]',
  pink: 'bg-[#FAF5EC] text-[var(--color-cor-ink)]',
};

export default function Badge({ variant = 'default', children, className = '' }: BadgeProps) {
  return (
    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${variantClasses[variant]} ${className}`}>
      {children}
    </span>
  );
}
