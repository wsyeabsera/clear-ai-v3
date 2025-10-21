# Admin Dashboard Overview

## Table of Contents
- [Overview](#overview)
- [Dashboard Layout](#dashboard-layout)
- [Navigation Structure](#navigation-structure)
- [Main Dashboard Component](#main-dashboard-component)
- [Admin Layout](#admin-layout)
- [Responsive Design](#responsive-design)

## Overview

The admin dashboard provides comprehensive management capabilities for the AI waste management system, including agent monitoring, environment configuration, visual execution flows, analytics, and data management.

## Dashboard Layout

### 1. Admin Layout Component (`src/app/(admin)/layout.tsx`)

```typescript
'use client';

import React, { useState } from 'react';
import { Sidebar } from '@/components/admin/Sidebar';
import { Header } from '@/components/admin/Header';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from '@/components/ui/breadcrumb';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

interface AdminLayoutProps {
  children: React.ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();
  
  const generateBreadcrumbs = () => {
    const segments = pathname.split('/').filter(Boolean);
    const breadcrumbs = [
      { label: 'Admin', href: '/admin', isLast: segments.length === 1 }
    ];
    
    if (segments.length > 1) {
      const adminSegments = segments.slice(1); // Remove 'admin' from segments
      
      adminSegments.forEach((segment, index) => {
        const href = `/admin/${adminSegments.slice(0, index + 1).join('/')}`;
        const isLast = index === adminSegments.length - 1;
        
        breadcrumbs.push({
          label: segment.charAt(0).toUpperCase() + segment.slice(1).replace(/-/g, ' '),
          href,
          isLast
        });
      });
    }
    
    return breadcrumbs;
  };
  
  const breadcrumbs = generateBreadcrumbs();
  
  return (
    <div className="min-h-screen bg-background">
      {/* Sidebar */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      
      {/* Main Content */}
      <div className={cn(
        "flex-1 transition-all duration-300",
        sidebarOpen ? "lg:ml-64" : "lg:ml-16"
      )}>
        {/* Header */}
        <Header onMenuClick={() => setSidebarOpen(!sidebarOpen)} />
        
        {/* Breadcrumbs */}
        <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="container mx-auto px-4 py-3">
            <Breadcrumb>
              <BreadcrumbList>
                {breadcrumbs.map((breadcrumb, index) => (
                  <React.Fragment key={index}>
                    <BreadcrumbItem>
                      {breadcrumb.isLast ? (
                        <BreadcrumbPage>{breadcrumb.label}</BreadcrumbPage>
                      ) : (
                        <BreadcrumbLink href={breadcrumb.href}>
                          {breadcrumb.label}
                        </BreadcrumbLink>
                      )}
                    </BreadcrumbItem>
                    {!breadcrumb.isLast && <BreadcrumbSeparator />}
                  </React.Fragment>
                ))}
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </div>
        
        {/* Page Content */}
        <main className="container mx-auto px-4 py-6">
          {children}
        </main>
      </div>
    </div>
  );
}
```

## Navigation Structure

### 2. Admin Sidebar Component (`src/components/admin/Sidebar.tsx`)

```typescript
'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { 
  LayoutDashboard,
  Bot,
  Settings,
  BarChart3,
  Database,
  Users,
  Shield,
  Activity,
  Zap,
  Target,
  FileText,
  Building,
  Truck,
  AlertTriangle,
  ChevronRight,
  ChevronDown,
  LogOut
} from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

interface NavItem {
  title: string;
  href: string;
  icon: React.ReactNode;
  badge?: string;
  children?: NavItem[];
}

const navigationItems: NavItem[] = [
  {
    title: 'Dashboard',
    href: '/admin',
    icon: <LayoutDashboard className="h-4 w-4" />
  },
  {
    title: 'Agent Monitoring',
    href: '/admin/agents',
    icon: <Bot className="h-4 w-4" />,
    children: [
      {
        title: 'Planner Agent',
        href: '/admin/agents/planner',
        icon: <Target className="h-4 w-4" />
      },
      {
        title: 'Executor Agent',
        href: '/admin/agents/executor',
        icon: <Zap className="h-4 w-4" />
      },
      {
        title: 'Analyzer Agent',
        href: '/admin/agents/analyzer',
        icon: <Activity className="h-4 w-4" />
      },
      {
        title: 'Summarizer Agent',
        href: '/admin/agents/summarizer',
        icon: <FileText className="h-4 w-4" />
      }
    ]
  },
  {
    title: 'Environment Config',
    href: '/admin/config',
    icon: <Settings className="h-4 w-4" />
  },
  {
    title: 'Visual Execution Flow',
    href: '/admin/execution-flow',
    icon: <Activity className="h-4 w-4" />
  },
  {
    title: 'Analytics',
    href: '/admin/analytics',
    icon: <BarChart3 className="h-4 w-4" />
  },
  {
    title: 'Data Management',
    href: '/admin/data',
    icon: <Database className="h-4 w-4" />,
    children: [
      {
        title: 'Shipments',
        href: '/admin/data/shipments',
        icon: <Truck className="h-4 w-4" />
      },
      {
        title: 'Facilities',
        href: '/admin/data/facilities',
        icon: <Building className="h-4 w-4" />
      },
      {
        title: 'Contaminants',
        href: '/admin/data/contaminants',
        icon: <AlertTriangle className="h-4 w-4" />
      },
      {
        title: 'Inspections',
        href: '/admin/data/inspections',
        icon: <Shield className="h-4 w-4" />
      }
    ]
  },
  {
    title: 'User Management',
    href: '/admin/users',
    icon: <Users className="h-4 w-4" />
  }
];

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const pathname = usePathname();
  const [expandedItems, setExpandedItems] = React.useState<Set<string>>(new Set());
  
  const toggleExpanded = (itemTitle: string) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(itemTitle)) {
      newExpanded.delete(itemTitle);
    } else {
      newExpanded.add(itemTitle);
    }
    setExpandedItems(newExpanded);
  };
  
  const isActive = (href: string) => {
    if (href === '/admin') {
      return pathname === '/admin';
    }
    return pathname.startsWith(href);
  };
  
  const NavItemComponent: React.FC<{ item: NavItem; level?: number }> = ({ 
    item, 
    level = 0 
  }) => {
    const hasChildren = item.children && item.children.length > 0;
    const isExpanded = expandedItems.has(item.title);
    const active = isActive(item.href);
    
    return (
      <div>
        <Link href={item.href}>
          <Button
            variant={active ? 'secondary' : 'ghost'}
            className={cn(
              "w-full justify-start gap-2 h-9",
              level > 0 && "ml-4",
              active && "bg-secondary"
            )}
            onClick={() => {
              if (hasChildren) {
                toggleExpanded(item.title);
              }
            }}
          >
            {item.icon}
            <span className="flex-1 text-left">{item.title}</span>
            {item.badge && (
              <span className="ml-auto bg-primary text-primary-foreground text-xs px-2 py-0.5 rounded-full">
                {item.badge}
              </span>
            )}
            {hasChildren && (
              <div className="ml-auto">
                {isExpanded ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
              </div>
            )}
          </Button>
        </Link>
        
        {hasChildren && isExpanded && (
          <div className="mt-1 space-y-1">
            {item.children!.map((child) => (
              <NavItemComponent key={child.href} item={child} level={level + 1} />
            ))}
          </div>
        )}
      </div>
    );
  };
  
  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}
      
      {/* Sidebar */}
      <div className={cn(
        "fixed left-0 top-0 z-50 h-full w-64 bg-background border-r transition-transform duration-300",
        isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
      )}>
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center gap-2 p-4 border-b">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <Bot className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <h2 className="font-semibold">Admin Panel</h2>
              <p className="text-xs text-muted-foreground">Waste Management AI</p>
            </div>
          </div>
          
          {/* Navigation */}
          <ScrollArea className="flex-1 p-4">
            <nav className="space-y-2">
              {navigationItems.map((item) => (
                <NavItemComponent key={item.href} item={item} />
              ))}
            </nav>
          </ScrollArea>
          
          {/* Footer */}
          <div className="p-4 border-t">
            <Button variant="ghost" className="w-full justify-start gap-2">
              <LogOut className="h-4 w-4" />
              Sign Out
            </Button>
          </div>
        </div>
      </div>
    </>
  );
};
```

### 3. Admin Header Component (`src/components/admin/Header.tsx`)

```typescript
'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { 
  Menu,
  Search,
  Bell,
  Settings,
  User,
  LogOut,
  Moon,
  Sun,
  Monitor
} from 'lucide-react';
import { useTheme } from 'next-themes';

interface HeaderProps {
  onMenuClick: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onMenuClick }) => {
  const { theme, setTheme } = useTheme();
  
  return (
    <header className="sticky top-0 z-30 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        {/* Left Section */}
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={onMenuClick}
            className="lg:hidden"
          >
            <Menu className="h-5 w-5" />
          </Button>
          
          <div className="hidden lg:flex items-center gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search admin functions..."
                className="pl-10 w-64"
              />
            </div>
          </div>
        </div>
        
        {/* Right Section */}
        <div className="flex items-center gap-4">
          {/* Theme Toggle */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm">
                <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                <span className="sr-only">Toggle theme</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setTheme('light')}>
                <Sun className="mr-2 h-4 w-4" />
                Light
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setTheme('dark')}>
                <Moon className="mr-2 h-4 w-4" />
                Dark
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setTheme('system')}>
                <Monitor className="mr-2 h-4 w-4" />
                System
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          
          {/* Notifications */}
          <Button variant="ghost" size="sm" className="relative">
            <Bell className="h-4 w-4" />
            <Badge 
              variant="destructive" 
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center text-xs"
            >
              3
            </Badge>
          </Button>
          
          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                  <User className="h-4 w-4 text-primary-foreground" />
                </div>
                <span className="hidden sm:inline">Admin User</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>My Account</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <User className="mr-2 h-4 w-4" />
                Profile
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Settings className="mr-2 h-4 w-4" />
                Settings
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <LogOut className="mr-2 h-4 w-4" />
                Sign Out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
};
```

## Main Dashboard Component

### 4. Main Dashboard Page (`src/app/(admin)/page.tsx`)

```typescript
'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  Activity,
  Bot,
  CheckCircle,
  XCircle,
  Clock,
  TrendingUp,
  Users,
  Database,
  AlertTriangle,
  Zap,
  Target,
  FileText,
  BarChart3
} from 'lucide-react';

export default function AdminDashboard() {
  // Mock data - replace with real data from your API
  const stats = {
    totalExecutions: 1247,
    successfulExecutions: 1189,
    failedExecutions: 58,
    successRate: 95.3,
    averageExecutionTime: 2.4,
    activeUsers: 23,
    totalQueries: 3421,
    systemUptime: 99.8
  };
  
  const recentExecutions = [
    {
      id: 'exec-001',
      query: 'Show me contaminated shipments from last week',
      status: 'completed',
      duration: 1.8,
      timestamp: '2024-01-15 14:30:00',
      agent: 'Planner'
    },
    {
      id: 'exec-002',
      query: 'Create a new facility in downtown',
      status: 'running',
      duration: 0.5,
      timestamp: '2024-01-15 14:28:00',
      agent: 'Executor'
    },
    {
      id: 'exec-003',
      query: 'Generate monthly compliance report',
      status: 'failed',
      duration: 0,
      timestamp: '2024-01-15 14:25:00',
      agent: 'Summarizer'
    }
  ];
  
  const agentStats = [
    {
      name: 'Planner',
      icon: <Target className="h-5 w-5" />,
      executions: 1247,
      successRate: 98.2,
      avgTime: 0.8,
      status: 'healthy'
    },
    {
      name: 'Executor',
      icon: <Zap className="h-5 w-5" />,
      executions: 1247,
      successRate: 95.3,
      avgTime: 1.2,
      status: 'healthy'
    },
    {
      name: 'Analyzer',
      icon: <Activity className="h-5 w-5" />,
      executions: 1247,
      successRate: 97.8,
      avgTime: 0.6,
      status: 'healthy'
    },
    {
      name: 'Summarizer',
      icon: <FileText className="h-5 w-5" />,
      executions: 1247,
      successRate: 96.1,
      avgTime: 0.4,
      status: 'warning'
    }
  ];
  
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
          <p className="text-muted-foreground">
            Monitor and manage your AI waste management system
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-green-500" />
            System Healthy
          </Badge>
          <Button>
            <Activity className="h-4 w-4 mr-2" />
            View Live Logs
          </Button>
        </div>
      </div>
      
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Executions</CardTitle>
            <Bot className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalExecutions.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              +12% from last month
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.successRate}%</div>
            <Progress value={stats.successRate} className="mt-2" />
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Execution Time</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.averageExecutionTime}s</div>
            <p className="text-xs text-muted-foreground">
              -0.3s from last week
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeUsers}</div>
            <p className="text-xs text-muted-foreground">
              +3 from yesterday
            </p>
          </CardContent>
        </Card>
      </div>
      
      {/* Agent Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bot className="h-5 w-5" />
            Agent Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {agentStats.map((agent) => (
              <div key={agent.name} className="p-4 border rounded-lg">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                    {agent.icon}
                  </div>
                  <div>
                    <h3 className="font-medium">{agent.name}</h3>
                    <Badge 
                      variant={agent.status === 'healthy' ? 'default' : 'destructive'}
                      className="text-xs"
                    >
                      {agent.status}
                    </Badge>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Executions</span>
                    <span className="font-medium">{agent.executions.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Success Rate</span>
                    <span className="font-medium">{agent.successRate}%</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Avg Time</span>
                    <span className="font-medium">{agent.avgTime}s</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
      
      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Recent Executions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentExecutions.map((execution) => (
                <div key={execution.id} className="flex items-center gap-4 p-3 border rounded-lg">
                  <div className="flex-shrink-0">
                    {execution.status === 'completed' && (
                      <CheckCircle className="h-5 w-5 text-green-500" />
                    )}
                    {execution.status === 'running' && (
                      <Clock className="h-5 w-5 text-blue-500 animate-spin" />
                    )}
                    {execution.status === 'failed' && (
                      <XCircle className="h-5 w-5 text-red-500" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {execution.query}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="outline" className="text-xs">
                        {execution.agent}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {execution.timestamp}
                      </span>
                      {execution.duration > 0 && (
                        <span className="text-xs text-muted-foreground">
                          {execution.duration}s
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              System Health
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm">CPU Usage</span>
                <span className="text-sm font-medium">23%</span>
              </div>
              <Progress value={23} className="h-2" />
              
              <div className="flex items-center justify-between">
                <span className="text-sm">Memory Usage</span>
                <span className="text-sm font-medium">67%</span>
              </div>
              <Progress value={67} className="h-2" />
              
              <div className="flex items-center justify-between">
                <span className="text-sm">Disk Usage</span>
                <span className="text-sm font-medium">45%</span>
              </div>
              <Progress value={45} className="h-2" />
              
              <div className="flex items-center justify-between">
                <span className="text-sm">Network I/O</span>
                <span className="text-sm font-medium">12%</span>
              </div>
              <Progress value={12} className="h-2" />
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Button variant="outline" className="h-20 flex flex-col gap-2">
              <Database className="h-6 w-6" />
              <span className="text-sm">View Data</span>
            </Button>
            <Button variant="outline" className="h-20 flex flex-col gap-2">
              <Settings className="h-6 w-6" />
              <span className="text-sm">Configure</span>
            </Button>
            <Button variant="outline" className="h-20 flex flex-col gap-2">
              <BarChart3 className="h-6 w-6" />
              <span className="text-sm">Analytics</span>
            </Button>
            <Button variant="outline" className="h-20 flex flex-col gap-2">
              <Users className="h-6 w-6" />
              <span className="text-sm">Users</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
```

## Admin Layout

### 5. Admin Route Protection (`src/middleware.ts`)

```typescript
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // Check if the request is for admin routes
  if (request.nextUrl.pathname.startsWith('/admin')) {
    // Check for authentication token
    const token = request.cookies.get('admin-token');
    
    if (!token) {
      // Redirect to login if no token
      return NextResponse.redirect(new URL('/admin/login', request.url));
    }
    
    // Verify token (implement your token verification logic)
    // For now, we'll just check if it exists
    try {
      // Add your JWT verification logic here
      // const decoded = verifyToken(token.value);
      // if (!decoded || decoded.role !== 'admin') {
      //   return NextResponse.redirect(new URL('/admin/login', request.url));
      // }
    } catch (error) {
      return NextResponse.redirect(new URL('/admin/login', request.url));
    }
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*']
};
```

### 6. Admin Login Page (`src/app/(admin)/login/page.tsx`)

```typescript
'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Bot, Eye, EyeOff } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function AdminLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    
    try {
      // Implement your authentication logic here
      const response = await fetch('/api/admin/auth', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });
      
      if (response.ok) {
        const data = await response.json();
        // Set admin token cookie
        document.cookie = `admin-token=${data.token}; path=/; max-age=86400`;
        router.push('/admin');
      } else {
        setError('Invalid credentials');
      }
    } catch (error) {
      setError('Login failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="w-16 h-16 rounded-full bg-primary flex items-center justify-center mx-auto mb-4">
            <Bot className="h-8 w-8 text-primary-foreground" />
          </div>
          <CardTitle className="text-2xl">Admin Login</CardTitle>
          <p className="text-muted-foreground">
            Sign in to access the admin dashboard
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="admin@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
            
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? 'Signing in...' : 'Sign In'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
```

## Responsive Design

### 7. Responsive Admin Layout (`src/components/admin/ResponsiveLayout.tsx`)

```typescript
'use client';

import React, { useState, useEffect } from 'react';
import { useMediaQuery } from '@/hooks/use-media-query';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { cn } from '@/lib/utils';

interface ResponsiveLayoutProps {
  children: React.ReactNode;
}

export const ResponsiveLayout: React.FC<ResponsiveLayoutProps> = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const isMobile = useMediaQuery('(max-width: 768px)');
  const isTablet = useMediaQuery('(max-width: 1024px)');
  
  useEffect(() => {
    if (!isMobile) {
      setSidebarOpen(false);
    }
  }, [isMobile]);
  
  return (
    <div className="min-h-screen bg-background">
      <Sidebar 
        isOpen={sidebarOpen} 
        onClose={() => setSidebarOpen(false)} 
      />
      
      <div className={cn(
        "flex-1 transition-all duration-300",
        sidebarOpen ? "lg:ml-64" : "lg:ml-16",
        isMobile && "ml-0"
      )}>
        <Header onMenuClick={() => setSidebarOpen(!sidebarOpen)} />
        
        <main className={cn(
          "container mx-auto px-4 py-6",
          isMobile && "px-2",
          isTablet && "px-3"
        )}>
          {children}
        </main>
      </div>
    </div>
  );
};
```

This admin dashboard overview provides a comprehensive foundation for the admin interface with responsive design, navigation structure, and key dashboard components.
