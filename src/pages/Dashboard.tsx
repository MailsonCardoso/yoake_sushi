import { useApp } from "@/contexts/AppContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Smartphone,
  Store,
  Truck,
  DollarSign,
  AlertTriangle,
  Clock,
  TrendingUp,
  Utensils,
  ExternalLink,
} from "lucide-react";

export default function Dashboard() {
  const { orders, tables } = useApp();

  const totalRevenue = orders.reduce((sum, o) => sum + Number(o.total), 0);
  const activeOrders = orders.filter((o) => o.status !== "Concluído").length;
  const occupiedTables = tables.filter((t) => t.status === "Ocupada").length;

  const revenueByChannel = (channel: string) => {
    return orders
      .filter(o => o.channel === channel)
      .reduce((sum, o) => sum + Number(o.total), 0);
  };

  const revenueByType = (type: string) => {
    return orders
      .filter(o => o.type === type)
      .reduce((sum, o) => sum + Number(o.total), 0);
  };

  const kpis = [
    { title: "iFood", value: `R$ ${revenueByChannel("iFood").toFixed(2).replace(".", ",")}`, icon: Smartphone, colorClass: "kpi-ifood" },
    { title: "Balcão", value: `R$ ${revenueByChannel("Balcão").toFixed(2).replace(".", ",")}`, icon: Store, colorClass: "kpi-counter" },
    { title: "Delivery", value: `R$ ${revenueByChannel("WhatsApp").toFixed(2).replace(".", ",")}`, icon: Truck, colorClass: "kpi-delivery" },
    { title: "Mesas", value: `R$ ${revenueByType("mesa").toFixed(2).replace(".", ",")}`, icon: Utensils, colorClass: "bg-indigo-500/10 text-indigo-500" },
    { title: "Receita Total", value: `R$ ${totalRevenue.toFixed(2).replace(".", ",")}`, icon: DollarSign, colorClass: "kpi-total" },
  ];

  const recentOrders = orders.slice(0, 5);

  const statusMap: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
    Pendente: { label: "Pendente", variant: "destructive" },
    Preparando: { label: "Preparando", variant: "default" },
    Pronto: { label: "Pronto", variant: "secondary" },
    Despachado: { label: "Em Trânsito", variant: "default" },
    Concluído: { label: "Entregue", variant: "outline" },
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground text-sm">Visão geral do seu restaurante</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {kpis.map((kpi) => (
          <Card key={kpi.title} className="border-none shadow-sm">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{kpi.title}</p>
                  <p className="text-2xl font-bold mt-1">{kpi.value}</p>
                </div>
                <div className={`p-3 rounded-xl ${kpi.colorClass}`}>
                  <kpi.icon className="h-5 w-5" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Orders */}
        <Card className="lg:col-span-2 border-none shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Clock className="h-5 w-5 text-primary" />
              Pedidos Recentes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentOrders.map((order) => (
                <div
                  key={order.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-secondary/50"
                >
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-sm font-semibold text-primary">
                      {order.readable_id}
                    </span>
                    <span className="text-sm text-muted-foreground truncate max-w-[200px]">
                      {order.items.map((i) => `${i.quantity}x ${i.product?.name || "Prod"}`).join(", ")}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium">
                      R$ {Number(order.total).toFixed(2).replace(".", ",")}
                    </span>
                    <Badge variant={statusMap[order.status]?.variant || "outline"}>
                      {statusMap[order.status]?.label || order.status}
                    </Badge>
                  </div>
                </div>
              ))}
              {recentOrders.length === 0 && (
                <p className="text-center text-muted-foreground py-8">Nenhum pedido ainda</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Alerts */}
        <Card className="border-none shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-status-payment" />
              Alertas do Sistema
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="p-3 rounded-lg bg-status-payment/10 text-sm">
              <p className="font-medium text-status-payment">Fluxo de Caixa</p>
              <p className="text-muted-foreground mt-1">Grande volume de pedidos pelo iFood hoje</p>
            </div>
            <div className="p-3 rounded-lg bg-primary/10 text-sm">
              <p className="font-medium text-primary">Pedidos Ativos</p>
              <p className="text-muted-foreground mt-1">{activeOrders} pedidos em andamento</p>
            </div>
            <div className="p-3 rounded-lg bg-status-free/10 text-sm">
              <p className="font-medium text-status-free">Mesas Ocupadas</p>
              <p className="text-muted-foreground mt-1">{occupiedTables} de {tables.length} mesas</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
