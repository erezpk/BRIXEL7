
# Authentication Implementation Plan & Troubleshooting Guide

## Current Status: Custom Google OAuth (Not Firebase)

The application uses **custom Google OAuth implementation** without Firebase. The authentication is failing due to mock implementation and missing Google Cloud setup.

## Issues Identified

### 1. Mock Implementation Active
- `signInWithGoogle()` in `google-oauth.ts` returns fake data
- Backend expects real Google ID tokens
- No actual Google OAuth popup/redirect flow

### 2. Missing Google Cloud Configuration
- Placeholder Client ID: `"YOUR_ACTUAL_CLIENT_ID_HERE.apps.googleusercontent.com"`
- No actual Google OAuth app configured
- redirect_uri_mismatch errors when testing

### 3. Backend Authentication Failures
- 401 Unauthorized errors in console
- `/api/auth/google-simple` endpoint expects real user data
- Session management not working with mock data

## Implementation Plan

### Phase 1: Google Cloud Setup
1. **Create Google OAuth App**
   - Go to [Google Cloud Console](https://console.cloud.google.com)
   - Create new project or select existing
   - Enable Google+ API and Google Identity Toolkit API
   - Create OAuth 2.0 Client ID (Web Application)

2. **Configure Authorized Origins**
   ```
   Authorized JavaScript origins:
   https://ccdb57b1-53f6-4b88-ba50-863ae246f42e-00-1ffb4gjb4lc25.riker.replit.dev
   http://localhost:5000
   https://*.replit.dev
   ```

3. **Configure Redirect URIs**
   ```
   Authorized redirect URIs:
   https://ccdb57b1-53f6-4b88-ba50-863ae246f42e-00-1ffb4gjb4lc25.riker.replit.dev/oauth2callback
   http://localhost:5000/oauth2callback
   ```

### Phase 2: Frontend Implementation
1. **Update Client ID**
   - Replace placeholder in `google-oauth.ts`
   - Use actual Client ID from Google Cloud Console

2. **Implement Real Google OAuth**
   - Replace mock `signInWithGoogle()` with real Google Sign-In
   - Use Google Identity Services (GIS) library
   - Handle OAuth popup/redirect flow

3. **Fix Authentication Flow**
   - Send real Google ID tokens to backend
   - Handle OAuth success/error states
   - Update session management

### Phase 3: Backend Updates
1. **Verify Google ID Tokens**
   - Install Google Auth Library: `npm install google-auth-library`
   - Verify tokens against Google's servers
   - Extract user info from verified tokens

2. **Update `/api/auth/google-simple` endpoint**
   - Accept and verify Google ID tokens
   - Create or update user accounts
   - Establish proper sessions

3. **Session Security**
   - Ensure secure session configuration
   - Add CSRF protection if needed
   - Handle session expiration

### Phase 4: Testing & Security
1. **Test OAuth Flow**
   - Test with real Google accounts
   - Verify session persistence
   - Test logout functionality

2. **Security Review**
   - Validate all user inputs
   - Secure session storage
   - Rate limiting for auth endpoints

## Alternative: Repl Auth Integration

Consider using **Repl Auth** instead of Google OAuth for simpler implementation:

### Benefits
- No external OAuth setup required
- Built-in Replit account integration
- Simpler implementation
- Better integration with Replit platform

### Implementation
1. Add Repl Auth script to login page
2. Update backend to handle Repl Auth tokens
3. Maintain existing user management system

## Current Replit Domain
```
https://ccdb57b1-53f6-4b88-ba50-863ae246f42e-00-1ffb4gjb4lc25.riker.replit.dev
```

## Emergency Fixes

### Quick Fix 1: Disable Google Auth Temporarily
- Comment out Google login button in `login.tsx`
- Focus on email/password authentication
- Re-enable after proper Google setup

### Quick Fix 2: Use Repl Auth
- Replace Google OAuth with Repl Auth
- Faster setup, no external dependencies
- Better for Replit-hosted applications

## Files Requiring Updates

### Frontend Files
- `client/src/lib/google-oauth.ts` - Replace mock with real OAuth
- `client/src/pages/auth/login.tsx` - Update error handling
- `client/src/hooks/use-auth.tsx` - Fix authentication flow

### Backend Files
- `server/routes.ts` - Update Google auth endpoint
- `package.json` - Add google-auth-library dependency

### Configuration
- `.env` - Add Google OAuth configuration
- Add OAuth consent screen setup in Google Cloud

## Testing Checklist

- [ ] Google Cloud OAuth app created
- [ ] Authorized domains configured
- [ ] Real Client ID implemented
- [ ] OAuth popup works
- [ ] Backend verifies tokens
- [ ] User sessions persist
- [ ] Logout functionality works
- [ ] Error handling covers edge cases

## Notes
- Google OAuth setup can take 5-10 minutes to propagate
- Always test with incognito/private browsing
- Monitor browser console and server logs for debugging
- Consider implementing email verification for new users

## Next Steps
1. Choose between Google OAuth and Repl Auth
2. If Google OAuth: Complete Google Cloud setup first
3. If Repl Auth: Implement Repl Auth integration
4. Update frontend and backend accordingly
5. Test thoroughly before deployment
