
import { useState } from 'react';
import NavBar from '@/components/NavBar';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Bell, Mail, Lock, Globe, Moon, Info } from 'lucide-react';

const Settings = () => {
  const { toast } = useToast();
  const [settings, setSettings] = useState({
    email: 'user@example.com',
    emailNotifications: true,
    newMatch: true,
    newMessage: true,
    skillInterest: true,
    darkMode: false,
    timezone: 'America/New_York',
    matchRadius: 50,
    profilePrivacy: 'public'
  });

  const handleSwitchChange = (setting: keyof typeof settings, checked: boolean) => {
    setSettings({
      ...settings,
      [setting]: checked
    });
  };

  const handleInputChange = (setting: keyof typeof settings, value: string | number) => {
    setSettings({
      ...settings,
      [setting]: value
    });
  };

  const handleSliderChange = (value: number[]) => {
    setSettings({
      ...settings,
      matchRadius: value[0]
    });
  };

  const handleSave = () => {
    toast({
      title: "Settings saved",
      description: "Your preferences have been updated.",
    });
  };
  
  return (
    <div className="min-h-screen flex flex-col bg-neutral">
      <NavBar />
      
      <main className="flex-grow py-6 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-swamp">Settings</h1>
            <p className="text-gray-500 mt-1">Manage your account preferences</p>
          </div>
          
          <Tabs defaultValue="notifications" className="space-y-6">
            <TabsList className="grid grid-cols-3 mb-4">
              <TabsTrigger value="notifications">Notifications</TabsTrigger>
              <TabsTrigger value="account">Account</TabsTrigger>
              <TabsTrigger value="preferences">Preferences</TabsTrigger>
            </TabsList>
            
            {/* Notification Settings */}
            <TabsContent value="notifications">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Bell className="mr-2 h-5 w-5 text-primary" />
                    Notification Settings
                  </CardTitle>
                  <CardDescription>
                    Configure how you want to receive notifications
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="emailNotifications" className="text-base">Email Notifications</Label>
                      <p className="text-sm text-gray-500">Receive notifications via email</p>
                    </div>
                    <Switch
                      id="emailNotifications"
                      checked={settings.emailNotifications}
                      onCheckedChange={(checked) => handleSwitchChange('emailNotifications', checked)}
                    />
                  </div>
                  
                  <div className="space-y-4 pl-6 border-l-2 border-neutral">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="newMatch" className="text-sm">New match found</Label>
                      <Switch
                        id="newMatch"
                        checked={settings.newMatch}
                        onCheckedChange={(checked) => handleSwitchChange('newMatch', checked)}
                        disabled={!settings.emailNotifications}
                      />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <Label htmlFor="newMessage" className="text-sm">New messages</Label>
                      <Switch
                        id="newMessage"
                        checked={settings.newMessage}
                        onCheckedChange={(checked) => handleSwitchChange('newMessage', checked)}
                        disabled={!settings.emailNotifications}
                      />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <Label htmlFor="skillInterest" className="text-sm">Skill interest updates</Label>
                      <Switch
                        id="skillInterest"
                        checked={settings.skillInterest}
                        onCheckedChange={(checked) => handleSwitchChange('skillInterest', checked)}
                        disabled={!settings.emailNotifications}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            {/* Account Settings */}
            <TabsContent value="account">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <User className="mr-2 h-5 w-5 text-primary" />
                    Account Settings
                  </CardTitle>
                  <CardDescription>
                    Manage your account details and security
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address</Label>
                    <Input 
                      id="email"
                      type="email"
                      value={settings.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                    />
                  </div>
                  
                  <div className="pt-4">
                    <Button variant="outline" className="mr-2">
                      <Lock className="mr-2 h-4 w-4" />
                      Change Password
                    </Button>
                    <Button variant="outline" className="border-red-500 text-red-500 hover:bg-red-50">
                      Deactivate Account
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            {/* Preferences */}
            <TabsContent value="preferences">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Settings className="mr-2 h-5 w-5 text-primary" />
                    Preferences
                  </CardTitle>
                  <CardDescription>
                    Customize your experience on SkillSwamp
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="darkMode" className="text-base">Dark Mode</Label>
                      <p className="text-sm text-gray-500">Use dark theme</p>
                    </div>
                    <Switch
                      id="darkMode"
                      checked={settings.darkMode}
                      onCheckedChange={(checked) => handleSwitchChange('darkMode', checked)}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="timezone" className="flex items-center">
                      <Globe className="mr-2 h-4 w-4" /> Time Zone
                    </Label>
                    <select 
                      id="timezone"
                      className="w-full p-2 border rounded-md" 
                      value={settings.timezone}
                      onChange={(e) => handleInputChange('timezone', e.target.value)}
                    >
                      <option value="America/New_York">Eastern Time (ET)</option>
                      <option value="America/Chicago">Central Time (CT)</option>
                      <option value="America/Denver">Mountain Time (MT)</option>
                      <option value="America/Los_Angeles">Pacific Time (PT)</option>
                      <option value="Europe/London">London (GMT)</option>
                    </select>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="matchRadius" className="text-base flex items-center">
                        <Info className="mr-2 h-4 w-4" /> Match Radius
                      </Label>
                      <span className="text-sm font-medium">{settings.matchRadius} km</span>
                    </div>
                    <Slider
                      id="matchRadius"
                      defaultValue={[settings.matchRadius]}
                      max={100}
                      step={1}
                      onValueChange={handleSliderChange}
                      className="py-4"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="profilePrivacy" className="text-base">Profile Privacy</Label>
                    <select 
                      id="profilePrivacy"
                      className="w-full p-2 border rounded-md" 
                      value={settings.profilePrivacy}
                      onChange={(e) => handleInputChange('profilePrivacy', e.target.value)}
                    >
                      <option value="public">Public - Anyone can view your profile</option>
                      <option value="matches">Matches Only - Only your matches can view your profile</option>
                      <option value="private">Private - Your profile is only visible to you</option>
                    </select>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
          
          <div className="mt-6 flex justify-end">
            <Button onClick={handleSave} className="bg-primary hover:bg-primary-dark">
              Save Changes
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Settings;
