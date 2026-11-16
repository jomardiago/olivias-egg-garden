/**
 * The painted Garden behind everything: sky, smiling sun, drifting clouds,
 * a soft rainbow, rolling hills, grass and swaying flowers, with a couple of
 * butterflies. Purely decorative; nothing here is tappable.
 */
export function GardenScene() {
  return (
    <div className="scene" aria-hidden="true">
      <Rainbow />
      <Sun />
      <Cloud className="scene__cloud scene__cloud--1" />
      <Cloud className="scene__cloud scene__cloud--2" />
      <Cloud className="scene__cloud scene__cloud--3" />
      <Hills />
      <div className="scene__grass" />
      {FLOWERS.map((f, i) => (
        <Flower key={i} {...f} delay={-i * 0.7} />
      ))}
      <Butterfly className="scene__butterfly scene__butterfly--1" wing="#ffb3d9" />
      <Butterfly className="scene__butterfly scene__butterfly--2" wing="#b5e3ff" />
    </div>
  )
}

function Sun() {
  return (
    <svg className="scene__sun" viewBox="-60 -60 120 120">
      <g className="scene__sun-rays" fill="#ffe27a">
        {Array.from({ length: 12 }, (_, i) => (
          <path key={i} d="M-5 -42 L0 -56 L5 -42 Z" transform={`rotate(${i * 30})`} />
        ))}
      </g>
      <circle r="36" fill="#ffd23f" />
      <circle r="36" fill="url(#sun-glow)" />
      <circle cx="-12" cy="-6" r="4" fill="#7a4b12" />
      <circle cx="12" cy="-6" r="4" fill="#7a4b12" />
      <path d="M-13 9 Q0 21 13 9" stroke="#7a4b12" strokeWidth="4" fill="none" strokeLinecap="round" />
      <circle cx="-22" cy="7" r="6" fill="#ff9e7a" opacity="0.55" />
      <circle cx="22" cy="7" r="6" fill="#ff9e7a" opacity="0.55" />
      <defs>
        <radialGradient id="sun-glow" cx="0.35" cy="0.3" r="0.8">
          <stop offset="0" stopColor="#fff6c4" stopOpacity="0.9" />
          <stop offset="0.6" stopColor="#fff6c4" stopOpacity="0" />
        </radialGradient>
      </defs>
    </svg>
  )
}

function Cloud({ className }: { className: string }) {
  return (
    <svg className={className} viewBox="0 0 120 60">
      <path
        d="M18 52 C4 52 2 34 16 31 C14 16 34 10 42 20 C48 6 72 4 78 20 C92 12 110 22 104 36 C118 38 116 52 102 52 Z"
        fill="#fff"
      />
      <path d="M22 52 C40 46 84 46 102 52 Z" fill="#e6f4ff" />
    </svg>
  )
}

function Rainbow() {
  const bands = ['#ffb3b3', '#ffd9a3', '#fff1a6', '#c6f0b5', '#b5dcff', '#d7c4ff']
  return (
    <svg className="scene__rainbow" viewBox="0 0 400 200" preserveAspectRatio="xMidYMax meet">
      {bands.map((colour, i) => (
        <path
          key={colour}
          d={`M${20 + i * 14} 200 A${180 - i * 14} ${180 - i * 14} 0 0 1 ${380 - i * 14} 200`}
          stroke={colour}
          strokeWidth="14"
          fill="none"
        />
      ))}
    </svg>
  )
}

function Hills() {
  return (
    <svg className="scene__hills" viewBox="0 0 400 120" preserveAspectRatio="none">
      <path d="M0 70 C60 20 120 30 180 60 C240 90 300 20 400 50 L400 120 L0 120 Z" fill="#b9e8a4" />
      <path d="M0 95 C80 55 150 70 220 88 C290 106 340 60 400 80 L400 120 L0 120 Z" fill="#a4df8c" />
    </svg>
  )
}

type FlowerSpot = { left: string; top: string; petal: string; size: number }

/** Flowers dotted round the meadow's edges, kept clear of the nest in the middle. */
const FLOWERS: readonly FlowerSpot[] = [
  { left: '6%', top: '44%', petal: '#ff9ec4', size: 34 },
  { left: '88%', top: '41%', petal: '#ffd36e', size: 30 },
  { left: '18%', top: '60%', petal: '#c9b5ff', size: 26 },
  { left: '78%', top: '57%', petal: '#ff9e9e', size: 36 },
  { left: '4%', top: '75%', petal: '#ffd36e', size: 30 },
  { left: '92%', top: '72%', petal: '#9ad9ff', size: 28 },
  { left: '28%', top: '82%', petal: '#ffb3d9', size: 32 },
  { left: '66%', top: '86%', petal: '#c9b5ff', size: 30 },
  { left: '46%', top: '93%', petal: '#ff9ec4', size: 26 },
  { left: '12%', top: '90%', petal: '#ff9e9e', size: 24 },
  { left: '84%', top: '92%', petal: '#ffd36e', size: 26 },
]

function Flower({ left, top, petal, size, delay }: FlowerSpot & { delay: number }) {
  return (
    <svg
      className="scene__flower"
      style={{ left, top, width: size, height: size * 1.6, animationDelay: `${delay}s` }}
      viewBox="0 0 40 64"
    >
      <path d="M20 30 Q18 46 20 64" stroke="#5cae4c" strokeWidth="3" fill="none" />
      <path d="M20 50 Q10 42 6 46 Q12 54 20 52 Z" fill="#6cc25a" />
      {[0, 72, 144, 216, 288].map((a) => (
        <ellipse key={a} cx="20" cy="11" rx="7" ry="10" fill={petal} transform={`rotate(${a} 20 20)`} />
      ))}
      <circle cx="20" cy="20" r="6.5" fill="#ffe27a" stroke="#f0b93a" strokeWidth="1.5" />
    </svg>
  )
}

function Butterfly({ className, wing }: { className: string; wing: string }) {
  return (
    <svg className={className} viewBox="-20 -16 40 32">
      <g className="scene__wing">
        <path d="M0 0 C-6 -16 -20 -14 -16 -2 C-20 8 -8 12 0 2 Z" fill={wing} />
        <path d="M0 0 C6 -16 20 -14 16 -2 C20 8 8 12 0 2 Z" fill={wing} />
      </g>
      <ellipse rx="2" ry="8" fill="#5b4a7a" />
    </svg>
  )
}
