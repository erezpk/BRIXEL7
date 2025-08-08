# In-App Chat System Implementation

## Overview
Implementing a comprehensive real-time chat system with floating UI, multi-tenant support, role-based permissions, AI assistants, and enterprise security features.

## Quick Fix: OAuth Issue
The Google OAuth is failing due to client ID mismatch. Current environment shows different client IDs in logs vs actual requests. Need to update to consistent credentials.

## Chat System Architecture

### Core Components
1. **Real-time Transport**: WebSocket connections with fallback to polling
2. **Data Model**: Messages, Conversations, Participants, Chat Settings, Bot Configurations
3. **Multi-tenant Isolation**: Agency-level data separation with strict permission enforcement
4. **Role-Based Access**: Agency Admin, Team Member, Client permissions with granular controls

### Integration Points
- **Global Floating Widget**: Appears on all dashboard pages
- **WebSocket Server**: Real-time bidirectional communication
- **Permission Middleware**: Role-based access control at API and socket level
- **AI Integration**: ChatGPT assistant and client support bot
- **Notification System**: Real-time alerts and push notifications

### Security Features
- End-to-end tenant isolation
- Encrypted data at rest and in transit
- Audit logging for all chat activities
- Rate limiting and abuse protection
- PII detection and protection

### Database Schema Extensions
```sql
-- Chat conversations
conversations: {
  id: uuid,
  agencyId: uuid,
  type: "direct" | "group" | "support" | "ai_assistant",
  participants: uuid[],
  lastMessageAt: timestamp,
  settings: json
}

-- Chat messages
messages: {
  id: uuid,
  conversationId: uuid,
  senderId: uuid,
  content: text,
  type: "text" | "file" | "system" | "bot",
  metadata: json,
  readBy: json,
  editedAt: timestamp
}

-- Chat settings per agency
chatSettings: {
  agencyId: uuid,
  botConfig: json,
  allowedTopics: string[],
  forbiddenTopics: string[],
  cannedReplies: json,
  branding: json
}
```

### Environment Variables
```env
# Chat Configuration
OPENAI_API_KEY=your_openai_key
CHAT_ENCRYPTION_KEY=your_32_char_key
WEBSOCKET_PORT=5001
RATE_LIMIT_WINDOW=900000
RATE_LIMIT_MAX=100
```

### API Endpoints
- `GET /api/chat/conversations` - List user's conversations
- `POST /api/chat/conversations` - Create new conversation
- `GET /api/chat/conversations/:id/messages` - Get conversation messages
- `POST /api/chat/conversations/:id/messages` - Send message
- `PUT /api/chat/conversations/:id/read` - Mark as read
- `GET /api/chat/settings` - Get agency chat settings
- `PUT /api/chat/settings` - Update agency chat settings

### WebSocket Events
- `chat:join` - Join conversation
- `chat:leave` - Leave conversation
- `chat:message` - Send/receive message
- `chat:typing` - Typing indicators
- `chat:read` - Read receipts
- `chat:presence` - Online/offline status

### Implementation Steps
1. ✅ Fix OAuth authentication issue
2. 🔄 Design and implement database schema
3. 🔄 Create WebSocket server infrastructure
4. 🔄 Build floating chat widget UI
5. 🔄 Implement permission system
6. 🔄 Add AI assistant integration
7. 🔄 Create client support bot
8. 🔄 Build agency settings panel
9. 🔄 Add security and audit features
10. 🔄 Create tests and documentation

## Current Status
Working on fixing OAuth authentication, then proceeding with chat system implementation.