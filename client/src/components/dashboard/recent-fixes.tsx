import { Lightbulb } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useLocation } from "wouter";

export default function RecentFixes() {
  const [, setLocation] = useLocation();
  
  const recommendations = [
    {
      id: 1,
      title: "Optimize Image Sizes",
      description: "Compress product images to improve LCP by ~0.8s. Detected 23 images over 500KB.",
      impact: "High Impact",
      impactColor: "bg-green-100 text-green-800",
      action: "Learn More"
    }
  ];

  return (
    <div className="mt-8">
      <div className="bg-shopify-surface rounded-xl border border-shopify-border">
        <div className="px-6 py-4 border-b border-shopify-border">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-shopify-text">Recent Fixes & Recommendations</h3>
            <button 
              onClick={() => setLocation('/performance')}
              className="text-shopify-green hover:text-green-600 text-sm font-medium"
            >
              View All Recommendations
            </button>
          </div>
        </div>
        <div className="p-6">
                  <div className="space-y-4">
          {recommendations.map((rec) => (
              <div key={rec.id} className="border border-shopify-border rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-shopify-success bg-opacity-10 rounded-full flex items-center justify-center">
                      <Lightbulb className="w-4 h-4 text-shopify-success" />
                    </div>
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium text-shopify-text mb-2">{rec.title}</h4>
                    <p className="text-sm text-gray-600 mb-3">{rec.description}</p>
                    <div className="flex items-center space-x-3">
                      <Badge className={rec.impactColor}>
                        {rec.impact}
                      </Badge>
                      <button className="text-xs text-shopify-green hover:text-green-600 font-medium">
                        {rec.action} →
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
