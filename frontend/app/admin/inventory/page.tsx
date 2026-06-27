"use client"

import { useState, useEffect } from "react"
import { fetchAPI, getAssetUrl } from "@/lib/api"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
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
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Plus, Search, Package, Edit, Trash2 } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import type { Equipment } from "@/lib/types"
import { toast } from "sonner"

const categories = ["Lighting", "Effects", "Display", "Rigging", "Control", "Audio", "Other"]

export default function InventoryPage() {
  const [equipment, setEquipment] = useState<Equipment[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [categoryFilter, setCategoryFilter] = useState<string>("all")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<Equipment | null>(null)
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    category: "",
    total_quantity: "",
    available_quantity: "",
  })
  const [imageFile, setImageFile] = useState<File | null>(null)
  
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [equipmentToDelete, setEquipmentToDelete] = useState<Equipment | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  useEffect(() => {
    fetchEquipment()
  }, [categoryFilter])

  async function fetchEquipment() {
    setLoading(true)
    try {
      const endpoint = categoryFilter !== "all" ? `/equipment?category=${categoryFilter}` : '/equipment'
      const res = await fetchAPI(endpoint)
      
      if (res.success) {
        const mappedData = res.data.map((item: any) => ({
          ...item,
          total_quantity: item.total_stock,
          available_quantity: item.available_stock,
        }))
        setEquipment(mappedData)
      } else {
        console.error("Error fetching equipment:", res.error)
      }
    } catch (error) {
      console.error("Error fetching equipment:", error)
    } finally {
      setLoading(false)
    }
  }

  const filteredEquipment = equipment.filter((item) =>
    item.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    
    const payload = {
      name: formData.name,
      description: formData.description || null,
      category: formData.category,
      totalStock: parseInt(formData.total_quantity),
      availableStock: parseInt(formData.available_quantity),
    }

    const toastId = toast.loading(editingItem ? "Memperbarui data peralatan..." : "Menyimpan peralatan baru...")

    try {
      let savedEquipmentId: string | number | null = null;
      
      if (editingItem) {
        const res = await fetchAPI(`/equipment/${editingItem.id}`, {
          method: 'PUT',
          body: JSON.stringify(payload)
        })

        if (res.success) {
          savedEquipmentId = editingItem.id;
        }
      } else {
        const res = await fetchAPI('/equipment', {
          method: 'POST',
          body: JSON.stringify(payload)
        })

        if (res.success && res.data && res.data.equipmentId) {
          savedEquipmentId = res.data.equipmentId;
        }
      }
      
      // Upload image if a new one was selected
      if (savedEquipmentId && imageFile) {
        toast.loading("Mengunggah gambar peralatan...", { id: toastId })
        const formData = new FormData()
        formData.append('image', imageFile)
        
        await fetchAPI(`/equipment/${savedEquipmentId}/image`, {
          method: 'POST',
          body: formData
        })
      }
      
      toast.success(editingItem ? "Peralatan berhasil diperbarui!" : "Peralatan berhasil ditambahkan!", { id: toastId })
      fetchEquipment()
      closeDialog()
    } catch (error: any) {
      console.error("Error saving equipment:", error)
      if (error.data && error.data.details) {
        console.error("Validation details:", error.data.details)
        const messages = error.data.details.map((d: any) => `${d.message}`).join(", ")
        toast.error("Validasi gagal: " + messages, { id: toastId })
      } else {
        toast.error(error.message || "Gagal menyimpan peralatan", { id: toastId })
      }
    }
  }

  function confirmDelete(item: Equipment) {
    setEquipmentToDelete(item)
    setDeleteDialogOpen(true)
  }

  async function handleDelete() {
    if (!equipmentToDelete) return
    setIsDeleting(true)
    const toastId = toast.loading("Menghapus peralatan...")
    try {
      const res = await fetchAPI(`/equipment/${equipmentToDelete.id}`, { method: 'DELETE' })
      if (res.success) {
        toast.success("Peralatan berhasil dihapus!", { id: toastId })
        fetchEquipment()
      }
    } catch (error: any) {
      toast.error(error.message || "Gagal menghapus peralatan", { id: toastId })
    } finally {
      setIsDeleting(false)
      setDeleteDialogOpen(false)
      setEquipmentToDelete(null)
    }
  }

  function openEditDialog(item: Equipment) {
    setEditingItem(item)
    setFormData({
      name: item.name,
      description: item.description || "",
      category: item.category || "",
      total_quantity: item.total_quantity.toString(),
      available_quantity: item.available_quantity.toString(),
    })
    setIsDialogOpen(true)
  }

  function closeDialog() {
    setIsDialogOpen(false)
    setEditingItem(null)
    setFormData({
      name: "",
      description: "",
      category: "",
      total_quantity: "",
      available_quantity: "",
    })
    setImageFile(null)
  }

  const getAvailabilityColor = (available: number, total: number) => {
    const percentage = (available / total) * 100
    if (percentage >= 70) return "bg-green-500"
    if (percentage >= 30) return "bg-amber-500"
    return "bg-red-500"
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Inventory</h1>
          <p className="text-muted-foreground">Kelola equipment dan alat</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-primary hover:bg-primary/90" onClick={() => closeDialog()}>
              <Plus className="mr-2 h-4 w-4" />
              Tambah Item
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingItem ? "Edit Item" : "Tambah Item Baru"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nama Item *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Deskripsi</Label>
                <Input
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="category">Kategori *</Label>
                <Select
                  value={formData.category}
                  onValueChange={(value) => setFormData({ ...formData, category: value })}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih kategori" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {cat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="image">Gambar Item (Opsional)</Label>
                <Input
                  id="image"
                  type="file"
                  accept="image/jpeg, image/png, image/webp"
                  onChange={(e) => setImageFile(e.target.files ? e.target.files[0] : null)}
                />
                {editingItem?.image_url && !imageFile && (
                  <p className="text-xs text-muted-foreground mt-1">Item ini sudah memiliki gambar.</p>
                )}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="total_quantity">Total Unit *</Label>
                  <Input
                    id="total_quantity"
                    type="number"
                    value={formData.total_quantity}
                    onChange={(e) => setFormData({ ...formData, total_quantity: e.target.value })}
                    required
                    min={0}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="available_quantity">Tersedia *</Label>
                  <Input
                    id="available_quantity"
                    type="number"
                    value={formData.available_quantity}
                    onChange={(e) => setFormData({ ...formData, available_quantity: e.target.value })}
                    required
                    min={0}
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={closeDialog}>
                  Batal
                </Button>
                <Button type="submit" className="bg-primary">
                  {editingItem ? "Update" : "Simpan"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader className="pb-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Cari equipment..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter Kategori" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Kategori</SelectItem>
                {categories.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <Skeleton className="h-32 w-full" />
              <Skeleton className="h-32 w-full" />
              <Skeleton className="h-32 w-full" />
              <Skeleton className="h-32 w-full" />
              <Skeleton className="h-32 w-full" />
              <Skeleton className="h-32 w-full" />
            </div>
          ) : filteredEquipment.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Package className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium">Belum ada equipment</h3>
              <p className="text-muted-foreground mt-1">Mulai dengan menambahkan item baru</p>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filteredEquipment.map((item) => (
                <Card key={item.id} className="relative overflow-hidden">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center overflow-hidden border border-border">
                          {item.image_url ? (
                            <img src={getAssetUrl(item.image_url) || `http://127.0.0.1:4000${item.image_url}`} alt={item.name} className="h-full w-full object-cover" />
                          ) : (
                            <Package className="h-6 w-6 text-primary" />
                          )}
                        </div>
                        <div>
                          <h3 className="font-medium">{item.name}</h3>
                          <Badge variant="outline" className="text-xs">
                            {item.category}
                          </Badge>
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => openEditDialog(item)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive"
                          onClick={() => confirmDelete(item)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Ketersediaan</span>
                        <span className="font-medium">
                          {item.available_quantity} / {item.total_quantity} unit
                        </span>
                      </div>
                      <Progress
                        value={(item.available_quantity / item.total_quantity) * 100}
                        className="h-2"
                      />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Peralatan</AlertDialogTitle>
            <AlertDialogDescription>
              Apakah Anda yakin ingin menghapus <strong>{equipmentToDelete?.name}</strong> secara permanen dari sistem inventaris? 
              Tindakan ini tidak dapat dibatalkan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Batal</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={(e) => {
                e.preventDefault()
                handleDelete()
              }}
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
