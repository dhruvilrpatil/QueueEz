import { z } from 'zod';

export const joinQueueSchema = z.object({
  facility_id: z.string().uuid(),
  service_id: z.string().uuid(),
  priority: z.enum(['normal', 'priority', 'emergency']).default('normal'),
  appointment_id: z.string().uuid().optional(),
  notes: z.string().max(300).optional(),
});

export const callTicketSchema = z.object({
  counter_id: z.string().uuid().optional(),
});

export const transferTicketSchema = z.object({
  counter_id: z.string().uuid(),
  reason: z.string().max(200).optional(),
});

export const updateTicketStatusSchema = z.object({
  notes: z.string().max(300).optional(),
});

export type JoinQueueInput = z.infer<typeof joinQueueSchema>;
export type CallTicketInput = z.infer<typeof callTicketSchema>;
export type TransferTicketInput = z.infer<typeof transferTicketSchema>;
