import DashboardLayout from "@/components/layout/dashboard-layout";
import TeamDashboard from "@/components/team/team-dashboard";
import ChatWidget from "@/components/chat/chat-widget";
import { useAuth } from "@/hooks/use-auth";

export default function TeamDashboardPage() {
  const { user } = useAuth();

  if (!user) {
    return <div>Loading...</div>;
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">דשבורד צוות</h1>
            <p className="text-gray-600 mt-1">ניהול משימות וחברי צוות</p>
          </div>
        </div>

        <TeamDashboard />
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