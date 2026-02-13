import { useState } from "react";
import { useApp, Product, Customer } from "@/contexts/AppContext";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Plus, Pencil, Package, Users, MapPin, ExternalLink } from "lucide-react";

export default function Registrations() {
  const { products, setProducts, customers, setCustomers } = useApp();
  const { toast } = useToast();

  // Product state
  const [showProductModal, setShowProductModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [productForm, setProductForm] = useState({ name: "", price: "", category: "Burgers" });

  // Customer state
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [customerForm, setCustomerForm] = useState({ name: "", phone: "", address: "", mapsLink: "" });

  const openProductModal = (product?: Product) => {
    if (product) {
      setEditingProduct(product);
      setProductForm({ name: product.name, price: String(product.price), category: product.category });
    } else {
      setEditingProduct(null);
      setProductForm({ name: "", price: "", category: "Burgers" });
    }
    setShowProductModal(true);
  };

  const saveProduct = () => {
    if (!productForm.name || !productForm.price) return;
    if (editingProduct) {
      setProducts((prev) =>
        prev.map((p) =>
          p.id === editingProduct.id
            ? { ...p, name: productForm.name, price: Number(productForm.price), category: productForm.category }
            : p
        )
      );
      toast({ title: "Produto atualizado!" });
    } else {
      setProducts((prev) => [
        ...prev,
        { id: `p${Date.now()}`, name: productForm.name, price: Number(productForm.price), category: productForm.category },
      ]);
      toast({ title: "Produto criado!" });
    }
    setShowProductModal(false);
  };

  const openCustomerModal = (customer?: Customer) => {
    if (customer) {
      setEditingCustomer(customer);
      setCustomerForm({ name: customer.name, phone: customer.phone, address: customer.address, mapsLink: customer.mapsLink });
    } else {
      setEditingCustomer(null);
      setCustomerForm({ name: "", phone: "", address: "", mapsLink: "" });
    }
    setShowCustomerModal(true);
  };

  const saveCustomer = () => {
    if (!customerForm.name) return;
    if (editingCustomer) {
      setCustomers((prev) =>
        prev.map((c) => (c.id === editingCustomer.id ? { ...c, ...customerForm } : c))
      );
      toast({ title: "Cliente atualizado!" });
    } else {
      setCustomers((prev) => [...prev, { id: `c${Date.now()}`, ...customerForm }]);
      toast({ title: "Cliente cadastrado!" });
    }
    setShowCustomerModal(false);
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Cadastros</h1>

      <Tabs defaultValue="products">
        <TabsList>
          <TabsTrigger value="products" className="gap-2">
            <Package className="h-4 w-4" /> Produtos
          </TabsTrigger>
          <TabsTrigger value="customers" className="gap-2">
            <Users className="h-4 w-4" /> Clientes
          </TabsTrigger>
        </TabsList>

        {/* Products Tab */}
        <TabsContent value="products" className="mt-4">
          <Card className="border-none shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <CardTitle className="text-lg">Produtos</CardTitle>
              <Button size="sm" onClick={() => openProductModal()}>
                <Plus className="h-4 w-4 mr-1" /> Novo Produto
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {products.map((product) => (
                  <div
                    key={product.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-secondary/50"
                  >
                    <div className="flex items-center gap-3">
                      <span className="font-medium text-sm">{product.name}</span>
                      <Badge variant="secondary">{product.category}</Badge>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-semibold text-sm text-primary">
                        R$ {product.price.toFixed(2).replace(".", ",")}
                      </span>
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openProductModal(product)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Customers Tab */}
        <TabsContent value="customers" className="mt-4">
          <Card className="border-none shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <CardTitle className="text-lg">Clientes</CardTitle>
              <Button size="sm" onClick={() => openCustomerModal()}>
                <Plus className="h-4 w-4 mr-1" /> Novo Cliente
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {customers.map((customer) => (
                  <div
                    key={customer.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-secondary/50"
                  >
                    <div className="space-y-1">
                      <p className="font-medium text-sm">{customer.name}</p>
                      <p className="text-xs text-muted-foreground">{customer.phone}</p>
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <MapPin className="h-3 w-3" /> {customer.address}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {customer.mapsLink && (
                        <a
                          href={customer.mapsLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary hover:text-primary/80"
                        >
                          <ExternalLink className="h-4 w-4" />
                        </a>
                      )}
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openCustomerModal(customer)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Product Modal */}
      <Dialog open={showProductModal} onOpenChange={setShowProductModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingProduct ? "Editar Produto" : "Novo Produto"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Nome</Label>
              <Input value={productForm.name} onChange={(e) => setProductForm((p) => ({ ...p, name: e.target.value }))} />
            </div>
            <div>
              <Label>Preço (R$)</Label>
              <Input type="number" step="0.01" value={productForm.price} onChange={(e) => setProductForm((p) => ({ ...p, price: e.target.value }))} />
            </div>
            <div>
              <Label>Categoria</Label>
              <Select value={productForm.category} onValueChange={(v) => setProductForm((p) => ({ ...p, category: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Burgers">Burgers</SelectItem>
                  <SelectItem value="Bebidas">Bebidas</SelectItem>
                  <SelectItem value="Porções">Porções</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowProductModal(false)}>Cancelar</Button>
            <Button onClick={saveProduct}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Customer Modal */}
      <Dialog open={showCustomerModal} onOpenChange={setShowCustomerModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingCustomer ? "Editar Cliente" : "Novo Cliente"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Nome</Label>
              <Input value={customerForm.name} onChange={(e) => setCustomerForm((p) => ({ ...p, name: e.target.value }))} />
            </div>
            <div>
              <Label>Telefone</Label>
              <Input value={customerForm.phone} onChange={(e) => setCustomerForm((p) => ({ ...p, phone: e.target.value }))} />
            </div>
            <div>
              <Label>Endereço</Label>
              <Input value={customerForm.address} onChange={(e) => setCustomerForm((p) => ({ ...p, address: e.target.value }))} />
            </div>
            <div>
              <Label>Link Google Maps</Label>
              <Input value={customerForm.mapsLink} onChange={(e) => setCustomerForm((p) => ({ ...p, mapsLink: e.target.value }))} placeholder="https://maps.google.com/..." />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCustomerModal(false)}>Cancelar</Button>
            <Button onClick={saveCustomer}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
