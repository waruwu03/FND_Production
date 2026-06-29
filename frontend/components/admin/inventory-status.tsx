import Link from "next/link"
import Image from "next/image"
import { Equipment } from "@/lib/types"
import { getAssetUrl } from "@/lib/api"

interface InventoryStatusProps {
  equipment: Equipment[]
}

export function InventoryStatus({ equipment }: InventoryStatusProps) {
  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="font-semibold text-card-foreground">Inventory Status</h3>
        <Link
          href="/admin/inventory"
          className="text-sm text-primary hover:underline"
        >
          Lihat Semua
        </Link>
      </div>
      <div className="space-y-3">
        {equipment.map((item) => {
          const usedPercentage = ((item.total_quantity - item.available_quantity) / item.total_quantity) * 100
          return (
            <div key={item.id} className="flex items-center gap-3">
              <div className="relative h-8 w-8 flex-shrink-0 overflow-hidden rounded bg-muted">
                {item.image_url ? (
                  <Image
                    src={getAssetUrl(item.image_url) as string}
                    alt={item.name}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-xs text-muted-foreground">
                    -
                  </div>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between">
                  <span className="truncate text-sm text-card-foreground">
                    {item.name}
                  </span>
                  <span className="ml-2 text-xs text-muted-foreground">
                    {item.available_quantity} / {item.total_quantity} unit
                  </span>
                </div>
                <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-primary"
                    style={{ width: `${usedPercentage}%` }}
                  />
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
