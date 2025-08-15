import { WebClient } from "@slack/web-api";

// Slack module will now use credentials from database per store


export interface SlackNotification {
  title: string;
  message: string;
  severity: 'critical' | 'warning' | 'info';
  storeName: string;
  storeUrl?: string;
  issueCount?: number;
}

export async function sendSlackNotification(
  notification: SlackNotification, 
  botToken?: string, 
  channelId?: string
): Promise<string | undefined> {
  try {
    const { title, message, severity, storeName, storeUrl, issueCount } = notification;
    
    const severityEmojis = {
      critical: '🚨',
      warning: '⚠️',
      info: 'ℹ️'
    };

    const blocks = [
      {
        type: 'header',
        text: {
          type: 'plain_text',
          text: `${severityEmojis[severity]} Bug Patrol Alert - ${title}`
        }
      },
      {
        type: 'section',
        fields: [
          {
            type: 'mrkdwn',
            text: `*Store:* ${storeName}`
          },
          {
            type: 'mrkdwn',
            text: `*Severity:* ${severity.toUpperCase()}`
          }
        ]
      },
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: message
        }
      }
    ];

    if (issueCount) {
      blocks.push({
        type: 'section',
        fields: [
          {
            type: 'mrkdwn',
            text: `*Issues Found:* ${issueCount}`
          }
        ]
      });
    }

    if (storeUrl) {
      blocks.push({
        type: 'actions',
        elements: [
          {
            type: 'button',
            text: {
              type: 'plain_text',
              text: 'View Store Dashboard'
            },
            url: storeUrl,
            style: severity === 'critical' ? 'danger' : 'primary'
          }
        ]
      } as any);
    }

    // Use provided credentials or fall back to environment variables
    if (botToken && channelId) {
      // Use provided credentials
      const slackClient = new WebClient(botToken);
      const response = await slackClient.chat.postMessage({
        channel: channelId,
        blocks,
        attachments: [
          {
            color: severity === 'critical' ? '#ff4757' : severity === 'warning' ? '#ffa502' : '#3742fa',
            fallback: `${title} - ${message}`
          }
        ]
      });

      return response.ts;
    } else {
      throw new Error('Slack credentials required');
    }
  } catch (error) {
    console.error('Error sending Slack notification:', error);
    throw error;
  }
}

export async function sendScanCompletedNotification(
  storeName: string, 
  issuesFound: number, 
  scanDuration: string,
  dashboardUrl?: string
) {
  const severity = issuesFound > 5 ? 'critical' : issuesFound > 0 ? 'warning' : 'info';
  
  return sendSlackNotification({
    title: 'Scan Completed',
    message: `Completed automated scan for ${storeName} in ${scanDuration}. ${issuesFound === 0 ? 'No issues found! 🎉' : `Found ${issuesFound} issues that need attention.`}`,
    severity,
    storeName,
    storeUrl: dashboardUrl,
    issueCount: issuesFound
  });
}

export async function sendNewInstallationNotification(storeName: string, plan: string) {
  return sendSlackNotification({
    title: 'New Installation',
    message: `🎉 New store installed Bug Patrol! Welcome ${storeName} on the ${plan} plan.`,
    severity: 'info',
    storeName
  });
}

export async function sendCriticalIssueAlert(storeName: string, issueType: string, description: string) {
  return sendSlackNotification({
    title: 'Critical Issue Detected',
    message: `🚨 Critical ${issueType} detected: ${description}. Immediate attention required.`,
    severity: 'critical',
    storeName
  });
}

// Simple webhook-based test function
export async function sendTestWebhookMessage(webhookUrl: string, message: string): Promise<boolean> {
  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text: message,
        blocks: [
          {
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: message
            }
          }
        ]
      })
    });

    return response.ok;
  } catch (error) {
    console.error('Error sending webhook test message:', error);
    return false;
  }
}