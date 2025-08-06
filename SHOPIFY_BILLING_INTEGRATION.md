# Shopify Billing API Integration Guide

## Current State: Mock Billing
Currently, Bug Patrol uses **mock billing data** for demonstration. The billing information you see in the admin panel and customer settings is hardcoded for UI/UX purposes.

## Real Shopify Billing Implementation

### 1. Shopify Billing API Overview
Shopify provides several billing mechanisms:
- **Application Charges** - One-time payments
- **Recurring Application Charges** - Monthly/yearly subscriptions  
- **Usage Charges** - Based on usage (scans, API calls, etc.)
- **Credit-based Billing** - Pre-paid credits system

### 2. Recommended Billing Structure for Bug Patrol

```typescript
// Recommended plan structure
const billingPlans = {
  basic: {
    name: "Basic Plan",
    price: 29.00,
    features: ["100 scans/month", "Daily monitoring", "Email alerts"],
    trialDays: 7
  },
  pro: {
    name: "Pro Plan", 
    price: 89.00,
    features: ["1000 scans/month", "Hourly monitoring", "Slack + Email alerts"],
    trialDays: 14
  },
  enterprise: {
    name: "Enterprise Plan",
    price: 199.00,
    features: ["Unlimited scans", "Real-time monitoring", "Priority support"],
    trialDays: 30
  }
};
```

### 3. Implementation Steps

#### Step 3.1: Install Shopify Billing Dependencies
```bash
npm install @shopify/shopify-api
```

#### Step 3.2: Create Billing Service
```typescript
// server/billing/shopify-billing.ts
import { Shopify } from '@shopify/shopify-api';

export class ShopifyBillingService {
  async createRecurringCharge(session: any, planType: string) {
    const plan = billingPlans[planType];
    
    const recurringCharge = new Shopify.RecurringApplicationCharge({
      session,
    });
    
    recurringCharge.name = plan.name;
    recurringCharge.price = plan.price;
    recurringCharge.trial_days = plan.trialDays;
    recurringCharge.return_url = `${process.env.HOST}/billing/callback`;
    
    await recurringCharge.save();
    return recurringCharge;
  }

  async activateCharge(session: any, chargeId: string) {
    const charge = new Shopify.RecurringApplicationCharge({
      session,
      id: chargeId
    });
    
    await charge.activate();
    return charge;
  }

  async cancelSubscription(session: any, chargeId: string) {
    const charge = new Shopify.RecurringApplicationCharge({
      session,
      id: chargeId
    });
    
    await charge.delete();
    return true;
  }

  async getActiveCharges(session: any) {
    const charges = await Shopify.RecurringApplicationCharge.all({
      session,
      status: 'active'
    });
    
    return charges;
  }
}
```

#### Step 3.3: Add Billing Routes
```typescript
// server/routes/billing.ts
import { ShopifyBillingService } from '../billing/shopify-billing';

const billingService = new ShopifyBillingService();

// Create subscription
app.post('/api/billing/subscribe', async (req, res) => {
  try {
    const { planType } = req.body;
    const session = req.session; // Get from OAuth session
    
    const charge = await billingService.createRecurringCharge(session, planType);
    
    // Store charge info in database
    await storage.createSubscription({
      storeId: session.shop,
      planType,
      shopifyChargeId: charge.id,
      status: 'pending',
      monthlyRevenue: charge.price
    });
    
    res.json({ 
      success: true, 
      confirmationUrl: charge.confirmation_url 
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Billing callback (after user confirms)
app.get('/billing/callback', async (req, res) => {
  try {
    const { charge_id } = req.query;
    const session = req.session;
    
    const charge = await billingService.activateCharge(session, charge_id);
    
    // Update subscription in database
    await storage.updateSubscription(charge_id, {
      status: 'active',
      activatedAt: new Date()
    });
    
    // Redirect to success page
    res.redirect(`/?shop=${session.shop}&billing=success`);
  } catch (error) {
    res.redirect(`/?shop=${session.shop}&billing=error`);
  }
});

// Cancel subscription
app.post('/api/billing/cancel', async (req, res) => {
  try {
    const { subscriptionId } = req.body;
    const session = req.session;
    
    await billingService.cancelSubscription(session, subscriptionId);
    
    // Update in database
    await storage.updateSubscription(subscriptionId, {
      status: 'cancelled',
      cancelledAt: new Date()
    });
    
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

#### Step 3.4: Update Database Schema
```typescript
// Add to shared/schema.ts
export const subscriptions = pgTable("subscriptions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  storeId: varchar("store_id").references(() => stores.id).notNull(),
  shopifyChargeId: text("shopify_charge_id").unique(),
  planType: text("plan_type").notNull(), // 'basic', 'pro', 'enterprise'
  status: text("status").notNull(), // 'pending', 'active', 'cancelled', 'expired'
  monthlyRevenue: decimal("monthly_revenue", { precision: 10, scale: 2 }),
  trialEndsAt: timestamp("trial_ends_at"),
  activatedAt: timestamp("activated_at"),
  cancelledAt: timestamp("cancelled_at"),
  nextBillingAt: timestamp("next_billing_at"),
  createdAt: timestamp("created_at").defaultNow(),
});
```

#### Step 3.5: Frontend Billing Integration
```typescript
// client/src/hooks/use-billing.ts
export function useBilling() {
  const createSubscription = useMutation({
    mutationFn: async (planType: string) => {
      const response = await apiRequest('/api/billing/subscribe', {
        method: 'POST',
        body: JSON.stringify({ planType })
      });
      return response;
    },
    onSuccess: (data) => {
      // Redirect to Shopify billing confirmation
      window.top.location.href = data.confirmationUrl;
    }
  });

  const cancelSubscription = useMutation({
    mutationFn: async (subscriptionId: string) => {
      return apiRequest('/api/billing/cancel', {
        method: 'POST',
        body: JSON.stringify({ subscriptionId })
      });
    }
  });

  return { createSubscription, cancelSubscription };
}
```

#### Step 3.6: Update Plan Selection UI
```typescript
// client/src/components/billing/plan-selector.tsx
import { useBilling } from '@/hooks/use-billing';

export function PlanSelector() {
  const { createSubscription } = useBilling();

  const handleUpgrade = (planType: string) => {
    createSubscription.mutate(planType);
  };

  return (
    <div className="grid grid-cols-3 gap-4">
      {Object.entries(billingPlans).map(([key, plan]) => (
        <Card key={key}>
          <CardHeader>
            <CardTitle>{plan.name}</CardTitle>
            <CardDescription>${plan.price}/month</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {plan.features.map((feature, i) => (
                <li key={i} className="text-sm">{feature}</li>
              ))}
            </ul>
          </CardContent>
          <CardFooter>
            <Button 
              className="w-full"
              onClick={() => handleUpgrade(key)}
              disabled={createSubscription.isPending}
            >
              {createSubscription.isPending ? 'Processing...' : 'Select Plan'}
            </Button>
          </CardFooter>
        </Card>
      ))}
    </div>
  );
}
```

### 4. Billing Webhooks (Important!)

Shopify sends webhooks when billing events occur:

```typescript
// server/webhooks/billing.ts
app.post('/webhooks/app/subscriptions/update', (req, res) => {
  const subscription = req.body;
  
  // Update subscription status in database
  storage.updateSubscription(subscription.id, {
    status: subscription.status,
    nextBillingAt: subscription.billing_on
  });
  
  res.status(200).send('OK');
});
```

### 5. Usage-Based Billing (Optional)

For scanning-based billing:

```typescript
// Track usage and create usage charges
export async function trackScanUsage(storeId: string, scansCount: number) {
  const subscription = await storage.getActiveSubscription(storeId);
  
  if (subscription.planType === 'enterprise') {
    // Unlimited scans, no usage charge
    return;
  }
  
  const overage = scansCount - subscription.scanLimit;
  if (overage > 0) {
    // Create usage charge for overage
    const usageCharge = new Shopify.UsageCharge({
      session: subscription.session,
      recurring_application_charge_id: subscription.shopifyChargeId
    });
    
    usageCharge.description = `Additional scans: ${overage}`;
    usageCharge.price = overage * 0.10; // $0.10 per extra scan
    
    await usageCharge.save();
  }
}
```

### 6. Testing Billing (Important!)

#### Development Testing:
1. Use Shopify development stores
2. All billing is fake in development
3. Test subscription flows without real charges

#### Production Testing:
1. Create a real subscription with $0.01 charges
2. Test cancellation flows
3. Monitor webhook delivery

### 7. Compliance & Requirements

#### Shopify App Store Requirements:
- Must have a free trial period
- Clear pricing display
- Easy cancellation process
- Proper webhook handling
- GDPR compliance for billing data

#### Implementation Checklist:
- [ ] Install Shopify billing dependencies
- [ ] Create billing service class
- [ ] Add billing API routes
- [ ] Update database schema
- [ ] Implement frontend billing UI
- [ ] Set up billing webhooks
- [ ] Test with development stores
- [ ] Add usage tracking (if needed)
- [ ] Implement cancellation flow
- [ ] Add billing history view

### 8. Revenue Projections

With proper Shopify billing integration:
- **Automatic subscription management**
- **Shopify handles payment processing**
- **Built-in dunning management**
- **20% Shopify revenue share** (only for paid apps)

## Next Steps

1. **Replace mock billing** with Shopify Billing API
2. **Test thoroughly** in development environment
3. **Set up proper webhooks** for billing events
4. **Implement usage tracking** for scan limits
5. **Add comprehensive error handling**

This implementation will provide a professional billing system that integrates seamlessly with Shopify's ecosystem and meets App Store requirements.