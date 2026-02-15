import { useApp } from "@/contexts/AppContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
    TrendingUp,
    Calendar,
    DollarSign,
    ChevronRight,
    ChevronLeft,
    Banknote,
    CreditCard,
    Smartphone,
    PieChart,
    ArrowUpRight,
} from "lucide-react";
import { useState, useEffect } from "react";
import axios from "axios";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface CashRegister {
    id: string;
    opening_balance: number;
    closing_balance: number | null;
    total_cash: number;
    total_nubank: number;
    total_picpay: number;
    total_pix: number;
    total_ifood: number;
    opened_at: string;
    closed_at: string | null;
    status: 'open' | 'closed';
}

export default function FinancialAnalysis() {
    const [history, setHistory] = useState<CashRegister[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchHistory();
    }, []);

    const fetchHistory = async () => {
        try {
            const res = await axios.get("/cash-register/history");
            setHistory(res.data);
        } catch (error) {
            console.error("Erro ao buscar histórico financeiro:", error);
        } finally {
            setLoading(false);
        }
    };

    const totalClosedRevenue = history
        .filter(r => r.status === 'closed')
        .reduce((sum, r) => sum + (Number(r.closing_balance) - Number(r.opening_balance)), 0);

    return (
        <div className="p-8 space-y-8 bg-slate-50/50 min-h-screen">
            <div>
                <h1 className="text-3xl font-black text-slate-800 tracking-tight">Análise Financeira</h1>
                <p className="text-slate-400 font-medium">Histórico de fechamentos e desempenho por conta</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="border-none shadow-sm bg-indigo-600 text-white overflow-hidden relative">
                    <div className="absolute right-[-20px] top-[-20px] opacity-10">
                        <PieChart size={140} />
                    </div>
                    <CardContent className="p-6">
                        <p className="text-indigo-100 text-xs font-black uppercase tracking-wider mb-2">Faturamento Acumulado</p>
                        <div className="flex items-end gap-2">
                            <h2 className="text-4xl font-black">R$ {totalClosedRevenue.toFixed(2).replace('.', ',')}</h2>
                            <ArrowUpRight className="h-6 w-6 text-emerald-400 mb-1" />
                        </div>
                        <p className="text-indigo-200 text-[10px] mt-4 font-bold uppercase">Baseado em {history.filter(r => r.status === 'closed').length} caixas fechados</p>
                    </CardContent>
                </Card>

                <Card className="border-none shadow-sm bg-white md:col-span-2">
                    <CardContent className="p-6 flex items-center justify-around h-full">
                        <div className="text-center">
                            <div className="p-3 bg-purple-50 rounded-2xl mb-3 inline-block">
                                <CreditCard className="h-6 w-6 text-purple-600" />
                            </div>
                            <p className="text-[10px] font-black text-slate-400 uppercase">Nubank</p>
                            <p className="text-lg font-black text-slate-700">R$ {history.reduce((s, r) => s + Number(r.total_nubank), 0).toFixed(2)}</p>
                        </div>
                        <div className="text-center">
                            <div className="p-3 bg-emerald-50 rounded-2xl mb-3 inline-block">
                                <CreditCard className="h-6 w-6 text-emerald-600" />
                            </div>
                            <p className="text-[10px] font-black text-slate-400 uppercase">PicPay</p>
                            <p className="text-lg font-black text-slate-700">R$ {history.reduce((s, r) => s + Number(r.total_picpay), 0).toFixed(2)}</p>
                        </div>
                        <div className="text-center">
                            <div className="p-3 bg-amber-50 rounded-2xl mb-3 inline-block">
                                <Banknote className="h-6 w-6 text-amber-600" />
                            </div>
                            <p className="text-[10px] font-black text-slate-400 uppercase">Dinheiro</p>
                            <p className="text-lg font-black text-slate-700">R$ {history.reduce((s, r) => s + Number(r.total_cash), 0).toFixed(2)}</p>
                        </div>
                        <div className="text-center">
                            <div className="p-3 bg-blue-50 rounded-2xl mb-3 inline-block">
                                <Smartphone className="h-6 w-6 text-blue-600" />
                            </div>
                            <p className="text-[10px] font-black text-slate-400 uppercase">iFood (Conc.)</p>
                            <p className="text-lg font-black text-slate-700">R$ {history.reduce((s, r) => s + Number(r.total_ifood), 0).toFixed(2)}</p>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div className="space-y-4">
                <h3 className="font-black text-slate-700 uppercase p-1">Histórico de Movimentações</h3>
                <div className="grid gap-4">
                    {loading ? (
                        <p className="text-center py-10 text-slate-400 font-bold italic">Carregando histórico...</p>
                    ) : history.length === 0 ? (
                        <p className="text-center py-10 text-slate-400 font-bold italic">Nenhum caixa registrado ainda.</p>
                    ) : (
                        history.map((reg) => (
                            <Card key={reg.id} className="border-none shadow-sm hover:shadow-md transition-shadow overflow-hidden group">
                                <CardContent className="p-0">
                                    <div className="flex flex-col md:flex-row md:items-center">
                                        <div className={reg.status === 'open' ? "bg-emerald-500 w-2 md:h-24" : "bg-slate-200 w-2 md:h-24"} />
                                        <div className="p-6 flex-1 flex flex-col md:flex-row md:items-center justify-between gap-6">
                                            <div className="flex items-center gap-4">
                                                <div className="h-10 w-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400">
                                                    <Calendar className="h-5 w-5" />
                                                </div>
                                                <div>
                                                    <p className="text-sm font-black text-slate-800">
                                                        {format(new Date(reg.opened_at), "dd 'de' MMMM, yyyy", { locale: ptBR })}
                                                    </p>
                                                    <p className="text-[10px] font-bold text-slate-400 uppercase">
                                                        Aberto às {format(new Date(reg.opened_at), "HH:mm")}
                                                        {reg.closed_at && ` • Fechado às ${format(new Date(reg.closed_at), "HH:mm")}`}
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="flex gap-8">
                                                <div className="text-right">
                                                    <p className="text-[10px] font-black text-slate-400 uppercase">Abertura</p>
                                                    <p className="text-sm font-bold text-slate-700">R$ {Number(reg.opening_balance).toFixed(2)}</p>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-[10px] font-black text-slate-400 uppercase">Vendas</p>
                                                    <p className="text-sm font-black text-indigo-600">
                                                        + R$ {(Number(reg.total_cash) + Number(reg.total_nubank) + Number(reg.total_picpay) + Number(reg.total_pix) + Number(reg.total_ifood)).toFixed(2)}
                                                    </p>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-[10px] font-black text-slate-400 uppercase">Saldo Final</p>
                                                    <p className="text-sm font-black text-slate-800">
                                                        R$ {reg.closing_balance ? Number(reg.closing_balance).toFixed(2) : '---'}
                                                    </p>
                                                </div>
                                            </div>

                                            <div>
                                                {reg.status === 'open' ? (
                                                    <Badge className="bg-emerald-100 text-emerald-600 border-none px-4 py-1 text-xs font-black uppercase">Aberto</Badge>
                                                ) : (
                                                    <Badge variant="outline" className="text-slate-400 border-slate-200 px-4 py-1 text-xs font-black uppercase">Concluído</Badge>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}
