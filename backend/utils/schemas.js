import { z } from 'zod'

export const loginSchema = z.object({
  body: z.object({
    email: z.string().trim().email().transform((value) => value.toLowerCase()),
    password: z.string().min(6),
  }),
})

export const signupSchema = z.object({
  body: z.object({
    name: z.string().trim().min(2).max(120),
    email: z.string().trim().email().transform((value) => value.toLowerCase()),
    password: z.string().min(8),
    role: z.enum(['client', 'crew']).optional(),
    phone: z.string().trim().max(30).optional().or(z.literal('')),
  }),
})

export const updateProfileSchema = z.object({
  body: z.object({
    name: z.string().trim().min(2).max(120).optional(),
    phone: z.string().trim().max(30).optional().or(z.literal('')),
  }),
})

export const changePasswordSchema = z.object({
  body: z.object({
    currentPassword: z.string().min(1),
    newPassword: z.string().min(8),
  }),
})

export const eventSchema = z.object({
  body: z.object({
    name: z.string().trim().min(3).max(180),
    type: z.string().trim().min(2).max(80),
    eventDate: z.string().trim().min(8),
    location: z.string().trim().min(2).max(180),
    notes: z.string().trim().max(2000).optional().or(z.literal('')),
    clientId: z.coerce.number().int().positive().optional(),
    totalAmount: z.coerce.number().nonnegative().optional(),
    dpAmount: z.coerce.number().nonnegative().optional(),
    referenceImages: z.array(z.string().startsWith('/uploads/')).max(10).optional(),
    equipment: z.array(z.object({
      equipmentId: z.coerce.number().int().positive(),
      quantity: z.coerce.number().int().positive(),
    })).optional(),
    crew: z.array(z.object({
      crewId: z.coerce.number().int().positive(),
      task: z.string().trim().max(120).optional(),
    })).optional(),
  }),
})

// Partial update schema — all fields optional (for PUT /events/:id from mobile)
export const updateEventSchema = z.object({
  body: z.object({
    name: z.string().trim().min(3).max(180).optional(),
    type: z.string().trim().min(2).max(80).optional(),
    eventDate: z.string().trim().min(8).optional(),
    location: z.string().trim().min(2).max(180).optional(),
    notes: z.string().trim().max(2000).optional().or(z.literal('')),
    status: z.string().trim().optional(),
    clientId: z.coerce.number().int().positive().optional(),
    totalAmount: z.coerce.number().nonnegative().optional(),
    dpAmount: z.coerce.number().nonnegative().optional(),
    referenceImages: z.array(z.string()).max(10).optional(),
    equipment: z.array(z.object({
      equipmentId: z.coerce.number().int().positive(),
      quantity: z.coerce.number().int().positive(),
    })).optional(),
    crew: z.array(z.object({
      crewId: z.coerce.number().int().positive(),
      task: z.string().trim().max(120).optional(),
    })).optional(),
  }),
})

export const paymentSchema = z.object({
  body: z.object({
    eventId: z.coerce.number().int().positive(),
    amount: z.coerce.number().positive(),
    paymentType: z.enum(['dp', 'full', 'pelunasan']),
    status: z.enum(['paid', 'unpaid']).optional(),
    proofUrl: z.string().optional().nullable(),
  }),
})

export const updatePaymentSchema = z.object({
  body: z.object({
    amount: z.coerce.number().positive().optional(),
    status: z.enum(['paid', 'unpaid']).optional(),
    proofUrl: z.string().optional().nullable(),
  }),
})

export const equipmentSchema = z.object({
  body: z.object({
    name: z.string().trim().min(2).max(140),
    totalStock: z.coerce.number().int().nonnegative(),
    availableStock: z.coerce.number().int().nonnegative(),
    category: z.string().trim().max(80).optional().nullable(),
    description: z.string().trim().max(500).optional().nullable(),
  }).refine((value) => value.availableStock <= value.totalStock, {
    message: 'Stok tersedia tidak boleh melebihi total stok',
    path: ['availableStock'],
  }),
})

export const updateEquipmentSchema = z.object({
  body: z.object({
    name: z.string().trim().min(2).max(140).optional(),
    totalStock: z.coerce.number().int().nonnegative().optional(),
    availableStock: z.coerce.number().int().nonnegative().optional(),
    category: z.string().trim().max(80).optional().nullable(),
    description: z.string().trim().max(500).optional().nullable(),
  }),
})

export const crewSchema = z.object({
  body: z.object({
    name: z.string().trim().min(2).max(120),
    role: z.string().trim().min(2).max(80),
    phone: z.string().trim().max(40).optional().nullable(),
  }),
})

export const updateCrewSchema = z.object({
  body: z.object({
    name: z.string().trim().min(2).max(120).optional(),
    role: z.string().trim().min(2).max(80).optional(),
    phone: z.string().trim().max(40).optional().nullable(),
    status: z.enum(['available', 'on_job', 'tersedia']).optional(),
  }),
})

export const registerCrewSchema = z.object({
  body: z.object({
    name: z.string().trim().min(2).max(120),
    email: z.string().trim().email().transform((value) => value.toLowerCase()),
    password: z.string().min(8),
    role: z.string().trim().min(2).max(80).optional(),
    phone: z.string().trim().max(40).optional().nullable(),
  }),
})

export const adminUserSchema = z.object({
  body: z.object({
    name: z.string().trim().min(2).max(120),
    email: z.string().trim().email().transform((value) => value.toLowerCase()),
    password: z.string().min(8),
    role: z.enum(['admin', 'client', 'crew']),
    phone: z.string().trim().max(30).optional().nullable(),
  }),
})

export const updateAdminUserSchema = z.object({
  body: z.object({
    name: z.string().trim().min(2).max(120).optional(),
    email: z.string().trim().email().transform((value) => value.toLowerCase()).optional(),
    password: z.string().min(8).optional().or(z.literal('')),
    role: z.enum(['admin', 'client', 'crew']).optional(),
    phone: z.string().trim().max(30).optional().nullable(),
  }),
})

export const statusSchema = z.object({
  body: z.object({
    status: z.enum(['pending', 'survey', 'deal', 'running', 'selesai', 'cancel']),
  }),
})
