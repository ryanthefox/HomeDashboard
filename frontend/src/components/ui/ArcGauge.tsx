interface ArcGaugeProps {
  value: number
  max?: number
  label: string
  sublabel?: string
  color?: string
  size?: 'sm' | 'home' | 'md' | 'xl'
}

// ly/vy/sy = y-offsets from cy for label / value / sublabel
const SIZES = {
  sm:   { vb:'0 0 70 70',   r:26, cx:35, cy:38, sw:6,  fl:7,  fv:10, fs:6,  ly:-5,  vy:8,  sy:18, cls:'w-[70px] h-[70px]' },
  home: { vb:'0 0 90 90',   r:33, cx:45, cy:50, sw:7,  fl:9,  fv:12, fs:7.5,ly:-6,  vy:9,  sy:20, cls:'w-[90px] h-[90px]' },
  md:   { vb:'0 0 100 100', r:38, cx:50, cy:54, sw:8,  fl:10, fv:15, fs:8.5,ly:-6,  vy:10, sy:22, cls:'w-32 h-32' },
  xl:   { vb:'0 0 160 160', r:60, cx:80, cy:87, sw:12, fl:15, fv:26, fs:13, ly:-14, vy:8,  sy:32, cls:'w-40 h-40' },
}

export function ArcGauge({ value, max = 100, label, sublabel, color = '#38bdf8', size = 'md' }: ArcGaugeProps) {
  const s = SIZES[size]
  const C   = 2 * Math.PI * s.r
  const trk = C * 0.75
  const gap = C - trk
  const pct = Math.min(Math.max(value / max, 0), 1)
  const fil = trk * pct

  return (
    <div className="flex flex-col items-center">
      <svg viewBox={s.vb} className={s.cls}>
        <circle cx={s.cx} cy={s.cy} r={s.r}
          fill="none" stroke="#1e293b" strokeWidth={s.sw} strokeLinecap="round"
          strokeDasharray={`${trk} ${gap}`}
          transform={`rotate(135 ${s.cx} ${s.cy})`}
        />
        {pct > 0.005 && (
          <circle cx={s.cx} cy={s.cy} r={s.r}
            fill="none" stroke={color} strokeWidth={s.sw} strokeLinecap="round"
            strokeDasharray={`${fil} ${C - fil}`}
            transform={`rotate(135 ${s.cx} ${s.cy})`}
            style={{ filter: `drop-shadow(0 0 5px ${color}99)` }}
          />
        )}
        <text x={s.cx} y={s.cy + s.ly} textAnchor="middle"
          fill="#94a3b8" fontSize={s.fl} fontFamily="system-ui, sans-serif">{label}</text>
        <text x={s.cx} y={s.cy + s.vy} textAnchor="middle"
          fill="white" fontSize={s.fv} fontWeight="bold" fontFamily="system-ui, sans-serif">
          {Math.round(value)}%
        </text>
        {sublabel && (
          <text x={s.cx} y={s.cy + s.sy} textAnchor="middle"
            fill="#64748b" fontSize={s.fs} fontFamily="system-ui, sans-serif">{sublabel}</text>
        )}
      </svg>
    </div>
  )
}
