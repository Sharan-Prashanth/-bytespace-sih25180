# Frontend-Backend Integration Guide

## Completed Integrations

### 1. Status Configuration ✓
- Updated `statusConfig.js` to match backend enum values
- Changed status values from lowercase to UPPERCASE
- Aligned STATUS_CONFIG with backend workflow

### 2. API Utilities ✓
- Created `proposalApi.js` with all proposal endpoints
- Created `workflowApi.js` for workflow and dashboard
- Created `userApi.js` for user management
- Created `socket.js` for Socket.io real-time features

### 3. Authentication ✓
- Updated AuthContext to handle backend response structure (`data.data.user`)
- Updated login/register to work with new API response format
- Fixed auto-login check for JWT token validation

### 4. Profile Page ✓
- Updated to use `/api/users/:userId` endpoint
- Fixed form submission to match backend User schema

### 5. Dashboard ✓
- Updated to use `/api/proposals` endpoint
- Added data transformation for backend response
- Added `getStageOwner` helper function

### 6. Create Proposal Page ✓
- Updated loadExistingDraft to use `/api/proposals?status=DRAFT`
- Updated autoSaveDraft to use POST/PUT `/api/proposals`
- Updated handleAutoSave to save forms as Plate.js content
- Updated handleSubmit to use `/api/proposals/:id/submit`
- Updated uploadImagesToS3 to use `/api/collaboration/upload/image`
- Added apiClient import

### 7. View Proposal Page ✓
- Updated to use `/api/proposals/:id` endpoint
- Fixed response data structure handling

### 8. Track Proposal Page ✓
- Added apiClient and proposalApi imports
- Ready to integrate with `/api/proposals/:id/track` endpoint

## Remaining Integrations Needed

### 9. Collaborate Page (Priority: HIGH)

**File**: `client/src/pages/proposal/collaborate/[id].jsx`

**Required Changes**:

1. **Load Proposal Data**:
   ```javascript
   // Replace mock data fetch with:
   const response = await apiClient.get(`/api/proposals/${id}`);
   const proposalData = response.data.data.proposal;
   ```

2. **Socket.io Integration**:
   ```javascript
   import { initializeSocket, joinProposalRoom, leaveProposalRoom, onNewChatMessage, onNewComment, onUserJoined, onUserLeft } from '../../../utils/socket';
   
   useEffect(() => {
     const socket = initializeSocket();
     joinProposalRoom(id);
     
     onNewChatMessage((data) => {
       // Add message to state
     });
     
     onNewComment((data) => {
       // Add comment to state
     });
     
     return () => {
       leaveProposalRoom(id);
     };
   }, [id]);
   ```

3. **Comments Integration**:
   ```javascript
   import { getComments, addComment, replyToComment, resolveComment } from '../../../utils/proposalApi';
   
   // Load comments
   const loadComments = async () => {
     const response = await getComments(id);
     setComments(response.data.comments);
   };
   
   // Add comment
   const handleAddComment = async (commentData) => {
     await addComment(id, commentData);
     loadComments();
   };
   ```

4. **Chat Integration**:
   ```javascript
   import { getChatMessages, sendChatMessage } from '../../../utils/proposalApi';
   import { emitChatMessage } from '../../../utils/socket';
   
   // Load chat
   const loadChat = async () => {
     const response = await getChatMessages(id);
     setMessages(response.data.messages);
   };
   
   // Send message
   const handleSendMessage = async (message) => {
     const response = await sendChatMessage(id, message);
     emitChatMessage({ proposalId: id, message: response.data.message });
     loadChat();
   };
   ```

5. **Collaboration Invites**:
   ```javascript
   import { inviteCoInvestigator } from '../../../utils/proposalApi';
   
   const handleInvite = async (email) => {
     await inviteCoInvestigator(id, email);
     // Show success message
   };
   ```

### 10. Review Page (Priority: HIGH)

**File**: `client/src/pages/proposal/review/[id].jsx`

**Required Changes**:

1. **Load Proposal for Review**:
   ```javascript
   const response = await apiClient.get(`/api/proposals/${id}`);
   const proposalData = response.data.data.proposal;
   ```

2. **Submit Review/Report**:
   ```javascript
   import { createReport, updateReport, submitReport } from '../../../utils/proposalApi';
   
   // Create draft report
   const handleCreateReport = async (reportData) => {
     const response = await createReport(id, {
       content: reportData, // Plate.js content
       reportType: 'EXPERT_REVIEW', // or COMMITTEE_REVIEW
       version: proposalData.currentVersion
     });
     setReportId(response.data.data.report._id);
   };
   
   // Submit report
   const handleSubmitReport = async () => {
     await submitReport(reportId);
     // Backend generates PDF automatically
   };
   ```

3. **Status Updates** (for committee members):
   ```javascript
   import { updateProposalStatus, requestClarification } from '../../../utils/workflowApi';
   
   const handleStatusChange = async (newStatus, notes) => {
     await updateProposalStatus(id, {
       status: newStatus,
       notes: notes
     });
   };
   
   const handleRequestClarification = async (message) => {
     await requestClarification(id, {
       message: message,
       formName: 'formI' // optional
     });
   };
   ```

### 11. Hocuspocus (Yjs) Integration for Real-time Collaboration

**For Collaborative Editing** (if using Yjs/Hocuspocus):

```javascript
// In AdvancedProposalEditor.jsx or collaborate page

import { HocuspocusProvider } from '@hocuspocus/provider';
import * as Y from 'yjs';

// Initialize Yjs document
const ydoc = new Y.Doc();

// Connect to Hocuspocus server
const provider = new HocuspocusProvider({
  url: 'ws://localhost:1234',
  name: `proposal-${proposalId}`,
  document: ydoc,
  token: localStorage.getItem('token')
});

// Use ydoc with Plate.js editor for collaborative editing
```

## Backend Response Structure Reference

All backend responses follow this structure:

```json
{
  "success": true,
  "message": "Success message",
  "data": {
    "proposal": { /* proposal object */ },
    "user": { /* user object */ },
    "comments": [ /* array */ ],
    // etc.
  }
}
```

Error responses:

```json
{
  "success": false,
  "message": "Error message",
  "errors": [ /* validation errors */ ]
}
```

## Key Backend Endpoints

### Proposals
- `GET /api/proposals` - List proposals (role-filtered)
- `POST /api/proposals` - Create draft
- `GET /api/proposals/:id` - Get proposal
- `PUT /api/proposals/:id` - Update draft
- `POST /api/proposals/:id/submit` - Submit for review
- `GET /api/proposals/:id/track` - Get timeline + versions

### Comments
- `GET /api/proposals/:id/comments` - List comments
- `POST /api/proposals/:id/comments` - Add comment
- `POST /api/comments/:commentId/reply` - Reply
- `PUT /api/comments/:commentId/resolve` - Resolve

### Chat
- `GET /api/proposals/:id/chat` - Get messages
- `POST /api/proposals/:id/chat` - Send message
- `POST /api/proposals/:id/chat/mark-all-read` - Mark all read

### Reports
- `GET /api/proposals/:id/reports` - List reports
- `POST /api/proposals/:id/reports` - Create report
- `PUT /api/reports/:reportId` - Update report
- `POST /api/reports/:reportId/submit` - Submit (generates PDF)

### Workflow
- `GET /api/workflow/dashboard/stats` - Dashboard statistics
- `PUT /api/workflow/:id/status` - Update status (committee)
- `POST /api/workflow/:id/assign-reviewer` - Assign reviewer
- `POST /api/workflow/:id/request-clarification` - Request clarification

### Collaboration
- `POST /api/collaboration/:id/invite-ci` - Invite co-investigator
- `POST /api/collaboration/upload/image` - Upload image
- `POST /api/collaboration/upload/document` - Upload document

## Socket.io Events

### Client → Server
- `join-proposal` - Join proposal room
- `leave-proposal` - Leave proposal room
- `chat-message` - Send chat message
- `comment-added` - Comment added
- `status-changed` - Status changed

### Server → Client
- `user-joined` - User joined room
- `user-left` - User left room
- `new-chat-message` - New chat message
- `new-comment` - New comment
- `proposal-status-updated` - Status updated

## Testing Checklist

- [ ] User registration and login
- [ ] Profile update
- [ ] Create new proposal (draft)
- [ ] Auto-save functionality
- [ ] Submit proposal
- [ ] View proposal
- [ ] Track proposal timeline
- [ ] Collaborate on proposal
- [ ] Add comments
- [ ] Chat in real-time
- [ ] Create review report
- [ ] Update proposal status (committee)
- [ ] Dashboard statistics

## Environment Variables Required

```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:5000
NEXT_PUBLIC_HOCUSPOCUS_URL=ws://localhost:1234
```

## Next Steps

1. Update collaborate page with Socket.io and real-time features
2. Update review page with report submission
3. Test all workflows end-to-end
4. Add error handling and loading states
5. Add success/error notifications using toast
6. Implement file upload progress indicators
7. Add optimistic UI updates
