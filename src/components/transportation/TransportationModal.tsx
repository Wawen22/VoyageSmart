'use client';

import { useState, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { AppDispatch } from '@/lib/store';
import { Transportation, TransportationStop, addTransportation, updateTransportation } from '@/lib/features/transportationSlice';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { toast } from '@/components/ui/use-toast';
import {
  PlaneTakeoffIcon,
  TrainIcon,
  BusIcon,
  CarIcon,
  ShipIcon,
  MoreHorizontalIcon,
  MapPinIcon,
  FileIcon,
  XIcon
} from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { LazyMapView } from '@/components/LazyComponents';
import { uploadFile } from '@/lib/fileUpload';
// TransportationStopForm import removed temporarily
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';

interface TransportationModalProps {
  tripId: string;
  transportation?: Transportation | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function TransportationModal({
  tripId,
  transportation,
  isOpen,
  onClose
}: TransportationModalProps) {
  const dispatch = useDispatch<AppDispatch>();
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('basic');
  const [newFiles, setNewFiles] = useState<File[]>([]);
  const [uploadingFiles, setUploadingFiles] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    type: 'flight',
    provider: '',
    booking_reference: '',
    departure_time: '',
    departure_location: '',
    arrival_time: '',
    arrival_location: '',
    cost: '',
    currency: 'EUR',
    notes: '',
    status: 'confirmed',
  });

  const [departureCoordinates, setDepartureCoordinates] = useState<{ x: number; y: number } | null>(null);
  const [arrivalCoordinates, setArrivalCoordinates] = useState<{ x: number; y: number } | null>(null);
  const [documents, setDocuments] = useState<{ name: string; url: string; type: string }[]>([]);
  // Stops functionality removed temporarily

  // Initialize form data when transportation changes
  useEffect(() => {
    if (transportation) {
      setFormData({
        type: transportation.type,
        provider: transportation.provider || '',
        booking_reference: transportation.booking_reference || '',
        departure_time: transportation.departure_time ? new Date(transportation.departure_time).toISOString().slice(0, 16) : '',
        departure_location: transportation.departure_location || '',
        arrival_time: transportation.arrival_time ? new Date(transportation.arrival_time).toISOString().slice(0, 16) : '',
        arrival_location: transportation.arrival_location || '',
        cost: transportation.cost !== null ? transportation.cost.toString() : '',
        currency: transportation.currency,
        notes: transportation.notes || '',
        status: transportation.status || 'confirmed',
      });
      setDepartureCoordinates(transportation.departure_coordinates);
      setArrivalCoordinates(transportation.arrival_coordinates);
      setDocuments(transportation.documents || []);
    } else {
      resetForm();
    }
  }, [transportation, isOpen]);

  const resetForm = () => {
    setFormData({
      type: 'flight',
      provider: '',
      booking_reference: '',
      departure_time: '',
      departure_location: '',
      arrival_time: '',
      arrival_location: '',
      cost: '',
      currency: 'EUR',
      notes: '',
      status: 'confirmed',
    });
    setDepartureCoordinates(null);
    setArrivalCoordinates(null);
    setDocuments([]);
    setNewFiles([]);
    setActiveTab('basic');
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleDepartureLocationSelect = (coordinates: { x: number; y: number }) => {
    setDepartureCoordinates(coordinates);
  };

  const handleArrivalLocationSelect = (coordinates: { x: number; y: number }) => {
    setArrivalCoordinates(coordinates);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setNewFiles(Array.from(e.target.files));
    }
  };

  const handleRemoveDocument = (index: number) => {
    setDocuments((prev) => prev.filter((_, i) => i !== index));
  };

  const uploadFiles = async (): Promise<{ name: string; url: string; type: string }[]> => {
    if (newFiles.length === 0) return [];

    setUploadingFiles(true);
    try {
      console.log('Starting upload of', newFiles.length, 'files');

      // Always use the correct bucket name
      const uploadPromises = newFiles.map((file) =>
        uploadFile(file, 'trip-documents', `${tripId}/transportation`)
      );

      const uploadedFiles = await Promise.all(uploadPromises);
      console.log('Files uploaded successfully:', uploadedFiles);

      // Show success toast
      toast({
        title: 'Files uploaded',
        description: `Successfully uploaded ${uploadedFiles.length} files`,
        duration: 3000,
      });

      return uploadedFiles;
    } catch (error) {
      console.error('Error uploading files:', error);
      toast({
        title: 'Error uploading files',
        description: 'There was an error uploading your files. Some files may use placeholder URLs.',
        variant: 'destructive',
        duration: 5000,
      });

      // Return mock URLs for files to prevent UI from getting stuck
      return newFiles.map(file => ({
        name: file.name,
        url: `https://example.com/mock-file-url/${encodeURIComponent(file.name)}`,
        type: file.type
      }));
    } finally {
      setUploadingFiles(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setLoading(true);
    try {
      // Upload new files if any
      const uploadedFiles = await uploadFiles();
      const allDocuments = [...documents, ...uploadedFiles];

      // Prepare transportation data
      const transportationData: Partial<Transportation> = {
        trip_id: tripId,
        type: formData.type as any,
        provider: formData.provider || null,
        booking_reference: formData.booking_reference || null,
        departure_time: formData.departure_time || null,
        departure_location: formData.departure_location || null,
        departure_coordinates: departureCoordinates,
        arrival_time: formData.arrival_time || null,
        arrival_location: formData.arrival_location || null,
        arrival_coordinates: arrivalCoordinates,
        cost: formData.cost ? parseFloat(formData.cost) : null,
        currency: formData.currency,
        documents: allDocuments,
        notes: formData.notes || null,
        status: formData.status as any || null,
        // stops functionality removed temporarily
      };

      // Add or update transportation
      if (transportation) {
        await dispatch(updateTransportation({
          id: transportation.id,
          transportation: transportationData
        })).unwrap();

        toast({
          title: 'Transportation updated',
          description: 'The transportation has been successfully updated.',
        });
      } else {
        await dispatch(addTransportation(transportationData)).unwrap();

        toast({
          title: 'Transportation added',
          description: 'The transportation has been successfully added.',
        });
      }

      onClose();
    } catch (error) {
      console.error('Error saving transportation:', error);
      toast({
        title: 'Error',
        description: 'Failed to save transportation. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  // Stops functionality removed temporarily

  // Helper function removed - now using the imported uploadFile function from lib/fileUpload.ts

  const getTransportationTypeIcon = (type: string) => {
    switch (type) {
      case 'flight':
        return <PlaneTakeoffIcon className="h-5 w-5" />;
      case 'train':
        return <TrainIcon className="h-5 w-5" />;
      case 'bus':
        return <BusIcon className="h-5 w-5" />;
      case 'car':
        return <CarIcon className="h-5 w-5" />;
      case 'ferry':
        return <ShipIcon className="h-5 w-5" />;
      default:
        return <MoreHorizontalIcon className="h-5 w-5" />;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto  border-sky-500/20">
        {/* Modern Background Elements */}
        <div className="absolute inset-0 bg-gradient-to-br from-sky-500/5 via-transparent to-cyan-500/5 opacity-50 rounded-2xl"></div>
        <div className="absolute -top-12 -right-12 w-24 h-24 bg-sky-500/10 rounded-full blur-2xl opacity-50"></div>

        <DialogHeader className="relative z-10">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-sky-500/20 to-cyan-500/20 backdrop-blur-sm border border-white/20">
              <PlaneTakeoffIcon className="h-5 w-5 text-sky-500" />
            </div>
            <div>
              <DialogTitle className="text-xl font-bold">
                <span className="bg-gradient-to-r from-foreground via-sky-500 to-foreground bg-clip-text text-transparent">
                  {transportation ? 'Edit Transportation' : 'Add Transportation'}
                </span>
              </DialogTitle>
              <p className="text-sm text-muted-foreground mt-1">
                {transportation ? 'Update transportation details' : 'Add a new way to travel for your trip'}
              </p>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="relative z-10">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="glass-nav rounded-xl p-1 border border-white/20 grid w-full grid-cols-3">
              <TabsTrigger
                value="basic"
                className="rounded-lg data-[state=active]:bg-sky-500/20 data-[state=active]:text-sky-600 transition-all duration-300"
              >
                Basic Info
              </TabsTrigger>
              <TabsTrigger
                value="details"
                className="rounded-lg data-[state=active]:bg-sky-500/20 data-[state=active]:text-sky-600 transition-all duration-300"
              >
                Details
              </TabsTrigger>
              <TabsTrigger
                value="documents"
                className="rounded-lg data-[state=active]:bg-sky-500/20 data-[state=active]:text-sky-600 transition-all duration-300"
              >
                Documents
              </TabsTrigger>
            </TabsList>

            {/* Basic Info Tab */}
            <TabsContent value="basic" className="space-y-4 py-4">
              {/* Transportation Type */}
              <div className="space-y-2">
                <Label htmlFor="type">Transportation Type</Label>
                <Select
                  value={formData.type}
                  onValueChange={(value) => handleSelectChange('type', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="flight" className="flex items-center">
                      <div className="flex items-center">
                        <PlaneTakeoffIcon className="h-4 w-4 mr-2" />
                        Flight
                      </div>
                    </SelectItem>
                    <SelectItem value="train">
                      <div className="flex items-center">
                        <TrainIcon className="h-4 w-4 mr-2" />
                        Train
                      </div>
                    </SelectItem>
                    <SelectItem value="bus">
                      <div className="flex items-center">
                        <BusIcon className="h-4 w-4 mr-2" />
                        Bus
                      </div>
                    </SelectItem>
                    <SelectItem value="car">
                      <div className="flex items-center">
                        <CarIcon className="h-4 w-4 mr-2" />
                        Car
                      </div>
                    </SelectItem>
                    <SelectItem value="ferry">
                      <div className="flex items-center">
                        <ShipIcon className="h-4 w-4 mr-2" />
                        Ferry
                      </div>
                    </SelectItem>
                    <SelectItem value="other">
                      <div className="flex items-center">
                        <MoreHorizontalIcon className="h-4 w-4 mr-2" />
                        Other
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Provider */}
              <div className="space-y-2">
                <Label htmlFor="provider">Provider</Label>
                <Input
                  id="provider"
                  name="provider"
                  value={formData.provider}
                  onChange={handleChange}
                  placeholder="Airline, train company, etc."
                />
              </div>

              {/* Booking Reference */}
              <div className="space-y-2">
                <Label htmlFor="booking_reference">Booking Reference</Label>
                <Input
                  id="booking_reference"
                  name="booking_reference"
                  value={formData.booking_reference}
                  onChange={handleChange}
                  placeholder="Booking or ticket number"
                />
              </div>

              {/* Status */}
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) => handleSelectChange('status', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="confirmed">Confirmed</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </TabsContent>

            {/* Details Tab */}
            <TabsContent value="details" className="space-y-4 py-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Departure Section */}
                <div className="space-y-4">
                  <h3 className="font-medium text-lg">Departure</h3>

                  {/* Departure Time */}
                  <div className="space-y-2">
                    <Label htmlFor="departure_time">Departure Time</Label>
                    <Input
                      id="departure_time"
                      name="departure_time"
                      type="datetime-local"
                      value={formData.departure_time}
                      onChange={handleChange}
                    />
                  </div>

                  {/* Departure Location */}
                  <div className="space-y-2">
                    <Label htmlFor="departure_location">Departure Location</Label>
                    <Input
                      id="departure_location"
                      name="departure_location"
                      value={formData.departure_location}
                      onChange={handleChange}
                      placeholder="Airport, station, etc."
                    />
                  </div>

                  {/* Departure Map */}
                  <div className="space-y-2">
                    <Label className="flex items-center">
                      <MapPinIcon className="h-4 w-4 mr-1" />
                      Departure Location on Map
                      <span className="text-xs text-muted-foreground ml-2">
                        (Click on the map to set location)
                      </span>
                    </Label>
                    <LazyMapView
                      address={formData.departure_location}
                      coordinates={departureCoordinates}
                      interactive={true}
                      onLocationSelect={handleDepartureLocationSelect}
                    />
                  </div>
                </div>

                {/* Arrival Section */}
                <div className="space-y-4">
                  <h3 className="font-medium text-lg">Arrival</h3>

                  {/* Arrival Time */}
                  <div className="space-y-2">
                    <Label htmlFor="arrival_time">Arrival Time</Label>
                    <Input
                      id="arrival_time"
                      name="arrival_time"
                      type="datetime-local"
                      value={formData.arrival_time}
                      onChange={handleChange}
                    />
                  </div>

                  {/* Arrival Location */}
                  <div className="space-y-2">
                    <Label htmlFor="arrival_location">Arrival Location</Label>
                    <Input
                      id="arrival_location"
                      name="arrival_location"
                      value={formData.arrival_location}
                      onChange={handleChange}
                      placeholder="Airport, station, etc."
                    />
                  </div>

                  {/* Arrival Map */}
                  <div className="space-y-2">
                    <Label className="flex items-center">
                      <MapPinIcon className="h-4 w-4 mr-1" />
                      Arrival Location on Map
                      <span className="text-xs text-muted-foreground ml-2">
                        (Click on the map to set location)
                      </span>
                    </Label>
                    <LazyMapView
                      address={formData.arrival_location}
                      coordinates={arrivalCoordinates}
                      interactive={true}
                      onLocationSelect={handleArrivalLocationSelect}
                    />
                  </div>
                </div>
              </div>

              <Separator />

              {/* Cost */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="cost">Cost</Label>
                  <Input
                    id="cost"
                    name="cost"
                    type="number"
                    step="0.01"
                    value={formData.cost}
                    onChange={handleChange}
                    placeholder="0.00"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="currency">Currency</Label>
                  <Select
                    value={formData.currency}
                    onValueChange={(value) => handleSelectChange('currency', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="EUR">EUR (€)</SelectItem>
                      <SelectItem value="USD">USD ($)</SelectItem>
                      <SelectItem value="GBP">GBP (£)</SelectItem>
                      <SelectItem value="JPY">JPY (¥)</SelectItem>
                      <SelectItem value="CAD">CAD (C$)</SelectItem>
                      <SelectItem value="AUD">AUD (A$)</SelectItem>
                      <SelectItem value="CHF">CHF (Fr)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Notes */}
              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  name="notes"
                  value={formData.notes}
                  onChange={handleChange}
                  placeholder="Additional information"
                  rows={4}
                />
              </div>
            </TabsContent>

            {/* Stops Tab removed temporarily */}

            {/* Documents Tab */}
            <TabsContent value="documents" className="space-y-4 py-4">
              {/* File Upload */}
              <div className="space-y-2">
                <Label htmlFor="documents">Upload Documents</Label>
                <Input
                  id="documents"
                  type="file"
                  onChange={handleFileChange}
                  multiple
                  className="cursor-pointer"
                />
                <p className="text-xs text-muted-foreground">
                  Upload tickets, boarding passes, or other relevant documents.
                </p>
              </div>

              {/* Existing Documents */}
              {documents.length > 0 && (
                <div className="space-y-2">
                  <Label>Existing Documents</Label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {documents.map((doc, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-2 border rounded-md"
                      >
                        <div className="flex items-center overflow-hidden">
                          <FileIcon className="h-4 w-4 mr-2 flex-shrink-0" />
                          <span className="text-sm truncate">{doc.name}</span>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveDocument(index)}
                          className="h-8 w-8 p-0 text-destructive"
                        >
                          <span className="sr-only">Remove</span>
                          <XIcon className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* New Files */}
              {newFiles.length > 0 && (
                <div className="space-y-2">
                  <Label>Files to Upload</Label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {newFiles.map((file, index) => (
                      <div
                        key={index}
                        className="flex items-center p-2 border rounded-md"
                      >
                        <FileIcon className="h-4 w-4 mr-2" />
                        <span className="text-sm truncate">{file.name}</span>
                        <Badge variant="outline" className="ml-2 text-xs">
                          New
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </TabsContent>
          </Tabs>

          <DialogFooter className="relative z-10 pt-6 border-t border-white/10 mt-6">
            <div className="flex space-x-3 w-full sm:justify-end">
              <button
                type="button"
                onClick={onClose}
                disabled={loading || uploadingFiles}
                className="glass-button flex-1 sm:flex-none inline-flex items-center justify-center px-4 py-2 rounded-xl text-sm font-medium transition-all duration-300 hover:scale-105 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading || uploadingFiles}
                className="glass-button-primary flex-1 sm:flex-none inline-flex items-center justify-center px-4 py-2 rounded-xl text-sm font-medium transition-all duration-300 hover:scale-105 disabled:opacity-50"
              >
                {loading || uploadingFiles ? 'Saving...' : transportation ? 'Update' : 'Add'}
              </button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
