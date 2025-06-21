import Dashboard from "./dashboard";
import { DashboardLayout } from "@/components/dashboard-layout";

export const metadata = {
  title: "Dashboard - VaultLab",
  description: "VaultLab analytics and revenue dashboard"
};

export default function DashboardPage() {
  return (
    <DashboardLayout>
      <Dashboard />
    </DashboardLayout>
  );
}
