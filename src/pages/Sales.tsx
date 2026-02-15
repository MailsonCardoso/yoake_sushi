import { useState, useEffect } from "react";
import { useApp, Product, Category, Order } from "@/contexts/AppContext";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, ShoppingCart, Plus, Minus, Trash2, User, Table as TableIcon, MapPin, Bike, Calculator, TrendingUp, ChevronRight, Lock, Unlock, Smartphone, CreditCard, Banknote, Store } from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import axios from "axios";
import { useNavigate, useLocation } from "react-router-dom";

interface CartItem {
  product: Product;
  quantity: number;
}

const API_URL = "https://api2.platformx.com.br/api";
const TORTUOSITY_FACTOR = 1.3;

export default function Sales() {
  const { products, categories, tables, customers, orders, addOrder, payOrder, addItemsToOrder, cashStatus, openCash, closeCash, settings, fetchData } = useApp();
  const navigate = useNavigate();
  const location = useLocation();
  const editOrderId = location.state?.editOrderId;

  const [cart, setCart] = useState<CartItem[]>([]);
  const [productSearch, setProductSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [orderType, setOrderType] = useState<"table" | "counter" | "delivery">("table");
  const [orderChannel, setOrderChannel] = useState<string>("Balcão");
  const [selectedTable, setSelectedTable] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [customerId, setCustomerId] = useState("");
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [deliveryLocationLink, setDeliveryLocationLink] = useState("");
  const [deliveryFee, setDeliveryFee] = useState(0);
  const [calculatedDistance, setCalculatedDistance] = useState(0);

  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showCashModal, setShowCashModal] = useState(false);
  const [showDistanceCalc, setShowDistanceCalc] = useState(false);
  const [openingBalance, setOpeningBalance] = useState("");

  const activeOrderId = editOrderId || (orderType === "table" && orders.find(o => o.table_id === selectedTable && o.status !== "Concluído" && o.status !== "Cancelado")?.id);

  useEffect(() => {
    if (activeOrderId) {
      const order = orders.find(o => o.id === activeOrderId);
      if (order && cart.length === 0) {
        // Only load if cart is empty to avoid overwriting current edits
        // But usually we want to see what's already there
      }
    }
  }, [activeOrderId, orders]);

  const filteredProducts = products.filter((p) => {
    const matchesSearch = p.name.toLowerCase().includes(productSearch.toLowerCase());
    const matchesCategory = selectedCategory === "all" || p.category_id === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const addToCart = (product: Product) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prev, { product, quantity: 1 }];
    });
  };

  const removeFromCart = (productId: string) => {
    setCart((prev) => prev.filter((item) => item.product.id !== productId));
  };

  const updateQuantity = (productId: string, delta: number) => {
    setCart((prev) =>
      prev.map((item) => {
        if (item.product.id === productId) {
          const newQty = Math.max(1, item.quantity + delta);
          return { ...item, quantity: newQty };
        }
        return item;
      })
    );
  };

  const cartTotal = cart.reduce(
    (sum, item) => sum + Number(item.product.price) * item.quantity,
    0
  );

  const activeOrderTotal = activeOrderId
    ? orders.find(o => o.id === activeOrderId)?.total || 0
    : 0;

  const grandTotal = Number(cartTotal) + (orderType === "delivery" ? Number(deliveryFee) : 0);

  const simulateDistance = () => {
    const lat = settings.company_lat;
    const lng = settings.company_lng;

    if (lat && lng && deliveryAddress) {
      const lat1 = Number(lat);
      const lon1 = Number(lng);
      const [latStr, lngStr] = deliveryAddress.split(',').map(s => s.trim());
      const lat2 = Number(latStr);
      const lon2 = Number(lngStr);
      const R = 6371;
      const dLat = (lat2 - lat1) * Math.PI / 180;
      const dLon = (lon2 - lon1) * Math.PI / 180;
      const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

      let dist = (R * c) * TORTUOSITY_FACTOR;
      dist = Math.round(dist * 10) / 10;

      const feePerKm = Number(settings.delivery_fee_per_km || 2);
      const finalFee = Math.round(dist * feePerKm * 100) / 100;

      setCalculatedDistance(dist);
      setDeliveryFee(finalFee);
      toast({ title: "Entrega Calculada", description: `${dist} km → R$ ${finalFee.toFixed(2)}` });
    }
  };

  const handleSendOrder = async () => {
    if (cart.length === 0) {
      toast({ title: "Carrinho vazio", description: "Adicione itens ao pedido", variant: "destructive" });
      return;
    }
    if (orderType === "table" && !selectedTable) {
      toast({ title: "Selecione uma mesa", variant: "destructive" });
      return;
    }

    if (cashStatus?.status !== 'open') {
      toast({ title: "Caixa Fechado", description: "Você precisa abrir o caixa para realizar vendas.", variant: "destructive" });
      setShowCashModal(true);
      return;
    }

    try {
      if (activeOrderId) {
        await addItemsToOrder(activeOrderId, cart.map(i => ({
          product_id: i.product.id,
          quantity: i.quantity,
          unit_price: i.product.price
        })));
        toast({ title: "Itens Adicionados", description: "Pedido atualizado com sucesso." });
      } else {
        const isDeliveryOrder = orderType === "delivery" && orderChannel !== "iFood";
        if (isDeliveryOrder && !deliveryAddress) {
          toast({ title: "Endereço obrigatório", variant: "destructive" });
          return;
        }

        await addOrder({
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
          delivery_address: isDeliveryOrder ? deliveryAddress : undefined,
          delivery_location_link: isDeliveryOrder ? deliveryLocationLink : undefined,
          delivery_fee: isDeliveryOrder ? deliveryFee : 0,
          cash_register_id: cashStatus?.register?.id
        });
        toast({ title: "Pedido Criado", description: "O pedido foi enviado para monitoramento." });
      }

      setCart([]);
      fetchData();
      navigate('/orders');
    } catch (error) {
      console.error("Erro ao enviar pedido:", error);
      toast({ title: "Erro", description: "Não foi possível processar o pedido.", variant: "destructive" });
    }
  };

  return (
    <div className="flex h-screen overflow-hidden bg-[#f8fafc]">
      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 bg-slate-50/50 overflow-hidden">
        {/* Header Section */}
        <div className="p-8 pb-4">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-8">
            <div>
              <h1 className="text-3xl font-black text-slate-800 tracking-tight">Lançar Pedido</h1>
              <p className="text-slate-400 font-medium">Selecione os itens para adicionar ao carrinho</p>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-4">
              <Button
                variant="outline"
                className={cn(
                  "h-12 px-6 rounded-2xl font-bold border-2 transition-all w-full sm:w-auto",
                  cashStatus?.status === 'open'
                    ? "bg-emerald-50 border-emerald-100 text-emerald-600 hover:bg-emerald-100"
                    : "bg-rose-50 border-rose-100 text-rose-600 hover:bg-rose-100"
                )}
                onClick={() => {
                  if (cashStatus?.status === 'closed') {
                    setOpeningBalance(String(cashStatus.last_closing_balance || "0"));
                  }
                  setShowCashModal(true);
                }}
              >
                {cashStatus?.status === 'open' ? (
                  <><Unlock className="h-4 w-4 mr-2" /> Caixa Aberto</>
                ) : (
                  <><Lock className="h-4 w-4 mr-2" /> Caixa Fechado</>
                )}
              </Button>

              <div className="relative w-full sm:w-80">
                <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="Buscar no cardápio..."
                  className="pl-10 h-12 rounded-2xl bg-white border-slate-200 focus:ring-indigo-500 text-sm shadow-sm"
                  value={productSearch}
                  onChange={(e) => setProductSearch(e.target.value)}
                />
              </div>
            </div>
          </div>

          <div className="flex gap-2 overflow-x-auto pb-4 no-scrollbar">
            <Button
              variant={selectedCategory === "all" ? "default" : "outline"}
              className={cn(
                "rounded-xl h-10 px-6 font-bold whitespace-nowrap transition-all",
                selectedCategory === "all" ? "bg-indigo-600 shadow-lg shadow-indigo-100" : "bg-white border-slate-200"
              )}
              onClick={() => setSelectedCategory("all")}
            >
              Todos
            </Button>
            {categories.map((cat) => (
              <Button
                key={cat.id}
                variant={selectedCategory === cat.id ? "default" : "outline"}
                className={cn(
                  "rounded-xl h-10 px-6 font-bold whitespace-nowrap transition-all",
                  selectedCategory === cat.id ? "bg-indigo-600 shadow-lg shadow-indigo-100" : "bg-white border-slate-200"
                )}
                onClick={() => setSelectedCategory(cat.id)}
              >
                {cat.name}
              </Button>
            ))}
          </div>
        </div>

        {/* Products Grid */}
        <div className="flex-1 overflow-y-auto px-8 pb-8 custom-scrollbar">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {filteredProducts.map((p) => (
              <Card
                key={p.id}
                className="group border-none shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all cursor-pointer rounded-3xl overflow-hidden bg-white"
                onClick={() => addToCart(p)}
              >
                <div className="aspect-square relative overflow-hidden bg-slate-100">
                  {p.image_url ? (
                    <img
                      src={p.image_url}
                      alt={p.name}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-300">
                      <ShoppingCart className="h-10 w-10" />
                    </div>
                  )}
                  <div className="absolute top-3 right-3">
                    <Button size="icon" className="h-8 w-8 rounded-xl bg-white/90 backdrop-blur-md text-slate-900 shadow-sm hover:bg-white border-none">
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <CardContent className="p-4">
                  <h3 className="font-bold text-slate-800 text-sm line-clamp-1 mb-1">{p.name}</h3>
                  <p className="text-indigo-600 font-black text-lg">
                    R$ {Number(p.price).toFixed(2).replace(".", ",")}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>

      {/* Cart Sidebar */}
      <div className="w-[450px] bg-white border-l border-slate-100 flex flex-col shadow-2xl relative z-10">
        {activeOrderId && (
          <div className="bg-indigo-600 py-3 px-6 flex items-center justify-between text-white animate-in slide-in-from-top duration-300">
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 bg-emerald-400 rounded-full animate-pulse" />
              <span className="text-xs font-black uppercase tracking-widest">Editando Pedido</span>
            </div>
            <Button variant="ghost" size="icon" className="h-6 w-6 text-white/50 hover:text-white hover:bg-white/10" onClick={() => navigate('/sales', { state: { editOrderId: null } })}>
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        )}

        <div className="p-8 pb-4">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-black text-slate-800 flex items-center gap-3">
              <ShoppingCart className="h-6 w-6 text-indigo-600" />
              Carrinho
            </h2>
            <Badge variant="outline" className="h-8 px-4 rounded-xl font-bold border-slate-100">
              {cart.reduce((a, b) => a + b.quantity, 0)} itens
            </Badge>
          </div>

          <div className="flex p-1 bg-slate-100 rounded-2xl mb-6">
            <button
              className={cn(
                "flex-1 h-10 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2",
                orderType === "table" ? "bg-white text-indigo-600 shadow-sm" : "text-slate-400 hover:text-slate-600"
              )}
              onClick={() => { setOrderType("table"); setOrderChannel("Balcão"); }}
            >
              <TableIcon className="h-3.5 w-3.5" /> MESA
            </button>
            <button
              className={cn(
                "flex-1 h-10 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2",
                orderType === "counter" ? "bg-white text-indigo-600 shadow-sm" : "text-slate-400 hover:text-slate-600"
              )}
              onClick={() => { setOrderType("counter"); setOrderChannel("Balcão"); }}
            >
              <User className="h-3.5 w-3.5" /> BALCÃO
            </button>
            <button
              className={cn(
                "flex-1 h-10 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2",
                orderType === "delivery" ? "bg-white text-indigo-600 shadow-sm" : "text-slate-400 hover:text-slate-600"
              )}
              onClick={() => setOrderType("delivery")}
            >
              <Bike className="h-3.5 w-3.5" /> DELIVERY
            </button>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest leading-none px-1">Canal</label>
                <Select value={orderChannel} onValueChange={setOrderChannel}>
                  <SelectTrigger className="h-12 rounded-2xl border-slate-100 font-bold bg-slate-50/50">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-2xl border-none shadow-xl">
                    <SelectItem value="Balcão">Balcão</SelectItem>
                    <SelectItem value="WhatsApp">WhatsApp</SelectItem>
                    <SelectItem value="iFood">iFood</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {orderType === "table" && (
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest leading-none px-1">Mesa</label>
                  <Select value={selectedTable} onValueChange={setSelectedTable}>
                    <SelectTrigger className="h-12 rounded-2xl border-slate-100 font-bold bg-slate-50/50">
                      <SelectValue placeholder="Escolha..." />
                    </SelectTrigger>
                    <SelectContent className="rounded-2xl border-none shadow-xl overflow-hidden max-h-[300px]">
                      {tables.map(t => (
                        <SelectItem key={t.id} value={t.id} className="h-12 font-bold text-slate-600">
                          Mesa {t.number}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>

            {orderType === "delivery" && orderChannel !== "iFood" && (
              <div className="space-y-3 animate-in fade-in slide-in-from-top-2 duration-300">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest px-1">Endereço de Entrega</label>
                  <div className="relative group">
                    <MapPin className="absolute left-4 top-3.5 h-4 w-4 text-indigo-400" />
                    <Input
                      placeholder="Latitude, Longitude de destino..."
                      className="h-12 rounded-2xl pl-12 border-slate-100 font-bold bg-slate-50/50"
                      value={deliveryAddress}
                      onChange={(e) => setDeliveryAddress(e.target.value)}
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute right-2 top-2 h-8 w-8 text-indigo-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl"
                      onClick={() => setShowDistanceCalc(true)}
                    >
                      <Calculator className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Cart Items List */}
        <div className="flex-1 overflow-y-auto px-8 py-4 custom-scrollbar">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-300 space-y-4 opacity-50">
              <ShoppingCart className="h-16 w-16 stroke-[1.5px]" />
              <p className="font-bold">O carrinho está vazio</p>
            </div>
          ) : (
            <div className="space-y-4">
              {cart.map((item) => (
                <div key={item.product.id} className="group p-4 rounded-3xl bg-slate-50/50 border border-transparent hover:border-indigo-100 hover:bg-indigo-50/30 transition-all flex items-center gap-4">
                  <div className="h-14 w-14 rounded-2xl bg-white shadow-sm flex items-center justify-center text-slate-300 overflow-hidden shrink-0">
                    {item.product.image_url ? (
                      <img src={item.product.image_url} className="w-full h-full object-cover" />
                    ) : (
                      <ShoppingCart className="h-6 w-6" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-slate-800 text-sm truncate">{item.product.name}</h4>
                    <p className="text-xs text-slate-400 font-bold">
                      R$ {Number(item.product.price).toFixed(2).replace(".", ",")} un.
                    </p>
                  </div>
                  <div className="flex items-center gap-1 bg-white p-1 rounded-xl shadow-sm border border-slate-100">
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-7 w-7 rounded-lg text-slate-400 hover:text-rose-500"
                      onClick={() => updateQuantity(item.product.id, -1)}
                    >
                      <Minus className="h-3 w-3" />
                    </Button>
                    <span className="w-6 text-center text-xs font-black text-slate-700">{item.quantity}</span>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-7 w-7 rounded-lg text-slate-400 hover:text-indigo-600"
                      onClick={() => updateQuantity(item.product.id, 1)}
                    >
                      <Plus className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Totals & Summary */}
        <div className="p-8 bg-slate-50/50 border-t border-slate-100 rounded-t-[40px]">
          <div className="space-y-3 mb-8">
            <div className="flex justify-between items-center text-slate-500">
              <span className="text-xs font-bold uppercase tracking-wider">Subtotal</span>
              <span className="font-bold tabular-nums">R$ {cartTotal.toFixed(2).replace(".", ",")}</span>
            </div>
            {orderType === "delivery" && (
              <div className="flex justify-between items-center text-slate-500">
                <span className="text-xs font-bold uppercase tracking-wider">Taxa de Entrega</span>
                <span className="font-bold tabular-nums">R$ {deliveryFee.toFixed(2).replace(".", ",")}</span>
              </div>
            )}
            <div className="flex justify-between items-end pt-2">
              <span className="text-xs font-black uppercase text-slate-400 tracking-tighter">Total Geral</span>
              <span className="text-3xl font-black text-slate-900 leading-none tabular-nums">R$ {grandTotal.toFixed(2).replace(".", ",")}</span>
            </div>
          </div>

          <div className="flex gap-4">
            <Button
              variant="ghost"
              className="flex-1 h-14 rounded-2xl font-bold text-slate-400 hover:text-rose-500 hover:bg-rose-50 transition-all border border-slate-200"
              onClick={() => setCart([])}
              disabled={cart.length === 0}
            >
              Limpar
            </Button>
            <Button
              className="flex-[2] h-14 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xl shadow-xl shadow-indigo-200 disabled:opacity-50 transition-all active:scale-[0.98]"
              onClick={handleSendOrder}
              disabled={cart.length === 0}
            >
              {activeOrderId ? 'CONFIRMAR ITENS' : 'LANÇAR PEDIDO'}
            </Button>
          </div>
        </div>
      </div>

      {/* Distance Calc Modal */}
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
            <Button className="flex-1 rounded-2xl h-12 font-black bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-100 text-white" onClick={simulateDistance}>
              <TrendingUp className="h-4 w-4 mr-2" />
              Simular Rota
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Cash Management Modal */}
      <Dialog open={showCashModal} onOpenChange={setShowCashModal}>
        <DialogContent className="sm:max-w-md rounded-[32px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {cashStatus?.status === 'open' ? (
                <><Unlock className="h-6 w-6 text-emerald-500" /> Fechamento de Caixa</>
              ) : (
                <><Lock className="h-6 w-6 text-rose-500" /> Abertura de Caixa</>
              )}
            </DialogTitle>
          </DialogHeader>
          <div className="py-4 space-y-4">
            {cashStatus?.status === 'open' ? (
              <div className="space-y-4">
                <p className="text-sm font-medium text-slate-500">
                  Ao fechar o caixa, todas as vendas do período serão contabilizadas e o status passará para fechado.
                </p>
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-2">
                  <div className="flex justify-between text-xs font-black uppercase text-slate-400">
                    <span>Abertura</span>
                    <span>R$ {Number(cashStatus.register?.opening_balance).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm font-bold text-indigo-600">
                    <span>Faturamento do Dia</span>
                    <span>R$ {Number(orders.filter(o => o.cash_register_id === cashStatus.register?.id).reduce((s, o) => s + Number(o.total), 0)).toFixed(2)}</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-sm font-bold text-slate-600">Informe o saldo inicial do caixa:</p>
                <div className="relative">
                  <span className="absolute left-4 top-3.5 text-slate-400 font-bold">R$</span>
                  <Input
                    type="number"
                    className="pl-12 h-14 rounded-2xl text-lg font-black"
                    value={openingBalance}
                    onChange={(e) => setOpeningBalance(e.target.value)}
                    placeholder="0.00"
                  />
                </div>
              </div>
            )}
          </div>
          <DialogFooter className="gap-2">
            <Button variant="ghost" className="flex-1 rounded-2xl h-12 font-bold" onClick={() => setShowCashModal(false)}>
              Sair
            </Button>
            {cashStatus?.status === 'open' ? (
              <Button
                className="flex-1 rounded-2xl h-12 font-black bg-rose-500 hover:bg-rose-600 shadow-xl shadow-rose-100 text-white"
                onClick={() => {
                  closeCash();
                  setShowCashModal(false);
                }}
              >
                Encerrar Dia
              </Button>
            ) : (
              <Button
                className="flex-1 rounded-2xl h-12 font-black bg-emerald-500 hover:bg-emerald-600 shadow-xl shadow-emerald-100 text-white"
                onClick={() => {
                  openCash(Number(openingBalance));
                  setShowCashModal(false);
                }}
              >
                Abrir Agora
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
