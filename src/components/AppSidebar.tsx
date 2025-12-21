import { Home, BookOpen, TrendingUp, Settings, LogOut, User, Users, Target, Compass, Link2, ShoppingBag, UserCheck } from "lucide-react";
import { NavLink, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { useTheme } from "next-themes";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import { AdminBadge } from "./AdminBadge";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import logo from "@/assets/logo-bora.png";
import logoLight from "@/assets/logo-bora-light.png";

const menuItems = [
  { title: "Início", url: "/dashboard", icon: Home },
  { title: "Trilha & Conteúdo", url: "/trilha", icon: BookOpen },
  { title: "Painel de Controle", url: "/resultados", icon: TrendingUp },
  { title: "Metas", url: "/metas", icon: Target },
  { title: "Área de Membros", url: "/membros", icon: Users },
  { title: "Navegador", url: "/navegador", icon: Compass },
  { title: "Links Úteis", url: "/links", icon: Link2 },
  { title: "Loja", url: "/loja", icon: ShoppingBag },
  { title: "Mentorados", url: "/mentorados", icon: UserCheck, adminOnly: true },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const { theme } = useTheme();
  const navigate = useNavigate();
  const { isAdmin } = useIsAdmin();

  // Buscar dados do usuário e perfil
  const { data: userData } = useQuery({
    queryKey: ["sidebar-profile"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .maybeSingle();

      return { user, profile };
    },
  });


  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast.error("Erro ao sair");
    } else {
      toast.success("Até logo! 👋");
      navigate("/auth");
    }
  };

  return (
    <Sidebar className={state === "collapsed" ? "w-14" : "w-60"} collapsible="icon">
      <SidebarContent className="bg-sidebar">
        {state !== "collapsed" && (
          <div className="p-3 flex justify-center">
            <img
              src={theme === "light" ? logoLight : logo}
              alt="BORA Acelerar"
              className="h-24 w-auto"
            />
          </div>
        )}

        <SidebarGroup>
          <SidebarGroupLabel className="text-white">Navegação</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems
                .filter((item) => !item.adminOnly || isAdmin)
                .map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild>
                    <NavLink
                        to={item.url}
                        className={({ isActive }) =>
                          isActive
                            ? "bg-secondary text-secondary-foreground font-semibold rounded-lg border-l-4 border-primary [&>svg]:text-primary pl-3 shadow-lg"
                            : "text-sidebar-foreground [&>svg]:text-muted-foreground hover:bg-secondary/20 hover:text-sidebar-foreground rounded-lg transition-colors pl-4"
                        }
                      >
                        <item.icon className="h-5 w-5 transition-colors" strokeWidth={1.5} />
                        {state !== "collapsed" && <span>{item.title}</span>}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <div className="mt-auto border-t border-sidebar-border">
          {/* Perfil do Usuário */}
          {state !== "collapsed" && userData?.profile && (
            <div className="p-4 border-b border-sidebar-border">
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10 border-2 border-primary/20">
                  <AvatarImage src={userData.profile.foto_url} alt={userData.profile.nome_completo} />
                  <AvatarFallback className="bg-primary/10 text-primary text-sm">
                    {userData.profile.nome_completo?.charAt(0) || <User className="h-4 w-4" />}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-sidebar-foreground truncate">
                    {userData.profile.apelido || userData.profile.nome_completo}
                  </p>
                  <p className="text-xs text-sidebar-foreground/70 truncate">
                    {userData.user.email}
                  </p>
                  {isAdmin && (
                    <div className="mt-1">
                      <AdminBadge />
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Avatar mini quando colapsado */}
          {state === "collapsed" && userData?.profile && (
            <div className="p-2 border-b border-sidebar-border flex justify-center">
              <Avatar className="h-8 w-8 border-2 border-primary/20">
                <AvatarImage src={userData.profile.foto_url} alt={userData.profile.nome_completo} />
                <AvatarFallback className="bg-primary/10 text-primary text-xs">
                  {userData.profile.nome_completo?.charAt(0) || <User className="h-3 w-3" />}
                </AvatarFallback>
              </Avatar>
            </div>
          )}

          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton asChild>
                <NavLink
                  to="/configuracoes"
                  className={({ isActive }) =>
                    isActive
                      ? "bg-secondary text-secondary-foreground font-semibold rounded-lg border-l-4 border-primary [&>svg]:text-primary pl-3 shadow-lg"
                      : "text-sidebar-foreground [&>svg]:text-muted-foreground hover:bg-secondary/20 hover:text-sidebar-foreground rounded-lg transition-colors pl-4"
                    }
                >
                  <Settings className="h-5 w-5 transition-colors" strokeWidth={1.5} />
                  {state !== "collapsed" && <span>Configurações</span>}
                </NavLink>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton onClick={handleLogout} className="text-sidebar-foreground [&>svg]:text-muted-foreground hover:bg-secondary/20 hover:text-sidebar-foreground rounded-lg transition-colors pl-4">
                <LogOut className="h-5 w-5 transition-colors" strokeWidth={1.5} />
                {state !== "collapsed" && <span>Sair</span>}
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </div>
      </SidebarContent>
    </Sidebar>
  );
}