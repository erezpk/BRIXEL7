import DashboardLayout from "@/components/layout/dashboard-layout";
import LeadsList from "@/components/leads/leads-list";
import ChatWidget from "@/components/chat/chat-widget";
import { useAuth } from "@/hooks/use-auth";

export default function LeadsManagementPage() {
  const { user } = useAuth();

  if (!user) {
    return <div>Loading...</div>;
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">ניהול לידים</h1>
            <p className="text-gray-600 mt-1">לידים מ-Facebook ו-Google Ads</p>
          </div>
        </div>

        <LeadsList showClientColumn={true} />
      </div>

      {/* Chat Widget */}
      <ChatWidget
        currentUserId={user.id}
        currentUserName={user.fullName}
        isAdmin={user.role === 'agency_admin' || user.role === 'super_admin'}
      />
    </DashboardLayout>
  );
}