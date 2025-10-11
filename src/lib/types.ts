import { z } from 'zod';

// Manychat webhook payload schemas
export const ManychatUserSchema = z.object({
  id: z.string(),
  first_name: z.string().optional(),
  last_name: z.string().optional(),
  timezone: z.string().optional(),
});

// Booking request schema
export const CreateBookingSchema = z.object({
  manychat_user_id: z.string(),
  tool_id: z.string(),
  start_time: z.string().datetime(),
  duration: z.number().min(15).max(480), // 15 min to 8 hours
  notes: z.string().optional(),
});

// QR Code generation schema
export const GenerateQRSchema = z.object({
  manychat_user_id: z.string(),
  type: z.enum(['promotion', 'validation', 'discount']),
  metadata: z.record(z.string(), z.any()).optional(),
  expires_in_days: z.number().optional(),
});

// Tool availability schema
export const ToolAvailabilitySchema = z.object({
  tool_id: z.string(),
  date: z.string().datetime(),
});

export type ManychatUser = z.infer<typeof ManychatUserSchema>;
export type CreateBookingRequest = z.infer<typeof CreateBookingSchema>;
export type GenerateQRRequest = z.infer<typeof GenerateQRSchema>;
export type ToolAvailabilityRequest = z.infer<typeof ToolAvailabilitySchema>;
