"use client"

import { useState, useEffect } from "react"
import { fetchAPI, getAssetUrl } from "@/lib/api"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Plus, Search, Users, User, Phone, Mail, Lock, Edit, Trash2, UserPlus } from "lucide-react"
import { toast } from "sonner"
import type { Profile, CrewAvailability } from "@/lib/types"

const positions = [
  "Operator Lighting",
  "Lighting Technician",
  "Lighting Operator",
  "Helper",
  "Rigger",
  "DMX Programmer",
  "Production Manager",
  "Technician",
  "Operator",
]

export default function CrewPage() {
  const [crew, setCrew] = useState<Profile[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [availabilityFilter, setAvailabilityFilter] = useState<string>("all")
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<Profile | null>(null)
  const [addError, setAddError] = useState("")
  const [addLoading, setAddLoading] = useState(false)

  // State for delete confirmation modal
  const [crewToDelete, setCrewToDelete] = useState<Profile | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const [formData, setFormData] = useState({
    full_name: "",
    phone: "",
    position: "",
    availability: "tersedia" as CrewAvailability,
  })

  const [addFormData, setAddFormData] = useState({
    name: "",
    email: "",
    password: "",
    role: "Lighting Technician",
    phone: "",
  })

  useEffect(() => {
    fetchCrew()
  }, [availabilityFilter])

  async function fetchCrew() {
    setLoading(true)
    try {
      const endpoint = availabilityFilter !== "all" ? `/crew?status=${availabilityFilter}` : '/crew'
      const res = await fetchAPI(endpoint)
      
      if (res.success) {
        const mappedData = res.data.map((c: any) => ({
          ...c,
          full_name: c.name,
          position: c.role,
          availability: c.status === 'available' ? 'tersedia' : c.status || 'tersedia'
        }))
        setCrew(mappedData)
      } else {
        console.error("Error fetching crew:", res.error)
      }
    } catch (error) {
      console.error("Error fetching crew:", error)
    } finally {
      setLoading(false)
    }
  }

  const filteredCrew = crew.filter(
    (member) =>
      member.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (member.position || "").toLowerCase().includes(searchQuery.toLowerCase())
  )

  async function handleEditSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (editingItem) {
      const toastId = toast.loading("Memperbarui data crew...")
      try {
        const payload = {
          name: formData.full_name,
          phone: formData.phone || null,
          role: formData.position,
          status: formData.availability,
        }
        
        const res = await fetchAPI(`/crew/${editingItem.id}`, {
          method: 'PUT',
          body: JSON.stringify(payload)
        })

        if (res.success) {
          toast.success("Data crew berhasil diperbarui!", { id: toastId })
          fetchCrew()
          closeEditDialog()
        }
      } catch (error: any) {
        console.error("Error updating crew:", error)
        toast.error(error.message || "Gagal memperbarui data crew", { id: toastId })
      }
    }
  }

  async function handleAddSubmit(e: React.FormEvent) {
    e.preventDefault()
    setAddLoading(true)
    setAddError("")
    const toastId = toast.loading("Mendaftarkan crew baru...")

    try {
      const res = await fetchAPI('/crew/register', {
        method: 'POST',
        body: JSON.stringify(addFormData)
      })

      if (res.success) {
        toast.success("Crew baru berhasil didaftarkan!", { id: toastId })
        fetchCrew()
        closeAddDialog()
      } else {
        toast.error(res.error || "Gagal menambah crew", { id: toastId })
        setAddError(res.error || "Gagal menambah crew")
      }
    } catch (error: any) {
      toast.error(error.message || "Gagal menambah crew", { id: toastId })
      setAddError(error.message || "Gagal menambah crew")
    } finally {
      setAddLoading(false)
    }
  }

  function confirmDelete(member: Profile) {
    setCrewToDelete(member)
  }

  async function handleDeleteCrew() {
    if (!crewToDelete) return
    setIsDeleting(true)
    const toastId = toast.loading(`Menghapus crew ${crewToDelete.full_name}...`)
    try {
      const res = await fetchAPI(`/crew/${crewToDelete.id}`, { method: 'DELETE' })
      if (res.success) {
        toast.success(`Crew ${crewToDelete.full_name} berhasil dihapus!`, { id: toastId })
        fetchCrew()
      }
    } catch (error: any) {
      toast.error(error.message || "Gagal menghapus crew", { id: toastId })
    } finally {
      setIsDeleting(false)
      setCrewToDelete(null)
    }
  }

  async function updateAvailability(id: string, availability: CrewAvailability) {
    try {
      const res = await fetchAPI(`/crew/${id}`, {
        method: 'PUT',
        body: JSON.stringify({ status: availability })
      })

      if (res.success) {
        fetchCrew()
      }
    } catch (error) {
      console.error("Error updating availability:", error)
    }
  }

  function openEditDialog(member: Profile) {
    setEditingItem(member)
    setFormData({
      full_name: member.full_name,
      phone: member.phone || "",
      position: member.position || "",
      availability: member.availability || "tersedia",
    })
    setIsEditDialogOpen(true)
  }

  function closeEditDialog() {
    setIsEditDialogOpen(false)
    setEditingItem(null)
    setFormData({
      full_name: "",
      phone: "",
      position: "",
      availability: "tersedia",
    })
  }

  function closeAddDialog() {
    setIsAddDialogOpen(false)
    setAddError("")
    setAddFormData({
      name: "",
      email: "",
      password: "",
      role: "Lighting Technician",
      phone: "",
    })
  }

  const availabilityColors: Record<CrewAvailability, string> = {
    tersedia: "bg-green-100 text-green-700 border-green-300",
    on_job: "bg-orange-100 text-orange-700 border-orange-300",
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Crew</h1>
          <p className="text-muted-foreground">Kelola tim dan operator</p>
        </div>

        {/* Add Crew Button */}
        <Button className="bg-primary gap-2" onClick={() => setIsAddDialogOpen(true)}>
          <UserPlus className="h-4 w-4" />
          Tambah Crew
        </Button>

        {/* Edit Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Crew</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="edit_full_name">Nama Lengkap *</Label>
                <Input
                  id="edit_full_name"
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit_phone">No. Telepon</Label>
                <Input
                  id="edit_phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit_position">Posisi *</Label>
                <Select
                  value={formData.position}
                  onValueChange={(value) => setFormData({ ...formData, position: value })}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih posisi" />
                  </SelectTrigger>
                  <SelectContent>
                    {positions.map((pos) => (
                      <SelectItem key={pos} value={pos}>
                        {pos}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit_availability">Status</Label>
                <Select
                  value={formData.availability}
                  onValueChange={(value) =>
                    setFormData({ ...formData, availability: value as CrewAvailability })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="tersedia">Tersedia</SelectItem>
                    <SelectItem value="on_job">On Job</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={closeEditDialog}>
                  Batal
                </Button>
                <Button type="submit" className="bg-primary">
                  Update
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* Add Crew Dialog */}
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <UserPlus className="h-5 w-5 text-primary" />
                Tambah Anggota Crew Baru
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleAddSubmit} className="space-y-4">
              {addError && (
                <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg">
                  {addError}
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="add_name">Nama Lengkap *</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="add_name"
                    placeholder="Nama crew"
                    value={addFormData.name}
                    onChange={(e) => setAddFormData({ ...addFormData, name: e.target.value })}
                    className="pl-9"
                    required
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="add_email">Email Login *</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="add_email"
                      type="email"
                      placeholder="crew@email.com"
                      value={addFormData.email}
                      onChange={(e) => setAddFormData({ ...addFormData, email: e.target.value })}
                      className="pl-9"
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="add_password">Password *</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="add_password"
                      type="password"
                      placeholder="Min 6 karakter"
                      value={addFormData.password}
                      onChange={(e) => setAddFormData({ ...addFormData, password: e.target.value })}
                      className="pl-9"
                      minLength={6}
                      required
                    />
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="add_role">Posisi *</Label>
                  <Select
                    value={addFormData.role}
                    onValueChange={(value) => setAddFormData({ ...addFormData, role: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih posisi" />
                    </SelectTrigger>
                    <SelectContent>
                      {positions.map((pos) => (
                        <SelectItem key={pos} value={pos}>
                          {pos}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="add_phone">No. Telepon</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="add_phone"
                      type="tel"
                      placeholder="0812..."
                      value={addFormData.phone}
                      onChange={(e) => setAddFormData({ ...addFormData, phone: e.target.value })}
                      className="pl-9"
                    />
                  </div>
                </div>
              </div>
              <div className="rounded-lg bg-blue-50 border border-blue-200 p-3">
                <p className="text-sm text-blue-700">
                  💡 Akun login akan otomatis dibuat. Crew dapat login menggunakan email dan password yang Anda tentukan.
                </p>
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={closeAddDialog}>
                  Batal
                </Button>
                <Button type="submit" className="bg-primary gap-2" disabled={addLoading}>
                  {addLoading ? (
                    <>
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      Menyimpan...
                    </>
                  ) : (
                    <>
                      <UserPlus className="h-4 w-4" />
                      Tambah Crew
                    </>
                  )}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Users className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{crew.length}</p>
                <p className="text-sm text-muted-foreground">Total Crew</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-green-100 flex items-center justify-center">
                <User className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {crew.filter((c) => c.availability === "tersedia").length}
                </p>
                <p className="text-sm text-muted-foreground">Tersedia</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-orange-100 flex items-center justify-center">
                <User className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {crew.filter((c) => c.availability === "on_job").length}
                </p>
                <p className="text-sm text-muted-foreground">On Job</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Cari crew..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={availabilityFilter} onValueChange={setAvailabilityFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Status</SelectItem>
                <SelectItem value="tersedia">Tersedia</SelectItem>
                <SelectItem value="on_job">On Job</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            </div>
          ) : filteredCrew.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Users className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium">Belum ada crew</h3>
              <p className="text-muted-foreground mt-1">
                Klik tombol &quot;Tambah Crew&quot; untuk menambahkan anggota baru
              </p>
              <Button className="mt-4 bg-primary gap-2" onClick={() => setIsAddDialogOpen(true)}>
                <UserPlus className="h-4 w-4" />
                Tambah Crew Pertama
              </Button>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filteredCrew.map((member) => (
                <Card key={member.id} className="relative overflow-hidden">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-12 w-12 border shadow-sm">
                          <AvatarImage src={getAssetUrl(member.avatar_url)} />
                          <AvatarFallback className="bg-primary/10 text-primary font-medium">
                            {member.full_name?.charAt(0)?.toUpperCase() || "C"}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <h3 className="font-medium">{member.full_name}</h3>
                          <p className="text-sm text-muted-foreground">{member.position}</p>
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => openEditDialog(member)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:text-destructive"
                          onClick={() => confirmDelete(member)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      {member.phone && (
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Phone className="h-3 w-3" />
                          {member.phone}
                        </div>
                      )}
                      <Badge
                        variant="outline"
                        className={availabilityColors[member.availability || "tersedia"]}
                      >
                        {member.availability === "on_job" ? "On Job" : "Tersedia"}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Premium Delete Confirmation Modal */}
      <AlertDialog open={!!crewToDelete} onOpenChange={(open) => !open && setCrewToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Crew?</AlertDialogTitle>
            <AlertDialogDescription>
              Tindakan ini tidak dapat dibatalkan. Anggota crew <b>{crewToDelete?.full_name}</b> akan dihapus secara permanen dari sistem.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Batal</AlertDialogCancel>
            <AlertDialogAction 
              onClick={(e) => {
                e.preventDefault();
                handleDeleteCrew();
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
