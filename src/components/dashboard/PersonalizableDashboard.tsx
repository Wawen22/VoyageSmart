'use client';

import { useState, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  SettingsIcon, 
  EyeIcon, 
  EyeOffIcon,
  GripVerticalIcon,
  PlusIcon,
  BarChart3Icon,
  MapIcon,
  CalendarIcon,
  DollarSignIcon
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface Widget {
  id: string;
  title: string;
  component: string;
  visible: boolean;
  order: number;
  size: 'small' | 'medium' | 'large';
}

interface PersonalizableDashboardProps {
  children: React.ReactNode;
  trips: any[];
}

export default function PersonalizableDashboard({ children, trips }: PersonalizableDashboardProps) {
  const [isCustomizing, setIsCustomizing] = useState(false);
  const [widgets, setWidgets] = useState<Widget[]>([
    {
      id: 'stats',
      title: 'Statistiche Viaggi',
      component: 'InteractiveStatsSection',
      visible: true,
      order: 0,
      size: 'large'
    },
    {
      id: 'insights',
      title: 'Travel Insights',
      component: 'TravelInsights',
      visible: true,
      order: 1,
      size: 'large'
    },
    {
      id: 'weather',
      title: 'Meteo',
      component: 'WeatherWidget',
      visible: true,
      order: 2,
      size: 'medium'
    },
    {
      id: 'quick-actions',
      title: 'Azioni Rapide',
      component: 'QuickActions',
      visible: true,
      order: 3,
      size: 'medium'
    },
    {
      id: 'recent-activity',
      title: 'Attività Recente',
      component: 'RecentActivity',
      visible: false,
      order: 4,
      size: 'medium'
    }
  ]);

  // Load user preferences from localStorage
  useEffect(() => {
    const savedWidgets = localStorage.getItem('dashboard-widgets');
    if (savedWidgets) {
      setWidgets(JSON.parse(savedWidgets));
    }
  }, []);

  // Save preferences to localStorage
  const saveWidgets = (newWidgets: Widget[]) => {
    setWidgets(newWidgets);
    localStorage.setItem('dashboard-widgets', JSON.stringify(newWidgets));
  };

  const handleDragEnd = (result: any) => {
    if (!result.destination) return;

    const newWidgets = Array.from(widgets);
    const [reorderedWidget] = newWidgets.splice(result.source.index, 1);
    newWidgets.splice(result.destination.index, 0, reorderedWidget);

    // Update order
    const updatedWidgets = newWidgets.map((widget, index) => ({
      ...widget,
      order: index
    }));

    saveWidgets(updatedWidgets);
  };

  const toggleWidgetVisibility = (widgetId: string) => {
    const updatedWidgets = widgets.map(widget =>
      widget.id === widgetId
        ? { ...widget, visible: !widget.visible }
        : widget
    );
    saveWidgets(updatedWidgets);
  };

  const visibleWidgets = widgets
    .filter(widget => widget.visible)
    .sort((a, b) => a.order - b.order);

  const availableWidgets = [
    {
      id: 'budget-tracker',
      title: 'Budget Tracker',
      icon: DollarSignIcon,
      description: 'Monitora le spese dei tuoi viaggi'
    },
    {
      id: 'travel-calendar',
      title: 'Calendario Viaggi',
      icon: CalendarIcon,
      description: 'Vista calendario dei tuoi trip'
    },
    {
      id: 'destination-map',
      title: 'Mappa Destinazioni',
      icon: MapIcon,
      description: 'Visualizza le tue destinazioni'
    },
    {
      id: 'travel-stats',
      title: 'Statistiche Avanzate',
      icon: BarChart3Icon,
      description: 'Analytics dettagliate'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Customization Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">La Tua Dashboard</h2>
          <p className="text-sm text-muted-foreground">
            Personalizza la tua esperienza
          </p>
        </div>
        
        <Button
          variant={isCustomizing ? "default" : "outline"}
          onClick={() => setIsCustomizing(!isCustomizing)}
          className="gap-2"
        >
          <SettingsIcon className="h-4 w-4" />
          {isCustomizing ? 'Fine' : 'Personalizza'}
        </Button>
      </div>

      {/* Customization Panel */}
      {isCustomizing && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <SettingsIcon className="h-5 w-5" />
              Gestisci Widget
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Current Widgets */}
            <div>
              <h4 className="font-medium mb-3">Widget Attivi</h4>
              <div className="space-y-2">
                {widgets.map(widget => (
                  <div
                    key={widget.id}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <GripVerticalIcon className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">{widget.title}</span>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleWidgetVisibility(widget.id)}
                      className="gap-2"
                    >
                      {widget.visible ? (
                        <>
                          <EyeIcon className="h-4 w-4" />
                          Visibile
                        </>
                      ) : (
                        <>
                          <EyeOffIcon className="h-4 w-4" />
                          Nascosto
                        </>
                      )}
                    </Button>
                  </div>
                ))}
              </div>
            </div>

            {/* Available Widgets */}
            <div>
              <h4 className="font-medium mb-3">Widget Disponibili</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {availableWidgets.map(widget => {
                  const Icon = widget.icon;
                  return (
                    <div
                      key={widget.id}
                      className="p-3 border rounded-lg hover:bg-muted transition-colors cursor-pointer"
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
                          <Icon className="h-4 w-4 text-primary" />
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-sm">{widget.title}</p>
                          <p className="text-xs text-muted-foreground">{widget.description}</p>
                        </div>
                        <Button size="sm" variant="ghost">
                          <PlusIcon className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Dashboard Content */}
      {isCustomizing ? (
        <DragDropContext onDragEnd={handleDragEnd}>
          <Droppable droppableId="dashboard">
            {(provided) => (
              <div
                {...provided.droppableProps}
                ref={provided.innerRef}
                className="space-y-6"
              >
                {visibleWidgets.map((widget, index) => (
                  <Draggable key={widget.id} draggableId={widget.id} index={index}>
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        className={cn(
                          "transition-all duration-200",
                          snapshot.isDragging && "rotate-2 scale-105 shadow-lg"
                        )}
                      >
                        <Card className="border-dashed border-2">
                          <CardHeader {...provided.dragHandleProps}>
                            <CardTitle className="flex items-center gap-2 text-muted-foreground">
                              <GripVerticalIcon className="h-5 w-5" />
                              {widget.title}
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="h-32 bg-muted/50 rounded-lg flex items-center justify-center">
                              <p className="text-muted-foreground">Widget Preview</p>
                            </div>
                          </CardContent>
                        </Card>
                      </div>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </DragDropContext>
      ) : (
        <div className="space-y-6">
          {children}
        </div>
      )}
    </div>
  );
}
