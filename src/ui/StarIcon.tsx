export function StarIcon({ size = 48, filled = false }: { size?: number; filled?: boolean }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M12 2.5l2.9 6 6.6.8-4.9 4.6 1.3 6.5L12 17.2l-5.9 3.2 1.3-6.5-4.9-4.6 6.6-.8z"
        fill={filled ? '#ffd23f' : '#fff7d6'}
        stroke="#e0a800"
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
    </svg>
  )
}
