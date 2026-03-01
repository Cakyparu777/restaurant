System Architecture prompt:
Act as a senior full-stack SaaS architect.

I want to build a multi-tenant SaaS platform for restaurants.

Core concept:
Restaurants can create their own digital menu and receive online orders via QR code or link.

Tech stack:
- Frontend: Next.js 14 (App Router, TypeScript)
- Backend: FastAPI
- Database: PostgreSQL
- Auth: JWT
- Deployment: Docker-based
- Payment integration later

Requirements:

1. Multi-tenant architecture:
Each restaurant must have isolated data.
Use restaurant_id in all tables.

2. Roles:
- Platform Admin
- Restaurant Owner
- Restaurant Staff
- Customer (no login required)

3. Features for Restaurant:
- Create categories (Drinks, Main dishes, etc.)
- Create menu items (image, price, description, availability)
- Enable/disable items
- Real-time order dashboard
- Change order status (pending, preparing, completed)
- Promotion support (discount %)

4. Customer Side:
- View digital menu
- Add to cart
- Place order
- Select table number
- See order status

5. Admin Dashboard:
- See all restaurants
- Subscription status
- Activate/deactivate restaurant

6. Database schema:
Design normalized schema.
Include:
- restaurants
- users
- categories
- menu_items
- orders
- order_items
- subscriptions

7. Include API route structure.
8. Suggest folder structure for both frontend and backend.
9. Suggest Docker setup.
10. Prepare for Stripe integration later.

Write production-ready architecture explanation.


UI/UX PROMPT:
Design a modern, minimal SaaS UI for restaurant digital ordering.

Style:
- Clean
- Mobile-first
- Similar to Uber Eats / modern POS
- Soft shadows
- Rounded 2xl corners
- Smooth animations

Pages:
1. Restaurant Dashboard
2. Order Management Board (Kanban style)
3. Menu Management
4. Customer Menu (mobile optimized)
5. QR scan page

Use TailwindCSS.
Focus on UX clarity.
No clutter.
High conversion.

Additional requirements:
Design this as a scalable SaaS startup product.

Include:
- Multi-tenant database best practices
- Indexing strategy
- Performance optimization
- Security (rate limiting, input validation)
- Caching strategy
- Real-time updates (WebSockets)

Assume 100 restaurants.
Explain scaling strategy.
