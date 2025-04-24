import { useState, useEffect } from 'react';
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
import { Checkbox } from '@/components/ui/checkbox';
import { formatCurrency } from '@/lib/utils';

type Participant = {
  id: string;
  user_id: string;
  full_name: string;
};

type Expense = {
  id: string;
  category: string;
  amount: number;
  currency: string;
  date: string;
  description: string;
  paid_by: string;
  paid_by_name?: string;
  split_type: string;
  participants?: {
    user_id: string;
    amount: number;
    is_paid: boolean;
    full_name: string;
  }[];
};

type EditExpenseModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
  expense: Expense | null;
  participants: Participant[];
  currentUserId?: string;
  currency: string;
};

export default function EditExpenseModal({
  isOpen,
  onClose,
  onSubmit,
  expense,
  participants,
  currentUserId,
  currency
}: EditExpenseModalProps) {
  const [formData, setFormData] = useState({
    id: '',
    description: '',
    amount: '',
    date: new Date().toISOString().split('T')[0],
    category: 'other',
    paidBy: currentUserId || '',
    splitType: 'equal',
    participants: [] as string[],
  });

  // Reset form when modal opens and expense changes
  useEffect(() => {
    if (isOpen && expense) {
      setFormData({
        id: expense.id,
        description: expense.description || '',
        amount: expense.amount.toString(),
        date: expense.date,
        category: expense.category || 'other',
        paidBy: expense.paid_by,
        splitType: expense.split_type,
        participants: expense.participants 
          ? expense.participants.map(p => p.user_id)
          : participants.map(p => p.user_id),
      });
    }
  }, [isOpen, expense, participants, currentUserId]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleParticipantChange = (userId: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      participants: checked
        ? [...prev.participants, userId]
        : prev.participants.filter(id => id !== userId)
    }));
  };

  const handleSelectAllParticipants = () => {
    setFormData(prev => ({
      ...prev,
      participants: participants.map(p => p.user_id)
    }));
  };

  const handleDeselectAllParticipants = () => {
    setFormData(prev => ({
      ...prev,
      participants: []
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form
    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      alert('Please enter a valid amount');
      return;
    }
    
    if (!formData.date) {
      alert('Please select a date');
      return;
    }
    
    if (!formData.paidBy) {
      alert('Please select who paid');
      return;
    }
    
    if (formData.participants.length === 0) {
      alert('Please select at least one participant');
      return;
    }
    
    // Submit the form
    onSubmit({
      ...formData,
      currency
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl">Edit Expense</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6 py-4">
          <div className="space-y-4">
            <div>
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="What was this expense for?"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="amount">Amount</Label>
                <div className="relative">
                  <Input
                    id="amount"
                    name="amount"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.amount}
                    onChange={handleChange}
                    placeholder="0.00"
                    className="pl-8"
                    required
                  />
                  <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-muted-foreground">
                    {currency === 'EUR' ? '€' : currency === 'GBP' ? '£' : '$'}
                  </div>
                </div>
              </div>
              
              <div>
                <Label htmlFor="date">Date</Label>
                <Input
                  id="date"
                  name="date"
                  type="date"
                  value={formData.date}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>
            
            <div>
              <Label htmlFor="category">Category</Label>
              <Select
                value={formData.category}
                onValueChange={(value) => handleSelectChange('category', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="food">Food & Drinks</SelectItem>
                  <SelectItem value="accommodation">Accommodation</SelectItem>
                  <SelectItem value="transportation">Transportation</SelectItem>
                  <SelectItem value="activities">Activities</SelectItem>
                  <SelectItem value="shopping">Shopping</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="paidBy">Paid by</Label>
              <Select
                value={formData.paidBy}
                onValueChange={(value) => handleSelectChange('paidBy', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select who paid" />
                </SelectTrigger>
                <SelectContent>
                  {participants.map((participant) => (
                    <SelectItem key={participant.user_id} value={participant.user_id}>
                      {participant.full_name} {participant.user_id === currentUserId ? '(You)' : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="splitType">Split type</Label>
              <Select
                value={formData.splitType}
                onValueChange={(value) => handleSelectChange('splitType', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select split type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="equal">Equal</SelectItem>
                  {/* Custom split could be added in the future */}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <div className="flex items-center justify-between mb-2">
                <Label>Split with</Label>
                <div className="flex space-x-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleSelectAllParticipants}
                    className="h-7 px-2 text-xs"
                  >
                    Select All
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleDeselectAllParticipants}
                    className="h-7 px-2 text-xs"
                  >
                    Deselect All
                  </Button>
                </div>
              </div>
              
              <div className="space-y-2 max-h-40 overflow-y-auto border rounded-md p-2">
                {participants.map((participant) => (
                  <div key={participant.user_id} className="flex items-center space-x-2">
                    <Checkbox
                      id={`participant-${participant.user_id}`}
                      checked={formData.participants.includes(participant.user_id)}
                      onCheckedChange={(checked) => 
                        handleParticipantChange(participant.user_id, checked as boolean)
                      }
                    />
                    <Label
                      htmlFor={`participant-${participant.user_id}`}
                      className="text-sm cursor-pointer"
                    >
                      {participant.full_name} {participant.user_id === currentUserId ? '(You)' : ''}
                    </Label>
                  </div>
                ))}
              </div>
            </div>
            
            {formData.amount && formData.participants.length > 0 && (
              <div className="bg-primary/5 p-4 rounded-md">
                <p className="text-sm text-muted-foreground mb-2">
                  Split preview:
                </p>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Each person pays:</span>
                  <span className="font-medium">
                    {formatCurrency(
                      parseFloat(formData.amount) / formData.participants.length, 
                      currency
                    )}
                  </span>
                </div>
              </div>
            )}
          </div>
          
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit">Save Changes</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
