import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowRight, Calendar, Package, ShieldCheck, Users, Zap, Clock, Phone, Mail, MapPin } from "lucide-react"

export default function HomePage() {
  return (
    <div className="relative flex flex-col overflow-hidden bg-slate-950">
      {/* ===== HERO SECTION ===== */}
      <div className="relative min-h-screen flex flex-col">
        {/* Background Image with Overlay */}
        <div
          className="absolute inset-0 z-0 opacity-40"
          style={{
            backgroundImage: `url('/mobile_login_background_1777809481060.png')`,
            backgroundSize: 'cover',
            backgroundPosition: 'center'
          }}
        />
        <div className="absolute inset-0 z-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent" />

        {/* Navbar */}
        <nav className="relative z-10 flex items-center justify-between px-6 py-8 sm:px-12">
          <div className="flex items-center">
            <span className="text-2xl font-black tracking-tighter text-primary">F</span>
            <span className="text-2xl font-black tracking-tighter text-white">ND</span>
          </div>
          <div className="hidden sm:flex items-center gap-8">
            <a href="#features" className="text-sm font-medium text-slate-400 hover:text-white transition-colors scroll-smooth">Fitur</a>
            <a href="#about" className="text-sm font-medium text-slate-400 hover:text-white transition-colors scroll-smooth">Tentang Kami</a>
            <Button asChild variant="ghost" className="text-white hover:bg-white/10">
              <Link href="/auth/login">Masuk</Link>
            </Button>
          </div>
        </nav>

        {/* Hero Content */}
        <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-6 text-center">
          <div className="max-w-4xl space-y-8">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 backdrop-blur-md">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
              </span>
              <span className="text-xs font-bold text-primary uppercase tracking-wider">Sistem Manajemen Event Terpadu</span>
            </div>

            <h1 className="text-5xl sm:text-7xl font-black text-white tracking-tight leading-[1.1]">
              Terangi Event Anda dengan <span className="text-primary">FND Production</span>
            </h1>

            <p className="text-lg sm:text-xl text-slate-400 max-w-2xl mx-auto leading-relaxed">
              Solusi profesional untuk manajemen lighting, crew, dan inventory.
              Kelola seluruh operasional event Anda dalam satu platform cerdas.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
              <Button asChild size="lg" className="h-14 px-8 text-lg font-bold bg-primary hover:bg-primary/90 text-white rounded-2xl shadow-xl shadow-primary/20 group">
                <Link href="/auth/login">
                  Mulai Sekarang <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="h-14 px-8 text-lg font-bold border-white/10 bg-white/5 backdrop-blur-md text-white hover:bg-white/10 rounded-2xl">
                <Link href="/auth/signup">Daftar Akun Admin</Link>
              </Button>
            </div>
          </div>

          {/* Stats Summary */}
          <div className="mt-20 grid grid-cols-2 sm:grid-cols-4 gap-8 sm:gap-16 border-t border-white/10 pt-12">
            <div className="space-y-1">
              <p className="text-3xl font-black text-white">120+</p>
              <p className="text-sm text-slate-500 font-medium">Event Sukses</p>
            </div>
            <div className="space-y-1">
              <p className="text-3xl font-black text-white">500+</p>
              <p className="text-sm text-slate-500 font-medium">Alat Ready</p>
            </div>
            <div className="space-y-1">
              <p className="text-3xl font-black text-white">40+</p>
              <p className="text-sm text-slate-500 font-medium">Crew Ahli</p>
            </div>
            <div className="space-y-1">
              <p className="text-3xl font-black text-white">24/7</p>
              <p className="text-sm text-slate-500 font-medium">Dukungan</p>
            </div>
          </div>
        </main>
      </div>

      {/* ===== FITUR SECTION ===== */}
      <section id="features" className="relative z-10 bg-slate-950 border-t border-white/10 py-24 px-6 sm:px-12 scroll-mt-20">
        <div className="max-w-6xl mx-auto">
          {/* Section header */}
          <div className="text-center mb-16">
            <span className="text-xs font-bold text-primary uppercase tracking-widest">Platform Unggulan</span>
            <h2 className="mt-3 text-4xl font-black text-white tracking-tight">Fitur Lengkap untuk<br />Operasional Event</h2>
            <p className="mt-4 text-slate-400 max-w-xl mx-auto">Semua yang Anda butuhkan untuk mengelola event profesional dalam satu platform terintegrasi.</p>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            <div className="p-8 rounded-3xl bg-white/5 border border-white/10 hover:border-primary/50 transition-all hover:-translate-y-1 group">
              <div className="p-3 w-fit rounded-2xl bg-primary/10 mb-6 group-hover:scale-110 transition-transform">
                <Calendar className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">Manajemen Event</h3>
              <p className="text-slate-400 leading-relaxed">Pantau jadwal, status, dan detail teknis setiap event secara real-time dari satu dashboard terpusat.</p>
            </div>
            <div className="p-8 rounded-3xl bg-white/5 border border-white/10 hover:border-orange-500/50 transition-all hover:-translate-y-1 group">
              <div className="p-3 w-fit rounded-2xl bg-orange-500/10 mb-6 group-hover:scale-110 transition-transform">
                <Package className="w-6 h-6 text-orange-500" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">Inventory Alat</h3>
              <p className="text-slate-400 leading-relaxed">Kontrol stok alat lighting dan perlengkapan panggung secara otomatis. Tidak ada alat yang terlewat.</p>
            </div>
            <div className="p-8 rounded-3xl bg-white/5 border border-white/10 hover:border-blue-500/50 transition-all hover:-translate-y-1 group">
              <div className="p-3 w-fit rounded-2xl bg-blue-500/10 mb-6 group-hover:scale-110 transition-transform">
                <Users className="w-6 h-6 text-blue-500" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">Manajemen Crew</h3>
              <p className="text-slate-400 leading-relaxed">Kelola tim crew, jadwal penugasan, absensi, dan keahlian dalam satu sistem yang terorganisir.</p>
            </div>
            <div className="p-8 rounded-3xl bg-white/5 border border-white/10 hover:border-green-500/50 transition-all hover:-translate-y-1 group">
              <div className="p-3 w-fit rounded-2xl bg-green-500/10 mb-6 group-hover:scale-110 transition-transform">
                <Zap className="w-6 h-6 text-green-500" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">Notifikasi Real-time</h3>
              <p className="text-slate-400 leading-relaxed">Update instan untuk perubahan jadwal, status event, dan tugas crew melalui notifikasi push.</p>
            </div>
            <div className="p-8 rounded-3xl bg-white/5 border border-white/10 hover:border-purple-500/50 transition-all hover:-translate-y-1 group">
              <div className="p-3 w-fit rounded-2xl bg-purple-500/10 mb-6 group-hover:scale-110 transition-transform">
                <Clock className="w-6 h-6 text-purple-500" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">Absensi & Check-in</h3>
              <p className="text-slate-400 leading-relaxed">Sistem absensi berbasis GPS untuk crew lapangan. Catat kehadiran secara akurat dan otomatis.</p>
            </div>
            <div className="p-8 rounded-3xl bg-white/5 border border-white/10 hover:border-primary/50 transition-all hover:-translate-y-1 group">
              <div className="p-3 w-fit rounded-2xl bg-primary/10 mb-6 group-hover:scale-110 transition-transform">
                <ShieldCheck className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">Akses Terproteksi</h3>
              <p className="text-slate-400 leading-relaxed">Sistem role-based: Admin, Crew, dan Client masing-masing memiliki akses yang sesuai perannya.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ===== TENTANG KAMI SECTION ===== */}
      <section id="about" className="relative z-10 bg-slate-900/50 border-t border-white/10 py-24 px-6 sm:px-12 scroll-mt-20">
        <div className="max-w-6xl mx-auto">
          {/* Section header */}
          <div className="text-center mb-16">
            <span className="text-xs font-bold text-primary uppercase tracking-widest">About Company</span>
            <h2 className="mt-3 text-4xl font-black text-white tracking-tight">Tentang FND Production</h2>
          </div>

          <div className="grid md:grid-cols-2 gap-12 items-center">
            {/* Left: Company info */}
            <div className="space-y-6">
              <div>
                <h3 className="text-2xl font-bold text-primary mb-4">Professional and Expert<br />Rental Lighting Jakarta</h3>
                <p className="text-slate-400 leading-relaxed mb-4">
                  FND Production adalah jasa sewa lighting Jakarta, vendor dari <strong className="text-white">PT. Fortuna Nusa Dream</strong> yang merupakan event produksi lighting panggung Jakarta dan sekitarnya.
                </p>
                <p className="text-slate-400 leading-relaxed">
                  Suatu kebanggaan buat FND Production yang telah berpengalaman lebih dari <strong className="text-white">8+ tahun</strong> yang sudah bergelut di dunia panggung hiburan dan saat ini menjelma sebagai FND Production jasa sewa lighting Jakarta terbaik.
                </p>
              </div>

              {/* Key values */}
              <div className="grid grid-cols-2 gap-4 pt-4">
                {[
                  { label: "Quality Equipment", desc: "Alat kualitas terbaik yang tidak perlu diragukan lagi untuk event Anda." },
                  { label: "Professional Crew", desc: "SDM berpengalaman dan berkompeten dalam menangani semua pekerjaan di lapangan." },
                  { label: "Quick Response", desc: "Respon cepat dalam menjawab setiap panggilan maupun pesan dari client." },
                  { label: "Instalation Speed", desc: "Kecepatan instalasi salah satu peran penting sebelum event berlangsung." },
                ].map((item) => (
                  <div key={item.label} className="p-4 rounded-2xl bg-white/5 border border-white/10">
                    <p className="text-primary font-bold text-sm mb-1">{item.label}</p>
                    <p className="text-slate-500 text-xs leading-relaxed">{item.desc}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Right: PIC + Contact card */}
            <div className="space-y-6">
              <div className="p-8 rounded-3xl bg-white/5 border border-white/10">
                <p className="text-slate-400 leading-relaxed mb-8">
                  Dengan adanya FND Production sebagai jasa sewa lighting Jakarta dan sekitarnya, kiranya client kami yang ingin membuat event dapat bekerja sama dan membangun kepercayaan dalam membuat event meriah di dunia panggung hiburan atau semi panggung hiburan dalam memilih sewa lighting Jakarta terbaik.
                </p>

                <div className="border-t border-white/10 pt-6 mb-6">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center">
                      <Users className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-white font-bold">Admin FND</p>
                      <p className="text-slate-500 text-sm">Person In Charge</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <p className="text-primary font-bold text-sm uppercase tracking-wider">Quick Response!</p>
                  <div className="flex items-center gap-3 text-slate-400">
                    <Phone className="w-4 h-4 text-primary flex-shrink-0" />
                    <span className="text-sm">811-144-021</span>
                  </div>
                  <div className="flex items-center gap-3 text-slate-400">
                    <Mail className="w-4 h-4 text-primary flex-shrink-0" />
                    <span className="text-sm">info@fndproduction.com</span>
                  </div>
                  <div className="flex items-center gap-3 text-slate-400">
                    <MapPin className="w-4 h-4 text-primary flex-shrink-0" />
                    <span className="text-sm">Jakarta dan sekitarnya</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 px-6 py-12 text-center border-t border-white/5 bg-slate-950">
        <p className="text-sm text-slate-500">
          &copy; 2026 FND Production. Didesain untuk keunggulan operasional.
        </p>
      </footer>

      {/* Decorative Blobs */}
      <div className="fixed top-[20%] left-[-10%] w-96 h-96 bg-primary/20 rounded-full blur-[150px] pointer-events-none animate-pulse" />
      <div className="fixed bottom-[10%] right-[-10%] w-96 h-96 bg-orange-500/10 rounded-full blur-[150px] pointer-events-none" />
    </div>
  )
}
