import { useState } from "react";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Mail, MessageSquare } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { alertSettings } from "@shared/schema";

type AlertSettings = typeof alertSettings.$inferSelect;

interface AlertSettingsProps {
  storeId: string;
  settings?: AlertSettings;
}

export default function AlertSettings({ storeId, settings }: AlertSettingsProps) {
  const [emailEnabled, setEmailEnabled] = useState(settings?.emailEnabled || false);
  const [slackEnabled, setSlackEnabled] = useState(settings?.slackEnabled || false);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const updateSettingsMutation = useMutation({
    mutationFn: (newSettings: Partial<AlertSettings>) =>
      apiRequest("PATCH", `/api/alert-settings/${storeId}`, newSettings),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard", storeId] });
      toast({
        title: "Settings Updated",
        description: "Alert settings have been saved successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Update Failed",
        description: "Failed to update alert settings. Please try again.",
        variant: "destructive",
      });
    },
  });

  const testAlertsMutation = useMutation({
    mutationFn: () => apiRequest("POST", `/api/test-alerts/${storeId}`, {}),
    onSuccess: () => {
      toast({
        title: "Test Alerts Sent",
        description: "Test notifications have been sent to your configured channels.",
      });
    },
    onError: () => {
      toast({
        title: "Test Failed",
        description: "Failed to send test alerts. Please check your settings.",
        variant: "destructive",
      });
    },
  });

  const handleEmailToggle = (checked: boolean) => {
    setEmailEnabled(checked);
    updateSettingsMutation.mutate({ emailEnabled: checked });
  };

  const handleSlackToggle = (checked: boolean) => {
    setSlackEnabled(checked);
    updateSettingsMutation.mutate({ slackEnabled: checked });
  };

  const handleTestAlerts = () => {
    testAlertsMutation.mutate();
  };

  return (
    <div className="bg-shopify-surface rounded-xl border border-shopify-border">
      <div className="px-6 py-4 border-b border-shopify-border">
        <h3 className="text-lg font-semibold text-shopify-text">Alert Settings</h3>
      </div>
      <div className="p-6">
        <div className="space-y-6">
          {/* Email Notifications */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-3">
                <Mail className="w-5 h-5 text-gray-400" />
                <span className="font-medium text-shopify-text">Email Notifications</span>
              </div>
              <Switch
                checked={emailEnabled}
                onCheckedChange={handleEmailToggle}
                disabled={updateSettingsMutation.isPending}
              />
            </div>
            <p className="text-sm text-gray-500 ml-8">admin@example.com</p>
          </div>

          {/* Slack Integration */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-3">
                <MessageSquare className="w-5 h-5 text-gray-400" />
                <span className="font-medium text-shopify-text">Slack Integration</span>
              </div>
              <Switch
                checked={slackEnabled}
                onCheckedChange={handleSlackToggle}
                disabled={updateSettingsMutation.isPending}
              />
            </div>
            <button className="text-sm text-shopify-green hover:text-green-600 ml-8 font-medium">
              Connect Slack Workspace
            </button>
          </div>

          {/* Alert Thresholds */}
          <div className="pt-4 border-t border-shopify-border">
            <h4 className="font-medium text-shopify-text mb-4">Alert Thresholds</h4>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-700">Critical Issues</span>
                <span className="text-sm font-medium text-shopify-text">
                  {settings?.criticalThreshold || 'Immediate'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-700">Performance Drops</span>
                <span className="text-sm font-medium text-shopify-text">
                  &gt;{settings?.performanceThreshold || 20}% slower
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-700">Uptime Issues</span>
                <span className="text-sm font-medium text-shopify-text">
                  &gt;{settings?.uptimeThreshold || 5} minutes
                </span>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="pt-4 border-t border-shopify-border">
            <div className="grid grid-cols-2 gap-3">
              <Button
                variant="outline"
                className="w-full"
                onClick={() => {
                  toast({
                    title: "Configure Alerts",
                    description: "Alert configuration panel would open here.",
                  });
                }}
              >
                Configure
              </Button>
              <Button
                className="w-full bg-shopify-green text-white hover:bg-shopify-green/90"
                onClick={handleTestAlerts}
                disabled={testAlertsMutation.isPending}
              >
                {testAlertsMutation.isPending ? 'Testing...' : 'Test Alerts'}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
