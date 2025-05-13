# User Preferences Migration Plan

## Phase 1: Remove Current Implementation

### Database Changes

[ ] Create migration script to:

-   [ ] Drop current `user_preferences` table
-   [ ] Create new `user_preferences` table with simplified schema
-   [ ] Create new `user_stats` table
-   [ ] Back up existing preferences data

### API Changes

[ ] Update `/api/user/preferences` route to:

-   [ ] Remove legacy fields
-   [ ] Implement new simplified schema
-   [ ] Add stats endpoint `/api/user/stats` (read-only)

### Frontend Changes

[ ] Update `useUserPreferences` hook to:

-   [ ] Remove references to legacy fields
-   [ ] Add stats fetching capability
-   [ ] Maintain backward compatibility during transition

## Phase 2: Implement New System

### Core Features

[ ] Theme preferences:

-   [ ] Light/dark/system toggle
-   [ ] Persistence across sessions

[ ] Reading preferences:

-   [ ] View mode (single/double page)
-   [ ] Zoom level control (100% default)

[ ] User statistics:

-   [ ] Books read counter
-   [ ] Last read date tracking
-   [ ] Audiobooks listened counter

### UI Components

[ ] Settings page:

-   [ ] Simplify preferences panel
-   [ ] Add stats display section

[ ] Reader toolbar:

-   [ ] Add zoom controls
-   [ ] Add view mode toggle

## Phase 3: Testing & Validation

[ ] Unit tests:

-   [ ] Database migrations
-   [ ] API endpoints
-   [ ] UI components

[ ] Integration tests:

-   [ ] Preference persistence
-   [ ] Stats tracking
-   [ ] Theme switching

[ ] User acceptance testing:

-   [ ] Verify all core functionality
-   [ ] Check migration of existing users

## Phase 4: Deployment

[ ] Staging deployment:

-   [ ] Test with real user data
-   [ ] Verify performance impact

[ ] Production rollout:

-   [ ] Schedule maintenance window
-   [ ] Deploy database migrations
-   [ ] Release frontend updates

## Phase 5: Monitoring

[ ] Post-deployment checks:

-   [ ] Error rate monitoring
-   [ ] Performance metrics
-   [ ] User feedback collection

## Rollback Plan

[ ] Prepare rollback scripts for:

-   [ ] Database schema
-   [ ] API endpoints
-   [ ] Frontend components
