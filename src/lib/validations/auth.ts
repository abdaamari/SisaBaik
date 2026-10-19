import { z } from 'zod';

export const registerSchema = z.object({
  role: z.enum(['provider', 'partner'], {
    required_error: 'Silakan pilih peran Anda',
  }),
  organization_name: z.string().min(2, 'Nama organisasi minimal 2 karakter'),
  organization_type: z.string().optional(),
  // Optional: an empty field is fine, a filled one must look like a phone number.
  phone: z
    .string()
    .regex(/^[0-9+\s-]+$/, 'Format nomor telepon tidak valid')
    .or(z.literal(''))
    .optional(),
  address: z.string().min(5, 'Alamat minimal 5 karakter'),
  email: z.string().email('Email tidak valid'),
  password: z.string().min(8, 'Password minimal 8 karakter'),
});

export type RegisterFormData = z.infer<typeof registerSchema>;
