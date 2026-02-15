import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
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
import { Search, Calendar, Filter, FileText, AlertTriangle, Clock, TrendingUp, Utensils, ExternalLink, ChevronRight, MapPin, Bike, Store, Smartphone, Plus } from "lucide-react";
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
    const navigate = useNavigate();
    const [allOrders, setAllOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 15;

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

    // Paginating filtered results
    const totalPages = Math.ceil(filteredOrders.length / itemsPerPage);
    const paginatedOrders = filteredOrders.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    // Grouping only the paginated results for cleaner UI
    const groupedOrders = paginatedOrders.reduce((acc, order) => {
        const date = format(new Date(order.created_at), "yyyy-MM-dd");
        if (!acc[date]) {
            acc[date] = [];
        }
        acc[date].push(order);
        return acc;
    }, {} as Record<string, Order[]>);

    const sortedDates = Object.keys(groupedOrders).sort((a, b) => b.localeCompare(a));

    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, statusFilter]);

    return (
        <div className="min-h-screen bg-[#f8fafc] p-4 lg:p-8">
            <div className="max-w-6xl mx-auto space-y-8">
                {/* Header Section */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div>
                        <h1 className="text-4xl font-black text-slate-900 tracking-tight">Histórico</h1>
                        <p className="text-slate-500 font-medium mt-1">Gestão e acompanhamento de todos os pedidos.</p>
                    </div>
                    <Button
                        variant="outline"
                        onClick={fetchHistory}
                        className="rounded-2xl gap-2 font-bold shadow-sm bg-white border-slate-200 h-12 px-6 hover:bg-slate-50 transition-all"
                    >
                        <Filter className="h-4 w-4 text-indigo-500" /> Atualizar
                    </Button>
                </div>

                {/* Filters Section */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                    <Card className="md:col-span-8 border-none shadow-sm rounded-3xl overflow-hidden bg-white ring-1 ring-slate-200/50">
                        <CardContent className="p-2 flex items-center">
                            <div className="relative flex-1">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                                <Input
                                    placeholder="Procurar por ID, Cliente ou Mesa..."
                                    className="pl-12 h-14 border-none bg-transparent focus-visible:ring-0 text-base font-medium"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="md:col-span-4 border-none shadow-sm rounded-3xl overflow-hidden bg-white ring-1 ring-slate-200/50">
                        <CardContent className="p-2 flex items-center">
                            <Select value={statusFilter} onValueChange={setStatusFilter}>
                                <SelectTrigger className="h-14 border-none bg-transparent focus:ring-0 text-base font-bold text-slate-700">
                                    <SelectValue placeholder="Status" />
                                </SelectTrigger>
                                <SelectContent className="rounded-2xl border-none shadow-xl">
                                    <SelectItem value="all">Todos os Status</SelectItem>
                                    <SelectItem value="Pendente">Pendente</SelectItem>
                                    <SelectItem value="Preparando">Preparando</SelectItem>
                                    <SelectItem value="Pronto">Pronto</SelectItem>
                                    <SelectItem value="Despachado">Despachado</SelectItem>
                                    <SelectItem value="Concluído">Concluído</SelectItem>
                                </SelectContent>
                            </Select>
                        </CardContent>
                    </Card>
                </div>

                {/* History List Grouped by Day */}
                <div className="space-y-10">
                    {loading ? (
                        <div className="py-24 text-center">
                            <div className="inline-flex items-center gap-3 px-6 py-3 rounded-2xl bg-white shadow-sm ring-1 ring-slate-100">
                                <Clock className="h-5 w-5 text-indigo-500 animate-spin" />
                                <span className="font-bold text-slate-500 italic">Sincronizando histórico...</span>
                            </div>
                        </div>
                    ) : sortedDates.length === 0 ? (
                        <div className="py-24 text-center bg-white rounded-[40px] shadow-sm ring-1 ring-slate-100 border border-dashed border-slate-200">
                            <FileText className="h-16 w-16 text-slate-200 mx-auto mb-4" />
                            <h3 className="text-xl font-bold text-slate-800">Nenhum pedido encontrado</h3>
                            <p className="text-slate-400">Tente ajustar seus filtros de busca.</p>
                        </div>
                    ) : (
                        <>
                            {sortedDates.map((date) => (
                                <div key={date} className="space-y-4">
                                    <div className="flex items-center gap-3 px-4">
                                        <h3 className="text-sm font-black text-slate-400 uppercase tracking-[0.2em] tabular-nums">
                                            {format(new Date(date + "T12:00:00"), "EEEE, dd 'de' MMMM", { locale: ptBR })}
                                        </h3>
                                        <div className="h-px bg-slate-200 flex-1 opacity-50"></div>
                                    </div>

                                    <div className="space-y-3">
                                        {groupedOrders[date].map((order) => (
                                            <Card
                                                key={order.id}
                                                className="border-none shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all cursor-pointer group rounded-[2rem] overflow-hidden bg-white ring-1 ring-slate-200/50"
                                                onClick={() => setSelectedOrder(order)}
                                            >
                                                <CardContent className="p-5 flex flex-col md:flex-row items-center justify-between gap-6">
                                                    <div className="flex items-center gap-5 w-full md:w-auto">
                                                        <div className="h-14 w-14 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors">
                                                            <FileText className="h-7 w-7" />
                                                        </div>
                                                        <div>
                                                            <p className="font-black text-xl text-slate-800 tabular-nums">
                                                                #{getOrderConfig(order).prefix}-{order.readable_id.replace(/\D/g, "")}
                                                            </p>
                                                            <p className="text-xs font-bold text-slate-400">
                                                                Lançado às {format(new Date(order.created_at), "HH:mm", { locale: ptBR })}
                                                            </p>
                                                        </div>
                                                    </div>

                                                    <div className="flex flex-1 items-center gap-12 justify-center">
                                                        <div className="hidden lg:block min-w-[140px]">
                                                            <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest mb-1">Cliente / Mesa</p>
                                                            <p className="text-sm font-bold text-slate-700 truncate max-w-[150px]">
                                                                {order.type === 'mesa' ? `Mesa ${order.table?.number}` : order.customer?.name || "Consumidor Final"}
                                                            </p>
                                                        </div>
                                                        <div className="hidden sm:block">
                                                            <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest mb-1">Canal</p>
                                                            <div className={cn("flex items-center gap-2 font-bold", getOrderConfig(order).color)}>
                                                                {(() => {
                                                                    const ConfigIcon = getOrderConfig(order).icon;
                                                                    return <ConfigIcon className="h-4 w-4" />;
                                                                })()}
                                                                <span className="text-xs uppercase tracking-tight">{getOrderConfig(order).label}</span>
                                                            </div>
                                                        </div>
                                                        <div className="text-right sm:text-left">
                                                            <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest mb-1">Total</p>
                                                            <p className="text-lg font-black text-indigo-600 tabular-nums">R$ {Number(order.total).toFixed(2).replace('.', ',')}</p>
                                                        </div>
                                                    </div>

                                                    <div className="flex items-center gap-6 w-full md:w-auto justify-between md:justify-end">
                                                        <Badge variant={statusMap[order.status]?.variant || "outline"} className="h-8 px-4 rounded-xl font-black text-[10px] uppercase tracking-wider">
                                                            {statusMap[order.status]?.label || order.status}
                                                        </Badge>
                                                        <div className="h-10 w-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-300 group-hover:bg-indigo-600 group-hover:text-white transition-all shadow-sm">
                                                            <ChevronRight className="h-5 w-5" />
                                                        </div>
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        ))}
                                    </div>
                                </div>
                            ))}

                            {/* Pagination Controls */}
                            {totalPages > 1 && (
                                <div className="flex items-center justify-center gap-4 py-12">
                                    <Button
                                        variant="outline"
                                        disabled={currentPage === 1}
                                        onClick={() => setCurrentPage(p => p - 1)}
                                        className="rounded-2xl h-12 px-6 font-bold shadow-sm bg-white border-slate-200 disabled:opacity-30 transition-all active:scale-95"
                                    >
                                        Anterior
                                    </Button>
                                    <div className="flex items-center gap-2 hidden md:flex">
                                        {[...Array(totalPages)].map((_, i) => (
                                            <button
                                                key={i}
                                                onClick={() => setCurrentPage(i + 1)}
                                                className={cn(
                                                    "h-12 w-12 rounded-2xl font-bold transition-all active:scale-90",
                                                    currentPage === i + 1
                                                        ? "bg-indigo-600 text-white shadow-xl shadow-indigo-200"
                                                        : "bg-white text-slate-400 hover:bg-slate-50 ring-1 ring-slate-200"
                                                )}
                                            >
                                                {i + 1}
                                            </button>
                                        ))}
                                    </div>
                                    <Button
                                        variant="outline"
                                        disabled={currentPage === totalPages}
                                        onClick={() => setCurrentPage(p => p + 1)}
                                        className="rounded-2xl h-12 px-6 font-bold shadow-sm bg-white border-slate-200 disabled:opacity-30 transition-all active:scale-95"
                                    >
                                        Próximo
                                    </Button>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>

            {/* Order Details Modal */}
            <Dialog open={!!selectedOrder} onOpenChange={() => setSelectedOrder(null)}>
                <DialogContent className="sm:max-w-[500px] rounded-[32px] overflow-hidden p-0 border-none shadow-2xl">
                    <DialogHeader className="sr-only">
                        <DialogTitle>Detalhes do Pedido</DialogTitle>
                        <DialogDescription>Visualize os itens e totais do pedido selecionado.</DialogDescription>
                    </DialogHeader>
                    {selectedOrder && (
                        <div className="flex flex-col">
                            <div className="p-8 pb-4">
                                <div className="flex justify-between items-start mb-6">
                                    <div>
                                        <h2 className="text-2xl font-black text-slate-800 tabular-nums">
                                            #{getOrderConfig(selectedOrder).prefix}-{selectedOrder.readable_id.replace(/\D/g, "")}
                                        </h2>
                                        <p className="text-xs text-muted-foreground font-bold uppercase mt-1">
                                            {format(new Date(selectedOrder.created_at), "EEEE, dd/MM/yyyy - HH:mm", { locale: ptBR })}
                                        </p>
                                    </div>
                                    <Badge variant={statusMap[selectedOrder.status]?.variant || "outline"} className="rounded-lg font-black uppercase text-[10px]">
                                        {selectedOrder.status}
                                    </Badge>
                                </div>

                                <div className="space-y-4 mb-8">
                                    <div className="flex items-center gap-3 p-4 rounded-2xl bg-slate-50 border border-slate-100">
                                        <MapPin className="h-5 w-5 text-slate-400" />
                                        <div>
                                            <p className="text-[10px] font-black uppercase text-slate-400 leading-none tracking-widest">Origem / Destino</p>
                                            <div className="mt-2">
                                                {selectedOrder.type === 'mesa' ? (
                                                    <p className="text-sm font-bold text-slate-700">
                                                        Atendimento em Mesa ({selectedOrder.table?.number})
                                                    </p>
                                                ) : selectedOrder.type === 'delivery' ? (
                                                    <div className="flex flex-col gap-1">
                                                        {selectedOrder.delivery_address && (selectedOrder.delivery_address.includes('http') || selectedOrder.delivery_address.includes('maps')) ? (
                                                            <div className="flex flex-col gap-2">
                                                                <p className="text-sm font-bold text-slate-700">Entrega via Localização:</p>
                                                                <Button variant="outline" size="sm" className="h-8 justify-start gap-2 text-indigo-600 bg-indigo-50 border-indigo-100 font-bold text-xs rounded-xl" asChild>
                                                                    <a href={selectedOrder.delivery_address} target="_blank" rel="noopener noreferrer">
                                                                        <ExternalLink className="h-3 w-3" />
                                                                        Abrir Localização no Maps
                                                                    </a>
                                                                </Button>
                                                            </div>
                                                        ) : (
                                                            <p className="text-sm font-bold text-slate-700 leading-relaxed italic">
                                                                "{selectedOrder.delivery_address}"
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
                                    <h3 className="font-black text-slate-700 text-[10px] uppercase tracking-[0.2em] px-1">Itens do Pedido</h3>
                                    <div className="max-h-[250px] overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                                        {selectedOrder.items.map((item, idx) => (
                                            <div key={idx} className="flex justify-between items-center bg-slate-50/50 p-4 rounded-2xl border border-dashed border-slate-200">
                                                <div className="flex-1">
                                                    <p className="text-sm font-bold text-slate-800">{item.product?.name || "Produto Removido"}</p>
                                                    <p className="text-[10px] text-muted-foreground font-bold tracking-tight">{item.quantity}x • R$ {Number(item.unit_price).toFixed(2).replace('.', ',')}</p>
                                                </div>
                                                <span className="font-black text-sm text-slate-800 tabular-nums">R$ {(item.quantity * item.unit_price).toFixed(2).replace('.', ',')}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <div className="mt-4 p-8 bg-slate-50 border-t border-slate-100 rounded-b-[32px] space-y-3">
                                <div className="flex justify-between text-xs font-bold text-slate-400 px-1 uppercase tracking-widest">
                                    <span>Subtotal</span>
                                    <span className="tabular-nums">R$ {Number(selectedOrder.subtotal).toFixed(2).replace('.', ',')}</span>
                                </div>
                                {selectedOrder.delivery_fee > 0 && (
                                    <div className="flex justify-between text-xs font-bold text-slate-400 px-1 uppercase tracking-widest">
                                        <span>Taxa de Entrega</span>
                                        <span className="tabular-nums">R$ {Number(selectedOrder.delivery_fee).toFixed(2).replace('.', ',')}</span>
                                    </div>
                                )}
                                <div className="h-px bg-slate-200/50 w-full my-2"></div>
                                <div className="flex justify-between items-center text-3xl font-black text-indigo-600 px-1 tabular-nums">
                                    <span className="text-sm text-slate-800 uppercase tracking-widest">Total</span>
                                    <span>R$ {Number(selectedOrder.total).toFixed(2).replace('.', ',')}</span>
                                </div>

                                {selectedOrder.status !== "Concluído" && (
                                    <div className="pt-6">
                                        <Button
                                            className="w-full h-14 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-black gap-3 shadow-xl shadow-indigo-100 transition-all active:scale-[0.98]"
                                            onClick={() => navigate('/sales', { state: { editOrderId: selectedOrder.id } })}
                                        >
                                            <Plus className="h-5 w-5" />
                                            ADICIONAR ITENS
                                        </Button>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}
