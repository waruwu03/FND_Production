"use client"

import { useState, useEffect } from "react"
import { fetchAPI } from "@/lib/api"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Plus, Search, MoreHorizontal, Calendar, MapPin, Eye, Edit, Trash2 } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import Link from "next/link"
import type { Event, EventStatus } from "@/lib/types"
import { Skeleton } from "@/components/ui/skeleton"
import { toast } from "sonner"

const statusColors: Record<EventStatus, string> = {
  pending: "bg-gray-100 text-gray-700 border-gray-300",
  survey: "bg-amber-100 text-amber-700 border-amber-300",
  deal: "bg-blue-100 text-blue-700 border-blue-300",
  running: "bg-orange-100 text-orange-700 border-orange-300",
  selesai: "bg-green-100 text-green-700 border-green-300",
  cancel: "bg-red-100 text-red-700 border-red-300",
}

const statusLabels: Record<EventStatus, string> = {
  pending: "Pending",
  survey: "Survey",
  deal: "Deal",
  running: "Running",
  selesai: "Selesai",
  cancel: "Cancel",
}

function getFirstImageUrl(images: any): string | null {
  try {
    if (!images) return null
    const parsed = typeof images === 'string' ? JSON.parse(images) : images
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed[0]
    }
  } catch {}
  return null
}

export default function EventsPage() {
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  
  // State for delete confirmation modal
  const [eventToDelete, setEventToDelete] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  useEffect(() => {
    fetchEvents()
  }, [statusFilter])

  async function fetchEvents() {
    setLoading(true)
    try {
      const endpoint = statusFilter !== "all" ? `/events?status=${statusFilter}` : '/events'
      const res = await fetchAPI(endpoint)
      
      if (res.success) {
        // Map backend snake_case to frontend expected format
        const mappedData = res.data.map((e: any) => ({
          ...e,
          event_type: e.type,
          total_price: e.total_amount,
          client: { full_name: e.client_name, phone: '' }
        }))
        setEvents(mappedData)
      } else {
        console.error("Error fetching events:", res.error)
      }
    } catch (error) {
      console.error("Error fetching events:", error)
    } finally {
      setLoading(false)
    }
  }

  function confirmDelete(id: string) {
    setEventToDelete(id)
  }

  async function handleDelete() {
    if (!eventToDelete) return
    setIsDeleting(true)
    const toastId = toast.loading("Menghapus event...")
    try {
      const res = await fetchAPI(`/events/${eventToDelete}`, { method: "DELETE" })
      if (res.success) {
        toast.success("Event berhasil dihapus secara permanen!", { id: toastId })
        fetchEvents()
      } else {
        toast.error(res.error || "Gagal menghapus event", { id: toastId })
      }
    } catch (error: any) {
      toast.error(error.message || "Terjadi kesalahan", { id: toastId })
    } finally {
      setIsDeleting(false)
      setEventToDelete(null)
    }
  }

  const filteredEvents = events.filter(
    (event) =>
      event.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      event.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (event.client?.full_name || "").toLowerCase().includes(searchQuery.toLowerCase())
  )

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(amount)
  }

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Events</h1>
          <p className="text-muted-foreground">Kelola semua event dan booking</p>
        </div>
        <Link href="/admin/events/new">
          <Button className="bg-primary hover:bg-primary/90">
            <Plus className="mr-2 h-4 w-4" />
            Tambah Event
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader className="pb-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Cari event, lokasi, client..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="survey">Survey</SelectItem>
                <SelectItem value="deal">Deal</SelectItem>
                <SelectItem value="running">Running</SelectItem>
                <SelectItem value="selesai">Selesai</SelectItem>
                <SelectItem value="cancel">Cancel</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          ) : filteredEvents.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Calendar className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium">Belum ada event</h3>
              <p className="text-muted-foreground mt-1">Mulai dengan menambahkan event baru</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nama Event</TableHead>
                    <TableHead>Client</TableHead>
                    <TableHead>Tanggal</TableHead>
                    <TableHead>Lokasi</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredEvents.map((event) => (
                    <TableRow key={event.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-md overflow-hidden bg-slate-100 flex-shrink-0 border flex items-center justify-center">
                            {getFirstImageUrl(event.reference_images) ? (
                              <img
                                src={getFirstImageUrl(event.reference_images)!}
                                alt={event.name}
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <Calendar className="h-5 w-5 text-muted-foreground/60" />
                            )}
                          </div>
                          <div>
                            <div className="font-medium">{event.name}</div>
                            <div className="text-sm text-muted-foreground">{event.event_type}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{event.client?.full_name || "-"}</TableCell>
                      <TableCell>{formatDate(event.event_date)}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <MapPin className="h-3 w-3 text-muted-foreground" />
                          <span className="text-sm">{event.location}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={statusColors[event.status]}>
                          {statusLabels[event.status]}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {formatCurrency(Number(event.total_price) || 0)}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem asChild>
                              <Link href={`/admin/events/${event.id}`}>
                                <Eye className="mr-2 h-4 w-4" />
                                Lihat Detail
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                              <Link href={`/admin/events/${event.id}/edit`}>
                                <Edit className="mr-2 h-4 w-4" />
                                Edit
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem className="text-destructive cursor-pointer" onClick={() => confirmDelete(event.id)}>
                              <Trash2 className="mr-2 h-4 w-4" />
                              Hapus
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Premium Delete Confirmation Modal */}
      <AlertDialog open={!!eventToDelete} onOpenChange={(open) => !open && setEventToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Apakah Anda yakin?</AlertDialogTitle>
            <AlertDialogDescription>
              Tindakan ini tidak dapat dibatalkan. Event yang dipilih akan dihapus secara permanen dari sistem beserta seluruh data terkait (jadwal crew, equipment, pembayaran, dll).
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Batal</AlertDialogCancel>
            <AlertDialogAction 
              onClick={(e) => {
                e.preventDefault();
                handleDelete();
              }}
              className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
              disabled={isDeleting}
            >
              {isDeleting ? "Menghapus..." : "Ya, Hapus Permanen"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
