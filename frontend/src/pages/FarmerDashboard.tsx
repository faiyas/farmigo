import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { 
  TrendingUp, 
  Package, 
  Cloud, 
  Thermometer, 
  Droplets,
  LogOut,
  User,
  MessageCircle,
  Plus,
  Edit,
  BarChart3,
  MapPin,
  Bell
} from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { FarmerAPI, AIApi } from "@/lib/api";
import { absoluteImageUrl } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";

// Tamil Nadu Crop Dataset
type TNSuggestion = {
  crop: string;
  weather: string;
  seedVarieties: string[];
  manure: string;
};

const tnCropSuggestions: Record<string, TNSuggestion[]> = {
  clay: [
    {
      crop: "Rice",
      weather: "Rainy",
      seedVarieties: ["ADT-37", "CO-51", "BPT-5204"],
      manure: "FYM + DAP + Potash"
    },
    {
      crop: "Sugarcane",
      weather: "Hot",
      seedVarieties: ["CO-86032", "COC-671"],
      manure: "Compost + Nitrogen + Phosphorus"
    }
  ],
  sandy: [
    {
      crop: "Groundnut",
      weather: "Dry",
      seedVarieties: ["TMV-7", "VRI-2"],
      manure: "Gypsum + FYM + Superphosphate"
    },
    {
      crop: "Millet",
      weather: "Hot",
      seedVarieties: ["CO-7", "K-7"],
      manure: "Farmyard manure + Zinc sulphate"
    }
  ],
  loamy: [
    {
      crop: "Tomato",
      weather: "Moderate",
      seedVarieties: ["PKM-1", "CO-3"],
      manure: "FYM + Urea + Potash"
    },
    {
      crop: "Cotton",
      weather: "Hot",
      seedVarieties: ["MCU-5", "SVPR-2"],
      manure: "FYM + Urea + DAP"
    }
  ],
  black: [
    {
      crop: "Cotton",
      weather: "Hot",
      seedVarieties: ["MCU-7", "BT-Hybrids"],
      manure: "DAP + Urea + Potash"
    },
    {
      crop: "Soybean",
      weather: "Rainy",
      seedVarieties: ["CO-3", "JS-335"],
      manure: "Organic manure + Potash"
    }
  ]
};

// Weather Fetchers - OpenWeather fallback
const fetchOpenWeatherByCity = async (city: string) => {
  const apiKey = import.meta.env.VITE_OPENWEATHERMAP_API_KEY || "";
  if (!apiKey) throw new Error("OpenWeatherMap API key not set");
  try {
    const res = await fetch(
      `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)}&appid=${apiKey}&units=metric`
    );
    if (!res.ok) throw new Error("Failed to fetch weather");
    const data = await res.json();
    return {
      temperature: data.main?.temp ?? 0,
      humidity: data.main?.humidity ?? 0,
      rainfall: data.rain ? data.rain["1h"] || 0 : 0,
      condition: data.weather?.[0]?.main ?? "Unknown",
      name: data.name as string | undefined
    };
  } catch (err) {
    return { temperature: 0, humidity: 0, rainfall: 0, condition: "Unknown", name: undefined };
  }
};

const fetchOpenWeatherByCoords = async (lat: number, lon: number) => {
  const apiKey = import.meta.env.VITE_OPENWEATHERMAP_API_KEY || "";
  if (!apiKey) throw new Error("OpenWeatherMap API key not set");
  try {
    const res = await fetch(
      `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric`
    );
    if (!res.ok) throw new Error("Failed to fetch weather");
    const data = await res.json();
    return {
      temperature: data.main?.temp ?? 0,
      humidity: data.main?.humidity ?? 0,
      rainfall: data.rain ? data.rain["1h"] || 0 : 0,
      condition: data.weather?.[0]?.main ?? "Unknown",
      name: data.name as string | undefined
    };
  } catch (err) {
    return { temperature: 0, humidity: 0, rainfall: 0, condition: "Unknown", name: undefined };
  }
};

// Google Weather (Maps Platform) helpers
const geocodeCityWithGoogle = async (city: string) => {
  const key = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || import.meta.env.VITE_GOOGLE_WEATHER_API_KEY || "";
  if (!key) throw new Error("Google Maps API key not set");
  const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(city)}&key=${key}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("Failed to geocode city");
  const data = await res.json();
  const first = data.results?.[0];
  if (!first) throw new Error("City not found");
  const loc = first.geometry?.location;
  return { lat: loc.lat as number, lon: loc.lng as number, name: first.formatted_address as string };
};

const fetchGoogleWeatherByCoords = async (lat: number, lon: number) => {
  const key = import.meta.env.VITE_GOOGLE_WEATHER_API_KEY || import.meta.env.VITE_GOOGLE_MAPS_API_KEY || "";
  if (!key) throw new Error("Google Weather API key not set");
  // Google Weather API (Maps Platform). Endpoint may vary by plan; using current conditions.
  const url = `https://weather.googleapis.com/v1/wx/current?location=${lat},${lon}&key=${key}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("Failed to fetch Google Weather");
  const data = await res.json();
  // Attempt to normalize common fields
  const current = data.current || data;
  const temperature = current.temperature?.value ?? current.temperature ?? 0;
  const humidity = current.humidity?.value ?? current.humidity ?? 0;
  const condition = current.weatherCode ?? current.condition ?? "Unknown";
  const rainfall = current.precipitationIntensity?.value ?? current.precipitationLastHour?.value ?? 0;
  return { temperature, humidity, rainfall, condition } as const;
};

const fetchWeatherByCity = async (city: string) => {
  // Prefer Google if key is configured; fallback to OpenWeather
  try {
    const { lat, lon, name } = await geocodeCityWithGoogle(city);
    const g = await fetchGoogleWeatherByCoords(lat, lon);
    return { ...g, name } as { temperature: number; humidity: number; rainfall: number; condition: string; name?: string };
  } catch (_) {
    return await fetchOpenWeatherByCity(city);
  }
};

const fetchWeatherByCoords = async (lat: number, lon: number) => {
  try {
    const g = await fetchGoogleWeatherByCoords(lat, lon);
    return { ...g, name: undefined } as { temperature: number; humidity: number; rainfall: number; condition: string; name?: string };
  } catch (_) {
    return await fetchOpenWeatherByCoords(lat, lon);
  }
};

// Crop Recommendation Logic
const getTNCropRecommendation = (soil: string, weatherCondition: string): TNSuggestion[] => {
  const crops = tnCropSuggestions[soil as keyof typeof tnCropSuggestions] || [];
  return crops.filter(
    (c) =>
      c.weather.toLowerCase() === weatherCondition.toLowerCase() ||
      weatherCondition.toLowerCase().includes(c.weather.toLowerCase())
  );
};

const FarmerDashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  type InventoryItem = {
    id: number;
    crop: { id: number; name: string };
    price: number;
    quantity: number;
    available: boolean;
    imageUrl?: string;
  };
  type WeatherData = {
    temperature: number;
    humidity: number;
    rainfall: number;
    condition: string;
    name?: string;
  };
  const [stockForm, setStockForm] = useState({ cropName: "", quantity: "", price: "" });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [crops, setCrops] = useState<{ name: string }[]>([]);
  const [soilType, setSoilType] = useState("");
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [city, setCity] = useState("");
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
  const [recommendations, setRecommendations] = useState<TNSuggestion[]>([]);
  const [selectedSeedByIndex, setSelectedSeedByIndex] = useState<Record<number, string>>({});
  const [isLocating, setIsLocating] = useState(false);
  const [isFetchingRecommendations, setIsFetchingRecommendations] = useState(false);
  const [weatherError, setWeatherError] = useState<string>("");
  const [diseaseImage, setDiseaseImage] = useState<File | null>(null);
  const [isDetectingDisease, setIsDetectingDisease] = useState(false);
  const [diseaseResult, setDiseaseResult] = useState<
    | null
    | ({ disease: string; confidence: number; advice: string; image: string; editedImage?: string | null; leafDetected: true })
    | ({ leafDetected: false; message: string; image: string })
  >(null);
  const [diseasePrompt, setDiseasePrompt] = useState<string>("");
  // Helpinbot (Gemini) chat state
  const [chatInput, setChatInput] = useState("");
  const [chatAnswer, setChatAnswer] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const [chatError, setChatError] = useState("");
  // Dynamic stats
  const totalStock = inventory.reduce((sum, item) => sum + item.quantity, 0);
  const monthlyRevenue = inventory.reduce((sum, item) => sum + (item.price * item.quantity), 0); // Simplified
  // Show logged-in user's name at top
  const farmerName = user?.name || "Farmer";

  const loadInventory = useCallback(() => {
    FarmerAPI.listInventory().then((d: { items: InventoryItem[] }) => setInventory(d.items));
  }, []);

  useEffect(() => {
    loadInventory();
    FarmerAPI.listCrops().then((d: { crops: { crop: string; name: string; description?: string }[] }) =>
      setCrops(d.crops.map((c) => ({ name: c.name })))
    );
  }, [loadInventory]);

  const handleStockUpdate = async () => {
    if (!stockForm.cropName.trim() || !stockForm.quantity || !stockForm.price) {
      toast({
        title: "Please fill all fields",
        variant: "destructive"
      });
      return;
    }
    try {
      const name = stockForm.cropName.trim();
      await FarmerAPI.createInventory({
        cropName: name,
        quantity: Number(stockForm.quantity),
        price: Number(stockForm.price),
        image: imageFile,
      });
      toast({ title: "Stock Updated" });
      setStockForm({ cropName: "", quantity: "", price: "" });
      setImageFile(null);
      loadInventory();
    } catch (err: unknown) {
      const apiError = err as { response?: { data?: { error?: string } } };
      const msg = apiError?.response?.data?.error || "Error updating stock (check crop ID exists)";
      toast({ title: msg, variant: "destructive" });
    }
  };

  const askAI = async () => {
    try {
      // Fast-fail if Google keys are missing (we use Google Weather/Geocode)
      if (!import.meta.env.VITE_GOOGLE_WEATHER_API_KEY && !import.meta.env.VITE_GOOGLE_MAPS_API_KEY) {
        toast({ title: "Missing Google API key", description: "Set VITE_GOOGLE_WEATHER_API_KEY or VITE_GOOGLE_MAPS_API_KEY in .env and restart dev server.", variant: "destructive" });
        return;
      }

      setIsFetchingRecommendations(true);
      setWeatherError("");
      let w: WeatherData | null = null;
      if (city.trim()) {
        w = await fetchWeatherByCity(city.trim());
        setWeatherData(w);
      } else if (weatherData) {
        w = weatherData;
      } else {
        toast({ title: "Enter a city or use your location", variant: "destructive" });
        return;
      }
      if (soilType && w) {
        const recs = getTNCropRecommendation(soilType, w.condition);
        setRecommendations(recs);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      setWeatherError(message);
      toast({ title: "Error fetching weather/crop data", description: message, variant: "destructive" });
    } finally {
      setIsFetchingRecommendations(false);
    }
  };

  const useMyLocation = async () => {
    if (!("geolocation" in navigator)) {
      toast({ title: "Geolocation not supported", variant: "destructive" });
      return;
    }
    if (!import.meta.env.VITE_GOOGLE_WEATHER_API_KEY && !import.meta.env.VITE_GOOGLE_MAPS_API_KEY) {
      toast({ title: "Missing Google API key", description: "Set VITE_GOOGLE_WEATHER_API_KEY or VITE_GOOGLE_MAPS_API_KEY in .env and restart dev server.", variant: "destructive" });
      return;
    }
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const { latitude, longitude } = pos.coords;
          const w = await fetchWeatherByCoords(latitude, longitude);
          setWeatherData(w);
          if (soilType) {
            const recs = getTNCropRecommendation(soilType, w.condition);
            setRecommendations(recs);
          }
          toast({ title: "Climate detected", description: w.name ? `Location: ${w.name}` : undefined });
        } catch (e) {
          const message = e instanceof Error ? e.message : "Unknown error";
          setWeatherError(message);
          toast({ title: "Failed to detect climate", description: message, variant: "destructive" });
        } finally {
          setIsLocating(false);
        }
      },
      (geoErr) => {
        let message = "Location error";
        if (geoErr) {
          if (geoErr.code === 1) message = "Permission denied";
          else if (geoErr.code === 2) message = "Position unavailable";
          else if (geoErr.code === 3) message = "Timeout";
        }
        setWeatherError(message);
        toast({ title: "Location not available", description: message, variant: "destructive" });
        setIsLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  useEffect(() => {
    if (weatherData && soilType) {
      const recs = getTNCropRecommendation(soilType, weatherData.condition);
      setRecommendations(recs);
    }
  }, [soilType, weatherData]);

  const handleDiseaseDetect = async () => {
    if (!diseaseImage) {
      toast({ title: "Please choose a leaf image", variant: "destructive" });
      return;
    }
    try {
      setIsDetectingDisease(true);
      setDiseaseResult(null);
      const res = diseasePrompt.trim()
        ? await AIApi.diseaseDetectWithPrompt(diseaseImage, diseasePrompt.trim())
        : await AIApi.diseaseDetect(diseaseImage);
      setDiseaseResult(res);
      toast({ title: "Analysis complete" });
    } catch (e) {
      const message = e instanceof Error ? e.message : "Failed to analyze image";
      toast({ title: message, variant: "destructive" });
    } finally {
      setIsDetectingDisease(false);
    }
  };

  const askHelpinbot = async () => {
    const q = chatInput.trim();
    if (!q) {
      toast({ title: "Enter your crop growth question", variant: "destructive" });
      return;
    }
    try {
      setChatLoading(true);
      setChatAnswer("");
      setChatError("");
      const { answer } = await AIApi.chatbot(q);
      setChatAnswer(answer);
    } catch (e) {
      const err = e as { response?: { data?: { error?: string } } };
      const message = err?.response?.data?.error || (e instanceof Error ? e.message : "Failed to get answer");
      setChatError(message);
      toast({ title: message, variant: "destructive" });
    } finally {
      setChatLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header (same style as CustomerDashboard) */}
      <header className="bg-white shadow-card border-b sticky top-0 z-10">
        <div className="max-w-md mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center">
              <User className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="font-semibold text-primary text-lg">Welcome!</h1>
              <p className="text-xs text-muted-foreground">{farmerName}</p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <Button variant="ghost" size="sm" className="relative">
              <Bell className="w-5 h-5" />
            </Button>
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
        {/* Quick Stats */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <Card className="gradient-nature text-white border-0">
            <CardContent className="p-4 text-center">
              <Package className="w-8 h-8 mx-auto mb-2" />
              <p className="text-2xl font-bold">{totalStock}</p>
              <p className="text-xs opacity-80">Total Stock (kg)</p>
            </CardContent>
          </Card>
          <Card className="gradient-earth text-white border-0">
            <CardContent className="p-4 text-center">
              <TrendingUp className="w-8 h-8 mx-auto mb-2" />
              <p className="text-2xl font-bold">₹{monthlyRevenue.toLocaleString()}</p>
              <p className="text-xs opacity-80">Monthly Revenue</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Tabs */}
        <Tabs defaultValue="stock" className="space-y-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="stock" className="flex items-center space-x-2"> 
              <Package className="w-4 h-4" />
              <span>Stock</span>
            </TabsTrigger>
            <TabsTrigger value="others" className="flex items-center space-x-2">
              <BarChart3 className="w-4 h-4" />
              <span>Others</span>
            </TabsTrigger>
          </TabsList>

          {/* Stock Management Tab */}
          <TabsContent value="stock" className="space-y-4">
            <Card className="shadow-card border-0">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2 text-primary">
                  <Plus className="w-5 h-5" />
                  <span>Update Stock</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="cropName">Crop</Label>
                  <Input
                    id="cropName"
                    placeholder={crops.length ? `e.g., ${crops[0].name}` : "Enter crop name"}
                    value={stockForm.cropName}
                    onChange={(e)=>setStockForm(prev=>({...prev, cropName: e.target.value}))}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="quantity">Quantity (kg)</Label>
                    <Input
                      id="quantity"
                      type="number"
                      placeholder="100"
                      value={stockForm.quantity}
                      onChange={(e) => setStockForm((prev) => ({ ...prev, quantity: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="price">Price/kg (₹)</Label>
                    <Input
                      id="price"
                      type="number"
                      placeholder="40"
                      value={stockForm.price}
                      onChange={(e) => setStockForm((prev) => ({ ...prev, price: e.target.value }))}
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="image">Product image</Label>
                  <Input id="image" type="file" accept="image/*" onChange={(e)=>setImageFile(e.target.files?.[0] || null)} />
                </div>
                <Button onClick={handleStockUpdate} className="w-full bg-primary hover:bg-primary/90">
                  Update Stock
                </Button>
              </CardContent>
            </Card>

            {/* Current Stock List */}
            <Card className="shadow-card border-0">
              <CardHeader>
                <CardTitle className="text-primary">Current Stock</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {inventory.map((i) => (
                    <div key={i.id} className="flex items-center justify-between p-3 rounded-lg border">
                      <div className="flex items-center gap-3">
                        {i.imageUrl && <img src={absoluteImageUrl(i.imageUrl)} alt={i.crop.name} className="w-12 h-12 rounded object-cover" />}
                        <div>
                          <h4 className="font-medium">{i.crop.name}</h4>
                          <p className="text-sm text-muted-foreground">qty {i.quantity} • ₹{i.price}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" onClick={async()=>{ await FarmerAPI.updateInventory(i.id, { quantity: i.quantity + 1 }); loadInventory(); }}>+1</Button>
                        <Button variant="outline" size="sm" onClick={async()=>{ const newQty=Math.max(0,i.quantity-1); await FarmerAPI.updateInventory(i.id, { quantity: newQty, available: newQty>0 }); loadInventory(); }}>-1</Button>
                        <Button variant="outline" size="sm" onClick={async()=>{ await FarmerAPI.updateInventory(i.id, { available: !i.available }); loadInventory(); }}>{i.available ? 'Disable' : 'Enable'}</Button>
                        <Button variant="destructive" size="sm" onClick={async()=>{ await FarmerAPI.deleteInventory(i.id); loadInventory(); }}>Delete</Button>
                      </div>
                    </div>
                  ))}
                  {inventory.length===0 && (
                    <p className="text-sm text-muted-foreground">No stock yet. Add your first item above.</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          

          {/* Others Tab */}
          <TabsContent value="others" className="space-y-4">
            <Card className="shadow-card border-0">
              <CardHeader>
                <CardTitle className="text-primary">Others</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 gap-3">
                <Button onClick={()=>navigate("/crop-disease")} className="bg-emerald-600 text-white hover:bg-emerald-700">Crop Disease (ML)</Button>
                <Button onClick={()=>navigate("/crop-suggestion")} className="bg-primary text-white hover:bg-primary/90">Crop Suggestion</Button>
                <Button onClick={()=>navigate("/helpinbot")} className="bg-secondary text-black hover:bg-secondary/90">Helpinbot</Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default FarmerDashboard;