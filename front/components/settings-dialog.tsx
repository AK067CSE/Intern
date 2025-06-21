"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { Clock, Mail, Database, Bell } from "lucide-react"

interface SettingsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export default function SettingsDialog({ open, onOpenChange }: SettingsDialogProps) {
  const [cronSettings, setCronSettings] = useState({
    enabled: true,
    time: "02:00",
    frequency: "daily",
    timezone: "UTC",
  })

  const [emailSettings, setEmailSettings] = useState({
    enabled: true,
    inactivityDays: 7,
    maxReminders: 3,
    template: "default",
  })

  const [lastSync, setLastSync] = useState("2024-01-15T02:00:00Z")

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>System Settings</DialogTitle>
          <DialogDescription>
            Configure data synchronization, email notifications, and system preferences.
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="sync" className="mt-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="sync">Data Sync</TabsTrigger>
            <TabsTrigger value="email">Email Settings</TabsTrigger>
            <TabsTrigger value="system">System</TabsTrigger>
          </TabsList>

          <TabsContent value="sync" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Database className="h-5 w-5" />
                  <span>Codeforces Data Synchronization</span>
                </CardTitle>
                <CardDescription>Configure automatic data fetching from Codeforces API</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-base font-medium">Enable Automatic Sync</Label>
                    <p className="text-sm text-muted-foreground">Automatically fetch updated data from Codeforces</p>
                  </div>
                  <Switch
                    checked={cronSettings.enabled}
                    onCheckedChange={(checked) => setCronSettings({ ...cronSettings, enabled: checked })}
                  />
                </div>

                <Separator />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="sync-time">Sync Time</Label>
                    <Input
                      id="sync-time"
                      type="time"
                      value={cronSettings.time}
                      onChange={(e) => setCronSettings({ ...cronSettings, time: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="sync-frequency">Frequency</Label>
                    <Select
                      value={cronSettings.frequency}
                      onValueChange={(value) => setCronSettings({ ...cronSettings, frequency: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="daily">Daily</SelectItem>
                        <SelectItem value="weekly">Weekly</SelectItem>
                        <SelectItem value="monthly">Monthly</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="timezone">Timezone</Label>
                  <Select
                    value={cronSettings.timezone}
                    onValueChange={(value) => setCronSettings({ ...cronSettings, timezone: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="UTC">UTC</SelectItem>
                      <SelectItem value="America/New_York">Eastern Time</SelectItem>
                      <SelectItem value="America/Chicago">Central Time</SelectItem>
                      <SelectItem value="America/Denver">Mountain Time</SelectItem>
                      <SelectItem value="America/Los_Angeles">Pacific Time</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Separator />

                <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                  <div className="flex items-center space-x-3">
                    <Clock className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium">Last Sync</p>
                      <p className="text-sm text-muted-foreground">{new Date(lastSync).toLocaleString()}</p>
                    </div>
                  </div>
                  <Button variant="outline">Sync Now</Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="email" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Mail className="h-5 w-5" />
                  <span>Email Notifications</span>
                </CardTitle>
                <CardDescription>Configure automatic reminder emails for inactive students</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-base font-medium">Enable Email Reminders</Label>
                    <p className="text-sm text-muted-foreground">Send automatic emails to inactive students</p>
                  </div>
                  <Switch
                    checked={emailSettings.enabled}
                    onCheckedChange={(checked) => setEmailSettings({ ...emailSettings, enabled: checked })}
                  />
                </div>

                <Separator />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="inactivity-days">Inactivity Threshold (days)</Label>
                    <Input
                      id="inactivity-days"
                      type="number"
                      min="1"
                      max="30"
                      value={emailSettings.inactivityDays}
                      onChange={(e) =>
                        setEmailSettings({
                          ...emailSettings,
                          inactivityDays: Number.parseInt(e.target.value),
                        })
                      }
                    />
                    <p className="text-xs text-muted-foreground">Send reminder after this many days of inactivity</p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="max-reminders">Maximum Reminders</Label>
                    <Input
                      id="max-reminders"
                      type="number"
                      min="1"
                      max="10"
                      value={emailSettings.maxReminders}
                      onChange={(e) =>
                        setEmailSettings({
                          ...emailSettings,
                          maxReminders: Number.parseInt(e.target.value),
                        })
                      }
                    />
                    <p className="text-xs text-muted-foreground">Stop sending after this many reminders</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email-template">Email Template</Label>
                  <Select
                    value={emailSettings.template}
                    onValueChange={(value) => setEmailSettings({ ...emailSettings, template: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="default">Default Template</SelectItem>
                      <SelectItem value="friendly">Friendly Reminder</SelectItem>
                      <SelectItem value="motivational">Motivational</SelectItem>
                      <SelectItem value="custom">Custom Template</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Separator />

                <div className="p-4 bg-muted rounded-lg">
                  <h4 className="font-medium mb-2">Email Preview</h4>
                  <div className="text-sm text-muted-foreground space-y-2">
                    <p>
                      <strong>Subject:</strong> Time to get back to coding! 🚀
                    </p>
                    <p>
                      <strong>Body:</strong>
                    </p>
                    <div className="bg-background p-3 rounded border text-sm">
                      Hi [Student Name],
                      <br />
                      <br />
                      We noticed you haven't submitted any solutions on Codeforces in the last{" "}
                      {emailSettings.inactivityDays} days. Keep up the momentum and continue your coding journey!
                      <br />
                      <br />
                      Happy coding!
                      <br />
                      Your Progress Team
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="system" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Bell className="h-5 w-5" />
                  <span>System Preferences</span>
                </CardTitle>
                <CardDescription>General system settings and preferences</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-base font-medium">Real-time Updates</Label>
                      <p className="text-sm text-muted-foreground">Enable real-time data updates in the UI</p>
                    </div>
                    <Switch defaultChecked />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-base font-medium">Export Notifications</Label>
                      <p className="text-sm text-muted-foreground">Show notifications when data export is complete</p>
                    </div>
                    <Switch defaultChecked />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-base font-medium">Auto-save Settings</Label>
                      <p className="text-sm text-muted-foreground">Automatically save configuration changes</p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                </div>

                <Separator />

                <div className="space-y-4">
                  <h4 className="font-medium">Data Retention</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Contest History (months)</Label>
                      <Input type="number" defaultValue="12" min="1" max="60" />
                    </div>
                    <div className="space-y-2">
                      <Label>Problem Data (months)</Label>
                      <Input type="number" defaultValue="24" min="1" max="60" />
                    </div>
                  </div>
                </div>

                <Separator />

                <div className="space-y-4">
                  <h4 className="font-medium">System Status</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <span className="text-sm">Database Status</span>
                      <Badge variant="default" className="bg-green-500">
                        Connected
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <span className="text-sm">Codeforces API</span>
                      <Badge variant="default" className="bg-green-500">
                        Active
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <span className="text-sm">Email Service</span>
                      <Badge variant="default" className="bg-green-500">
                        Operational
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <span className="text-sm">Cron Jobs</span>
                      <Badge variant="default" className="bg-green-500">
                        Running
                      </Badge>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="flex justify-end space-x-2 pt-6 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button>Save Changes</Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
