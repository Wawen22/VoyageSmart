'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/lib/supabase';
import { format, parseISO } from 'date-fns';
import { it } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  MapPinIcon, 
  CalendarIcon, 
  ClockIcon, 
  TagIcon, 
  TicketIcon, 
  DollarSignIcon, 
  FileTextIcon,
  MessageSquareIcon,
  EditIcon,
  ArrowRightIcon
} from 'lucide-react';
import ActivityComments from './ActivityComments';

interface Activity {
  id: string;
  trip_id: string;
  day_id: string;
  name: string;
  type: string | null;
  start_time: string | null;
  end_time: string | null;
  location: string | null;
  booking_reference: string | null;
  priority: number;
  cost: number | null;
  currency: string;
  notes: string | null;
  status: string;
}

interface ActivityDetailsProps {
  activity: Activity;
  onEdit?: (activity: Activity) => void;
  onClose?: () => void;
}

export default function ActivityDetails({ activity, onEdit, onClose }: ActivityDetailsProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const formatDate = (dateString: string) => {
    try {
      const date = parseISO(dateString);
      return format(date, 'EEEE d MMMM yyyy', { locale: it });
    } catch (e) {
      return 'Invalid date';
    }
  };

  const formatTime = (timeString: string | null) => {
    if (!timeString) return '';
    try {
      const date = parseISO(timeString);
      return format(date, 'HH:mm');
    } catch (e) {
      return timeString;
    }
  };

  const getActivityTypeLabel = (type: string | null) => {
    if (!type) return 'Other';
    
    const types: { [key: string]: string } = {
      'sightseeing': 'Sightseeing',
      'food': 'Food & Dining',
      'transportation': 'Transportation',
      'accommodation': 'Accommodation',
      'entertainment': 'Entertainment',
      'shopping': 'Shopping',
      'relaxation': 'Relaxation',
      'business': 'Business',
      'other': 'Other'
    };
    
    return types[type] || type;
  };

  const getPriorityLabel = (priority: number) => {
    switch (priority) {
      case 1: return 'Low';
      case 2: return 'Medium-Low';
      case 3: return 'Medium';
      case 4: return 'Medium-High';
      case 5: return 'High';
      default: return 'Medium';
    }
  };

  const getStatusLabel = (status: string) => {
    const statuses: { [key: string]: string } = {
      'planned': 'Planned',
      'confirmed': 'Confirmed',
      'in_progress': 'In Progress',
      'completed': 'Completed',
      'cancelled': 'Cancelled'
    };
    
    return statuses[status] || status;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'planned': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300';
      case 'confirmed': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300';
      case 'in_progress': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300';
      case 'completed': return 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300';
      case 'cancelled': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <h2 className="text-2xl font-bold">{activity.name}</h2>
        {onEdit && (
          <Button variant="outline" size="sm" onClick={() => onEdit(activity)}>
            <EditIcon className="h-4 w-4 mr-2" />
            Edit
          </Button>
        )}
      </div>

      <Tabs defaultValue="details">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="details">
            <FileTextIcon className="h-4 w-4 mr-2" />
            Details
          </TabsTrigger>
          <TabsTrigger value="comments">
            <MessageSquareIcon className="h-4 w-4 mr-2" />
            Comments
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="details" className="space-y-4 pt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {activity.location && (
              <div className="flex items-start space-x-2">
                <MapPinIcon className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm font-medium">Location</p>
                  <p className="text-sm text-muted-foreground">{activity.location}</p>
                </div>
              </div>
            )}
            
            {activity.type && (
              <div className="flex items-start space-x-2">
                <TagIcon className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm font-medium">Type</p>
                  <p className="text-sm text-muted-foreground">{getActivityTypeLabel(activity.type)}</p>
                </div>
              </div>
            )}
            
            {activity.start_time && (
              <div className="flex items-start space-x-2">
                <ClockIcon className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm font-medium">Time</p>
                  <p className="text-sm text-muted-foreground">
                    {formatTime(activity.start_time)}
                    {activity.end_time && (
                      <>
                        <ArrowRightIcon className="h-3 w-3 inline mx-1" />
                        {formatTime(activity.end_time)}
                      </>
                    )}
                  </p>
                </div>
              </div>
            )}
            
            {activity.booking_reference && (
              <div className="flex items-start space-x-2">
                <TicketIcon className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm font-medium">Booking Reference</p>
                  <p className="text-sm text-muted-foreground">{activity.booking_reference}</p>
                </div>
              </div>
            )}
            
            {activity.cost !== null && activity.cost !== undefined && (
              <div className="flex items-start space-x-2">
                <DollarSignIcon className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm font-medium">Cost</p>
                  <p className="text-sm text-muted-foreground">
                    {activity.cost} {activity.currency}
                  </p>
                </div>
              </div>
            )}
            
            <div className="flex items-start space-x-2">
              <div className="h-5 w-5 flex items-center justify-center text-muted-foreground mt-0.5">
                <span className="text-xs font-bold">!</span>
              </div>
              <div>
                <p className="text-sm font-medium">Priority</p>
                <p className="text-sm text-muted-foreground">{getPriorityLabel(activity.priority)}</p>
              </div>
            </div>
            
            <div className="flex items-start space-x-2">
              <div className="h-5 w-5 flex items-center justify-center text-muted-foreground mt-0.5">
                <span className="text-xs font-bold">S</span>
              </div>
              <div>
                <p className="text-sm font-medium">Status</p>
                <div className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${getStatusColor(activity.status)}`}>
                  {getStatusLabel(activity.status)}
                </div>
              </div>
            </div>
          </div>
          
          {activity.notes && (
            <>
              <Separator className="my-4" />
              <div>
                <h3 className="text-sm font-medium mb-2">Notes</h3>
                <div className="bg-muted p-3 rounded-md text-sm">
                  {activity.notes.split('\n').map((line, i) => (
                    <p key={i} className="mb-1">{line}</p>
                  ))}
                </div>
              </div>
            </>
          )}
        </TabsContent>
        
        <TabsContent value="comments" className="pt-4">
          <ActivityComments activityId={activity.id} tripId={activity.trip_id} />
        </TabsContent>
      </Tabs>
      
      {onClose && (
        <div className="flex justify-end mt-6">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
      )}
    </div>
  );
}
