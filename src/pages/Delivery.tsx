import { useApp, Order } from "@/contexts/AppContext";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MapPin, CheckCircle2, Bike, Clock, ExternalLink, Hash } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";

export default function Delivery() {
    const { orders, updateOrderStatus } = useApp();

    const readyToDispatch = orders.filter(o => o.status === "Pronto" && o.type === "delivery");
    const onTheWay = orders.filter(o => o.status === "Despachado");

    const handleStatusUpdate = (orderId: string, nextStatus: Order["status"]) => {
        updateOrderStatus(orderId, nextStatus);
    };

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-8 bg-[#f8fafc] min-h-screen">
            {/* Header Area */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black text-slate-800 flex items-center gap-3">
                        <Bike className="h-8 w-8 text-[#6366f1]" />
                        Portal do Entregador
                    </h1>
                    <p className="text-slate-400 font-medium mt-1">Gerencie retiradas e confirmações de entrega.</p>
                </div>
                <div className="flex items-center gap-3">
                    <Button className="bg-[#6366f1] hover:bg-[#4f46e5] rounded-2xl gap-2 font-bold shadow-lg shadow-indigo-100">
                        <Plus className="h-4 w-4" /> Novo Pedido
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Coluna 1: AGUARDANDO RETIRADA */}
                <section className="space-y-6">
                    <div className="flex items-center justify-between px-2">
                        <h2 className="text-sm font-black text-[#10b981] uppercase tracking-widest flex items-center gap-2">
                            Aguardando Retirada (Prontos)
                            <Badge className="bg-[#10b981] hover:bg-[#10b981] text-white rounded-full h-6 w-6 flex items-center justify-center p-0 text-[10px] border-none">
                                {readyToDispatch.length}
                            </Badge>
                        </h2>
                    </div>

                    <div className="space-y-4">
                        {readyToDispatch.map(order => (
                            <Card key={order.id} className="border-none shadow-sm rounded-[32px] overflow-hidden bg-white hover:shadow-md transition-all group border-l-8 border-l-[#10b981]/10">
                                <CardContent className="p-6 space-y-4">
                                    <div className="flex justify-between items-center">
                                        <div className="flex items-center gap-2">
                                            <Hash className="h-4 w-4 text-slate-300" />
                                            <span className="text-xl font-black text-slate-800">{order.readable_id}</span>
                                        </div>
                                        <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 rounded-xl">
                                            <Clock className="h-3 w-3 text-slate-400" />
                                            <span className="text-xs font-black text-slate-500">
                                                {format(new Date(order.created_at), "HH:mm", { locale: ptBR })}
                                            </span>
                                        </div>
                                    </div>

                                    <div>
                                        <h3 className="font-black text-slate-700 text-lg mb-1">{order.customer?.name || "Consumidor Final"}</h3>
                                        <div className="flex items-center gap-2 text-slate-400 hover:text-[#6366f1] transition-colors cursor-pointer group/link">
                                            <MapPin className="h-4 w-4" />
                                            <span className="text-sm font-bold truncate flex-1">
                                                {order.delivery_address || "Retirada no Balcão"}
                                            </span>
                                            <ExternalLink className="h-3 w-3 opacity-0 group-hover/link:opacity-100 transition-opacity" />
                                        </div>
                                    </div>

                                    <Button
                                        className="w-full h-14 rounded-2xl bg-[#10b981] hover:bg-[#059669] text-white font-black text-base shadow-lg shadow-emerald-50 gap-3"
                                        onClick={() => handleStatusUpdate(order.id, "Despachado")}
                                    >
                                        <Bike className="h-5 w-5" />
                                        Iniciar Entrega (Pegar)
                                    </Button>
                                </CardContent>
                            </Card>
                        ))}
                        {readyToDispatch.length === 0 && (
                            <div className="flex flex-col items-center justify-center py-20 bg-white/50 rounded-[32px] border-2 border-dashed border-slate-200">
                                <div className="h-16 w-16 bg-white rounded-full flex items-center justify-center shadow-sm mb-4">
                                    <Bike className="h-8 w-8 text-slate-200" />
                                </div>
                                <p className="text-slate-400 font-bold italic">Nenhum pedido para retirada</p>
                            </div>
                        )}
                    </div>
                </section>

                {/* Coluna 2: EM ROTA */}
                <section className="space-y-6">
                    <div className="flex items-center justify-between px-2">
                        <h2 className="text-sm font-black text-[#6366f1] uppercase tracking-widest flex items-center gap-2">
                            Em Rota (Minhas Entregas)
                            <Badge className="bg-[#6366f1] hover:bg-[#6366f1] text-white rounded-full h-6 w-6 flex items-center justify-center p-0 text-[10px] border-none">
                                {onTheWay.length}
                            </Badge>
                        </h2>
                    </div>

                    <div className="space-y-4">
                        {onTheWay.map(order => (
                            <Card key={order.id} className="border-none shadow-sm rounded-[32px] overflow-hidden bg-white border-l-8 border-l-[#6366f1]/10">
                                <CardContent className="p-6 space-y-5">
                                    <div className="flex justify-between items-center">
                                        <div className="flex items-center gap-2">
                                            <Hash className="h-4 w-4 text-slate-300" />
                                            <span className="text-xl font-black text-slate-800">{order.readable_id}</span>
                                        </div>
                                        <Badge className="bg-[#e0e7ff] text-[#6366f1] hover:bg-[#e0e7ff] border-none font-black text-[10px] rounded-lg">
                                            Em Trânsito
                                        </Badge>
                                    </div>

                                    <div>
                                        <h3 className="font-black text-slate-700 text-lg mb-1">{order.customer?.name || "Consumidor Final"}</h3>
                                        <p className="text-sm font-bold text-slate-400 leading-snug">
                                            {order.delivery_address}
                                        </p>
                                    </div>

                                    <div className="bg-slate-50 p-4 rounded-2xl flex justify-between items-center">
                                        <span className="text-xs font-black text-slate-400 uppercase tracking-wider">Total a receber:</span>
                                        <span className="text-xl font-black text-[#6366f1]">
                                            R$ {Number(order.total).toFixed(2).replace('.', ',')}
                                        </span>
                                    </div>

                                    <Button
                                        className="w-full h-14 rounded-2xl bg-[#1e293b] hover:bg-[#0f172a] text-white font-black text-base shadow-xl shadow-slate-200 gap-3"
                                        onClick={() => handleStatusUpdate(order.id, "Concluído")}
                                    >
                                        <CheckCircle2 className="h-5 w-5" />
                                        Confirmar Entrega
                                    </Button>
                                </CardContent>
                            </Card>
                        ))}
                        {onTheWay.length === 0 && (
                            <div className="flex flex-col items-center justify-center py-20 bg-white/50 rounded-[32px] border-2 border-dashed border-slate-200">
                                <div className="h-16 w-16 bg-white rounded-full flex items-center justify-center shadow-sm mb-4">
                                    <MapPin className="h-8 w-8 text-slate-200" />
                                </div>
                                <p className="text-slate-400 font-bold italic">Você não possui entregas em rota</p>
                            </div>
                        )}
                    </div>
                </section>
            </div>
        </div>
    );
}

function Plus(props: any) {
    return (
        <svg
            {...props}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="M5 12h14" />
            <path d="M12 5v14" />
        </svg>
    )
}
