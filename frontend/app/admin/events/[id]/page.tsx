"use client"

import { useState, useEffect, use } from "react"
import { fetchAPI, getAssetUrl } from "@/lib/api"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  ArrowLeft,
  Calendar,
  MapPin,
  User,
  Package,
  Users,
  CreditCard,
  Edit,
  CheckCircle2,
  Image as ImageIcon,
  Trash2,
  AlertCircle,
} from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import type { Event, EventStatus, Payment } from "@/lib/types"

const statusColors: Record<EventStatus, string> = {
  pending: "bg-gray-100 text-gray-700 border-gray-300",
  survey: "bg-amber-100 text-amber-700 border-amber-300",
  deal: "bg-blue-100 text-blue-700 border-blue-300",
  running: "bg-orange-100 text-orange-700 border-orange-300",
  selesai: "bg-green-100 text-green-700 border-green-300",
  cancel: "bg-red-100 text-red-700 border-red-300",
}

const statusOrder: EventStatus[] = ["pending", "survey", "deal", "running", "selesai"]

function parseReferenceImages(value: unknown): string[] {
  if (Array.isArray(value)) return value.filter(Boolean) as string[]
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value)
      return Array.isArray(parsed) ? parsed.filter(Boolean) : []
    } catch {
      return value ? [value] : []
    }
  }
  return []
}

export default function EventDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const [event, setEvent] = useState<Event | null>(null)
  const [eventEquipment, setEventEquipment] = useState<any[]>([])
  const [eventCrew, setEventCrew] = useState<any[]>([])
  const [payments, setPayments] = useState<Payment[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)

  const [allCrew, setAllCrew] = useState<any[]>([])
  const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false)
  const [assignFormData, setAssignFormData] = useState({ crewId: "", task: "" })
  const [assignLoading, setAssignLoading] = useState(false)

  // Payment State
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false)
  const [paymentFormData, setPaymentFormData] = useState({
    amount: "",
    paymentType: "dp",
    status: "belum_lunas",
  })
  const [paymentLoading, setPaymentLoading] = useState(false)

  useEffect(() => {
    fetchEventDetails()
    fetchAllCrew()
  }, [id])

  async function fetchAllCrew() {
    try {
      const res = await fetchAPI('/crew')
      if (res.success) {
        setAllCrew(res.data)
      }
    } catch (error) {
      console.error("Error fetching crew:", error)
    }
  }

  async function handleAssignCrew(e: React.FormEvent) {
    e.preventDefault()
    if (!assignFormData.crewId) {
      toast.error("Silakan pilih crew terlebih dahulu")
      return
    }
    setAssignLoading(true)
    const toastId = toast.loading("Menugaskan crew...")
    try {
      const res = await fetchAPI(`/crew/${id}/assign`, {
        method: 'POST',
        body: JSON.stringify({
          crewId: Number(assignFormData.crewId),
          task: assignFormData.task || 'Support'
        })
      })

      if (res.success) {
        toast.success("Crew berhasil ditugaskan!", { id: toastId })
        setIsAssignDialogOpen(false)
        setAssignFormData({ crewId: "", task: "" })
        fetchEventDetails()
        fetchAllCrew()
      } else {
        toast.error(res.error || "Gagal menugaskan crew", { id: toastId })
      }
    } catch (error: any) {
      console.error("Error assigning crew:", error)
      toast.error(error.message || "Gagal menugaskan crew", { id: toastId })
    } finally {
      setAssignLoading(false)
    }
  }

  async function handleUnassignCrew(crewId: number) {
    const toastId = toast.loading("Melepas tugas crew...")
    try {
      const res = await fetchAPI(`/crew/${id}/assign/${crewId}`, {
        method: 'DELETE'
      })

      if (res.success) {
        toast.success("Tugas crew berhasil dilepas!", { id: toastId })
        fetchEventDetails()
        fetchAllCrew()
      } else {
        toast.error(res.error || "Gagal melepas tugas crew", { id: toastId })
      }
    } catch (error: any) {
      console.error("Error unassigning crew:", error)
      toast.error(error.message || "Gagal melepas tugas crew", { id: toastId })
    }
  }

  async function handleCreatePayment(e: React.FormEvent) {
    e.preventDefault()
    setPaymentLoading(true)
    const toastId = toast.loading("Membuat tagihan pembayaran...")
    try {
      const res = await fetchAPI('/payments', {
        method: 'POST',
        body: JSON.stringify({
          eventId: Number(id),
          amount: Number(paymentFormData.amount),
          paymentType: paymentFormData.paymentType,
          status: paymentFormData.status === "lunas" ? "paid" : "unpaid"
        })
      })

      if (res.success) {
        toast.success("Tagihan berhasil dibuat!", { id: toastId })
        setIsPaymentDialogOpen(false)
        setPaymentFormData({ amount: "", paymentType: "dp", status: "belum_lunas" })
        fetchEventDetails()
      } else {
        toast.error(res.error || "Gagal membuat tagihan", { id: toastId })
      }
    } catch (error: any) {
      console.error("Error creating payment:", error)
      toast.error(error.message || "Gagal membuat tagihan", { id: toastId })
    } finally {
      setPaymentLoading(false)
    }
  }

  async function fetchEventDetails() {
    setLoading(true)
    setLoadError(null)
    try {
      const res = await fetchAPI(`/events/${id}`)
      if (res.success) {
        const e = res.data
        setEvent({
          ...e,
          event_type: e.type,
          total_price: e.total_amount,
          client: { full_name: e.client_name, phone: e.client_phone || "-" }
        } as any)

        setEventEquipment(e.equipment?.map((eq: any) => ({
          id: eq.id,
          quantity: eq.quantity,
          equipment: { name: eq.name, category: 'Equipment' }
        })) || [])

        setEventCrew(e.crew?.map((c: any) => ({
          id: c.id,
          role: c.task || c.role,
          crew: { full_name: c.name, position: c.role }
        })) || [])

        setPayments((e.payments || []).map((payment: any) => ({
          ...payment,
          status: payment.status === "paid" ? "lunas" : "belum_lunas",
        })))
      } else {
        const errMsg = res.error || "Gagal memuat detail event"
        console.error("fetchEventDetails API error:", errMsg)
        setLoadError(errMsg)
        toast.error(errMsg)
      }
    } catch (error: any) {
      const errMsg = error?.message || "Gagal terhubung ke server"
      console.error("Error fetching event details:", error)
      setLoadError(errMsg)
      toast.error(errMsg)
    }
    setLoading(false)
  }

  async function updateStatus(newStatus: EventStatus) {
    try {
      const res = await fetchAPI(`/events/${id}/status`, {
        method: 'PUT',
        body: JSON.stringify({ status: newStatus })
      })
      if (res.success) {
        setEvent((prev) => (prev ? { ...prev, status: newStatus } : null))
        toast.success("Status event berhasil diperbarui")
      } else {
        toast.error(res.error || "Gagal memperbarui status")
      }
    } catch (error) {
      console.error("Error updating status:", error)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(amount)
  }

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("id-ID", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    )
  }

  if (loadError) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <AlertCircle className="h-12 w-12 text-destructive" />
        <div className="text-center">
          <h2 className="text-xl font-semibold text-destructive">Gagal Memuat Event</h2>
          <p className="text-muted-foreground mt-1 max-w-md">{loadError}</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={fetchEventDetails}>Coba Lagi</Button>
          <Link href="/admin/events">
            <Button variant="outline">Kembali ke Events</Button>
          </Link>
        </div>
      </div>
    )
  }

  if (!event) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold">Event tidak ditemukan</h2>
        <Link href="/admin/events">
          <Button className="mt-4">Kembali ke Events</Button>
        </Link>
      </div>
    )
  }

  const currentStatusIndex = statusOrder.indexOf(event.status)
  const documentationImages = parseReferenceImages((event as any).reference_images)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/admin/events">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-semibold text-foreground">{event.name}</h1>
            <p className="text-muted-foreground">{event.event_type}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className={statusColors[event.status]}>
            {event.status.charAt(0).toUpperCase() + event.status.slice(1)}
          </Badge>
          <Link href={`/admin/events/${id}/edit`}>
            <Button variant="outline">
              <Edit className="mr-2 h-4 w-4" />
              Edit
            </Button>
          </Link>
        </div>
      </div>

      {/* Status Progress */}
      <Card>
        <CardHeader>
          <CardTitle>Status Event</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between mb-4">
            {statusOrder.map((status, index) => (
              <div key={status} className="flex flex-col items-center flex-1">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    index <= currentStatusIndex
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {index < currentStatusIndex ? (
                    <CheckCircle2 className="h-5 w-5" />
                  ) : (
                    <span className="text-sm font-medium">{index + 1}</span>
                  )}
                </div>
                <span
                  className={`text-xs mt-2 capitalize ${
                    index <= currentStatusIndex ? "text-foreground font-medium" : "text-muted-foreground"
                  }`}
                >
                  {status}
                </span>
              </div>
            ))}
          </div>
          <div className="flex justify-end">
            <Select value={event.status} onValueChange={(v) => updateStatus(v as EventStatus)}>
              <SelectTrigger className="w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {statusOrder.map((status) => (
                  <SelectItem key={status} value={status}>
                    {status.charAt(0).toUpperCase() + status.slice(1)}
                  </SelectItem>
                ))}
                <SelectItem value="cancel">Cancel</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="info" className="space-y-4">
        <TabsList>
          <TabsTrigger value="info">Info</TabsTrigger>
          <TabsTrigger value="equipment">Equipment</TabsTrigger>
          <TabsTrigger value="crew">Crew ({eventCrew.length})</TabsTrigger>
          <TabsTrigger value="documentation">Dokumentasi</TabsTrigger>
          <TabsTrigger value="payment">Payment</TabsTrigger>
        </TabsList>

        <TabsContent value="info" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Calendar className="h-4 w-4 text-primary" />
                  Detail Event
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Tanggal</span>
                  <span className="font-medium">{formatDate(event.event_date)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Tipe</span>
                  <span className="font-medium">{event.event_type || "-"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total</span>
                  <span className="font-medium text-primary">
                    {formatCurrency(Number(event.total_price) || 0)}
                  </span>
                </div>
                {(event as any).notes && (
                  <div className="pt-2 border-t">
                    <span className="text-muted-foreground text-sm">Catatan:</span>
                    <p className="text-sm mt-1">{(event as any).notes}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <MapPin className="h-4 w-4 text-primary" />
                  Lokasi
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Lokasi</span>
                  <span className="font-medium">{event.location}</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <User className="h-4 w-4 text-primary" />
                  Client
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Nama</span>
                  <span className="font-medium">{event.client?.full_name || "-"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Telepon</span>
                  <span className="font-medium">{event.client?.phone || "-"}</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Pembayaran</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Total</span>
                  <span className="font-medium">{formatCurrency(Number((event as any).total_amount) || 0)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">DP</span>
                  <span className="font-medium">{formatCurrency(Number((event as any).dp_amount) || 0)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Terbayar</span>
                  <span className="font-medium text-green-600">{formatCurrency(Number((event as any).paid_amount) || 0)}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="equipment">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5 text-primary" />
                Equipment ({eventEquipment.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {eventEquipment.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">Belum ada equipment ditambahkan</p>
              ) : (
                <div className="space-y-3">
                  {eventEquipment.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between rounded-lg border p-3"
                    >
                      <div>
                        <p className="font-medium">{item.equipment.name}</p>
                        <p className="text-sm text-muted-foreground">{item.equipment.category}</p>
                      </div>
                      <span className="font-medium">{item.quantity} Unit</span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ===== TAB CREW ===== */}
        <TabsContent value="crew">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" />
                Crew yang Ditugaskan ({eventCrew.length})
              </CardTitle>
              <Dialog open={isAssignDialogOpen} onOpenChange={setIsAssignDialogOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" className="bg-primary hover:bg-primary/90">
                    + Tugaskan Crew
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Tugaskan Crew ke Event Ini</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleAssignCrew} className="space-y-4 pt-2">
                    <div className="space-y-2">
                      <Label htmlFor="crew-select">Pilih Crew *</Label>
                      <Select
                        value={assignFormData.crewId}
                        onValueChange={(value) => setAssignFormData({ ...assignFormData, crewId: value })}
                      >
                        <SelectTrigger id="crew-select">
                          <SelectValue placeholder="Pilih anggota crew..." />
                        </SelectTrigger>
                        <SelectContent>
                          {allCrew.length === 0 ? (
                            <SelectItem value="_empty" disabled>Tidak ada crew tersedia</SelectItem>
                          ) : (
                            allCrew
                              .filter(c => !eventCrew.some(ec => ec.id === c.id))
                              .map((c: any) => (
                                <SelectItem key={c.id} value={String(c.id)}>
                                  {c.name} — {c.role} ({c.status === 'available' ? '✅ Tersedia' : '🔴 On Job'})
                                </SelectItem>
                              ))
                          )}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="crew-task">Tugas / Peran dalam Event *</Label>
                      <Input
                        id="crew-task"
                        placeholder="Contoh: Setup Lighting, Operator DMX"
                        value={assignFormData.task}
                        onChange={(e) => setAssignFormData({ ...assignFormData, task: e.target.value })}
                        required
                      />
                    </div>
                    <div className="flex justify-end gap-2 pt-2">
                      <Button type="button" variant="outline" onClick={() => setIsAssignDialogOpen(false)}>
                        Batal
                      </Button>
                      <Button type="submit" className="bg-primary" disabled={assignLoading}>
                        {assignLoading ? "Memproses..." : "Tugaskan"}
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              {eventCrew.length === 0 ? (
                <div className="text-center py-10">
                  <Users className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3" />
                  <p className="text-muted-foreground">Belum ada crew yang ditugaskan</p>
                  <p className="text-sm text-muted-foreground mt-1">Klik tombol &quot;Tugaskan Crew&quot; di atas untuk menambahkan</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {eventCrew.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between rounded-lg border p-3 hover:bg-muted/30 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                          <User className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium">{item.crew?.full_name}</p>
                          <p className="text-sm text-muted-foreground">{item.role || item.crew?.position}</p>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive hover:text-destructive hover:bg-destructive/10 h-8 w-8"
                        onClick={() => handleUnassignCrew(item.id)}
                        title="Lepas tugas crew"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="documentation">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ImageIcon className="h-5 w-5 text-primary" />
                Dokumentasi ({documentationImages.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {documentationImages.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">Belum ada dokumentasi</p>
              ) : (
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {documentationImages.map((url, index) => (
                    <a
                      key={`${url}-${index}`}
                      href={getAssetUrl(url)}
                      target="_blank"
                      rel="noreferrer"
                      className="overflow-hidden rounded-lg border bg-muted"
                    >
                      <img
                        src={getAssetUrl(url)}
                        alt={`Dokumentasi event ${index + 1}`}
                        className="aspect-video w-full object-cover transition-transform hover:scale-105"
                      />
                    </a>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payment">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-primary" />
                Payment
              </CardTitle>
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">Total Keseluruhan</p>
                  <p className="text-xl font-bold text-primary">
                    {formatCurrency(Number(event.total_price) || 0)}
                  </p>
                </div>
                <Dialog open={isPaymentDialogOpen} onOpenChange={setIsPaymentDialogOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm" className="bg-primary hover:bg-primary/90">
                      + Buat Tagihan
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Buat Tagihan Pembayaran Baru</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleCreatePayment} className="space-y-4 pt-2">
                      <div className="space-y-2">
                        <Label htmlFor="payment-type">Jenis Tagihan *</Label>
                        <Select
                          value={paymentFormData.paymentType}
                          onValueChange={(value) => setPaymentFormData({ ...paymentFormData, paymentType: value })}
                        >
                          <SelectTrigger id="payment-type">
                            <SelectValue placeholder="Pilih jenis..." />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="dp">Uang Muka (DP)</SelectItem>
                            <SelectItem value="pelunasan">Pelunasan / Penuh</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="payment-amount">Nominal (Rp) *</Label>
                        <Input
                          id="payment-amount"
                          type="number"
                          placeholder="Contoh: 5000000"
                          value={paymentFormData.amount}
                          onChange={(e) => setPaymentFormData({ ...paymentFormData, amount: e.target.value })}
                          required
                          min={0}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="payment-status">Status Pembayaran</Label>
                        <Select
                          value={paymentFormData.status}
                          onValueChange={(value) => setPaymentFormData({ ...paymentFormData, status: value })}
                        >
                          <SelectTrigger id="payment-status">
                            <SelectValue placeholder="Pilih status..." />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="belum_lunas">Belum Dibayar</SelectItem>
                            <SelectItem value="lunas">Sudah Lunas</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="flex justify-end gap-2 pt-2">
                        <Button type="button" variant="outline" onClick={() => setIsPaymentDialogOpen(false)}>
                          Batal
                        </Button>
                        <Button type="submit" className="bg-primary" disabled={paymentLoading}>
                          {paymentLoading ? "Memproses..." : "Buat Tagihan"}
                        </Button>
                      </div>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              {payments.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">Belum ada pembayaran</p>
              ) : (
                <div className="space-y-3">
                  {payments.map((payment) => (
                    <div
                      key={payment.id}
                      className="flex items-center justify-between rounded-lg border p-3"
                    >
                      <div>
                        <p className="font-medium">
                          {payment.payment_type === "dp"
                            ? `DP`
                            : "Pelunasan"}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {(payment as any).created_at
                            ? new Date((payment as any).created_at).toLocaleDateString("id-ID")
                            : "Belum dibayar"}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">{formatCurrency(Number(payment.amount))}</p>
                        <div className="flex flex-col items-end gap-2 mt-1">
                          <Badge
                            variant="outline"
                            className={
                              payment.status === "lunas"
                                ? "bg-green-100 text-green-700 border-green-300"
                                : "bg-amber-100 text-amber-700 border-amber-300"
                            }
                          >
                            {payment.status === "lunas" ? "Lunas" : "Belum Lunas"}
                          </Badge>
                          {payment.proof_url && (
                            <Button
                              variant="link"
                              size="sm"
                              className="h-auto p-0 text-xs text-primary"
                              onClick={() => window.open(getAssetUrl(payment.proof_url), '_blank', 'noopener,noreferrer')}
                            >
                              Lihat Bukti
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
