import { useState, useEffect } from "react";
import { Order } from "@/contexts/AppContext";
import { Clock, Bell } from "lucide-react";
import axios from "axios";

const API_URL = "https://api2.platformx.com.br/api";

export default function TVMonitor() {
    const [preparingOrders, setPreparingOrders] = useState<Order[]>([]);
    const [readyOrders, setReadyOrders] = useState<Order[]>([]);

    const fetchOrders = async () => {
        try {
            const res = await axios.get(`${API_URL}/orders?status=active`);
            const allActive = res.data;

            // Filtra para o painel
            setPreparingOrders(allActive.filter((o: Order) => o.status === "Preparando" || o.status === "Pendente"));
            setReadyOrders(allActive.filter((o: Order) => o.status === "Pronto"));
        } catch (error) {
            console.error("Erro ao atualizar monitor:", error);
        }
    };

    useEffect(() => {
        fetchOrders();
        const interval = setInterval(fetchOrders, 5000); // Atualiza a cada 5 segundos
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="fixed inset-0 bg-white flex overflow-hidden font-sans">
            {/* Coluna Preparando */}
            <div className="flex-1 bg-[#f1f5f9] flex flex-col items-center p-12 overflow-hidden border-r-4 border-white">
                <div className="flex items-center gap-6 mb-16 opacity-60">
                    <Clock className="h-20 w-20 text-slate-500" />
                    <h2 className="text-7xl font-black text-slate-500 tracking-tighter uppercase">Preparando</h2>
                </div>

                <div className="w-full flex flex-col items-center gap-6">
                    {preparingOrders.slice(0, 8).map((order) => (
                        <div key={order.id} className="text-8xl font-black text-slate-400 animate-pulse">
                            {order.readable_id}
                        </div>
                    ))}
                    {preparingOrders.length === 0 && (
                        <div className="text-4xl italic text-slate-300 mt-20">Nenhum pedido em preparo</div>
                    )}
                </div>
            </div>

            {/* Coluna Pronto */}
            <div className="flex-1 flex flex-col items-center p-12 overflow-hidden">
                <div className="flex items-center gap-6 mb-16">
                    <Bell className="h-20 w-20 text-[#10b981] animate-bounce" />
                    <h2 className="text-7xl font-black text-[#10b981] tracking-tighter uppercase">Pronto</h2>
                </div>

                <div className="w-full flex flex-col items-center gap-8">
                    {readyOrders.slice(0, 5).map((order) => (
                        <div key={order.id} className="text-[14rem] leading-none font-black text-[#10b981] drop-shadow-sm tracking-tighter">
                            {order.readable_id}
                        </div>
                    ))}
                    {readyOrders.length === 0 && (
                        <div className="text-4xl italic text-slate-200 mt-20">Aguardando novos pedidos...</div>
                    )}
                </div>
            </div>

            {/* Footer Branding */}
            <div className="absolute bottom-6 w-full flex justify-between px-12 items-center opacity-30">
                <span className="text-2xl font-bold">Yoake Sushi - Painel de Atendimento</span>
                <span className="text-2xl font-mono">{new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
            </div>
        </div>
    );
}
