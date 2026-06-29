"use client"

import { use, useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { fetchAPI } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { ArrowLeft, Save, Image as ImageIcon } from "lucide-react"
import { toast } from "sonner"

const eventTypes = [
  "Wedding",
  "Concert",
  "Corporate Event",
  "Awarding Night",
  "Private Party",
  "Gala Dinner",
  "Festival",
  "Exhibition",
  "Conference",
  "Other",
]

const eventStatuses = ["pending", "survey", "deal", "running", "selesai", "cancel"]

export default function EditEventPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  
  const [existingImages, setExistingImages] = useState<string[]>([])
  const [newFiles, setNewFiles] = useState<File[]>([])
  const [newPreviews, setNewPreviews] = useState<string[]>([])

  const [formData, setFormData] = useState({
    name: "",
    type: "",
    eventDate: "",
    location: "",
    notes: "",
    status: "pending",
    totalAmount: "",
    dpAmount: "",
    discountPrice: "",
    logisticsPrice: "",
  })

  useEffect(() => {
    async function loadEvent() {
      setLoading(true)
      try {
        const res = await fetchAPI<any>(`/events/${id}`)
        const event = res.data
        setFormData({
          name: event.name || "",
          type: event.type || "",
          eventDate: String(event.event_date || "").slice(0, 10),
          location: event.location || "",
          notes: event.notes || "",
          status: event.status || "pending",
          totalAmount: String(event.total_amount || ""),
          dpAmount: String(event.dp_amount || ""),
          discountPrice: String(event.discount_price || ""),
          logisticsPrice: String(event.logistics_price || ""),
        })

        let parsedImages = []
        try {
          parsedImages = typeof event.reference_images === 'string'
            ? JSON.parse(event.reference_images)
            : (Array.isArray(event.reference_images) ? event.reference_images : [])
        } catch {
          parsedImages = []
        }
        setExistingImages(parsedImages)
      } catch (err: any) {
        toast.error(err.message || "Gagal memuat event")
      } finally {
        setLoading(false)
      }
    }

    loadEvent()
  }, [id])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const filesArray = Array.from(e.target.files)
      setNewFiles((prev) => [...prev, ...filesArray])

      const previews = filesArray.map((file) => URL.createObjectURL(file))
      setNewPreviews((prev) => [...prev, ...previews])
    }
  }

  const removeNewFile = (index: number) => {
    setNewFiles((prev) => prev.filter((_, i) => i !== index))
    setNewPreviews((prev) => {
      URL.revokeObjectURL(prev[index])
      return prev.filter((_, i) => i !== index)
    })
  }

  const removeExistingImage = (index: number) => {
    setExistingImages((prev) => prev.filter((_, i) => i !== index))
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    setSaving(true)
    const toastId = toast.loading("Menyimpan event...")
    try {
      // 1. Upload new files if any
      let uploadedImageUrls: string[] = []
      if (newFiles.length > 0) {
        const uploadData = new FormData()
        newFiles.forEach((file) => {
          uploadData.append("images", file)
        })
        const uploadRes = await fetchAPI<any>("/uploads/images", {
          method: "POST",
          body: uploadData,
        })
        if (uploadRes.success && Array.isArray(uploadRes.data)) {
          uploadedImageUrls = uploadRes.data.map((img: any) => img.url)
        }
      }

      // 2. Combine existing and new uploaded URLs
      const referenceImages = [...existingImages, ...uploadedImageUrls]

      await fetchAPI(`/events/${id}`, {
        method: "PUT",
        body: JSON.stringify({
          name: formData.name,
          type: formData.type,
          eventDate: formData.eventDate,
          location: formData.location,
          notes: formData.notes,
          status: formData.status,
          totalAmount: Number(formData.totalAmount || 0),
          dpAmount: Number(formData.dpAmount || 0),
          discountPrice: Number(formData.discountPrice || 0),
          logisticsPrice: Number(formData.logisticsPrice || 0),
          referenceImages,
          equipment: [],
          crew: [],
        }),
      })
      toast.success("Event berhasil diperbarui", { id: toastId })
      router.push(`/admin/events/${id}`)
    } catch (err: any) {
      toast.error(err.message || "Gagal menyimpan event", { id: toastId })
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href={`/admin/events/${id}`}>
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Edit Event</h1>
          <p className="text-muted-foreground">Perbarui detail booking dan status event</p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>Detail Event</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="name">Nama Event</Label>
              <Input id="name" value={formData.name} onChange={(event) => setFormData({ ...formData, name: event.target.value })} required />
            </div>
            <div className="grid gap-2">
              <Label>Jenis Event</Label>
              <Select value={formData.type} onValueChange={(value) => setFormData({ ...formData, type: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih jenis event" />
                </SelectTrigger>
                <SelectContent>
                  {eventTypes.map((type) => (
                    <SelectItem key={type} value={type}>{type}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="date">Tanggal</Label>
              <Input id="date" type="date" value={formData.eventDate} onChange={(event) => setFormData({ ...formData, eventDate: event.target.value })} required />
            </div>
            <div className="grid gap-2">
              <Label>Status</Label>
              <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {eventStatuses.map((status) => (
                    <SelectItem key={status} value={status}>{status}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2 md:col-span-2">
              <Label htmlFor="location">Lokasi</Label>
              <Input id="location" value={formData.location} onChange={(event) => setFormData({ ...formData, location: event.target.value })} required />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="total">Total Harga</Label>
              <Input id="total" type="number" value={formData.totalAmount} onChange={(event) => setFormData({ ...formData, totalAmount: event.target.value })} min={0} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="dp">DP</Label>
              <Input id="dp" type="number" value={formData.dpAmount} onChange={(event) => setFormData({ ...formData, dpAmount: event.target.value })} min={0} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="discount">Diskon / Potongan Harga</Label>
              <Input id="discount" type="number" value={formData.discountPrice} onChange={(event) => setFormData({ ...formData, discountPrice: event.target.value })} min={0} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="logistics">Biaya Logistik & Transport</Label>
              <Input id="logistics" type="number" value={formData.logisticsPrice} onChange={(event) => setFormData({ ...formData, logisticsPrice: event.target.value })} min={0} />
            </div>
            <div className="grid gap-2 md:col-span-2">
              <Label htmlFor="notes">Catatan</Label>
              <Textarea id="notes" value={formData.notes} onChange={(event) => setFormData({ ...formData, notes: event.target.value })} rows={4} />
            </div>

            {/* Images Edit Section */}
            <div className="grid gap-2 md:col-span-2 border-t pt-4 mt-2">
              <Label className="text-base font-semibold flex items-center gap-2">
                <ImageIcon className="h-5 w-5 text-primary" />
                Gambar Referensi
              </Label>
              
              {/* Existing Images */}
              {existingImages.length > 0 && (
                <div className="space-y-2 mt-2">
                  <span className="text-sm font-medium text-muted-foreground">Gambar Saat Ini:</span>
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
                    {existingImages.map((url, index) => (
                      <div key={index} className="relative group aspect-video rounded-lg overflow-hidden border bg-muted shadow-sm hover:shadow-md transition-all">
                        <img src={url} alt="Existing Reference" className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <button
                            type="button"
                            onClick={() => removeExistingImage(index)}
                            className="bg-red-600 hover:bg-red-700 text-white rounded-full p-2 transition-colors shadow-md transform scale-90 group-hover:scale-100 duration-300"
                            title="Hapus gambar"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Upload New Images */}
              <div className="space-y-2 mt-4">
                <span className="text-sm font-medium text-muted-foreground">Tambah Gambar Baru:</span>
                <div className="relative border-2 border-dashed border-muted-foreground/25 hover:border-primary/50 transition-colors rounded-lg p-6 flex flex-col items-center justify-center gap-2 bg-muted/20 cursor-pointer group">
                  <Input
                    id="reference_images"
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleFileChange}
                    className="absolute inset-0 opacity-0 cursor-pointer z-10"
                  />
                  <div className="p-3 rounded-full bg-primary/10 text-primary group-hover:scale-110 transition-transform duration-300">
                    <ImageIcon className="h-6 w-6" />
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-semibold text-foreground">Pilih file gambar</p>
                    <p className="text-xs text-muted-foreground mt-1">atau seret dan lepas di sini (Max. 8MB)</p>
                  </div>
                </div>
                
                {newPreviews.length > 0 && (
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 mt-2">
                    {newPreviews.map((url, index) => (
                      <div key={index} className="relative group aspect-video rounded-lg overflow-hidden border bg-muted shadow-sm hover:shadow-md transition-all">
                        <img src={url} alt="New Preview" className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <button
                            type="button"
                            onClick={() => removeNewFile(index)}
                            className="bg-red-600 hover:bg-red-700 text-white rounded-full p-2 transition-colors shadow-md transform scale-90 group-hover:scale-100 duration-300"
                            title="Hapus gambar"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <div className="flex justify-end gap-2 md:col-span-2 border-t pt-4 mt-4">
              <Link href={`/admin/events/${id}`}>
                <Button type="button" variant="outline">Batal</Button>
              </Link>
              <Button type="submit" disabled={saving} className="bg-primary">
                <Save className="mr-2 h-4 w-4" />
                {saving ? "Menyimpan..." : "Simpan Perubahan"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  )
}
