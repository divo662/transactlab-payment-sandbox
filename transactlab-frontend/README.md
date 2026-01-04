# TransactLab Frontend

A modern React-based frontend for the TransactLab payment gateway simulation platform.

## Features

### 🎨 **Redesigned Merchant Dashboard**
- **Primary Brand Color**: Uses `#0a164d` throughout the interface
- **Simulation Banner**: Clear indication that this is a demonstration environment
- **Tabbed Interface**: Three main sections:
  - **Dashboard Overview**: Quick stats, progress tracking, and recent activity
  - **Complete Setup**: Integrated onboarding wizard
  - **Analytics**: Performance metrics (coming soon)

### 🚀 **Integrated Merchant Onboarding**
The dashboard now includes a complete 5-step onboarding process:

1. **Business Profile** - Basic business information
2. **Business Address** - Location and contact details  
3. **Verification Documents** - Document upload and verification
4. **Payment Setup** - Currency and payment method configuration
5. **Payment Methods** - Payment gateway setup and configuration

### 🔧 **Key Components**

#### BusinessProfileForm
- Business name, type, industry selection
- Website, phone, and email fields
- Real-time validation and progress tracking

#### BusinessAddressForm
- Street address, city, state/province, country, postal code
- Dynamic state/county lists for Nigeria, Kenya, US, Canada, UK
- Address preview functionality

#### VerificationDocumentsForm
- Drag & drop file upload for business documents
- Support for Business License, Tax Certificate, and ID Document
- File validation (type, size) and preview
- Security notices and upload guidelines

#### PaymentSetupForm
- Multi-currency support (19+ currencies including African markets)
- Payment method selection (cards, bank transfer, mobile money, etc.)
- Default currency configuration
- Real-time validation and tips

#### PaymentMethodsForm
- Payment gateway configuration (Paystack, Flutterwave, Stripe, PayPal)
- API key and secret management
- Test/Live mode switching
- Webhook URL configuration
- Security reminders and best practices

### 🎯 **User Experience Features**
- **Step-by-step Navigation**: Clear progress indicators and validation
- **Back/Forward Navigation**: Users can move between steps
- **Real-time Validation**: Forms validate input as users type
- **Responsive Design**: Works on desktop and mobile devices
- **Consistent Branding**: Primary color `#0a164d` throughout
- **Interactive Elements**: Hover effects, transitions, and visual feedback

### 🔒 **Security Features**
- **Document Encryption**: Secure file upload and storage
- **API Key Management**: Secure handling of payment gateway credentials
- **Validation**: Comprehensive input validation and sanitization
- **Security Reminders**: Built-in security best practices guidance

## Technical Implementation

### State Management
- Uses React Context for merchant data and onboarding progress
- Local state management for form data and validation
- Integration with backend API services

### Form Validation
- Real-time validation with visual feedback
- Required field indicators
- Progress tracking across all steps

### Navigation
- Tab-based main navigation
- Step-by-step onboarding flow
- Breadcrumb-style progress indicators

### Styling
- Tailwind CSS for responsive design
- Shadcn UI components for consistency
- Custom color scheme based on primary brand color
- Glassmorphism and modern UI patterns

## Getting Started

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start development server:
   ```bash
   npm run dev
   ```

3. Access the application at `http://localhost:8081`

## File Structure

```
src/
├── components/
│   └── merchant/
│       └── MerchantDashboard.tsx          # Main dashboard component
├── pages/
│   └── merchant/
│       ├── BusinessProfileForm.tsx        # Step 1: Business profile
│       ├── BusinessAddressForm.tsx        # Step 2: Business address
│       ├── VerificationDocumentsForm.tsx  # Step 3: Document upload
│       ├── PaymentSetupForm.tsx           # Step 4: Payment configuration
│       └── PaymentMethodsForm.tsx         # Step 5: Gateway setup
└── contexts/
    └── MerchantContext.tsx                # Merchant data management
```

## Next Steps

- [ ] Backend API integration for onboarding data
- [ ] File upload service for verification documents
- [ ] Payment gateway testing and validation
- [ ] Analytics dashboard implementation
- [ ] User onboarding completion tracking
- [ ] Email notifications for onboarding progress

## Contributing

This is a demonstration project for TransactLab payment gateway simulation. All transactions are simulated and no real money is processed.
