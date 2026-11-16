import { useId } from 'react'

/** A star slot over the Egg: a soft, dotted outline while empty, a shiny gold star once a Star is in it. */
export function SlotStar({ filled, justFilled = false, size = 30 }: { filled: boolean; justFilled?: boolean; size?: number }) {
  const gold = `slot-gold-${useId().replace(/:/g, '')}`
  const path = 'M12 2.2l2.95 6.1 6.7.85-4.95 4.65 1.3 6.6L12 17.15l-6 3.25 1.3-6.6-4.95-4.65 6.7-.85z'
  return (
    <svg className={justFilled ? 'slot-star slot-star--pop' : 'slot-star'} width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
      <defs>
        <linearGradient id={gold} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#fff07a" />
          <stop offset="0.55" stopColor="#ffd23f" />
          <stop offset="1" stopColor="#ffab1f" />
        </linearGradient>
      </defs>
      {filled ? (
        <>
          <path d={path} fill={`url(#${gold})`} stroke="#e09200" strokeWidth="1.3" strokeLinejoin="round" />
          <path d="M9.4 9.6 L11.4 9.3 L12 7.6" fill="none" stroke="#fff" strokeWidth="1.3" strokeLinecap="round" opacity="0.85" />
        </>
      ) : (
        <path d={path} fill="rgb(255 255 255 / 0.55)" stroke="#e8b730" strokeWidth="1.2" strokeDasharray="2 1.6" strokeLinejoin="round" />
      )}
    </svg>
  )
}
