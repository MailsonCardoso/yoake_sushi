import { useState, useMemo, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { useApp, Product, OrderItem } from "@/contexts/AppContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  Trash2,
  MapPin,
  Calculator,
  Send,
  User,
  Smartphone,
  TrendingUp,
} from "lucide-react";

const categories = ["Todos", "burgers", "drinks", "portions"];

export default function Sales() {
  const { products, customers, tables, addOrder } = useApp();
  const { toast } = useToast();
  const location = useLocation();

  const [selectedCategory, setSelectedCategory] = useState("Todos");
  const [cart, setCart] = useState<{ product: Product, quantity: number }[]>([]);
  const [orderType, setOrderType] = useState<"table" | "delivery" | "counter">("counter");
  const [orderChannel, setOrderChannel] = useState<string>("Balcão");
  const [selectedTable, setSelectedTable] = useState<string>("");

  useEffect(() => {
    if (location.state?.tableId) {
      setOrderType("table");
      setSelectedTable(location.state.tableId);
    }
  }, [location.state]);
  const [customerName, setCustomerName] = useState("");
  const [customerId, setCustomerId] = useState<string>("");
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [deliveryFee, setDeliveryFee] = useState(0);
  const [showDistanceCalc, setShowDistanceCalc] = useState(false);
  const [calculatedDistance, setCalculatedDistance] = useState(0);

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
      delivery_address: orderType === "delivery" ? deliveryAddress : undefined,
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
    <div className="flex h-screen overflow-hidden">
      {/* Left: Products */}
      <div className="flex-1 flex flex-col p-6 overflow-auto">
        <h1 className="text-2xl font-bold mb-4">Vendas (PDV)</h1>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          {/* Order Type */}
          <section className="space-y-2">
            <Label className="text-xs text-muted-foreground uppercase tracking-wider font-bold">Tipo de Pedido</Label>
            <div className="flex gap-2">
              {(["counter", "table", "delivery"] as const).map((type) => (
                <Button
                  key={type}
                  variant={orderType === type ? "default" : "outline"}
                  size="sm"
                  className="flex-1"
                  onClick={() => {
                    setOrderType(type);
                    if (type === "delivery") setOrderChannel("WhatsApp");
                    else setOrderChannel("Balcão");
                  }}
                >
                  {type === "counter" ? "Balcão" : type === "table" ? "Mesa" : "Delivery"}
                </Button>
              ))}
            </div>
          </section>

          {/* Channel */}
          <section className="space-y-2">
            <Label className="text-xs text-muted-foreground uppercase tracking-wider font-bold">Canal</Label>
            <Select value={orderChannel} onValueChange={setOrderChannel}>
              <SelectTrigger className="h-9">
                <SelectValue placeholder="Canal de Venda" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Balcão">Balcão</SelectItem>
                <SelectItem value="WhatsApp">WhatsApp</SelectItem>
                <SelectItem value="iFood">iFood</SelectItem>
                <SelectItem value="Outros">Outros</SelectItem>
              </SelectContent>
            </Select>
          </section>
        </div>

        {/* Conditional fields */}
        {orderType === "table" && (
          <div className="mb-4">
            <Select value={selectedTable} onValueChange={setSelectedTable}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Selecionar mesa disponível" />
              </SelectTrigger>
              <SelectContent>
                {freeTables.map((t) => (
                  <SelectItem key={t.id} value={t.id}>
                    Mesa {t.number} ({t.seats} lugares)
                  </SelectItem>
                ))}
                {freeTables.length === 0 && <SelectItem value="none" disabled>Nenhuma mesa livre</SelectItem>}
              </SelectContent>
            </Select>
          </div>
        )}

        {(orderType === "delivery" || orderType === "counter") && (
          <div className="mb-4 space-y-2">
            <div className="relative">
              <User className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Nome do cliente (Busca inteligente)"
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

            {orderType === "delivery" && (
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <MapPin className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Endereço de entrega (Snapshot)"
                    value={deliveryAddress}
                    onChange={(e) => setDeliveryAddress(e.target.value)}
                    className="pl-9"
                  />
                </div>
                <Button
                  variant="outline"
                  size="icon"
                  className="shrink-0"
                  onClick={() => setShowDistanceCalc(true)}
                  title="Calcular distância"
                >
                  <Calculator className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
        )}

        {/* Categories */}
        <div className="flex gap-2 mb-4 overflow-x-auto pb-1 no-scrollbar">
          {categories.map((cat) => (
            <Button
              key={cat}
              variant={selectedCategory === cat ? "default" : "secondary"}
              size="sm"
              className="capitalize whitespace-nowrap"
              onClick={() => setSelectedCategory(cat)}
            >
              {cat === "Todos" ? "Todos os Itens" : cat}
            </Button>
          ))}
        </div>

        {/* Product Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {filteredProducts.map((product) => (
            <button
              key={product.id}
              onClick={() => addToCart(product)}
              className="group p-4 rounded-xl bg-card border border-border hover:border-primary hover:shadow-md transition-all text-left flex flex-col h-full"
            >
              <div className="flex-1">
                <p className="font-bold text-sm leading-tight group-hover:text-primary transition-colors">{product.name}</p>
                <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{product.description}</p>
              </div>
              <div className="mt-3 flex items-center justify-between">
                <p className="primary-gradient-text font-black text-base">
                  R$ {Number(product.price).toFixed(2).replace(".", ",")}
                </p>
                <Plus className="h-4 w-4 text-primary opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Right: Cart */}
      <div className="w-80 lg:w-96 border-l border-border bg-card flex flex-col shadow-2xl z-10">
        <div className="p-4 border-b border-border bg-secondary/20">
          <h2 className="font-bold flex items-center gap-2 text-primary">
            <ShoppingCart className="h-5 w-5" />
            Cupom de Venda
          </h2>
          <div className="flex gap-2 mt-2">
            <Badge variant="outline" className="text-[10px] capitalize">{orderType}</Badge>
            <Badge variant="outline" className="text-[10px] capitalize">{orderChannel}</Badge>
          </div>
        </div>

        <div className="flex-1 overflow-auto p-4 space-y-3">
          {cart.length === 0 && (
            <div className="h-full flex flex-col items-center justify-center text-muted-foreground opacity-20">
              <ShoppingCart className="h-12 w-12 mb-4" />
              <p className="text-sm font-medium">Carrinho de Compras Vazio</p>
            </div>
          )}
          {cart.map((item) => (
            <div
              key={item.product.id}
              className="flex items-center justify-between p-3 rounded-xl bg-secondary/30 group"
            >
              <div className="flex-1 min-w-0 pr-2">
                <p className="text-sm font-bold truncate">{item.product.name}</p>
                <p className="text-xs text-primary font-medium">
                  R$ {Number(item.product.price).toFixed(2).replace(".", ",")}
                </p>
              </div>
              <div className="flex items-center bg-background rounded-lg border p-1 shadow-sm">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 rounded-md hover:bg-destructive hover:text-white"
                  onClick={() => updateQuantity(item.product.id, -1)}
                >
                  <Minus className="h-3 w-3" />
                </Button>
                <span className="w-8 text-center text-xs font-bold">{item.quantity}</span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 rounded-md"
                  onClick={() => updateQuantity(item.product.id, 1)}
                >
                  <Plus className="h-3 w-3" />
                </Button>
              </div>
            </div>
          ))}
        </div>

        {/* Cart Footer */}
        <div className="p-6 border-t border-border bg-secondary/10 space-y-4">
          <div className="space-y-1.5 pt-2">
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>Subtotal</span>
              <span>R$ {cartTotal.toFixed(2).replace(".", ",")}</span>
            </div>
            {orderType === "delivery" && (
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>Taxa de Entrega</span>
                <span>R$ {deliveryFee.toFixed(2).replace(".", ",")}</span>
              </div>
            )}
            <div className="flex justify-between font-black text-xl pt-2 border-t mt-2">
              <span>Total</span>
              <span className="text-primary">R$ {grandTotal.toFixed(2).replace(".", ",")}</span>
            </div>
          </div>
          <Button
            className="w-full h-12 text-base font-bold shadow-lg shadow-primary/20"
            size="lg"
            onClick={handleSendOrder}
            disabled={cart.length === 0}
          >
            <Send className="h-5 w-5 mr-3" />
            Finalizar Lançamento
          </Button>
        </div>
      </div>

      {/* Distance Calculator Dialog */}
      <Dialog open={showDistanceCalc} onOpenChange={setShowDistanceCalc}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Calculator className="h-5 w-5 text-primary" />
              Cálculo de Entrega Inteligente
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="p-4 rounded-lg bg-secondary/50 space-y-1">
              <Label className="text-xs text-muted-foreground uppercase">Destino Detectado</Label>
              <p className="text-sm font-bold truncate">
                {deliveryAddress || "Endereço não preenchido"}
              </p>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Tarifa por KM:</span>
              <span className="font-bold">R$ 2,00</span>
            </div>
            <p className="text-[10px] text-muted-foreground italic">
              Integração com Google Maps API em fase de homologação. Simulando distância para teste...
            </p>
          </div>
          <DialogFooter className="gap-2 sm:justify-between">
            <Button variant="outline" className="flex-1" onClick={() => setShowDistanceCalc(false)}>
              Voltar
            </Button>
            <Button className="flex-1" onClick={simulateDistance}>
              <TrendingUp className="h-4 w-4 mr-2" />
              Simular Rota
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
