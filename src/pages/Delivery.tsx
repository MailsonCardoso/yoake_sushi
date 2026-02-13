import { useApp, Order } from "@/contexts/AppContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MapPin, Phone, CheckCircle2, Navigation, Package } from "lucide-react";

export default function Delivery() {
    const { orders, updateOrderStatus } = useApp();

    const readyToDispatch = orders.filter(o => o.status === "Pronto" && o.type === "delivery");
    const onTheWay = orders.filter(o => o.status === "Despachado");

    const handleStatusUpdate = (orderId: string, nextStatus: Order["status"]) => {
        updateOrderStatus(orderId, nextStatus);
    };

    return (
        <div className="p-6 max-w-5xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold flex items-center gap-2">
                    <Package className="h-6 w-6 text-primary" />
                    Portal do Entregador
                </h1>
                <div className="flex gap-2">
                    <Badge variant="outline">{readyToDispatch.length} Para Coleta</Badge>
                    <Badge variant="default" className="bg-status-payment">{onTheWay.length} Em Trânsito</Badge>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Coluna: Disponíveis para Coleta */}
                <section className="space-y-4">
                    <h2 className="text-lg font-semibold flex items-center gap-2 text-muted-foreground">
                        <Package className="h-5 w-5" />
                        Disponíveis para Coleta
                    </h2>
                    {readyToDispatch.map(order => (
                        <Card key={order.id} className="border-l-4 border-l-primary shadow-sm">
                            <CardContent className="p-4 space-y-4">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <span className="text-xs font-bold text-muted-foreground">{order.readable_id}</span>
                                        <h3 className="font-bold text-lg">{order.customer?.name || "Cliente Final"}</h3>
                                    </div>
                                    <Badge variant="secondary">R$ {Number(order.total).toFixed(2)}</Badge>
                                </div>

                                <div className="space-y-2">
                                    <div className="flex items-start gap-2 text-sm">
                                        <MapPin className="h-4 w-4 mt-1 shrink-0 text-muted-foreground" />
                                        <span className="leading-tight">{order.delivery_address || order.customer?.address || "Retirada no local"}</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-sm">
                                        <Phone className="h-4 w-4 shrink-0 text-muted-foreground" />
                                        <span>{order.customer?.phone || "N/I"}</span>
                                    </div>
                                </div>

                                <div className="flex gap-2 pt-2">
                                    <Button
                                        className="flex-1 gap-2"
                                        onClick={() => handleStatusUpdate(order.id, "Despachado")}
                                    >
                                        <Navigation className="h-4 w-4" />
                                        Iniciar Entrega
                                    </Button>
                                    {order.customer?.location_link && (
                                        <Button variant="outline" size="icon" asChild>
                                            <a href={order.customer.location_link} target="_blank" rel="noopener noreferrer">
                                                <MapPin className="h-4 w-4" />
                                            </a>
                                        </Button>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                    {readyToDispatch.length === 0 && (
                        <div className="text-center py-12 border-2 border-dashed rounded-lg text-muted-foreground text-sm">
                            Nenhum pedido pronto para coleta.
                        </div>
                    )}
                </section>

                {/* Coluna: Em Trânsito / Minhas Entregas */}
                <section className="space-y-4">
                    <h2 className="text-lg font-semibold flex items-center gap-2 text-status-payment">
                        <Navigation className="h-5 w-5" />
                        Em Trânsito
                    </h2>
                    {onTheWay.map(order => (
                        <Card key={order.id} className="border-l-4 border-l-status-payment shadow-sm">
                            <CardContent className="p-4 space-y-4">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <span className="text-xs font-bold text-muted-foreground">{order.readable_id}</span>
                                        <h3 className="font-bold text-lg">{order.customer?.name || "Cliente Final"}</h3>
                                    </div>
                                    <Badge className="bg-status-payment">R$ {Number(order.total).toFixed(2)}</Badge>
                                </div>

                                <div className="space-y-2">
                                    <div className="flex items-start gap-2 text-sm">
                                        <MapPin className="h-4 w-4 mt-1 shrink-0 text-muted-foreground" />
                                        <span className="leading-tight">{order.delivery_address || order.customer?.address}</span>
                                    </div>
                                </div>

                                <Button
                                    className="w-full gap-2 bg-status-free hover:bg-status-free/90"
                                    onClick={() => handleStatusUpdate(order.id, "Concluído")}
                                >
                                    <CheckCircle2 className="h-4 w-4" />
                                    Confirmar Entrega
                                </Button>
                            </CardContent>
                        </Card>
                    ))}
                    {onTheWay.length === 0 && (
                        <div className="text-center py-12 border-2 border-dashed rounded-lg text-muted-foreground text-sm">
                            Nenhuma entrega em trânsito.
                        </div>
                    )}
                </section>
            </div>
        </div>
    );
}
