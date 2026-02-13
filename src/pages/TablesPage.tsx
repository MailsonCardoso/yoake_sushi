import { useState, useEffect } from "react";
import { useApp, TableData, Order } from "@/contexts/AppContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import {
  Users,
  CreditCard,
  Clock,
  Plus,
  Filter,
  CheckCircle2,
  XCircle,
  Calendar,
  DollarSign,
  ChevronRight
} from "lucide-react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";

const statusConfig: Record<TableData["status"], {
  label: string;
  bg: string;
  border: string;
  text: string;
  badgeBg: string;
}> = {
  Livre: {
    label: "LIVRE",
    bg: "bg-[#f0fdf4]",
    border: "border-[#bbf7d0]",
    text: "text-[#166534]",
    badgeBg: "bg-[#dcfce7]"
  },
  Ocupada: {
    label: "OCUPADA",
    bg: "bg-[#fff1f2]",
    border: "border-[#fecdd3]",
    text: "text-[#9f1239]",
    badgeBg: "bg-[#ffe4e6]"
  },
  Pagamento: {
    label: "PAGAMENTO",
    bg: "bg-[#fffbeb]",
    border: "border-[#fef3c7]",
    text: "text-[#92400e]",
    badgeBg: "bg-[#fef3c7]"
  },
  Reservada: {
    label: "RESERVADA",
    bg: "bg-[#eff6ff]",
    border: "border-[#bfdbfe]",
    text: "text-[#1e40af]",
    badgeBg: "bg-[#dbeafe]"
  },
};

export default function TablesPage() {
  const { tables, fetchData, orders } = useApp();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [selectedTable, setSelectedTable] = useState<TableData | null>(null);
  const [showOpenModal, setShowOpenModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showAddTableModal, setShowAddTableModal] = useState(false);
  const [addTableForm, setAddTableForm] = useState({ number: "", seats: "2" });
  const [peopleCount, setPeopleCount] = useState("2");
  const [filter, setFilter] = useState<"Todas" | "Livres" | "Ocupadas">("Todas");

  const handleAddTable = async () => {
    if (!addTableForm.number) {
      toast({ title: "Número da mesa é obrigatório", variant: "destructive" });
      return;
    }
    try {
      await axios.post(`https://api2.platformx.com.br/api/tables`, {
        number: addTableForm.number,
        seats: Number(addTableForm.seats)
      });
      toast({ title: "Mesa criada com sucesso!" });
      setShowAddTableModal(false);
      setAddTableForm({ number: "", seats: "2" });
      fetchData();
    } catch (error) {
      toast({ title: "Erro ao criar mesa", description: "Verifique se o número já existe", variant: "destructive" });
    }
  };

  // State to force re-render for time calculation
  const [, setTick] = useState(0);
  useEffect(() => {
    const interval = setInterval(() => setTick(t => t + 1), 60000);
    return () => clearInterval(interval);
  }, []);

  const filteredTables = tables.filter(t => {
    if (filter === "Todas") return true;
    if (filter === "Livres") return t.status === "Livre";
    if (filter === "Ocupadas") return t.status === "Ocupada" || t.status === "Pagamento";
    return true;
  });

  const handleTableClick = (table: TableData) => {
    setSelectedTable(table);
    if (table.status === "Livre") {
      setPeopleCount("2");
      setShowOpenModal(true);
    } else {
      setShowDetailsModal(true);
    }
  };

  const openTable = async () => {
    if (!selectedTable) return;
    try {
      await axios.patch(`https://api2.platformx.com.br/api/tables/${selectedTable.id}/open`);
      toast({ title: `Mesa ${selectedTable.number} aberta!` });
      setShowOpenModal(false);
      fetchData();
    } catch (error) {
      toast({ title: "Erro ao abrir mesa", variant: "destructive" });
    }
  };

  const closeTable = async () => {
    if (!selectedTable) return;
    try {
      await axios.patch(`https://api2.platformx.com.br/api/tables/${selectedTable.id}/close`);
      toast({ title: `Mesa ${selectedTable.number} liberada!` });
      setShowDetailsModal(false);
      fetchData();
    } catch (error) {
      toast({ title: "Erro ao liberar mesa", variant: "destructive" });
    }
  };

  const getTableOrder = (table: TableData) => {
    return orders.find((o) => o.id === table.current_order_id);
  };

  const calculateElapsedTime = (createdAt: string) => {
    const start = new Date(createdAt);
    const now = new Date();
    const diffMs = now.getTime() - start.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 60) return `${diffMins}min`;
    const hours = Math.floor(diffMins / 60);
    const mins = diffMins % 60;
    return `${hours}h ${mins}m`;
  };

  const handleAddItems = () => {
    if (selectedTable) {
      navigate("/sales", { state: { tableId: selectedTable.id, tableNumber: selectedTable.number } });
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-[#1e293b]">Gestão de Mesas</h1>
          <p className="text-muted-foreground text-sm mt-1">Visão geral do salão em tempo real.</p>
        </div>

        <div className="flex items-center gap-3">
          <div className="bg-white p-1 rounded-xl shadow-sm border flex gap-1">
            {(["Todas", "Livres", "Ocupadas"] as const).map((opt) => (
              <button
                key={opt}
                onClick={() => setFilter(opt)}
                className={cn(
                  "px-4 py-1.5 rounded-lg text-sm font-medium transition-all",
                  filter === opt
                    ? "bg-[#f1f5f9] text-[#1e293b] shadow-sm"
                    : "text-muted-foreground hover:bg-slate-50"
                )}
              >
                {opt}
              </button>
            ))}
          </div>
          <Button
            className="bg-[#6366f1] hover:bg-[#4f46e5] rounded-xl gap-2 font-bold shadow-lg shadow-indigo-100"
            onClick={() => setShowAddTableModal(true)}
          >
            <Plus className="h-5 w-5" />
            Nova Mesa
          </Button>
        </div>
      </div>

      {/* Tables Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredTables.map((table) => {
          const config = statusConfig[table.status];
          const order = getTableOrder(table);

          return (
            <Card
              key={table.id}
              onClick={() => handleTableClick(table)}
              className={cn(
                "group relative border-2 border-transparent transition-all hover:scale-[1.02] cursor-pointer overflow-hidden rounded-2xl shadow-sm",
                config.bg,
                "hover:" + config.border
              )}
            >
              <CardHeader className="p-5 pb-2">
                <div className="flex justify-between items-center">
                  <span className={cn("text-xl font-bold", config.text)}>Mesa {table.number}</span>
                  <Badge className={cn("border-none shadow-none font-black text-[10px] px-2 h-6", config.badgeBg, config.text)}>
                    {config.label}
                  </Badge>
                </div>
              </CardHeader>

              <CardContent className="p-5 pt-4 space-y-4">
                <div className="flex items-center gap-2 text-slate-600">
                  <Users className="h-4 w-4 opacity-70" />
                  <span className="text-sm font-medium">{table.seats} Lugares</span>
                </div>

                <div className="pt-2 border-t border-slate-200/50 space-y-3">
                  {table.status !== "Livre" ? (
                    <>
                      <div className="flex justify-between items-center text-sm">
                        <div className="flex items-center gap-2 text-slate-500">
                          <Clock className="h-4 w-4" />
                          <span>Tempo</span>
                        </div>
                        <span className="font-bold text-slate-700">
                          {order ? calculateElapsedTime(order.created_at) : "--"}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2 text-slate-500">
                          <DollarSign className="h-4 w-4" />
                          <span className="text-sm">Total</span>
                        </div>
                        <span className="text-lg font-black text-slate-800">
                          R$ {Number(table.current_total).toFixed(2)}
                        </span>
                      </div>

                      {/* Hover Overlay Button */}
                      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-white/10 backdrop-blur-[1px]">
                        <Button variant="secondary" className="bg-white/90 hover:bg-white text-indigo-700 font-bold shadow-xl rounded-xl px-6">
                          Ver Detalhes
                        </Button>
                      </div>
                    </>
                  ) : (
                    <div className="h-[68px] flex items-center justify-center text-xs text-slate-400 italic">
                      Mesa disponível para atendimento
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Open Table Modal */}
      <Dialog open={showOpenModal} onOpenChange={setShowOpenModal}>
        <DialogContent className="sm:max-w-[400px] rounded-3xl p-8">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-slate-800">Abrir Mesa {selectedTable?.number}</DialogTitle>
          </DialogHeader>
          <div className="py-6 space-y-6">
            <div className="space-y-3">
              <Label className="text-sm font-bold uppercase text-slate-500">Quantas pessoas?</Label>
              <Input
                type="number"
                min="1"
                className="h-14 rounded-2xl text-xl font-bold border-slate-200"
                value={peopleCount}
                onChange={(e) => setPeopleCount(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter className="flex gap-3 sm:flex-row flex-col">
            <Button variant="ghost" className="flex-1 rounded-2xl h-12 font-bold" onClick={() => setShowOpenModal(false)}>Cancelar</Button>
            <Button className="flex-1 rounded-2xl h-12 font-bold bg-[#6366f1] hover:bg-[#4f46e5]" onClick={openTable}>Confirmar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Table Details Modal (Redesigned) */}
      <Dialog open={showDetailsModal} onOpenChange={setShowDetailsModal}>
        <DialogContent className="sm:max-w-[600px] rounded-[32px] p-0 overflow-hidden border-none shadow-2xl">
          <div className="p-8 pb-4">
            <div className="flex justify-between items-start mb-8">
              <h2 className="text-3xl font-black text-slate-800">Mesa {selectedTable?.number}</h2>
              <Button variant="ghost" size="icon" className="rounded-full h-8 w-8 hover:bg-slate-100" onClick={() => setShowDetailsModal(false)}>
                <XCircle className="h-6 w-6 text-slate-400" />
              </Button>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-8">
              <div className="bg-slate-50 p-6 rounded-[24px] border border-slate-100 flex flex-col items-center justify-center space-y-1">
                <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest leading-none">Status</span>
                <span className="text-lg font-bold text-slate-700">{selectedTable?.status}</span>
              </div>
              <div className="bg-slate-50 p-6 rounded-[24px] border border-slate-100 flex flex-col items-center justify-center space-y-1">
                <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest leading-none">Tempo Aberto</span>
                <span className="text-xl font-black text-slate-800">
                  {selectedTable && getTableOrder(selectedTable) ? calculateElapsedTime(getTableOrder(selectedTable)!.created_at) : "0min"}
                </span>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between px-2">
                <h3 className="font-bold text-slate-600">Resumo da Conta</h3>
                <span className="text-[11px] font-bold text-slate-400 uppercase italic">Itens Agrupados</span>
              </div>

              <div className="space-y-1 py-4 border-t border-slate-100">
                <div className="flex justify-between text-slate-600 px-2 py-1">
                  <span className="text-sm font-medium">Consumo Acumulado</span>
                  <span className="font-bold">R$ {Number(selectedTable?.current_total).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-green-600 px-2 py-1">
                  <span className="text-sm font-medium">Serviço (10%) - Opcional</span>
                  <span className="font-bold">R$ 0,00</span>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-[#f0f4ff] p-6 flex flex-col items-center justify-center space-y-6">
            <div className="flex justify-between w-full px-2">
              <span className="text-xl font-black text-[#1e1b4b]">Total a Pagar</span>
              <span className="text-2xl font-black text-[#6366f1]">R$ {Number(selectedTable?.current_total).toFixed(2)}</span>
            </div>

            <div className="flex gap-3 w-full">
              <Button
                variant="outline"
                className="flex-[2] bg-white hover:bg-white/80 text-[#059669] border-[#d1fae5] h-14 rounded-2xl font-bold gap-2 text-base transition-all"
                onClick={closeTable}
              >
                <CheckCircle2 className="h-5 w-5" />
                Fechar Conta
              </Button>
              <Button variant="ghost" className="flex-1 text-slate-500 font-bold h-14 rounded-2xl" onClick={() => setShowDetailsModal(false)}>
                Cancelar
              </Button>
              <Button
                className="flex-[2] bg-[#6366f1] hover:bg-[#4f46e5] text-white h-14 rounded-2xl font-bold text-base shadow-lg shadow-indigo-100"
                onClick={handleAddItems}
              >
                Adicionar Itens
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Table Modal */}
      <Dialog open={showAddTableModal} onOpenChange={setShowAddTableModal}>
        <DialogContent className="sm:max-w-[400px] rounded-3xl p-8">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-slate-800">Nova Mesa</DialogTitle>
          </DialogHeader>
          <div className="py-6 space-y-4">
            <div className="space-y-2">
              <Label className="text-sm font-bold uppercase text-slate-500">Número da Mesa</Label>
              <Input
                placeholder="Ex: 05"
                className="h-12 rounded-xl"
                value={addTableForm.number}
                onChange={(e) => setAddTableForm(prev => ({ ...prev, number: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-bold uppercase text-slate-500">Quantidade de Lugares</Label>
              <Input
                type="number"
                min="1"
                className="h-12 rounded-xl"
                value={addTableForm.seats}
                onChange={(e) => setAddTableForm(prev => ({ ...prev, seats: e.target.value }))}
              />
            </div>
          </div>
          <DialogFooter className="flex gap-3 sm:flex-row flex-col">
            <Button variant="ghost" className="flex-1 rounded-2xl h-12 font-bold" onClick={() => setShowAddTableModal(false)}>Cancelar</Button>
            <Button className="flex-1 rounded-2xl h-12 font-bold bg-[#6366f1] hover:bg-[#4f46e5]" onClick={handleAddTable}>Criar Mesa</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
