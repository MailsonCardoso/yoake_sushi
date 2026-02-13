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
} from "lucide-react";

export default function Dashboard() {
  const { orders, tables } = useApp();

  const totalRevenue = orders.reduce((sum, o) => sum + o.total, 0);
  const activeOrders = orders.filter((o) => o.status !== "done").length;
  const occupiedTables = tables.filter((t) => t.status === "occupied").length;

  const kpis = [
    { title: "iFood", value: "R$ 1.240,00", icon: Smartphone, colorClass: "kpi-ifood" },
    { title: "Balcão", value: "R$ 890,00", icon: Store, colorClass: "kpi-counter" },
    { title: "Delivery", value: "R$ 650,00", icon: Truck, colorClass: "kpi-delivery" },
    { title: "Receita Total", value: `R$ ${totalRevenue.toFixed(2).replace(".", ",")}`, icon: DollarSign, colorClass: "kpi-total" },
  ];

  const recentOrders = orders.slice(0, 5);

  const statusMap: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
    pending: { label: "Pendente", variant: "destructive" },
    preparing: { label: "Preparando", variant: "default" },
    ready: { label: "Pronto", variant: "secondary" },
    done: { label: "Entregue", variant: "outline" },
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground text-sm">Visão geral do seu restaurante</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
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
                      {order.id}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      {order.items.map((i) => `${i.quantity}x ${i.product.name}`).join(", ")}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium">
                      R$ {order.total.toFixed(2).replace(".", ",")}
                    </span>
                    <Badge variant={statusMap[order.status].variant}>
                      {statusMap[order.status].label}
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
            <div className="p-3 rounded-lg bg-destructive/10 text-sm">
              <p className="font-medium text-destructive">Estoque Baixo</p>
              <p className="text-muted-foreground mt-1">Coca-Cola 350ml - apenas 5 unidades</p>
            </div>
            <div className="p-3 rounded-lg bg-status-payment/10 text-sm">
              <p className="font-medium text-status-payment">Mesa Aguardando</p>
              <p className="text-muted-foreground mt-1">Mesa 6 aguardando pagamento há 15 min</p>
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
