'use client';

import { useState } from 'react';
import { useDispatch } from 'react-redux';
import { AppDispatch } from '@/lib/store';
import { Transportation, deleteTransportation } from '@/lib/features/transportationSlice';
import { format, parseISO } from 'date-fns';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogFooter,
  DialogDescription
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { 
  CalendarIcon, 
  MapPinIcon, 
  TicketIcon, 
  PhoneIcon, 
  DollarSignIcon, 
  FileIcon,
  EditIcon,
  TrashIcon,
  ExternalLinkIcon,
  ClockIcon
} from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { toast } from '@/components/ui/use-toast';
import TransportationMap from './TransportationMap';

interface TransportationDetailsModalProps {
  transportation: Transportation | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit: () => void;
  canEdit: boolean;
  getIcon: (type: string) => JSX.Element;
}

export default function TransportationDetailsModal({ 
  transportation, 
  isOpen, 
  onClose,
  onEdit,
  canEdit,
  getIcon
}: TransportationDetailsModalProps) {
  const dispatch = useDispatch<AppDispatch>();
  const [loading, setLoading] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  if (!transportation) return null;

  const getStatusBadgeVariant = (status: string | null) => {
    if (!status) return 'outline';
    switch (status) {
      case 'confirmed': return 'success';
      case 'pending': return 'warning';
      case 'cancelled': return 'destructive';
      default: return 'outline';
    }
  };

  const getStatusLabel = (status: string | null) => {
    if (!status) return 'Not specified';
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  const handleDelete = async () => {
    if (!transportation) return;
    
    setLoading(true);
    try {
      await dispatch(deleteTransportation(transportation.id)).unwrap();
      toast({
        title: 'Transportation deleted',
        description: 'The transportation has been successfully deleted.',
      });
      onClose();
    } catch (error) {
      console.error('Error deleting transportation:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete transportation. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
      setShowDeleteConfirm(false);
    }
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center text-xl">
              {getIcon(transportation.type)}
              <span className="ml-2">
                {transportation.provider || transportation.type.charAt(0).toUpperCase() + transportation.type.slice(1)}
              </span>
              {transportation.status && (
                <Badge variant={getStatusBadgeVariant(transportation.status) as any} className="ml-2">
                  {getStatusLabel(transportation.status)}
                </Badge>
              )}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6 py-4">
            {/* Basic Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Departure Info */}
              <div className="space-y-3">
                <h3 className="font-semibold text-lg">Departure</h3>
                
                {transportation.departure_time && (
                  <div className="flex items-start">
                    <CalendarIcon className="h-4 w-4 mr-2 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-sm font-medium">Date & Time</p>
                      <p className="text-sm">{format(parseISO(transportation.departure_time), 'EEEE, MMMM d, yyyy HH:mm')}</p>
                    </div>
                  </div>
                )}
                
                {transportation.departure_location && (
                  <div className="flex items-start">
                    <MapPinIcon className="h-4 w-4 mr-2 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-sm font-medium">Location</p>
                      <p className="text-sm">{transportation.departure_location}</p>
                    </div>
                  </div>
                )}
              </div>
              
              {/* Arrival Info */}
              <div className="space-y-3">
                <h3 className="font-semibold text-lg">Arrival</h3>
                
                {transportation.arrival_time && (
                  <div className="flex items-start">
                    <CalendarIcon className="h-4 w-4 mr-2 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-sm font-medium">Date & Time</p>
                      <p className="text-sm">{format(parseISO(transportation.arrival_time), 'EEEE, MMMM d, yyyy HH:mm')}</p>
                    </div>
                  </div>
                )}
                
                {transportation.arrival_location && (
                  <div className="flex items-start">
                    <MapPinIcon className="h-4 w-4 mr-2 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-sm font-medium">Location</p>
                      <p className="text-sm">{transportation.arrival_location}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            <Separator />
            
            {/* Additional Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Booking Info */}
              <div className="space-y-3">
                {transportation.booking_reference && (
                  <div className="flex items-start">
                    <TicketIcon className="h-4 w-4 mr-2 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-sm font-medium">Booking Reference</p>
                      <p className="text-sm">{transportation.booking_reference}</p>
                    </div>
                  </div>
                )}
                
                {transportation.cost !== null && (
                  <div className="flex items-start">
                    <DollarSignIcon className="h-4 w-4 mr-2 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-sm font-medium">Cost</p>
                      <p className="text-sm">{formatCurrency(transportation.cost, transportation.currency)}</p>
                    </div>
                  </div>
                )}
              </div>
              
              {/* Notes */}
              {transportation.notes && (
                <div className="space-y-1">
                  <p className="text-sm font-medium">Notes</p>
                  <p className="text-sm whitespace-pre-wrap">{transportation.notes}</p>
                </div>
              )}
            </div>
            
            {/* Stops */}
            {transportation.stops && transportation.stops.length > 0 && (
              <>
                <Separator />
                
                <div className="space-y-3">
                  <h3 className="font-semibold text-lg">Stops</h3>
                  
                  <div className="space-y-4">
                    {transportation.stops.map((stop, index) => (
                      <div key={stop.id} className="border rounded-md p-3 space-y-2">
                        <div className="flex justify-between items-center">
                          <h4 className="font-medium">{stop.location}</h4>
                          <Badge variant="outline">Stop {index + 1}</Badge>
                        </div>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {stop.arrival_time && (
                            <div className="flex items-center text-sm">
                              <ClockIcon className="h-3 w-3 mr-1 text-muted-foreground" />
                              <span className="text-muted-foreground mr-1">Arrival:</span>
                              {format(parseISO(stop.arrival_time), 'MMM d, yyyy HH:mm')}
                            </div>
                          )}
                          
                          {stop.departure_time && (
                            <div className="flex items-center text-sm">
                              <ClockIcon className="h-3 w-3 mr-1 text-muted-foreground" />
                              <span className="text-muted-foreground mr-1">Departure:</span>
                              {format(parseISO(stop.departure_time), 'MMM d, yyyy HH:mm')}
                            </div>
                          )}
                        </div>
                        
                        {stop.notes && (
                          <p className="text-sm text-muted-foreground">{stop.notes}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
            
            {/* Documents */}
            {transportation.documents && transportation.documents.length > 0 && (
              <>
                <Separator />
                
                <div className="space-y-3">
                  <h3 className="font-semibold text-lg">Documents</h3>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                    {transportation.documents.map((doc, index) => (
                      <a
                        key={index}
                        href={doc.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center p-2 border rounded-md hover:bg-accent transition-colors"
                      >
                        <FileIcon className="h-4 w-4 mr-2 text-primary" />
                        <span className="text-sm truncate flex-1">{doc.name}</span>
                        <ExternalLinkIcon className="h-3 w-3 text-muted-foreground ml-1" />
                      </a>
                    ))}
                  </div>
                </div>
              </>
            )}
            
            {/* Map */}
            {(transportation.departure_coordinates || transportation.arrival_coordinates) && (
              <>
                <Separator />
                
                <div className="space-y-3">
                  <h3 className="font-semibold text-lg">Map</h3>
                  
                  <div className="h-[300px] w-full">
                    <TransportationMap
                      transportations={[transportation]}
                      height="300px"
                    />
                  </div>
                </div>
              </>
            )}
          </div>
          
          <DialogFooter className="flex justify-between sm:justify-end gap-2">
            {canEdit && (
              <Button 
                variant="destructive" 
                onClick={() => setShowDeleteConfirm(true)}
                disabled={loading}
                className="flex items-center"
              >
                <TrashIcon className="h-4 w-4 mr-2" />
                Delete
              </Button>
            )}
            
            {canEdit && (
              <Button 
                variant="outline" 
                onClick={onEdit}
                disabled={loading}
                className="flex items-center"
              >
                <EditIcon className="h-4 w-4 mr-2" />
                Edit
              </Button>
            )}
            
            <Button onClick={onClose} disabled={loading}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this transportation. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={loading}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDelete} 
              disabled={loading}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {loading ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
