import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import apiService from '@/lib/api';
import { 
  ThumbsUp, 
  ThumbsDown, 
  MessageCircle, 
  Calendar, 
  User, 
  Filter, 
  Search,
  Star,
  AlertCircle,
  Zap,
  HelpCircle,
  TrendingUp,
  Clock,
  Plus,
  Send,
  X
} from 'lucide-react';

interface PublicFeedback {
  _id: string;
  title: string;
  message: string;
  category: 'bug' | 'feature' | 'improvement' | 'general' | 'other';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  rating: number;
  helpful: number;
  notHelpful: number;
  totalVotes: number;
  helpfulPercentage: number;
  userEmail: string;
  createdAt: string;
  updatedAt: string;
  tags: string[];
  status: 'open' | 'in-progress' | 'resolved' | 'closed';
  response?: string;
  respondedAt?: string;
}

const Feedback: React.FC = () => {
  const [feedback, setFeedback] = useState<PublicFeedback[]>([]);
  const [loading, setLoading] = useState(true);
  const [voting, setVoting] = useState<string | null>(null);
  const [filter, setFilter] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    rating: 5,
    title: '',
    message: '',
    category: 'general' as 'bug' | 'feature' | 'improvement' | 'general' | 'other',
    priority: 'medium' as 'low' | 'medium' | 'high' | 'urgent',
    isPublic: true
  });
  const { toast } = useToast();
  const { user } = useAuth();

  const categoryIcons = {
    bug: AlertCircle,
    feature: Zap,
    improvement: TrendingUp,
    general: HelpCircle,
    other: MessageCircle
  };

  const categoryColors = {
    bug: 'bg-red-100 text-red-800 border-red-200',
    feature: 'bg-blue-100 text-blue-800 border-blue-200',
    improvement: 'bg-green-100 text-green-800 border-green-200',
    general: 'bg-gray-100 text-gray-800 border-gray-200',
    other: 'bg-purple-100 text-purple-800 border-purple-200'
  };

  const priorityColors = {
    low: 'bg-gray-100 text-gray-800',
    medium: 'bg-yellow-100 text-yellow-800',
    high: 'bg-orange-100 text-orange-800',
    urgent: 'bg-red-100 text-red-800'
  };

  const statusColors = {
    open: 'bg-green-100 text-green-800',
    'in-progress': 'bg-blue-100 text-blue-800',
    resolved: 'bg-gray-100 text-gray-800',
    closed: 'bg-red-100 text-red-800'
  };

  useEffect(() => {
    fetchFeedback();
  }, [filter, sortBy]);

  const fetchFeedback = async () => {
    try {
      setLoading(true);
      const response = await apiService.getPublicFeedback();
      if (response.success) {
        setFeedback(response.data || []);
      }
    } catch (error) {
      console.error('Error fetching feedback:', error);
      toast({
        title: 'Error',
        description: 'Failed to load feedback. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleVote = async (feedbackId: string, voteType: 'helpful' | 'notHelpful') => {
    if (!user) {
      toast({
        title: 'Login Required',
        description: 'Please log in to vote on feedback.',
        variant: 'destructive'
      });
      return;
    }

    try {
      setVoting(feedbackId);
      const response = await apiService.voteFeedback(feedbackId, voteType);
      
      if (response.success) {
        // Update local state
        setFeedback(prev => prev.map(item => 
          item._id === feedbackId 
            ? {
                ...item,
                helpful: response.data.helpful,
                notHelpful: response.data.notHelpful,
                totalVotes: response.data.totalVotes,
                helpfulPercentage: response.data.helpfulPercentage
              }
            : item
        ));
        
        toast({
          title: 'Vote Recorded',
          description: `Your ${voteType === 'helpful' ? 'positive' : 'negative'} vote has been recorded.`,
        });
      }
    } catch (error) {
      console.error('Error voting:', error);
      toast({
        title: 'Error',
        description: 'Failed to record your vote. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setVoting(null);
    }
  };

  const handleCreateFeedback = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast({
        title: 'Login Required',
        description: 'Please log in to submit feedback.',
        variant: 'destructive'
      });
      return;
    }

    if (!formData.title.trim() || !formData.message.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Please fill in all required fields.',
        variant: 'destructive'
      });
      return;
    }

    try {
      setIsSubmitting(true);
      const response = await apiService.createFeedback(formData);
      
      if (response.success) {
        toast({
          title: 'Feedback Submitted',
          description: 'Thank you for your feedback! It has been submitted successfully.',
        });
        
        // Reset form
        setFormData({
          rating: 5,
          title: '',
          message: '',
          category: 'general',
          priority: 'medium',
          isPublic: true
        });
        setShowCreateForm(false);
        
        // Refresh feedback list
        fetchFeedback();
      }
    } catch (error) {
      console.error('Error creating feedback:', error);
      toast({
        title: 'Error',
        description: 'Failed to submit feedback. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStars = (rating: number, interactive: boolean = false, onRatingChange?: (rating: number) => void) => {
    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type={interactive ? "button" : undefined}
            onClick={interactive && onRatingChange ? () => onRatingChange(star) : undefined}
            className={`${
              interactive ? 'cursor-pointer hover:scale-110 transition-transform' : 'cursor-default'
            }`}
          >
            <Star
              className={`h-4 w-4 ${
                star <= rating ? 'text-yellow-400 fill-current' : 'text-gray-300'
              }`}
            />
          </button>
        ))}
      </div>
    );
  };

  const filteredFeedback = feedback.filter(item => {
    const matchesFilter = filter === 'all' || item.category === filter;
    const matchesSearch = searchTerm === '' || 
      item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.message.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const sortedFeedback = [...filteredFeedback].sort((a, b) => {
    switch (sortBy) {
      case 'newest':
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      case 'oldest':
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      case 'most-voted':
        return b.totalVotes - a.totalVotes;
      case 'highest-rated':
        return b.rating - a.rating;
      case 'priority':
        const priorityOrder = { urgent: 4, high: 3, medium: 2, low: 1 };
        return priorityOrder[b.priority] - priorityOrder[a.priority];
      default:
        return 0;
    }
  });


  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#0a164d]"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      {/* Header */}
      <div className="mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Community Feedback</h1>
            <p className="text-gray-600">
              Share your ideas, report issues, and help improve TransactLab together.
            </p>
          </div>
          <Button
            onClick={() => setShowCreateForm(!showCreateForm)}
            className="bg-[#0a164d] hover:bg-[#0a164d]/90 text-white"
          >
            <Plus className="h-4 w-4 mr-2" />
            {showCreateForm ? 'Cancel' : 'Submit Feedback'}
          </Button>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="mb-6 space-y-4 sm:space-y-0 sm:flex sm:items-center sm:justify-between sm:gap-4">
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search feedback..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Category Filter */}
          <Select value={filter} onValueChange={setFilter}>
            <SelectTrigger className="w-full sm:w-48">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              <SelectItem value="bug">Bugs</SelectItem>
              <SelectItem value="feature">Features</SelectItem>
              <SelectItem value="improvement">Improvements</SelectItem>
              <SelectItem value="general">General</SelectItem>
              <SelectItem value="other">Other</SelectItem>
            </SelectContent>
          </Select>

          {/* Sort */}
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Newest First</SelectItem>
              <SelectItem value="oldest">Oldest First</SelectItem>
              <SelectItem value="most-voted">Most Voted</SelectItem>
              <SelectItem value="highest-rated">Highest Rated</SelectItem>
              <SelectItem value="priority">Priority</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Create Feedback Form */}
      {showCreateForm && (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageCircle className="h-5 w-5" />
              Submit New Feedback
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreateFeedback} className="space-y-6">
              {/* Rating */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Rate your experience</Label>
                <div className="flex items-center gap-2">
                  {renderStars(formData.rating, true, (rating) => setFormData(prev => ({ ...prev, rating })))}
                  <span className="text-sm text-gray-600">
                    {formData.rating} star{formData.rating !== 1 ? 's' : ''}
                  </span>
                </div>
              </div>

              {/* Title */}
              <div className="space-y-2">
                <Label htmlFor="title" className="text-sm font-medium">
                  Title <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Brief description of your feedback"
                  className="text-sm"
                  maxLength={200}
                  required
                />
                <p className="text-xs text-gray-500">{formData.title.length}/200 characters</p>
              </div>

              {/* Message */}
              <div className="space-y-2">
                <Label htmlFor="message" className="text-sm font-medium">
                  Detailed Message <span className="text-red-500">*</span>
                </Label>
                <Textarea
                  id="message"
                  value={formData.message}
                  onChange={(e) => setFormData(prev => ({ ...prev, message: e.target.value }))}
                  placeholder="Please provide as much detail as possible..."
                  className="text-sm min-h-[120px] resize-none"
                  maxLength={2000}
                  required
                />
                <p className="text-xs text-gray-500">{formData.message.length}/2000 characters</p>
              </div>

              {/* Category and Priority */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="category" className="text-sm font-medium">Category</Label>
                  <Select
                    value={formData.category}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, category: value as any }))}
                  >
                    <SelectTrigger className="text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="bug">Bug Report</SelectItem>
                      <SelectItem value="feature">Feature Request</SelectItem>
                      <SelectItem value="improvement">Improvement</SelectItem>
                      <SelectItem value="general">General</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="priority" className="text-sm font-medium">Priority</Label>
                  <Select
                    value={formData.priority}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, priority: value as any }))}
                  >
                    <SelectTrigger className="text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low - Nice to have</SelectItem>
                      <SelectItem value="medium">Medium - Standard priority</SelectItem>
                      <SelectItem value="high">High - Important</SelectItem>
                      <SelectItem value="urgent">Urgent - Critical issue</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Public visibility */}
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="isPublic"
                  checked={formData.isPublic}
                  onChange={(e) => setFormData(prev => ({ ...prev, isPublic: e.target.checked }))}
                  className="h-4 w-4 text-[#0a164d] focus:ring-[#0a164d] border-gray-300 rounded"
                />
                <Label htmlFor="isPublic" className="text-sm text-gray-700">
                  Make this feedback public (others can see and vote on it)
                </Label>
              </div>

              {/* Action buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowCreateForm(false)}
                  className="text-sm"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting || !formData.title.trim() || !formData.message.trim()}
                  className="text-sm bg-[#0a164d] hover:bg-[#0a164d]/90"
                >
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Submitting...
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4 mr-2" />
                      Submit Feedback
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Feedback List */}
      <div className="space-y-4">
        {sortedFeedback.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <MessageCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No feedback found</h3>
              <p className="text-gray-600">
                {searchTerm || filter !== 'all' 
                  ? 'Try adjusting your search or filter criteria.'
                  : 'Be the first to share feedback with the community!'
                }
              </p>
            </CardContent>
          </Card>
        ) : (
          sortedFeedback.map((item) => {
            const CategoryIcon = categoryIcons[item.category];
            return (
              <Card key={item._id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <CategoryIcon className="h-4 w-4 text-gray-600" />
                        <Badge className={categoryColors[item.category]}>
                          {item.category}
                        </Badge>
                        <Badge className={priorityColors[item.priority]}>
                          {item.priority}
                        </Badge>
                        <Badge className={statusColors[item.status]}>
                          {item.status}
                        </Badge>
                      </div>
                      <CardTitle className="text-lg mb-2">{item.title}</CardTitle>
                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        <div className="flex items-center gap-1">
                          <User className="h-4 w-4" />
                          <span>{item.userEmail}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          <span>{formatDate(item.createdAt)}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          {renderStars(item.rating)}
                          <span>({item.rating}/5)</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="pt-0">
                  <p className="text-gray-700 mb-4 leading-relaxed">{item.message}</p>

                  {/* Voting Section */}
                  <div className="flex items-center justify-between pt-4 border-t">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleVote(item._id, 'helpful')}
                          disabled={voting === item._id}
                          className="text-green-600 hover:text-green-700 hover:bg-green-50"
                        >
                          <ThumbsUp className="h-4 w-4 mr-1" />
                          Helpful ({item.helpful})
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleVote(item._id, 'notHelpful')}
                          disabled={voting === item._id}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <ThumbsDown className="h-4 w-4 mr-1" />
                          Not Helpful ({item.notHelpful})
                        </Button>
                      </div>
                      <div className="text-sm text-gray-600">
                        {item.totalVotes} total votes • {item.helpfulPercentage}% helpful
                      </div>
                    </div>
                  </div>

                  {/* Admin Response */}
                  {item.response && (
                    <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <Clock className="h-4 w-4 text-blue-600" />
                        <span className="text-sm font-medium text-blue-900">Admin Response</span>
                        <span className="text-xs text-blue-600">
                          {item.respondedAt && formatDate(item.respondedAt)}
                        </span>
                      </div>
                      <p className="text-sm text-blue-800">{item.response}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
};

export default Feedback;
