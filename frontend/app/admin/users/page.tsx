"use client"

import { useEffect, useMemo, useState } from "react"
import { fetchAPI, getAssetUrl } from "@/lib/api"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
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
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Edit, Plus, Search, Trash2, Users } from "lucide-react"
import { toast } from "sonner"

type AdminUser = {
  id: number
  name?: string
  full_name?: string
  email: string
  role: "admin" | "client" | "crew"
  phone?: string | null
  avatar_url?: string | null
}

const roleColors: Record<AdminUser["role"], string> = {
  admin: "bg-slate-900 text-white border-slate-900",
  client: "bg-blue-100 text-blue-700 border-blue-200",
  crew: "bg-orange-100 text-orange-700 border-orange-200",
}

const emptyForm = {
  name: "",
  email: "",
  password: "",
  role: "client" as AdminUser["role"],
  phone: "",
}

export default function UsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [roleFilter, setRoleFilter] = useState("all")
  const [page, setPage] = useState(1)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<AdminUser | null>(null)
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState(emptyForm)

  // State for delete confirmation modal
  const [userToDelete, setUserToDelete] = useState<AdminUser | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  useEffect(() => {
    loadUsers()
  }, [])

  async function loadUsers() {
    setLoading(true)
    try {
      const res = await fetchAPI<any>("/auth/users")
      setUsers(res.data || [])
    } catch (err: any) {
      toast.error(err.message || "Gagal memuat user")
    } finally {
      setLoading(false)
    }
  }

  const filteredUsers = useMemo(() => {
    const query = searchQuery.toLowerCase()
    return users.filter((user) => {
      const name = user.name || user.full_name || ""
      const matchesSearch =
        name.toLowerCase().includes(query) ||
        user.email.toLowerCase().includes(query) ||
        String(user.phone || "").includes(query)
      const matchesRole = roleFilter === "all" || user.role === roleFilter
      return matchesSearch && matchesRole
    })
  }, [users, searchQuery, roleFilter])

  const pageSize = 10
  const pageCount = Math.max(1, Math.ceil(filteredUsers.length / pageSize))
  const pageUsers = filteredUsers.slice((page - 1) * pageSize, page * pageSize)

  function openCreateDialog() {
    setEditingUser(null)
    setFormData(emptyForm)
    setDialogOpen(true)
  }

  function openEditDialog(user: AdminUser) {
    setEditingUser(user)
    setFormData({
      name: user.name || user.full_name || "",
      email: user.email,
      password: "",
      role: user.role,
      phone: user.phone || "",
    })
    setDialogOpen(true)
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    setSaving(true)
    const toastId = toast.loading(editingUser ? "Memperbarui data user..." : "Membuat user baru...")
    try {
      const payload = {
        name: formData.name,
        email: formData.email,
        role: formData.role,
        phone: formData.phone,
        ...(formData.password ? { password: formData.password } : {}),
      }

      if (editingUser) {
        await fetchAPI(`/auth/users/${editingUser.id}`, {
          method: "PUT",
          body: JSON.stringify(payload),
        })
        toast.success("User berhasil diperbarui!", { id: toastId })
      } else {
        await fetchAPI("/auth/users", {
          method: "POST",
          body: JSON.stringify({ ...payload, password: formData.password }),
        })
        toast.success("User berhasil dibuat!", { id: toastId })
      }

      setDialogOpen(false)
      loadUsers()
    } catch (err: any) {
      toast.error(err.message || "Gagal menyimpan user", { id: toastId })
    } finally {
      setSaving(false)
    }
  }

  function confirmDelete(user: AdminUser) {
    setUserToDelete(user)
  }

  async function handleDelete() {
    if (!userToDelete) return
    setIsDeleting(true)
    const name = userToDelete.name || userToDelete.full_name || userToDelete.email
    const toastId = toast.loading(`Menghapus user ${name}...`)
    try {
      await fetchAPI(`/auth/users/${userToDelete.id}`, { method: "DELETE" })
      toast.success(`User ${name} berhasil dihapus!`, { id: toastId })
      loadUsers()
    } catch (err: any) {
      toast.error(err.message || "Gagal menghapus user", { id: toastId })
    } finally {
      setIsDeleting(false)
      setUserToDelete(null)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">User Management</h1>
          <p className="text-muted-foreground">Kelola akun admin, client, dan crew</p>
        </div>
        <Button onClick={openCreateDialog}>
          <Plus className="mr-2 h-4 w-4" />
          Tambah User
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle className="flex items-center gap-2 text-base">
              <Users className="h-5 w-5 text-primary" />
              {filteredUsers.length} User
            </CardTitle>
            <div className="flex flex-col gap-3 sm:flex-row">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Cari nama, email, telepon..."
                  value={searchQuery}
                  onChange={(event) => {
                    setSearchQuery(event.target.value)
                    setPage(1)
                  }}
                  className="pl-9 sm:w-72"
                />
              </div>
              <Select value={roleFilter} onValueChange={(value) => {
                setRoleFilter(value)
                setPage(1)
              }}>
                <SelectTrigger className="sm:w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Role</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="client">Client</SelectItem>
                  <SelectItem value="crew">Crew</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex h-48 items-center justify-center">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            </div>
          ) : pageUsers.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Users className="mb-4 h-12 w-12 text-muted-foreground" />
              <h3 className="text-lg font-medium">Tidak ada user</h3>
              <p className="text-muted-foreground">Ubah filter atau tambahkan user baru.</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Telepon</TableHead>
                      <TableHead className="w-28 text-right">Aksi</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pageUsers.map((user) => {
                      const name = user.name || user.full_name || "User"
                      return (
                        <TableRow key={user.id}>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <Avatar>
                                <AvatarImage src={getAssetUrl(user.avatar_url)} />
                                <AvatarFallback>{name.charAt(0).toUpperCase()}</AvatarFallback>
                              </Avatar>
                              <div>
                                <div className="font-medium">{name}</div>
                                <div className="text-sm text-muted-foreground">{user.email}</div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className={roleColors[user.role]}>
                              {user.role}
                            </Badge>
                          </TableCell>
                          <TableCell>{user.phone || "-"}</TableCell>
                          <TableCell>
                            <div className="flex justify-end gap-1">
                              <Button variant="ghost" size="icon" onClick={() => openEditDialog(user)}>
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="icon" className="text-destructive" onClick={() => confirmDelete(user)}>
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </div>
              <div className="mt-4 flex items-center justify-between">
                <p className="text-sm text-muted-foreground">Halaman {page} dari {pageCount}</p>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage((current) => Math.max(1, current - 1))}>Prev</Button>
                  <Button variant="outline" size="sm" disabled={page === pageCount} onClick={() => setPage((current) => Math.min(pageCount, current + 1))}>Next</Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingUser ? "Edit User" : "Tambah User"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Nama</Label>
              <Input id="name" value={formData.name} onChange={(event) => setFormData({ ...formData, name: event.target.value })} required />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={formData.email} onChange={(event) => setFormData({ ...formData, email: event.target.value })} required />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="password">{editingUser ? "Password Baru (opsional)" : "Password"}</Label>
              <Input id="password" type="password" minLength={8} value={formData.password} onChange={(event) => setFormData({ ...formData, password: event.target.value })} required={!editingUser} />
            </div>
            <div className="grid gap-2">
              <Label>Role</Label>
              <Select value={formData.role} onValueChange={(value) => setFormData({ ...formData, role: value as AdminUser["role"] })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="client">Client</SelectItem>
                  <SelectItem value="crew">Crew</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="phone">Telepon</Label>
              <Input id="phone" value={formData.phone} onChange={(event) => setFormData({ ...formData, phone: event.target.value })} />
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Batal</Button>
              <Button type="submit" disabled={saving}>{saving ? "Menyimpan..." : "Simpan"}</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Premium Delete Confirmation Modal */}
      <AlertDialog open={!!userToDelete} onOpenChange={(open) => !open && setUserToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus User?</AlertDialogTitle>
            <AlertDialogDescription>
              Tindakan ini tidak dapat dibatalkan. Akun <b>{userToDelete?.name || userToDelete?.full_name || userToDelete?.email}</b> akan dihapus secara permanen dari sistem.
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
