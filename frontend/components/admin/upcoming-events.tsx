import Image from "next/image"
import Link from "next/link"
import { Calendar, MapPin } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Event, EventStatus, EVENT_STATUS_LABELS } from "@/lib/types"
import { getAssetUrl } from "@/lib/api"

interface UpcomingEventsProps {
  events: Event[]
}

const STATUS_VARIANT: Record<EventStatus, "default" | "secondary" | "destructive" | "outline"> = {
  pending: "outline",
  survey: "secondary",
  deal: "default",
  running: "destructive",
  selesai: "default",
  cancel: "destructive",
}

const STATUS_CLASS: Record<EventStatus, string> = {
  pending: "border-gray-300 text-gray-600 bg-gray-50",
  survey: "border-amber-300 text-amber-700 bg-amber-50",
  deal: "border-blue-300 text-blue-700 bg-blue-50",
  running: "border-orange-300 text-orange-700 bg-orange-50",
  selesai: "border-green-300 text-green-700 bg-green-50",
  cancel: "border-red-300 text-red-700 bg-red-50",
}

export function UpcomingEvents({ events }: UpcomingEventsProps) {
  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="font-semibold text-card-foreground">Event Mendatang</h3>
        <Link
          href="/admin/events"
          className="text-sm text-primary hover:underline"
        >
          Lihat Semua
        </Link>
      </div>
      <div className="space-y-3">
        {events.map((event) => (
          <div
            key={event.id}
            className="flex items-center gap-3 rounded-lg border border-border p-3"
          >
            <div className="relative h-12 w-16 flex-shrink-0 overflow-hidden rounded-md bg-muted">
              {event.reference_images?.[0] ? (
                <Image
                  src={getAssetUrl(event.reference_images[0]) as string}
                  alt={event.name}
                  fill
                  className="object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-xs text-muted-foreground">
                  No img
                </div>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <h4 className="truncate font-medium text-card-foreground">
                {event.name}
              </h4>
              <div className="mt-0.5 flex items-center gap-3 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  {new Date(event.event_date).toLocaleDateString("id-ID", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                </span>
                <span className="flex items-center gap-1 truncate">
                  <MapPin className="h-3 w-3" />
                  {event.venue_name || event.location}
                </span>
              </div>
            </div>
            <Badge
              variant="outline"
              className={STATUS_CLASS[event.status]}
            >
              {EVENT_STATUS_LABELS[event.status]}
            </Badge>
          </div>
        ))}
      </div>
      <Button
        variant="outline"
        className="mt-4 w-full border-primary text-primary hover:bg-primary/10"
        asChild
      >
        <Link href="/admin/events">Lihat Semua Event</Link>
      </Button>
    </div>
  )
}
