import { useRef } from 'react'
import { useQuery } from '@tanstack/react-query'
import { motion } from 'motion/react'
import { Droplets, Wind, Sunrise, Sunset, CloudSun, Gauge } from 'lucide-react'
import { cn } from '@/lib/utils'
import { weatherApi, type WeatherData } from '@/lib/api'
import { AnimatedNumber, Skeleton } from '@/components/ui/motion'
import { WeatherFx, WeatherIllustration, WeatherIcon } from '@/components/weather/WeatherFx'
import { useContainerSize, TileHeader } from './shared'

const uvLabel = (uv: number) => uv <= 2 ? 'Laag' : uv <= 5 ? 'Matig' : uv <= 7 ? 'Hoog' : 'Zeer hoog'
const uvColor = (uv: number) => uv <= 2 ? '#4ade80' : uv <= 5 ? '#fbbf24' : uv <= 7 ? '#f97316' : '#ef4444'

export function MiniWeather() {
  const ref = useRef<HTMLDivElement>(null)
  const { h, w } = useContainerSize(ref)
  const { data } = useQuery<WeatherData>({
    queryKey: ['weather'], queryFn: weatherApi.getCurrent, staleTime: 10 * 60_000,
  })

  const big = h > 230
  const showIllustration = w > 220 && h > 160

  return (
    <div ref={ref} className="relative flex h-full flex-col overflow-hidden p-5">
      {data && <WeatherFx icon={data.icon} isDay={data.isDay} density="low" />}
      <TileHeader icon={<CloudSun />} title="Weer" />

      {!data ? (
        <div className="space-y-2"><Skeleton className="h-12 w-24" /><Skeleton className="h-4 w-32" /></div>
      ) : (
        <div className="relative z-10 flex min-h-0 flex-1 flex-col justify-between">
          <div className="flex min-h-0 flex-1 items-center justify-between gap-2">
            <div className="min-w-0">
              <p className={cn('font-semibold leading-none tracking-[-0.05em] text-fg', big ? 'text-7xl' : 'text-5xl')}>
                <AnimatedNumber value={Math.round(data.temperature)} /><span className="text-fg3 font-light">°</span>
              </p>
              <p className="mt-2 text-sm font-medium text-fg2">{data.condition}</p>
              {h > 200 && <p className="mt-0.5 text-xs text-fg3">Voelt als {Math.round(data.feelsLike)}°</p>}
            </div>
            {showIllustration && (
              <WeatherIllustration icon={data.icon} isDay={data.isDay} className={big ? 'h-28 w-28' : 'h-20 w-20'} />
            )}
          </div>

          {/* Upcoming hours strip */}
          {h > 330 && data.hourly.length > 0 && (
            <div className="my-3 flex justify-between gap-1">
              {data.hourly.slice(0, w > 320 ? 6 : 4).map((hr, i) => (
                <motion.div key={hr.time}
                  initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.15 + i * 0.04 }}
                  className="flex flex-col items-center gap-1 rounded-xl bg-card3 px-2 py-1.5">
                  <span className="text-[10px] text-fg3 tabular">{new Date(hr.time).getHours()}u</span>
                  <WeatherIcon icon={hr.icon} className="h-3.5 w-3.5" />
                  <span className="text-xs font-semibold text-fg tabular">{Math.round(hr.temperature)}°</span>
                </motion.div>
              ))}
            </div>
          )}

          {h > 260 && (
            <div className="mb-3 flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-fg3">
              {data.sunriseTime && (
                <span className="flex items-center gap-1.5"><Sunrise className="h-3.5 w-3.5 text-amber-400" />{data.sunriseTime}</span>
              )}
              {data.sunsetTime && (
                <span className="flex items-center gap-1.5"><Sunset className="h-3.5 w-3.5 text-orange-400" />{data.sunsetTime}</span>
              )}
              <span className="flex items-center gap-1.5">
                <Gauge className="h-3.5 w-3.5" />UV <span style={{ color: uvColor(data.uvIndex) }}>{uvLabel(data.uvIndex)}</span>
              </span>
            </div>
          )}

          <div className="flex shrink-0 gap-4 border-t border-subtle pt-3 text-xs text-fg2">
            <span className="flex items-center gap-1.5">
              <Droplets className="h-3.5 w-3.5 text-sky-400" /><AnimatedNumber value={Math.round(data.humidity)} suffix="%" />
            </span>
            <span className="flex items-center gap-1.5">
              <Wind className="h-3.5 w-3.5 text-fg3" /><AnimatedNumber value={Math.round(data.windSpeed)} suffix=" km/u" />
            </span>
          </div>
        </div>
      )}
    </div>
  )
}
