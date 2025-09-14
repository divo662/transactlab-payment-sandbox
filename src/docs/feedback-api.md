# Feedback API Documentation

## Overview
The Feedback API allows users to submit ratings and feedback about the TransactLab application, and provides admin functionality to manage and respond to feedback.

## Base URL
```
/api/v1/feedback
```

## Authentication
Most endpoints require authentication via Bearer token in the Authorization header:
```
Authorization: Bearer <your-jwt-token>
```

## Endpoints

### Public Endpoints

#### Get Public Feedback
```
GET /public
```
Retrieves publicly visible feedback with pagination and filtering.

**Query Parameters:**
- `page` (number, optional): Page number (default: 1)
- `limit` (number, optional): Items per page (default: 10)
- `category` (string, optional): Filter by category (bug, feature, improvement, general, other)
- `rating` (number, optional): Filter by rating (1-5)
- `sortBy` (string, optional): Sort by 'createdAt' or 'helpful' (default: 'createdAt')

**Response:**
```json
{
  "success": true,
  "data": {
    "feedback": [...],
    "pagination": {
      "current": 1,
      "pages": 5,
      "total": 50,
      "limit": 10
    }
  }
}
```

#### Get Feedback Statistics
```
GET /stats
```
Retrieves aggregated feedback statistics.

**Response:**
```json
{
  "success": true,
  "data": {
    "totalFeedback": 150,
    "averageRating": 4.2,
    "totalVotes": 300,
    "helpfulPercentage": 85.5,
    "statusBreakdown": {
      "pending": 10,
      "reviewed": 25,
      "resolved": 100,
      "closed": 15
    },
    "categoryBreakdown": {
      "bug": 20,
      "feature": 30,
      "improvement": 40,
      "general": 50,
      "other": 10
    },
    "ratingBreakdown": {
      "1": 5,
      "2": 10,
      "3": 20,
      "4": 50,
      "5": 65
    }
  }
}
```

### User Endpoints (Requires Authentication)

#### Submit Feedback
```
POST /
```
Submit new feedback and rating.

**Request Body:**
```json
{
  "rating": 5,
  "title": "Great app!",
  "message": "This app has been incredibly helpful for testing payments.",
  "category": "general",
  "priority": "medium",
  "tags": ["payment", "testing"],
  "isPublic": true
}
```

**Required Fields:**
- `rating` (number): Rating from 1-5
- `title` (string): Brief title (max 200 chars)
- `message` (string): Detailed message (max 2000 chars)

**Optional Fields:**
- `category` (string): bug, feature, improvement, general, other (default: general)
- `priority` (string): low, medium, high, urgent (default: medium)
- `tags` (array): Array of tag strings
- `isPublic` (boolean): Whether to show publicly (default: false)

#### Get User's Feedback
```
GET /my
```
Retrieve the authenticated user's feedback.

**Query Parameters:**
- `page` (number, optional): Page number (default: 1)
- `limit` (number, optional): Items per page (default: 10)
- `status` (string, optional): Filter by status
- `category` (string, optional): Filter by category

#### Get Feedback by ID
```
GET /:id
```
Retrieve specific feedback by ID (user can only view their own feedback).

#### Update Feedback
```
PUT /:id
```
Update user's own feedback (only if not resolved/closed).

**Request Body:**
```json
{
  "title": "Updated title",
  "message": "Updated message",
  "category": "feature",
  "isPublic": true
}
```

#### Vote on Feedback
```
POST /:id/vote
```
Vote on whether feedback is helpful (cannot vote on own feedback).

**Request Body:**
```json
{
  "helpful": true
}
```

### Admin Endpoints (Requires Admin Role)

#### Get All Feedback
```
GET /admin/all
```
Retrieve all feedback with admin filters.

**Query Parameters:**
- `page` (number, optional): Page number (default: 1)
- `limit` (number, optional): Items per page (default: 20)
- `status` (string, optional): Filter by status
- `category` (string, optional): Filter by category
- `priority` (string, optional): Filter by priority
- `rating` (number, optional): Filter by rating
- `search` (string, optional): Search in title, message, or email

#### Admin Update Feedback
```
PUT /admin/:id
```
Update feedback status, priority, add admin notes, or respond to feedback.

**Request Body:**
```json
{
  "status": "resolved",
  "priority": "high",
  "adminNotes": "Internal notes",
  "response": "Thank you for your feedback! We've implemented this feature."
}
```

## Data Models

### Feedback Object
```json
{
  "_id": "feedback_id",
  "userId": "user_id",
  "email": "user@example.com",
  "rating": 5,
  "title": "Great app!",
  "message": "Detailed feedback message",
  "category": "general",
  "status": "pending",
  "priority": "medium",
  "tags": ["payment", "testing"],
  "adminNotes": "Internal admin notes",
  "response": "Admin response to user",
  "respondedAt": "2024-01-15T10:30:00Z",
  "respondedBy": "admin_user_id",
  "isPublic": true,
  "helpful": 10,
  "notHelpful": 2,
  "totalVotes": 12,
  "helpfulPercentage": 83,
  "createdAt": "2024-01-15T09:00:00Z",
  "updatedAt": "2024-01-15T10:30:00Z"
}
```

## Error Responses

All endpoints return consistent error responses:

```json
{
  "success": false,
  "message": "Error description",
  "error": "Detailed error message"
}
```

Common HTTP status codes:
- `400` - Bad Request (validation errors)
- `401` - Unauthorized (missing/invalid token)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found (feedback not found)
- `500` - Internal Server Error
