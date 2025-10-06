import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Plus, Minus, MessageCircle, Send } from "lucide-react";
import { CustomerAPI } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

interface ProductCardProps {
  id: string;
  name: string;
  price: number;
  stock: number;
  image: string;
  unit: string;
  farmer?: string;
  onRequested?: () => void;
}

const ProductCard = ({ id, name, price, stock, image, unit, farmer, onRequested }: ProductCardProps) => {
  const [quantity, setQuantity] = useState(1);
  const { toast } = useToast();

  const handleQuantityChange = (action: 'increase' | 'decrease') => {
    if (action === 'increase' && quantity < stock) {
      setQuantity(prev => prev + 1);
    } else if (action === 'decrease' && quantity > 1) {
      setQuantity(prev => prev - 1);
    }
  };

  const handleSendRequest = async () => {
    try {
      const res = await CustomerAPI.createOrder([{ inventoryId: Number(id), quantity }]);
      toast({ title: "Request sent", description: `Placed order for ${quantity} ${unit}. Total ₹${res.total.toFixed(2)}` });
      
      // Send WhatsApp message with order details
      const orderMessage = `🌟 New Order Confirmation 🌟\n\n` +
        `Product: ${name}\n` +
        `Quantity: ${quantity} ${unit}\n` +
        `Price: ₹${price}/${unit}\n` +
        `Total Amount: ₹${res.total.toFixed(2)}\n` +
        `Seller: ${farmer}\n\n` +
        `Order ID: #${res.orderId}\n` +
        `Status: Order Placed\n\n` +
        `Thank you for shopping with Farmigo! 🌾`;
      
      const whatsappUrl = `https://wa.me/919025232453?text=${encodeURIComponent(orderMessage)}`;
      window.open(whatsappUrl, '_blank');
      
      onRequested?.();
    } catch (e: unknown) {
      const err = e as { response?: { data?: { error?: string } } };
      const msg = err?.response?.data?.error || "Failed to send request";
      toast({ title: msg, variant: "destructive" });
    }
  };

  const handleContactFarmer = () => {
    const message = `Hi ${farmer}! I'm interested in buying ${name}. Is it available?`;
    const whatsappUrl = `https://wa.me/919025232453?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  const handleShareProduct = () => {
    const message = `Check out this product:\n\n🌾 ${name}\n💰 ₹${price}/${unit}\n📦 Stock: ${stock} ${unit}\n👨‍🌾 ${farmer}\n\nAvailable on Farmigo!`;
    const whatsappUrl = `https://wa.me/919025232453?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  const isOutOfStock = stock === 0;

  return (
    <Card className="shadow-card hover:shadow-soft transition-all duration-300 border-0 overflow-hidden">
      <div className="relative">
        <img 
          src={image} 
          alt={name}
          className="w-full h-40 object-cover"
        />
        {isOutOfStock && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <Badge variant="destructive">Out of Stock</Badge>
          </div>
        )}
        <div className="absolute top-2 right-2">
          <Badge variant="secondary" className="bg-white/90">
            ₹{price}/{unit}
          </Badge>
        </div>
      </div>
      
      <CardContent className="p-4">
        <div className="space-y-3">
          <div>
            <h3 className="font-semibold text-lg text-primary">{name}</h3>
            {farmer && (
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">by {farmer}</p>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleShareProduct}
                    className="text-primary hover:text-primary/80 p-1"
                  >
                    <Send className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleContactFarmer}
                    className="text-primary hover:text-primary/80 p-1"
                  >
                    <MessageCircle className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}
          </div>
          
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Available:</span>
            <span className="font-medium text-primary">{stock} {unit}</span>
          </div>

          {!isOutOfStock && (
            <>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Quantity:</span>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleQuantityChange('decrease')}
                    disabled={quantity <= 1}
                    className="h-8 w-8 p-0"
                  >
                    <Minus className="h-3 w-3" />
                  </Button>
                  <Input
                    type="number"
                    value={quantity}
                    onChange={(e) => {
                      const val = parseInt(e.target.value);
                      if (val >= 1 && val <= stock) {
                        setQuantity(val);
                      }
                    }}
                    className="w-16 h-8 text-center"
                    min="1"
                    max={stock}
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleQuantityChange('increase')}
                    disabled={quantity >= stock}
                    className="h-8 w-8 p-0"
                  >
                    <Plus className="h-3 w-3" />
                  </Button>
                </div>
              </div>

              <Button 
                onClick={handleSendRequest}
                className="w-full bg-primary hover:bg-primary/90"
                size="sm"
              >
                <Send className="w-4 h-4 mr-2" />
                Send Request - ₹{(price * quantity).toFixed(2)}
              </Button>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default ProductCard;