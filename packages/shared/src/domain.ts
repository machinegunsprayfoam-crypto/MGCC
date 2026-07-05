/**
 * Core domain primitives shared across MGCC modules.
 *
 * Types are defined via zod schemas so they can be reused for runtime
 * validation (API boundaries, forms) and for static typing via `z.infer`.
 */

import { z } from "zod";

/** US 2-letter state code, minimally validated. */
export const stateCodeSchema = z
  .string()
  .trim()
  .length(2)
  .regex(/^[A-Za-z]{2}$/, "Must be a 2-letter state code")
  .transform((s) => s.toUpperCase());

export const addressSchema = z.object({
  line1: z.string().trim().min(1),
  line2: z.string().trim().optional(),
  city: z.string().trim().min(1),
  state: stateCodeSchema,
  postalCode: z
    .string()
    .trim()
    .regex(/^\d{5}(-\d{4})?$/, "Must be a valid ZIP code"),
});
export type Address = z.infer<typeof addressSchema>;

/**
 * Monetary amount stored as integer cents to avoid floating-point drift.
 * All money in the platform flows through this representation.
 */
export const moneySchema = z.object({
  cents: z.number().int(),
  currency: z.literal("USD").default("USD"),
});
export type Money = z.infer<typeof moneySchema>;

export const usd = (dollars: number): Money => ({
  cents: Math.round(dollars * 100),
  currency: "USD",
});

export const formatMoney = (money: Money): string =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: money.currency,
  }).format(money.cents / 100);

/** Where a customer originated, useful for CRM pipeline reporting. */
export const leadSourceSchema = z.enum([
  "referral",
  "website",
  "phone",
  "field",
  "government",
  "other",
]);
export type LeadSource = z.infer<typeof leadSourceSchema>;

export const customerSchema = z.object({
  id: z.string().uuid(),
  name: z.string().trim().min(1),
  email: z.string().trim().email().optional(),
  phone: z.string().trim().optional(),
  address: addressSchema.optional(),
  leadSource: leadSourceSchema.default("other"),
  createdAt: z.string().datetime(),
});
export type Customer = z.infer<typeof customerSchema>;
