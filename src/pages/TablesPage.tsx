import { useState } from "react";
import { useApp, TableData } from "@/contexts/AppContext";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Users, CreditCard, BookOpen } from "lucide-react";

const statusConfig: Record<TableData["status"], { label: string; bg: string; text: string }> = {
  free: { label: "Livre", bg: "bg-status-free/15", text: "text-status-free" },
  occupied: { label: "Ocupada", bg: "bg-status-occupied/15", text: "text-status-occupied" },
  payment: { label: "Pagamento", bg: "bg-status-payment/15", text: "text-status-payment" },
  reserved: { label: "Reservada", bg: "bg-status-reserved/15", text: "text-status-reserved" },
};

export default function TablesPage() {
  const { tables, setTables, orders } = useApp();
  const { toast } = useToast();

  const [selectedTable, setSelectedTable] = useState<TableData | null>(null);
  const [showOpenModal, setShowOpenModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [peopleCount, setPeopleCount] = useState("2");

  const handleTableClick = (table: TableData) => {
    setSelectedTable(table);
    if (table.status === "free") {
      setPeopleCount("2");
      setShowOpenModal(true);
    } else {
      setShowDetailsModal(true);
    }
  };

  const openTable = () => {
    if (!selectedTable) return;
    setTables((prev) =>
      prev.map((t) =>
        t.id === selectedTable.id ? { ...t, status: "occupied" as const, people: Number(peopleCount) } : t
      )
    );
    toast({ title: `Mesa ${selectedTable.id} aberta!`, description: `${peopleCount} pessoas` });
    setShowOpenModal(false);
  };

  const closeTable = () => {
    if (!selectedTable) return;
    setTables((prev) =>
      prev.map((t) =>
        t.id === selectedTable.id ? { ...t, status: "free" as const, people: undefined, orderId: undefined } : t
      )
    );
    toast({ title: `Mesa ${selectedTable.id} liberada!` });
    setShowDetailsModal(false);
  };

  const getTableOrder = (table: TableData) => {
    return orders.find((o) => o.id === table.orderId);
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-2">Mesas</h1>
      <p className="text-muted-foreground text-sm mb-6">Gerencie as mesas do seu restaurante</p>

      {/* Legend */}
      <div className="flex gap-4 mb-6 flex-wrap">
        {Object.entries(statusConfig).map(([key, val]) => (
          <div key={key} className="flex items-center gap-2 text-sm">
            <div className={`w-3 h-3 rounded-full ${key === "free" ? "status-free" : key === "occupied" ? "status-occupied" : key === "payment" ? "status-payment" : "status-reserved"}`} />
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
              className={`p-5 rounded-xl border-2 transition-all hover:scale-105 ${config.bg} border-transparent hover:border-current ${config.text}`}
            >
              <p className="text-2xl font-bold">{table.id}</p>
              <p className="text-xs font-medium mt-1">{config.label}</p>
              {table.people && (
                <div className="flex items-center justify-center gap-1 mt-2 text-xs">
                  <Users className="h-3 w-3" />
                  <span>{table.people}</span>
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
            <DialogTitle>Abrir Mesa {selectedTable?.id}</DialogTitle>
          </DialogHeader>
          <div>
            <Label>Número de pessoas</Label>
            <Input
              type="number"
              min="1"
              value={peopleCount}
              onChange={(e) => setPeopleCount(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowOpenModal(false)}>Cancelar</Button>
            <Button onClick={openTable}>Abrir Mesa</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Table Details Modal */}
      <Dialog open={showDetailsModal} onOpenChange={setShowDetailsModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Mesa {selectedTable?.id}</DialogTitle>
          </DialogHeader>
          {selectedTable && (
            <div className="space-y-4">
              <div className="flex items-center gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <span>{selectedTable.people || 0} pessoas</span>
                </div>
                <div className={`px-2 py-1 rounded text-xs font-medium ${statusConfig[selectedTable.status].bg} ${statusConfig[selectedTable.status].text}`}>
                  {statusConfig[selectedTable.status].label}
                </div>
              </div>

              {selectedTable.orderId && (
                <div className="space-y-2">
                  <p className="text-sm font-medium">Pedido: {selectedTable.orderId}</p>
                  {(() => {
                    const order = getTableOrder(selectedTable);
                    if (!order) return null;
                    return (
                      <>
                        <div className="space-y-1">
                          {order.items.map((item, i) => (
                            <div key={i} className="flex justify-between text-sm bg-secondary/50 px-3 py-2 rounded">
                              <span>{item.quantity}x {item.product.name}</span>
                              <span>R$ {(item.product.price * item.quantity).toFixed(2).replace(".", ",")}</span>
                            </div>
                          ))}
                        </div>
                        <div className="flex justify-between font-bold pt-2 border-t">
                          <span>Total</span>
                          <span className="text-primary">R$ {order.total.toFixed(2).replace(".", ",")}</span>
                        </div>
                      </>
                    );
                  })()}
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDetailsModal(false)}>Fechar</Button>
            <Button variant="destructive" onClick={closeTable}>Liberar Mesa</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
