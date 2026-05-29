import * as React from "react"
import { Check } from "lucide-react"
import { cn } from "@/lib/utils"

function Checkbox({
  className,
  checked,
  onCheckedChange,
  ...props
}: {
  checked?: boolean
  onCheckedChange?: (checked: boolean) => void
} & Omit<React.ComponentProps<"button">, "checked" | "onChange">) {
  return (
    <button
      role="checkbox"
      aria-checked={checked}
      data-state={checked ? "checked" : "unchecked"}
      onClick={() => onCheckedChange?.(!checked)}
      className={cn(
        "peer size-4 shrink-0 rounded-[4px] border border-input bg-background ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground",
        className
      )}
      {...props}
    >
      {checked && <Check className="size-3.5" strokeWidth={3} />}
    </button>
  )
}

export { Checkbox }
