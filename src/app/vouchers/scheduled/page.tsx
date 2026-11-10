import { getScheduledVouchersAction } from "@/server/scheduled-vouchers";
import { ScheduledVouchersClient } from "@/components/vouchers/ScheduledVouchersClient";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function ScheduledVouchersPage() {
  const initialSchedules = await getScheduledVouchersAction();
  return <ScheduledVouchersClient initialSchedules={initialSchedules} />;
}
