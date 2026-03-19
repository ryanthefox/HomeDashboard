import * as React from 'react'
import { cn } from '@/lib/utils'

interface SliderProps {
  value: number
  min?: number
  max?: number
  step?: number
  disabled?: boolean
  className?: string
  onValueChange?: (value: number) => void
  onValueCommit?: (value: number) => void
}

const Slider = React.forwardRef<HTMLInputElement, SliderProps>(
  ({ value, min = 0, max = 100, step = 1, disabled, className, onValueChange, onValueCommit }, ref) => {
    const pct = ((value - min) / (max - min)) * 100

    return (
      <div className={cn('relative flex w-full touch-none select-none items-center', className)}>
        <div className="relative h-1.5 w-full grow overflow-hidden rounded-full bg-secondary">
          <div className="absolute h-full bg-primary" style={{ width: `${pct}%` }} />
        </div>
        <input
          ref={ref}
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          disabled={disabled}
          onChange={e => onValueChange?.(Number(e.target.value))}
          onMouseUp={e => onValueCommit?.(Number((e.target as HTMLInputElement).value))}
          onTouchEnd={e => onValueCommit?.(Number((e.target as HTMLInputElement).value))}
          className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
        />
      </div>
    )
  }
)
Slider.displayName = 'Slider'

export { Slider }
