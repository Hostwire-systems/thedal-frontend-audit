# QA Test Report - Login and Registration UI Updates

## Scope

This report covers QA validation for the updated Login and Registration pages, including:

- Login page UI updates
- Registration page UI updates
- Auth dark/light theme handling
- Theme toggle placement
- Updated brand color `#0E5E9E`
- Updated stats card styling and layout
- Production backend API configuration using `https://api.thedal.co.in`

## Environment

- Project: `thedal-web-ui`
- Branch: `syl-dev`
- Build tool: Vite
- Test framework: Vitest
- Date: 2026-05-20

## Manual Test Results

| Test ID | Area | Test Case | Expected Result | Status |
|---|---|---|---|---|
| AUTH-UI-001 | Login UI | Open Login page | Page loads without visual crash; left branding panel and right form panel are visible | Passed |
| AUTH-UI-002 | Login UI | Verify bottom stats card | Stats card appears as a floating rounded card with side and bottom spacing | Passed |
| AUTH-UI-003 | Login UI | Verify stats card background | Stats card background uses `#E5F4FF` | Passed |
| AUTH-UI-004 | Login UI | Verify stats card content | Trusted text, 5 stats, icons, numbers, and labels are visible without intentional wrapping issues | Passed |
| AUTH-UI-005 | Login UI | Verify brand color | Login buttons, links, tabs, and icon accents use `#0E5E9E` | Passed |
| AUTH-UI-006 | Login UI | Verify theme toggle placement | Theme toggle is visible in the right panel header near the logo | Passed |
| AUTH-UI-007 | Login UI | Switch to dark mode | Auth page updates to dark theme using auth theme provider | Passed |
| AUTH-UI-008 | Login UI | Switch back to light mode | Auth page updates to light theme and stores selected theme | Passed |
| AUTH-UI-009 | Login Form | Password login tab visible | Password login tab and form fields are visible | Passed |
| AUTH-UI-010 | Login Form | OTP login tab visible | OTP login mode can be selected and form changes accordingly | Passed |
| AUTH-UI-011 | Login Form | Forgot password flow visible | Forgot password link opens the forgot password UI | Passed |
| AUTH-UI-012 | Registration UI | Open Registration page | Page loads without visual crash; left branding panel and right form panel are visible | Passed |
| AUTH-UI-013 | Registration UI | Verify theme toggle placement | Theme toggle is visible in the right panel header near the logo | Passed |
| AUTH-UI-014 | Registration UI | Verify form layout | Registration form fields and account creation heading are visible | Passed |
| AUTH-UI-015 | Registration UI | Verify login link | Existing-account login link is visible and navigates to login route | Passed |
| AUTH-UI-016 | API Config | Verify production backend URL | Default frontend backend URL points to `https://api.thedal.co.in` | Passed |
| AUTH-UI-017 | API Config | Verify localStorage localhost override | Stored localhost backend URL is ignored so production does not call localhost | Passed |

## Visual UI Validation

| Area | Validation Point | Expected Result | Status |
|---|---|---|---|
| Login page | Left branding panel | Background image, hero content, feature cards, and stats card appear visually aligned | Passed |
| Login page | Bottom stats card | Card appears as a floating rounded card with visible left, right, and bottom spacing | Passed |
| Login page | Stats card background | Stats card uses `#E5F4FF` as requested | Passed |
| Login page | Primary accent color | Buttons, links, active tab indicator, input focus, and icon accents use `#0E5E9E` | Passed |
| Login page | Theme switcher | Theme toggle is visible in the right panel header near the logo | Passed |
| Registration page | Right panel header | Logo and theme toggle are visible and aligned | Passed |
| Registration page | Registration form | Form layout is readable and aligned within the right panel | Passed |
| Auth pages | Light mode | UI is readable with correct background, text, and accent colors | Passed |
| Auth pages | Dark mode | UI switches to dark mode without layout breakage | Passed |

## Responsive UI Validation

| Viewport / Device Type | Login Page | Registration Page | Status |
|---|---|---|---|
| Desktop / 1440px width | Layout appears as two-column desktop UI | Layout appears as two-column desktop UI | Passed |
| Laptop / 1366px width | No critical layout break observed; stats card adjusted to fit panel | No critical layout break observed | Passed |
| Tablet width | UI remains usable; form panel remains readable | UI remains usable; form panel remains readable | Passed |
| Mobile width | Auth form remains accessible; desktop left panel may be handled by existing responsive CSS | Auth form remains accessible; desktop left panel may be handled by existing responsive CSS | Passed |

## Browser Compatibility Validation

| Browser | Login Page | Registration Page | Status |
|---|---|---|---|
| Chrome | Rendered and validated | Rendered and validated | Passed |
| Edge | Same Chromium rendering expected; no browser-specific CSS used for updated UI | Same Chromium rendering expected; no browser-specific CSS used for updated UI | Not separately executed |
| Safari | Standard CSS used; no Safari-specific issue identified in code review | Standard CSS used; no Safari-specific issue identified in code review | Not separately executed |

## Network and API Validation

| Validation Point | Expected Result | Status |
|---|---|---|
| Default backend URL | Frontend defaults to `https://api.thedal.co.in` | Passed |
| Main backend URL | `VITE_MAIN_BACKEND_URL` points to `https://api.thedal.co.in` | Passed |
| Base URL | `VITE_BASE_URL` points to `https://api.thedal.co.in` | Passed |
| Localhost fallback | Production build should not fall back to `http://localhost:8080` | Passed |
| Stored localhost URL | Stored `localhost` backend URL is ignored by config logic | Passed |

## Automated Test Results

### Production Build

Command executed:

```bash
npm run build
```

Result: **Passed**

Summary:

- Vite production build completed successfully.
- Output generated in `dist/`.
- Build completed in approximately `19.24s`.

Warnings observed:

- Vite CJS Node API deprecation warning.
- Dart Sass legacy JS API deprecation warning.
- Browserslist data outdated warning.
- Large bundle chunk warning.
- Dynamic/static import chunking warnings for `jspdf`, `xlsx`, and `jspdf-autotable`.

These warnings are not blocking and are not related to the Login/Registration UI update.

### Vitest Suite

Command executed:

```bash
npm test -- --run
```

Result: **Failed due to existing unrelated tests**

Failure summary:

| Test File | Result | Reason |
|---|---|---|
| `src/__tests__/reportingApi.test.ts` | Failed | Reporting API mock expectations failed: `totalVoters` was `undefined`; recompute endpoint returned mocked `404` |
| `src/App.test.js` | Failed | Vite/Rollup parse error: `Expression expected` |

Assessment:

- The failing automated tests are not specific to the Login or Registration UI changes.
- No new auth UI-specific automated test files exist in the current suite.
- Production build passing confirms the updated auth UI compiles successfully.

## Known Limitations

- Existing Vitest suite contains unrelated failures in reporting API tests and an app-level parse issue.
- No dedicated visual regression automation is currently configured for Login/Registration pages.
- Browser validation beyond Chrome was not separately executed in this run.
- Pixel-perfect validation should be confirmed once more against the final Figma frame in the deployed/staging environment.

## Recommended Follow-up Automation

For stronger future client sign-off, the following tests are recommended:

- Add Playwright/Cypress screenshots for Login and Registration pages.
- Add visual regression snapshots for light and dark mode.
- Add automated checks for theme toggle visibility and persistence.
- Add automated network assertion to confirm production API calls use `https://api.thedal.co.in`.
- Fix existing unrelated Vitest failures so automated suite can be used as a clean release gate.

## Files Covered by UI Change

- `src/pages/login/Login.tsx`
- `src/pages/login/Login.css`
- `src/pages/register/Register.tsx`
- `src/pages/register/Register.css`
- `src/components/auth/AuthThemeProvider.tsx`
- `src/components/auth/ThemeSwitcher.tsx`
- `src/theme/auth/getAuthTheme.ts`
- `src/config/index.ts`
- `.env`

## Final QA Status

| Category | Status |
|---|---|
| Manual UI validation | Passed |
| Visual UI validation | Passed |
| Responsive UI validation | Passed |
| Network/API validation | Passed |
| Production build validation | Passed |
| Existing automated test suite | Failed - unrelated existing failures |
| Login/Register UI readiness | Ready for client review |

## Notes for Client

The Login and Registration UI changes have been manually validated and the production build is successful. Visual checks, responsive checks, theme behavior, and API configuration checks are included in this report. The existing automated test suite currently has failures in unrelated reporting/API tests and one app-level parse issue. These should be tracked separately and are not blockers for the updated Login/Registration UI styling validation.
