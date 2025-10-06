import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Leaf, User, Tractor, Shield } from "lucide-react";
import farmigoLogo from "@/assets/farmigo-logo.png";

const Welcome = () => {
  const navigate = useNavigate();
  const [selectedRole, setSelectedRole] = useState<string>("customer");
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
  });
  const { login, register } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');

  type UserType = { role?: string };
  type ErrorType = { response?: { data?: { error?: string } } };

  const handleAuth = async (type: 'login' | 'register') => {
    setError(null);
    if (!formData.email || !formData.password) {
      setError("Email and password are required");
      return;
    }
    if (type === 'register' && !formData.name) {
      setError("Name is required for registration");
      return;
    }
    setLoading(true);
    try {
      if (type === 'login') {
        const u: UserType = await login(formData.email, formData.password);
        const role = u?.role || selectedRole;
        navigate(`/${role}`);
      } else {
        const u: UserType = await register({ name: formData.name, email: formData.email, password: formData.password, role: selectedRole, phone: formData.phone });
        setFormData({ name: "", email: "", phone: "", password: "" });
        setActiveTab('login');
        setError("Registration successful! Please login.");
      }
    } catch (e) {
      const err = e as ErrorType;
      setError(err?.response?.data?.error || "Authentication failed. Please check your details.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen gradient-nature flex flex-col">
      {/* Header with Logo */}
      <div className="flex flex-col items-center pt-12 pb-8">
        <div className="w-24 h-24 mb-4 bg-white rounded-full flex items-center justify-center shadow-soft">
          <img src={farmigoLogo} alt="Farmigo" className="w-16 h-16" />
        </div>
        <h1 className="text-4xl font-bold text-white mb-2">Farmigo</h1>
        <p className="text-white/80 text-center px-4">
          Connecting farmers with fresh opportunities
        </p>
      </div>

      {/* Auth Form */}
      <div className="flex-1 px-4 pb-8">
        <Card className="max-w-md mx-auto shadow-card border-0">
          <CardHeader className="text-center pb-4">
            <CardTitle className="text-2xl text-primary">Welcome Back</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={v => setActiveTab(v as 'login' | 'register')} className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="login">Login</TabsTrigger>
                <TabsTrigger value="register">Register</TabsTrigger>
              </TabsList>

              {/* Role Selection */}
              <div className="mb-6">
                <Label className="text-base font-medium mb-3 block">I am a:</Label>
                <RadioGroup value={selectedRole} onValueChange={setSelectedRole}>
                  <div className="flex items-center space-x-2 p-3 rounded-lg border hover:bg-muted/50 transition-colors">
                    <RadioGroupItem value="customer" id="customer" />
                    <User className="w-5 h-5 text-primary" />
                    <Label htmlFor="customer" className="cursor-pointer">Customer</Label>
                  </div>
                  <div className="flex items-center space-x-2 p-3 rounded-lg border hover:bg-muted/50 transition-colors">
                    <RadioGroupItem value="farmer" id="farmer" />
                    <Tractor className="w-5 h-5 text-primary" />
                    <Label htmlFor="farmer" className="cursor-pointer">Farmer</Label>
                  </div>
                  <div className="flex items-center space-x-2 p-3 rounded-lg border hover:bg-muted/50 transition-colors">
                    <RadioGroupItem value="admin" id="admin" />
                    <Shield className="w-5 h-5 text-primary" />
                    <Label htmlFor="admin" className="cursor-pointer">Admin</Label>
                  </div>
                </RadioGroup>
              </div>

              <TabsContent value="login" className="space-y-4">
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="Enter your email"
                    value={formData.email}
                    onChange={(e) => handleInputChange("email", e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="Enter your password"
                    value={formData.password}
                    onChange={(e) => handleInputChange("password", e.target.value)}
                  />
                </div>
                {error && <p className="text-sm text-red-600">{error}</p>}
                <Button onClick={() => handleAuth('login')} className="w-full bg-primary hover:bg-primary/90" size="lg" disabled={loading}>
                  {loading ? 'Signing in...' : 'Login'}
                </Button>
              </TabsContent>

              <TabsContent value="register" className="space-y-4">
                <div>
                  <Label htmlFor="name">Full Name</Label>
                  <Input
                    id="name"
                    placeholder="Enter your name"
                    value={formData.name}
                    onChange={(e) => handleInputChange("name", e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="email-reg">Email</Label>
                  <Input
                    id="email-reg"
                    type="email"
                    placeholder="Enter your email"
                    value={formData.email}
                    onChange={(e) => handleInputChange("email", e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="Enter your phone number"
                    value={formData.phone}
                    onChange={(e) => handleInputChange("phone", e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="password-reg">Password</Label>
                  <Input
                    id="password-reg"
                    type="password"
                    placeholder="Create a password"
                    value={formData.password}
                    onChange={(e) => handleInputChange("password", e.target.value)}
                  />
                </div>
                {error && <p className={`text-sm ${error?.includes('successful') ? 'text-green-600' : 'text-red-600'}`}>{error}</p>}
                <Button onClick={() => handleAuth('register')} className="w-full bg-primary hover:bg-primary/90" size="lg" disabled={loading}>
                  {loading ? 'Creating account...' : 'Register'}
                </Button>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>

      {/* Decorative Elements */}
      <div className="absolute top-20 left-4 opacity-20">
        <Leaf className="w-16 h-16 text-white transform rotate-12" />
      </div>
      <div className="absolute bottom-32 right-6 opacity-20">
        <Leaf className="w-12 h-12 text-white transform -rotate-45" />
      </div>
    </div>
  );
};

export default Welcome;