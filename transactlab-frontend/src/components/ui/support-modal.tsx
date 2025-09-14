import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useNavigate } from 'react-router-dom';
import { 
  AlertCircle,
  Zap,
  ThumbsUp,
  HelpCircle,
  ExternalLink,
  X
} from 'lucide-react';

interface SupportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const SupportModal: React.FC<SupportModalProps> = ({ isOpen, onClose }) => {
  const navigate = useNavigate();

  const categories = [
    { 
      id: 'bug', 
      label: 'Report a Bug', 
      description: 'Something isn\'t working as expected',
      icon: AlertCircle,
      iconColor: 'text-red-500'
    },
    { 
      id: 'feature', 
      label: 'Request a Feature', 
      description: 'Suggest a new feature or enhancement',
      icon: Zap,
      iconColor: 'text-blue-500'
    },
    { 
      id: 'improvement', 
      label: 'Improvement', 
      description: 'Suggest improvements to existing features',
      icon: ThumbsUp,
      iconColor: 'text-green-500'
    },
    { 
      id: 'general', 
      label: 'General Support', 
      description: 'General questions or support',
      icon: HelpCircle,
      iconColor: 'text-gray-500'
    }
  ];

  const handleCategorySelect = (categoryId: string) => {
    // Redirect to feedback page with pre-selected category
    navigate('/feedback');
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[95vh] overflow-hidden mx-2 sm:mx-4">
        <DialogHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-xl sm:text-2xl font-semibold">
                How can we help?
              </DialogTitle>
              <DialogDescription className="text-sm sm:text-base text-gray-600">
                Choose the type of support you need
              </DialogDescription>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-8 w-8 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        <div className="overflow-y-auto max-h-[calc(95vh-140px)]">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            {categories.map((category) => {
              const IconComponent = category.icon;
              return (
                <Card
                  key={category.id}
                  className="cursor-pointer transition-all duration-200 hover:shadow-lg hover:scale-[1.02] border border-gray-200 hover:border-[#0a164d]/30 bg-white"
                  onClick={() => handleCategorySelect(category.id)}
                >
                  <CardContent className="p-4 sm:p-6">
                    <div className="flex items-start gap-3 sm:gap-4">
                      <div className="p-2 sm:p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors">
                        <IconComponent className={`h-5 w-5 sm:h-6 sm:w-6 ${category.iconColor}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-base sm:text-lg mb-1 sm:mb-2 text-gray-900">{category.label}</h3>
                        <p className="text-xs sm:text-sm text-gray-600 leading-relaxed mb-2">{category.description}</p>
                        <div className="flex items-center text-xs text-[#0a164d] font-medium">
                          <ExternalLink className="h-3 w-3 mr-1" />
                          Go to Feedback Page
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SupportModal;