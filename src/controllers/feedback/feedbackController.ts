import { Request, Response } from 'express';
import Feedback, { IFeedback } from '../../models/Feedback';
import { AuthenticatedRequest } from '../../utils/types/express';

// Create new feedback
export const createFeedback = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { rating, title, message, category, priority, tags, isPublic } = req.body;
    const userId = req.user?._id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
    }

    // Validate required fields
    if (!rating || !title || !message) {
      return res.status(400).json({
        success: false,
        message: 'Rating, title, and message are required'
      });
    }

    // Validate rating range
    if (rating < 1 || rating > 5 || !Number.isInteger(rating)) {
      return res.status(400).json({
        success: false,
        message: 'Rating must be an integer between 1 and 5'
      });
    }

    const feedback = new Feedback({
      userId,
      email: req.user?.email || '',
      rating,
      title: title.trim(),
      message: message.trim(),
      category: category || 'general',
      priority: priority || 'medium',
      tags: tags || [],
      isPublic: isPublic || false
    });

    await feedback.save();

    res.status(201).json({
      success: true,
      message: 'Feedback submitted successfully',
      data: feedback
    });
  } catch (error: any) {
    console.error('Error creating feedback:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create feedback',
      error: error.message
    });
  }
};

// Get user's feedback
export const getUserFeedback = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?._id;
    const { page = 1, limit = 10, status, category } = req.query;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
    }

    const query: any = { userId };
    
    if (status) {
      query.status = status;
    }
    
    if (category) {
      query.category = category;
    }

    const skip = (Number(page) - 1) * Number(limit);
    
    const [feedback, total] = await Promise.all([
      Feedback.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit))
        .populate('respondedBy', 'firstName lastName email'),
      Feedback.countDocuments(query)
    ]);

    res.json({
      success: true,
      data: {
        feedback,
        pagination: {
          current: Number(page),
          pages: Math.ceil(total / Number(limit)),
          total,
          limit: Number(limit)
        }
      }
    });
  } catch (error: any) {
    console.error('Error fetching user feedback:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch feedback',
      error: error.message
    });
  }
};

// Get public feedback (for public feedback page)
export const getPublicFeedback = async (req: Request, res: Response) => {
  try {
    const { page = 1, limit = 10, category, rating, sortBy = 'createdAt' } = req.query;

    const query: any = { isPublic: true };
    
    if (category) {
      query.category = category;
    }
    
    if (rating) {
      query.rating = Number(rating);
    }

    const skip = (Number(page) - 1) * Number(limit);
    const sortOrder = sortBy === 'helpful' ? { helpful: -1 as const, createdAt: -1 as const } : { createdAt: -1 as const };
    
    const [feedback, total] = await Promise.all([
      Feedback.find(query)
        .sort(sortOrder)
        .skip(skip)
        .limit(Number(limit))
        .select('rating title message category createdAt helpful notHelpful email priority tags status')
        .lean(), // Use lean() to avoid population issues
      Feedback.countDocuments(query)
    ]);

    // Transform the data to match frontend expectations
    const transformedFeedback = feedback.map(item => ({
      _id: item._id,
      title: item.title,
      message: item.message,
      category: item.category,
      priority: item.priority || 'medium',
      rating: item.rating,
      helpful: item.helpful || 0,
      notHelpful: item.notHelpful || 0,
      totalVotes: (item.helpful || 0) + (item.notHelpful || 0),
      helpfulPercentage: ((item.helpful || 0) + (item.notHelpful || 0)) > 0 ? Math.round(((item.helpful || 0) / ((item.helpful || 0) + (item.notHelpful || 0))) * 100) : 0,
      userEmail: item.email,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
      tags: item.tags || [],
      status: item.status || 'pending'
    }));

    res.json({
      success: true,
      data: transformedFeedback,
      pagination: {
        current: Number(page),
        pages: Math.ceil(total / Number(limit)),
        total,
        limit: Number(limit)
      }
    });
  } catch (error: any) {
    console.error('Error fetching public feedback:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch public feedback',
      error: error.message
    });
  }
};

// Get single feedback by ID
export const getFeedbackById = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?._id;

    const feedback = await Feedback.findById(id).populate('respondedBy', 'firstName lastName email');

    if (!feedback) {
      return res.status(404).json({
        success: false,
        message: 'Feedback not found'
      });
    }

    // Check if user can view this feedback (owner or admin)
    if (feedback.userId.toString() !== userId.toString() && req.user?.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    res.json({
      success: true,
      data: feedback
    });
  } catch (error: any) {
    console.error('Error fetching feedback:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch feedback',
      error: error.message
    });
  }
};

// Update feedback (user can only update their own)
export const updateFeedback = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?._id;
    const { title, message, category, isPublic } = req.body;

    const feedback = await Feedback.findById(id);

    if (!feedback) {
      return res.status(404).json({
        success: false,
        message: 'Feedback not found'
      });
    }

    // Check if user owns this feedback
    if (feedback.userId.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You can only update your own feedback'
      });
    }

    // Check if feedback can still be updated (not resolved or closed)
    if (feedback.status === 'resolved' || feedback.status === 'closed') {
      return res.status(400).json({
        success: false,
        message: 'Cannot update resolved or closed feedback'
      });
    }

    const updateData: any = {};
    if (title) updateData.title = title.trim();
    if (message) updateData.message = message.trim();
    if (category) updateData.category = category;
    if (typeof isPublic === 'boolean') updateData.isPublic = isPublic;

    const updatedFeedback = await Feedback.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    ).populate('respondedBy', 'firstName lastName email');

    res.json({
      success: true,
      message: 'Feedback updated successfully',
      data: updatedFeedback
    });
  } catch (error: any) {
    console.error('Error updating feedback:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update feedback',
      error: error.message
    });
  }
};

// Vote on feedback helpfulness
export const voteFeedback = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { helpful } = req.body; // true for helpful, false for not helpful
    const userId = req.user?._id;

    if (typeof helpful !== 'boolean') {
      return res.status(400).json({
        success: false,
        message: 'Helpful must be a boolean value'
      });
    }

    const feedback = await Feedback.findById(id);

    if (!feedback) {
      return res.status(404).json({
        success: false,
        message: 'Feedback not found'
      });
    }

    // Check if user can vote (not the author)
    if (feedback.userId.toString() === userId.toString()) {
      return res.status(400).json({
        success: false,
        message: 'You cannot vote on your own feedback'
      });
    }

    // For now, we'll just increment the counters
    // In a real app, you'd want to track individual votes to prevent multiple votes
    if (helpful) {
      feedback.helpful += 1;
    } else {
      feedback.notHelpful += 1;
    }

    await feedback.save();

    res.json({
      success: true,
      message: 'Vote recorded successfully',
      data: {
        helpful: feedback.helpful,
        notHelpful: feedback.notHelpful,
        totalVotes: (feedback as any).totalVotes,
        helpfulPercentage: (feedback as any).helpfulPercentage
      }
    });
  } catch (error: any) {
    console.error('Error voting on feedback:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to vote on feedback',
      error: error.message
    });
  }
};

// Admin: Get all feedback with filters
export const getAllFeedback = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { page = 1, limit = 20, status, category, priority, rating, search } = req.query;

    const query: any = {};
    
    if (status) query.status = status;
    if (category) query.category = category;
    if (priority) query.priority = priority;
    if (rating) query.rating = Number(rating);
    
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { message: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (Number(page) - 1) * Number(limit);
    
    const [feedback, total] = await Promise.all([
      Feedback.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit))
        .populate('userId', 'firstName lastName email')
        .populate('respondedBy', 'firstName lastName email'),
      Feedback.countDocuments(query)
    ]);

    res.json({
      success: true,
      data: {
        feedback,
        pagination: {
          current: Number(page),
          pages: Math.ceil(total / Number(limit)),
          total,
          limit: Number(limit)
        }
      }
    });
  } catch (error: any) {
    console.error('Error fetching all feedback:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch feedback',
      error: error.message
    });
  }
};

// Admin: Update feedback status and add response
export const adminUpdateFeedback = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { status, priority, adminNotes, response } = req.body;
    const adminId = req.user?._id;

    if (req.user?.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Admin access required'
      });
    }

    const updateData: any = {};
    if (status) updateData.status = status;
    if (priority) updateData.priority = priority;
    if (adminNotes) updateData.adminNotes = adminNotes;
    if (response) {
      updateData.response = response;
      updateData.respondedBy = adminId;
      updateData.respondedAt = new Date();
    }

    const updatedFeedback = await Feedback.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    ).populate('userId', 'firstName lastName email')
     .populate('respondedBy', 'firstName lastName email');

    if (!updatedFeedback) {
      return res.status(404).json({
        success: false,
        message: 'Feedback not found'
      });
    }

    res.json({
      success: true,
      message: 'Feedback updated successfully',
      data: updatedFeedback
    });
  } catch (error: any) {
    console.error('Error updating feedback (admin):', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update feedback',
      error: error.message
    });
  }
};

// Get feedback statistics
export const getFeedbackStats = async (req: Request, res: Response) => {
  try {
    const stats = await Feedback.aggregate([
      {
        $group: {
          _id: null,
          totalFeedback: { $sum: 1 },
          averageRating: { $avg: '$rating' },
          totalHelpful: { $sum: '$helpful' },
          totalNotHelpful: { $sum: '$notHelpful' },
          byStatus: {
            $push: {
              status: '$status',
              count: 1
            }
          },
          byCategory: {
            $push: {
              category: '$category',
              count: 1
            }
          },
          byRating: {
            $push: {
              rating: '$rating',
              count: 1
            }
          }
        }
      },
      {
        $project: {
          totalFeedback: 1,
          averageRating: { $round: ['$averageRating', 2] },
          totalVotes: { $add: ['$totalHelpful', '$totalNotHelpful'] },
          helpfulPercentage: {
            $cond: {
              if: { $gt: [{ $add: ['$totalHelpful', '$totalNotHelpful'] }, 0] },
              then: {
                $round: [
                  {
                    $multiply: [
                      { $divide: ['$totalHelpful', { $add: ['$totalHelpful', '$totalNotHelpful'] }] },
                      100
                    ]
                  },
                  2
                ]
              },
              else: 0
            }
          },
          statusBreakdown: {
            $reduce: {
              input: '$byStatus',
              initialValue: {},
              in: {
                $mergeObjects: [
                  '$$value',
                  {
                    $arrayToObject: [
                      [
                        {
                          k: '$$this.status',
                          v: { $sum: ['$$value.$$this.status', '$$this.count'] }
                        }
                      ]
                    ]
                  }
                ]
              }
            }
          },
          categoryBreakdown: {
            $reduce: {
              input: '$byCategory',
              initialValue: {},
              in: {
                $mergeObjects: [
                  '$$value',
                  {
                    $arrayToObject: [
                      [
                        {
                          k: '$$this.category',
                          v: { $sum: ['$$value.$$this.category', '$$this.count'] }
                        }
                      ]
                    ]
                  }
                ]
              }
            }
          },
          ratingBreakdown: {
            $reduce: {
              input: '$byRating',
              initialValue: {},
              in: {
                $mergeObjects: [
                  '$$value',
                  {
                    $arrayToObject: [
                      [
                        {
                          k: { $toString: '$$this.rating' },
                          v: { $sum: ['$$value.$$this.rating', '$$this.count'] }
                        }
                      ]
                    ]
                  }
                ]
              }
            }
          }
        }
      }
    ]);

    res.json({
      success: true,
      data: stats[0] || {
        totalFeedback: 0,
        averageRating: 0,
        totalVotes: 0,
        helpfulPercentage: 0,
        statusBreakdown: {},
        categoryBreakdown: {},
        ratingBreakdown: {}
      }
    });
  } catch (error: any) {
    console.error('Error fetching feedback stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch feedback statistics',
      error: error.message
    });
  }
};
