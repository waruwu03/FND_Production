import { cn } from "@/lib/utils"
import { LucideIcon } from "lucide-react"

interface StatsCardProps {
  title: string
  value: string | number
  subtitle?: string
  change?: {
    value: number
    label: string
    type: "increase" | "decrease"
  }
  icon: LucideIcon
  iconColor?: string
  iconBgColor?: string
}

export function StatsCard({
  title,
  value,
  subtitle,
  change,
  icon: Icon,
  iconColor = "text-primary",
  iconBgColor = "bg-primary/10",
}: StatsCardProps) {
  return (
    <div className="group relative overflow-hidden rounded-2xl border border-border/50 bg-gradient-to-b from-card to-muted/20 p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-md">
      {/* Decorative subtle background element */}
      <div 
        className={cn(
          "absolute -right-6 -top-6 h-32 w-32 rounded-full opacity-[0.08] blur-2xl transition-transform duration-500 group-hover:scale-150 group-hover:opacity-[0.15]", 
          iconBgColor.replace('/10', '')
        )} 
      />
      
      <div className="relative flex items-start justify-between">
        <div className="space-y-1.5">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <div className="flex items-baseline gap-2">
            <h3 className="text-3xl font-bold tracking-tight text-foreground">{value}</h3>
          </div>
          {change && (
            <p
              className={cn(
                "flex items-center gap-1 text-xs font-medium",
                change.type === "increase" ? "text-emerald-600" : "text-rose-600"
              )}
            >
              <span className={cn(
                "flex h-4 w-4 items-center justify-center rounded-full",
                change.type === "increase" ? "bg-emerald-100" : "bg-rose-100"
              )}>
                {change.type === "increase" ? "↑" : "↓"}
              </span>
              {change.value}% {change.label}
            </p>
          )}
          {subtitle && (
            <p className="text-xs text-muted-foreground/80 mt-1">{subtitle}</p>
          )}
        </div>
        <div className={cn("rounded-xl p-3 ring-1 ring-inset ring-foreground/5 shadow-sm transition-colors duration-300", iconBgColor)}>
          <Icon className={cn("h-6 w-6", iconColor)} />
        </div>
      </div>
    </div>
  )
}
