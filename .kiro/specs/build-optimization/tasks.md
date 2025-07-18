# Build Optimization Implementation Plan

- [x] 1. Fix missing imports in dashboard utilities


  - Add missing `Users` import to `src/lib/dashboard-utils.ts`
  - Remove unused `Clock` and `PlanType` imports to resolve warnings
  - _Requirements: 1.2, 1.5, 2.2_

- [x] 2. Centralize dashboard utility functions


  - Import `getRoleLabel` and `getNavConfig` from dashboard-utils in layout component
  - Remove duplicate function definitions from dashboard layout
  - _Requirements: 2.3, 3.3_




- [x] 3. Fix WorkOrderStats type mismatch

  - Update fallback object in dashboard page to include all required properties
  - Add missing `assigned` and `cancelled` properties to match interface
  - _Requirements: 1.1, 2.1_


- [ ] 4. Resolve component import issues
  - Check for missing component imports in dashboard layout
  - Fix any remaining import resolution errors
  - _Requirements: 1.2, 1.5_



- [ ] 5. Validate build success
  - Run `npm run build:fast` to verify all errors are resolved
  - Confirm zero TypeScript compilation errors
  - _Requirements: 1.1, 3.1_

- [ ] 6. Clean up unused imports and code
  - Remove any remaining unused imports causing warnings
  - Eliminate duplicate utility functions across components
  - _Requirements: 2.3, 3.3, 3.4_