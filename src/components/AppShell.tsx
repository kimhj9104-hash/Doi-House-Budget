import TopBar from "./TopBar";
import BottomNav from "./BottomNav";

export default function AppShell({
  householdName,
  children,
}: {
  householdName: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen justify-center bg-background-outer">
      <div className="flex min-h-screen w-full max-w-md flex-col bg-background">
        <TopBar householdName={householdName} />
        <main
          className="flex-1"
          style={{ paddingBottom: "calc(5rem + env(safe-area-inset-bottom))" }}
        >
          {children}
        </main>
        <BottomNav />
      </div>
    </div>
  );
}
