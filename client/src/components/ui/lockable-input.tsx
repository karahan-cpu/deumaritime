import * as React from "react"
import { Input } from "@/components/ui/input"
import { Lock, Unlock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export interface LockableInputProps extends React.ComponentProps<"input"> {
    // Optional controlled lock state
    isLocked?: boolean;
    onLockChange?: (locked: boolean) => void;
}

export const LockableInput = React.forwardRef<HTMLInputElement, LockableInputProps>(
    ({ className, disabled, isLocked: controlledIsLocked, onLockChange, ...props }, ref) => {
        const [internalIsLocked, setInternalIsLocked] = React.useState(false)

        const isLocked = controlledIsLocked !== undefined ? controlledIsLocked : internalIsLocked

        const toggleLock = (e: React.MouseEvent) => {
            e.preventDefault() // Prevent form submission
            if (onLockChange) {
                onLockChange(!isLocked)
            } else {
                setInternalIsLocked(!isLocked)
            }
        }

        return (
            <div className={cn("flex gap-2", className)}>
                <Input
                    ref={ref}
                    disabled={disabled || isLocked}
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
                    className={cn(isLocked && "bg-muted text-muted-foreground")}
                >
                    {isLocked ? (
                        <Lock className="h-4 w-4" />
                    ) : (
                        <Unlock className="h-4 w-4" />
                    )}
                </Button>
            </div>
        )
    }
)
LockableInput.displayName = "LockableInput"
