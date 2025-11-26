# NaCCER Research Portal - Backend API

Complete backend implementation for the NaCCER Research Proposal Management System.

## Features

- **Authentication & Authorization**: JWT-based authentication with role-based access control
- **User Management**: Multi-role user system (Admin, PI, CI, Committee Members, Reviewers)
- **Proposal Management**: Complete proposal lifecycle from draft to completion
- **Version Control**: Track all proposal versions with commit messages
- **Real-time Collaboration**: Yjs + Hocuspocus for collaborative editing
- **Comments & Chat**: Threaded comments, inline suggestions, and real-time chat
- **Reports**: Reviewer and committee reports with PDF generation
- **Workflow Management**: Status transitions, approvals, and rejections
- **File Storage**: Supabase S3 integration for documents and images
- **Email Notifications**: Automated emails for all major events
- **Activity Logging**: Comprehensive activity tracking for audit trails
- **AI Integration**: Mocked AI evaluation service (ready for integration)

## Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT (jsonwebtoken)
- **Real-time**: Socket.io + Hocuspocus/Yjs
- **Storage**: Supabase S3
- **Email**: Nodemailer
- **File Upload**: Multer

## Project Structure

```
server/
├── config/
│   └── db.js                 # MongoDB connection
├── controllers/
│   ├── authController.js     # Authentication endpoints
│   ├── userController.js     # User management
│   ├── proposalController.js # Proposal CRUD
│   ├── versionController.js  # Version control
│   ├── collaborationController.js # Collaboration & uploads
│   ├── commentController.js  # Comments & suggestions
│   ├── chatController.js     # Chat messages
│   ├── reportController.js   # Reports
│   └── workflowController.js # Workflow & status
├── middleware/
│   ├── auth.js              # JWT authentication
│   ├── authorize.js         # Role-based authorization
│   ├── errorHandler.js      # Error handling
│   └── upload.js            # File upload handling
├── models/
│   ├── User.js              # User schema
│   ├── Proposal.js          # Proposal schema
│   ├── ProposalVersion.js   # Version schema
│   ├── Comment.js           # Comment schema
│   ├── ChatMessage.js       # Chat schema
│   ├── Report.js            # Report schema
│   └── Activity.js          # Activity log schema
├── routes/
│   ├── authRoutes.js
│   ├── userRoutes.js
│   ├── proposalRoutes.js
│   ├── versionRoutes.js
│   ├── collaborationRoutes.js
│   ├── commentRoutes.js
│   ├── chatRoutes.js
│   ├── reportRoutes.js
│   └── workflowRoutes.js
├── services/
│   ├── emailService.js      # Email service
│   ├── storageService.js    # Supabase S3 service
│   └── aiService.js         # AI service (mocked)
├── utils/
│   ├── proposalIdGenerator.js # Generate proposal codes
│   └── activityLogger.js    # Activity logging utility
├── scripts/
│   ├── seedUsers.js         # Seed users
│   └── seedProposals.js     # Seed proposals
├── hocuspocus.js            # Hocuspocus collaboration server
├── server.js                # Main Express server
├── index.js                 # Entry point
└── package.json
```

## Installation

1. **Install dependencies**:
```bash
cd server
npm install
```

2. **Environment variables**: Create a `.env` file in the server directory with the following:

```env
# MongoDB
MONGODB_URI=your_mongodb_connection_string

# JWT
JWT_SECRET=your_jwt_secret_key
JWT_EXPIRES_IN=7d

# Server
PORT=5000
NODE_ENV=development
CLIENT_URL=http://localhost:3000

# Hocuspocus
HOCUSPOCUS_PORT=1234

# Email
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_email_password
SEND_REAL_EMAILS=false

# Supabase
SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_supabase_anon_key
```

3. **Seed the database**:
```bash
# Seed users
npm run seed:users

# Seed proposals
npm run seed:proposals

# Or seed both
npm run seed:all
```

## Running the Server

```bash
# Development (with auto-reload)
npm run dev

# Production
npm start

# Express server only (without Hocuspocus)
npm run server
```

The server will start on:
- **Express API**: http://localhost:5000
- **Hocuspocus WebSocket**: ws://localhost:1234

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login
- `GET /api/auth/me` - Get current user
- `POST /api/auth/logout` - Logout
- `PUT /api/auth/update-password` - Update password

### Users (Admin only)
- `GET /api/users` - List all users
- `POST /api/users` - Create user
- `GET /api/users/:userId` - Get user
- `PUT /api/users/:userId` - Update user
- `DELETE /api/users/:userId` - Delete user
- `PUT /api/users/:userId/roles` - Update roles
- `GET /api/users/:userId/activities` - Get activities

### Proposals
- `GET /api/proposals` - List proposals (filtered by role)
- `POST /api/proposals` - Create proposal
- `GET /api/proposals/:proposalId` - Get proposal
- `PUT /api/proposals/:proposalId` - Update proposal
- `DELETE /api/proposals/:proposalId` - Delete draft
- `POST /api/proposals/:proposalId/submit` - Submit proposal
- `GET /api/proposals/:proposalId/track` - Get timeline

### Versions
- `GET /api/proposals/:proposalId/versions` - List versions
- `GET /api/proposals/:proposalId/versions/:versionNumber` - Get version
- `POST /api/proposals/:proposalId/versions` - Create version
- `PUT /api/proposals/:proposalId/versions/:versionNumber/revert` - Revert version

### Collaboration
- `POST /api/collaboration/:proposalId/invite-ci` - Invite co-investigator
- `POST /api/collaboration/:proposalId/add-collaborator` - Add collaborator
- `POST /api/collaboration/upload/image` - Upload image
- `POST /api/collaboration/upload/document` - Upload document

### Comments
- `GET /api/proposals/:proposalId/comments` - List comments
- `POST /api/proposals/:proposalId/comments` - Add comment
- `POST /api/comments/:commentId/reply` - Reply to comment
- `PUT /api/comments/:commentId/resolve` - Resolve comment
- `PUT /api/comments/:commentId/unresolve` - Unresolve comment
- `PUT /api/comments/:commentId/read` - Mark as read

### Chat
- `GET /api/proposals/:proposalId/chat` - Get messages
- `POST /api/proposals/:proposalId/chat` - Send message
- `POST /api/proposals/:proposalId/chat/mark-all-read` - Mark all read
- `PUT /api/chat/:messageId/read` - Mark message read

### Reports
- `GET /api/proposals/:proposalId/reports` - List reports
- `GET /api/reports/:reportId` - Get report
- `POST /api/proposals/:proposalId/reports` - Create report
- `PUT /api/reports/:reportId` - Update report
- `POST /api/reports/:reportId/submit` - Submit report
- `DELETE /api/reports/:reportId` - Delete report

### Workflow
- `GET /api/workflow/dashboard/stats` - Get dashboard stats
- `PUT /api/workflow/:proposalId/status` - Update status
- `POST /api/workflow/:proposalId/assign-reviewer` - Assign reviewer
- `POST /api/workflow/:proposalId/request-clarification` - Request clarification

## User Roles

1. **SUPER_ADMIN**: Full system access, user management
2. **USER**: Normal users, can be PI or CI
3. **CMPDI_MEMBER**: CMPDI committee member
4. **TSSRC_MEMBER**: TSSRC committee member
5. **SSRC_MEMBER**: SSRC committee member
6. **EXPERT_REVIEWER**: External expert reviewer

## Proposal Status Flow

```
DRAFT → SUBMITTED → AI_EVALUATION → CMPDI_REVIEW
  ↓
CMPDI_EXPERT_REVIEW (optional)
  ↓
CMPDI_APPROVED / CMPDI_REJECTED
  ↓
TSSRC_REVIEW → TSSRC_APPROVED / TSSRC_REJECTED
  ↓
SSRC_REVIEW → SSRC_APPROVED / SSRC_REJECTED
  ↓
ACCEPTED → ONGOING → COMPLETED
```

## Testing

Test users are seeded with the following credentials:

| Role | Email | Password |
|------|-------|----------|
| Super Admin | bytespacesih@gmail.com | adminpass |
| User | user-bs@gmail.com | userpass |
| CMPDI Member | cmpdi-bs@gmail.com | cmpdipass |
| Expert Reviewer | expert-bs@gmail.com | expertpass |
| TSSRC Member | tssrc-bs@gmail.com | tssrcpass |
| SSRC Member | ssrc-bs@gmail.com | ssrcpass |

## Real-time Features

### Socket.io Events

**Client → Server:**
- `join-proposal` - Join proposal room
- `leave-proposal` - Leave proposal room
- `chat-message` - Send chat message
- `comment-added` - Comment added
- `status-changed` - Status changed

**Server → Client:**
- `user-joined` - User joined room
- `user-left` - User left room
- `new-chat-message` - New chat message
- `new-comment` - New comment
- `proposal-status-updated` - Status updated

### Hocuspocus (Yjs)

Connect to `ws://localhost:1234` with document name format: `proposal-{proposalId}`

Authentication via JWT token in connection params.

## Development Notes

- All passwords are hashed using bcryptjs
- JWT tokens expire in 7 days (configurable)
- Email sending can be disabled via `SEND_REAL_EMAILS=false`
- AI evaluation is mocked and returns after 2-second delay
- Auto-save triggers every 30 seconds for collaborative editing
- All file uploads go to Supabase S3 buckets: `images` and `proposal-files`
- Activity logs are created for all major actions

## Error Handling

The API uses consistent error response format:

```json
{
  "success": false,
  "message": "Error description",
  "errors": [] // Optional validation errors
}
```

Success responses:

```json
{
  "success": true,
  "message": "Success message",
  "data": {} // Response data
}
```

## Security

- All routes (except register/login) require JWT authentication
- Role-based authorization on sensitive endpoints
- Password hashing with bcrypt (10 rounds)
- CORS configured for specific client URL
- File upload size limit: 10MB
- Input validation on all endpoints
- SQL injection prevention via Mongoose

## License

Private - ByteSpace Team
