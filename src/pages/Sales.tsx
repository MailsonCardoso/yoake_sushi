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
  Hash,
  Search,
  Lock,
  Unlock,
  CreditCard,
  Banknote,
  Pix,
  ChevronRight
} from "lucide-react";
import { cn } from "@/lib/utils";

const categories = [
  { name: "Todos", icon: Utensils },
  { name: "lanches", label: "Lanches", icon: Pizza },
  { name: "bebidas", label: "Bebidas", icon: Coffee },
  { name: "porcoes", label: "Porções", icon: Utensils },
];

export default function Sales() {
  const { products, customers, orders, tables, addOrder, settings } = useApp();
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
  const [deliveryLocationLink, setDeliveryLocationLink] = useState("");
  const [customerLatLng, setCustomerLatLng] = useState<{ lat?: string, lng?: string }>({});
  const [deliveryFee, setDeliveryFee] = useState(0);
  const [showDistanceCalc, setShowDistanceCalc] = useState(false);
  const [calculatedDistance, setCalculatedDistance] = useState(0);
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [productSearch, setProductSearch] = useState("");

  const { cashStatus, openCash, closeCash } = useApp();
  const [showCashModal, setShowCashModal] = useState(false);
  const [openingBalance, setOpeningBalance] = useState("");

  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedPaymentAccount, setSelectedPaymentAccount] = useState<string>("");

  useEffect(() => {
    if (location.state?.tableId) {
      setOrderType("table");
      setSelectedTable(location.state.tableId);
    }
  }, [location.state]);

  const filteredProducts = useMemo(
    () => {
      let result = selectedCategory === "Todos"
        ? products
        : products.filter((p) => p.category === selectedCategory);

      if (productSearch) {
        const lowerSearch = productSearch.toLowerCase();
        result = result.filter(p =>
          p.name.toLowerCase().includes(lowerSearch) ||
          (p.description && p.description.toLowerCase().includes(lowerSearch))
        );
      }
      return result;
    },
    [products, selectedCategory, productSearch]
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

  const extractLatLngFromLink = (link: string) => {
    if (!link) return null;
    try {
      // Formatos suportados: @lat,lng | q=lat,lng | search/lat,lng | ll=lat,lng
      const patterns = [
        /@(-?\d+\.\d+),(-?\d+\.\d+)/,
        /q=(-?\d+\.\d+),(-?\d+\.\d+)/,
        /search\/(-?\d+\.\d+),(-?\d+\.\d+)/,
        /ll=(-?\d+\.\d+),(-?\d+\.\d+)/
      ];

      for (const pattern of patterns) {
        const match = link.match(pattern);
        if (match) {
          console.log("Coordenadas extraídas via regex:", match[1], match[2]);
          return { lat: match[1], lng: match[2] };
        }
      }
    } catch (e) {
      console.log("Erro ao extrair coordenadas", e);
    }
    return null;
  };

  const handleCustomerSelect = (customer: any) => {
    console.log("Cliente selecionado:", customer.name);
    setCustomerName(customer.name);
    setSearchTerm(customer.name);
    setCustomerId(customer.id);

    // PRIORIDADE: Se não tiver endereço de texto, usa o Link
    const displayAddress = customer.address || customer.location_link || "";
    setDeliveryAddress(displayAddress);
    setDeliveryLocationLink(customer.location_link || "");

    // Se o cliente já tem lat/lng, usa. Se não, tenta extrair do link agora.
    if (customer.lat && customer.lng) {
      setCustomerLatLng({ lat: customer.lat, lng: customer.lng });
    } else if (customer.location_link) {
      const coords = extractLatLngFromLink(customer.location_link);
      if (coords) {
        setCustomerLatLng(coords);
      }
    } else {
      setCustomerLatLng({});
    }

    setShowCustomerDropdown(false);
  };

  const handleAddressChange = (val: string) => {
    setDeliveryAddress(val);

    // Se colarem um link do Google Maps
    if (val.includes("google.com/maps") || val.includes("goo.gl/maps") || val.includes("maps.app.goo.gl")) {
      setDeliveryLocationLink(val);
      const coords = extractLatLngFromLink(val);
      if (coords) {
        setCustomerLatLng(coords);
        toast({ title: "Link Detectado!", description: "Coordenadas extraídas com sucesso." });
      }
    }
  };

  useEffect(() => {
    const hasCoords = customerLatLng.lat && customerLatLng.lng;
    const hasCompany = settings.company_lat && settings.company_lng;

    if (orderType === "delivery" && hasCoords && hasCompany) {
      console.log("Auto-calculating distance...");
      toast({ title: "Calculando Entrega", description: "Coordenadas detectadas, calculando distância e taxa." });
      simulateDistance();
    } else if (orderType === "delivery" && hasCoords && !hasCompany) {
      toast({ title: "Coordenadas da Empresa Ausentes", description: "Por favor, configure as coordenadas da sua empresa nas configurações para calcular a entrega.", variant: "destructive" });
    }
  }, [customerLatLng, orderType, settings.company_lat, settings.company_lng]);

  const filteredCustomers = useMemo(() => {
    if (!searchTerm) return [];
    return customers.filter(c =>
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.phone.includes(searchTerm)
    ).slice(0, 5); // Limit result to avoid overflow
  }, [customers, searchTerm]);

  const simulateDistance = () => {
    const TORTUOSITY_FACTOR = 1.3;

    let lat = customerLatLng.lat;
    let lng = customerLatLng.lng;

    // Fallback: tenta extrair do endereço se os estados estiverem vazios
    if (!lat || !lng) {
      const extracted = extractLatLngFromLink(deliveryAddress);
      if (extracted) {
        lat = extracted.lat;
        lng = extracted.lng;
      }
    }

    if (lat && lng && settings.company_lat && settings.company_lng) {
      const lat1 = Number(settings.company_lat);
      const lon1 = Number(settings.company_lng);
      const lat2 = Number(lat);
      const lon2 = Number(lng);
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
    } else {
      console.warn("Calculo impossível. Faltando dados:", {
        cliente: { lat, lng },
        empresa: { lat: settings.company_lat, lng: settings.company_lng }
      });
      // Importante: Se for zero, não dar toast de erro toda hora no useEffect
    }
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

    if (cashStatus?.status !== 'open') {
      toast({ title: "Caixa Fechado", description: "Você precisa abrir o caixa para realizar vendas.", variant: "destructive" });
      setShowCashModal(true);
      return;
    }

    const isDeliveryOrder = orderType === "delivery" && orderChannel !== "iFood";

    if (isDeliveryOrder && !deliveryAddress) {
      toast({ title: "Endereço obrigatório para Delivery", variant: "destructive" });
      return;
    }

    // Se o canal for iFood, ignorar modal de pagamento e salvar como IFOOD
    if (orderChannel === "iFood") {
      confirmSendOrder("IFOOD");
      return;
    }

    setShowPaymentModal(true);
  };

  const confirmSendOrder = (account: string) => {
    const isDeliveryOrder = orderType === "delivery" && orderChannel !== "iFood";

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
      delivery_address: isDeliveryOrder ? deliveryAddress : undefined,
      delivery_location_link: isDeliveryOrder ? deliveryLocationLink : undefined,
      delivery_fee: isDeliveryOrder ? deliveryFee : 0,
      distance_km: isDeliveryOrder ? calculatedDistance : 0,
      payment_account: account,
      cash_register_id: cashStatus?.register?.id
    });

    setCart([]);
    setCustomerName("");
    setSearchTerm("");
    setCustomerId("");
    setDeliveryAddress("");
    setDeliveryLocationLink("");
    setDeliveryFee(0);
    setCalculatedDistance(0);
    setSelectedTable("");
    setShowPaymentModal(false);
  };

  return (
    <div className="flex h-screen overflow-hidden bg-[#f8fafc]">
      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 bg-slate-50/50 overflow-hidden">
        {/* Header Section */}
        <div className="p-8 pb-4">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-8">
            <div>
              <h1 className="text-3xl font-black text-slate-800 tracking-tight">Novo Pedido</h1>
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

          {/* Categories Bar */}
          <div className="flex gap-3 overflow-x-auto pb-4 no-scrollbar">
            {categories.map((cat) => (
              <button
                key={cat.name}
                onClick={() => setSelectedCategory(cat.name)}
                className={cn(
                  "flex items-center gap-2 px-6 py-3 rounded-2xl font-bold transition-all border-2 shrink-0",
                  selectedCategory === cat.name
                    ? "bg-[#6366f1] text-white border-[#6366f1] shadow-lg shadow-indigo-100"
                    : "bg-white text-slate-500 border-transparent hover:border-slate-200"
                )}
              >
                <cat.icon className={cn("h-4 w-4", selectedCategory === cat.name ? "text-white" : "text-slate-400")} />
                <span className="text-sm">{cat.label || cat.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Scrollable Product Grid Area */}
        <div className="flex-1 overflow-y-auto p-8 pt-0">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-6 pb-20">
            {filteredProducts.map((product) => (
              <div
                key={product.id}
                className="group p-6 rounded-3xl bg-white border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all flex flex-col min-h-[160px] relative"
              >
                <div className="flex-1 mb-4">
                  <h3 className="font-bold text-slate-800 text-lg leading-tight mb-2">{product.name}</h3>
                  {product.description && (
                    <p className="text-xs text-slate-400 font-medium line-clamp-2 leading-relaxed">{product.description}</p>
                  )}
                </div>
                <div className="flex items-center justify-between mt-auto">
                  <span className="text-xl font-black text-[#6366f1]">
                    R$ {Number(product.price).toFixed(2).replace(".", ",")}
                  </span>
                  <Button
                    size="icon"
                    className="h-10 w-10 rounded-2xl bg-[#f0f4ff] hover:bg-[#6366f1] text-[#6366f1] hover:text-white transition-all shadow-none"
                    onClick={() => addToCart(product)}
                  >
                    <Plus className="h-6 w-6" />
                  </Button>
                </div>
              </div>
            ))}
            {filteredProducts.length === 0 && (
              <div className="col-span-full py-20 text-center">
                <p className="text-slate-400 font-bold italic">Nenhum produto encontrado nesta categoria.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Right Sidebar: Cart & Order Info */}
      <div className="w-[420px] bg-white border-l border-slate-200 flex flex-col shadow-[-10px_0_30px_rgba(0,0,0,0.02)] z-30">
        {/* Order Type Selector */}
        <div className="p-6 border-b border-slate-50">
          <div className="bg-slate-100 p-1.5 rounded-2xl flex gap-1">
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
                    if (!(opt.type === "delivery" && opt.channel !== "iFood")) {
                      setDeliveryFee(0);
                    }
                  }}
                  className={cn(
                    "flex-1 py-3 px-1 rounded-xl text-[10px] font-black transition-all",
                    isActive
                      ? "bg-white text-[#6366f1] shadow-md ring-1 ring-slate-200"
                      : "text-slate-400 hover:text-slate-600 hover:bg-white/50"
                  )}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="px-6 py-4 space-y-4">
          {/* Customer Search */}
          <div className="relative">
            <User className="absolute left-4 top-3.5 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Nome ou Celular do Cliente..."
              className="pl-11 h-12 rounded-2xl bg-slate-50 border-none focus:bg-white focus:ring-2 focus:ring-indigo-100 transition-all text-sm font-medium"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCustomerName(e.target.value);
                setShowCustomerDropdown(true);
              }}
              onFocus={() => setShowCustomerDropdown(true)}
            />

            {showCustomerDropdown && filteredCustomers.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-3 bg-white border border-slate-100 rounded-2xl shadow-2xl z-50 overflow-hidden max-h-80 overflow-y-auto">
                {filteredCustomers.map((c, idx) => (
                  <div
                    key={`${c.id}-${idx}`}
                    className="px-5 py-4 hover:bg-slate-50 cursor-pointer transition-colors border-b border-slate-50 last:border-0"
                    onMouseDown={() => handleCustomerSelect(c)}
                  >
                    <div className="flex justify-between items-start mb-1">
                      <span className="font-bold text-slate-800">{c.name}</span>
                      <span className="text-[10px] bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-lg font-black">{c.phone || "S/ TEL"}</span>
                    </div>
                    <span className="text-[10px] text-slate-400 flex items-center gap-1 truncate">
                      <MapPin className="h-3 w-3" /> {c.address || "Sem endereço"}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Dynamic Fields */}
          {(orderType === "delivery" && orderChannel !== "iFood") ? (
            <div className="flex gap-2">
              <div className="relative flex-1">
                <MapPin className="absolute left-4 top-3.5 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="Endereço de Entrega..."
                  className="pl-11 h-12 rounded-2xl bg-slate-50 border-none focus:bg-white transition-all text-sm font-medium"
                  value={deliveryAddress}
                  onChange={(e) => handleAddressChange(e.target.value)}
                />
              </div>
              <Button
                variant="secondary"
                className="h-12 w-12 rounded-2xl bg-indigo-50 text-indigo-600 hover:bg-indigo-600 hover:text-white transition-all p-0 shadow-none border-none"
                onClick={simulateDistance}
              >
                <Calculator className="h-5 w-5" />
              </Button>
            </div>
          ) : orderType === "table" ? (
            <div className="relative">
              <Hash className="absolute left-4 top-3.5 h-4 w-4 text-slate-400 z-10" />
              <Select value={selectedTable} onValueChange={setSelectedTable}>
                <SelectTrigger className="pl-11 h-12 rounded-2xl bg-slate-50 border-none focus:ring-2 focus:ring-indigo-100 text-sm font-medium">
                  <SelectValue placeholder="Selecionar Mesa..." />
                </SelectTrigger>
                <SelectContent className="rounded-2xl border-none shadow-2xl">
                  {freeTables.map((t) => (
                    <SelectItem key={t.id} value={t.id} className="rounded-xl">Mesa {t.number}</SelectItem>
                  ))}
                  {freeTables.length === 0 && <SelectItem value="none" disabled>Nenhuma mesa disponível</SelectItem>}
                </SelectContent>
              </Select>
            </div>
          ) : null}
        </div>

        {/* Cart Items List */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-200">
              <div className="p-8 rounded-full bg-slate-50 mb-4">
                <ShoppingCart className="h-12 w-12" />
              </div>
              <p className="font-black text-xs uppercase tracking-widest opacity-50">Carrinho Vazio</p>
            </div>
          ) : (
            <div className="space-y-4">
              {cart.map((item) => (
                <div key={item.product.id} className="flex items-center gap-4 group">
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-slate-800 text-sm truncate">{item.product.name}</p>
                    <p className="text-xs text-indigo-500 font-black">R$ {Number(item.product.price).toFixed(2)}</p>
                  </div>
                  <div className="flex items-center gap-2 bg-slate-50 p-1 rounded-xl">
                    <button
                      onClick={() => updateQuantity(item.product.id, -1)}
                      className="h-8 w-8 flex items-center justify-center rounded-lg bg-white shadow-sm text-slate-400 hover:text-rose-500 transition-colors"
                    >
                      <Minus className="h-3 w-3" />
                    </button>
                    <span className="w-6 text-center text-xs font-black text-slate-700">{item.quantity}</span>
                    <button
                      onClick={() => updateQuantity(item.product.id, 1)}
                      className="h-8 w-8 flex items-center justify-center rounded-lg bg-white shadow-sm text-slate-400 hover:text-indigo-600 transition-colors"
                    >
                      <Plus className="h-3 w-3" />
                    </button>
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
              <span className="font-bold">R$ {cartTotal.toFixed(2).replace(".", ",")}</span>
            </div>
            {orderType === "delivery" && (
              <div className="flex justify-between items-center text-slate-500">
                <span className="text-xs font-bold uppercase tracking-wider">Taxa de Entrega</span>
                <span className="font-bold">R$ {deliveryFee.toFixed(2).replace(".", ",")}</span>
              </div>
            )}
            <div className="flex justify-between items-end pt-2">
              <span className="text-xs font-black uppercase text-slate-400 tracking-tighter">Total Geral</span>
              <span className="text-3xl font-black text-slate-900 leading-none">R$ {grandTotal.toFixed(2).replace(".", ",")}</span>
            </div>
          </div>

          <div className="flex gap-4">
            <Button
              variant="ghost"
              className="flex-1 h-14 rounded-2xl font-bold text-slate-400 hover:text-rose-500 hover:bg-rose-50 transition-all"
              onClick={() => setCart([])}
              disabled={cart.length === 0}
            >
              Limpar
            </Button>
            <Button
              className="flex-[2] h-14 rounded-2xl bg-[#6366f1] hover:bg-[#4f46e5] text-white font-black text-base shadow-xl shadow-indigo-200 disabled:opacity-50 transition-all"
              onClick={handleSendOrder}
              disabled={cart.length === 0}
            >
              Finalizar
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
                  <div className="flex justify-between text-sm font-bold text-[#6366f1]">
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
                {cashStatus?.last_closing_balance && (
                  <p className="text-[10px] text-muted-foreground font-bold uppercase italic px-2">
                    Sugestão baseada no último fechamento: R$ {Number(cashStatus.last_closing_balance).toFixed(2)}
                  </p>
                )}
              </div>
            )}
          </div>
          <DialogFooter className="gap-2">
            <Button variant="ghost" className="flex-1 rounded-2xl h-12 font-bold" onClick={() => setShowCashModal(false)}>
              Sair
            </Button>
            {cashStatus?.status === 'open' ? (
              <Button
                className="flex-1 rounded-2xl h-12 font-black bg-rose-500 hover:bg-rose-600 shadow-lg shadow-rose-100 text-white"
                onClick={() => {
                  closeCash();
                  setShowCashModal(false);
                }}
              >
                Encerrar Dia
              </Button>
            ) : (
              <Button
                className="flex-1 rounded-2xl h-12 font-black bg-emerald-500 hover:bg-emerald-600 shadow-lg shadow-emerald-100 text-white"
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

      {/* Payment Selection Modal */}
      <Dialog open={showPaymentModal} onOpenChange={setShowPaymentModal}>
        <DialogContent className="sm:max-w-md rounded-[32px] p-0 overflow-hidden">
          <div className="p-8 bg-indigo-600 text-white">
            <p className="text-[10px] font-black uppercase tracking-widest opacity-70">Finalizar Pedido</p>
            <h2 className="text-3xl font-black mt-1">R$ {grandTotal.toFixed(2).replace('.', ',')}</h2>
          </div>
          <div className="p-8 space-y-4">
            <p className="text-xs font-black uppercase text-slate-400 tracking-widest leading-none">Forma de Pagamento</p>
            <div className="grid grid-cols-1 gap-2">
              <Button
                variant="outline"
                className="h-14 justify-between px-6 rounded-2xl border-2 hover:border-indigo-500 hover:bg-indigo-50 transition-all font-bold group"
                onClick={() => confirmSendOrder("DINHEIRO")}
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-slate-100 group-hover:bg-indigo-100 text-slate-600 group-hover:text-indigo-600">
                    <Banknote className="h-5 w-5" />
                  </div>
                  <span>Dinheiro</span>
                </div>
                <ChevronRight className="h-4 w-4 text-slate-300" />
              </Button>

              <Button
                variant="outline"
                className="h-14 justify-between px-6 rounded-2xl border-2 hover:border-indigo-500 hover:bg-indigo-50 transition-all font-bold group"
                onClick={() => confirmSendOrder("PIX")}
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-slate-100 group-hover:bg-indigo-100 text-slate-600 group-hover:text-indigo-600">
                    <TrendingUp className="h-5 w-5" />
                  </div>
                  <span>PIX</span>
                </div>
                <ChevronRight className="h-4 w-4 text-slate-300" />
              </Button>

              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant="outline"
                  className="h-20 flex-col gap-1 rounded-2xl border-2 hover:border-indigo-500 hover:bg-indigo-50 transition-all font-bold text-xs"
                  onClick={() => confirmSendOrder("NUBANK")}
                >
                  <CreditCard className="h-5 w-5 mb-1 text-purple-600" />
                  CARTÃO NUBANK
                </Button>
                <Button
                  variant="outline"
                  className="h-20 flex-col gap-1 rounded-2xl border-2 hover:border-indigo-500 hover:bg-indigo-50 transition-all font-bold text-xs"
                  onClick={() => confirmSendOrder("PICPAY")}
                >
                  <CreditCard className="h-5 w-5 mb-1 text-emerald-600" />
                  CARTÃO PICPAY
                </Button>
              </div>
            </div>
          </div>
          <div className="p-4 bg-slate-50 flex justify-center">
            <Button variant="ghost" className="text-slate-400 font-bold text-xs" onClick={() => setShowPaymentModal(false)}>
              Voltar ao Carrinho
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
