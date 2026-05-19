import { NextRequest, NextResponse } from "next/server";
import { sendInvoiceEmail } from "@/lib/email";

// Temporary test endpoint — remove after testing
export async function GET(req: NextRequest) {
  const secret = req.nextUrl.searchParams.get("secret");
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await sendInvoiceEmail({
    to: "kravdoesntlift@gmail.com",
    clientName: "André",
    amountEur: "€ 127,00",
    periodEnd: "19 de junho de 2026",
    invoiceNumber: "KRAV-TEST-001",
  });

  return NextResponse.json({ sent: true });
}
