import React, { createContext, useContext, useState, ReactNode, useEffect } from "react";
import axios from "axios";
import { useToast } from "@/hooks/use-toast";

const API_URL = "https://api2.platformx.com.br/api";

// Configuração global do Axios
axios.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

axios.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("token");
      if (window.location.pathname !== "/login") {
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);

export interface Product {
  id: string;
  name: string;
  price: number;
  category: "burgers" | "drinks" | "portions";
  description?: string;
  is_active: boolean;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  address: string;
  location_link?: string;
  lat?: string;
  lng?: string;
}

export interface OrderItem {
  product_id: string;
  product?: Product;
  quantity: number;
  unit_price: number;
}

export interface Order {
  id: string;
  readable_id: string;
  items: OrderItem[];
  total: number;
  subtotal: number;
  type: "mesa" | "delivery" | "balcao";
  channel: "iFood" | "WhatsApp" | "Balcão" | "Outros";
  table_id?: string;
  customer_id?: string;
  customer?: Customer;
  table?: TableData;
  delivery_address?: string;
  delivery_fee?: number;
  status: "Pendente" | "Preparando" | "Pronto" | "Despachado" | "Concluído";
  created_at: string;
}

export interface TableData {
  id: string;
  number: string;
  seats: number;
  status: "Livre" | "Ocupada" | "Pagamento" | "Reservada";
  current_total: number;
  current_order_id?: string;
}

interface AppContextType {
  products: Product[];
  setProducts: React.Dispatch<React.SetStateAction<Product[]>>;
  customers: Customer[];
  setCustomers: React.Dispatch<React.SetStateAction<Customer[]>>;
  orders: Order[];
  setOrders: React.Dispatch<React.SetStateAction<Order[]>>;
  tables: TableData[];
  setTables: React.Dispatch<React.SetStateAction<TableData[]>>;
  settings: Record<string, string>;
  setSettings: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  addOrder: (order: any) => Promise<void>;
  updateOrderStatus: (id: string, status: Order["status"]) => Promise<void>;
  fetchData: () => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [tables, setTables] = useState<TableData[]>([]);
  const [settings, setSettings] = useState<Record<string, string>>({});
  const { toast } = useToast();

  const fetchData = async () => {
    try {
      const [resProducts, resCustomers, resOrders, resTables, resSettings] = await Promise.all([
        axios.get(`${API_URL}/products`),
        axios.get(`${API_URL}/customers`),
        axios.get(`${API_URL}/orders?status=active`),
        axios.get(`${API_URL}/tables`),
        axios.get(`${API_URL}/settings`),
      ]);
      setProducts(resProducts.data);
      setCustomers(resCustomers.data);
      setOrders(resOrders.data);
      setTables(resTables.data);
      setSettings(resSettings.data);
    } catch (error) {
      console.error("Erro ao buscar dados:", error);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      fetchData();
      // Poll for changes every 30 seconds for KDS
      const interval = setInterval(fetchData, 30000);
      return () => clearInterval(interval);
    }
  }, []);

  const addOrder = async (orderData: any) => {
    try {
      const response = await axios.post(`${API_URL}/orders`, orderData);
      setOrders((prev) => [response.data, ...prev]);
      toast({ title: "Pedido enviado com sucesso!" });
      fetchData(); // Refresh tables and states
    } catch (error) {
      toast({ title: "Erro ao enviar pedido", variant: "destructive" });
    }
  };

  const updateOrderStatus = async (id: string, status: Order["status"]) => {
    try {
      await axios.patch(`${API_URL}/orders/${id}/status`, { status });
      setOrders((prev) => prev.map((o) => (o.id === id ? { ...o, status } : o)));
      toast({ title: `Status atualizado para ${status}` });
      fetchData();
    } catch (error) {
      toast({ title: "Erro ao atualizar status", variant: "destructive" });
    }
  };

  return (
    <AppContext.Provider
      value={{
        products, setProducts,
        customers, setCustomers,
        orders, setOrders,
        tables, setTables,
        settings, setSettings,
        addOrder, updateOrderStatus, fetchData
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) throw new Error("useApp must be used within AppProvider");
  return context;
}
