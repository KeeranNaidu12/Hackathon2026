// Shared kawaii coffee illustrations as inline SVGs

export const CoffeeCup = ({ size = 80, className = '' }: { size?: number; className?: string }) => (
  <svg width={size} height={size} viewBox="0 0 100 100" fill="none" className={className}>
    {/* Steam */}
    <path d="M35 22 Q33 15 35 8 Q37 15 35 22" stroke="#c4956a" strokeWidth="2.5" strokeLinecap="round" fill="none" opacity="0.6"/>
    <path d="M50 20 Q48 12 50 5 Q52 12 50 20" stroke="#c4956a" strokeWidth="2.5" strokeLinecap="round" fill="none" opacity="0.6"/>
    <path d="M65 22 Q63 15 65 8 Q67 15 65 22" stroke="#c4956a" strokeWidth="2.5" strokeLinecap="round" fill="none" opacity="0.6"/>
    {/* Cup body */}
    <path d="M20 35 L25 78 Q25 82 30 82 L70 82 Q75 82 75 78 L80 35 Z" fill="#f5e6d3" stroke="#c4956a" strokeWidth="2"/>
    {/* Coffee surface */}
    <ellipse cx="50" cy="36" rx="30" ry="8" fill="#c4956a"/>
    <ellipse cx="50" cy="36" rx="28" ry="6.5" fill="#a0724a"/>
    {/* Latte art heart */}
    <path d="M44 34 Q44 31 47 32 Q50 29 53 32 Q56 31 56 34 Q56 38 50 42 Q44 38 44 34Z" fill="#d4a574" opacity="0.7"/>
    {/* Handle */}
    <path d="M78 45 Q92 45 92 58 Q92 71 78 71" stroke="#c4956a" strokeWidth="3.5" strokeLinecap="round" fill="none"/>
    {/* Saucer */}
    <ellipse cx="50" cy="85" rx="38" ry="6" fill="#e8d5c0" stroke="#c4956a" strokeWidth="1.5"/>
    {/* Kawaii face */}
    <circle cx="42" cy="52" r="3" fill="#8b5e3c"/>
    <circle cx="58" cy="52" r="3" fill="#8b5e3c"/>
    <path d="M44 62 Q50 67 56 62" stroke="#8b5e3c" strokeWidth="2" strokeLinecap="round" fill="none"/>
    {/* Blush */}
    <ellipse cx="38" cy="58" rx="4" ry="2.5" fill="#f4a5a5" opacity="0.6"/>
    <ellipse cx="62" cy="58" rx="4" ry="2.5" fill="#f4a5a5" opacity="0.6"/>
  </svg>
)

export const MatchaLatte = ({ size = 70, className = '' }: { size?: number; className?: string }) => (
  <svg width={size} height={size} viewBox="0 0 100 100" fill="none" className={className}>
    <path d="M22 30 L28 80 Q28 85 33 85 L67 85 Q72 85 72 80 L78 30 Z" fill="#f0f7ee" stroke="#7ab648" strokeWidth="2"/>
    <ellipse cx="50" cy="31" rx="28" ry="7" fill="#7ab648"/>
    <ellipse cx="50" cy="31" rx="25" ry="5.5" fill="#5a9a2a"/>
    <path d="M80 42 Q93 42 93 55 Q93 68 80 68" stroke="#7ab648" strokeWidth="3.5" strokeLinecap="round" fill="none"/>
    <ellipse cx="50" cy="88" rx="35" ry="5.5" fill="#d4e8c8" stroke="#7ab648" strokeWidth="1.5"/>
    <circle cx="43" cy="50" r="3" fill="#3d6b1f"/>
    <circle cx="57" cy="50" r="3" fill="#3d6b1f"/>
    <path d="M45 60 Q50 65 55 60" stroke="#3d6b1f" strokeWidth="2" strokeLinecap="round" fill="none"/>
    <ellipse cx="38" cy="56" rx="4" ry="2.5" fill="#f4a5a5" opacity="0.6"/>
    <ellipse cx="62" cy="56" rx="4" ry="2.5" fill="#f4a5a5" opacity="0.6"/>
  </svg>
)

export const Croissant = ({ size = 60, className = '' }: { size?: number; className?: string }) => (
  <svg width={size} height={size} viewBox="0 0 100 100" fill="none" className={className}>
    <path d="M15 65 Q20 30 50 25 Q80 30 85 65 Q70 80 50 78 Q30 80 15 65Z" fill="#f0c87a" stroke="#c49a2a" strokeWidth="2"/>
    <path d="M20 62 Q25 35 50 30 Q75 35 80 62" fill="#e8b84a" stroke="none"/>
    <path d="M25 58 Q30 38 50 34 Q70 38 75 58" fill="#f0c87a" stroke="none"/>
    <path d="M18 63 Q35 72 50 70 Q65 72 82 63" stroke="#c49a2a" strokeWidth="1.5" fill="none"/>
    <circle cx="42" cy="55" r="2.5" fill="#8b6914"/>
    <circle cx="58" cy="55" r="2.5" fill="#8b6914"/>
    <path d="M44 63 Q50 67 56 63" stroke="#8b6914" strokeWidth="1.5" strokeLinecap="round" fill="none"/>
    <ellipse cx="38" cy="59" rx="3.5" ry="2" fill="#f4a5a5" opacity="0.6"/>
    <ellipse cx="62" cy="59" rx="3.5" ry="2" fill="#f4a5a5" opacity="0.6"/>
  </svg>
)

export const StarSparkle = ({ size = 20, color = '#f4a5a5', className = '' }: { size?: number; color?: string; className?: string }) => (
  <svg width={size} height={size} viewBox="0 0 20 20" fill="none" className={className}>
    <path d="M10 2 L11.5 8.5 L18 10 L11.5 11.5 L10 18 L8.5 11.5 L2 10 L8.5 8.5 Z" fill={color}/>
  </svg>
)

export const BubbleDecor = ({ className = '' }: { className?: string }) => (
  <svg width="200" height="200" viewBox="0 0 200 200" fill="none" className={className}>
    <circle cx="40" cy="40" r="35" fill="#fde8d8" opacity="0.5"/>
    <circle cx="160" cy="60" r="25" fill="#e8f4d8" opacity="0.5"/>
    <circle cx="100" cy="160" r="30" fill="#fde8e8" opacity="0.5"/>
    <circle cx="170" cy="150" r="20" fill="#e8e4f8" opacity="0.4"/>
  </svg>
)

// Color palette tokens
export const theme = {
  cream: '#fdf6ec',
  creamDark: '#f5e9d6',
  brown: '#8b5e3c',
  brownLight: '#c4956a',
  brownDark: '#5c3d1e',
  matcha: '#7ab648',
  matchaDark: '#5a9a2a',
  matchaLight: '#d4e8c8',
  rose: '#f4a5a5',
  roseLight: '#fde8e8',
  lavender: '#c9b8f0',
  lavenderLight: '#ede8fb',
  gold: '#f0c87a',
  goldLight: '#fdf0d0',
  text: '#4a3728',
  textMuted: '#9b7e6a',
  textLight: '#c4a882',
  border: '#e8d5c0',
  white: '#fffdf9',
}