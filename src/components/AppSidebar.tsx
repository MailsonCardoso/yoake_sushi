import { NavLink, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  ShoppingCart,
  ClipboardList,
  ChefHat,
  Grid3X3,
  Building2,
  Settings,
  Ticket,
  UtensilsCrossed,
  Clock3,
  Monitor,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

const navItems = [
  { title: "Dashboard", path: "/", icon: LayoutDashboard },
  { title: "Vendas (PDV)", path: "/sales", icon: ShoppingCart },
  { title: "Cadastros", path: "/registrations", icon: ClipboardList },
  { title: "Cozinha (KDS)", path: "/kitchen", icon: ChefHat },
  { title: "Mesas", path: "/tables", icon: Grid3X3 },
  { title: "Entregas", path: "/delivery", icon: Ticket },
  { title: "Histórico", path: "/history", icon: Clock3 },
  { title: "Monitor TV", path: "/monitor", icon: Monitor },
];

export function AppSidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();

  return (
    <aside
      className={cn(
        "flex flex-col h-screen bg-sidebar text-sidebar-foreground border-r border-sidebar-border transition-all duration-300 shrink-0",
        collapsed ? "w-16" : "w-60"
      )}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 h-16 border-b border-sidebar-border">
        <UtensilsCrossed className="h-7 w-7 text-sidebar-primary shrink-0" />
        {!collapsed && (
          <span className="font-bold text-lg text-sidebar-accent-foreground tracking-tight">
            RestaurantOS
          </span>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 space-y-1 px-2 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors",
                isActive
                  ? "bg-sidebar-accent text-sidebar-primary"
                  : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              )}
            >
              <item.icon className="h-5 w-5 shrink-0" />
              {!collapsed && <span>{item.title}</span>}
            </NavLink>
          );
        })}
      </nav>

      {/* Collapse toggle */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="flex items-center justify-center h-12 border-t border-sidebar-border hover:bg-sidebar-accent transition-colors"
      >
        {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
      </button>
    </aside>
  );
}
