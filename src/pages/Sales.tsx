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
  { name: "lanches", label: "Lanches", icon: Pizza },
  { name: "bebidas", label: "Bebidas", icon: Coffee },
  { name: "porcoes", label: "Porções", icon: Utensils },
];

export default function Sales() {
  const { products, customers, tables, addOrder, settings } = useApp();
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

    const isDeliveryOrder = orderType === "delivery" && orderChannel !== "iFood";

    if (isDeliveryOrder && !deliveryAddress) {
      toast({ title: "Endereço obrigatório para Delivery", variant: "destructive" });
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
      delivery_address: isDeliveryOrder ? deliveryAddress : undefined,
      delivery_location_link: isDeliveryOrder ? deliveryLocationLink : undefined,
      delivery_fee: isDeliveryOrder ? deliveryFee : 0,
      distance_km: isDeliveryOrder ? calculatedDistance : 0,
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
  };

  return (
    <div className="flex h-screen overflow-hidden bg-[#f8fafc]">
      {/* Left: Products Section */}
      <div className="flex-1 flex flex-col p-6 overflow-auto">
        <h1 className="text-xl font-black text-slate-800 mb-6">Pedidos (PDV)</h1>

        {/* Categories Bar */}
        <div className="flex gap-3 mb-6 overflow-x-auto pb-2 no-scrollbar">
          {categories.map((cat) => (
            <button
              key={cat.name}
              onClick={() => setSelectedCategory(cat.name)}
              className={cn(
                "flex items-center gap-2 px-5 py-3 rounded-xl font-bold transition-all border-2",
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

        {/* Product Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProducts.map((product) => (
            <div
              key={product.id}
              className="group p-5 rounded-2xl bg-white border border-slate-100 shadow-sm hover:shadow-md transition-all flex flex-col min-h-[140px] relative"
            >
              <div className="flex-1 mb-3">
                <h3 className="font-bold text-slate-800 text-base leading-tight mb-1">{product.name}</h3>
                {product.description && (
                  <p className="text-[10px] text-slate-400 font-medium line-clamp-2">{product.description}</p>
                )}
              </div>
              <div className="flex items-center justify-between mt-auto">
                <span className="text-lg font-black text-[#6366f1]">
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
                    // Reset fee if not standard delivery
                    if (!(opt.type === "delivery" && opt.channel !== "iFood")) {
                      setDeliveryFee(0);
                    }
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
              placeholder="Buscar Cliente (Nome ou Celular)..."
              className="pl-11 pr-10 h-10 rounded-xl bg-slate-50 border-transparent focus:bg-white transition-all text-sm"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCustomerName(e.target.value);
                setShowCustomerDropdown(true);
              }}
              onFocus={() => setShowCustomerDropdown(true)}
            />
            {searchTerm && (
              <button
                className="absolute right-3 top-3 text-slate-300 hover:text-slate-500 transition-colors"
                onClick={() => {
                  setSearchTerm("");
                  setCustomerName("");
                  setCustomerId("");
                  setDeliveryAddress("");
                  setDeliveryLocationLink("");
                  setCustomerLatLng({});
                  setDeliveryFee(0);
                }}
              >
                <XCircle className="h-4 w-4" />
              </button>
            )}

            {showCustomerDropdown && filteredCustomers.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-slate-200 rounded-xl shadow-xl z-50 overflow-hidden">
                {filteredCustomers.map((c, idx) => (
                  <div
                    key={`${c.id}-${idx}`}
                    className="w-full text-left px-4 py-3 hover:bg-indigo-50 cursor-pointer transition-colors flex flex-col border-b border-slate-50 last:border-0"
                    onMouseDown={() => handleCustomerSelect(c)}
                  >
                    <div className="flex justify-between items-center mb-0.5">
                      <span className="font-black text-sm text-slate-800">{c.name}</span>
                      <span className="text-[10px] text-[#6366f1] font-black">{c.phone || "Sem Telefone"}</span>
                    </div>
                    <span className="text-[10px] text-slate-400 truncate flex items-center gap-1">
                      <MapPin className="h-2 w-2" /> {c.address || "Sem endereço cadastrado"}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {showCustomerDropdown && searchTerm && filteredCustomers.length === 0 && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-slate-200 rounded-xl shadow-xl z-50 p-4 text-center">
                <p className="text-xs text-slate-400 font-bold">Nenhum cliente encontrado</p>
                <Button
                  variant="ghost"
                  size="sm"
                  className="mt-2 text-[10px] text-indigo-600 font-black h-7"
                  onClick={() => setShowCustomerDropdown(false)}
                >
                  Cadastrar como novo
                </Button>
              </div>
            )}
          </div>

          {(orderType === "delivery" && orderChannel !== "iFood") ? (
            <div className="flex gap-2">
              <div className="relative flex-1">
                <MapPin className="absolute left-4 top-3.5 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="Endereço ou Link do Maps (Obrigatório)..."
                  className="pl-11 h-10 rounded-xl bg-slate-50 border-transparent focus:bg-white transition-all text-sm border-red-100"
                  value={deliveryAddress}
                  onChange={(e) => handleAddressChange(e.target.value)}
                />
              </div>
              <Button
                variant="secondary"
                className="h-10 w-10 rounded-xl bg-[#6366f1] text-white hover:bg-[#4f46e5] font-bold p-0 text-[10px] shadow-lg shadow-indigo-100"
                onClick={simulateDistance}
              >
                Calc
              </Button>
            </div>
          ) : (
            orderType === "table" ? (
              <div className="relative">
                <Hash className="absolute left-4 top-3 h-4 w-4 text-slate-400" />
                <Select value={selectedTable} onValueChange={setSelectedTable}>
                  <SelectTrigger className="pl-11 h-10 rounded-xl bg-slate-50 border-transparent focus:bg-white outline-none text-sm">
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
            ) : null
          )}

          <div className="flex gap-2 pt-2">
            {(orderType === "delivery" && orderChannel !== "iFood") && (
              <div className="flex items-center gap-2 w-full pt-2">
                <Badge variant="outline" className="h-10 shrink-0 justify-center px-3 rounded-xl border-dashed border-indigo-200 bg-indigo-50 text-indigo-700 font-bold">
                  Taxa Entrega
                </Badge>
                <div className="relative flex-1">
                  <span className="absolute left-3 top-3 text-xs font-bold text-slate-500">R$</span>
                  <Input
                    type="number"
                    step="1.00"
                    className="pl-8 h-10 rounded-xl bg-white border-indigo-100 text-indigo-700 font-black text-sm shadow-sm focus:ring-indigo-500"
                    value={deliveryFee}
                    onChange={(e) => setDeliveryFee(Number(e.target.value))}
                    placeholder="0.00"
                  />
                </div>
              </div>
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
              <span className="text-lg font-black text-slate-800">Total</span>
              <span className="text-2xl font-black text-[#6366f1]">R$ {grandTotal.toFixed(2).replace(".", ",")}</span>
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
              className="flex-[2] h-12 rounded-xl bg-[#6366f1] hover:bg-[#4f46e5] text-white font-black text-base shadow-xl shadow-indigo-100 disabled:opacity-50"
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
