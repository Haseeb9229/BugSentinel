import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Settings as SettingsIcon, Shield, Clock, Zap, Bell, CreditCard } from "lucide-react";
import Sidebar from "@/components/layout/sidebar";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useShopifyAuth } from "@/hooks/use-shopify-auth";
import { useLocation } from "wouter";

export default function Settings() {
  const [storeId, setStoreId] = useState<string | null>(null);
  const [emailEnabled, setEmailEnabled] = useState(false);
  const [slackEnabled, setSlackEnabled] = useState(false);
  const [emailAddress, setEmailAddress] = useState("");
  const [slackBotToken, setSlackBotToken] = useState("");
  const [slackChannelId, setSlackChannelId] = useState("");
  const [isTestingEmail, setIsTestingEmail] = useState(false);
  const [isTestingSlack, setIsTestingSlack] = useState(false);
  const [scanFrequency, setScanFrequency] = useState("60");
  const [alertFrequency, setAlertFrequency] = useState("immediate");
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [changedSettings, setChangedSettings] = useState<Set<string>>(new Set());
  const [highlightScanFrequency, setHighlightScanFrequency] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [location] = useLocation();

  // Get session data from authentication hook
  const { session, isLoading: sessionLoading, isAuthenticated } = useShopifyAuth();

  // Set storeId when session is available
  useEffect(() => {
    if (session?.storeId) {
      setStoreId(session.storeId);
    }
  }, [session]);

  // Handle URL parameters for highlighting sections
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const highlight = urlParams.get('highlight');
    if (highlight === 'scan-frequency') {
      setHighlightScanFrequency(true);
      // Remove highlight after 3 seconds
      setTimeout(() => {
        setHighlightScanFrequency(false);
      }, 3000);
    }
  }, []); // Run only on mount

  // Fetch current settings
  const { data: settings } = useQuery({
    queryKey: ["/api/alert-settings", storeId],
    enabled: !!storeId,
  });

  // Update local state when settings are loaded
  useEffect(() => {
    if (settings) {
      setEmailEnabled(Boolean(settings.emailEnabled));
      setSlackEnabled(Boolean(settings.slackEnabled));
      setEmailAddress(String(settings.emailAddress || ""));
      setSlackBotToken(String(settings.slackBotToken || ""));
      setSlackChannelId(String(settings.slackChannelId || ""));
      setScanFrequency(settings.scanFrequency?.toString() || "60");
      setAlertFrequency(settings.alertFrequency || "immediate");
      setHasUnsavedChanges(false);
      setChangedSettings(new Set()); // Clear changed settings when loading new ones
    }
  }, [settings]);

  // Track changes to detect unsaved changes
  const handleEmailEnabledChange = (enabled: boolean) => {
    setEmailEnabled(enabled);
    setHasUnsavedChanges(true);
    setChangedSettings(prev => new Set(prev).add('emailEnabled'));
  };

  const handleSlackEnabledChange = (enabled: boolean) => {
    setSlackEnabled(enabled);
    setHasUnsavedChanges(true);
    setChangedSettings(prev => new Set(prev).add('slackEnabled'));
  };

  const handleEmailAddressChange = (address: string) => {
    setEmailAddress(address);
    setHasUnsavedChanges(true);
    setChangedSettings(prev => new Set(prev).add('emailAddress'));
  };

  const handleSlackBotTokenChange = (token: string) => {
    setSlackBotToken(token);
    setHasUnsavedChanges(true);
    setChangedSettings(prev => new Set(prev).add('slackBotToken'));
  };

  const handleSlackChannelIdChange = (channelId: string) => {
    setSlackChannelId(channelId);
    setHasUnsavedChanges(true);
    setChangedSettings(prev => new Set(prev).add('slackChannelId'));
  };

  // Save settings mutation
  const saveSettingsMutation = useMutation({
    mutationFn: (newSettings: any) => {
      return apiRequest("PATCH", `/api/alert-settings/${storeId}`, newSettings);
    },
    onSuccess: (data) => {
      toast({
        title: "Settings Saved",
        description: "Your settings have been updated successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/alert-settings", storeId] });
      setHasUnsavedChanges(false);
    },
    onError: (error) => {
      console.error("Save failed:", error);
      toast({
        title: "Save Failed",
        description: "Failed to save settings. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleScanFrequencyChange = (frequency: string) => {
    setScanFrequency(frequency);
    setHasUnsavedChanges(true);
    setChangedSettings(prev => new Set(prev).add('scanFrequency'));
    
    // Auto-save scan frequency changes immediately since they affect scheduling
    if (storeId) {
      const newSettings = {
        scanFrequency: parseInt(frequency),
      };
      saveSettingsMutation.mutate(newSettings);
    }
  };

  const handleSaveSettings = () => {
    if (!storeId) return;

    // Only send settings that have actually changed
    const newSettings: any = {};
    
    if (changedSettings.has('emailEnabled')) newSettings.emailEnabled = emailEnabled;
    if (changedSettings.has('slackEnabled')) newSettings.slackEnabled = slackEnabled;
    if (changedSettings.has('emailAddress')) newSettings.emailAddress = emailAddress;
    if (changedSettings.has('slackBotToken')) newSettings.slackBotToken = slackBotToken;
    if (changedSettings.has('slackChannelId')) newSettings.slackChannelId = slackChannelId;
    if (changedSettings.has('scanFrequency')) newSettings.scanFrequency = parseInt(scanFrequency);
    if (changedSettings.has('alertFrequency')) newSettings.alertFrequency = alertFrequency;

    // Only save if there are actual changes
    if (Object.keys(newSettings).length > 0) {
      saveSettingsMutation.mutate(newSettings);
      // Clear the changed settings after saving
      setChangedSettings(new Set());
    }
  };

  // Show loading state while getting session
  if (sessionLoading) {
    return (
      <div className="flex h-screen bg-shopify-background">
        <Sidebar />
        <div className="flex-1 overflow-auto">
          <div className="p-6">
            <div className="flex items-center justify-center h-64">
              <div className="text-lg">Loading store information...</div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Show error state if no store found
  if (!storeId || !isAuthenticated) {
    return (
      <div className="flex h-screen bg-shopify-background">
        <Sidebar />
        <div className="flex-1 overflow-auto">
          <div className="p-6">
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <div className="text-lg font-semibold mb-2">Store Not Found</div>
                <div className="text-gray-600 mb-4">Unable to find your store information.</div>
                <button 
                  onClick={() => window.location.reload()}
                  className="bg-shopify-green text-white px-4 py-2 rounded-lg hover:bg-shopify-green-dark"
                >
                  Try Again
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-shopify-background">
      <Sidebar />
      <div className="flex-1 overflow-auto">
        <div className="p-6">
          {/* Header */}
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-shopify-text">Settings</h1>
            <p className="text-gray-500">
              {session?.shop && `Configure settings for ${session.shop}`}
            </p>
          </div>

          <div className="space-y-6">
            {/* Notification Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Bell className="w-5 h-5" />
                  <span>Notification Settings</span>
                </CardTitle>
                <CardDescription>Configure how you want to be notified about issues</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Email Notifications */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-base font-medium">Email Notifications</Label>
                      <p className="text-sm text-gray-500">Receive alerts via email</p>
                    </div>
                    <Switch 
                      checked={emailEnabled} 
                      onCheckedChange={handleEmailEnabledChange}
                    />
                  </div>
                  
                                    {emailEnabled && (
                    <div className="space-y-2">
                      <Label htmlFor="email">Email Address</Label>
                      <Input 
                        id="email" 
                        type="email" 
                        placeholder="your-email@example.com"
                        value={emailAddress}
                        onChange={(e) => handleEmailAddressChange(e.target.value)}
                      />
                      <div className="flex space-x-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          disabled={saveSettingsMutation.isPending}
                          onClick={() => {
                            if (emailAddress) {
                              handleSaveSettings();
                            } else {
                              toast({
                                title: "Email Required",
                                description: "Please enter an email address first.",
                                variant: "destructive",
                              });
                            }
                          }}
                        >
                          {saveSettingsMutation.isPending ? "Saving..." : "Save Email"}
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          disabled={isTestingEmail || !emailAddress}
                          onClick={async () => {
                            if (emailAddress) {
                              setIsTestingEmail(true);
                              try {
                                const response = await fetch(`/api/test-email/${storeId}`, {
                                  method: 'POST',
                                  headers: { 'Content-Type': 'application/json' },
                                  body: JSON.stringify({ email: emailAddress })
                                });
                                
                                const data = await response.json();
                                
                                if (data.success) {
                                  toast({
                                    title: "Test Email Sent",
                                    description: "Test email sent immediately! Check your inbox.",
                                  });
                                } else {
                                  toast({
                                    title: "Test Failed",
                                    description: data.message || "Failed to send test email.",
                                    variant: "destructive",
                                  });
                                }
                              } catch (err) {
                                toast({
                                  title: "Test Failed",
                                  description: "Failed to send test email. Please check your settings.",
                                  variant: "destructive",
                                });
                              } finally {
                                setIsTestingEmail(false);
                              }
                            } else {
                              toast({
                                title: "Email Required",
                                description: "Please enter an email address first.",
                                variant: "destructive",
                              });
                            }
                          }}
                        >
                          {isTestingEmail ? "Sending..." : "Test Email"}
                        </Button>
                      </div>
                    </div>
                  )}
                </div>

                <Separator />

                {/* Slack Notifications */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-base font-medium">Slack Notifications</Label>
                      <p className="text-sm text-gray-500">Receive alerts in Slack</p>
                    </div>
                    <Switch 
                      checked={slackEnabled} 
                      onCheckedChange={handleSlackEnabledChange}
                    />
                  </div>
                  
                                    {slackEnabled && (
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="slack-bot-token">Slack Bot Token</Label>
                        <Input 
                          id="slack-bot-token" 
                          type="password" 
                          placeholder="xoxb-your-bot-token-here"
                          value={slackBotToken}
                          onChange={(e) => handleSlackBotTokenChange(e.target.value)}
                        />
                        <p className="text-xs text-gray-500">
                          Get this from your Slack app's OAuth & Permissions page
                        </p>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="slack-channel-id">Slack Channel ID</Label>
                        <Input 
                          id="slack-channel-id" 
                          type="text" 
                          placeholder="C0123456789"
                          value={slackChannelId}
                          onChange={(e) => handleSlackChannelIdChange(e.target.value)}
                        />
                        <p className="text-xs text-gray-500">
                          Right-click on the channel in Slack and select "Copy link" to get the channel ID
                        </p>
                      </div>
                      
                      <div className="flex space-x-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          disabled={saveSettingsMutation.isPending}
                          onClick={() => {
                            if (slackBotToken && slackChannelId) {
                              handleSaveSettings();
                            } else {
                              toast({
                                title: "Credentials Required",
                                description: "Please enter both bot token and channel ID first.",
                                variant: "destructive",
                              });
                            }
                          }}
                        >
                          {saveSettingsMutation.isPending ? "Saving..." : "Save Slack"}
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          disabled={isTestingSlack || !slackBotToken || !slackChannelId}
                          onClick={async () => {
                            if (slackBotToken && slackChannelId) {
                              setIsTestingSlack(true);
                              try {
                                const response = await fetch(`/api/test-slack/${storeId}`, {
                                  method: 'POST',
                                  headers: { 'Content-Type': 'application/json' },
                                  body: JSON.stringify({ 
                                    botToken: slackBotToken,
                                    channelId: slackChannelId 
                                  })
                                });
                                
                                const data = await response.json();
                                
                                if (data.success) {
                                  toast({
                                    title: "Test Slack Message Sent",
                                    description: "Test Slack message sent immediately! Check your channel.",
                                  });
                                } else {
                                  toast({
                                    title: "Test Failed",
                                    description: data.message || "Failed to send test Slack message.",
                                    variant: "destructive",
                                  });
                                }
                              } catch (err) {
                                toast({
                                  title: "Test Failed",
                                  description: "Failed to send test Slack message. Please check your credentials.",
                                  variant: "destructive",
                                });
                              } finally {
                                setIsTestingSlack(false);
                              }
                            } else {
                              toast({
                                title: "Credentials Required",
                                description: "Please enter both bot token and channel ID first.",
                                variant: "destructive",
                              });
                            }
                          }}
                        >
                          {isTestingSlack ? "Sending..." : "Test Slack"}
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Alert Frequency */}
                  <div className="space-y-2">
                    <Label htmlFor="alert-frequency">Alert Frequency</Label>
                    <Select 
                      value={alertFrequency} 
                      onValueChange={(value) => {
                        setAlertFrequency(value);
                        setHasUnsavedChanges(true);
                        setChangedSettings(prev => new Set(prev).add('alertFrequency'));
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="immediate">Immediate</SelectItem>
                        <SelectItem value="5min">5 minutes</SelectItem>
                        <SelectItem value="15min">15 minutes</SelectItem>
                        <SelectItem value="30min">30 minutes</SelectItem>
                        <SelectItem value="1hour">1 hour</SelectItem>
                        <SelectItem value="daily">Daily digest</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-sm text-gray-500">
                      How long should Bug Patrol wait before sending alerts? (All alerts will be delayed by this time)
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Scan Settings */}
            <Card className={`transition-all duration-500 ${highlightScanFrequency ? 'ring-2 ring-blue-500 ring-opacity-50 bg-blue-50' : ''}`}>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Zap className="w-5 h-5" />
                  <span>Scan Settings</span>
                  {highlightScanFrequency && (
                    <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full animate-pulse">
                      Highlighted
                    </span>
                  )}
                </CardTitle>
                <CardDescription>Configure automatic scanning frequency</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="scan-frequency">Scan Frequency</Label>
                  <Select value={scanFrequency} onValueChange={handleScanFrequencyChange}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="2">Every 2 minutes (Testing)</SelectItem>
                      <SelectItem value="15">Every 15 minutes</SelectItem>
                      <SelectItem value="30">Every 30 minutes</SelectItem>
                      <SelectItem value="60">Every hour</SelectItem>
                      <SelectItem value="240">Every 4 hours</SelectItem>
                      <SelectItem value="1440">Daily</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-sm text-gray-500">
                    How often should Bug Patrol automatically scan your store?
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Subscription Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <CreditCard className="w-5 h-5" />
                  <span>Subscription</span>
                </CardTitle>
                <CardDescription>Your current plan and billing information</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div>
                      <h4 className="font-medium">Current Plan</h4>
                      <p className="text-sm text-gray-500">
                        {session?.plan === 'enterprise' ? 'Enterprise' : 
                         session?.plan === 'pro' ? 'Pro' : 'Basic'}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">
                        ${session?.plan === 'enterprise' ? 199 : 
                          session?.plan === 'pro' ? 89 : 29}/month
                      </p>
                      <p className="text-sm text-gray-500">Next billing: {session?.nextBillingDate || 'Unknown'}</p>
                    </div>
                  </div>
                  
                  <Button variant="outline" className="w-full">
                    Manage Subscription
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Note: Individual save buttons are now available in each section */}
          </div>
        </div>
      </div>
    </div>
  );
}