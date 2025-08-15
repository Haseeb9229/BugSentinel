import { storage } from './storage';

interface DelayedAlert {
  id: string;
  storeId: string;
  type: 'email' | 'slack';
  data: any;
  scheduledFor: Date;
  createdAt: Date;
}

// In-memory storage for delayed alerts (in production, use Redis or database)
const delayedAlerts: DelayedAlert[] = [];

export async function scheduleAlert(
  storeId: string,
  type: 'email' | 'slack',
  data: any
): Promise<void> {
  try {
    // Get alert settings for the store
    const settings = await storage.getAlertSettings(storeId);
    if (!settings) {
      return;
    }

    const alertFrequency = settings.alertFrequency || 'immediate';
    
    // If immediate, send right away
    if (alertFrequency === 'immediate') {
      await sendAlertImmediately(storeId, type, data);
      return;
    }

    // Calculate delay based on frequency
    const delayMs = getDelayMs(alertFrequency);
    const scheduledFor = new Date(Date.now() + delayMs);

    // Create delayed alert
    const delayedAlert: DelayedAlert = {
      id: Math.random().toString(36).substr(2, 9),
      storeId,
      type,
      data,
      scheduledFor,
      createdAt: new Date()
    };

    delayedAlerts.push(delayedAlert);
  } catch (error) {
    console.error('Error scheduling alert:', error);
  }
}

function getDelayMs(frequency: string): number {
  switch (frequency) {
    case '5min': return 5 * 60 * 1000;
    case '15min': return 15 * 60 * 1000;
    case '30min': return 30 * 60 * 1000;
    case '1hour': return 60 * 60 * 1000;
    case 'daily': return 24 * 60 * 60 * 1000;
    default: return 0;
  }
}

async function sendAlertImmediately(storeId: string, type: 'email' | 'slack', data: any): Promise<void> {
  try {
    if (type === 'email') {
      const { sendTestEmail, sendScanCompletedEmail, sendCriticalIssueEmail } = await import('./email');
      
      // Handle different email templates
      if (data.template === 'test-email') {
        await sendTestEmail(data.to);
      } else if (data.template === 'scan-completed') {
        await sendScanCompletedEmail(
          data.data.storeName,
          data.to,
          data.data.issuesFound,
          data.data.duration,
          data.data.dashboardUrl
        );
      } else if (data.template === 'critical-issues') {
        await sendCriticalIssueEmail(
          data.data.storeName,
          data.to,
          data.data.scanType,
          data.data.message,
          data.data.dashboardUrl
        );
      } else {
        // Fallback to generic email
        const { sendEmail } = await import('./email');
        await sendEmail(data);
      }
    } else if (type === 'slack') {
      const { sendSlackNotification } = await import('./slack');
      const settings = await storage.getAlertSettings(storeId);
      if (settings?.slackBotToken && settings?.slackChannelId) {
        await sendSlackNotification(data, settings.slackBotToken, settings.slackChannelId);
      }
    }
  } catch (error) {
    console.error('Error sending immediate alert:', error);
  }
}

// Process delayed alerts (should be called periodically)
export async function processDelayedAlerts(): Promise<void> {
  const now = new Date();
  const alertsToSend = delayedAlerts.filter(alert => alert.scheduledFor <= now);
  
  for (const alert of alertsToSend) {
    try {
      await sendAlertImmediately(alert.storeId, alert.type, alert.data);
    } catch (error) {
      console.error(`Error sending delayed alert for store ${alert.storeId}:`, error);
    }
  }

  // Remove sent alerts
  const remainingAlerts = delayedAlerts.filter(alert => alert.scheduledFor > now);
  delayedAlerts.length = 0;
  delayedAlerts.push(...remainingAlerts);
}

// Start the alert processor (runs every minute)
export function startAlertProcessor(): void {
  setInterval(processDelayedAlerts, 60 * 1000); // Every minute
} 