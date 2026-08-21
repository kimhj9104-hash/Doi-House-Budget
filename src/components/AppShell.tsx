import Sidebar from "./Sidebar";
import BottomNav from "./BottomNav";
import TopBar from "./TopBar";

export default function AppShell({
  householdName,
  children,
}: {
  householdName: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen bg-background md:h-screen md:overflow-hidden">
      <Sidebar householdName={householdName} />
      <div className="flex min-w-0 flex-1 flex-col md:overflow-y-auto">
        <TopBar householdName={householdName} />
        <main className="flex-1 pb-20 md:pb-0">{children}</main>
      </div>
      <BottomNav />
    </div>
  );
}
