import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AdminAPI, setAuthToken } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { 
  Users, 
  Tractor, 
  TrendingUp, 
  Package,
  LogOut,
  Shield,
  BarChart3,
  PieChart,
  Activity,
  Star
} from "lucide-react";

const AdminDashboard = () => {
  const navigate = useNavigate();

  const [stats, setStats] = useState({
    totalCustomers: 0,
    totalFarmers: 0,
    totalSales: 0,
    itemsSold: 0,
    activeListings: 0,
    cropsInDemand: [] as { name: string; quantity: number }[],
  });
  const [monthly, setMonthly] = useState<{ month: string; year: number; sales: number }[]>([]);
  const [top, setTop] = useState<{ name: string; sales: number; orders: number }[]>([]);
  
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/");
      return;
    }

    setAuthToken(token); // Ensure token is set before making request
    AdminAPI.stats().then((data) => {
      setStats({
        totalCustomers: data.numCustomers,
        totalFarmers: data.numFarmers,
        totalSales: data.totalSales,
        itemsSold: data.itemsSold,
        activeListings: data.activeListings,
        cropsInDemand: data.cropsInDemand || [],
      });
      setMonthly(data.monthlySales || []);
      setTop(data.topFarmers || []);
    }).catch((error) => {
      console.error("Failed to fetch admin stats:", error);
      if (error.response?.status === 401) {
        // Unauthorized, redirect to login
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        navigate("/");
      }
    });
  }, [navigate]);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-white shadow-card border-b sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="font-semibold text-primary text-lg">Admin Portal</h1>
              <p className="text-xs text-muted-foreground">System Administrator</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <Badge variant="secondary" className="bg-primary text-white">
              Super Admin
            </Badge>
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

      <div className="max-w-4xl mx-auto p-4">
        {/* Key Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <Card className="gradient-nature text-white border-0">
            <CardContent className="p-4 text-center">
              <Users className="w-8 h-8 mx-auto mb-2" />
              <p className="text-2xl font-bold">{stats.totalCustomers.toLocaleString()}</p>
              <p className="text-xs opacity-80">Total Customers</p>
            </CardContent>
          </Card>
          
          <Card className="gradient-earth text-white border-0">
            <CardContent className="p-4 text-center">
              <Tractor className="w-8 h-8 mx-auto mb-2" />
              <p className="text-2xl font-bold">{stats.totalFarmers}</p>
              <p className="text-xs opacity-80">Active Farmers</p>
            </CardContent>
          </Card>
          
          <Card className="gradient-sky text-white border-0">
            <CardContent className="p-4 text-center">
              <TrendingUp className="w-8 h-8 mx-auto mb-2" />
              <p className="text-2xl font-bold">₹{Math.round(stats.totalSales).toLocaleString()}</p>
              <p className="text-xs opacity-80">Total Sales</p>
            </CardContent>
          </Card>
          
          <Card className="bg-harvest text-white border-0">
            <CardContent className="p-4 text-center">
              <Package className="w-8 h-8 mx-auto mb-2" />
              <p className="text-2xl font-bold">{stats.cropsInDemand.length}</p>
              <p className="text-xs opacity-80">Top Crops</p>
            </CardContent>
          </Card>
        </div>

        {/* Analytics Tabs */}
        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="overview" className="flex items-center space-x-2">
              <BarChart3 className="w-4 h-4" />
              <span>Overview</span>
            </TabsTrigger>
            <TabsTrigger value="performance" className="flex items-center space-x-2">
              <Activity className="w-4 h-4" />
              <span>Performance</span>
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-4">
            {/* Monthly Growth */}
            <Card className="shadow-card border-0">
              <CardHeader>
                <CardTitle className="text-primary">Monthly Growth</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {monthly.slice(-3).map((data, index) => (
                    <div key={index} className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="font-medium">{data.month} {data.year || 2024}</span>
                        <span className="text-sm text-muted-foreground">Sales</span>
                      </div>
                      <Progress 
                        value={(data.sales / 60000) * 100} 
                        className="h-2"
                      />
                      <div className="text-xs text-muted-foreground">
                        Sales: ₹{data.sales.toLocaleString()}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Crops in Demand */}
            <Card className="shadow-card border-0">
              <CardHeader>
                <CardTitle className="text-primary">Crops in High Demand</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-3">
                  {stats.cropsInDemand.map((crop, index) => (
                    <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                      <span className="font-medium">{crop.name}</span>
                      <Badge variant="secondary">High</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Performance Tab */}
          <TabsContent value="performance" className="space-y-4">
            {/* Top Performing Farmers */}
            <Card className="shadow-card border-0">
              <CardHeader>
                <CardTitle className="text-primary">Top Performing Farmers</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {top.map((farmer, index) => (
                    <div key={index} className="flex items-center justify-between p-4 rounded-lg border">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                          <span className="font-semibold text-primary">#{index + 1}</span>
                        </div>
                        <div>
                          <h4 className="font-medium">{farmer.name}</h4>
                          <p className="text-sm text-muted-foreground">{farmer.orders} orders</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="flex items-center space-x-1 mb-1">
                          <Star className="w-4 h-4 fill-harvest text-harvest" />
                          <span className="text-sm font-medium">{index === 0 ? 4.9 : index === 1 ? 4.8 : 4.7}</span>
                        </div>
                        <p className="text-sm text-primary font-semibold">₹{Math.round(farmer.sales).toLocaleString()}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Platform Health */}
            <Card className="shadow-card border-0">
              <CardHeader>
                <CardTitle className="text-primary">Platform Health</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between mb-2">
                      <span>Customer Satisfaction</span>
                      <span className="font-medium">94%</span>
                    </div>
                    <Progress value={94} className="h-2" />
                  </div>
                  <div>
                    <div className="flex justify-between mb-2">
                      <span>Farmer Engagement</span>
                      <span className="font-medium">87%</span>
                    </div>
                    <Progress value={87} className="h-2" />
                  </div>
                  <div>
                    <div className="flex justify-between mb-2">
                      <span>Order Fulfillment</span>
                      <span className="font-medium">96%</span>
                    </div>
                    <Progress value={96} className="h-2" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Insights Tab */}
          <TabsContent value="insights" className="space-y-4">
            {/* Market Trends */}
            <Card className="shadow-card border-0">
              <CardHeader>
                <CardTitle className="text-primary">Market Insights</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-4 rounded-lg bg-green-50 border border-green-200">
                    <h4 className="font-semibold text-green-800 mb-2">Growing Demand</h4>
                    <p className="text-sm text-green-700">
                      Organic vegetables show 23% increase in orders this month. 
                      Consider promoting organic farming practices.
                    </p>
                  </div>
                  
                  <div className="p-4 rounded-lg bg-blue-50 border border-blue-200">
                    <h4 className="font-semibold text-blue-800 mb-2">Seasonal Opportunity</h4>
                    <p className="text-sm text-blue-700">
                      Winter crops preparation time. Suggest farmers to stock seeds for 
                      wheat, mustard, and peas.
                    </p>
                  </div>
                  
                  <div className="p-4 rounded-lg bg-amber-50 border border-amber-200">
                    <h4 className="font-semibold text-amber-800 mb-2">Price Alert</h4>
                    <p className="text-sm text-amber-700">
                      Tomato prices trending upward (+15%). Good opportunity for 
                      tomato farmers to increase stock.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Regional Performance */}
            <Card className="shadow-card border-0">
              <CardHeader>
                <CardTitle className="text-primary">Regional Performance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 gap-3">
                  <div className="flex justify-between items-center p-3 rounded-lg bg-muted/50">
                    <span className="font-medium">Punjab</span>
                    <div className="text-right">
                      <Badge variant="default">Leading</Badge>
                      <p className="text-xs text-muted-foreground mt-1">₹89,400 sales</p>
                    </div>
                  </div>
                  <div className="flex justify-between items-center p-3 rounded-lg bg-muted/50">
                    <span className="font-medium">Maharashtra</span>
                    <div className="text-right">
                      <Badge variant="secondary">Growing</Badge>
                      <p className="text-xs text-muted-foreground mt-1">₹67,200 sales</p>
                    </div>
                  </div>
                  <div className="flex justify-between items-center p-3 rounded-lg bg-muted/50">
                    <span className="font-medium">Karnataka</span>
                    <div className="text-right">
                      <Badge variant="secondary">Steady</Badge>
                      <p className="text-xs text-muted-foreground mt-1">₹54,800 sales</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AdminDashboard;