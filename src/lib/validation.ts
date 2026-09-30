import { z } from "zod";

import { PaymentType } from "@/lib/types";

export const voucherFormSchema = z.object({
  voucherInfo: z.object({
    voucherNumber: z
      .string()
      .min(1, "Voucher number is required")
      .max(30, "Voucher number must be 30 characters or fewer"),
    date: z.string().min(1, "Date is required"),
    paymentType: z.enum(
      [
        PaymentType.CASH,
        PaymentType.CHEQUE,
        PaymentType.BANK_TRANSFER,
        PaymentType.OTHER,
      ],
      { message: "Select a payment type" }
    ),
  }),
  payee: z.object({
    name: z
      .string()
      .min(2, "Payee name is required")
      .max(120, "Payee name is too long"),
    address: z
      .string()
      .min(5, "Address must be at least 5 characters")
      .max(250, "Address is too long"),
    phone: z
      .string()
      .min(7, "Enter a valid phone number")
      .max(20, "Phone number is too long"),
    bankAccount: z
      .string()
      .min(5, "Bank account number is required")
      .max(34, "Bank account number is too long"),
    bankName: z
      .string()
      .min(2, "Bank name is required")
      .max(80, "Bank name is too long"),
  }),
  payment: z.object({
    description: z
      .string()
      .min(3, "Payment description is required")
      .max(300, "Description is too long"),
    invoiceNumber: z
      .string()
      .min(1, "Invoice number is required")
      .max(50, "Invoice number is too long"),
    amount: z.coerce
      .number({
        required_error: "Amount is required",
        invalid_type_error: "Amount must be a number",
      })
      .positive("Amount must be greater than zero")
      .max(999_999_999, "Amount is too large"),
    currency: z.string().min(1, "Currency is required"),
  }),
  banking: z.object({
    chequeNumber: z
      .string()
      .max(30, "Cheque number is too long")
      .optional()
      .or(z.literal("")),
    bankNumber: z
      .string()
      .max(30, "Bank number is too long")
      .optional()
      .or(z.literal("")),
  }),
  authorization: z.object({
    preparedBy: z
      .string()
      .min(2, "Prepared by is required")
      .max(120, "Name is too long"),
    approvalToPay: z
      .string()
      .min(2, "Approval to pay is required")
      .max(120, "Name is too long"),
    receiverName: z
      .string()
      .min(2, "Receiver name is required")
      .max(120, "Name is too long"),
  }),
}).superRefine((data, ctx) => {
  if (data.voucherInfo.paymentType === PaymentType.CHEQUE) {
    if (!data.banking.chequeNumber?.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["banking", "chequeNumber"],
        message: "Cheque number is required for cheque payments",
      });
    }
  }
});

export type VoucherFormValues = z.infer<typeof voucherFormSchema>;

export const DRAFT_DEFAULT_VALUES: VoucherFormValues = {
  voucherInfo: {
    voucherNumber: "",
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