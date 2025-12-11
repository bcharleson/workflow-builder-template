export function AiAgentIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      height="24"
      viewBox="0 0 24 24"
      width="24"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Antenna */}
      <line
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="2"
        x1="12"
        x2="12"
        y1="6"
        y2="2"
      />
      <circle cx="12" cy="2" fill="#10b981" r="1.5" />
      {/* Robot head - rounded */}
      <rect
        fill="currentColor"
        height="14"
        rx="4"
        width="16"
        x="4"
        y="6"
      />
      {/* Face plate */}
      <rect
        fill="currentColor"
        height="10"
        opacity="0.3"
        rx="2"
        width="12"
        x="6"
        y="8"
      />
      {/* Left eye socket */}
      <rect fill="#1e293b" height="4" rx="1" width="4" x="7" y="10" />
      {/* Right eye socket */}
      <rect fill="#1e293b" height="4" rx="1" width="4" x="13" y="10" />
      {/* Left eye - glowing */}
      <circle cx="9" cy="12" fill="#22d3ee" r="1.5" />
      <circle cx="9.5" cy="11.5" fill="white" opacity="0.8" r="0.5" />
      {/* Right eye - glowing */}
      <circle cx="15" cy="12" fill="#22d3ee" r="1.5" />
      <circle cx="15.5" cy="11.5" fill="white" opacity="0.8" r="0.5" />
      {/* Mouth grille */}
      <rect fill="#1e293b" height="2" rx="1" width="6" x="9" y="16" />
      <line stroke="#22d3ee" strokeWidth="0.5" x1="10" x2="10" y1="16" y2="18" />
      <line stroke="#22d3ee" strokeWidth="0.5" x1="12" x2="12" y1="16" y2="18" />
      <line stroke="#22d3ee" strokeWidth="0.5" x1="14" x2="14" y1="16" y2="18" />
      {/* Ear pieces */}
      <rect fill="currentColor" height="6" rx="1" width="2" x="1" y="10" />
      <rect fill="currentColor" height="6" rx="1" width="2" x="21" y="10" />
    </svg>
  );
}

