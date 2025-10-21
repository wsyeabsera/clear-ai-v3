# Quick Actions Implementation

## Table of Contents
- [Overview](#overview)
- [Quick Actions Component](#quick-actions-component)
- [Action Categories](#action-categories)
- [Custom Actions](#custom-actions)
- [Action Templates](#action-templates)
- [Integration with Chat](#integration-with-chat)

## Overview

Quick Actions provide pre-built buttons and templates for common waste management operations, allowing users to quickly execute frequent tasks without typing full queries.

## Quick Actions Component

### 1. Main Quick Actions Component (`src/components/chat/QuickActions.tsx`)

```typescript
'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from '@/components/ui/tabs';
import { 
  Search,
  Plus,
  Star,
  Clock,
  TrendingUp,
  AlertTriangle,
  FileText,
  Settings,
  Truck,
  Building,
  Shield,
  BarChart3,
  Zap,
  Target,
  RefreshCw
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface QuickActionsProps {
  onActionClick: (action: string) => void;
  onCustomAction?: (action: string) => void;
  showCustomActions?: boolean;
  className?: string;
}

interface ActionTemplate {
  id: string;
  title: string;
  description: string;
  query: string;
  icon: React.ReactNode;
  category: string;
  isPopular?: boolean;
  isNew?: boolean;
  tags: string[];
}

export const QuickActions: React.FC<QuickActionsProps> = ({
  onActionClick,
  onCustomAction,
  showCustomActions = true,
  className
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('popular');
  const [customAction, setCustomAction] = useState('');
  
  const actionTemplates: ActionTemplate[] = [
    // Shipment Management
    {
      id: 'list-shipments',
      title: 'List Recent Shipments',
      description: 'Show shipments from the last 7 days',
      query: 'Show me all shipments from the last week',
      icon: <Truck className="h-4 w-4" />,
      category: 'shipments',
      isPopular: true,
      tags: ['shipments', 'recent', 'list']
    },
    {
      id: 'create-shipment',
      title: 'Create New Shipment',
      description: 'Start the shipment creation process',
      query: 'Create a new shipment for facility ABC with license plate XYZ123',
      icon: <Plus className="h-4 w-4" />,
      category: 'shipments',
      isPopular: true,
      tags: ['shipments', 'create', 'new']
    },
    {
      id: 'track-shipment',
      title: 'Track Shipment',
      description: 'Find a specific shipment by ID or license plate',
      query: 'Track shipment with license plate ABC123',
      icon: <Target className="h-4 w-4" />,
      category: 'shipments',
      tags: ['shipments', 'track', 'find']
    },
    {
      id: 'contaminated-shipments',
      title: 'Contaminated Shipments',
      description: 'Find shipments with contamination issues',
      query: 'Show me all contaminated shipments from last month',
      icon: <AlertTriangle className="h-4 w-4" />,
      category: 'shipments',
      tags: ['shipments', 'contaminated', 'issues']
    },
    
    // Facility Management
    {
      id: 'list-facilities',
      title: 'List Facilities',
      description: 'Show all available facilities',
      query: 'List all facilities and their current capacity',
      icon: <Building className="h-4 w-4" />,
      category: 'facilities',
      isPopular: true,
      tags: ['facilities', 'list', 'capacity']
    },
    {
      id: 'create-facility',
      title: 'Create Facility',
      description: 'Add a new waste management facility',
      query: 'Create a new facility called Downtown Waste Center with 5 doors',
      icon: <Plus className="h-4 w-4" />,
      category: 'facilities',
      tags: ['facilities', 'create', 'new']
    },
    {
      id: 'facility-capacity',
      title: 'Check Capacity',
      description: 'Check current facility capacity and availability',
      query: 'What is the current capacity of facility ABC?',
      icon: <BarChart3 className="h-4 w-4" />,
      category: 'facilities',
      tags: ['facilities', 'capacity', 'availability']
    },
    {
      id: 'facility-schedule',
      title: 'Facility Schedule',
      description: 'View facility operating hours and schedules',
      query: 'Show me the operating schedule for facility ABC',
      icon: <Clock className="h-4 w-4" />,
      category: 'facilities',
      tags: ['facilities', 'schedule', 'hours']
    },
    
    // Contaminant Management
    {
      id: 'list-contaminants',
      title: 'List Contaminants',
      description: 'Show recent contaminant detections',
      query: 'Show me all contaminants detected in the last 30 days',
      icon: <Shield className="h-4 w-4" />,
      category: 'contaminants',
      isPopular: true,
      tags: ['contaminants', 'detection', 'recent']
    },
    {
      id: 'contaminant-analysis',
      title: 'Contaminant Analysis',
      description: 'Analyze contaminant patterns and trends',
      query: 'Analyze contaminant patterns for the last quarter',
      icon: <TrendingUp className="h-4 w-4" />,
      category: 'contaminants',
      tags: ['contaminants', 'analysis', 'patterns']
    },
    {
      id: 'high-risk-contaminants',
      title: 'High-Risk Contaminants',
      description: 'Find contaminants with high risk levels',
      query: 'Show me all high-risk contaminants detected recently',
      icon: <AlertTriangle className="h-4 w-4" />,
      category: 'contaminants',
      tags: ['contaminants', 'high-risk', 'safety']
    },
    
    // Reporting & Analytics
    {
      id: 'monthly-report',
      title: 'Monthly Report',
      description: 'Generate a comprehensive monthly report',
      query: 'Generate a monthly report for last month including all shipments, facilities, and contaminants',
      icon: <FileText className="h-4 w-4" />,
      category: 'reports',
      isPopular: true,
      tags: ['reports', 'monthly', 'comprehensive']
    },
    {
      id: 'performance-dashboard',
      title: 'Performance Dashboard',
      description: 'View key performance metrics and KPIs',
      query: 'Show me the performance dashboard with key metrics',
      icon: <BarChart3 className="h-4 w-4" />,
      category: 'reports',
      tags: ['reports', 'performance', 'metrics']
    },
    {
      id: 'compliance-report',
      title: 'Compliance Report',
      description: 'Generate compliance and regulatory reports',
      query: 'Generate a compliance report for this quarter',
      icon: <Shield className="h-4 w-4" />,
      category: 'reports',
      tags: ['reports', 'compliance', 'regulatory']
    },
    {
      id: 'cost-analysis',
      title: 'Cost Analysis',
      description: 'Analyze operational costs and expenses',
      query: 'Show me a cost analysis for the last quarter',
      icon: <TrendingUp className="h-4 w-4" />,
      category: 'reports',
      tags: ['reports', 'costs', 'analysis']
    },
    
    // System Management
    {
      id: 'system-status',
      title: 'System Status',
      description: 'Check system health and performance',
      query: 'Show me the current system status and performance metrics',
      icon: <Settings className="h-4 w-4" />,
      category: 'system',
      tags: ['system', 'status', 'health']
    },
    {
      id: 'data-backup',
      title: 'Data Backup',
      description: 'Initiate data backup process',
      query: 'Start a data backup process for all systems',
      icon: <RefreshCw className="h-4 w-4" />,
      category: 'system',
      tags: ['system', 'backup', 'data']
    },
    {
      id: 'user-activity',
      title: 'User Activity',
      description: 'View recent user activity and logs',
      query: 'Show me recent user activity and system logs',
      icon: <Clock className="h-4 w-4" />,
      category: 'system',
      tags: ['system', 'users', 'activity']
    }
  ];
  
  const categories = [
    { id: 'popular', label: 'Popular', icon: <Star className="h-4 w-4" /> },
    { id: 'shipments', label: 'Shipments', icon: <Truck className="h-4 w-4" /> },
    { id: 'facilities', label: 'Facilities', icon: <Building className="h-4 w-4" /> },
    { id: 'contaminants', label: 'Contaminants', icon: <Shield className="h-4 w-4" /> },
    { id: 'reports', label: 'Reports', icon: <FileText className="h-4 w-4" /> },
    { id: 'system', label: 'System', icon: <Settings className="h-4 w-4" /> }
  ];
  
  const filteredActions = actionTemplates.filter(action => {
    const matchesSearch = action.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         action.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         action.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    
    if (activeTab === 'popular') {
      return matchesSearch && action.isPopular;
    }
    
    return matchesSearch && action.category === activeTab;
  });
  
  const handleCustomActionSubmit = () => {
    if (customAction.trim()) {
      onCustomAction?.(customAction.trim());
      setCustomAction('');
    }
  };
  
  return (
    <div className={cn("space-y-6", className)}>
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search actions..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>
      
      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-6">
          {categories.map((category) => (
            <TabsTrigger key={category.id} value={category.id} className="text-xs">
              <div className="flex items-center gap-1">
                {category.icon}
                <span className="hidden sm:inline">{category.label}</span>
              </div>
            </TabsTrigger>
          ))}
        </TabsList>
        
        {/* Popular Actions */}
        <TabsContent value="popular" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredActions.map((action) => (
              <ActionCard
                key={action.id}
                action={action}
                onClick={() => onActionClick(action.query)}
              />
            ))}
          </div>
        </TabsContent>
        
        {/* Category Actions */}
        {categories.slice(1).map((category) => (
          <TabsContent key={category.id} value={category.id} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredActions.map((action) => (
                <ActionCard
                  key={action.id}
                  action={action}
                  onClick={() => onActionClick(action.query)}
                />
              ))}
            </div>
          </TabsContent>
        ))}
      </Tabs>
      
      {/* Custom Actions */}
      {showCustomActions && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5" />
              Custom Action
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input
                placeholder="Enter your custom query..."
                value={customAction}
                onChange={(e) => setCustomAction(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleCustomActionSubmit()}
              />
              <Button 
                onClick={handleCustomActionSubmit}
                disabled={!customAction.trim()}
              >
                Execute
              </Button>
            </div>
            <p className="text-sm text-muted-foreground">
              Create custom queries for specific waste management operations
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

// Action Card Component
interface ActionCardProps {
  action: ActionTemplate;
  onClick: () => void;
}

const ActionCard: React.FC<ActionCardProps> = ({ action, onClick }) => {
  return (
    <Card 
      className="cursor-pointer transition-all duration-200 hover:shadow-md hover:scale-[1.02] group"
      onClick={onClick}
    >
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary/20 transition-colors">
            {action.icon}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-medium text-sm">{action.title}</h3>
              {action.isPopular && (
                <Badge variant="secondary" className="text-xs">
                  <Star className="h-3 w-3 mr-1" />
                  Popular
                </Badge>
              )}
              {action.isNew && (
                <Badge variant="default" className="text-xs">
                  New
                </Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground mb-2">
              {action.description}
            </p>
            <div className="flex flex-wrap gap-1">
              {action.tags.slice(0, 3).map((tag) => (
                <Badge key={tag} variant="outline" className="text-xs">
                  {tag}
                </Badge>
              ))}
              {action.tags.length > 3 && (
                <Badge variant="outline" className="text-xs">
                  +{action.tags.length - 3}
                </Badge>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
```

## Action Categories

### 2. Action Category Definitions (`src/lib/action-categories.ts`)

```typescript
export interface ActionCategory {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  actions: ActionTemplate[];
}

export interface ActionTemplate {
  id: string;
  title: string;
  description: string;
  query: string;
  icon: string;
  category: string;
  isPopular?: boolean;
  isNew?: boolean;
  tags: string[];
  parameters?: ActionParameter[];
  examples?: string[];
}

export interface ActionParameter {
  name: string;
  type: 'string' | 'number' | 'date' | 'boolean' | 'select';
  required: boolean;
  description: string;
  options?: string[];
  defaultValue?: any;
}

export const ACTION_CATEGORIES: ActionCategory[] = [
  {
    id: 'shipments',
    name: 'Shipment Management',
    description: 'Manage and track waste shipments',
    icon: 'truck',
    color: 'blue',
    actions: [
      {
        id: 'list-shipments',
        title: 'List Recent Shipments',
        description: 'Show shipments from the last 7 days',
        query: 'Show me all shipments from the last week',
        icon: 'list',
        category: 'shipments',
        isPopular: true,
        tags: ['shipments', 'recent', 'list'],
        parameters: [
          {
            name: 'days',
            type: 'number',
            required: false,
            description: 'Number of days to look back',
            defaultValue: 7
          }
        ],
        examples: [
          'Show me all shipments from the last week',
          'List shipments from the last 30 days',
          'Show recent shipments for facility ABC'
        ]
      },
      {
        id: 'create-shipment',
        title: 'Create New Shipment',
        description: 'Start the shipment creation process',
        query: 'Create a new shipment for facility ABC with license plate XYZ123',
        icon: 'plus',
        category: 'shipments',
        isPopular: true,
        tags: ['shipments', 'create', 'new'],
        parameters: [
          {
            name: 'facility',
            type: 'string',
            required: true,
            description: 'Facility ID or name'
          },
          {
            name: 'license_plate',
            type: 'string',
            required: true,
            description: 'Vehicle license plate'
          },
          {
            name: 'weight',
            type: 'number',
            required: false,
            description: 'Shipment weight in kg'
          }
        ],
        examples: [
          'Create a new shipment for facility ABC with license plate XYZ123',
          'Create shipment for Downtown Facility with plate ABC123 and weight 1500kg',
          'Add new shipment to facility XYZ'
        ]
      }
    ]
  },
  {
    id: 'facilities',
    name: 'Facility Management',
    description: 'Manage waste processing facilities',
    icon: 'building',
    color: 'green',
    actions: [
      {
        id: 'list-facilities',
        title: 'List Facilities',
        description: 'Show all available facilities',
        query: 'List all facilities and their current capacity',
        icon: 'list',
        category: 'facilities',
        isPopular: true,
        tags: ['facilities', 'list', 'capacity'],
        examples: [
          'List all facilities and their current capacity',
          'Show me all facilities with their door counts',
          'Display facility information'
        ]
      }
    ]
  }
  // ... more categories
];
```

## Custom Actions

### 3. Custom Action Builder (`src/components/chat/CustomActionBuilder.tsx`)

```typescript
'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { 
  Plus, 
  Trash2, 
  Save, 
  Play,
  Settings,
  Zap
} from 'lucide-react';
import { ActionTemplate, ActionParameter } from '@/lib/action-categories';

interface CustomActionBuilderProps {
  onSave: (action: ActionTemplate) => void;
  onExecute: (query: string) => void;
  onCancel: () => void;
}

export const CustomActionBuilder: React.FC<CustomActionBuilderProps> = ({
  onSave,
  onExecute,
  onCancel
}) => {
  const [action, setAction] = useState<Partial<ActionTemplate>>({
    title: '',
    description: '',
    query: '',
    category: 'custom',
    tags: [],
    parameters: []
  });
  
  const [newTag, setNewTag] = useState('');
  const [newParameter, setNewParameter] = useState<Partial<ActionParameter>>({
    name: '',
    type: 'string',
    required: false,
    description: ''
  });
  
  const addTag = () => {
    if (newTag.trim() && !action.tags?.includes(newTag.trim())) {
      setAction(prev => ({
        ...prev,
        tags: [...(prev.tags || []), newTag.trim()]
      }));
      setNewTag('');
    }
  };
  
  const removeTag = (tagToRemove: string) => {
    setAction(prev => ({
      ...prev,
      tags: prev.tags?.filter(tag => tag !== tagToRemove) || []
    }));
  };
  
  const addParameter = () => {
    if (newParameter.name && newParameter.description) {
      setAction(prev => ({
        ...prev,
        parameters: [...(prev.parameters || []), newParameter as ActionParameter]
      }));
      setNewParameter({
        name: '',
        type: 'string',
        required: false,
        description: ''
      });
    }
  };
  
  const removeParameter = (index: number) => {
    setAction(prev => ({
      ...prev,
      parameters: prev.parameters?.filter((_, i) => i !== index) || []
    }));
  };
  
  const handleSave = () => {
    if (action.title && action.description && action.query) {
      const fullAction: ActionTemplate = {
        id: `custom-${Date.now()}`,
        title: action.title,
        description: action.description,
        query: action.query,
        icon: 'zap',
        category: 'custom',
        tags: action.tags || [],
        parameters: action.parameters || []
      };
      onSave(fullAction);
    }
  };
  
  const handleExecute = () => {
    if (action.query) {
      onExecute(action.query);
    }
  };
  
  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="h-5 w-5" />
          Custom Action Builder
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Basic Information */}
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-2 block">Action Title</label>
            <Input
              placeholder="Enter action title..."
              value={action.title || ''}
              onChange={(e) => setAction(prev => ({ ...prev, title: e.target.value }))}
            />
          </div>
          
          <div>
            <label className="text-sm font-medium mb-2 block">Description</label>
            <Textarea
              placeholder="Describe what this action does..."
              value={action.description || ''}
              onChange={(e) => setAction(prev => ({ ...prev, description: e.target.value }))}
              rows={3}
            />
          </div>
          
          <div>
            <label className="text-sm font-medium mb-2 block">Query Template</label>
            <Textarea
              placeholder="Enter the query template..."
              value={action.query || ''}
              onChange={(e) => setAction(prev => ({ ...prev, query: e.target.value }))}
              rows={3}
            />
          </div>
        </div>
        
        {/* Tags */}
        <div className="space-y-3">
          <label className="text-sm font-medium">Tags</label>
          <div className="flex gap-2">
            <Input
              placeholder="Add a tag..."
              value={newTag}
              onChange={(e) => setNewTag(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && addTag()}
            />
            <Button onClick={addTag} size="sm">
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          <div className="flex flex-wrap gap-2">
            {action.tags?.map((tag) => (
              <Badge key={tag} variant="secondary" className="flex items-center gap-1">
                {tag}
                <button
                  onClick={() => removeTag(tag)}
                  className="ml-1 hover:text-destructive"
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>
        </div>
        
        {/* Parameters */}
        <div className="space-y-3">
          <label className="text-sm font-medium">Parameters</label>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <Input
                placeholder="Parameter name"
                value={newParameter.name || ''}
                onChange={(e) => setNewParameter(prev => ({ ...prev, name: e.target.value }))}
              />
              <Select
                value={newParameter.type || 'string'}
                onValueChange={(value) => setNewParameter(prev => ({ ...prev, type: value as any }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="string">String</SelectItem>
                  <SelectItem value="number">Number</SelectItem>
                  <SelectItem value="date">Date</SelectItem>
                  <SelectItem value="boolean">Boolean</SelectItem>
                  <SelectItem value="select">Select</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Textarea
              placeholder="Parameter description"
              value={newParameter.description || ''}
              onChange={(e) => setNewParameter(prev => ({ ...prev, description: e.target.value }))}
              rows={2}
            />
            <Button onClick={addParameter} size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Add Parameter
            </Button>
          </div>
          
          {action.parameters && action.parameters.length > 0 && (
            <div className="space-y-2">
              {action.parameters.map((param, index) => (
                <div key={index} className="flex items-center gap-2 p-2 border rounded">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{param.name}</span>
                      <Badge variant="outline" className="text-xs">
                        {param.type}
                      </Badge>
                      {param.required && (
                        <Badge variant="destructive" className="text-xs">
                          Required
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">{param.description}</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeParameter(index)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
        
        {/* Actions */}
        <div className="flex gap-2 pt-4 border-t">
          <Button onClick={handleExecute} disabled={!action.query}>
            <Play className="h-4 w-4 mr-2" />
            Execute Now
          </Button>
          <Button onClick={handleSave} disabled={!action.title || !action.description || !action.query}>
            <Save className="h-4 w-4 mr-2" />
            Save Action
          </Button>
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
```

## Action Templates

### 4. Action Template Manager (`src/lib/action-templates.ts`)

```typescript
import { ActionTemplate } from './action-categories';

export class ActionTemplateManager {
  private static instance: ActionTemplateManager;
  private templates: ActionTemplate[] = [];
  private customTemplates: ActionTemplate[] = [];
  
  static getInstance(): ActionTemplateManager {
    if (!ActionTemplateManager.instance) {
      ActionTemplateManager.instance = new ActionTemplateManager();
    }
    return ActionTemplateManager.instance;
  }
  
  loadTemplates(): ActionTemplate[] {
    // Load from localStorage or API
    const stored = localStorage.getItem('custom-action-templates');
    if (stored) {
      this.customTemplates = JSON.parse(stored);
    }
    return [...this.templates, ...this.customTemplates];
  }
  
  saveTemplate(template: ActionTemplate): void {
    this.customTemplates.push(template);
    localStorage.setItem('custom-action-templates', JSON.stringify(this.customTemplates));
  }
  
  deleteTemplate(templateId: string): void {
    this.customTemplates = this.customTemplates.filter(t => t.id !== templateId);
    localStorage.setItem('custom-action-templates', JSON.stringify(this.customTemplates));
  }
  
  getTemplateById(id: string): ActionTemplate | undefined {
    return [...this.templates, ...this.customTemplates].find(t => t.id === id);
  }
  
  searchTemplates(query: string): ActionTemplate[] {
    const allTemplates = [...this.templates, ...this.customTemplates];
    return allTemplates.filter(template => 
      template.title.toLowerCase().includes(query.toLowerCase()) ||
      template.description.toLowerCase().includes(query.toLowerCase()) ||
      template.tags.some(tag => tag.toLowerCase().includes(query.toLowerCase()))
    );
  }
  
  getTemplatesByCategory(category: string): ActionTemplate[] {
    return [...this.templates, ...this.customTemplates].filter(t => t.category === category);
  }
  
  getPopularTemplates(): ActionTemplate[] {
    return [...this.templates, ...this.customTemplates].filter(t => t.isPopular);
  }
}

// Predefined templates
export const PREDEFINED_TEMPLATES: ActionTemplate[] = [
  {
    id: 'quick-shipment-check',
    title: 'Quick Shipment Check',
    description: 'Check the status of a specific shipment',
    query: 'Check the status of shipment {shipment_id}',
    icon: 'search',
    category: 'shipments',
    isPopular: true,
    tags: ['shipment', 'status', 'check'],
    parameters: [
      {
        name: 'shipment_id',
        type: 'string',
        required: true,
        description: 'The shipment ID to check'
      }
    ],
    examples: [
      'Check the status of shipment SHIP-001',
      'What is the current status of shipment ABC123?',
      'Show me details for shipment XYZ-456'
    ]
  },
  {
    id: 'facility-capacity-report',
    title: 'Facility Capacity Report',
    description: 'Generate a comprehensive capacity report for a facility',
    query: 'Generate a capacity report for facility {facility_name}',
    icon: 'bar-chart',
    category: 'facilities',
    isPopular: true,
    tags: ['facility', 'capacity', 'report'],
    parameters: [
      {
        name: 'facility_name',
        type: 'string',
        required: true,
        description: 'The name or ID of the facility'
      }
    ],
    examples: [
      'Generate a capacity report for facility Downtown Center',
      'Show capacity report for facility ABC',
      'Create capacity analysis for Main Processing Facility'
    ]
  }
  // ... more templates
];
```

## Integration with Chat

### 5. Chat Integration Hook (`src/hooks/useQuickActions.ts`)

```typescript
import { useState, useCallback } from 'react';
import { ActionTemplateManager } from '@/lib/action-templates';
import { ActionTemplate } from '@/lib/action-categories';

export const useQuickActions = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedAction, setSelectedAction] = useState<ActionTemplate | null>(null);
  const [actionParameters, setActionParameters] = useState<Record<string, any>>({});
  
  const templateManager = ActionTemplateManager.getInstance();
  
  const executeAction = useCallback((action: ActionTemplate, parameters?: Record<string, any>) => {
    let query = action.query;
    
    // Replace parameters in query
    if (parameters) {
      Object.entries(parameters).forEach(([key, value]) => {
        query = query.replace(`{${key}}`, String(value));
      });
    }
    
    // Execute the query
    return query;
  }, []);
  
  const openActionBuilder = useCallback(() => {
    setIsOpen(true);
  }, []);
  
  const closeActionBuilder = useCallback(() => {
    setIsOpen(false);
    setSelectedAction(null);
    setActionParameters({});
  }, []);
  
  const saveCustomAction = useCallback((action: ActionTemplate) => {
    templateManager.saveTemplate(action);
    closeActionBuilder();
  }, [templateManager, closeActionBuilder]);
  
  const deleteCustomAction = useCallback((actionId: string) => {
    templateManager.deleteTemplate(actionId);
  }, [templateManager]);
  
  const searchActions = useCallback((query: string) => {
    return templateManager.searchTemplates(query);
  }, [templateManager]);
  
  const getActionsByCategory = useCallback((category: string) => {
    return templateManager.getTemplatesByCategory(category);
  }, [templateManager]);
  
  const getPopularActions = useCallback(() => {
    return templateManager.getPopularTemplates();
  }, [templateManager]);
  
  return {
    isOpen,
    selectedAction,
    actionParameters,
    executeAction,
    openActionBuilder,
    closeActionBuilder,
    saveCustomAction,
    deleteCustomAction,
    searchActions,
    getActionsByCategory,
    getPopularActions,
    setActionParameters
  };
};
```

### 6. Quick Actions Page (`src/app/(customer)/actions/page.tsx`)

```typescript
'use client';

import React from 'react';
import { QuickActions } from '@/components/chat/QuickActions';
import { CustomActionBuilder } from '@/components/chat/CustomActionBuilder';
import { useQuickActions } from '@/hooks/useQuickActions';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Settings } from 'lucide-react';

export default function ActionsPage() {
  const {
    isOpen,
    executeAction,
    openActionBuilder,
    closeActionBuilder,
    saveCustomAction
  } = useQuickActions();
  
  const handleActionClick = (query: string) => {
    // Navigate to chat with the query pre-filled
    window.location.href = `/chat?query=${encodeURIComponent(query)}`;
  };
  
  const handleCustomAction = (query: string) => {
    // Navigate to chat with the custom query
    window.location.href = `/chat?query=${encodeURIComponent(query)}`;
  };
  
  return (
    <div className="container mx-auto py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">Quick Actions</h1>
          <p className="text-muted-foreground">
            Pre-built actions for common waste management operations
          </p>
        </div>
        <Button onClick={openActionBuilder}>
          <Plus className="h-4 w-4 mr-2" />
          Create Custom Action
        </Button>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <QuickActions
            onActionClick={handleActionClick}
            onCustomAction={handleCustomAction}
            showCustomActions={false}
          />
        </div>
        
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Action Tips
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-medium mb-2">💡 Pro Tips</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Click any action to execute it immediately</li>
                  <li>• Use the search to find specific actions</li>
                  <li>• Create custom actions for your workflow</li>
                  <li>• Popular actions are marked with a star</li>
                </ul>
              </div>
              
              <div>
                <h4 className="font-medium mb-2">🚀 Quick Start</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Start with "List Recent Shipments"</li>
                  <li>• Try "Generate Monthly Report"</li>
                  <li>• Check "System Status" for health</li>
                  <li>• Use "Create Facility" for new locations</li>
                </ul>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Recent Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Your recently used actions will appear here
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
      
      {/* Custom Action Builder Modal */}
      {isOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <CustomActionBuilder
            onSave={saveCustomAction}
            onExecute={handleCustomAction}
            onCancel={closeActionBuilder}
          />
        </div>
      )}
    </div>
  );
}
```

This comprehensive Quick Actions implementation provides users with easy access to common operations, custom action creation, and seamless integration with the chat interface.
