import { NextResponse } from "next/server";
import { getVouchersAction } from "@/server/vouchers";
import { generateExcelBuffer } from "@/lib/excel-export";

export async function GET() {
  try {
    const vouchers = await getVouchersAction();

    const columns = [
      { header: "Voucher No (PV No)", width: 16 },
      { header: "Date", width: 14 },
      { header: "Subsidiary", width: 24 },
      { header: "Status", width: 18 },
      { header: "Payment Type", width: 16 },
      { header: "Payee Name", width: 28 },
      { header: "Payee Bank", width: 20 },
      { header: "Payee Account Number", width: 22 },
      { header: "Payee Phone", width: 18 },
      { header: "Payee Address", width: 30 },
      { header: "Payment Description", width: 35 },
      { header: "Invoice Number", width: 18 },
      { header: "Amount", width: 16 },
      { header: "Currency", width: 10 },
      { header: "Credited Account / Bank No", width: 30 },
      { header: "Cheque Number", width: 18 },
      { header: "Prepared By (Maker)", width: 20 },
      { header: "Approval To Pay (Approver)", width: 22 },
      { header: "Receiver Name", width: 22 },
      { header: "Created At", width: 22 },
    ];

    const data = vouchers.map((v) => {
      // Determine human-readable subsidiary
      const subsidiaryName =
        v.subsidiary === "medibroker" || v.subsidiary?.toLowerCase().includes("medi")
          ? "Medibroker Ltd"
          : "Chartered Brokers Ltd";

      return [
        v.voucherNumber,
        v.date,
        subsidiaryName,
        v.status.toUpperCase(),
        v.paymentType.toUpperCase().replace("-", " "),
        v.payee.name,
        v.payee.bankName,
        v.payee.bankAccount,
        v.payee.phone || "",
        v.payee.address || "",
        v.payment.description,
        v.payment.invoiceNumber,
        v.payment.amount,
        v.payment.currency,
        v.banking.bankNumber || "",
        v.banking.chequeNumber || "",
        v.authorization.preparedBy,
        v.authorization.approvalToPay,
        v.authorization.receiverName,
        v.createdAt ? new Date(v.createdAt).toLocaleString() : "",
      ];
    });

    const buffer = generateExcelBuffer(columns, data, "Vouchers History");
    const dateStr = new Date().toISOString().slice(0, 10);
    const filename = `cbg-voucher-history-${dateStr}.xlsx`;

    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-store, no-cache, must-revalidate",
      },
    });
  } catch (error) {
    console.error("Failed to generate voucher export:", error);
    return NextResponse.json(
      { error: "Failed to export vouchers to Excel" },
      { status: 500 }
    );
  }
}
