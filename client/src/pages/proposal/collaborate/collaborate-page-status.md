# Collaborate Page Implementation Status

## Data Integration

### Proposal Data
- Fetches proposal from `/api/collaboration/proposals/:id/collaborate` endpoint
- Falls back to `/api/proposals/:id` if collaboration endpoint fails
- Displays proposal code, title, status, version from database
- Proposal info fields populated from DB (title, funding method, agencies, leaders, duration, outlay)

### Collaborators
- Fetches from `/api/collaboration/:id/collaborators` endpoint
- Displays PI, CIs, reviewers, and committee members
- Real-time count shown in header

### Comments
- Fetches from `/api/proposals/:id/comments` endpoint
- Add comment via POST to same endpoint
- Reply via POST to `/api/proposals/:id/comments/:commentId/reply`
- Resolve via PUT to `/api/proposals/:id/comments/:commentId/resolve`
- Comments retained across major versions

### Online Users
- Socket-based real-time tracking
- Updates via `connectedUsers` from `useSocketCollaboration` hook
- Green indicator with count in editor header

## Version History System

### Version Numbering
- Integer versions only: 0, 1, 2, 3, etc. (no minor versions like 1.1, 1.2)
- Version 0: Draft stage (pre-submission)
- Version 1: Initial Submission (created when proposal is first submitted)
- Version 2+: Created when PI/CI clicks "Save Changes"

### Creating New Versions
- Only PI and CI can create new versions via "Save Changes" button
- Calls POST `/api/proposals/:id/versions` with commitMessage
- Increments currentVersion by 1 (e.g., 1 -> 2, 2 -> 3)
- No auto-save versions (removed minor version concept)

### Viewing Previous Versions
- Version History panel shows all major versions
- Each version displays: version number, commit message, created date/time, author
- "View This Version" button opens the version in the view page
- Version 1 shows "Initial Submission" as the commit message
- No rollback/restore functionality - view only

### View Page Version Support
- Accepts `?version=N` query parameter
- Loads specific version content from `/api/proposals/:id/versions/:versionNumber`
- Displays amber banner indicating historical version being viewed
- "Back to Current Version" button returns to latest version
- Version badge shown in header and metadata

### Data Retention Across Versions
- Chat messages: Retained across all versions
- Comments/Suggestions: Retained across all versions
- Inline editor comments: NOT retained (cleared on new version)

## Role-Based Permissions

### Principal Investigator (PI)
- Can edit proposal information (selective fields)
- Can add up to 5 co-investigators
- Can add and reply to comments
- Can resolve comments
- Can edit proposal editor content
- Can save changes and create new major versions

### Co-Investigator (CI)
- Cannot edit proposal information fields
- Cannot add co-investigators (view only)
- Can add and reply to comments
- Can resolve comments
- Can edit proposal editor content
- Can save changes and create new major versions

### Reviewers and Committee Members (EXPERT_REVIEWER, CMPDI_MEMBER, TSSRC_MEMBER, SSRC_MEMBER)
- Cannot edit proposal information
- Cannot add collaborators
- Can add and reply to comments
- Cannot resolve comments
- Views editor in suggestion mode (highlight and comment only)
- Cannot save changes or create versions

### Super Admin
- Full access to all features

## Auto-Save and Sync

### Local Storage
- Auto-saves every 30 seconds to localStorage
- Key: `collaborate_proposal_{proposalId}`
- Stores proposal info, comments, version

### Database Sync
- Syncs to DB on page unload/navigation
- Uses POST to `/api/collaboration/:id/sync`
- Does NOT create version (just saves current work)

## Socket Collaboration

### Connection
- Joins room based on proposal ID
- Handles reconnection automatically

### Real-time Updates
- Field updates broadcast to room members (5s debounce)
- Comment additions broadcast to room
- Comment resolutions broadcast to room

## UI Components

### CollaborateHeader
- Shows proposal code, online count, collaborator count

### ProposalMetadata
- Displays proposal code, status badge, version (integer)

### CollaborateProposalInformation
- Editable by PI only
- All fields: title, funding method, agencies, leaders, duration, outlay

### CommentsSuggestionsPanel
- Collapsible section above editor
- Active/Resolved toggle
- Reply and resolve functionality
- Single-submit protection (prevents duplicate comments)

### CollaborativeEditor
- No badge for PI/CI (they can edit)
- "Suggestion Mode" indicator for reviewers/committee
- Save Changes button only for PI/CI
- Online users indicator

### Modals
- CollaboratorsModal: View and invite collaborators
- OnlineUsersModal: View currently online users
- SaveChangesModal: Create new version with commit message
  - Shows current version -> new version transition
  - Calls API to create actual version
  - Uses integer version numbers

### Side Panels
- Version History: View all major versions, navigate to view previous versions
- Team Chat (lazy loaded)
- Saarthi AI Assistant (lazy loaded)

## API Endpoints

### Version Management
- GET `/api/proposals/:id/versions` - List all major versions
- POST `/api/proposals/:id/versions` - Create new major version (PI/CI only)
- GET `/api/proposals/:id/versions/:versionNumber` - Get specific version content
