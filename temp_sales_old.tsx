import { useState, useMemo } from "react";
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
} from "lucide-react";

const categories = ["Todos", "Burgers", "Bebidas", "Por├º├Áes"];

export default function Sales() {
  const { products, customers, tables, addOrder } = useApp();
  const { toast } = useToast();

  const [selectedCategory, setSelectedCategory] = useState("Todos");
  const [cart, setCart] = useState<OrderItem[]>([]);
  const [orderType, setOrderType] = useState<"table" | "delivery" | "counter">("counter");
  const [selectedTable, setSelectedTable] = useState<string>("");
  const [customerName, setCustomerName] = useState("");
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

  const freeTables = tables.filter((t) => t.status === "free");

  const cartTotal = cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
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
      setDeliveryAddress(customer.address);
    }
  };

  const simulateDistance = () => {
    const dist = Math.round((Math.random() * 10 + 1) * 10) / 10;
    setCalculatedDistance(dist);
    setDeliveryFee(Math.round(dist * 2 * 100) / 100);
    setShowDistanceCalc(false);
    toast({ title: "Dist├óncia calculada", description: `${dist} km ÔåÆ Taxa: R$ ${(dist * 2).toFixed(2)}` });
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
      items: cart,
      total: grandTotal,
      type: orderType,
      tableId: orderType === "table" ? Number(selectedTable) : undefined,
      customerName: customerName || undefined,
      address: orderType === "delivery" ? deliveryAddress : undefined,
      deliveryFee: orderType === "delivery" ? deliveryFee : undefined,
      status: "pending",
    });

    toast({ title: "Pedido enviado!", description: "O pedido foi enviado para a cozinha." });
    setCart([]);
    setCustomerName("");
    setDeliveryAddress("");
    setDeliveryFee(0);
    setSelectedTable("");
  };

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Left: Products */}
      <div className="flex-1 flex flex-col p-6 overflow-auto">
        <h1 className="text-2xl font-bold mb-4">Vendas (PDV)</h1>

        {/* Order Type */}
        <div className="flex gap-2 mb-4">
          {(["counter", "table", "delivery"] as const).map((type) => (
            <Button
              key={type}
              variant={orderType === type ? "default" : "outline"}
              size="sm"
              onClick={() => setOrderType(type)}
            >
              {type === "counter" ? "Balc├úo" : type === "table" ? "Mesa" : "Delivery"}
            </Button>
          ))}
        </div>

        {/* Conditional fields */}
        {orderType === "table" && (
          <div className="mb-4">
            <Select value={selectedTable} onValueChange={setSelectedTable}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Selecionar mesa" />
              </SelectTrigger>
              <SelectContent>
                {freeTables.map((t) => (
                  <SelectItem key={t.id} value={String(t.id)}>
                    Mesa {t.id}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {(orderType === "delivery" || orderType === "counter") && (
          <div className="mb-4 space-y-2">
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

            {orderType === "delivery" && (
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <MapPin className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Endere├ºo de entrega"
                    value={deliveryAddress}
                    onChange={(e) => setDeliveryAddress(e.target.value)}
                    className="pl-9"
                  />
                </div>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setShowDistanceCalc(true)}
                  title="Calcular dist├óncia"
                >
                  <Calculator className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
        )}

        {/* Categories */}
        <div className="flex gap-2 mb-4 flex-wrap">
          {categories.map((cat) => (
            <Button
              key={cat}
              variant={selectedCategory === cat ? "default" : "secondary"}
              size="sm"
              onClick={() => setSelectedCategory(cat)}
            >
              {cat}
            </Button>
          ))}
        </div>

        {/* Product Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {filteredProducts.map((product) => (
            <button
              key={product.id}
              onClick={() => addToCart(product)}
              className="p-4 rounded-xl bg-card border border-border hover:border-primary hover:shadow-md transition-all text-left"
            >
              <p className="font-medium text-sm">{product.name}</p>
              <p className="text-primary font-bold mt-1">
                R$ {product.price.toFixed(2).replace(".", ",")}
              </p>
              <Badge variant="secondary" className="mt-2 text-xs">
                {product.category}
              </Badge>
            </button>
          ))}
        </div>
      </div>

      {/* Right: Cart */}
      <div className="w-80 lg:w-96 border-l border-border bg-card flex flex-col">
        <div className="p-4 border-b border-border">
          <h2 className="font-bold flex items-center gap-2">
            <ShoppingCart className="h-5 w-5 text-primary" />
            Carrinho
          </h2>
        </div>

        <div className="flex-1 overflow-auto p-4 space-y-2">
          {cart.length === 0 && (
            <p className="text-center text-muted-foreground py-8 text-sm">
              Carrinho vazio
            </p>
          )}
          {cart.map((item) => (
            <div
              key={item.product.id}
              className="flex items-center justify-between p-3 rounded-lg bg-secondary/50"
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{item.product.name}</p>
                <p className="text-xs text-muted-foreground">
                  R$ {item.product.price.toFixed(2).replace(".", ",")}
                </p>
              </div>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => updateQuantity(item.product.id, -1)}
                >
                  <Minus className="h-3 w-3" />
                </Button>
                <span className="w-6 text-center text-sm font-medium">{item.quantity}</span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => updateQuantity(item.product.id, 1)}
                >
                  <Plus className="h-3 w-3" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-destructive"
                  onClick={() => updateQuantity(item.product.id, -item.quantity)}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            </div>
          ))}
        </div>

        {/* Cart Footer */}
        <div className="p-4 border-t border-border space-y-2">
          {orderType === "delivery" && deliveryFee > 0 && (
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>Taxa de entrega ({calculatedDistance} km)</span>
              <span>R$ {deliveryFee.toFixed(2).replace(".", ",")}</span>
            </div>
          )}
          <div className="flex justify-between font-bold text-lg">
            <span>Total</span>
            <span className="text-primary">R$ {grandTotal.toFixed(2).replace(".", ",")}</span>
          </div>
          <Button className="w-full" size="lg" onClick={handleSendOrder}>
            <Send className="h-4 w-4 mr-2" />
            Enviar Pedido
          </Button>
        </div>
      </div>

      {/* Distance Calculator Dialog */}
      <Dialog open={showDistanceCalc} onOpenChange={setShowDistanceCalc}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Calcular Dist├óncia</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Endere├ºo: {deliveryAddress || "N├úo informado"}
            </p>
            <p className="text-sm">Taxa: <strong>R$ 2,00 por km</strong></p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDistanceCalc(false)}>
              Cancelar
            </Button>
            <Button onClick={simulateDistance}>
              <Calculator className="h-4 w-4 mr-2" />
              Calcular (simulado)
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
