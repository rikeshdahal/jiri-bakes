import { z } from 'zod';

const phoneRegex = /^[+\d][\d\s\-()]{5,20}$/;

export const orderItemSchema = z.object({
  product_id: z.string().trim().max(64).optional().or(z.literal('')),
  name: z.string().trim().min(1).max(160),
  price: z.number().finite().min(0).max(1_000_000),
  quantity: z.number().int().min(1).max(100),
});

export const orderSchema = z.object({
  customer_name: z.string().trim().min(2, 'Full name is required').max(120),
  customer_phone: z
    .string()
    .trim()
    .min(6, 'Phone is required')
    .max(24)
    .regex(phoneRegex, 'Enter a valid phone number'),
  customer_email: z
    .string()
    .trim()
    .toLowerCase()
    .max(160)
    .optional()
    .or(z.literal(''))
    .refine((v) => !v || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v), 'Enter a valid email'),
  customer_address: z.string().trim().min(3, 'Delivery location is required').max(300),
  items: z.array(orderItemSchema).min(1, 'Order items are required').max(50),
  payment_method: z.enum(['Cash on Delivery', 'Visit Store / Pay in Person']).default('Cash on Delivery'),
  variant: z.enum(['Egg', 'Eggless']).optional().default('Egg'),
  message_on_item: z.string().trim().max(200).optional().or(z.literal('')),
  item_note: z.string().trim().max(500).optional().or(z.literal('')),
  delivery_date: z
    .string()
    .trim()
    .min(1, 'Delivery date is required')
    .max(20)
    .refine((v) => {
      const d = new Date(v);
      if (Number.isNaN(d.getTime())) return false;
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return d.getTime() >= today.getTime();
    }, 'Delivery date must be today or later'),
  delivery_time: z.string().trim().min(1, 'Delivery time is required').max(60),
  delivery_location: z.string().trim().max(300).optional().or(z.literal('')),
  notes: z.string().trim().max(2000).optional().or(z.literal('')),
  // total is accepted but NEVER trusted — server recomputes from product prices.
  total: z.number().finite().min(0).max(10_000_000).optional(),
});

export type OrderFormValues = z.infer<typeof orderSchema>;

export const statusSchema = z.object({
  status: z.enum([
    'pending',
    'confirmed',
    'baking',
    'preparing',
    'ready',
    'delivered',
    'completed',
    'cancelled',
  ]),
});

export const inquirySchema = z.object({
  name: z.string().trim().min(2, 'Name is required').max(120),
  email: z.string().trim().toLowerCase().max(160).email('Enter a valid email'),
  phone: z.string().trim().min(6, 'Phone is required').max(24).regex(phoneRegex, 'Enter a valid phone number'),
  message: z.string().trim().min(10, 'Tell us a little more').max(3000),
});

export type InquiryFormValues = z.infer<typeof inquirySchema>;

/** Strip HTML tags + trim; used before persisting free-text fields. */
export function cleanText(value: unknown, max = 2000): string {
  if (typeof value !== 'string') return '';
  return value
    .replace(/<[^>]*>/g, '')
    .replace(/[\x00-\x08\x0b\x0c\x0e-\x1f]/g, '')
    .trim()
    .slice(0, max);
}
