import Link from "next/link"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Profile, CREW_AVAILABILITY_LABELS } from "@/lib/types"
import { getAssetUrl } from "@/lib/api"

interface CrewStatusProps {
  crew: Profile[]
}

export function CrewStatus({ crew }: CrewStatusProps) {
  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="font-semibold text-card-foreground">Crew Status</h3>
        <Link
          href="/admin/crew"
          className="text-sm text-primary hover:underline"
        >
          Lihat Semua
        </Link>
      </div>
      <div className="space-y-3">
        {crew.map((member) => (
          <div key={member.id} className="flex items-center gap-3">
            <Avatar className="h-8 w-8">
              <AvatarImage src={getAssetUrl(member.avatar_url) as string || undefined} />
              <AvatarFallback className="bg-primary/10 text-primary text-xs">
                {member.full_name.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-card-foreground">
                {member.full_name}
              </p>
              <p className="truncate text-xs text-muted-foreground">
                {member.position || "Crew"}
              </p>
            </div>
            <Badge
              variant="outline"
              className={
                member.availability === "tersedia"
                  ? "border-green-300 bg-green-50 text-green-700"
                  : "border-orange-300 bg-orange-50 text-orange-700"
              }
            >
              {CREW_AVAILABILITY_LABELS[member.availability || "tersedia"]}
            </Badge>
          </div>
        ))}
      </div>
    </div>
  )
}
