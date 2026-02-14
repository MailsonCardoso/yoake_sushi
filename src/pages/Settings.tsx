import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
    Building2,
    Users,
    MapPin,
    Save,
    Plus,
    Trash2,
    UserPlus,
    ShieldCheck,
    Settings as SettingsIcon,
    Mail,
    Lock,
    Navigation2
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import axios from "axios";

const API_URL = "https://api2.platformx.com.br/api";

interface User {
    id: string;
    name: string;
    email: string;
}

export default function Settings() {
    const { toast } = useToast();
    const [loading, setLoading] = useState(false);
    const [users, setUsers] = useState<User[]>([]);
    const [settings, setSettings] = useState<Record<string, string>>({
        company_name: "Yoake Sushi",
        company_link: "",
        company_lat: "",
        company_lng: "",
        delivery_fee_per_km: "2.00"
    });

    const [newUser, setNewUser] = useState({ name: "", email: "", password: "" });

    const fetchSettings = async () => {
        try {
            const token = localStorage.getItem("token");
            const res = await axios.get(`${API_URL}/settings`, {
                headers: { Authorization: `Bearer ${token}`, Accept: "application/json" }
            });
            if (Object.keys(res.data).length > 0) {
                setSettings(prev => ({ ...prev, ...res.data }));
            }
        } catch (error) {
            console.error("Erro ao buscar configurações:", error);
        }
    };

    const fetchUsers = async () => {
        try {
            const token = localStorage.getItem("token");
            // Set global Authorization header for subsequent requests if not already set
            if (token && !axios.defaults.headers.common["Authorization"]) {
                axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
                axios.defaults.headers.common["Accept"] = "application/json";
            }
            const res = await axios.get(`${API_URL}/users`, {
                headers: { Authorization: `Bearer ${token}`, Accept: "application/json" }
            });
            setUsers(res.data);
        } catch (error) {
            console.error("Erro ao buscar usuários:", error);
        }
    };

    const extractLatLngFromLink = (link: string) => {
        if (!link) return null;
        try {
            const patterns = [
                /@(-?\d+\.\d+),(-?\d+\.\d+)/,
                /q=(-?\d+\.\d+),(-?\d+\.\d+)/,
                /search\/(-?\d+\.\d+),(-?\d+\.\d+)/,
                /ll=(-?\d+\.\d+),(-?\d+\.\d+)/,
                /!3d(-?\d+\.\d+)!4d(-?\d+\.\d+)/ // Novo padrão comum em URLs do Maps
            ];
            for (const pattern of patterns) {
                const match = link.match(pattern);
                if (match) return { lat: match[1], lng: match[2] };
            }
        } catch (e) {
            console.error("Erro ao extrair coordenadas", e);
        }
        return null;
    };

    const handleLinkChange = (link: string) => {
        setSettings(prev => ({ ...prev, company_link: link }));
        const coords = extractLatLngFromLink(link);
        if (coords) {
            setSettings(prev => ({
                ...prev,
                company_lat: coords.lat,
                company_lng: coords.lng
            }));
            toast({
                title: "Localização Detectada!",
                description: "Latitude e Longitude da empresa foram atualizadas."
            });
        }
    };

    useEffect(() => {
        fetchSettings();
        fetchUsers();
    }, []);

    const handleSaveSettings = async () => {
        try {
            setLoading(true);
            // Limpa qualquer valor que não seja string antes de enviar
            const cleanSettings = Object.fromEntries(
                Object.entries(settings).filter(([_, v]) => v !== null && v !== undefined)
            );
            const token = localStorage.getItem("token");
            await axios.post(`${API_URL}/settings`, cleanSettings, {
                headers: { Authorization: `Bearer ${token}`, Accept: "application/json" }
            });
            toast({ title: "Configurações salvas!" });
        } catch (error: any) {
            console.error("Erro ao salvar:", error.response?.data || error.message);
            toast({
                title: "Erro ao salvar",
                description: "Ocorreu um problema no servidor. Tente novamente.",
                variant: "destructive"
            });
        } finally {
            setLoading(false);
        }
    };

    const handleAddUser = async () => {
        try {
            setLoading(true);
            const res = await axios.post(`${API_URL}/users`, newUser);
            setUsers(prev => [...prev, res.data]);
            setNewUser({ name: "", email: "", password: "" });
            toast({ title: "Usuário criado com sucesso!" });
        } catch (error) {
            toast({ title: "Erro ao criar usuário", variant: "destructive" });
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteUser = async (id: string) => {
        try {
            await axios.delete(`${API_URL}/users/${id}`);
            setUsers(prev => prev.filter(u => u.id !== id));
            toast({ title: "Usuário removido" });
        } catch (error: any) {
            toast({ title: error.response?.data?.message || "Erro ao remover", variant: "destructive" });
        }
    };

    return (
        <div className="p-8 max-w-6xl mx-auto space-y-8 bg-[#f8fafc] min-h-screen">
            <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-2xl bg-[#6366f1] flex items-center justify-center shadow-lg shadow-indigo-100">
                    <SettingsIcon className="h-6 w-6 text-white" />
                </div>
                <div>
                    <h1 className="text-3xl font-black text-slate-800 tracking-tight">Configurações do Sistema</h1>
                    <p className="text-slate-400 font-medium">Gerencie os dados da empresa e acessos de usuários.</p>
                </div>
            </div>

            <Tabs defaultValue="company" className="w-full">
                <TabsList className="bg-slate-100 p-1 rounded-2xl mb-8">
                    <TabsTrigger value="company" className="rounded-xl px-8 py-3 data-[state=active]:bg-white data-[state=active]:text-[#6366f1] data-[state=active]:shadow-sm font-bold text-slate-500">
                        <Building2 className="h-4 w-4 mr-2" />
                        Empresa
                    </TabsTrigger>
                    <TabsTrigger value="users" className="rounded-xl px-8 py-3 data-[state=active]:bg-white data-[state=active]:text-[#6366f1] data-[state=active]:shadow-sm font-bold text-slate-500">
                        <Users className="h-4 w-4 mr-2" />
                        Usuários
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="company" className="space-y-6">
                    <Card className="border-none shadow-sm rounded-[32px] overflow-hidden bg-white">
                        <CardHeader className="p-8 pb-4">
                            <CardTitle className="text-xl font-black text-slate-800 flex items-center gap-2">
                                <ShieldCheck className="h-5 w-5 text-[#6366f1]" />
                                Dados da Unidade
                            </CardTitle>
                            <CardDescription className="text-slate-400 font-medium font-sans">
                                Configure o endereço base para o cálculo de entregas.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="p-8 pt-4 space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <Label className="text-xs font-black uppercase text-slate-400 tracking-wider">Nome da Empresa</Label>
                                    <div className="relative">
                                        <Building2 className="absolute left-4 top-3.5 h-4 w-4 text-slate-300" />
                                        <Input
                                            value={settings.company_name}
                                            onChange={e => setSettings({ ...settings, company_name: e.target.value })}
                                            className="pl-11 h-12 rounded-2xl bg-slate-50 border-transparent focus:bg-white focus:ring-2 focus:ring-indigo-100 transition-all font-bold"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-xs font-black uppercase text-slate-400 tracking-wider">Taxa por KM (R$)</Label>
                                    <div className="relative">
                                        <Navigation2 className="absolute left-4 top-3.5 h-4 w-4 text-slate-300" />
                                        <Input
                                            type="number"
                                            value={settings.delivery_fee_per_km}
                                            onChange={e => setSettings({ ...settings, delivery_fee_per_km: e.target.value })}
                                            className="pl-11 h-12 rounded-2xl bg-slate-50 border-transparent focus:bg-white focus:ring-2 focus:ring-indigo-100 transition-all font-bold"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2 md:col-span-2">
                                    <Label className="text-xs font-black uppercase text-slate-400 tracking-wider">Link Google Maps da Empresa (WhatsApp)</Label>
                                    <div className="relative">
                                        <Navigation2 className="absolute left-4 top-3.5 h-4 w-4 text-[#6366f1]" />
                                        <Input
                                            value={settings.company_link || ""}
                                            onChange={e => handleLinkChange(e.target.value)}
                                            className="pl-11 h-12 rounded-2xl bg-indigo-50/50 border-indigo-100 focus:bg-white focus:ring-2 focus:ring-indigo-100 transition-all font-bold placeholder:text-slate-300 border-2"
                                            placeholder="Cole o link da sua localização aqui..."
                                        />
                                    </div>
                                    <p className="text-[10px] text-slate-400 font-bold ml-2">As coordenadas abaixo são atualizadas automaticamente ao colar o link.</p>
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-xs font-black uppercase text-slate-400 tracking-wider">Latitude Detectada</Label>
                                    <Input
                                        value={settings.company_lat}
                                        readOnly
                                        className="h-12 rounded-2xl bg-slate-100 border-transparent font-black text-slate-500 cursor-not-allowed"
                                        placeholder="-23.550520"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-xs font-black uppercase text-slate-400 tracking-wider">Longitude Detectada</Label>
                                    <Input
                                        value={settings.company_lng}
                                        readOnly
                                        className="h-12 rounded-2xl bg-slate-100 border-transparent font-black text-slate-500 cursor-not-allowed"
                                        placeholder="-46.633308"
                                    />
                                </div>
                            </div>

                            <div className="flex justify-end pt-4">
                                <Button
                                    onClick={handleSaveSettings}
                                    disabled={loading}
                                    className="bg-[#6366f1] hover:bg-[#4f46e5] h-14 px-10 rounded-2xl font-black text-lg shadow-xl shadow-indigo-100 gap-2"
                                >
                                    <Save className="h-5 w-5" />
                                    Salvar Alterações
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="users" className="space-y-8">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Add User Form */}
                        <Card className="border-none shadow-sm rounded-[32px] overflow-hidden bg-white lg:col-span-1 border-l-8 border-l-[#6366f1]/10">
                            <CardHeader className="p-8 pb-4">
                                <CardTitle className="text-xl font-black text-slate-800 flex items-center gap-2">
                                    <UserPlus className="h-5 w-5 text-[#6366f1]" />
                                    Novo Usuário
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-8 pt-4 space-y-4">
                                <div className="space-y-2">
                                    <Label className="text-xs font-black uppercase text-slate-400 tracking-wider">Nome Completo</Label>
                                    <Input
                                        value={newUser.name}
                                        onChange={e => setNewUser({ ...newUser, name: e.target.value })}
                                        className="h-12 rounded-2xl bg-slate-50 border-transparent focus:bg-white font-bold"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-xs font-black uppercase text-slate-400 tracking-wider">E-mail</Label>
                                    <div className="relative">
                                        <Mail className="absolute left-4 top-3.5 h-4 w-4 text-slate-300" />
                                        <Input
                                            type="email"
                                            value={newUser.email}
                                            onChange={e => setNewUser({ ...newUser, email: e.target.value })}
                                            className="pl-11 h-12 rounded-2xl bg-slate-50 border-transparent focus:bg-white font-bold"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-xs font-black uppercase text-slate-400 tracking-wider">Senha</Label>
                                    <div className="relative">
                                        <Lock className="absolute left-4 top-3.5 h-4 w-4 text-slate-300" />
                                        <Input
                                            type="password"
                                            value={newUser.password}
                                            onChange={e => setNewUser({ ...newUser, password: e.target.value })}
                                            className="pl-11 h-12 rounded-2xl bg-slate-50 border-transparent focus:bg-white font-bold"
                                        />
                                    </div>
                                </div>
                                <Button
                                    onClick={handleAddUser}
                                    disabled={loading}
                                    className="w-full h-14 bg-[#1e293b] hover:bg-[#0f172a] rounded-2xl font-black text-base shadow-xl shadow-slate-200 mt-4 gap-2"
                                >
                                    <Plus className="h-5 w-5" />
                                    Criar Usuário
                                </Button>
                            </CardContent>
                        </Card>

                        {/* Users List */}
                        <div className="lg:col-span-2 space-y-4">
                            <h2 className="text-sm font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 px-2">
                                Usuários Ativos
                                <Badge className="bg-slate-200 text-slate-600 hover:bg-slate-200 rounded-full h-5 w-5 flex items-center justify-center p-0 text-[10px]">
                                    {users.length}
                                </Badge>
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {users.map(user => (
                                    <Card key={user.id} className="border-none shadow-sm rounded-3xl bg-white group hover:shadow-md transition-all">
                                        <CardContent className="p-6 flex items-center justify-between">
                                            <div className="flex items-center gap-4">
                                                <div className="h-12 w-12 rounded-full bg-indigo-50 flex items-center justify-center font-black text-[#6366f1]">
                                                    {user.name.charAt(0).toUpperCase()}
                                                </div>
                                                <div>
                                                    <p className="font-black text-slate-800 leading-none">{user.name}</p>
                                                    <p className="text-xs text-slate-400 font-medium mt-1">{user.email}</p>
                                                </div>
                                            </div>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => handleDeleteUser(user.id)}
                                                className="rounded-xl text-slate-300 hover:text-red-500 hover:bg-red-50 transition-colors"
                                            >
                                                <Trash2 className="h-5 w-5" />
                                            </Button>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        </div>
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
}
