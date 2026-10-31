# LeadFlow CRM - Test Checklist

| | |
|---|---|
| Tester | Prashant Panwar |
| Date | 31 Oct 2026 |
| Commit | `9fe789e` |
| Environment | Local: Windows 11, Node 24.13, MongoDB 7 (Docker), Chromium-based browser at desktop width and 375 px mobile width |
| Rule | A test is marked **Pass** only if it was actually run on this commit. Anything not run is marked **Not run**. |

## 1. Automated API tests

Command: `npm test` (Jest + Supertest + in-memory MongoDB)

```
Test Suites: 5 passed, 5 total
Tests:       47 passed, 47 total
```

| File | Covers |
|---|---|
| `server/tests/app.test.js` | health check without secrets, unknown route 404, malformed JSON 400, missing server config 503, no stack traces |
| `server/tests/auth.test.js` | register + hashing, duplicate email 409 (case-insensitive), validation, login, same 401 for wrong password / unknown email, NoSQL-injection payload, missing/invalid/forged/expired token 401, every protected route without token 401 |
| `server/tests/leads.test.js` | create/view/edit/delete, defaults, createdBy from token, forbidden fields, missing name, missing email+phone, invalid email, negative budget, invalid phone, search, stage filter, active filter, cascade delete, cross-user 403, empty/non-JSON body |
| `server/tests/activities.test.js` | create for valid lead, malformed/nonexistent/foreign lead, missing title/date, date without timezone, impossible date, server-set completedAt, no reopening, filters, cross-user 403 |
| `server/tests/dashboard.test.js` | zero state, exact counts for a known data set, other users excluded, counts update after stage change and delete |

## 2. Manual browser tests

| ID | Area | Test case | Steps | Expected | Actual | Result | Notes |
|---|---|---|---|---|---|---|---|
| M-01 | Auth | Register with empty fields | Open /register, click Create account | Inline errors for name, email, password | "Name must be 2-60 characters", "Enter a valid email address", "Password must be 8-72 characters" shown | Pass | |
| M-02 | Auth | Register new account | Fill valid details, submit | Account created, redirected to dashboard | Redirected to /dashboard showing "Hello, Demo" and zero metrics | Pass | |
| M-03 | Auth | Register duplicate email | Register again with the same email in capitals | "Email is already registered" | Message shown at top and under the email field | Pass | Email check is case-insensitive |
| M-04 | Auth | Login with empty form | Click Log in with empty fields | Inline errors | "Enter a valid email address", "Password is required" | Pass | |
| M-05 | Auth | Login with wrong credentials | Unknown email + wrong password | Error shown, no redirect | "Invalid email or password", stayed on /login | Pass | |
| M-06 | Auth | Protected page while logged out | Open /leads without a session | Redirect to /login | Redirected to /login | Pass | |
| M-07 | Auth | Return to intended page after login | Logged out, open /leads?stage=Active, then log in | Lands on /leads?stage=Active | Landed on /leads?stage=Active with the filter applied | Pass | |
| M-08 | Auth | Logout | Click Log out | Token removed, /login shown | /login shown, token removed from localStorage | Pass | |
| M-09 | Auth | Corrupted token | Set an invalid token in localStorage, open /leads | Sent to /login with a session message | "Your session has ended. Please log in again." on /login | Pass | |
| M-10 | Leads | Empty state | New account, open Leads | "No leads yet" with a create button | "No leads yet - Add your first lead" shown | Pass | |
| M-11 | Leads | Create lead validation | Submit with invalid email and budget -5 | Field errors | "Enter a valid email address", "Budget must be a number of 0 or more" | Pass | |
| M-12 | Leads | Budget with text | Enter "12k" as budget, submit | Budget error | "Budget must be a number of 0 or more" | Pass | |
| M-13 | Leads | Create lead | Valid name, company, email, budget, interest, source | Saved, detail page opens | Detail page with "Lead created" message and saved values | Pass | |
| M-14 | Leads | Edit lead - contact rule | Edit a phone-only lead, clear phone, save | Error: email or phone required | "Provide at least an email or a phone number" | Pass | |
| M-15 | Leads | Edit lead | Add email, change budget, save | Changes saved | Detail page shows new email and ₹42,000, "Lead updated" | Pass | |
| M-16 | Leads | Search | Type "motors" | Only matching company shown, URL updated | 1 lead (Singh Motors), URL ?search=motors | Pass | |
| M-17 | Leads | Stage filter | Select Won | Only Won leads | 1 lead (Neha Kapoor), URL ?stage=Won | Pass | |
| M-18 | Leads | Active filter | Dashboard Active card / filter "Active" | Only leads not Won/Lost | 3 leads: Proposal Sent, Contacted, New | Pass | |
| M-19 | Leads | Clear filters | Click Clear filters | All leads shown | All leads shown, URL cleared | Pass | |
| M-20 | Leads | Delete lead with follow-ups | Delete from detail page, confirm | Lead and its follow-ups removed | Redirected to list with "Deleted ... and its follow-ups", lead gone, its follow-up gone from Follow-ups page | Pass | |
| M-21 | Pipeline | Change stage | Detail page dropdown → Proposal Sent | Saved immediately | "Stage saved.", badge updated | Pass | |
| M-22 | Pipeline | Stage persists | Reload the page | Same stage | Still Proposal Sent after reload | Pass | |
| M-23 | Follow-ups | Add follow-up with past date | Title + yesterday's date | Listed as Overdue | Listed with red "Overdue" badge, "yesterday" | Pass | |
| M-24 | Follow-ups | Add follow-up with default date | Title only | Listed as Pending, tomorrow 10:00 local | "Pending", "in 15 hours" | Pass | |
| M-25 | Follow-ups | Mark complete (lead page) | Click Mark complete | Completed with completion time | "Completed", "Done Oct 31, 2026, 7:22 PM" | Pass | |
| M-26 | Follow-ups | Overdue tab + complete | Follow-ups → Overdue → Mark complete | Item leaves the Overdue list | Count went from 2 to 1 | Pass | |
| M-27 | Persistence | Refresh browser | Reload lead detail page | Still logged in, data unchanged | Logged in, completed follow-up and stage still saved | Pass | |
| M-28 | Dashboard | Counts match records | Compare dashboard after the steps above | Total 1, Active 1, Won 0, Pending 1 (1 completed), Overdue 0 | Exactly those values shown | Pass | Seed data later: Total 5, Active 3, Won 1, Pending 2, Overdue 1 - also matched |
| M-29 | UI | API stopped during login | Stop API, submit login | Clear error, no crash | "The server is not responding right now. Please try again in a moment." | Pass | |
| M-30 | UI | API stopped on refresh | Logged in, stop API, open /leads | Session kept, retry offered | "We could not reach the server to restore your session." + Try again; after restarting the API, Try again showed the leads | Pass | Token kept |
| M-31 | UI | Loading states | Watch pages load | Spinner / "Signing in…" / "Saving…" | Spinners and button labels shown | Pass | |
| M-32 | UI | Mobile layout (375 px) | Leads and Follow-ups pages on a phone-sized screen | No horizontal scroll, readable cards | Cards with labels, page width 375 = viewport width | Pass | |
| M-33 | UI | Every visible button works | Click each button/link on every page | Does what its label says | Besides the actions above: Cancel (new + edit form), View, Edit, sidebar links, dashboard metric cards (e.g. Overdue → /follow-ups?filter=overdue), mobile Menu open/close, dismiss × on messages - all did what their label says | Pass | |
| M-34 | Deployment | Same tests on the live Vercel URL | Repeat M-02, M-13, M-21, M-25, M-27 on the deployed site | Same results | - | Not run | Needs the MongoDB Atlas connection string to be added in Vercel first |
