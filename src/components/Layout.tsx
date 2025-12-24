import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "./AppSidebar";
import { NotificationBell } from "./NotificationBell";
import { ReactNode } from "react";
import { InteractiveMenu } from "./ui/modern-mobile-menu";

export function Layout({ children }: { children: ReactNode }) {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <header className="h-14 border-b border-border flex items-center justify-between px-4 bg-card/50 backdrop-blur-sm sticky top-0 z-10">
            <SidebarTrigger className="text-secondary" />
            <NotificationBell />
          </header>
          <main className="flex-1 p-3 md:p-6 pb-20 md:pb-6">
            {children}
          </main>
          <InteractiveMenu />
        </div>
      </div>
    </SidebarProvider>
  );
}