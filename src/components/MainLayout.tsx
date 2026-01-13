import { Outlet, useLocation } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import { BottomNav } from "./BottomNav";

export function MainLayout() {
  const location = useLocation();
  
  // Routes where we never want to show the specific layout wrappers (like Game Rooms)
  // Although Sidebar handles its own hiding logic based on responsive classes,
  // we might want to hide the wrapper padding if needed.
  // For now, consistent layout is better.
  
  // Hide layout completely on Auth and Landing (if separate)
  // Assuming Landing is public and doesn't use this layout? 
  // Wait, plan said "Wrap authenticated routes with <MainLayout>".
  
  return (
    <div className="min-h-screen bg-background">
      {/* Desktop Sidebar */}
      <Sidebar />

      {/* Main Content Area */}
      {/* Add left margin for sidebar on large screens */}
      {/* Add bottom padding for mobile nav */}
      <main className="md:pl-64 min-h-screen w-full relative">
        <Outlet />
      </main>

      {/* Mobile Bottom Navigation */}
      <BottomNav />
    </div>
  );
}
