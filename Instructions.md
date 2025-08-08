# Google OAuth Authentication & Calendar Integration Fix Plan

## Problem Analysis

After analyzing the codebase, I've identified several critical issues causing Google OAuth login failures:

### 1. **Conflicting Authentication Systems**
- **Firebase Integration**: Client-side using Firebase Auth with Google provider
- **Passport.js Integration**: Server-side using Passport Google Strategy
- **Mixed Flow**: These two systems conflict and don't work together properly

### 2. **Configuration Issues**
- **Callback URL Mismatch**: Multiple different callback URLs used inconsistently
- **Scope Conflicts**: Different scopes requested in different parts of the system
- **Token Handling**: Improper handling of refresh tokens and token expiration

### 3. **Missing Google Cloud Console Configuration**
The following need to be verified in Google Cloud Console:

#### Required APIs to Enable:
- Google Calendar API
- Google+ API (for profile access)
- Identity and Access Management (IAM) API

#### OAuth Consent Screen Configuration:
- **Application Type**: Web Application
- **Authorized Domains**: `replit.dev`, `replit.app`
- **Scopes**: 
  - `userinfo.email`
  - `userinfo.profile`
  - `calendar`
  - `calendar.events`

#### OAuth 2.0 Client Configuration:
- **Authorized Redirect URIs**:
  - `https://ccdb57b1-53f6-4b88-ba50-863ae246f42e-00-1ffb4gjb4lc25.riker.replit.dev/api/auth/google/callback`
  - `https://*.replit.dev/api/auth/google/callback`
  - `https://*.replit.app/api/auth/google/callback`

### 4. **Code Architecture Issues**
- **Duplicate Routes**: Multiple endpoints handling Google auth differently
- **Inconsistent Error Handling**: 400/401 errors not properly caught and handled
- **Missing Middleware**: No proper middleware for token refresh

## Implementation Plan

### Phase 1: Simplify Authentication Architecture
1. **Remove Firebase Auth**: Eliminate the conflicting Firebase authentication system
2. **Standardize on Passport.js**: Use only Passport.js Google Strategy for OAuth
3. **Unified Callback**: Single callback URL and consistent token handling

### Phase 2: Fix OAuth Configuration
1. **Update Environment Variables**: Ensure all OAuth URLs are consistent
2. **Fix Callback URL**: Use dynamic domain detection for callbacks
3. **Proper Scope Handling**: Request all required scopes in one OAuth flow

### Phase 3: Implement Proper Token Management
1. **Refresh Token Handling**: Implement automatic token refresh
2. **Token Storage**: Securely store and manage OAuth tokens
3. **Error Recovery**: Proper handling of expired tokens

### Phase 4: Testing & Validation
1. **End-to-End Testing**: Test complete OAuth flow
2. **Calendar Integration**: Verify Google Calendar event creation
3. **Error Scenarios**: Test token expiration and refresh

## Root Cause of 400/401 Errors

### 400 invalid_request:
- **Callback URL mismatch** between Google Cloud Console and application
- **Invalid scopes** being requested
- **Missing required parameters** in OAuth request

### 401 unauthorized:
- **Expired access tokens** without refresh capability
- **Invalid client credentials** in environment
- **Missing calendar permissions** for the authenticated user

## Files to Modify

### Server-Side:
1. `server/routes.ts` - Consolidate OAuth routes
2. `server/google-auth.ts` - Update token verification
3. `shared/schema.ts` - Ensure proper token storage schema

### Client-Side:
1. `client/src/lib/firebase.ts` - Remove or simplify
2. `client/src/hooks/use-auth.tsx` - Update to use Passport.js only
3. `client/src/components/meeting-scheduler.tsx` - Fix calendar integration
4. `client/src/pages/auth/login.tsx` - Simplify Google login button

### Configuration:
1. `.env` - Update OAuth URLs and scopes
2. `replit.md` - Document authentication architecture changes

## Expected Resolution

After implementing these fixes:
- ✅ Google OAuth login will work without 400/401 errors
- ✅ Calendar integration will sync properly with Google Calendar
- ✅ Token refresh will work automatically
- ✅ Error handling will be comprehensive and user-friendly
- ✅ Single, consistent authentication flow throughout the application

## Google Cloud Console Checklist

Before deployment, verify in Google Cloud Console:
- [ ] Calendar API is enabled
- [ ] OAuth consent screen is configured for external users
- [ ] Callback URLs include all Replit domains
- [ ] Scopes include calendar and profile permissions
- [ ] Test users are added if in testing mode
- [ ] Client ID and Secret match environment variables

---

*This plan addresses the root causes of OAuth failures and provides a clear path to stable Google Calendar integration.*