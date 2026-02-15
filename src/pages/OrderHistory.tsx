import { useState, useEffect } from "react";
import { useApp, Order } from "@/contexts/AppContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";
import { Search, Calendar, Filter, FileText, AlertTriangle, Clock, TrendingUp, Utensils, ExternalLink, ChevronRight, MapPin, Bike, Store, Smartphone } from "lucide-react";
import axios from "axios";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";

const API_URL = "https://api2.platformx.com.br/api";

const statusMap: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
    Pendente: { label: "Pendente", variant: "destructive" },
    Preparando: { label: "Preparando", variant: "default" },
    Pronto: { label: "Pronto", variant: "secondary" },
    Despachado: { label: "Em Trânsito", variant: "default" },
    Concluído: { label: "Concluído", variant: "outline" },
};

const channelConfig: Record<string, { icon: any; color: string; label: string; prefix: string }> = {
    iFood: { icon: Bike, color: "text-red-500", label: "iFood", prefix: "IF" },
    Balcão: { icon: Store, color: "text-slate-600", label: "Balcão", prefix: "PED" },
    WhatsApp: { icon: Smartphone, color: "text-emerald-500", label: "Delivery", prefix: "WPP" },
    Outros: { icon: FileText, color: "text-slate-400", label: "Outros", prefix: "PED" },
};

const getOrderConfig = (order: Order) => {
    if (order.channel === "iFood") return channelConfig.iFood;
    if (order.channel === "WhatsApp" || order.type === "delivery") return channelConfig.WhatsApp;
    if (order.channel === "Balcão") return channelConfig.Balcão;
    return channelConfig.Outros;
};

export default function OrderHistory() {
    const [allOrders, setAllOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

    const fetchHistory = async () => {
        try {
            setLoading(true);
            const res = await axios.get(`${API_URL}/orders`);
            setAllOrders(res.data);
        } catch (error) {
            console.error("Erro ao buscar histórico:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchHistory();
    }, []);

    const filteredOrders = allOrders.filter((order) => {
        const matchesSearch =
            order.readable_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
            order.customer?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            order.table?.number?.toString().includes(searchTerm);

        const matchesStatus = statusFilter === "all" || order.status === statusFilter;

        return matchesSearch && matchesStatus;
    });

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-6">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black text-slate-800">Histórico de Pedidos</h1>
                    <p className="text-muted-foreground text-sm">Registro completo de todas as operações realizadas.</p>
                </div>
                <Button variant="outline" onClick={fetchHistory} className="rounded-xl gap-2 font-bold">
                    <Filter className="h-4 w-4" /> Atualizar Lista
                </Button>
            </div>

            {/* Filters */}
            <Card className="border-none shadow-sm rounded-2xl overflow-hidden bg-white/50 backdrop-blur-sm">
                <CardContent className="p-4 flex flex-col md:flex-row gap-4">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Buscar por ID, Cliente ou Mesa..."
                            className="pl-10 h-11 rounded-xl bg-white"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <div className="w-full md:w-48">
                        <Select value={statusFilter} onValueChange={setStatusFilter}>
                            <SelectTrigger className="h-11 rounded-xl bg-white">
                                <SelectValue placeholder="Status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Todos os Status</SelectItem>
                                <SelectItem value="Pendente">Pendente</SelectItem>
                                <SelectItem value="Preparando">Preparando</SelectItem>
                                <SelectItem value="Pronto">Pronto</SelectItem>
                                <SelectItem value="Despachado">Despachado</SelectItem>
                                <SelectItem value="Concluído">Concluído</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </CardContent>
            </Card>

            {/* History List */}
            <div className="grid grid-cols-1 gap-3">
                {loading ? (
                    <div className="py-20 text-center text-muted-foreground italic">Carregando registros...</div>
                ) : filteredOrders.length === 0 ? (
                    <div className="py-20 text-center text-muted-foreground">Nenhum pedido encontrado.</div>
                ) : (
                    filteredOrders.map((order) => (
                        <Card
                            key={order.id}
                            className="border-none shadow-sm hover:shadow-md transition-all cursor-pointer group rounded-xl overflow-hidden"
                            onClick={() => setSelectedOrder(order)}
                        >
                            <CardContent className="p-4 flex flex-col md:flex-row items-center justify-between gap-4">
                                <div className="flex items-center gap-4 w-full md:w-auto">
                                    <div className="h-12 w-12 rounded-xl bg-slate-100 flex items-center justify-center text-slate-500">
                                        <FileText className="h-6 w-6" />
                                    </div>
                                    <div>
                                        <p className="font-black text-slate-800">
                                            #{getOrderConfig(order).prefix}-{order.readable_id.replace(/\D/g, "")}
                                        </p>
                                        <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">
                                            {format(new Date(order.created_at), "dd 'de' MMMM 'às' HH:mm", { locale: ptBR })}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex flex-1 items-center gap-8 justify-center">
                                    <div className="text-center md:text-left">
                                        <p className="text-[10px] text-muted-foreground uppercase font-black">Cliente / Local</p>
                                        <p className="text-sm font-bold truncate max-w-[150px]">
                                            {order.type === 'mesa' ? `Mesa ${order.table?.number}` : order.customer?.name || "Consumidor Final"}
                                        </p>
                                    </div>
                                    <div className="text-center md:text-left">
                                        <p className="text-[10px] text-muted-foreground uppercase font-black mb-1">Canal</p>
                                        <div className={cn("flex items-center gap-2 font-bold", getOrderConfig(order).color)}>
                                            {(() => {
                                                const ConfigIcon = getOrderConfig(order).icon;
                                                return <ConfigIcon className="h-4 w-4" />;
                                            })()}
                                            <span className="text-sm">{getOrderConfig(order).label}</span>
                                        </div>
                                    </div>
                                    <div className="text-center md:text-left">
                                        <p className="text-[10px] text-muted-foreground uppercase font-black">Total</p>
                                        <p className="text-sm font-black text-primary">R$ {Number(order.total).toFixed(2).replace('.', ',')}</p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-4 w-full md:w-auto justify-between md:justify-end">
                                    <Badge variant={statusMap[order.status]?.variant || "outline"} className="h-7 px-3 font-bold">
                                        {statusMap[order.status]?.label || order.status}
                                    </Badge>
                                    <ChevronRight className="h-5 w-5 text-slate-300 group-hover:text-primary transition-colors" />
                                </div>
                            </CardContent>
                        </Card>
                    ))
                )}
            </div>

            {/* Order Details Modal */}
            <Dialog open={!!selectedOrder} onOpenChange={() => setSelectedOrder(null)}>
                <DialogContent className="sm:max-w-[500px] rounded-[32px] overflow-hidden p-0">
                    <DialogHeader className="sr-only">
                        <DialogTitle>Detalhes do Pedido</DialogTitle>
                        <DialogDescription>Visualize os itens e totais do pedido selecionado.</DialogDescription>
                    </DialogHeader>
                    {selectedOrder && (
                        <div className="flex flex-col">
                            <div className="p-8 pb-4">
                                <div className="flex justify-between items-start mb-6">
                                    <div>
                                        <h2 className="text-2xl font-black text-slate-800">
                                            #{getOrderConfig(selectedOrder).prefix}-{selectedOrder.readable_id.replace(/\D/g, "")}
                                        </h2>
                                        <p className="text-xs text-muted-foreground font-bold uppercase mt-1">
                                            {format(new Date(selectedOrder.created_at), "EEEE, dd/MM/yyyy - HH:mm", { locale: ptBR })}
                                        </p>
                                    </div>
                                    <Badge variant={statusMap[selectedOrder.status]?.variant || "outline"}>
                                        {selectedOrder.status}
                                    </Badge>
                                </div>

                                <div className="space-y-4 mb-8">
                                    <div className="flex items-center gap-3 p-4 rounded-2xl bg-slate-50 border border-slate-100">
                                        <MapPin className="h-5 w-5 text-slate-400" />
                                        <div>
                                            <p className="text-[10px] font-black uppercase text-slate-400 leading-none">Origem / Destino</p>
                                            <div className="mt-1">
                                                {selectedOrder.type === 'mesa' ? (
                                                    <p className="text-sm font-bold text-slate-700">
                                                        Atendimento em Mesa ({selectedOrder.table?.number})
                                                    </p>
                                                ) : selectedOrder.type === 'delivery' ? (
                                                    <div className="flex flex-col gap-1">
                                                        {selectedOrder.delivery_address && (selectedOrder.delivery_address.includes('http') || selectedOrder.delivery_address.includes('maps')) ? (
                                                            <div className="flex flex-col gap-2">
                                                                <p className="text-sm font-bold text-slate-700">Entrega via Localização:</p>
                                                                <Button variant="outline" size="sm" className="h-8 justify-start gap-2 text-indigo-600 bg-indigo-50 border-indigo-100 font-bold text-xs" asChild>
                                                                    <a href={selectedOrder.delivery_address} target="_blank" rel="noopener noreferrer">
                                                                        <ExternalLink className="h-3 w-3" />
                                                                        Abrir Localização no Maps
                                                                    </a>
                                                                </Button>
                                                            </div>
                                                        ) : (
                                                            <p className="text-sm font-bold text-slate-700">
                                                                Entrega: {selectedOrder.delivery_address}
                                                            </p>
                                                        )}
                                                    </div>
                                                ) : (
                                                    <p className="text-sm font-bold text-slate-700">Venda Direta / Balcão</p>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <h3 className="font-black text-slate-700 text-sm uppercase px-1">Itens do Pedido</h3>
                                    <div className="max-h-[250px] overflow-y-auto space-y-2 pr-1">
                                        {selectedOrder.items.map((item, idx) => (
                                            <div key={idx} className="flex justify-between items-center bg-slate-50/50 p-3 rounded-xl border border-dotted border-slate-200">
                                                <div className="flex-1">
                                                    <p className="text-sm font-bold text-slate-800">{item.product?.name || "Produto Removido"}</p>
                                                    <p className="text-[10px] text-muted-foreground font-bold">{item.quantity}x R$ {Number(item.unit_price).toFixed(2)}</p>
                                                </div>
                                                <span className="font-black text-sm text-slate-700">R$ {(item.quantity * item.unit_price).toFixed(2).replace('.', ',')}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <div className="mt-4 p-8 bg-slate-100/80 backdrop-blur-sm border-t space-y-2">
                                <div className="flex justify-between text-sm font-bold text-slate-500 px-1">
                                    <span>Subtotal</span>
                                    <span>R$ {Number(selectedOrder.subtotal).toFixed(2).replace('.', ',')}</span>
                                </div>
                                {selectedOrder.delivery_fee > 0 && (
                                    <div className="flex justify-between text-sm font-bold text-slate-500 px-1">
                                        <span>Taxa de Entrega</span>
                                        <span>R$ {Number(selectedOrder.delivery_fee).toFixed(2).replace('.', ',')}</span>
                                    </div>
                                )}
                                <div className="flex justify-between items-center text-2xl font-black text-primary px-1 pt-2">
                                    <span>Total</span>
                                    <span>R$ {Number(selectedOrder.total).toFixed(2).replace('.', ',')}</span>
                                </div>
                                <p className="text-center text-[10px] font-bold text-slate-400 mt-6 uppercase tracking-widest">
                                    Canal de Venda: {selectedOrder.channel}
                                </p>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}
