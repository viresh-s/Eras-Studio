interface BadgeProps {
  variant?: 'default' | 'blue' | 'coral' | 'green' | 'red' | 'gray' | 'violet' | 'yellow' | 'pink';
  children: React.ReactNode;
  className?: string;
}

const variantClasses = {
  default: 'bg-gray-100 text-gray-700',
  blue: 'bg-blue-50 text-blue-700',
  coral: 'bg-orange-50 text-orange-700',
  green: 'bg-emerald-50 text-emerald-700',
  red: 'bg-red-50 text-red-700',
  gray: 'bg-gray-100 text-gray-500',
  violet: 'bg-violet-50 text-violet-700',
  yellow: 'bg-amber-50 text-amber-700',
  pink: 'bg-pink-50 text-pink-700',
};

export default function Badge({ variant = 'default', children, className = '' }: BadgeProps) {
  return (
    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${variantClasses[variant]} ${className}`}>
      {children}
    </span>
  );
}
