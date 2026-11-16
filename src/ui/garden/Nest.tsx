import { useState, type ReactNode } from 'react'
/**
 * The twiggy nest the active Egg rests in. The Egg (`children`) sits between
 * the back of the nest and its front rim; tapping it plays a happy wiggle.
 * Laid out for the Egg drawn 176px tall (EggView).
 */
export function Nest({ children, hasEgg }: { children: ReactNode; hasEgg: boolean }) {
  const [wiggling, setWiggling] = useState(false)

  return (
    <div className="nest">
      <svg className="nest__back" viewBox="0 0 220 70" aria-hidden="true">
        <ellipse cx="110" cy="40" rx="104" ry="28" fill="#9a6a3c" />
        <ellipse cx="110" cy="34" rx="86" ry="18" fill="#6e4524" />
      </svg>
      {hasEgg ? (
        <button
          type="button"
          className={`nest__egg${wiggling ? ' nest__egg--wiggle' : ''}`}
          aria-label="Wiggle the Egg"
          onClick={() => setWiggling(true)}
          onAnimationEnd={(e) => {
            if (e.animationName === 'egg-wiggle') setWiggling(false)
          }}
        >
          {children}
        </button>
      ) : (
        <div className="nest__egg">{children}</div>
      )}
      <svg className="nest__front" viewBox="0 0 220 64" aria-hidden="true">
        <path d="M6 14 C30 58 190 58 214 14 C200 40 20 40 6 14 Z" fill="#7a4d29" />
        <path d="M4 12 C26 64 194 64 216 12 L210 30 C186 66 34 66 10 30 Z" fill="#b07a45" />
        <g stroke="#d7a56a" strokeWidth="3" strokeLinecap="round" fill="none">
          <path d="M18 28 Q60 50 104 44" />
          <path d="M116 46 Q160 48 202 26" />
          <path d="M40 46 Q90 60 150 52" />
          <path d="M30 22 L52 36" />
          <path d="M188 22 L166 38" />
        </g>
        <g stroke="#8a5a30" strokeWidth="2.5" strokeLinecap="round" fill="none">
          <path d="M70 40 Q110 30 150 40" />
          <path d="M60 54 Q110 64 160 54" />
        </g>
      </svg>
    </div>
  )
}
