import { z } from "zod";

import { PaymentType } from "@/lib/types";

export const voucherFormSchema = z.object({
  voucherInfo: z.object({
    voucherNumber: z.string().optional().or(z.literal("")),
    subsidiary: z.string().optional().default("chartered-brokers"),
    date: z.string().optional().or(z.literal("")),
    paymentType: z.enum([
      PaymentType.CASH,
      PaymentType.CHEQUE,
      PaymentType.BANK_TRANSFER,
      PaymentType.OTHER,
    ]),
  }),
  payee: z.object({
    name: z.string().optional().or(z.literal("")),
    address: z.string().optional().or(z.literal("")),
    phone: z.string().optional().or(z.literal("")),
    bankAccount: z.string().optional().or(z.literal("")),
    bankName: z.string().optional().or(z.literal("")),
  }),
  payment: z.object({
    description: z.string().optional().or(z.literal("")),
    invoiceNumber: z.string().optional().or(z.literal("")),
    amount: z.coerce.number().optional().default(0),
    currency: z.string(),
  }),
  banking: z.object({
    chequeNumber: z.string().optional().or(z.literal("")),
    bankNumber: z.string().optional().or(z.literal("")),
  }),
  authorization: z.object({
    preparedBy: z.string().optional().or(z.literal("")),
    approvalToPay: z.string().optional().or(z.literal("")),
    receiverName: z.string().optional().or(z.literal("")),
  }),
});

export type VoucherFormValues = z.infer<typeof voucherFormSchema>;

export const DRAFT_DEFAULT_VALUES: VoucherFormValues = {
  voucherInfo: {
    voucherNumber: "",
    subsidiary: "chartered-brokers",
    date: "",
    paymentType: PaymentType.BANK_TRANSFER,
  },
  payee: {
    name: "",
    address: "",
    phone: "",
    bankAccount: "",
    bankName: "",
  },
  payment: {
    description: "",
    invoiceNumber: "",
    amount: 0,
    currency: "INR",
  },
  banking: {
    chequeNumber: "",
    bankNumber: "",
  },
  authorization: {
    preparedBy: "",
    approvalToPay: "",
    receiverName: "",
  },
};