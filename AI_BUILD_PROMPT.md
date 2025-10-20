# AfriCreate - Complete Build Prompt

Build a comprehensive digital marketplace platform for African creators called "AfriCreate" with the following specifications:

## Project Overview
AfriCreate is an African-first digital marketplace empowering creators, educators, and coaches to monetize their expertise globally. The platform enables selling digital products, building subscription communities, and receiving fan support with local African payment options.

## Technology Stack
- **Frontend**: React 18 + TypeScript + Vite
- **Styling**: Tailwind CSS with custom design system
- **Backend**: Supabase (database, auth, storage, edge functions)
- **UI Components**: Shadcn UI library
- **Routing**: React Router DOM v6
- **State Management**: TanStack React Query
- **Icons**: Lucide React

## Design System

### Color Palette (HSL values in CSS variables)
**Light Mode:**
- Primary: Purple/violet gradient theme
- Secondary: Complementary accent colors
- Backgrounds: Light neutrals with subtle gradients
- Text: Dark grays for readability

**Dark Mode:**
- Primary: Bright purple/violet for contrast
- Backgrounds: Deep dark tones
- Text: Light colors for visibility

### Custom Gradients
- `gradient-hero`: Vibrant hero section gradient
- `gradient-card`: Subtle card background gradients
- `gradient-gold`: Premium gold gradient for special elements
- `gradient-primary`: Primary brand gradient
- `gradient-secondary`: Secondary accent gradient

### Shadows
- Custom elevation shadows with brand color tints
- Glow effects for interactive elements
- Smooth transitions on all interactive elements

## Pages & Routes

### 1. Home Page (`/`)
**Hero Section:**
- Large heading: "Empower Your Creativity, Monetize Your Passion"
- Subheading about African creators building businesses
- Hero image showcasing African creators
- CTA buttons: "Start Creating" (→ /signup) and "Explore Marketplace" (→ /marketplace)

**Benefits Section:**
Three columns highlighting:
- Digital Products: Sell courses, ebooks, templates, software
- Communities: Build subscription-based communities
- Direct Support: Receive one-time payments from fans

Each benefit card with icon, title, and description

**Testimonials Section:**
Display 3 creator testimonials with:
- Avatar with initials
- Name, role, and location
- 5-star ratings
- Testimonial text

**Footer:**
- Brand section with logo
- Platform links (Marketplace, Communities, Creator Dashboard)
- Support links (Help Center, Contact, FAQ)
- Social media links (Facebook, Twitter, Instagram, LinkedIn)
- Copyright notice

### 2. Login Page (`/login`)
- Email and password inputs
- "Sign In" button
- Link to signup page for new users
- Supabase authentication integration
- Navigate to dashboard on success
- Error toast notifications

### 3. Signup Page (`/signup`)
- Name, email, password, and confirm password fields
- Client-side validation (password match, minimum length)
- Supabase user creation
- Link to login for existing users
- Success/error toast notifications

### 4. Dashboard Page (`/dashboard`)
**Layout:**
- Navbar at top
- Tabs for switching between sections:
  - "My Products" tab
  - "My Communities" tab

**My Products Tab:**
- Product upload form with fields:
  - Title (text input)
  - Description (textarea)
  - Price (number input)
  - Category (select: Education, Business, Creative, Technology, Lifestyle)
  - Product Type (select: Course, Ebook, Template, Software, Other)
  - File upload (stored in Supabase storage bucket `product-files`)
- Grid display of user's products with:
  - Product title, description, price
  - Category and type badges
  - "View File" and "Delete" action buttons
- Real-time updates after CRUD operations

**My Communities Tab:**
- Community creation form:
  - Community Name
  - Description
  - Subscription Price (monthly)
  - Privacy setting (Public/Private toggle)
- Grid display of user's communities:
  - Name, description, price
  - Member count
  - Privacy status badge
  - "Edit" and "Delete" buttons
- Edit mode with inline form

### 5. Marketplace Page (`/marketplace`)
**Filters:**
- Search input (filter by title or creator name)
- Category dropdown (All, Education, Business, Creative, Technology, Lifestyle)

**Product Grid:**
Display static product cards with:
- Product image (course, ebook, template images)
- Title, creator name, price
- Category badge
- Product type indicator
- "Buy Now" button (opens PaymentModal)

**Sample Products:**
1. "Digital Marketing Masterclass" - Course by Sarah Johnson ($49.99)
2. "The Creator's Handbook" - Ebook by Michael Chen ($19.99)
3. "Social Media Templates Pack" - Template by Emma Williams ($29.99)

### 6. Communities Page (`/communities`)
Display grid of available communities:
- Community name and description
- Creator information
- Member count
- Monthly subscription price
- Privacy status
- "Join Community" button

### 7. Affiliate Page (`/affiliate`)
Affiliate program information page with:
- Program overview
- Commission structure
- Benefits for affiliates
- Sign-up CTA

## Key Components

### Navbar
- Logo/brand name linking to home
- Navigation links: Marketplace, Communities, Dashboard
- "Login" and "Sign Up" buttons (conditional based on auth state)
- Responsive mobile menu

### Footer
- Brand section
- Navigation columns (Platform, Support, Social)
- External links open in new tabs
- Consistent styling with design system

### PaymentModal
Dialog component displaying:
- Product name and amount
- Payment method selection:
  - Paystack (Nigeria, Ghana, South Africa)
  - Flutterwave (Pan-African)
  - M-Pesa (Kenya, Tanzania)
  - Bank Transfer
  - Credit/Debit Card
- Each option with icon and description
- "Pay Now" button (currently shows toast - integration pending)

### ProductUploadForm
Form for creating/uploading products:
- All product fields with validation
- File upload with Supabase Storage integration
- Success/error handling with toasts
- Form reset after successful upload

### CommunityCustomizeForm
Form for creating/editing communities:
- Community details fields
- Privacy toggle
- Save button with loading state
- Integration with Supabase communities table

### MyProducts & MyCommunities
Display and management components:
- Fetch user-specific data on mount
- Loading states with spinner
- Empty states with helpful messages
- Delete confirmation with toasts
- Responsive grid layouts

## Database Schema (Supabase)

### `products` table:
```sql
- id: uuid (primary key, auto-generated)
- user_id: uuid (references auth.users)
- title: text
- description: text
- price: numeric
- category: text
- type: text
- file_url: text (storage reference)
- created_at: timestamp with time zone
- updated_at: timestamp with time zone
```

### `communities` table:
```sql
- id: uuid (primary key, auto-generated)
- user_id: uuid (references auth.users)
- name: text
- description: text
- subscription_price: numeric
- is_private: boolean
- member_count: integer (default 0)
- created_at: timestamp with time zone
- updated_at: timestamp with time zone
```

### Storage Buckets:
- `product-files`: Private bucket for storing digital product files

### Row Level Security (RLS):
Enable RLS on all tables with policies:
- Users can read their own records
- Users can create their own records
- Users can update their own records
- Users can delete their own records
- Use `auth.uid()` for user identification

### Database Functions:
```sql
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;
```

Create triggers on products and communities tables to automatically update `updated_at` column.

## Authentication

### Configuration:
- Enable email/password authentication
- Auto-confirm email signups (for development)
- Disable anonymous sign-ups
- Enable leaked password protection

### User Flow:
1. User signs up with name, email, password
2. Account created automatically (no email verification in dev)
3. Redirect to dashboard
4. Session persists across page refreshes
5. Logout clears session and redirects to home

## Features & Functionality

### Product Management:
- Upload products with file storage
- Display user's products in dashboard
- Delete products with confirmation
- View uploaded files via signed URLs

### Community Management:
- Create communities with pricing
- Edit community details inline
- Delete communities with confirmation
- Track member counts

### Payment Integration (Placeholder):
- Modal shows payment options
- Currently displays toast with method selected
- Ready for integration with:
  - Paystack API
  - Flutterwave API
  - M-Pesa API

### File Storage:
- Upload files to Supabase Storage
- Generate signed URLs for secure access
- Store file references in database
- Handle upload errors gracefully

## UI/UX Requirements

### Responsive Design:
- Mobile-first approach
- Breakpoints: sm (640px), md (768px), lg (1024px), xl (1280px)
- Collapsible mobile navigation
- Stacked layouts on mobile, grid on desktop

### Interactions:
- Smooth transitions (300ms cubic-bezier)
- Hover effects on buttons and cards
- Loading spinners during async operations
- Toast notifications for user feedback
- Form validation with error messages

### Accessibility:
- Semantic HTML elements
- ARIA labels where needed
- Keyboard navigation support
- Focus states on interactive elements
- Alt text for all images

## SEO Optimizations

### Meta Tags (in index.html):
```html
- Title: "AfriCreate - Empowering African Creators to Monetize Globally"
- Description: "African-first digital marketplace for creators..."
- Keywords: "African creators, digital marketplace, online courses..."
- OG tags for social sharing
- Twitter card meta tags
- Canonical URL
```

### Content Structure:
- Single H1 per page
- Proper heading hierarchy (H1 → H2 → H3)
- Descriptive link text
- Image alt attributes with relevant keywords

## Error Handling

### Client-Side:
- Try-catch blocks around async operations
- Toast notifications for errors
- Graceful fallbacks for failed data fetches
- Form validation before submission

### Server-Side:
- Supabase error responses handled
- Authentication errors displayed to user
- Storage upload failures with retry option
- Database constraint violations caught

## Testing Checklist

### Authentication:
- [ ] Sign up with valid credentials
- [ ] Sign up with invalid email format
- [ ] Sign up with password mismatch
- [ ] Login with correct credentials
- [ ] Login with incorrect credentials
- [ ] Session persistence after refresh
- [ ] Logout functionality

### Products:
- [ ] Upload product with all fields
- [ ] Upload product with file
- [ ] View uploaded products
- [ ] Delete product
- [ ] Products filtered by user
- [ ] Empty state when no products

### Communities:
- [ ] Create community
- [ ] Edit community details
- [ ] Toggle privacy setting
- [ ] Delete community
- [ ] Communities filtered by user
- [ ] Empty state when no communities

### Marketplace:
- [ ] View all products
- [ ] Filter by category
- [ ] Search by title/creator
- [ ] Open payment modal
- [ ] Select payment method

### Responsive:
- [ ] Mobile navigation works
- [ ] Layouts adapt to screen size
- [ ] Forms usable on mobile
- [ ] Cards stack properly

## Additional Notes

### Environment Variables:
```
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_PUBLISHABLE_KEY=your_anon_key
VITE_SUPABASE_PROJECT_ID=your_project_id
```

### Deployment:
- Build command: `npm run build`
- Output directory: `dist`
- Node version: 18+
- Environment variables must be set in hosting platform

### Future Enhancements:
- Actual payment gateway integration
- Email notifications
- User profiles with avatars
- Product reviews and ratings
- Community chat/forums
- Affiliate tracking system
- Analytics dashboard
- Payout management
- Advanced search filters
- Product categories expansion

## Design Assets Included

### Images:
- `hero-african-creators.jpg`: Hero section image
- `product-course.jpg`: Course product thumbnail
- `product-ebook.jpg`: Ebook product thumbnail
- `product-template.jpg`: Template product thumbnail

### Fonts:
- System font stack for performance
- Font smoothing enabled

### Color Tokens:
All colors defined as CSS variables in `:root` and `.dark` for theme support

---

**Implementation Priority:**
1. Set up project structure and dependencies
2. Configure Supabase (database, auth, storage)
3. Implement authentication (signup, login)
4. Build database tables with RLS
5. Create core pages (Home, Dashboard, Marketplace)
6. Implement product upload and management
7. Add community features
8. Style with design system
9. Add responsive behavior
10. Test all user flows
11. Deploy to production

**Success Criteria:**
- Users can sign up and log in
- Users can upload and manage products
- Users can create and manage communities
- Marketplace displays all products with filtering
- All pages are responsive
- Design system is consistent throughout
- No console errors
- Smooth user experience with proper loading/error states
