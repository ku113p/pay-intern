const COLORS = [
  'bg-primary-500', 'bg-rose-500', 'bg-emerald-500', 'bg-amber-500',
  'bg-cyan-500', 'bg-purple-500', 'bg-pink-500', 'bg-teal-500',
];

function hashCode(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

export function ProfileAvatar({ name, userId, size = 'sm' }: { name: string; userId: string; size?: 'sm' | 'md' | 'lg' }) {
  const color = COLORS[hashCode(userId) % COLORS.length];
  const initials = name
    .split(' ')
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  const sizeClasses = {
    sm: 'h-7 w-7 text-xs',
    md: 'h-10 w-10 text-sm',
    lg: 'h-14 w-14 text-lg',
  };

  return (
    <span className={`inline-flex items-center justify-center rounded-full text-white font-medium ${color} ${sizeClasses[size]}`}>
      {initials || '?'}
    </span>
  );
}
