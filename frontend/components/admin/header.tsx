"use client"

import { Bell, Calendar, Menu, Search, Check, Info, FileText, Wrench, Users, User, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { fetchAPI } from "@/lib/api"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import { ScrollArea } from "@/components/ui/scroll-area"
import { toast } from "sonner"

interface HeaderProps {
  title: string
  subtitle?: string
  onMenuClick?: () => void
}

export function AdminHeader({ title, subtitle, onMenuClick }: HeaderProps) {
  const router = useRouter()
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState<any>({ events: [], users: [], equipment: [], crew: [] })
  
  const [notifications, setNotifications] = useState<any[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [isNotifOpen, setIsNotifOpen] = useState(false)

  const today = new Date().toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  })

  // Keyboard shortcut Ctrl+K to open search
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        document.getElementById('global-search-input')?.focus()
      }
    }
    document.addEventListener("keydown", down)
    return () => document.removeEventListener("keydown", down)
  }, [])

  // Fetch notifications
  useEffect(() => {
    fetchNotifications()
  }, [])

  async function fetchNotifications() {
    try {
      const [notifs, unread] = await Promise.all([
        fetchAPI('/notifications'),
        fetchAPI('/notifications/unread-count')
      ])
      if (notifs.success) setNotifications(notifs.data)
      if (unread.success) setUnreadCount(unread.count)
    } catch (error) {
      console.error("Failed to fetch notifications")
    }
  }

  // Handle Search Input Change
  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      if (searchQuery.length >= 2) {
        try {
          const res = await fetchAPI(`/search?q=${searchQuery}`)
          if (res.success) {
            setSearchResults(res.data)
          }
        } catch (error) {
          console.error("Failed to search")
        }
      } else {
        setSearchResults({ events: [], users: [], equipment: [], crew: [] })
      }
    }, 300)

    return () => clearTimeout(delayDebounceFn)
  }, [searchQuery])

  async function markAsRead(id: number, link?: string) {
    try {
      await fetchAPI(`/notifications/read/${id}`, { method: 'PUT' })
      fetchNotifications()
      if (link) {
        setIsNotifOpen(false)
        router.push(link)
      }
    } catch (error) {
      toast.error("Gagal memperbarui notifikasi")
    }
  }

  async function markAllAsRead() {
    try {
      await fetchAPI('/notifications/read-all', { method: 'PUT' })
      fetchNotifications()
    } catch (error) {
      toast.error("Gagal menandai semua notifikasi")
    }
  }

  const navigateTo = (path: string) => {
    setSearchOpen(false)
    router.push(path)
  }

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border bg-background px-6">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          className="lg:hidden"
          onClick={onMenuClick}
        >
          <Menu className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-xl font-semibold text-foreground">{title}</h1>
          {subtitle && (
            <p className="text-sm text-muted-foreground">{subtitle}</p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-4">
        {/* Search */}
        <div className="relative hidden md:block z-50">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            id="global-search-input"
            placeholder="Cari event, klien, barang... (Ctrl+K)"
            className="w-80 pl-10 bg-muted/50"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => setSearchOpen(true)}
            onBlur={() => {
              setTimeout(() => setSearchOpen(false), 200)
            }}
          />
          
          {searchOpen && searchQuery.length >= 2 && (
            <div className="absolute top-full mt-2 w-full rounded-md border bg-popover text-popover-foreground shadow-md max-h-[400px] overflow-hidden">
              <Command shouldFilter={false}>
                <CommandList>
                  {searchResults.events?.length === 0 && searchResults.users?.length === 0 && searchResults.equipment?.length === 0 && searchResults.crew?.length === 0 && (
                    <CommandEmpty>Tidak ada hasil yang ditemukan.</CommandEmpty>
                  )}
                  
                  {searchResults.events?.length > 0 && (
                    <CommandGroup heading="Events">
                      {searchResults.events.map((event: any) => (
                        <CommandItem key={`event-${event.id}`} onSelect={() => navigateTo(`/admin/events`)}>
                          <Calendar className="mr-2 h-4 w-4" />
                          <span>{event.name}</span>
                          <span className="ml-auto text-xs text-muted-foreground">{event.status}</span>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  )}

                  {searchResults.users?.length > 0 && (
                    <CommandGroup heading="Klien">
                      {searchResults.users.map((user: any) => (
                        <CommandItem key={`user-${user.id}`} onSelect={() => navigateTo(`/admin/users`)}>
                          <User className="mr-2 h-4 w-4" />
                          <span>{user.name}</span>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  )}

                  {searchResults.equipment?.length > 0 && (
                    <CommandGroup heading="Inventory">
                      {searchResults.equipment.map((item: any) => (
                        <CommandItem key={`eq-${item.id}`} onSelect={() => navigateTo(`/admin/inventory`)}>
                          <Wrench className="mr-2 h-4 w-4" />
                          <span>{item.name}</span>
                          <span className="ml-auto text-xs text-muted-foreground">Stok: {item.available_stock}</span>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  )}

                  {searchResults.crew?.length > 0 && (
                    <CommandGroup heading="Crew">
                      {searchResults.crew.map((crew: any) => (
                        <CommandItem key={`crew-${crew.id}`} onSelect={() => navigateTo(`/admin/crew`)}>
                          <Users className="mr-2 h-4 w-4" />
                          <span>{crew.name}</span>
                          <span className="ml-auto text-xs text-muted-foreground">{crew.role}</span>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  )}
                </CommandList>
              </Command>
            </div>
          )}
        </div>

        {/* Notifications */}
        <Popover open={isNotifOpen} onOpenChange={setIsNotifOpen}>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="h-5 w-5" />
              {unreadCount > 0 && (
                <span className="absolute right-1 top-1 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[10px] font-medium text-destructive-foreground">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80 p-0" align="end">
            <div className="flex items-center justify-between px-4 py-2 border-b">
              <h4 className="font-semibold text-sm">Notifikasi</h4>
              {unreadCount > 0 && (
                <Button variant="ghost" className="text-xs h-auto py-1 text-primary" onClick={markAllAsRead}>
                  Tandai semua dibaca
                </Button>
              )}
            </div>
            <ScrollArea className="h-[300px]">
              {notifications.length === 0 ? (
                <div className="p-4 text-center text-sm text-muted-foreground">
                  Belum ada notifikasi
                </div>
              ) : (
                <div className="flex flex-col">
                  {notifications.map((notif) => (
                    <div 
                      key={notif.id} 
                      className={`flex flex-col gap-1 p-4 border-b hover:bg-muted/50 transition-colors cursor-pointer ${notif.is_read ? 'opacity-60' : 'bg-primary/5'}`}
                      onClick={() => markAsRead(notif.id, notif.link)}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-sm">{notif.title}</span>
                        {!notif.is_read && <span className="h-2 w-2 rounded-full bg-primary" />}
                      </div>
                      <p className="text-xs text-muted-foreground">{notif.message}</p>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </PopoverContent>
        </Popover>

        {/* Calendar Shortcut */}
        <Button variant="ghost" size="icon" onClick={() => router.push('/admin/calendar')}>
          <Calendar className="h-5 w-5" />
        </Button>

        {/* Date */}
        <div className="hidden items-center gap-2 rounded-lg border border-border px-3 py-1.5 text-sm md:flex">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          {today}
        </div>
      </div>
    </header>
  )
}
