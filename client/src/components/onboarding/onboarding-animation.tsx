import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle, Zap, Shield, BarChart3, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface OnboardingAnimationProps {
  onComplete: () => void;
  storeName?: string;
}

export function OnboardingAnimation({ onComplete, storeName = "Your Store" }: OnboardingAnimationProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [showFinalAnimation, setShowFinalAnimation] = useState(false);

  const steps = [
    {
      icon: Shield,
      title: "Welcome to Bug Patrol!",
      description: `Hi there! I'm here to protect ${storeName} from bugs and performance issues.`,
      color: "text-blue-500",
      bgColor: "bg-blue-100"
    },
    {
      icon: Zap,
      title: "Automated Scanning",
      description: "I'll scan your store every hour to catch issues before your customers do.",
      color: "text-yellow-500",
      bgColor: "bg-yellow-100"
    },
    {
      icon: BarChart3,
      title: "Performance Monitoring",
      description: "Track Core Web Vitals, broken links, and JavaScript errors in real-time.",
      color: "text-green-500",
      bgColor: "bg-green-100"
    },
    {
      icon: CheckCircle,
      title: "You're All Set!",
      description: "Let's start with your first scan to establish a baseline.",
      color: "text-shopify-green",
      bgColor: "bg-green-100"
    }
  ];

  useEffect(() => {
    if (currentStep < steps.length - 1) {
      const timer = setTimeout(() => {
        setCurrentStep(currentStep + 1);
      }, 3000);
      return () => clearTimeout(timer);
    } else if (currentStep === steps.length - 1 && !showFinalAnimation) {
      const timer = setTimeout(() => {
        setShowFinalAnimation(true);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [currentStep, showFinalAnimation, steps.length]);

  const currentStepData = steps[currentStep];
  const IconComponent = currentStepData.icon;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <Card className="w-full max-w-md mx-4">
        <CardContent className="p-8">
          <div className="text-center">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentStep}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.5 }}
              >
                <motion.div
                  className={`w-16 h-16 mx-auto mb-4 rounded-full ${currentStepData.bgColor} flex items-center justify-center`}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                >
                  <IconComponent className={`w-8 h-8 ${currentStepData.color}`} />
                </motion.div>

                <motion.h2
                  className="text-2xl font-bold text-shopify-text mb-3"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.4 }}
                >
                  {currentStepData.title}
                </motion.h2>

                <motion.p
                  className="text-gray-600 mb-6"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.6 }}
                >
                  {currentStepData.description}
                </motion.p>
              </motion.div>
            </AnimatePresence>

            {/* Progress indicator */}
            <div className="flex justify-center space-x-2 mb-6">
              {steps.map((_, index) => (
                <motion.div
                  key={index}
                  className={`w-2 h-2 rounded-full ${
                    index <= currentStep ? 'bg-shopify-green' : 'bg-gray-300'
                  }`}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: index * 0.1 }}
                />
              ))}
            </div>

            {/* Floating particles animation */}
            <div className="absolute inset-0 pointer-events-none">
              {[...Array(8)].map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute w-1 h-1 bg-shopify-green rounded-full"
                  initial={{
                    x: Math.random() * 400,
                    y: Math.random() * 600,
                    opacity: 0
                  }}
                  animate={{
                    y: Math.random() * 600,
                    opacity: [0, 1, 0],
                  }}
                  transition={{
                    duration: 3,
                    repeat: Infinity,
                    delay: i * 0.3,
                  }}
                />
              ))}
            </div>

            {showFinalAnimation && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ type: "spring", stiffness: 200 }}
              >
                <Button
                  onClick={onComplete}
                  className="bg-shopify-green hover:bg-shopify-green-dark text-white font-semibold py-3 px-6 rounded-lg flex items-center space-x-2"
                >
                  <span>Start First Scan</span>
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </motion.div>
            )}

            {!showFinalAnimation && (
              <motion.div
                className="text-sm text-gray-500"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1 }}
              >
                Setting up your monitoring...
              </motion.div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}