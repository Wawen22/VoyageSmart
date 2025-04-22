'use client';

import { useState } from 'react';
import { useDispatch } from 'react-redux';
import { AppDispatch } from '@/lib/store';
import { deleteAccommodation, Accommodation } from '@/lib/features/accommodationSlice';
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
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { toast } from '@/components/ui/use-toast';
import { format, parseISO } from 'date-fns';
import { 
  Building2Icon, 
  CalendarIcon, 
  MapPinIcon, 
  TicketIcon, 
  PhoneIcon, 
  DollarSignIcon, 
  FileIcon,
  EditIcon,
  TrashIcon,
  ExternalLinkIcon
} from 'lucide-react';
import MapView from '@/components/map/MapView';

interface AccommodationDetailsModalProps {
  accommodation: Accommodation | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit: () => void;
  canEdit: boolean;
}

export default function AccommodationDetailsModal({ 
  accommodation, 
  isOpen, 
  onClose,
  onEdit,
  canEdit
}: AccommodationDetailsModalProps) {
  const dispatch = useDispatch<AppDispatch>();
  const [loading, setLoading] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  if (!accommodation) return null;

  const handleDelete = async () => {
    try {
      setLoading(true);
      await dispatch(deleteAccommodation(accommodation.id));
      toast({
        title: 'Accommodation deleted',
        description: 'The accommodation has been deleted successfully.',
      });
      onClose();
    } catch (error) {
      console.error('Error deleting accommodation:', error);
      toast({
        title: 'Error deleting accommodation',
        description: 'There was an error deleting the accommodation. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
      setShowDeleteConfirm(false);
    }
  };

  const getAccommodationTypeLabel = (type: string) => {
    const types: Record<string, string> = {
      hotel: 'Hotel',
      apartment: 'Apartment',
      hostel: 'Hostel',
      house: 'House',
      villa: 'Villa',
      resort: 'Resort',
      camping: 'Camping',
      other: 'Other',
    };
    return types[type] || type;
  };

  const formatCurrency = (amount: number | null, currency: string) => {
    if (amount === null) return '';
    
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
    }).format(amount);
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl flex items-center">
              <Building2Icon className="h-5 w-5 mr-2" />
              {accommodation.name}
            </DialogTitle>
            {accommodation.type && (
              <DialogDescription>
                {getAccommodationTypeLabel(accommodation.type)}
              </DialogDescription>
            )}
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            {/* Dates */}
            {(accommodation.check_in_date || accommodation.check_out_date) && (
              <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                {accommodation.check_in_date && (
                  <div className="flex items-center">
                    <CalendarIcon className="h-4 w-4 mr-2 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">Check-in</p>
                      <p className="text-sm">
                        {format(parseISO(accommodation.check_in_date), 'PPP')}
                      </p>
                    </div>
                  </div>
                )}
                
                {accommodation.check_out_date && (
                  <div className="flex items-center">
                    <CalendarIcon className="h-4 w-4 mr-2 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">Check-out</p>
                      <p className="text-sm">
                        {format(parseISO(accommodation.check_out_date), 'PPP')}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}
            
            <Separator />
            
            {/* Address and Map */}
            {accommodation.address && (
              <div className="space-y-2">
                <div className="flex items-start">
                  <MapPinIcon className="h-4 w-4 mr-2 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">Address</p>
                    <p className="text-sm">{accommodation.address}</p>
                  </div>
                </div>
                
                {accommodation.coordinates && (
                  <MapView
                    coordinates={accommodation.coordinates}
                    interactive={false}
                    height="200px"
                  />
                )}
              </div>
            )}
            
            <Separator />
            
            {/* Booking Details */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {accommodation.booking_reference && (
                <div className="flex items-start">
                  <TicketIcon className="h-4 w-4 mr-2 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">Booking Reference</p>
                    <p className="text-sm">{accommodation.booking_reference}</p>
                  </div>
                </div>
              )}
              
              {accommodation.contact_info && (
                <div className="flex items-start">
                  <PhoneIcon className="h-4 w-4 mr-2 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">Contact Information</p>
                    <p className="text-sm">{accommodation.contact_info}</p>
                  </div>
                </div>
              )}
            </div>
            
            {/* Cost */}
            {accommodation.cost !== null && (
              <div className="flex items-start">
                <DollarSignIcon className="h-4 w-4 mr-2 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm font-medium">Cost</p>
                  <p className="text-sm">
                    {formatCurrency(accommodation.cost, accommodation.currency)}
                  </p>
                </div>
              </div>
            )}
            
            {/* Notes */}
            {accommodation.notes && (
              <div className="flex items-start">
                <FileIcon className="h-4 w-4 mr-2 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm font-medium">Notes</p>
                  <p className="text-sm whitespace-pre-wrap">{accommodation.notes}</p>
                </div>
              </div>
            )}
            
            {/* Documents */}
            {accommodation.documents && accommodation.documents.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-medium flex items-center">
                  <FileIcon className="h-4 w-4 mr-2 text-muted-foreground" />
                  Documents
                </p>
                <div className="space-y-2 pl-6">
                  {accommodation.documents.map((doc, index) => (
                    <div key={index} className="flex items-center">
                      <FileIcon className="h-4 w-4 mr-2 text-muted-foreground" />
                      <a 
                        href={doc.url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-sm text-primary hover:underline flex items-center"
                      >
                        {doc.name}
                        <ExternalLinkIcon className="h-3 w-3 ml-1" />
                      </a>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
          
          <DialogFooter>
            {canEdit && (
              <>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowDeleteConfirm(true)}
                  disabled={loading}
                  className="sm:mr-auto"
                >
                  <TrashIcon className="h-4 w-4 mr-2" />
                  Delete
                </Button>
                
                <Button
                  type="button"
                  onClick={onEdit}
                  disabled={loading}
                >
                  <EditIcon className="h-4 w-4 mr-2" />
                  Edit
                </Button>
              </>
            )}
            
            <Button
              type="button"
              variant="secondary"
              onClick={onClose}
              disabled={loading}
            >
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
              This will permanently delete the accommodation "{accommodation.name}".
              This action cannot be undone.
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
