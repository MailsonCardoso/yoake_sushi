import { useState } from "react";
import { useApp, TableData } from "@/contexts/AppContext";
import { Card, CardContent } from "@/components/ui/card";
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
import { Users, CreditCard, BookOpen } from "lucide-react";
import axios from "axios";

const statusConfig: Record<TableData["status"], { label: string; bg: string; text: string }> = {
  Livre: { label: "Livre", bg: "bg-status-free/15", text: "text-status-free" },
  Ocupada: { label: "Ocupada", bg: "bg-status-occupied/15", text: "text-status-occupied" },
  Pagamento: { label: "Pagamento", bg: "bg-status-payment/15", text: "text-status-payment" },
  Reservada: { label: "Reservada", bg: "bg-status-reserved/15", text: "text-status-reserved" },
};

export default function TablesPage() {
  const { tables, fetchData, orders } = useApp();
  const { toast } = useToast();

  const [selectedTable, setSelectedTable] = useState<TableData | null>(null);
  const [showOpenModal, setShowOpenModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [peopleCount, setPeopleCount] = useState("2");

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

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-2">Mesas</h1>
      <p className="text-muted-foreground text-sm mb-6">Gerencie as mesas do seu restaurante</p>

      {/* Legend */}
      <div className="flex gap-4 mb-6 flex-wrap">
        {Object.entries(statusConfig).map(([key, val]) => (
          <div key={key} className="flex items-center gap-2 text-sm">
            <div className={`w-3 h-3 rounded-full ${key === "Livre" ? "status-free" : key === "Ocupada" ? "status-occupied" : key === "Pagamento" ? "status-payment" : "status-reserved"}`} />
            <span className="text-muted-foreground">{val.label}</span>
          </div>
        ))}
      </div>

      {/* Tables Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {tables.map((table) => {
          const config = statusConfig[table.status];
          return (
            <button
              key={table.id}
              onClick={() => handleTableClick(table)}
              className={`p-5 rounded-xl border-2 transition-all hover:scale-105 ${config.bg} border-transparent hover:border-current ${config.text} text-center`}
            >
              <p className="text-2xl font-black">{table.number}</p>
              <p className="text-[10px] font-bold uppercase mt-1 opacity-80">{config.label}</p>
              {table.current_total > 0 && (
                <div className="flex items-center justify-center gap-1 mt-2 text-xs font-bold">
                  <span>R$ {Number(table.current_total).toFixed(0)}</span>
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Open Table Modal */}
      <Dialog open={showOpenModal} onOpenChange={setShowOpenModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Abrir Mesa {selectedTable?.number}</DialogTitle>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <p className="text-sm text-muted-foreground">Confirmar abertura da mesa para novos clientes?</p>
            <div className="space-y-2">
              <Label>Estimativa de pessoas</Label>
              <Input
                type="number"
                min="1"
                value={peopleCount}
                onChange={(e) => setPeopleCount(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" className="flex-1" onClick={() => setShowOpenModal(false)}>Cancelar</Button>
            <Button className="flex-1" onClick={openTable}>Confirmar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Table Details Modal */}
      <Dialog open={showDetailsModal} onOpenChange={setShowDetailsModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Mesa {selectedTable?.number}</DialogTitle>
          </DialogHeader>
          {selectedTable && (
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 rounded-lg bg-secondary/30">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">{selectedTable.seats} lugares</span>
                </div>
                <Badge className={`${statusConfig[selectedTable.status].bg} ${statusConfig[selectedTable.status].text} border-none`}>
                  {statusConfig[selectedTable.status].label}
                </Badge>
              </div>

              {selectedTable.current_order_id && (
                <div className="space-y-3">
                  <p className="text-xs font-bold uppercase text-muted-foreground">Consumo Atual</p>
                  {(() => {
                    const order = getTableOrder(selectedTable);
                    if (!order) return <p className="text-xs italic opacity-50">Carregando detalhes do pedido...</p>;
                    return (
                      <>
                        <div className="space-y-2 max-h-[200px] overflow-auto pr-1">
                          {order.items.map((item, i) => (
                            <div key={i} className="flex justify-between text-sm items-center border-b border-secondary pb-2">
                              <div>
                                <p className="font-medium">{item.product?.name}</p>
                                <p className="text-[10px] text-muted-foreground">{item.quantity}x R$ {Number(item.unit_price).toFixed(2)}</p>
                              </div>
                              <span className="font-bold">R$ {(item.unit_price * item.quantity).toFixed(2)}</span>
                            </div>
                          ))}
                        </div>
                        <div className="flex justify-between font-black text-lg pt-2 text-primary">
                          <span>Subtotal</span>
                          <span>R$ {Number(order.total).toFixed(2).replace(".", ",")}</span>
                        </div>
                        <p className="text-[10px] text-center text-muted-foreground">ID do Pedido: {order.readable_id}</p>
                      </>
                    );
                  })()}
                </div>
              )}
            </div>
          )}
          <DialogFooter className="gap-2 sm:justify-between flex-col sm:flex-row">
            <Button variant="outline" className="w-full sm:flex-1" onClick={() => setShowDetailsModal(false)}>Voltar</Button>
            <Button variant="destructive" className="w-full sm:flex-1" onClick={closeTable}>
              <CreditCard className="h-4 w-4 mr-2" />
              Fechar Conta
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
