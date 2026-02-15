import { useState, useMemo, useEffect } from "react";
import { useApp, Product } from "@/contexts/AppContext";
import { Card, CardContent } from "@/components/ui/card";
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
import { toast } from "@/components/ui/use-toast";
import {
  ShoppingCart,
  Plus,
  Minus,
  Trash2,
  MapPin,
  Calculator,
  Send,
  User,
  Search,
  Lock,
  Unlock,
  Table as TableIcon,
  Bike,
  Store
} from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";

interface CartItem {
  product: Product;
  quantity: number;
}

export default function Sales() {
  const {
    products = [],
    customers = [],
    tables = [],
    orders = [],
    addOrder,
    addItemsToOrder,
    cashStatus,
    openCash,
    closeCash,
    settings = {},
    fetchData
  } = useApp();

  const navigate = useNavigate();
  const location = useLocation();
  const editOrderId = location.state?.editOrderId;

  const [selectedCategory, setSelectedCategory] = useState("Todos");
  const [productSearch, setProductSearch] = useState("");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [orderType, setOrderType] = useState<"table" | "delivery" | "counter">("table");
  const [orderChannel, setOrderChannel] = useState<string>("Balcão");
  const [selectedTable, setSelectedTable] = useState<string>("");
  const [customerName, setCustomerName] = useState("");
  const [customerId, setCustomerId] = useState("");
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [deliveryFee, setDeliveryFee] = useState(0);
  const [showDistanceCalc, setShowDistanceCalc] = useState(false);
  const [showCashModal, setShowCashModal] = useState(false);
  const [openingBalance, setOpeningBalance] = useState("");
  const [calculatedDistance, setCalculatedDistance] = useState(0);

  const categories = useMemo(() => {
    const cats = Array.from(new Set(products.map((p) => p.category)));
    return ["Todos", ...cats];
  }, [products]);

  const activeOrderId = editOrderId || (orderType === "table" && orders.find(o => o.table_id === selectedTable && o.status !== "Concluído" && o.status !== "Cancelado")?.id);

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchesCategory = selectedCategory === "Todos" || p.category === selectedCategory;
      const matchesSearch = p.name.toLowerCase().includes(productSearch.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [products, selectedCategory, productSearch]);

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
      setDeliveryAddress(customer.address || "");
    }
  };

  const simulateDistance = () => {
    const dist = Math.round((Math.random() * 10 + 1) * 10) / 10;
    setCalculatedDistance(dist);
    const feePerKm = Number(settings.delivery_fee_per_km || 2);
    setDeliveryFee(dist * feePerKm);
    setShowDistanceCalc(false);
    toast({ title: "Distância calculada", description: `${dist} km → Taxa: R$ ${(dist * feePerKm).toFixed(2)}` });
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
      toast({ title: "Caixa Fechado", description: "Abra o caixa para vender.", variant: "destructive" });
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
        toast({ title: "Itens Adicionados", description: "Pedido atualizado." });
      } else {
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
          delivery_address: orderType === "delivery" ? deliveryAddress : undefined,
          delivery_fee: orderType === "delivery" ? deliveryFee : 0,
          cash_register_id: cashStatus?.register?.id
        });
        toast({ title: "Pedido Criado", description: "Enviado para monitoramento." });
      }

      setCart([]);
      fetchData();
      navigate('/orders');
    } catch (error) {
      console.error("Erro ao enviar:", error);
      toast({ title: "Erro", description: "Não foi possível processar.", variant: "destructive" });
    }
  };

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Left Area: Products */}
      <div className="flex-1 flex flex-col p-6 overflow-hidden">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">Vendas (PDV)</h1>
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="sm"
              className={cashStatus?.status === 'open' ? "text-emerald-600 border-emerald-200 bg-emerald-50" : "text-rose-600 border-rose-200 bg-rose-50"}
              onClick={() => setShowCashModal(true)}
            >
              {cashStatus?.status === 'open' ? <Unlock className="h-4 w-4 mr-2" /> : <Lock className="h-4 w-4 mr-2" />}
              Caixa {cashStatus?.status === 'open' ? 'Aberto' : 'Fechado'}
            </Button>
            <div className="relative w-64">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar produto..."
                className="pl-9"
                value={productSearch}
                onChange={(e) => setProductSearch(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Order Type Tabs */}
        <div className="flex gap-2 mb-6">
          {(["table", "counter", "delivery", "ifood"] as const).map((type) => (
            <Button
              key={type}
              variant={orderType === (type === "ifood" ? "delivery" : type) && (type !== "ifood" || orderChannel === "iFood") ? "default" : "outline"}
              onClick={() => {
                if (type === "ifood") {
                  setOrderType("delivery");
                  setOrderChannel("iFood");
                } else {
                  setOrderType(type);
                  setOrderChannel("Balcão");
                }
              }}
              className="px-6"
            >
              {type === "table" ? <><TableIcon className="h-4 w-4 mr-2" /> Mesa</>
                : type === "counter" ? <><User className="h-4 w-4 mr-2" /> Balcão</>
                  : type === "delivery" ? <><Bike className="h-4 w-4 mr-2" /> Delivery</>
                    : <><Store className="h-4 w-4 mr-2" /> iFood</>}
            </Button>
          ))}
        </div>

        {/* Dynamic Fields */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          {orderType === "table" && (
            <Select value={selectedTable} onValueChange={setSelectedTable}>
              <SelectTrigger>
                <SelectValue placeholder="Selecionar mesa" />
              </SelectTrigger>
              <SelectContent>
                {tables.map((t) => (
                  <SelectItem key={t.id} value={t.id}>Mesa {t.number}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          {(orderType === "delivery" || orderType === "counter") && (
            <div className="relative">
              <User className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Nome do cliente"
                value={customerName}
                onChange={(e) => handleCustomerSelect(e.target.value)}
                list="customers-list"
                className="pl-9"
              />
              <datalist id="customers-list">
                {customers.map((c) => (
                  <option key={c.id} value={c.name} />
                ))}
              </datalist>
            </div>
          )}

          {orderType === "delivery" && orderChannel !== "iFood" && (
            <div className="flex gap-2 col-span-2">
              <div className="relative flex-1">
                <MapPin className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Endereço de entrega"
                  value={deliveryAddress}
                  onChange={(e) => setDeliveryAddress(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Button variant="outline" size="icon" onClick={() => setShowDistanceCalc(true)}>
                <Calculator className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>

        {/* Categories */}
        <div className="flex gap-2 mb-4 overflow-x-auto pb-2 no-scrollbar">
          {categories.map((cat) => (
            <Button
              key={cat}
              variant={selectedCategory === cat ? "default" : "secondary"}
              size="sm"
              onClick={() => setSelectedCategory(cat)}
              className="whitespace-nowrap"
            >
              {cat}
            </Button>
          ))}
        </div>

        {/* Grid */}
        <div className="flex-1 overflow-y-auto pr-2">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
            {filteredProducts.map((product) => (
              <Card
                key={product.id}
                onClick={() => addToCart(product)}
                className="cursor-pointer hover:border-primary hover:shadow-md transition-all group"
              >
                <CardContent className="p-3">
                  {product.image_url && (
                    <div className="aspect-square mb-2 overflow-hidden rounded-md bg-slate-100">
                      <img src={product.image_url} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                    </div>
                  )}
                  <p className="font-bold text-sm line-clamp-1">{product.name}</p>
                  <p className="text-primary font-bold mt-1">R$ {Number(product.price).toFixed(2).replace(".", ",")}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>

      {/* Right Area: Cart */}
      <div className="w-80 lg:w-96 border-l border-border bg-card flex flex-col">
        <div className="p-4 border-b border-border bg-slate-50/50">
          <h2 className="font-bold flex items-center gap-2">
            <ShoppingCart className="h-5 w-5 text-primary" />
            Carrinho {activeOrderId && <Badge className="ml-2 bg-emerald-500">Editando #{activeOrderId.slice(0, 4)}</Badge>}
          </h2>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {cart.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground opacity-50">
              <ShoppingCart className="h-12 w-12 mb-2" />
              <p className="text-sm">Carrinho vazio</p>
            </div>
          )}
          {cart.map((item) => (
            <div key={item.product.id} className="flex items-center justify-between p-3 rounded-lg border bg-background shadow-sm">
              <div className="flex-1 min-w-0 pr-2">
                <p className="text-sm font-bold truncate">{item.product.name}</p>
                <p className="text-xs text-muted-foreground">R$ {Number(item.product.price).toFixed(2).replace(".", ",")}</p>
              </div>
              <div className="flex items-center gap-1">
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => updateQuantity(item.product.id, -1)}>
                  <Minus className="h-3 w-3" />
                </Button>
                <span className="w-6 text-center text-sm font-bold">{item.quantity}</span>
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => updateQuantity(item.product.id, 1)}>
                  <Plus className="h-3 w-3" />
                </Button>
              </div>
            </div>
          ))}
        </div>

        <div className="p-4 border-t border-border bg-slate-50/50 space-y-4">
          <div className="space-y-1">
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>Subtotal</span>
              <span>R$ {cartTotal.toFixed(2).replace(".", ",")}</span>
            </div>
            {orderType === "delivery" && deliveryFee > 0 && (
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>Entrega</span>
                <span>R$ {deliveryFee.toFixed(2).replace(".", ",")}</span>
              </div>
            )}
            <div className="flex justify-between font-bold text-xl pt-2">
              <span>Total</span>
              <span className="text-primary">R$ {grandTotal.toFixed(2).replace(".", ",")}</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <Button variant="outline" className="w-full" onClick={() => setCart([])} disabled={cart.length === 0}>
              Limpar
            </Button>
            <Button className="w-full bg-primary hover:bg-primary/90" size="lg" onClick={handleSendOrder} disabled={cart.length === 0}>
              <Send className="h-4 w-4 mr-2" />
              {activeOrderId ? 'Atualizar' : 'Lançar'}
            </Button>
          </div>
        </div>
      </div>

      {/* Modals */}
      <Dialog open={showDistanceCalc} onOpenChange={setShowDistanceCalc}>
        <DialogContent>
          <DialogHeader><DialogTitle>Calcular Entrega</DialogTitle></DialogHeader>
          <div className="py-4">Taxa: <strong>R$ {settings.delivery_fee_per_km || 2},00 por km</strong></div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDistanceCalc(false)}>Voltar</Button>
            <Button onClick={simulateDistance}>Calcular Rota</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showCashModal} onOpenChange={setShowCashModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{cashStatus?.status === 'open' ? "Fechar Caixa" : "Abrir Caixa"}</DialogTitle>
          </DialogHeader>
          {cashStatus?.status !== 'open' && (
            <div className="space-y-4 py-4">
              <p className="text-sm font-medium">Saldo Inicial:</p>
              <Input type="number" value={openingBalance} onChange={(e) => setOpeningBalance(e.target.value)} placeholder="0.00" />
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCashModal(false)}>Sair</Button>
            <Button className={cashStatus?.status === 'open' ? "bg-rose-500" : "bg-emerald-500"} onClick={() => {
              if (cashStatus?.status === 'open') closeCash();
              else openCash(Number(openingBalance));
              setShowCashModal(false);
            }}>
              {cashStatus?.status === 'open' ? "Encerrar Dia" : "Abrir Agora"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
