import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Store, Eye, EyeOff, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";

interface CustomerAuthProps {
  onAuthenticated: () => void;
}

export function CustomerAuth({ onAuthenticated }: CustomerAuthProps) {
  const [shopDomain, setShopDomain] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call
      
      if (shopDomain && password) {
        onAuthenticated();
      } else {
        setError("Please enter your shop domain and password.");
      }
    } catch (err) {
      setError("Authentication failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleShopifyConnect = () => {
    // In production, this would redirect to Shopify OAuth
    window.open('https://partners.shopify.com/oauth/authorize', '_blank');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <Card className="shadow-xl">
          <CardHeader className="text-center pb-8">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
              className="w-16 h-16 mx-auto mb-4 bg-shopify-green rounded-full flex items-center justify-center"
            >
              <Store className="w-8 h-8 text-white" />
            </motion.div>
            <CardTitle className="text-2xl font-bold text-shopify-text">
              Welcome to Bug Patrol
            </CardTitle>
            <CardDescription>
              Monitor your Shopify store for bugs and performance issues
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-6">
            {/* Shopify Connect Option */}
            <div className="text-center">
              <Button
                onClick={handleShopifyConnect}
                className="w-full bg-shopify-green hover:bg-shopify-green-dark text-white font-semibold"
                size="lg"
              >
                <Store className="w-5 h-5 mr-2" />
                Connect with Shopify
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
              <p className="text-sm text-gray-500 mt-2">
                Recommended: Install directly from Shopify App Store
              </p>
            </div>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white px-2 text-gray-500">Or sign in manually</span>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="shop">Shop Domain</Label>
                <div className="relative">
                  <Input
                    id="shop"
                    type="text"
                    placeholder="your-store"
                    value={shopDomain}
                    onChange={(e) => setShopDomain(e.target.value)}
                    required
                  />
                  <span className="absolute right-3 top-2.5 text-sm text-gray-500">
                    .myshopify.com
                  </span>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>

              {error && (
                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="text-sm text-red-600 bg-red-50 p-3 rounded-md"
                >
                  {error}
                </motion.div>
              )}

              <Button
                type="submit"
                variant="outline"
                className="w-full"
                disabled={isLoading}
              >
                {isLoading ? "Signing In..." : "Sign In"}
              </Button>
            </form>

            <div className="text-center space-y-2">
              <div className="flex justify-center space-x-2">
                <Badge variant="secondary" className="text-xs">Free Trial</Badge>
                <Badge variant="secondary" className="text-xs">No Credit Card</Badge>
              </div>
              <p className="text-xs text-gray-500">
                New to Bug Patrol? 
                <Button variant="link" className="text-xs p-0 ml-1 h-auto">
                  Start free trial
                </Button>
              </p>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}