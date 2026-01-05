# TransactLab - Developer Sandbox for Payment Testing

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue.svg)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18+-61dafb.svg)](https://reactjs.org/)

**TransactLab** is a comprehensive developer sandbox platform that simulates real payment gateways for testing, development, and learning purposes. Built specifically for developers who need to test payment integrations without the risk of real transactions or the complexity of setting up multiple payment gateway test environments.

## Important Note About Email Services

Email services are currently disabled in this project. This is a personal development project, and email functionality can be unreliable or may not work properly depending on the hosting environment, network configuration, or email service provider setup. 

To keep the project simple and avoid complications, all email-related features have been temporarily suspended. This means:

- Users are automatically verified upon registration (no email verification required)
- No verification emails are sent
- No notification emails are sent (new device alerts, payment receipts, etc.)
- All email functionality is bypassed to ensure smooth operation

If you need email functionality, you can re-enable it by modifying the `EMAIL_DISABLED` flag in `src/services/notification/emailService.ts` and configuring your preferred email service provider (SMTP, Resend, EmailJS, etc.). See the email setup guides in the project for configuration options.

## Current Status

- **Authentication System** - Complete user registration and login with security questions  
- **Sandbox Dashboard** - Full-featured testing environment  
- **API Key Management** - Generate and manage test API keys  
- **Webhook Simulation** - Real-time webhook testing and delivery  
- **Transaction Testing** - Complete payment flow simulation  
- **Customer Management** - Test customer data and profiles  
- **Product Management** - Sample product catalog for testing  
- **Session Management** - Checkout session simulation  
- **Subscription Testing** - Recurring payment simulation  
- **Modern UI/UX** - Responsive design with Tailwind CSS and shadcn/ui

## Transactlab Access for Demo

- **email** - infotezma@gmail.com
- **password** - Test12345!
- **questions answer** - dog

## Key Features

### **Developer Authentication & Security**
- **Multi-step Registration** - 5-step developer onboarding with personal info, contact details, password setup, security questions, and review
- **Security Questions** - Additional account protection with customizable security questions for developer accounts
- **Instant Account Activation** - Accounts are automatically verified upon registration (email verification disabled for simplicity)
- **Password Security** - Strong password requirements with real-time validation
- **Phone Validation** - International phone number support with country code validation
- **Rate Limiting** - IP-based rate limiting for registration (3 accounts per hour) and login (5 attempts per 15 minutes) to prevent abuse

### **API Testing & Management**
- **Canonical Redirect Contract** - Standardized session responses with absolute checkout URLs
- **Workspace-Bound Checkout** - Public `/checkout/:sessionId` route for secure customer access
- **Server-to-Server Auth** - Recommended `x-sandbox-secret` header for API calls
- **URL Resolution** - `GET /api/checkout-url/:sessionId` for stable checkout URL resolution
- Generate unlimited test API keys for different environments
- Simulate real payment gateway responses (success, failure, pending states)
- Test authentication and authorization flows
- Comprehensive API logging and debugging tools
- API key rotation and management

### **Webhook Simulation**
- Real-time webhook delivery testing with configurable endpoints
- Event simulation for all payment types (transactions, subscriptions, refunds)
- Retry logic and error handling testing
- Webhook payload customization and validation
- Delivery status tracking and monitoring

### **Payment Testing**
- **Checkout Sessions** - Complete payment flow simulation
- **Transaction Management** - Create, view, and manage test transactions
- **Subscription Testing** - Recurring payment simulation with different billing cycles
- **Refund Processing** - Test partial and full refund scenarios
- **Multiple Payment Methods** - Cards, bank transfers, mobile money, etc.

### **Customer & Product Management**
- Pre-generated customer profiles with realistic data
- Customer creation and management tools
- Sample product catalog for testing
- Product creation and pricing simulation
- Customer transaction history tracking

### **Sandbox Security**
- Zero risk testing environment with no real money involved
- Isolated testing instances per user
- Secure API key management and storage
- Data encryption and secure file handling
- Role-based access control

## Architecture

```
TransactLab/
├── Backend (Node.js + Express + TypeScript)
│   ├── Controllers/
│   │   ├── auth/              # Authentication & user management
│   │   ├── sandbox/           # Sandbox functionality
│   │   └── admin/             # Admin features
│   ├── Services/
│   │   ├── sandbox/           # Payment simulation logic
│   │   ├── auth/              # Authentication services
│   │   └── notification/      # Email/SMS services
│   ├── Models/
│   │   ├── User.ts            # User data model
│   │   ├── SandboxSession.ts  # Checkout sessions
│   │   ├── SandboxCustomer.ts # Test customers
│   │   └── SandboxTransaction.ts # Test transactions
│   └── Routes/
│       ├── auth/              # Authentication routes
│       ├── sandbox/           # Sandbox API routes
│       └── admin/             # Admin routes
├── Frontend (React + TypeScript + Tailwind + shadcn/ui)
│   ├── pages/
│   │   ├── auth/              # Login & registration
│   │   ├── sandbox/           # Sandbox dashboard
│   │   └── Dashboard.tsx      # Main dashboard
│   ├── components/
│   │   ├── layout/            # App layout & sidebar
│   │   ├── sandbox/           # Sandbox components
│   │   └── ui/                # Reusable UI components
│   ├── contexts/
│   │   ├── AuthContext.tsx    # Authentication state
│   │   └── SandboxContext.tsx # Sandbox state
│   └── hooks/                 # Custom React hooks
└── Documentation & Guides
```

## Quick Start

### Prerequisites
- Node.js 18+
- npm or yarn
- Git

### 1. Clone the Repository
```bash
git clone https://github.com/divo662/transactlab-payment-sandbox.git
cd transactlab-payment-sandbox
```

### 2. Install Dependencies
```bash
# Install backend dependencies
npm install

# Install frontend dependencies
cd transactlab-frontend
npm install
```

### 3. Environment Setup
```bash
# Copy environment template
cp env.example .env

# Configure your environment variables
# See env.example for required variables
```

### 4. Start Development Servers
```bash
# Start backend server (from root directory)
npm run dev

# Start frontend server (from transactlab-frontend directory)
cd transactlab-frontend
npm run dev
```

### 5. Access the Platform
- **Frontend**: http://localhost:8080
- **Backend API**: http://localhost:5000
- **API Documentation**: http://localhost:5000/docs

## User Interface

### **Modern Design System**
- **Primary Color**: `#0a164d` (Deep Blue) used consistently throughout
- **Typography**: Poppins font family for clean, modern readability
- **Components**: Built with shadcn/ui for consistency and accessibility
- **Responsive**: Mobile-first design that works on all devices
- **Glassmorphism**: Modern UI patterns with backdrop blur effects

### **Authentication Pages**
- **Registration**: 5-step developer onboarding with progress indicators
- **Login**: Secure authentication with security questions
- **Email Verification**: Account activation workflow
- **Password Reset**: Secure password recovery system

### **Developer Sandbox Dashboard**
- **Overview**: Sandbox statistics and recent testing activity
- **API Keys**: Generate and manage test API keys for different environments
- **Transactions**: Create and monitor simulated payment transactions
- **Customers**: Manage test customer data for payment testing
- **Products**: Sample product catalog for testing scenarios
- **Webhooks**: Configure and test webhook delivery simulation
- **Sessions**: Checkout session simulation and testing
- **Subscriptions**: Recurring payment simulation and testing

## Testing Your Integration

### 1. Generate API Keys
1. Navigate to `/sandbox/api-keys`
2. Create a new test API key
3. Use the key in your API requests

### 2. Configure Webhooks
1. Go to `/sandbox/webhooks`
2. Set your webhook endpoint URL
3. Test webhook delivery

### 3. Test Payment Flows
1. Use the checkout demo at `/checkout-demo`
2. Test different payment scenarios
3. Monitor webhook deliveries

### 4. Sample API Request
```bash
curl -X POST http://localhost:5000/api/v1/sandbox/transactions \
  -H "Authorization: Bearer YOUR_TEST_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 1000,
    "currency": "NGN",
    "payment_method": "card",
    "customer_email": "test@example.com",
    "description": "Test transaction"
  }'
```

## API Documentation

### Sandbox Endpoints

#### Create Test Transaction
```http
POST /api/v1/sandbox/transactions
Authorization: Bearer {api_key}
Content-Type: application/json

{
  "amount": 1000,
  "currency": "NGN",
  "payment_method": "card",
  "customer_email": "test@example.com",
  "description": "Test transaction"
}
```

#### Test Webhook
```http
POST /api/v1/sandbox/webhooks/test
Authorization: Bearer {api_key}
Content-Type: application/json

{
  "webhook_url": "https://your-endpoint.com/webhook",
  "event_type": "transaction.completed"
}
```

#### Get Sample Data
```http
GET /api/v1/sandbox/sample-data
Authorization: Bearer {api_key}
```

## Development

### Backend Project Structure
```
src/
├── controllers/
│   ├── auth/             # Authentication & user management
│   │   ├── authController.ts
│   │   └── userController.ts
│   ├── sandbox/          # Sandbox functionality
│   │   ├── sandboxController.ts
│   │   ├── sessionController.ts
│   │   └── webhookController.ts
│   └── admin/            # Admin features
├── services/
│   ├── sandbox/          # Payment simulation logic
│   ├── auth/             # Authentication services
│   └── notification/     # Email/SMS services
│       └── emailService.ts
├── models/
│   ├── User.ts           # User data model
│   ├── SandboxSession.ts # Checkout sessions
│   ├── SandboxCustomer.ts # Test customers
│   ├── SandboxTransaction.ts # Test transactions
│   └── SandboxTeam.ts    # Team management
├── middleware/
│   ├── auth/             # Authentication middleware
│   └── validation/       # Request validation
└── routes/
    ├── auth/             # Authentication routes
    ├── sandbox/          # Sandbox API routes
    └── admin/            # Admin routes
```

### Frontend Project Structure
```
transactlab-frontend/src/
├── pages/
│   ├── auth/             # Authentication pages
│   │   ├── Login.tsx
│   │   ├── Register.tsx
│   │   └── ForgotPassword.tsx
│   ├── sandbox/          # Sandbox pages
│   │   ├── SandboxOverview.tsx
│   │   ├── ApiKeyManagement.tsx
│   │   ├── TransactionManagement.tsx
│   │   └── WebhookManagement.tsx
│   └── Dashboard.tsx     # Main dashboard
├── components/
│   ├── layout/           # App layout components
│   │   ├── AppLayout.tsx
│   │   └── AppSidebar.tsx
│   ├── sandbox/          # Sandbox-specific components
│   └── ui/               # Reusable UI components
├── contexts/
│   ├── AuthContext.tsx   # Authentication state
│   └── SandboxContext.tsx # Sandbox state
├── hooks/                # Custom React hooks
├── lib/                  # Utility functions
└── types/                # TypeScript type definitions
```

### Adding New Payment Gateways
1. Create gateway-specific service in `src/services/sandbox/`
2. Implement gateway interface
3. Add gateway configuration
4. Update webhook simulation

### Testing
```bash
# Run backend tests
npm test

# Run frontend tests
cd transactlab-frontend
npm test

# Run e2e tests
npm run test:e2e
```

## Recent Updates

### **v1.0.0 - Current Release**
- Complete authentication system with 5-step registration
- Modern UI/UX with shadcn/ui components
- Comprehensive sandbox testing environment
- API key management and testing tools
- Webhook simulation and delivery testing
- Transaction and subscription testing
- Customer and product management
- Responsive design with Tailwind CSS
- TypeScript throughout for type safety
- Email verification and security features

### **Upcoming Features**
- Real-time collaboration tools
- Advanced analytics dashboard
- Team management and permissions
- Custom webhook templates
- API rate limiting simulation
- Integration with more payment gateways

## Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

### Development Workflow
1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Add tests for new functionality
5. Commit your changes (`git commit -m 'Add some amazing feature'`)
6. Push to the branch (`git push origin feature/amazing-feature`)
7. Open a Pull Request

### Code Style
- **TypeScript** for type safety and better development experience
- **ESLint** for code quality and consistency
- **Prettier** for code formatting
- **Conventional Commits** for clear commit messages
- **Component-based architecture** with React
- **Tailwind CSS** for styling
- **shadcn/ui** for consistent UI components

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

- **Documentation**: [docs.transactlab.dev](https://docs.transactlab.dev)
- **Issues**: [GitHub Issues](https://github.com/divo662/transactlab-payment-sandbox/issues)
- **Discussions**: [GitHub Discussions](https://github.com/divo662/transactlab-payment-sandbox/discussions)
- **Email**: support@transactlab.dev

## Quick Start - API Integration

### **Canonical Redirect Flow (Recommended)**

```javascript
// 1. Create a checkout session
const response = await fetch('/api/v1/sandbox/sessions', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'x-sandbox-secret': 'your-api-key' // Recommended for server-to-server
  },
  body: JSON.stringify({
    amount: 5000, // $50.00 in cents
    currency: 'USD',
    description: 'Test Payment',
    customerEmail: 'test@example.com',
    successUrl: 'https://yoursite.com/success',
    cancelUrl: 'https://yoursite.com/cancel'
  })
});

const { data } = await response.json();
// data.checkoutUrl is always an absolute URL
// data.sessionId for fallback resolution

// 2. Redirect customer to checkout
window.location.href = data.checkoutUrl;

// 3. Fallback: Resolve checkout URL if needed
const checkoutResponse = await fetch(`/api/v1/sandbox/checkout-url/${data.sessionId}`, {
  headers: { 'x-sandbox-secret': 'your-api-key' }
});
const { data: checkoutData } = await checkoutResponse.json();
// checkoutData.checkoutUrl is the final, workspace-safe URL
```

### **Workspace-Bound Checkout (Public Access)**

```javascript
// Customers can access checkout directly (no auth required)
// GET /checkout/:sessionId returns session data for rendering
const checkoutData = await fetch(`/checkout/${sessionId}`);
const session = await checkoutData.json();
// Use session.data for checkout page rendering
```

### **Server-to-Server Testing**

```javascript
// Process payment for testing (server auth required)
const processResponse = await fetch(`/api/v1/sandbox/sessions/${sessionId}/process-payment`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'x-sandbox-secret': 'your-api-key'
  },
  body: JSON.stringify({
    paymentMethod: 'card',
    cardDetails: { /* test card data */ }
  })
});
```

### **Error Transparency**

The API provides detailed error information to help with debugging:

```javascript
// 401 Unauthorized - Missing or invalid token
{
  "success": false,
  "error": "Unauthorized",
  "message": "User not authenticated",
  "cause": "INVALID_TOKEN: missing" // or "invalid_secret", "invalid_api_key"
}

// 403 Forbidden - Workspace mismatch
{
  "success": false,
  "error": "Forbidden",
  "message": "Session belongs to different workspace",
  "cause": "WORKSPACE_MISMATCH",
  "createdWorkspaceId": "user123",
  "checkoutWorkspaceId": "user456"
}

// 400 Bad Request - Validation errors
{
  "success": false,
  "error": "Bad Request",
  "message": "Validation failed",
  "fieldHints": ["missing amount", "invalid currency (must be string)"]
}
```

## Use Cases

### **For Developers**
- Test payment integrations before going live with real payment gateways
- Debug webhook handling and error scenarios in a safe environment
- Learn payment gateway APIs (Stripe, Paystack, Flutterwave) without risk
- Prototype new payment features and flows
- Validate payment integration logic and error handling
- Practice with different payment methods and currencies

### **For Development Teams**
- Collaborate on payment integration projects with shared test data
- Share test scenarios, API keys, and webhook configurations
- Train new developers on payment systems and APIs
- Document payment integration processes and best practices
- Quality assurance and comprehensive testing before production
- Standardize payment testing across different projects

### **For Learning & Education**
- Learn payment gateway integration without financial risk
- Understand webhook handling and retry mechanisms
- Practice with different payment scenarios (success, failure, pending)
- Study payment gateway response formats and error codes
- Experiment with subscription billing and recurring payments
- Master payment security and compliance requirements

## Acknowledgments

- Built with love for the developer community
- Inspired by the need for better payment testing tools
- Thanks to all contributors and users

---

**TransactLab** - Empowering developers to build better payment integrations through comprehensive testing and simulation.

*Built for developers, by developers.*
