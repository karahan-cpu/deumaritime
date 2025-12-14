import * as React from "react"
import { Slider } from "@/components/ui/slider"
import { Input } from "@/components/ui/input"
import { Lock, Unlock } from "lucide-react" // Assuming lucide-react is available, consistent with other files
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface InputWithSliderProps extends React.ComponentProps<"input"> {
    min: number
    max: number
    step?: number
    value: number
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
    onSliderChange?: (value: number) => void
    className?: string
}

export function InputWithSlider({
    min,
    max,
    step = 1,
    value,
    onChange,
    onSliderChange,
    className,
    disabled,
    ...props
}: InputWithSliderProps) {
    const [isLocked, setIsLocked] = React.useState(false)

    const handleSliderChange = (values: number[]) => {
        if (isLocked || disabled) return
        const newValue = values[0]

        // Create a synthetic event to pass to the original onChange handler
        // This ensures compatibility with react-hook-form
        const syntheticEvent = {
            target: {
                value: newValue.toString(),
                name: props.name,
            }
        } as React.ChangeEvent<HTMLInputElement>

        onChange(syntheticEvent)
        onSliderChange?.(newValue)
    }

    const toggleLock = (e: React.MouseEvent) => {
        e.preventDefault() // Prevent form submission if inside a form
        setIsLocked(!isLocked)
    }

    const showValue = isNaN(value) ? 0 : value

    return (
        <div className={cn("space-y-3", className)}>
            <div className="flex gap-2">
                <Input
                    type="number"
                    value={value}
                    onChange={onChange}
                    disabled={disabled || isLocked}
                    min={min}
                    max={max}
                    step={step}
                    className="flex-1"
                    {...props}
                />
                <Button
                    variant="outline"
                    size="icon"
                    onClick={toggleLock}
                    type="button"
                    disabled={disabled}
                    title={isLocked ? "Unlock input" : "Lock input"}
                >
                    {isLocked ? (
                        <Lock className="h-4 w-4" />
                    ) : (
                        <Unlock className="h-4 w-4" />
                    )}
                </Button>
            </div>
            <Slider
                value={[showValue]}
                min={min}
                max={max}
                step={step}
                onValueChange={handleSliderChange}
                disabled={disabled || isLocked}
                className="pt-2"
            />
        </div>
    )
}
