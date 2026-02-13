import { useState, useMemo, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { useApp, Product } from "@/contexts/AppContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  DialogFooter,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import {
  ShoppingCart,
  Plus,
  Minus,
  MapPin,
  Calculator,
  User,
  TrendingUp,
  Utensils,
  Coffee,
  Pizza,
  XCircle,
  Hash
} from "lucide-react";
import { cn } from "@/lib/utils";

const categories = [
  { name: "Todos", icon: Utensils },
  { name: "burgers", label: "Lanches", icon: Pizza },
  { name: "drinks", label: "Bebidas", icon: Coffee },
  { name: "portions", label: "Porções", icon: Utensils },
];

export default function Sales() {
  const { products, customers, tables, addOrder } = useApp();
  const { toast } = useToast();
  const location = useLocation();

  const [selectedCategory, setSelectedCategory] = useState("Todos");
  const [cart, setCart] = useState<{ product: Product, quantity: number }[]>([]);
  const [orderType, setOrderType] = useState<"table" | "delivery" | "counter">("counter");
  const [orderChannel, setOrderChannel] = useState<string>("Balcão");
  const [selectedTable, setSelectedTable] = useState<string>("");
  const [customerName, setCustomerName] = useState("");
  const [customerId, setCustomerId] = useState<string>("");
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [deliveryFee, setDeliveryFee] = useState(0);
  const [showDistanceCalc, setShowDistanceCalc] = useState(false);
  const [calculatedDistance, setCalculatedDistance] = useState(0);

  useEffect(() => {
    if (location.state?.tableId) {
      setOrderType("table");
      setSelectedTable(location.state.tableId);
    }
  }, [location.state]);

  const filteredProducts = useMemo(
    () =>
      selectedCategory === "Todos"
        ? products
        : products.filter((p) => p.category === selectedCategory),
    [products, selectedCategory]
  );

  const freeTables = tables.filter((t) => t.status === "Livre");
  const cartTotal = cart.reduce((sum, item) => sum + Number(item.product.price) * item.quantity, 0);
  const grandTotal = cartTotal + (orderType === "delivery" ? deliveryFee : 0);

  const addToCart = (product: Product) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.product.id === product.id);
      if (existing) {
        return prev.map((i) =>
          i.product.id === product.id ? { ...i, quantity: i.quantity + 1 } : i
        );
      }
      return [...prev, { product, quantity: 1 }];
    });
  };

  const updateQuantity = (productId: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((i) =>
          i.product.id === productId ? { ...i, quantity: i.quantity + delta } : i
        )
        .filter((i) => i.quantity > 0)
    );
  };

  const handleCustomerSelect = (name: string) => {
    setCustomerName(name);
    const customer = customers.find((c) => c.name === name);
    if (customer) {
      setCustomerId(customer.id);
      setDeliveryAddress(customer.address);
    } else {
      setCustomerId("");
    }
  };

  const simulateDistance = () => {
    const dist = Math.round((Math.random() * 10 + 1) * 10) / 10;
    setCalculatedDistance(dist);
    setDeliveryFee(Math.round(dist * 2 * 100) / 100);
    setShowDistanceCalc(false);
    toast({ title: "Distância calculada", description: `${dist} km → Taxa: R$ ${(dist * 2).toFixed(2)}` });
  };

  const handleSendOrder = () => {
    if (cart.length === 0) {
      toast({ title: "Carrinho vazio", description: "Adicione itens ao pedido", variant: "destructive" });
      return;
    }
    if (orderType === "table" && !selectedTable) {
      toast({ title: "Selecione uma mesa", variant: "destructive" });
      return;
    }

    addOrder({
      items: cart.map(i => ({
        product_id: i.product.id,
        quantity: i.quantity,
        unit_price: i.product.price
      })),
      subtotal: cartTotal,
      total: grandTotal,
      type: orderType === "table" ? "mesa" : orderType === "counter" ? "balcao" : "delivery",
      channel: orderChannel,
      table_id: orderType === "table" ? selectedTable : undefined,
      customer_id: customerId || undefined,
      delivery_address: (orderType === "delivery" || orderType === "counter") ? deliveryAddress : undefined,
      delivery_fee: orderType === "delivery" ? deliveryFee : 0,
    });

    setCart([]);
    setCustomerName("");
    setCustomerId("");
    setDeliveryAddress("");
    setDeliveryFee(0);
    setSelectedTable("");
  };

  return (
    <div className="flex h-screen overflow-hidden bg-[#f8fafc]">
      {/* Left: Products Section */}
      <div className="flex-1 flex flex-col p-8 overflow-auto">
        <h1 className="text-2xl font-black text-slate-800 mb-8">Tela de Pedido (PDV)</h1>

        {/* Categories Bar */}
        <div className="flex gap-4 mb-8 overflow-x-auto pb-2 no-scrollbar">
          {categories.map((cat) => (
            <button
              key={cat.name}
              onClick={() => setSelectedCategory(cat.name)}
              className={cn(
                "flex items-center gap-3 px-6 py-4 rounded-2xl font-bold transition-all border-2",
                selectedCategory === cat.name
                  ? "bg-[#6366f1] text-white border-[#6366f1] shadow-lg shadow-indigo-100"
                  : "bg-white text-slate-500 border-transparent hover:border-slate-200"
              )}
            >
              <cat.icon className={cn("h-5 w-5", selectedCategory === cat.name ? "text-white" : "text-slate-400")} />
              {cat.label || cat.name}
            </button>
          ))}
        </div>

        {/* Product Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProducts.map((product) => (
            <div
              key={product.id}
              className="group p-6 rounded-3xl bg-white border border-slate-100 shadow-sm hover:shadow-md transition-all flex flex-col min-h-[160px] relative"
            >
              <div className="flex-1 mb-4">
                <h3 className="font-black text-slate-800 text-lg leading-tight mb-1">{product.name}</h3>
                <p className="text-xs text-slate-400 font-medium line-clamp-2">{product.description || "Sem descrição disponível"}</p>
              </div>
              <div className="flex items-center justify-between mt-auto">
                <span className="text-xl font-black text-[#6366f1]">
                  R$ {Number(product.price).toFixed(2).replace(".", ",")}
                </span>
                <Button
                  size="icon"
                  className="rounded-full bg-[#f0f4ff] hover:bg-[#6366f1] text-[#6366f1] hover:text-white transition-all shadow-none"
                  onClick={() => addToCart(product)}
                >
                  <Plus className="h-5 w-5" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Right: Cart Sidebar */}
      <div className="w-[400px] border-l border-slate-200 bg-white flex flex-col shadow-2xl z-20">
        {/* Order Type Filter (4 Options) */}
        <div className="p-6">
          <div className="bg-slate-100 p-1 rounded-2xl flex gap-1 flex-wrap">
            {[
              { id: "ifood", label: "IFOOD", type: "delivery", channel: "iFood" },
              { id: "balcao", label: "BALCÃO", type: "counter", channel: "Balcão" },
              { id: "mesa", label: "MESA", type: "table", channel: "Balcão" },
              { id: "delivery", label: "DELIVERY", type: "delivery", channel: "WhatsApp" },
            ].map((opt) => {
              const isActive =
                (opt.id === "ifood" && orderChannel === "iFood" && orderType === "delivery") ||
                (opt.id === "balcao" && orderType === "counter") ||
                (opt.id === "mesa" && orderType === "table") ||
                (opt.id === "delivery" && orderType === "delivery" && orderChannel !== "iFood");

              return (
                <button
                  key={opt.id}
                  onClick={() => {
                    setOrderType(opt.type as any);
                    setOrderChannel(opt.channel);
                  }}
                  className={cn(
                    "flex-1 py-3 px-2 rounded-xl text-[10px] font-black transition-all",
                    isActive ? "bg-white text-[#6366f1] shadow-sm ring-1 ring-slate-200" : "text-slate-500 hover:bg-white/50"
                  )}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Action Form */}
        <div className="px-6 space-y-4 mb-6">
          <div className="relative">
            <User className="absolute left-4 top-3.5 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Nome do Cliente..."
              className="pl-11 h-12 rounded-2xl bg-slate-50 border-transparent focus:bg-white transition-all"
              value={customerName}
              onChange={(e) => handleCustomerSelect(e.target.value)}
              list="customers-list"
            />
            <datalist id="customers-list">
              {customers.map((c) => (
                <option key={c.id} value={c.name} />
              ))}
            </datalist>
          </div>

          {(orderType === "delivery" || orderType === "counter") ? (
            <div className="flex gap-2">
              <div className="relative flex-1">
                <MapPin className="absolute left-4 top-3.5 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="Endereço Entrega..."
                  className="pl-11 h-12 rounded-2xl bg-slate-50 border-transparent focus:bg-white transition-all"
                  value={deliveryAddress}
                  onChange={(e) => setDeliveryAddress(e.target.value)}
                />
              </div>
              <Button
                variant="secondary"
                className="h-12 w-12 rounded-2xl bg-[#6366f1] text-white hover:bg-[#4f46e5] font-bold p-0 text-xs shadow-lg shadow-indigo-100"
                onClick={() => setOrderType("delivery")}
              >
                Calc
              </Button>
            </div>
          ) : (
            <div className="relative">
              <Hash className="absolute left-4 top-3.5 h-4 w-4 text-slate-400" />
              <Select value={selectedTable} onValueChange={setSelectedTable}>
                <SelectTrigger className="pl-11 h-12 rounded-2xl bg-slate-50 border-transparent focus:bg-white outline-none">
                  <SelectValue placeholder="Selecionar Mesa..." />
                </SelectTrigger>
                <SelectContent>
                  {freeTables.map((t) => (
                    <SelectItem key={t.id} value={t.id}>Mesa {t.number}</SelectItem>
                  ))}
                  {freeTables.length === 0 && <SelectItem value="none" disabled>Nenhuma mesa livre</SelectItem>}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="flex gap-2 pt-2">
            {orderType === "delivery" && (
              <Badge variant="outline" className="h-9 w-full justify-center px-3 rounded-xl border-dashed border-indigo-200 bg-indigo-50 text-indigo-700 font-bold">
                Taxa de Entrega: R$ {deliveryFee.toFixed(2)}
              </Badge>
            )}
          </div>
        </div>

        {/* Cart Items */}
        <div className="flex-1 overflow-auto px-6 py-4 space-y-4">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-300">
              <ShoppingCart className="h-20 w-20 mb-4 opacity-20" />
              <p className="font-bold text-lg opacity-40 italic">Carrinho vazio</p>
            </div>
          ) : (
            cart.map((item) => (
              <div key={item.product.id} className="flex items-center justify-between group">
                <div className="flex-1 min-w-0 pr-4">
                  <p className="font-black text-slate-800 text-sm truncate">{item.product.name}</p>
                  <p className="text-xs text-[#6366f1] font-bold">R$ {Number(item.product.price).toFixed(2)}</p>
                </div>
                <div className="flex items-center gap-3 bg-slate-50 p-1.5 rounded-2xl border border-slate-100">
                  <button
                    onClick={() => updateQuantity(item.product.id, -1)}
                    className="h-7 w-7 flex items-center justify-center rounded-xl bg-white text-slate-400 hover:text-destructive transition-colors shadow-sm"
                  >
                    <Minus className="h-4 w-4" />
                  </button>
                  <span className="w-4 text-center text-xs font-black text-slate-700">{item.quantity}</span>
                  <button
                    onClick={() => updateQuantity(item.product.id, 1)}
                    className="h-7 w-7 flex items-center justify-center rounded-xl bg-white text-slate-400 hover:text-[#6366f1] transition-colors shadow-sm"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Totals Section */}
        <div className="p-8 bg-slate-50 border-t border-slate-200 space-y-6">
          <div className="space-y-2">
            <div className="flex justify-between items-center text-slate-500 font-bold">
              <span className="text-sm">Subtotal</span>
              <span className="text-lg">R$ {cartTotal.toFixed(2).replace(".", ",")}</span>
            </div>
            {orderType === "delivery" && (
              <div className="flex justify-between items-center text-slate-400 font-medium">
                <span className="text-xs">Taxa de Entrega</span>
                <span className="text-sm">R$ {deliveryFee.toFixed(2).replace(".", ",")}</span>
              </div>
            )}
            <div className="flex justify-between items-center pt-2">
              <span className="text-xl font-black text-slate-800">Total</span>
              <span className="text-3xl font-black text-[#6366f1]">R$ {grandTotal.toFixed(2).replace(".", ",")}</span>
            </div>
          </div>

          <div className="flex gap-4">
            <Button
              variant="ghost"
              className="flex-1 h-14 rounded-2xl font-bold text-slate-500 hover:text-destructive transition-colors"
              onClick={() => setCart([])}
              disabled={cart.length === 0}
            >
              Cancelar
            </Button>
            <Button
              className="flex-[2] h-14 rounded-2xl bg-[#6366f1] hover:bg-[#4f46e5] text-white font-black text-lg shadow-xl shadow-indigo-100 disabled:opacity-50"
              onClick={handleSendOrder}
              disabled={cart.length === 0}
            >
              Finalizar Pedido
            </Button>
          </div>
        </div>
      </div>

      {/* Distance Calculator Dialog */}
      <Dialog open={showDistanceCalc} onOpenChange={setShowDistanceCalc}>
        <DialogContent className="sm:max-w-md rounded-[32px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Calculator className="h-6 w-6 text-[#6366f1]" />
              Cálculo de Entrega Inteligente
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-6 py-4">
            <div className="p-5 rounded-3xl bg-slate-50 space-y-2 border border-slate-100">
              <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest leading-none">Destino Detectado</label>
              <p className="text-sm font-bold text-slate-700 truncate">
                {deliveryAddress || "Endereço não preenchido"}
              </p>
            </div>
            <div className="flex items-center justify-between text-sm px-1">
              <span className="text-slate-500 font-bold">Tarifa por KM:</span>
              <span className="text-slate-800 font-black">R$ 2,00</span>
            </div>
          </div>
          <DialogFooter className="gap-2 sm:justify-between">
            <Button variant="ghost" className="flex-1 rounded-2xl h-12 font-bold" onClick={() => setShowDistanceCalc(false)}>
              Voltar
            </Button>
            <Button className="flex-1 rounded-2xl h-12 font-black bg-[#6366f1] hover:bg-[#4f46e5] shadow-lg shadow-indigo-100" onClick={simulateDistance}>
              <TrendingUp className="h-4 w-4 mr-2" />
              Simular Rota
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
