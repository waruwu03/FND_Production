"use client"

import { useEffect, useMemo, useState } from "react"
import { AdminHeader } from "@/components/admin/header"
import { StatsCard } from "@/components/admin/stats-card"
import { EventsChart } from "@/components/admin/events-chart"
import { StatusChart } from "@/components/admin/status-chart"
import { UpcomingEvents } from "@/components/admin/upcoming-events"
import { EventsTable } from "@/components/admin/events-table"
import { InventoryStatus } from "@/components/admin/inventory-status"
import { CrewStatus } from "@/components/admin/crew-status"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Calendar, DollarSign, Package, RefreshCw, Users } from "lucide-react"
import { EventStatus } from "@/lib/types"
import { fetchAPI } from "@/lib/api"

type DashboardData = {
  stats: {
    totalEvents: number
    eventsToday: number
    totalRevenue: number
    availableEquipment: number
    totalEquipment: number
    availableCrew: number
    totalCrew: number
  }
  recentEvents: any[]
  upcomingEvents: any[]
  eventsByStatus: { status: EventStatus; count: number; percentage: number }[]
  monthlyEvents: { month: string; count: number }[]
  topEquipment: any[]
  crewList: any[]
}

const emptyDashboard: DashboardData = {
  stats: {
    totalEvents: 0,
    eventsToday: 0,
    totalRevenue: 0,
    availableEquipment: 0,
    totalEquipment: 0,
    availableCrew: 0,
    totalCrew: 0,
  },
  recentEvents: [],
  upcomingEvents: [],
  eventsByStatus: [],
  monthlyEvents: [],
  topEquipment: [],
  crewList: [],
}

function buildDashboardData(events: any[], equipmentData: any[], crewData: any[]): DashboardData {
  const totalEvents = events.length
  const today = new Date().toISOString().split("T")[0]
  const eventsToday = events.filter((event) => String(event.event_date || "").startsWith(today)).length
  const totalRevenue = events
    .filter((event) => ["deal", "running", "selesai"].includes(event.status))
    .reduce((sum, event) => sum + Number(event.total_price || 0), 0)

  const totalEquipment = equipmentData.reduce((sum, item) => sum + Number(item.total_stock || 0), 0)
  const availableEquipment = equipmentData.reduce((sum, item) => sum + Number(item.available_stock || 0), 0)
  const availableCrew = crewData.filter((member) => member.status === "available").length
  const totalCrew = crewData.length

  const recentEvents = [...events]
    .sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime())
    .slice(0, 5)
    .map((event) => ({
      ...event,
      total_price: event.total_amount,
      client: { full_name: event.client_name },
    }))

  const upcomingEvents = events
    .filter((event) => event.event_date && event.event_date >= today && ["pending", "survey", "deal", "running"].includes(event.status))
    .sort((a, b) => new Date(a.event_date).getTime() - new Date(b.event_date).getTime())
    .slice(0, 5)
    .map((event) => ({
      ...event,
      total_price: event.total_amount,
      client: { full_name: event.client_name },
    }))

  const statusCounts: Record<EventStatus, number> = {
    pending: 0,
    survey: 0,
    deal: 0,
    running: 0,
    selesai: 0,
    cancel: 0,
  }
  events.forEach((event) => {
    if (event.status in statusCounts) {
      statusCounts[event.status as EventStatus] += 1
    }
  })

  const eventsByStatus = Object.entries(statusCounts).map(([status, count]) => ({
    status: status as EventStatus,
    count,
    percentage: totalEvents > 0 ? Math.round((count / totalEvents) * 100) : 0,
  }))

  const currentYear = new Date().getFullYear()
  const monthlyEvents = Array.from({ length: 12 }, (_, index) => {
    const month = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"][index]
    const count = events.filter((event) => {
      if (!event.event_date) return false
      const date = new Date(event.event_date)
      return date.getFullYear() === currentYear && date.getMonth() === index
    }).length
    return { month, count }
  })

  const topEquipment = [...equipmentData]
    .slice(0, 5)
    .map((item) => ({
      ...item,
      total_quantity: item.total_stock,
      available_quantity: item.available_stock,
    }))

  const crewList = crewData.slice(0, 6).map((member) => ({
    ...member,
    full_name: member.name,
    position: member.role,
    availability: member.status === "available" ? "tersedia" : "on_job",
  }))

  return {
    stats: { totalEvents, eventsToday, totalRevenue, availableEquipment, totalEquipment, availableCrew, totalCrew },
    recentEvents,
    upcomingEvents,
    eventsByStatus,
    monthlyEvents,
    topEquipment,
    crewList,
  }
}

export default function AdminDashboard() {
  const [data, setData] = useState<DashboardData>(emptyDashboard)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  async function loadDashboard() {
    setLoading(true)
    setError(null)
    try {
      const [eventsRes, equipmentRes, crewRes] = await Promise.all([
        fetchAPI<any>("/events"),
        fetchAPI<any>("/equipment"),
        fetchAPI<any>("/crew"),
      ])

      setData(buildDashboardData(eventsRes.data || [], equipmentRes.data || [], crewRes.data || []))
    } catch (err: any) {
      setError(err?.message || "Gagal memuat dashboard")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadDashboard()
  }, [])

  const revenueLabel = useMemo(
    () => `Rp ${(data.stats.totalRevenue / 1000000).toFixed(1)}M`,
    [data.stats.totalRevenue],
  )

  return (
    <div className="min-h-screen">
      <AdminHeader title="Dashboard" subtitle="Ringkasan operasional FND Production" />

      <main className="p-4 lg:p-6">
        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertTitle>Dashboard gagal dimuat</AlertTitle>
            <AlertDescription className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <span>{error}</span>
              <Button variant="outline" size="sm" onClick={loadDashboard}>
                <RefreshCw className="mr-2 h-4 w-4" />
                Coba Lagi
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {loading ? (
          <div className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
              {Array.from({ length: 5 }).map((_, index) => (
                <Skeleton key={index} className="h-28 w-full" />
              ))}
            </div>
            <div className="grid gap-6 lg:grid-cols-3">
              <Skeleton className="h-80 lg:col-span-2" />
              <Skeleton className="h-80" />
            </div>
          </div>
        ) : (
          <>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
              <StatsCard title="Total Event" value={data.stats.totalEvents} icon={Calendar} iconColor="text-primary" iconBgColor="bg-primary/10" />
              <StatsCard title="Event Hari Ini" value={data.stats.eventsToday} icon={Calendar} iconColor="text-primary" iconBgColor="bg-primary/10" />
              <StatsCard title="Total Revenue" value={revenueLabel} icon={DollarSign} iconColor="text-green-600" iconBgColor="bg-green-100" />
              <StatsCard title="Alat Tersedia" value={data.stats.availableEquipment} subtitle={`dari total ${data.stats.totalEquipment} unit`} icon={Package} iconColor="text-blue-600" iconBgColor="bg-blue-100" />
              <StatsCard title="Crew Tersedia" value={data.stats.availableCrew} subtitle={`dari total ${data.stats.totalCrew} crew`} icon={Users} iconColor="text-orange-600" iconBgColor="bg-orange-100" />
            </div>

            <div className="mt-6 grid gap-6 lg:grid-cols-3">
              <div className="lg:col-span-2">
                <EventsChart data={data.monthlyEvents} />
              </div>
              <StatusChart data={data.eventsByStatus} total={data.stats.totalEvents} />
            </div>

            <div className="mt-6 grid gap-6 lg:grid-cols-3">
              <div className="lg:col-span-2">
                <EventsTable events={data.recentEvents} />
              </div>
              <UpcomingEvents events={data.upcomingEvents} />
            </div>

            <div className="mt-6 grid gap-6 md:grid-cols-2">
              <InventoryStatus equipment={data.topEquipment} />
              <CrewStatus crew={data.crewList} />
            </div>
          </>
        )}
      </main>
    </div>
  )
}
