import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useApp, Order } from "@/contexts/AppContext";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";
import {
    Search,
    Clock,
    CreditCard,
    Plus,
    ChevronRight,
    User,
    MapPin,
    Store,
    Bike,
    Smartphone,
    Timer,
    DollarSign,
    Receipt,
    ClipboardList,
    AlertCircle
} from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { toast } from "@/components/ui/use-toast";

const statusMap: Record<string, { label: string; color: string; bg: string }> = {
    Pendente: { label: "Pendente", color: "text-red-600", bg: "bg-red-50" },
    Preparando: { label: "Cozinha", color: "text-blue-600", bg: "bg-blue-50" },
    Pronto: { label: "Pronto", color: "text-emerald-600", bg: "bg-emerald-50" },
    Despachado: { label: "Entrega", color: "text-indigo-600", bg: "bg-indigo-50" },
};

export default function ActiveOrders() {
    const navigate = useNavigate();
    const { orders, payOrder, fetchData, cashStatus } = useApp();
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedOrderForPayment, setSelectedOrderForPayment] = useState<Order | null>(null);

    // Filter only non-completed orders
    const activeOrders = orders.filter(o => o.status !== "Concluído" && o.status !== "Cancelado");

    const filteredOrders = activeOrders.filter(order =>
        order.readable_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.customer?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.table?.number?.toString().includes(searchTerm)
    );

    const handleConfirmPayment = async (method: string) => {
        if (!selectedOrderForPayment) return;

        try {
            await payOrder(selectedOrderForPayment.id, {
                payment_method: method,
                payment_account: method,
                cash_register_id: cashStatus?.register?.id
            });
            setSelectedOrderForPayment(null);
            fetchData();
        } catch (error) {
            console.error("Erro ao pagar:", error);
        }
    };

    return (
        <div className="min-h-screen bg-[#f8fafc] p-6 lg:p-10">
            <div className="max-w-7xl mx-auto space-y-8">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div>
                        <div className="flex items-center gap-3 mb-1">
                            <div className="h-10 w-10 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-200">
                                <ClipboardList className="h-6 w-6" />
                            </div>
                            <h1 className="text-4xl font-black text-slate-900 tracking-tight">Monitor de Pedidos</h1>
                        </div>
                        <p className="text-slate-500 font-medium ml-1">Gerencie a produção e finalize os pagamentos.</p>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="text-right hidden sm:block">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Total em aberto</p>
                            <p className="text-2xl font-black text-slate-800">
                                R$ {activeOrders.reduce((sum, o) => sum + Number(o.total), 0).toFixed(2).replace('.', ',')}
                            </p>
                        </div>
                        <Button
                            onClick={() => navigate('/sales')}
                            className="h-14 px-8 rounded-[2rem] bg-indigo-600 hover:bg-indigo-700 font-black gap-3 shadow-xl shadow-indigo-100 transition-all active:scale-95"
                        >
                            <Plus className="h-6 w-6" />
                            NOVO PEDIDO
                        </Button>
                    </div>
                </div>

                {/* Search Bar */}
                <Card className="border-none shadow-sm rounded-[2.5rem] overflow-hidden bg-white ring-1 ring-slate-200/50">
                    <CardContent className="p-2 flex items-center">
                        <Search className="ml-4 h-6 w-6 text-slate-300" />
                        <Input
                            placeholder="Buscar por ID, Mesa ou Cliente..."
                            className="h-14 border-none bg-transparent focus-visible:ring-0 text-lg font-medium placeholder:text-slate-300"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </CardContent>
                </Card>

                {/* Grid of Cards */}
                {filteredOrders.length === 0 ? (
                    <div className="py-32 text-center bg-white rounded-[3rem] border border-dashed border-slate-200 shadow-sm">
                        <AlertCircle className="h-20 w-20 text-slate-100 mx-auto mb-6" />
                        <h3 className="text-2xl font-black text-slate-400">Nenhum pedido ativo no momento</h3>
                        <p className="text-slate-300 font-medium mt-2">Os pedidos lançados no PDV aparecerão aqui.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {filteredOrders.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).map(order => (
                            <Card
                                key={order.id}
                                className="group border-none shadow-sm hover:shadow-2xl transition-all duration-300 rounded-[2.5rem] overflow-hidden bg-white flex flex-col ring-1 ring-slate-200/50"
                            >
                                <CardHeader className="p-6 pb-2 space-y-4">
                                    <div className="flex items-center justify-between">
                                        <Badge className={cn("rounded-xl font-black text-[10px] uppercase tracking-widest px-3 py-1 border-none", statusMap[order.status]?.bg || "bg-slate-100", statusMap[order.status]?.color || "text-slate-600")}>
                                            {statusMap[order.status]?.label || order.status}
                                        </Badge>
                                        <div className="flex items-center gap-1.5 text-slate-400 font-bold text-[11px]">
                                            <Timer className="h-3.5 w-3.5" />
                                            {formatDistanceToNow(new Date(order.created_at), { locale: ptBR })}
                                        </div>
                                    </div>

                                    <div className="space-y-1">
                                        <div className="flex items-baseline justify-between">
                                            <h2 className="text-2xl font-black text-slate-800 tracking-tight">
                                                {order.type === 'mesa' ? `Mesa ${order.table?.number}` : order.customer?.name || "Balcão"}
                                            </h2>
                                            <span className="font-mono text-xs font-bold text-slate-300">
                                                #{order.readable_id.replace(/\D/g, "")}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-2 text-slate-400">
                                            {order.type === 'mesa' ? <User className="h-4 w-4" /> : order.type === 'delivery' ? <Bike className="h-4 w-4" /> : <Store className="h-4 w-4" />}
                                            <span className="text-xs font-bold uppercase tracking-wider">{order.type === 'mesa' ? 'Atendimento Local' : order.type === 'delivery' ? 'Entrega' : 'Take Away'}</span>
                                        </div>
                                    </div>
                                </CardHeader>

                                <CardContent className="p-6 pt-2 flex-1">
                                    <div className="h-px bg-slate-100 w-full my-4" />
                                    <div className="space-y-2">
                                        {order.items.slice(0, 3).map((item, idx) => (
                                            <div key={idx} className="flex justify-between items-center text-sm font-medium text-slate-600">
                                                <span className="truncate flex-1 pr-2">{item.quantity}x {item.product?.name}</span>
                                                <span className="text-slate-400 font-bold tabular-nums">R$ {(item.quantity * item.unit_price).toFixed(2).replace('.', ',')}</span>
                                            </div>
                                        ))}
                                        {order.items.length > 3 && (
                                            <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest pt-1">
                                                + {order.items.length - 3} outros itens
                                            </p>
                                        )}
                                    </div>
                                </CardContent>

                                <CardFooter className="p-4 bg-slate-50/50 gap-2 flex-col">
                                    <div className="flex items-center justify-between w-full px-2 mb-2">
                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Valor Acumulado</span>
                                        <span className="text-xl font-black text-indigo-600 tabular-nums">R$ {Number(order.total).toFixed(2).replace('.', ',')}</span>
                                    </div>
                                    <div className="grid grid-cols-2 gap-2 w-full">
                                        <Button
                                            variant="outline"
                                            onClick={() => navigate('/sales', { state: { editOrderId: order.id } })}
                                            className="rounded-2xl h-12 font-black text-[11px] gap-2 border-slate-200 bg-white hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-100 transition-all active:scale-95 shadow-sm"
                                        >
                                            <Plus className="h-4 w-4" />
                                            ITENS
                                        </Button>
                                        <Button
                                            onClick={() => setSelectedOrderForPayment(order)}
                                            className="rounded-2xl h-12 font-black text-[11px] gap-2 bg-emerald-600 hover:bg-emerald-700 text-white transition-all active:scale-95 shadow-lg shadow-emerald-100"
                                        >
                                            <DollarSign className="h-4 w-4" />
                                            PAGAR
                                        </Button>
                                    </div>
                                </CardFooter>
                            </Card>
                        ))}
                    </div>
                )}
            </div>

            {/* Payment Modal */}
            <Dialog open={!!selectedOrderForPayment} onOpenChange={() => setSelectedOrderForPayment(null)}>
                <DialogContent className="sm:max-w-[450px] rounded-[2.5rem] p-0 overflow-hidden border-none shadow-2xl">
                    <DialogHeader className="p-8 pb-4 text-center">
                        <DialogTitle className="text-2xl font-black text-slate-800">Finalizar Conta</DialogTitle>
                        <DialogDescription className="font-bold text-slate-400">
                            {selectedOrderForPayment?.type === 'mesa' ? `Mesa ${selectedOrderForPayment?.table?.number}` : selectedOrderForPayment?.customer?.name || "Venda Balcão"}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="p-8 pt-0 space-y-6">
                        <div className="bg-slate-50 rounded-3xl p-6 flex flex-col items-center justify-center space-y-1">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total a Receber</span>
                            <span className="text-5xl font-black text-indigo-600 tabular-nums leading-tight">
                                R$ {Number(selectedOrderForPayment?.total || 0).toFixed(2).replace('.', ',')}
                            </span>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            {[
                                { id: 'DINHEIRO', label: 'Dinheiro', icon: DollarSign, color: 'hover:bg-emerald-50 hover:text-emerald-600 hover:border-emerald-100' },
                                { id: 'PIX', label: 'Pix', icon: Smartphone, color: 'hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-100' },
                                { id: 'CARTAO_DEBITO', label: 'Débito', icon: CreditCard, color: 'hover:bg-blue-50 hover:text-blue-600 hover:border-blue-100' },
                                { id: 'CARTAO_CREDITO', label: 'Crédito', icon: CreditCard, color: 'hover:bg-purple-50 hover:text-purple-600 hover:border-purple-100' },
                            ].map(method => (
                                <Button
                                    key={method.id}
                                    variant="outline"
                                    onClick={() => handleConfirmPayment(method.id)}
                                    className={cn("h-20 rounded-[1.5rem] flex-col gap-2 font-black text-[11px] uppercase tracking-wider border-slate-100 bg-white transition-all active:scale-95 shadow-sm", method.color)}
                                >
                                    <method.icon className="h-6 w-6" />
                                    {method.label}
                                </Button>
                            ))}
                        </div>
                    </div>

                    <div className="p-6 bg-slate-50 flex items-center justify-center flex-col gap-2 border-t border-slate-100">
                        <span className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em]">Obrigado pela preferência</span>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
