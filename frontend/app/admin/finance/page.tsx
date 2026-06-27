"use client"

import { useState, useEffect } from "react"
import { fetchAPI, getAssetUrl } from "@/lib/api"
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  Search,
  CheckCircle2,
  Clock,
  Eye,
  Image as ImageIcon,
} from "lucide-react"
import Link from "next/link"
import type { Payment, PaymentStatus } from "@/lib/types"
import { Skeleton } from "@/components/ui/skeleton"
import { AlertCircle } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

interface PaymentWithEvent extends Omit<Payment, 'event'> {
  event: {
    id: string
    name: string
    event_date?: string
    client: {
      full_name: string
    } | null
  }
}

export default function FinancePage() {
  const [payments, setPayments] = useState<PaymentWithEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [selectedPayment, setSelectedPayment] = useState<PaymentWithEvent | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  useEffect(() => {
    fetchPayments()
  }, [statusFilter])

  async function fetchPayments() {
    setLoading(true)
    setError(null)
    try {
      // Map frontend status filter to backend enum ('paid' | 'unpaid')
      let endpoint = '/payments'
      if (statusFilter === 'lunas') {
        endpoint += '?status=paid'
      } else if (statusFilter === 'belum_lunas') {
        endpoint += '?status=unpaid'
      }

      const res = await fetchAPI(endpoint)
      if (res.success) {
        const mappedData = res.data.map((p: any) => ({
          ...p,
          status: p.status === 'paid' ? 'lunas' : 'belum_lunas',
          event: {
            id: p.event_id,
            name: p.event_name,
            client: { full_name: p.client_name }
          }
        }))
        setPayments(mappedData)
      } else {
        setError(res.error || "Gagal memuat data pembayaran")
      }
    } catch (err: any) {
      if (err.message.includes("403") || err.message.includes("Forbidden")) {
        setError("Anda tidak memiliki akses ke data keuangan. Pastikan Anda masuk sebagai Admin.")
      } else {
        setError(err.message || "Terjadi kesalahan sistem")
      }
    } finally {
      setLoading(false)
    }
  }

  async function updatePaymentStatus(paymentId: string, status: PaymentStatus) {
    try {
      const backendStatus = status === "lunas" ? "paid" : "unpaid"
      const res = await fetchAPI(`/payments/${paymentId}`, {
        method: 'PUT',
        body: JSON.stringify({ status: backendStatus })
      })

      if (res.success) {
        fetchPayments()
        setIsDialogOpen(false)
      } else {
        console.error("Failed to update payment status:", res.error)
      }
    } catch (err) {
      console.error("Error updating payment status:", err)
    }
  }

  const filteredPayments = payments.filter(
    (payment) =>
      payment.event?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      payment.event?.client?.full_name.toLowerCase().includes(searchQuery.toLowerCase())
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

  // Calculate totals
  const totalRevenue = payments
    .filter((p) => p.status === "lunas")
    .reduce((sum, p) => sum + Number(p.amount), 0)

  const pendingPayments = payments
    .filter((p) => p.status === "belum_lunas")
    .reduce((sum, p) => sum + Number(p.amount), 0)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Finance</h1>
          <p className="text-muted-foreground">Kelola pembayaran dan keuangan</p>
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="grid gap-4 md:grid-cols-3">
        {loading ? (
          <>
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
          </>
        ) : (
          <>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-green-100 flex items-center justify-center">
                    <DollarSign className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Total Revenue</p>
                    <p className="text-xl font-bold">{formatCurrency(totalRevenue)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-amber-100 flex items-center justify-center">
                    <Clock className="h-5 w-5 text-amber-600" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Pending Payment</p>
                    <p className="text-xl font-bold">{formatCurrency(pendingPayments)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <TrendingUp className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Total Transaksi</p>
                    <p className="text-xl font-bold">{payments.length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      <Card>
        <CardHeader className="pb-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Cari event atau client..."
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
                <SelectItem value="lunas">Lunas</SelectItem>
                <SelectItem value="belum_lunas">Belum Lunas</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-2">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : filteredPayments.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <DollarSign className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium">Belum ada transaksi</h3>
              <p className="text-muted-foreground mt-1">
                Transaksi akan muncul setelah ada pembayaran
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Event</TableHead>
                    <TableHead>Client</TableHead>
                    <TableHead>Tipe</TableHead>
                    <TableHead>Tanggal Bayar</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Jumlah</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPayments.map((payment) => (
                    <TableRow key={payment.id}>
                      <TableCell>
                        <Link
                          href={`/admin/events/${payment.event?.id}`}
                          className="font-medium hover:text-primary"
                        >
                          {payment.event?.name}
                        </Link>
                      </TableCell>
                      <TableCell>{payment.event?.client?.full_name || "-"}</TableCell>
                      <TableCell>
                        {payment.payment_type === "dp"
                          ? `DP`
                          : "Pelunasan"}
                      </TableCell>
                      <TableCell>
                        {(payment as any).created_at ? formatDate((payment as any).created_at) : "-"}
                      </TableCell>
                      <TableCell>
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
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {formatCurrency(Number(payment.amount))}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setSelectedPayment(payment)
                            setIsDialogOpen(true)
                          }}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Detail Pembayaran</DialogTitle>
          </DialogHeader>
          {selectedPayment && (
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Event</span>
                  <span className="font-medium">{selectedPayment.event?.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Tipe</span>
                  <span className="font-medium">
                    {selectedPayment.payment_type === "dp"
                      ? `DP`
                      : "Pelunasan"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Jumlah</span>
                  <span className="font-medium text-primary">
                    {formatCurrency(Number(selectedPayment.amount))}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Metode</span>
                  <span className="font-medium">{selectedPayment.payment_method || "-"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Status</span>
                  <Badge
                    variant="outline"
                    className={
                      selectedPayment.status === "lunas"
                        ? "bg-green-100 text-green-700 border-green-300"
                        : "bg-amber-100 text-amber-700 border-amber-300"
                    }
                  >
                    {selectedPayment.status === "lunas" ? "Lunas" : "Belum Lunas"}
                  </Badge>
                </div>
              </div>

              {selectedPayment.proof_url && (
                <div className="space-y-2">
                  <Label>Bukti Transfer</Label>
                  <div className="border rounded-lg p-2">
                    <img
                      src={getAssetUrl(selectedPayment.proof_url)}
                      alt="Bukti Transfer"
                      className="w-full rounded"
                    />
                  </div>
                </div>
              )}

              <div className="flex gap-2">
                {selectedPayment.status === "belum_lunas" && (
                  <Button
                    className="flex-1 bg-green-600 hover:bg-green-700"
                    onClick={() => updatePaymentStatus(selectedPayment.id, "lunas")}
                  >
                    <CheckCircle2 className="mr-2 h-4 w-4" />
                    Konfirmasi Lunas
                  </Button>
                )}
                {selectedPayment.status === "lunas" && (
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => updatePaymentStatus(selectedPayment.id, "belum_lunas")}
                  >
                    Batalkan Konfirmasi
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
