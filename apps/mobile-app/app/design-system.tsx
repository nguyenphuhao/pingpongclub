import * as React from 'react';
import { View, ScrollView } from 'react-native';
import { Stack } from 'expo-router';
import { Text } from '@/components/ui/text';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ColorPalette } from '@/components/ColorPalette';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Toggle, ToggleIcon } from '@/components/ui/toggle';
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ToggleGroup, ToggleGroupIcon, ToggleGroupItem } from '@/components/ui/toggle-group';
import { AspectRatio } from '@/components/ui/aspect-ratio';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuRadioGroup, DropdownMenuRadioItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { AlertCircle, Bell, User, Bold, Italic, ChevronsUpDown, AlignLeft, AlignCenter, AlignRight, Image as ImageIcon, MoreVertical, Cloud, CreditCard, Settings, LogOut, Users, Mail, MessageSquare, PlusCircle, UserPlus, Github } from 'lucide-react-native';

export default function DesignSystemScreen() {
  const [switchValue, setSwitchValue] = React.useState(false);
  const [checkboxValue, setCheckboxValue] = React.useState(false);
  const [radioValue, setRadioValue] = React.useState('option1');
  const [progress, setProgress] = React.useState(65);
  const [tabValue, setTabValue] = React.useState('tab1');
  const [togglePressed, setTogglePressed] = React.useState(false);
  const [toggleBoldPressed, setToggleBoldPressed] = React.useState(false);
  const [toggleItalicPressed, setToggleItalicPressed] = React.useState(false);
  const [selectedValue, setSelectedValue] = React.useState<string>();
  const [collapsibleOpen, setCollapsibleOpen] = React.useState(false);
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [alignmentValue, setAlignmentValue] = React.useState('left');
  const [alertDialogOpen, setAlertDialogOpen] = React.useState(false);
  const [showBookmarksBar, setShowBookmarksBar] = React.useState(true);
  const [showStatusBar, setShowStatusBar] = React.useState(false);
  const [position, setPosition] = React.useState('bottom');

  return (
    <>
      <Stack.Screen 
        options={{
          title: 'Design System',
          headerShown: true,
        }} 
      />
      <ScrollView className="flex-1 bg-background">
        <View className="gap-6 p-6">
          {/* Typography */}
          <Card>
            <CardHeader>
              <CardTitle>Typography</CardTitle>
              <CardDescription>SF Pro Display font family</CardDescription>
            </CardHeader>
            <CardContent className="gap-2">
              <Text className="text-2xl font-bold">Heading 2XL (22px)</Text>
              <Text className="text-xl font-semibold">Heading XL (20px)</Text>
              <Text className="text-lg font-medium">Heading LG (18px)</Text>
              <Text className="text-md">Body MD (16px)</Text>
              <Text className="text-base">Body Base (14px)</Text>
              <Text className="text-sm text-muted-foreground">Body SM (12px)</Text>
              <Text className="text-xs text-muted-foreground">Body XS (10px)</Text>
              <Text className="text-2xs text-muted-foreground">Body 2XS (8px)</Text>
            </CardContent>
          </Card>

          {/* Color Palette */}
          <ColorPalette />

          {/* Buttons */}
          <Card>
            <CardHeader>
              <CardTitle>Buttons</CardTitle>
              <CardDescription>Different button variants and sizes</CardDescription>
            </CardHeader>
            <CardContent className="gap-4">
              <View className="gap-2">
                <Text className="text-sm font-medium">Variants</Text>
                <View className="gap-2">
                  <Button variant="default">
                    <Text>Primary Button</Text>
                  </Button>
                  <Button variant="secondary">
                    <Text>Secondary Button</Text>
                  </Button>
                  <Button variant="outline">
                    <Text>Outline Button</Text>
                  </Button>
                  <Button variant="ghost">
                    <Text>Ghost Button</Text>
                  </Button>
                  <Button variant="destructive">
                    <Text>Destructive Button</Text>
                  </Button>
                </View>
              </View>

              <Separator />

              <View className="gap-2">
                <Text className="text-sm font-medium">Sizes</Text>
                <View className="gap-2">
                  <Button size="lg">
                    <Text>Large Button</Text>
                  </Button>
                  <Button size="default">
                    <Text>Default Button</Text>
                  </Button>
                  <Button size="sm">
                    <Text>Small Button</Text>
                  </Button>
                </View>
              </View>
            </CardContent>
          </Card>

          {/* Badges */}
          <Card>
            <CardHeader>
              <CardTitle>Badges</CardTitle>
              <CardDescription>Status and label indicators</CardDescription>
            </CardHeader>
            <CardContent>
              <View className="flex-row flex-wrap gap-2">
                <Badge variant="default">
                  <Text>Default</Text>
                </Badge>
                <Badge variant="secondary">
                  <Text>Secondary</Text>
                </Badge>
                <Badge variant="destructive">
                  <Text>Destructive</Text>
                </Badge>
                <Badge variant="outline">
                  <Text>Outline</Text>
                </Badge>
              </View>
            </CardContent>
          </Card>

          {/* Form Elements */}
          <Card>
            <CardHeader>
              <CardTitle>Form Elements</CardTitle>
              <CardDescription>Inputs, switches, checkboxes, and radio buttons</CardDescription>
            </CardHeader>
            <CardContent className="gap-4">
              {/* Input */}
              <View className="gap-2">
                <Label nativeID="email">Email</Label>
                <Input
                  placeholder="Enter your email"
                  aria-labelledby="email"
                  keyboardType="email-address"
                />
              </View>

              {/* Switch */}
              <View className="flex-row items-center justify-between">
                <Label nativeID="notifications">Enable notifications</Label>
                <Switch
                  checked={switchValue}
                  onCheckedChange={setSwitchValue}
                  aria-labelledby="notifications"
                />
              </View>

              {/* Checkbox */}
              <View className="flex-row items-center gap-2">
                <Checkbox
                  checked={checkboxValue}
                  onCheckedChange={setCheckboxValue}
                  aria-labelledby="terms"
                />
                <Label nativeID="terms">Accept terms and conditions</Label>
              </View>

              {/* Radio Group */}
              <View className="gap-2">
                <Label>Select an option</Label>
                <RadioGroup value={radioValue} onValueChange={setRadioValue}>
                  <View className="flex-row items-center gap-2">
                    <RadioGroupItem value="option1" aria-labelledby="option1-label" />
                    <Label nativeID="option1-label">Option 1</Label>
                  </View>
                  <View className="flex-row items-center gap-2">
                    <RadioGroupItem value="option2" aria-labelledby="option2-label" />
                    <Label nativeID="option2-label">Option 2</Label>
                  </View>
                  <View className="flex-row items-center gap-2">
                    <RadioGroupItem value="option3" aria-labelledby="option3-label" />
                    <Label nativeID="option3-label">Option 3</Label>
                  </View>
                </RadioGroup>
              </View>

              {/* Progress */}
              <View className="gap-2">
                <Label>Progress: {progress}%</Label>
                <Progress value={progress} className="web:w-full" />
              </View>

              <Separator />

              {/* Textarea */}
              <View className="gap-2">
                <Label nativeID="message">Message</Label>
                <Textarea
                  placeholder="Type your message here..."
                  aria-labelledby="message"
                />
              </View>
            </CardContent>
          </Card>

          {/* Accordion */}
          <Card>
            <CardHeader>
              <CardTitle>Accordion</CardTitle>
              <CardDescription>Collapsible content sections</CardDescription>
            </CardHeader>
            <CardContent>
              <Accordion type="multiple" collapsible className="gap-2">
                <AccordionItem value="item-1">
                  <AccordionTrigger>
                    <Text>Is it accessible?</Text>
                  </AccordionTrigger>
                  <AccordionContent>
                    <Text>Yes. It adheres to the WAI-ARIA design pattern.</Text>
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="item-2">
                  <AccordionTrigger>
                    <Text>Is it styled?</Text>
                  </AccordionTrigger>
                  <AccordionContent>
                    <Text>Yes. It comes with default styles that matches the other components aesthetic.</Text>
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="item-3">
                  <AccordionTrigger>
                    <Text>Is it animated?</Text>
                  </AccordionTrigger>
                  <AccordionContent>
                    <Text>Yes. It's animated by default using React Native Reanimated.</Text>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </CardContent>
          </Card>

          {/* Alerts */}
          <Card>
            <CardHeader>
              <CardTitle>Alerts</CardTitle>
              <CardDescription>Contextual feedback messages</CardDescription>
            </CardHeader>
            <CardContent className="gap-4">
              <Alert icon={AlertCircle} variant="default">
                <AlertTitle>Heads up!</AlertTitle>
                <AlertDescription>
                  You can add components to your app using the cli.
                </AlertDescription>
              </Alert>

              <Alert icon={Bell} variant="destructive">
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>
                  Your session has expired. Please log in again.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>

          {/* Avatar */}
          <Card>
            <CardHeader>
              <CardTitle>Avatar</CardTitle>
              <CardDescription>User profile pictures and fallbacks</CardDescription>
            </CardHeader>
            <CardContent>
              <View className="flex-row gap-4">
                <Avatar>
                  <AvatarImage source={{ uri: 'https://github.com/shadcn.png' }} />
                  <AvatarFallback>
                    <Text>CN</Text>
                  </AvatarFallback>
                </Avatar>
                <Avatar className="size-12">
                  <AvatarFallback>
                    <Text>JD</Text>
                  </AvatarFallback>
                </Avatar>
                <Avatar className="size-16">
                  <AvatarFallback>
                    <User className="text-muted-foreground" size={24} />
                  </AvatarFallback>
                </Avatar>
              </View>
            </CardContent>
          </Card>

          {/* Skeleton */}
          <Card>
            <CardHeader>
              <CardTitle>Skeleton</CardTitle>
              <CardDescription>Loading placeholders</CardDescription>
            </CardHeader>
            <CardContent className="gap-3">
              <View className="flex-row items-center gap-4">
                <Skeleton className="size-12 rounded-full" />
                <View className="flex-1 gap-2">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                </View>
              </View>
              <Skeleton className="h-32 w-full" />
            </CardContent>
          </Card>

          {/* Tabs */}
          <Card>
            <CardHeader>
              <CardTitle>Tabs</CardTitle>
              <CardDescription>Organize content in tabbed sections</CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs value={tabValue} onValueChange={setTabValue}>
                <TabsList>
                  <TabsTrigger value="tab1">
                    <Text>Account</Text>
                  </TabsTrigger>
                  <TabsTrigger value="tab2">
                    <Text>Password</Text>
                  </TabsTrigger>
                  <TabsTrigger value="tab3">
                    <Text>Settings</Text>
                  </TabsTrigger>
                </TabsList>
                <TabsContent value="tab1" className="pt-4">
                  <Text>Make changes to your account here.</Text>
                </TabsContent>
                <TabsContent value="tab2" className="pt-4">
                  <Text>Change your password here.</Text>
                </TabsContent>
                <TabsContent value="tab3" className="pt-4">
                  <Text>Update your settings here.</Text>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          {/* Toggle */}
          <Card>
            <CardHeader>
              <CardTitle>Toggle</CardTitle>
              <CardDescription>Two-state button controls</CardDescription>
            </CardHeader>
            <CardContent className="gap-4">
              <View className="gap-2">
                <Text className="text-sm font-medium">Default</Text>
                <View className="flex-row gap-2">
                  <Toggle pressed={togglePressed} onPressedChange={setTogglePressed}>
                    <Text>Toggle</Text>
                  </Toggle>
                  <Toggle variant="outline" pressed={toggleBoldPressed} onPressedChange={setToggleBoldPressed}>
                    <ToggleIcon as={Bold} />
                  </Toggle>
                  <Toggle variant="outline" pressed={toggleItalicPressed} onPressedChange={setToggleItalicPressed}>
                    <ToggleIcon as={Italic} />
                  </Toggle>
                </View>
              </View>
            </CardContent>
          </Card>

          {/* Select */}
          <Card>
            <CardHeader>
              <CardTitle>Select</CardTitle>
              <CardDescription>Dropdown selection menus</CardDescription>
            </CardHeader>
            <CardContent className="gap-4">
              <View className="gap-2">
                <Label nativeID="framework">Framework</Label>
                <Select value={selectedValue} onValueChange={setSelectedValue}>
                  <SelectTrigger aria-labelledby="framework">
                    <SelectValue placeholder="Select a framework" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectLabel>Frameworks</SelectLabel>
                      <SelectItem label="React Native" value="react-native">
                        React Native
                      </SelectItem>
                      <SelectItem label="Expo" value="expo">
                        Expo
                      </SelectItem>
                      <SelectItem label="Next.js" value="nextjs">
                        Next.js
                      </SelectItem>
                      <SelectItem label="Vue" value="vue">
                        Vue
                      </SelectItem>
                      <SelectItem label="Svelte" value="svelte">
                        Svelte
                      </SelectItem>
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </View>
            </CardContent>
          </Card>

          {/* Collapsible */}
          <Card>
            <CardHeader>
              <CardTitle>Collapsible</CardTitle>
              <CardDescription>Expandable content section</CardDescription>
            </CardHeader>
            <CardContent>
              <Collapsible open={collapsibleOpen} onOpenChange={setCollapsibleOpen}>
                <CollapsibleTrigger asChild>
                  <Button variant="outline" className="w-full">
                    <View className="flex-row items-center justify-between flex-1">
                      <Text>Can I use this in my project?</Text>
                      <ChevronsUpDown className="text-muted-foreground" size={16} />
                    </View>
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent className="pt-4">
                  <Text className="text-sm text-muted-foreground">
                    Yes! This design system is free to use in your projects. All components are built with React Native and can be customized to fit your needs.
                  </Text>
                </CollapsibleContent>
              </Collapsible>
            </CardContent>
          </Card>

          {/* Dialog */}
          <Card>
            <CardHeader>
              <CardTitle>Dialog</CardTitle>
              <CardDescription>Modal dialogs and overlays</CardDescription>
            </CardHeader>
            <CardContent>
              <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Text>Open Dialog</Text>
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>
                      <Text>Edit Profile</Text>
                    </DialogTitle>
                    <DialogDescription>
                      <Text>Make changes to your profile here. Click save when you're done.</Text>
                    </DialogDescription>
                  </DialogHeader>
                  <View className="gap-4 py-4">
                    <View className="gap-2">
                      <Label nativeID="dialog-name">Name</Label>
                      <Input placeholder="Your name" aria-labelledby="dialog-name" />
                    </View>
                    <View className="gap-2">
                      <Label nativeID="dialog-username">Username</Label>
                      <Input placeholder="@username" aria-labelledby="dialog-username" />
                    </View>
                  </View>
                  <DialogFooter>
                    <DialogClose asChild>
                      <Button>
                        <Text>Save changes</Text>
                      </Button>
                    </DialogClose>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </CardContent>
          </Card>

          {/* Toggle Group */}
          <Card>
            <CardHeader>
              <CardTitle>Toggle Group</CardTitle>
              <CardDescription>Grouped toggle buttons</CardDescription>
            </CardHeader>
            <CardContent className="gap-4">
              <View className="gap-2">
                <Text className="text-sm font-medium">Text Alignment</Text>
                <ToggleGroup type="single" value={alignmentValue} onValueChange={(val) => val && setAlignmentValue(val)} variant="outline">
                  <ToggleGroupItem value="left" aria-label="Left align" isFirst>
                    <ToggleGroupIcon as={AlignLeft} />
                  </ToggleGroupItem>
                  <ToggleGroupItem value="center" aria-label="Center align">
                    <ToggleGroupIcon as={AlignCenter} />
                  </ToggleGroupItem>
                  <ToggleGroupItem value="right" aria-label="Right align" isLast>
                    <ToggleGroupIcon as={AlignRight} />
                  </ToggleGroupItem>
                </ToggleGroup>
              </View>
            </CardContent>
          </Card>

          {/* Aspect Ratio */}
          <Card>
            <CardHeader>
              <CardTitle>Aspect Ratio</CardTitle>
              <CardDescription>Maintain aspect ratio containers</CardDescription>
            </CardHeader>
            <CardContent>
              <AspectRatio ratio={16 / 9} className="bg-muted rounded-lg overflow-hidden">
                <View className="flex-1 items-center justify-center">
                  <ImageIcon className="text-muted-foreground" size={48} />
                  <Text className="text-muted-foreground mt-2">16:9 Aspect Ratio</Text>
                </View>
              </AspectRatio>
            </CardContent>
          </Card>

          {/* Alert Dialog */}
          <Card>
            <CardHeader>
              <CardTitle>Alert Dialog</CardTitle>
              <CardDescription>Confirmation and alert modals</CardDescription>
            </CardHeader>
            <CardContent>
              <AlertDialog open={alertDialogOpen} onOpenChange={setAlertDialogOpen}>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive">
                    <Text>Delete Account</Text>
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>
                      <Text>Are you absolutely sure?</Text>
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                      <Text>
                        This action cannot be undone. This will permanently delete your account and remove your data from our servers.
                      </Text>
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>
                      <Text>Cancel</Text>
                    </AlertDialogCancel>
                    <AlertDialogAction>
                      <Text>Continue</Text>
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </CardContent>
          </Card>

          {/* Dropdown Menu */}
          <Card>
            <CardHeader>
              <CardTitle>Dropdown Menu</CardTitle>
              <CardDescription>Context menus and dropdown actions</CardDescription>
            </CardHeader>
            <CardContent className="gap-4">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline">
                    <View className="flex-row items-center gap-2">
                      <Text>Open Menu</Text>
                      <MoreVertical size={16} className="text-muted-foreground" />
                    </View>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56">
                  <DropdownMenuLabel>
                    <Text>My Account</Text>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem>
                    <User className="text-foreground mr-2" size={16} />
                    <Text>Profile</Text>
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <CreditCard className="text-foreground mr-2" size={16} />
                    <Text>Billing</Text>
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Settings className="text-foreground mr-2" size={16} />
                    <Text>Settings</Text>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuCheckboxItem 
                    checked={showBookmarksBar} 
                    onCheckedChange={setShowBookmarksBar}>
                    <Text>Show Bookmarks Bar</Text>
                  </DropdownMenuCheckboxItem>
                  <DropdownMenuCheckboxItem 
                    checked={showStatusBar} 
                    onCheckedChange={setShowStatusBar}>
                    <Text>Show Status Bar</Text>
                  </DropdownMenuCheckboxItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuLabel>
                    <Text>Position</Text>
                  </DropdownMenuLabel>
                  <DropdownMenuRadioGroup value={position} onValueChange={setPosition}>
                    <DropdownMenuRadioItem value="top">
                      <Text>Top</Text>
                    </DropdownMenuRadioItem>
                    <DropdownMenuRadioItem value="bottom">
                      <Text>Bottom</Text>
                    </DropdownMenuRadioItem>
                    <DropdownMenuRadioItem value="right">
                      <Text>Right</Text>
                    </DropdownMenuRadioItem>
                  </DropdownMenuRadioGroup>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem variant="destructive">
                    <LogOut className="text-destructive mr-2" size={16} />
                    <Text>Log out</Text>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </CardContent>
          </Card>

          {/* Tooltip */}
          <Card>
            <CardHeader>
              <CardTitle>Tooltip</CardTitle>
              <CardDescription>Helpful hover information</CardDescription>
            </CardHeader>
            <CardContent>
              <View className="flex-row gap-4">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="outline" size="default">
                      <Mail size={16} />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <Text>Send Email</Text>
                  </TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="outline" size="default">
                      <Github size={16} />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <Text>View on GitHub</Text>
                  </TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="outline" size="default">
                      <Cloud size={16} />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom">
                    <Text>Cloud Storage</Text>
                  </TooltipContent>
                </Tooltip>
              </View>
            </CardContent>
          </Card>
        </View>
      </ScrollView>
    </>
  );
}

