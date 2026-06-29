export type EventStatus = 'pending' | 'survey' | 'deal' | 'running' | 'selesai' | 'cancel' | string;

export type ServiceItem = {
  id: string;
  equipmentId?: number;
  name: string;
  category: string;
  description: string;
  price: number;
  image: string;
  stock?: number;
};

export const eventImages = [
  'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?w=900&q=80',
  'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=900&q=80',
  'https://images.unsplash.com/photo-1505373877841-8d25f7d46678?w=900&q=80',
  'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=900&q=80',
  'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=900&q=80',
  'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=900&q=80',
];

export const serviceImages: Record<string, string> = {
  'Sound System': 'https://images.unsplash.com/photo-1598653222000-6b7b7a552625?w=500&q=80',
  Lighting: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=500&q=80',
  'LED Videotron': 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=500&q=80',
  Panggung: 'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=500&q=80',
  Multimedia: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=500&q=80',
  'Live Streaming': 'https://images.unsplash.com/photo-1478720568477-152d9b164e26?w=500&q=80',
  Genset: 'https://images.unsplash.com/photo-1513828583688-c52646db42da?w=500&q=80',
  Rigging: 'https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?w=500&q=80',
};

export const fallbackServices: ServiceItem[] = [
  {
    id: 'fallback-sound',
    name: 'Sound System',
    category: 'Sound System',
    description: 'Sistem suara profesional',
    price: 1500000,
    image: serviceImages['Sound System'],
  },
  {
    id: 'fallback-lighting',
    name: 'Lighting',
    category: 'Lighting',
    description: 'Lighting panggung dan dekorasi',
    price: 800000,
    image: serviceImages.Lighting,
  },
  {
    id: 'fallback-led',
    name: 'LED Videotron (P3)',
    category: 'LED Videotron',
    description: 'Indoor dan outdoor',
    price: 2000000,
    image: serviceImages['LED Videotron'],
  },
  {
    id: 'fallback-stage',
    name: 'Panggung',
    category: 'Panggung',
    description: 'Berbagai ukuran panggung',
    price: 1000000,
    image: serviceImages.Panggung,
  },
  {
    id: 'fallback-stream',
    name: 'Live Streaming',
    category: 'Live Streaming',
    description: 'Multi camera live streaming',
    price: 1500000,
    image: serviceImages['Live Streaming'],
  },
  {
    id: 'fallback-multimedia',
    name: 'Multimedia',
    category: 'Multimedia',
    description: 'Projector, TV, screen, dan kontrol',
    price: 500000,
    image: serviceImages.Multimedia,
  },
];

export const serviceCategories = [
  'Semua',
  'Sound System',
  'Lighting',
  'LED Videotron',
  'Panggung',
  'Multimedia',
  'Live Streaming',
  'Genset',
  'Rigging',
];

const categoryPrice: Record<string, number> = {
  'Sound System': 1500000,
  Lighting: 800000,
  'LED Videotron': 2000000,
  Panggung: 1000000,
  Multimedia: 500000,
  'Live Streaming': 1500000,
  Genset: 800000,
  Rigging: 1000000,
};

export function formatCurrency(amount?: number | string | null) {
  const value = Number(amount || 0);
  return `Rp ${value.toLocaleString('id-ID')}`;
}

export function parseDate(value?: string | Date | null) {
  if (!value) return null;
  if (value instanceof Date) return value;
  const raw = String(value);
  const normalized = /^\d{4}-\d{2}-\d{2}$/.test(raw) ? `${raw}T00:00:00` : raw;
  const date = new Date(normalized);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function formatDate(value?: string | Date | null, fallback = '-') {
  const date = parseDate(value);
  if (!date) return fallback;
  return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
}

export function formatLongDate(value?: string | Date | null, fallback = '-') {
  const date = parseDate(value);
  if (!date) return fallback;
  return date.toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric', month: 'long', year: 'numeric' });
}

export function toDateInput(value?: string | Date | null) {
  const date = parseDate(value);
  if (!date) return '';
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function getEventImage(event: any) {
  const rawReferences = event?.reference_images;
  if (Array.isArray(rawReferences) && rawReferences[0]) return rawReferences[0];
  if (typeof rawReferences === 'string') {
    try {
      const parsed = JSON.parse(rawReferences);
      if (Array.isArray(parsed) && parsed[0]) return parsed[0];
    } catch {
      if (rawReferences.startsWith('http')) return rawReferences;
    }
  }
  const id = Number(event?.id || 0);
  return eventImages[Math.abs(id) % eventImages.length];
}

export function getEventStatusMeta(status?: EventStatus) {
  const key = String(status || 'pending').toLowerCase();
  const map: Record<string, { label: string; clientLabel: string; crewTab: string; eventTab: string; progress: number; bg: string; text: string; color: string; step: number }> = {
    pending: { label: 'Persiapan', clientLabel: 'Menunggu Konfirmasi', crewTab: 'Mendatang', eventTab: 'On Going', progress: 20, bg: 'bg-slate-100', text: 'text-slate-600', color: '#64748B', step: 0 },
    survey: { label: 'Persiapan', clientLabel: 'Survey', crewTab: 'Mendatang', eventTab: 'On Going', progress: 30, bg: 'bg-blue-100', text: 'text-blue-700', color: '#2563EB', step: 1 },
    deal: { label: 'Persiapan', clientLabel: 'Persiapan', crewTab: 'Aktif', eventTab: 'On Going', progress: 45, bg: 'bg-blue-100', text: 'text-blue-700', color: '#2563EB', step: 1 },
    running: { label: 'On Going', clientLabel: 'On Going', crewTab: 'Aktif', eventTab: 'On Going', progress: 70, bg: 'bg-emerald-100', text: 'text-emerald-700', color: '#16A34A', step: 3 },
    selesai: { label: 'Selesai', clientLabel: 'Selesai', crewTab: 'Selesai', eventTab: 'Selesai', progress: 100, bg: 'bg-emerald-100', text: 'text-emerald-700', color: '#16A34A', step: 4 },
    cancel: { label: 'Dibatalkan', clientLabel: 'Dibatalkan', crewTab: 'Selesai', eventTab: 'Dibatalkan', progress: 0, bg: 'bg-orange-100', text: 'text-orange-700', color: '#F97316', step: 0 },
  };
  return map[key] || { label: key, clientLabel: key, crewTab: 'Aktif', eventTab: 'On Going', progress: 40, bg: 'bg-slate-100', text: 'text-slate-600', color: '#64748B', step: 1 };
}

export function getLocationParts(event: any) {
  const location = String(event?.location || 'Lokasi belum diatur');
  const notes = String(event?.notes || '');
  const address = notes
    .split('\n')
    .find((line) => line.toLowerCase().includes('jl.') || line.toLowerCase().includes('jalan'))
    || (location.includes(',') ? location : 'Alamat lengkap mengikuti detail admin');

  return { venue: location, address };
}

export function inferServiceCategory(name?: string | null, category?: string | null) {
  const cleanCategory = String(category || '').trim();
  if (cleanCategory) return cleanCategory;

  const value = String(name || '').toLowerCase();
  if (value.includes('sound') || value.includes('audio') || value.includes('mixer')) return 'Sound System';
  if (value.includes('led') || value.includes('videotron') || value.includes('screen')) return 'LED Videotron';
  if (value.includes('panggung') || value.includes('stage')) return 'Panggung';
  if (value.includes('stream') || value.includes('camera')) return 'Live Streaming';
  if (value.includes('genset')) return 'Genset';
  if (value.includes('rigging') || value.includes('truss')) return 'Rigging';
  if (value.includes('projector') || value.includes('tv') || value.includes('multimedia')) return 'Multimedia';
  return 'Lighting';
}

export function priceForService(service: Pick<ServiceItem, 'category' | 'name'>) {
  return categoryPrice[service.category] || categoryPrice[inferServiceCategory(service.name)] || 1500000;
}

export function buildServicesFromEquipment(equipment: any[] = []) {
  if (!equipment.length) return fallbackServices;

  return equipment.map((item) => {
    const category = inferServiceCategory(item.name, item.category);
    return {
      id: `equipment-${item.id}`,
      equipmentId: Number(item.id),
      name: item.name,
      category,
      description: item.description || defaultServiceDescription(category),
      price: categoryPrice[category] || 500000,
      image: item.image_url || serviceImages[category] || serviceImages.Lighting,
      stock: Number(item.available_stock ?? item.availableStock ?? 0),
    };
  });
}

export function defaultServiceDescription(category: string) {
  switch (category) {
    case 'Sound System':
      return 'Sistem suara profesional';
    case 'LED Videotron':
      return 'Indoor dan outdoor';
    case 'Panggung':
      return 'Berbagai ukuran panggung';
    case 'Live Streaming':
      return 'Multi camera live streaming';
    case 'Multimedia':
      return 'Projector, TV, screen, dan kontrol';
    case 'Genset':
      return 'Daya cadangan event';
    case 'Rigging':
      return 'Konstruksi panggung aman';
    default:
      return 'Lighting panggung dan dekorasi';
  }
}

export function extractGuestCount(notes?: string | null) {
  const match = String(notes || '').match(/Estimasi tamu:\s*(\d+)/i);
  return match?.[1] || '500';
}

export function initials(name?: string | null) {
  const parts = String(name || 'FND').trim().split(/\s+/).slice(0, 2);
  return parts.map((part) => part.charAt(0).toUpperCase()).join('');
}
