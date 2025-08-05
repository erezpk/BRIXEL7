# Google OAuth Login Implementation Plan

## Current Authentication Analysis

### Issues Identified:

1. **Missing Firebase/Google OAuth Files**: The search results indicate references to Firebase files (`client/firebase.ts`, `client/src/lib/firebase.ts`, `server/google-auth.ts`) that don't exist in the current codebase.

2. **Console Errors**:
   - `AuthProvider is not defined` - Missing AuthProvider component
   - `onAuthStateChanged is not defined` - Missing Firebase imports
   - Login failures with empty error objects

3. **Current Authentication Setup**:
   - Uses Passport.js with LocalStrategy (email/password)
   - Express session-based authentication
   - No Google OAuth integration currently working

4. **Dependencies Available**:
   - `google-auth-library` (already installed)
   - `firebase` (not installed, but mentioned in search results)

## Implementation Plan

### Phase 1: Install Required Dependencies
- Install Firebase SDK for client-side Google OAuth
- Verify google-auth-library is properly configured

### Phase 2: Backend Google OAuth Setup
- Create `server/google-auth.ts` for Google ID token verification
- Add Google OAuth route to `server/routes.ts`
- Integrate with existing Passport.js session system

### Phase 3: Client-Side Firebase Setup
- Create `client/src/lib/firebase.ts` for Firebase configuration
- Implement Google sign-in functions
- Create AuthProvider context for managing authentication state

### Phase 4: Frontend Integration
- Update login page to include Google OAuth button
- Modify useAuth hook to support Google login
- Handle Google OAuth redirects and token exchange

### Phase 5: User Flow Integration
- Ensure Google users are properly created/matched with existing users
- Maintain agency associations for Google OAuth users
- Handle first-time Google OAuth user registration

## Technical Architecture

### Backend Flow:
1. Client initiates Google OAuth via Firebase
2. Firebase returns ID token to client
3. Client sends ID token to `/api/auth/google` endpoint
4. Server verifies token with Google
5. Server creates/finds user and establishes session
6. Returns user data to client

### Frontend Flow:
1. User clicks "Google Login" button
2. Firebase handles OAuth redirect to Google
3. Google redirects back with authorization code
4. Firebase exchanges code for ID token
5. Client sends token to backend
6. Backend authenticates and returns user session
7. Client updates authentication state

## Security Considerations
- Verify Google ID tokens server-side
- Maintain existing session security
- Ensure proper CSRF protection
- Validate user email domains if needed
- Handle edge cases (existing email conflicts)

## Environment Variables Needed
- `GOOGLE_CLIENT_ID` - For backend token verification
- `VITE_FIREBASE_API_KEY` - For Firebase configuration
- `VITE_FIREBASE_AUTH_DOMAIN` - For Firebase authentication
- `VITE_FIREBASE_PROJECT_ID` - For Firebase project identification

## Testing Plan
- Test Google OAuth flow end-to-end
- Verify existing email/password login still works
- Test user creation and agency association
- Verify session management and logout
- Test error handling for OAuth failures

## Success Criteria
- Users can successfully log in with Google OAuth
- Existing login functionality remains intact
- Google users are properly integrated with agency system
- Error handling provides clear feedback
- Authentication state is properly managed across the application