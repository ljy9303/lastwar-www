import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const gameBadgeVariants = cva(
  "inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default: "border-transparent bg-primary text-primary-foreground shadow hover:bg-primary/80",
        game: "border-transparent bg-game-primary text-game-primary-foreground shadow hover:bg-game-primary/80",
        "game-secondary": "border-transparent bg-game-secondary text-game-secondary-foreground hover:bg-game-secondary/80",
        "game-accent": "border-transparent bg-game-accent text-game-accent-foreground shadow hover:bg-game-accent/80",
        success: "border-transparent bg-game-success text-white shadow hover:bg-game-success/80",
        warning: "border-transparent bg-game-warning text-black shadow hover:bg-game-warning/80",
        danger: "border-transparent bg-game-danger text-white shadow hover:bg-game-danger/80",
        outline: "text-foreground border-border",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface GameBadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof gameBadgeVariants> {}

function GameBadge({ className, variant, ...props }: GameBadgeProps) {
  return (
    <div className={cn(gameBadgeVariants({ variant }), className)} {...props} />
  )
}

export { GameBadge, gameBadgeVariants }