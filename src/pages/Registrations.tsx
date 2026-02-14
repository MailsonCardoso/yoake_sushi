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
import { Plus, Pencil, Package, Users, MapPin, ExternalLink, Activity, Trash2 } from "lucide-react";
import axios from "axios";

export default function Registrations() {
  const { products, fetchData, customers, settings } = useApp();
  const { toast } = useToast();

  const [showProductModal, setShowProductModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [productForm, setProductForm] = useState({ name: "", price: "", category: "burgers", description: "" });

  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [customerToDelete, setCustomerToDelete] = useState<string | null>(null);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [customerForm, setCustomerForm] = useState({ name: "", phone: "", address: "", location_link: "", lat: "", lng: "" });

  const openProductModal = (product?: Product) => {
    if (product) {
      setEditingProduct(product);
      setProductForm({ name: product.name, price: String(product.price), category: product.category, description: product.description || "" });
    } else {
      setEditingProduct(null);
      setProductForm({ name: "", price: "", category: "burgers", description: "" });
    }
    setShowProductModal(true);
  };

  const saveProduct = async () => {
    if (!productForm.name || !productForm.price) return;
    try {
      if (editingProduct) {
        await axios.put(`https://api2.platformx.com.br/api/products/${editingProduct.id}`, {
          ...productForm,
          price: Number(productForm.price)
        });
        toast({ title: "Produto atualizado!" });
      } else {
        await axios.post(`https://api2.platformx.com.br/api/products`, {
          ...productForm,
          price: Number(productForm.price)
        });
        toast({ title: "Produto criado!" });
      }
      fetchData();
      setShowProductModal(false);
    } catch (error) {
      toast({ title: "Erro ao salvar produto", variant: "destructive" });
    }
  };

  const openCustomerModal = (customer?: Customer) => {
    if (customer) {
      setEditingCustomer(customer);
      setCustomerForm({
        name: customer.name,
        phone: customer.phone,
        address: customer.address,
        location_link: customer.location_link || "",
        lat: customer.lat || "",
        lng: customer.lng || ""
      });
    } else {
      setEditingCustomer(null);
      setCustomerForm({ name: "", phone: "", address: "", location_link: "", lat: "", lng: "" });
    }
    setShowCustomerModal(true);
  };

  const saveCustomer = async () => {
    if (!customerForm.name) return;
    try {
      if (editingCustomer) {
        await axios.put(`https://api2.platformx.com.br/api/customers/${editingCustomer.id}`, customerForm);
        toast({ title: "Cadastro atualizado!" });
      } else {
        await axios.post(`https://api2.platformx.com.br/api/customers`, customerForm);
        toast({ title: "Cliente cadastrado!" });
      }
      fetchData();
      setShowCustomerModal(false);
    } catch (error: any) {
      console.error(error);
      const errorMessage = error.response?.data?.message || "Erro desconhecido ao cadastrar cliente.";
      toast({
        title: "Erro ao cadastrar",
        description: errorMessage,
        variant: "destructive"
      });
    }
  };

  const deleteCustomer = (id: string) => {
    setCustomerToDelete(id);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    if (!customerToDelete) return;
    try {
      await axios.delete(`https://api2.platformx.com.br/api/customers/${customerToDelete}`);
      toast({ title: "Cliente excluído!" });
      fetchData();
      setShowDeleteConfirm(false);
      setCustomerToDelete(null);
    } catch (error) {
      toast({ title: "Erro ao excluir cliente", variant: "destructive" });
    }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Cadastros</h1>
          <p className="text-muted-foreground text-sm">Gestão de cardápio e base de clientes</p>
        </div>
        <div className="flex gap-2">
          <Badge variant="outline" className="gap-1 font-mono">
            <Activity className="h-3 w-3 text-status-free" /> Online
          </Badge>
        </div>
      </div>

      <Tabs defaultValue="products" className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-4">
          <TabsTrigger value="products" className="gap-2">
            <Package className="h-4 w-4" /> Produtos & Cardápio
          </TabsTrigger>
          <TabsTrigger value="customers" className="gap-2">
            <Users className="h-4 w-4" /> Base de Clientes
          </TabsTrigger>
        </TabsList>

        <TabsContent value="products">
          <Card className="border-none shadow-premium">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg">Cardápio Ativo</CardTitle>
              <Button size="sm" onClick={() => openProductModal()} className="shadow-lg shadow-primary/20">
                <Plus className="h-4 w-4 mr-1" /> Novo Item
              </Button>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {products.map((product) => (
                  <div
                    key={product.id}
                    className="flex items-center justify-between p-4 rounded-xl bg-secondary/20 hover:bg-secondary/40 transition-colors border border-transparent hover:border-border"
                  >
                    <div className="flex flex-col">
                      <span className="font-bold text-sm leading-tight">{product.name}</span>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="outline" className="text-[10px] uppercase h-4 px-1">{product.category}</Badge>
                        <span className="text-[10px] text-muted-foreground">ID: {product.id.split("-")[0]}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="font-black text-sm text-primary">
                        R$ {Number(product.price).toFixed(2).replace(".", ",")}
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

        <TabsContent value="customers">
          <Card className="border-none shadow-premium">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg">Clientes Registrados</CardTitle>
              <Button size="sm" onClick={() => openCustomerModal()} variant="secondary">
                <Plus className="h-4 w-4 mr-1" /> Novo Cliente
              </Button>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {customers.map((customer) => (
                  <div
                    key={customer.id}
                    className="flex items-center justify-between p-4 rounded-xl bg-secondary/10 border border-border"
                  >
                    <div className="space-y-1 min-w-0">
                      <p className="font-bold text-sm truncate">{customer.name}</p>
                      <p className="text-xs font-medium text-primary">{customer.phone}</p>
                      <p className="text-xs text-muted-foreground flex items-center gap-1 truncate max-w-[200px]">
                        <MapPin className="h-3 w-3 shrink-0" /> {customer.address}
                      </p>
                    </div>
                    <div className="flex items-center gap-1">
                      {customer.location_link && (
                        <Button variant="ghost" size="icon" asChild>
                          <a href={customer.location_link} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="h-4 w-4 text-muted-foreground" />
                          </a>
                        </Button>
                      )}
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openCustomerModal(customer)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10" onClick={() => deleteCustomer(customer.id)}>
                        <Trash2 className="h-4 w-4" />
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
          <div className="space-y-4 py-2">
            <div>
              <Label>Nome do Item</Label>
              <Input value={productForm.name} onChange={(e) => setProductForm((p) => ({ ...p, name: e.target.value }))} placeholder="Ex: Temaki Salmão Completo" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Preço (R$)</Label>
                <Input type="number" step="0.01" value={productForm.price} onChange={(e) => setProductForm((p) => ({ ...p, price: e.target.value }))} placeholder="0.00" />
              </div>
              <div>
                <Label>Categoria</Label>
                <Select value={productForm.category} onValueChange={(v) => setProductForm((p) => ({ ...p, category: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="burgers">Burgers</SelectItem>
                    <SelectItem value="drinks">Bebidas</SelectItem>
                    <SelectItem value="portions">Porções</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label>Descrição / Ingredientes</Label>
              <Input value={productForm.description} onChange={(e) => setProductForm((p) => ({ ...p, description: e.target.value }))} placeholder="Breve descrição do produto..." />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" className="flex-1" onClick={() => setShowProductModal(false)}>Cancelar</Button>
            <Button className="flex-1" onClick={saveProduct}>Salvar Alterações</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Customer Modal */}
      <Dialog open={showCustomerModal} onOpenChange={setShowCustomerModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingCustomer ? "Editar Cadastro" : "Cadastro de Cliente"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label>Nome Completo</Label>
              <Input value={customerForm.name} onChange={(e) => setCustomerForm((p) => ({ ...p, name: e.target.value }))} />
            </div>
            <div>
              <Label>Telefone (WhatsApp)</Label>
              <Input value={customerForm.phone} onChange={(e) => setCustomerForm((p) => ({ ...p, phone: e.target.value }))} placeholder="(00) 00000-0000" />
            </div>
            <div>
              <Label>Endereço de Entrega Padrão</Label>
              <Input value={customerForm.address} onChange={(e) => setCustomerForm((p) => ({ ...p, address: e.target.value }))} />
            </div>
            <div>
              <Label>Link do Google Maps (WhatsApp)</Label>
              <Input
                value={customerForm.location_link}
                onChange={(e) => {
                  const link = e.target.value;
                  setCustomerForm(p => ({ ...p, location_link: link }));

                  // Auto-extract Lat/Lng from Google Maps Links
                  // Formats: 
                  // 1. @-2.5314079,-44.1695986,
                  // 2. ?q=-2.5314079,-44.1695986
                  // 3. /search/-2.5314079,-44.1695986

                  try {
                    const regex = /@(-?\d+\.\d+),(-?\d+\.\d+)/;
                    const match = link.match(regex);

                    if (match) {
                      setCustomerForm(p => ({
                        ...p,
                        location_link: link,
                        lat: match[1],
                        lng: match[2]
                      }));
                      toast({ title: "Localização Detectada!", description: `Lat: ${match[1]}, Lng: ${match[2]}` });
                    } else {
                      // Try fallback for ?q=
                      const qRegex = /q=(-?\d+\.\d+),(-?\d+\.\d+)/;
                      const qMatch = link.match(qRegex);
                      if (qMatch) {
                        setCustomerForm(p => ({
                          ...p,
                          location_link: link,
                          lat: qMatch[1],
                          lng: qMatch[2]
                        }));
                        toast({ title: "Localização Detectada!", description: `Lat: ${qMatch[1]}, Lng: ${qMatch[2]}` });
                      }
                    }
                  } catch (e) {
                    console.log("Erro ao extrair coordenadas", e);
                  }
                }}
                placeholder="Cole o link aqui (ex: https://maps.google.com/...)"
              />
              <p className="text-[10px] text-muted-foreground mt-1">
                Cole o link de localização do WhatsApp aqui para preencher Lat/Lng automaticamente.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Latitude</Label>
                <Input value={customerForm.lat} onChange={(e) => setCustomerForm((p) => ({ ...p, lat: e.target.value }))} placeholder="-23.5505" />
              </div>
              <div>
                <Label>Longitude</Label>
                <Input value={customerForm.lng} onChange={(e) => setCustomerForm((p) => ({ ...p, lng: e.target.value }))} placeholder="-46.6333" />
              </div>
            </div>
            {customerForm.lat && customerForm.lng && settings.company_lat && settings.company_lng && (
              <div className="p-4 bg-indigo-50 rounded-xl border border-indigo-100 flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <Activity className="h-4 w-4 text-[#6366f1]" />
                  <span className="text-xs font-bold text-slate-600 uppercase">Distância da Empresa:</span>
                </div>
                <span className="text-sm font-black text-[#6366f1]">
                  {(() => {
                    const lat1 = Number(settings.company_lat);
                    const lon1 = Number(settings.company_lng);
                    const lat2 = Number(customerForm.lat);
                    const lon2 = Number(customerForm.lng);
                    const R = 6371;
                    const dLat = (lat2 - lat1) * Math.PI / 180;
                    const dLon = (lon2 - lon1) * Math.PI / 180;
                    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
                    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
                    const d = R * c;
                    return d.toFixed(2) + " km";
                  })()}
                </span>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" className="flex-1" onClick={() => setShowCustomerModal(false)}>Cancelar</Button>
            <Button className="flex-1" onClick={saveCustomer}>Finalizar Cadastro</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Modal */}
      <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <Trash2 className="h-5 w-5" />
              Confirmar Exclusão
            </DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-muted-foreground">
              Tem certeza que deseja excluir este cliente? Esta ação não pode ser desfeita.
            </p>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setShowDeleteConfirm(false)} className="flex-1">
              Cancelar
            </Button>
            <Button variant="destructive" onClick={confirmDelete} className="flex-1">
              Excluir permanentemente
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
