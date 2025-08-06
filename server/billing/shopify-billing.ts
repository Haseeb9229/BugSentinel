// Shopify Billing Service - Production Implementation
// Note: This requires @shopify/shopify-api package and proper OAuth session management

export interface BillingPlan {
  name: string;
  price: number;
  features: string[];
  trialDays: number;
  scanLimit?: number;
}

export const billingPlans: Record<string, BillingPlan> = {
  basic: {
    name: "Basic Plan",
    price: 29.00,
    features: [
      "Up to 100 pages scanned",
      "Daily monitoring",
      "Email alerts",
      "Basic performance metrics"
    ],
    trialDays: 7,
    scanLimit: 100
  },
  pro: {
    name: "Pro Plan", 
    price: 89.00,
    features: [
      "Up to 1,000 pages scanned",
      "Hourly monitoring", 
      "Slack + Email alerts",
      "Advanced analytics",
      "Theme change monitoring"
    ],
    trialDays: 14,
    scanLimit: 1000
  },
  enterprise: {
    name: "Enterprise Plan",
    price: 199.00,
    features: [
      "Unlimited scanning",
      "Real-time monitoring (15-minute intervals)",
      "Priority support",
      "Custom reports",
      "API access",
      "White-label options"
    ],
    trialDays: 30
  }
};

// Mock implementation for current demo
// In production, replace with actual Shopify API calls
export class ShopifyBillingService {
  
  // Create recurring subscription charge
  async createRecurringCharge(session: any, planType: string): Promise<any> {
    const plan = billingPlans[planType];
    
    if (!plan) {
      throw new Error(`Invalid plan type: ${planType}`);
    }

    // TODO: Replace with actual Shopify API call
    // const recurringCharge = new Shopify.RecurringApplicationCharge({
    //   session,
    // });
    // 
    // recurringCharge.name = plan.name;
    // recurringCharge.price = plan.price;
    // recurringCharge.trial_days = plan.trialDays;
    // recurringCharge.return_url = `${process.env.HOST}/billing/callback`;
    // 
    // await recurringCharge.save();
    // return recurringCharge;

    // Mock response for demo
    return {
      id: `charge_${Date.now()}`,
      name: plan.name,
      price: plan.price,
      trial_days: plan.trialDays,
      status: 'pending',
      confirmation_url: `${process.env.HOST}/billing/mock-confirm?plan=${planType}`
    };
  }

  // Activate a pending charge
  async activateCharge(session: any, chargeId: string): Promise<any> {
    // TODO: Replace with actual Shopify API call
    // const charge = new Shopify.RecurringApplicationCharge({
    //   session,
    //   id: chargeId
    // });
    // 
    // await charge.activate();
    // return charge;

    // Mock response for demo
    return {
      id: chargeId,
      status: 'active',
      activated_on: new Date().toISOString()
    };
  }

  // Cancel active subscription
  async cancelSubscription(session: any, chargeId: string): Promise<boolean> {
    // TODO: Replace with actual Shopify API call
    // const charge = new Shopify.RecurringApplicationCharge({
    //   session,
    //   id: chargeId
    // });
    // 
    // await charge.delete();
    // return true;

    // Mock response for demo
    return true;
  }

  // Get all active charges for a store
  async getActiveCharges(session: any): Promise<any[]> {
    // TODO: Replace with actual Shopify API call
    // const charges = await Shopify.RecurringApplicationCharge.all({
    //   session,
    //   status: 'active'
    // });
    // 
    // return charges;

    // Mock response for demo
    return [{
      id: 'charge_12345',
      name: 'Pro Plan',
      price: 89.00,
      status: 'active',
      billing_on: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
    }];
  }

  // Create usage charge for overages
  async createUsageCharge(session: any, chargeId: string, description: string, price: number): Promise<any> {
    // TODO: Replace with actual Shopify API call
    // const usageCharge = new Shopify.UsageCharge({
    //   session,
    //   recurring_application_charge_id: chargeId
    // });
    // 
    // usageCharge.description = description;
    // usageCharge.price = price;
    // 
    // await usageCharge.save();
    // return usageCharge;

    // Mock response for demo
    return {
      id: `usage_${Date.now()}`,
      description,
      price,
      created_at: new Date().toISOString()
    };
  }

  // Track scan usage and create overage charges if needed
  async trackScanUsage(storeId: string, scansCount: number): Promise<void> {
    try {
      // Get store's active subscription
      const subscription = await this.getStoreSubscription(storeId);
      
      if (!subscription || subscription.planType === 'enterprise') {
        // No limits for enterprise or no subscription
        return;
      }

      const plan = billingPlans[subscription.planType];
      if (!plan.scanLimit) return;

      const overage = scansCount - plan.scanLimit;
      if (overage > 0) {
        // Create usage charge for overage scans
        const overagePrice = overage * 0.10; // $0.10 per extra scan
        
        await this.createUsageCharge(
          subscription.session,
          subscription.shopifyChargeId,
          `Additional scans: ${overage} scans`,
          overagePrice
        );

        console.log(`Created usage charge for ${storeId}: ${overage} scans, $${overagePrice}`);
      }
    } catch (error) {
      console.error('Error tracking scan usage:', error);
    }
  }

  // Helper method to get store subscription (would connect to database)
  private async getStoreSubscription(storeId: string): Promise<any> {
    // TODO: Implement database lookup
    // return await storage.getActiveSubscription(storeId);
    
    // Mock data for demo
    return {
      storeId,
      planType: 'pro',
      shopifyChargeId: 'charge_12345',
      status: 'active',
      session: {} // OAuth session would be stored here
    };
  }

  // Validate if store has active subscription
  async hasActiveSubscription(storeId: string): Promise<boolean> {
    const subscription = await this.getStoreSubscription(storeId);
    return subscription && subscription.status === 'active';
  }

  // Get subscription limits for a store
  async getSubscriptionLimits(storeId: string): Promise<any> {
    const subscription = await this.getStoreSubscription(storeId);
    
    if (!subscription) {
      return {
        scanLimit: 0,
        planType: 'none',
        features: []
      };
    }

    const plan = billingPlans[subscription.planType];
    return {
      scanLimit: plan.scanLimit || Infinity,
      planType: subscription.planType,
      features: plan.features
    };
  }
}

export const billingService = new ShopifyBillingService();