interface BadgeProps {
  variant?: 'yellow' | 'blue' | 'pink' | 'green' | 'red' | 'gray';
  children: React.ReactNode;
  className?: string;
}

const variantClasses = {
  yellow: 'bg-brand-yellow text-brand-black',
  blue: 'bg-brand-blue text-white',
  pink: 'bg-brand-pink text-brand-black',
  green: 'bg-brand-green text-brand-black',
  red: 'bg-brand-red text-white',
  gray: 'bg-brand-lightgray text-brand-black',
};

export default function Badge({ variant = 'yellow', children, className = '' }: BadgeProps) {
  return (
    <span className={`badge-brutal ${variantClasses[variant]} ${className}`}>
      {children}
    </span>
  );
}
