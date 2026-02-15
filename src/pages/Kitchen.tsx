import { useApp, Order } from "@/contexts/AppContext";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { ArrowRight, Clock, ChefHat, CheckCircle2 } from "lucide-react";

const columns: { status: Order["status"]; title: string; icon: React.ElementType; colorClass: string }[] = [
  { status: "Pendente", title: "Fila", icon: Clock, colorClass: "text-destructive" },
  { status: "Preparando", title: "Em Preparo", icon: ChefHat, colorClass: "text-status-payment" },
  { status: "Pronto", title: "Pronto", icon: CheckCircle2, colorClass: "text-status-free" },
];

export default function Kitchen() {
  const { orders, updateOrderStatus } = useApp();
  const { toast } = useToast();

  const nextStatus: Record<string, Order["status"]> = {
    Pendente: "Preparando",
    Preparando: "Pronto",
  };

  const handleAdvance = (order: Order) => {
    let next: Order["status"] | undefined = nextStatus[order.status];

    // Se for delivery e estiver pronto, o próximo passo é 'Despachado'
    if (order.status === "Pronto" && order.type === "delivery") {
      next = "Despachado";
    }

    if (next) {
      updateOrderStatus(order.id, next);
      toast({
        title: "Status atualizado!",
        description: `${order.readable_id} → ${next}`,
      });
    }
  };

  const formatTime = (dateString: string) => {
    const d = new Date(dateString);
    return d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
  };

  return (
    <div className="p-6 h-screen flex flex-col">
      <h1 className="text-2xl font-bold mb-4">Cozinha (KDS)</h1>

      <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4 min-h-0">
        {columns.map((col) => {
          const colOrders = orders.filter((o) => o.status === col.status);
          return (
            <div key={col.status} className="flex flex-col min-h-0">
              <div className="flex items-center gap-2 mb-3">
                <col.icon className={`h-5 w-5 ${col.colorClass}`} />
                <h2 className="font-semibold">{col.title}</h2>
                <Badge variant="secondary" className="ml-auto">{colOrders.length}</Badge>
              </div>
              <div className="flex-1 overflow-auto space-y-3 pr-1">
                {colOrders.map((order) => (
                  <Card key={order.id} className="border-none shadow-sm">
                    <CardContent className="p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-sm font-bold text-primary">
                          {order.readable_id}
                          {order.type === 'mesa' && order.table?.number && ` • Mesa ${order.table.number}`}
                        </span>
                        <span className="text-xs text-muted-foreground">{formatTime(order.created_at)}</span>
                      </div>

                      <div className="space-y-1">
                        {order.items.map((item, i) => (
                          <div key={i} className="flex justify-between text-sm">
                            <span>{item.quantity}x {item.product?.name}</span>
                          </div>
                        ))}
                      </div>

                      <div className="flex items-center justify-between">
                        <p className="text-xs text-muted-foreground">
                          {order.type === "mesa" ? `Mesa ${order.table?.number || ""}` :
                            order.type === "delivery" ? `Delivery - ${order.customer?.name || "N/I"}` :
                              "Balcão"}
                        </p>
                        <Badge variant="outline" className="text-[10px] h-4">{order.type}</Badge>
                      </div>

                      {col.status !== "Pronto" || order.type === "delivery" ? (
                        <Button
                          size="sm"
                          className="w-full"
                          variant={col.status === "Pronto" ? "default" : "secondary"}
                          onClick={() => handleAdvance(order)}
                        >
                          {col.status === "Pendente" ? "Preparar" :
                            col.status === "Preparando" ? "Marcar como Pronto" :
                              "Despachar"}
                          <ArrowRight className="h-4 w-4 ml-1" />
                        </Button>
                      ) : (
                        <div className="py-2 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest bg-slate-50 rounded-xl">
                          Aguardando Retirada
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
                {colOrders.length === 0 && (
                  <p className="text-center text-muted-foreground text-sm py-8">Nenhum pedido</p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
