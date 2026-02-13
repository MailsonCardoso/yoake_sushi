import React, { createContext, useContext, useState, ReactNode } from "react";

export interface Product {
  id: string;
  name: string;
  price: number;
  category: string;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  address: string;
  mapsLink: string;
}

export interface OrderItem {
  product: Product;
  quantity: number;
}

export interface Order {
  id: string;
  items: OrderItem[];
  total: number;
  type: "table" | "delivery" | "counter";
  tableId?: number;
  customerName?: string;
  address?: string;
  deliveryFee?: number;
  status: "pending" | "preparing" | "ready" | "done";
  createdAt: Date;
}

export interface TableData {
  id: number;
  status: "free" | "occupied" | "payment" | "reserved";
  people?: number;
  orderId?: string;
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
  addOrder: (order: Omit<Order, "id" | "createdAt">) => void;
  updateOrderStatus: (id: string, status: Order["status"]) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const initialProducts: Product[] = [
  { id: "p1", name: "X-Burger", price: 28.9, category: "Burgers" },
  { id: "p2", name: "X-Salada", price: 26.9, category: "Burgers" },
  { id: "p3", name: "X-Bacon", price: 32.9, category: "Burgers" },
  { id: "p4", name: "X-Tudo", price: 36.9, category: "Burgers" },
  { id: "p5", name: "Coca-Cola 350ml", price: 6.0, category: "Bebidas" },
  { id: "p6", name: "Suco Natural", price: 10.0, category: "Bebidas" },
  { id: "p7", name: "Água Mineral", price: 4.0, category: "Bebidas" },
  { id: "p8", name: "Cerveja 600ml", price: 14.0, category: "Bebidas" },
  { id: "p9", name: "Batata Frita", price: 18.0, category: "Porções" },
  { id: "p10", name: "Onion Rings", price: 22.0, category: "Porções" },
  { id: "p11", name: "Nuggets 10un", price: 20.0, category: "Porções" },
];

const initialCustomers: Customer[] = [
  { id: "c1", name: "João Silva", phone: "(11) 99999-1234", address: "Rua das Flores, 123 - Centro", mapsLink: "https://maps.google.com/?q=Rua+das+Flores+123" },
  { id: "c2", name: "Maria Santos", phone: "(11) 98888-5678", address: "Av. Brasil, 456 - Jardim", mapsLink: "https://maps.google.com/?q=Av+Brasil+456" },
  { id: "c3", name: "Pedro Costa", phone: "(11) 97777-9012", address: "Rua Oliveira, 789 - Vila Nova", mapsLink: "https://maps.google.com/?q=Rua+Oliveira+789" },
];

const initialOrders: Order[] = [
  {
    id: "ORD-001",
    items: [
      { product: initialProducts[0], quantity: 2 },
      { product: initialProducts[4], quantity: 2 },
    ],
    total: 69.8,
    type: "table",
    tableId: 3,
    status: "preparing",
    createdAt: new Date(Date.now() - 1800000),
  },
  {
    id: "ORD-002",
    items: [
      { product: initialProducts[2], quantity: 1 },
      { product: initialProducts[8], quantity: 1 },
    ],
    total: 50.9,
    type: "delivery",
    customerName: "João Silva",
    address: "Rua das Flores, 123 - Centro",
    deliveryFee: 8.0,
    status: "pending",
    createdAt: new Date(Date.now() - 600000),
  },
  {
    id: "ORD-003",
    items: [{ product: initialProducts[3], quantity: 1 }],
    total: 36.9,
    type: "counter",
    status: "ready",
    createdAt: new Date(Date.now() - 3600000),
  },
];

const initialTables: TableData[] = Array.from({ length: 12 }, (_, i) => ({
  id: i + 1,
  status: (i === 2 ? "occupied" : i === 5 ? "payment" : i === 8 ? "reserved" : "free") as TableData["status"],
  people: i === 2 ? 4 : i === 5 ? 2 : undefined,
  orderId: i === 2 ? "ORD-001" : undefined,
}));

let orderCounter = 4;

export function AppProvider({ children }: { children: ReactNode }) {
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [customers, setCustomers] = useState<Customer[]>(initialCustomers);
  const [orders, setOrders] = useState<Order[]>(initialOrders);
  const [tables, setTables] = useState<TableData[]>(initialTables);

  const addOrder = (order: Omit<Order, "id" | "createdAt">) => {
    const newOrder: Order = {
      ...order,
      id: `ORD-${String(orderCounter++).padStart(3, "0")}`,
      createdAt: new Date(),
    };
    setOrders((prev) => [newOrder, ...prev]);

    if (order.type === "table" && order.tableId) {
      setTables((prev) =>
        prev.map((t) =>
          t.id === order.tableId ? { ...t, status: "occupied" as const, orderId: newOrder.id } : t
        )
      );
    }
  };

  const updateOrderStatus = (id: string, status: Order["status"]) => {
    setOrders((prev) => prev.map((o) => (o.id === id ? { ...o, status } : o)));
    if (status === "done") {
      const order = orders.find((o) => o.id === id);
      if (order?.type === "table" && order.tableId) {
        setTables((prev) =>
          prev.map((t) =>
            t.id === order.tableId ? { ...t, status: "free" as const, people: undefined, orderId: undefined } : t
          )
        );
      }
    }
  };

  return (
    <AppContext.Provider
      value={{ products, setProducts, customers, setCustomers, orders, setOrders, tables, setTables, addOrder, updateOrderStatus }}
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
