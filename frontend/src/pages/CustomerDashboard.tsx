import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ShoppingCart, Search, LogOut, User } from "lucide-react";
import ProductCard from "@/components/ProductCard";
import { CustomerAPI } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import farmProducts from "@/assets/farm-products.jpg";
import { absoluteImageUrl } from "@/lib/utils";

const CustomerDashboard = () => {
  const navigate = useNavigate();
  const [cartItems, setCartItems] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  type Product = { id: string; name: string; price: number; stock: number; image: string; unit: string; farmer: string; farmerId: number };
  type MarketItem = { id: number; crop?: { id: number | null; name: string }; price: number; quantity: number; farmerId: number; imageUrl?: string };
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<Record<string, number>>({});
  const { user } = useAuth();
  const [farmerCount, setFarmerCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProducts = useCallback(async (search?: string) => {
    try {
      setLoading(true);
      setError(null);
      const { items } = await CustomerAPI.market(search);
      const mapped: Product[] = items.map((i: MarketItem) => ({
        id: String(i.id),
        name: i.crop?.name || "Item",
        price: Number(i.price),
        stock: Number(i.quantity),
        image: absoluteImageUrl(i.imageUrl) || farmProducts,
        unit: "kg",
        farmer: `Farmer #${i.farmerId}`,
        farmerId: Number(i.farmerId),
      }));
      setProducts(mapped);
      const uniqueFarmers = new Set(mapped.map((p) => p.farmerId));
      setFarmerCount(uniqueFarmers.size);
    } catch (e: unknown) {
      const err = e as { response?: { data?: { error?: string } } };
      setError(err?.response?.data?.error || "Failed to load marketplace.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);
  // Cart removed; direct request flow handled in ProductCard
  const refreshProducts = async () => {
    const { items } = await CustomerAPI.market();
    const mapped: Product[] = items.map((i: MarketItem) => ({
      id: String(i.id),
      name: i.crop?.name || "Item",
      price: Number(i.price),
      stock: Number(i.quantity),
      image: absoluteImageUrl(i.imageUrl) || farmProducts,
      unit: "kg",
      farmer: `Farmer #${i.farmerId}`,
      farmerId: Number(i.farmerId),
    }));
    setProducts(mapped);
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchProducts(searchQuery);
    }, 300); // Debounce search for 300ms

    return () => clearTimeout(timer);
  }, [searchQuery, fetchProducts]);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-white shadow-card border-b sticky top-0 z-10">
        <div className="max-w-md mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center">
              <User className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="font-semibold text-primary text-lg">Welcome!</h1>
              <p className="text-sm text-primary">{user?.name || "Customer"}</p>
            </div>
          </div>
          
          <div className="flex items-center">
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => navigate("/")}
            >
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </header>

      <div className="max-w-md mx-auto p-4">
        {/* Search & Filter */}
        <div className="mb-6 space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search fresh products..."
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          

        </div>

        {/* Products from database */}
        <Tabs defaultValue="all" className="mb-6">
          <TabsList className="grid w-full grid-cols-1 mb-4">
            <TabsTrigger value="all" className="text-xs">All Products</TabsTrigger>
          </TabsList>
          <TabsContent value="all">
            {loading ? (
              <Card className="p-8 text-center"><p className="text-muted-foreground">Loading...</p></Card>
            ) : error ? (
              <Card className="p-8 text-center"><p className="text-red-600">{error}</p></Card>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {products.map((product) => (
                  <ProductCard key={product.id} {...product} onRequested={() => fetchProducts(searchQuery)} />
                ))}
                {products.length === 0 && (
                  <Card className="p-8 text-center"><p className="text-muted-foreground">No products available.</p></Card>
                )}
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Quick Stats */}
        <Card className="shadow-card border-0 gradient-nature text-white mb-4">
          <CardContent className="p-4">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-2xl font-bold">{products.length}</p>
                <p className="text-xs opacity-80">Products</p>
              </div>
              <div>
                <p className="text-2xl font-bold">{farmerCount}</p>
                <p className="text-xs opacity-80">Farmers</p>
              </div>
              <div></div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CustomerDashboard;