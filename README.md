# District OS

An Expo-based, cross-platform starter for a unified K-12 district operations platform.

## Run locally

```sh
npm install
npm run web
```

Use `npm start` to open the Expo developer menu for web, iOS, or Android.

## Current slice

The first screen is a responsive district operations dashboard with sample attendance, school pulse, staffing, and safety data. Its collapsible sidebar provides seven pillar destinations; the horizontal hub header filters those destinations by role-based operational hub. Pillar 1 includes a Planbook-inspired lesson planner with week/day/month/class views, standards coverage, schedule adjustments, a substitute packet preview, and the existing IEP workspace. Pillar 2 includes a three-tier emergency command center with student/staff accountability, room filtering, event history, and roster export. Pillar 3 includes K–12 tier-aware scheduling previews for elementary homerooms/rotations/flex groups, middle-school pods/exploratories/WIN blocks, and high-school course requests/conflict matching/credit audit/arena selection, plus student directory and kiosk workflows. Pillar 4 includes behavior points, group awards, minor-ODR drafts, a token store, and a timed classroom auction. Pillar 5 includes classroom, school, and district feeds, private parent/staff/office message threads, masked SMS and caller-ID previews, and an emergency broadcast composer. The SIS also has a privacy workspace for directory opt-outs, LEI override previews, record-request deadlines, and retention-rule drafts. All records are illustrative; sync, notifications, 911 dispatch, publishing, meal/POS dispatch, PBIS ledger settlement, calls, claims, signatures, and substitute portal delivery remain local demo interactions.

## Hub and pillar map

| Operational hub | Pillars |
| --- | --- |
| Classroom Hub | 1. LMS & Instruction; 5. Communication & Community |
| Safety & Behavior Hub | 2. Safety & Security; 4. Behavior & MTSS Interventions |
| District Operations Hub | 3. Operations & Transportation; 5. Communication & Community; 6. District Admin & Finance; 7. Human Resources & Payroll |

Pillar 5 is intentionally shared between classroom and district workflows. Hubs are role-based views over shared district domains, not separate databases.

## Masked voice gateway

The initial call-through implementation is in `supabase/functions/masked-voice/index.ts`, with its audit and authorization tables in `supabase/migrations/20261019000100_masked_voice_gateway.sql`. The staff app sends only student, guardian-contact, and school IDs. The Edge Function validates the Supabase user, an active school or district membership, a verified staff endpoint, guardian voice consent, and a verified school caller-ID route. Twilio calls the staff endpoint first; after answer, TwiML bridges the guardian using the school number as caller ID. It does not request or store audio recordings. The audit records staff, student, contact reference, call SIDs, status, timestamps, and bridged-leg duration; raw phone numbers remain in service-role-only tables.

A one-active-call-per-staff, 60-second guard reduces accidental repeat dials. Real calls cannot work until the app is signed in, real records are provisioned, the migration and function are deployed, and Twilio is configured. This is a deployment scaffold, not a live gateway. Before enabling calls:

1. Configure `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_ANON_KEY` from `.env.example`, and implement the district sign-in flow.
2. Apply the migration with `supabase db push`; provision `voice_call_memberships`, verified staff endpoints, guardian contact numbers with documented consent, and a Twilio-verified office caller-ID route for each school. The bundled thread IDs are sample IDs and will be rejected by a real project until replaced with real records.
3. Set Edge Function secrets `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_VOICE_NUMBER`, and `TWILIO_WEBHOOK_BASE_URL` (the public HTTPS function URL). Keep the service-role key server-side; never add Twilio credentials to Expo `EXPO_PUBLIC_*` variables.
4. Deploy the `masked-voice` function. JWT verification is disabled at the gateway because Twilio callbacks do not carry Supabase JWTs; initiation independently validates the caller with Supabase Auth, and callbacks require a Twilio HMAC signature.
5. Configure the verified school number’s inbound Twilio voice route to the school office/IVR. That return-call route is not provisioned by this migration.

The workspace has no Deno or Supabase CLI, credentials, or Twilio account, so the Edge Function and migration have not been deployed or exercised against provider callbacks. No real calls can be placed from this sample data.

## Emergency command center

Pillar 2’s schema is in `supabase/migrations/20261019000300_emergency_command.sql`. It scopes incident, student, staff, visitor, and event-log rows to SIS district/school memberships and keeps authenticated access read-only; service-role code is required for all writes. The UI starts students as `unreported`, distinguishes them from confirmed `missing`, logs staff room/headcount reports, and can export a local CSV roster. Tier 3 requires an authorization confirmation, but **does not place a 911 call or send any alert**. No emergency dispatch endpoint, staff notification service, Realtime channel, or production floorplan data is configured. Do not use this preview for live incident response.

## Safety suite additions

The command center now supports Standard Response Protocol selection, an injured status, and a room heatmap. The Safety section also has Visitor Screening and Reunification tabs (`SafetyOperationsWorkspace.tsx`). `supabase/migrations/20261019001100_safety_suite.sql` extends the emergency tables and adds visitor and reunification logs scoped by SIS role; reunification inserts require verified guardian ID, an authorized-pickup guardian, and an administrator when a custody restriction is active. Smart-door, PA, strobe, web CMS, and 911 PSAP triggers are not connected, and the UI says so. Visitor checks use two sample entries only; state sex-offender registry and district watchlist services are not integrated, and a "no match" result is not a clearance. PDF417 scanning relies on the browser `BarcodeDetector` and falls back to manual entry. License numbers are hashed in the browser for the preview only; production must compute a keyed HMAC server-side. Signatures are captured on screen but not stored, and no thermal printer is connected. The migration has not been applied or validated.

## RBAC foundation

`supabase/migrations/20261019000400_rbac_permissions.sql` adds the eight core personas plus existing specialist roles, scoped/expiring memberships, a permission catalog, substitute section assignments, paraprofessional/specialist student assignments, and student-to-user links. It installs `sis_custom_access_token_hook`, which emits signed membership claims for the client hub filter. Supabase `sis_has_role` and `sis_has_permission` functions query active database memberships directly; RLS does not trust client role state or JWT claims as its authorization source. Custody/medical restrictions, program designations, state identifiers, and restricted program notes are separated from the safe directory projection.

Apply the migrations in timestamp order. In Supabase Auth, enable the custom access token hook configured in `supabase/config.toml`. Provision memberships and temporary substitute assignments server-side with end dates; never let users grant themselves a role. When Supabase is configured, the app hides sample records until it receives an active signed membership, but feature screens still need protected data adapters and per-action authorization before production use. The permissions catalog covers the currently modeled domains; the supplied finance/payroll matrix was truncated, and unmapped capabilities should remain denied until district policy is specified.

## Lesson planner

Pillar 1’s lesson data schema and RLS are in `supabase/migrations/20261019000500_lesson_planner.sql`. It defines per-teacher templates, class-section lesson blocks, a searchable standards catalog, and standards coverage stages. Teachers can edit their assigned sections; school/district leaders can manage their scope; linked guardians/students receive lesson reads; substitutes can read only visible lessons during a matching active assignment window. Standards are seeded separately with licensed/approved district content. The current packet is a local text/CSV-style preview and does not attach real seating charts, accommodation details, emergency procedures, or deliver to a substitute portal.

## Unified gradebook and portfolios

The LMS Gradebook, Hattie, and Portfolio routes share `UnifiedGradebookWorkspace.tsx`: teachers receive the mastery matrix and approval queue, students receive the multimodal artifact canvas and prediction/reflection gate, and families receive read-only portfolio review. Web supports image/file selection, drawing attachments, microphone/screen recording when permitted, and audio playback; native camera/file/audio integrations need platform picker/player packages. `supabase/migrations/20261019001000_unified_gradebook.sql` adds section-scoped assignments/submissions, student/teacher/family/substitute RLS, and protects teacher-validated fields from student updates. The interface still uses local sample state and object URLs; no media storage, feedback delivery, or gradebook sync is connected.

## Classroom seating charts

The LMS Seating Charts route opens a floor-plan builder with resizable grids, desks, collaborative tables, rug/lab spots, and room structures. Teachers can assign students by tap or web drag-and-drop, generate alphabetical/random/balanced layouts, and review sample accommodations, front-row placement, separation, language, attendance, PBIS, and Hattie details. Separation conflicts are blocked in manual assignment and skipped by auto-seating. `supabase/migrations/20261019000900_classroom_seating.sql` adds section-scoped floor plans and unique student/block seat assignments with teacher/admin RLS. Layouts, student attributes, and quick actions are local demo state; the migration has not been deployed and protected accommodation/behavior feeds are not connected.

## K–12 scheduling

Pillar 3’s grade scheduling configuration, specialist wheels, elementary placement cards, secondary course requests, and auditable scheduling runs are defined in `supabase/migrations/20261019000600_k12_scheduling.sql`. The UI demonstrates balanced elementary cohorts, specialist rotations, intervention grouping, middle-school pods/exploratories/WIN blocks, and conflict-aware high-school course placement with a sample graduation-credit cap and arena preview. The algorithms are local proposals: they do not publish enrollments or replace counselor/principal review. No current SIS scheduling dataset, district calendar, complete credit rules, or specialist-capacity feed is connected.

## Privacy and compliance

`supabase/migrations/20261019000700_privacy_compliance.sql` adds family disclosure preferences, COPPA verification metadata, LEI access grants, append-only audit rows, 45-day record-request tracking, and district-controlled retention policies. Verified COPPA consent fields are service-role-only; the client can request verification but cannot assert consent. Restricted-note fields were split from readable program designations. LEI grants require a reason and justification, expire after five minutes, and are checked by the sensitive-data permission helper. Record export assembly and retention execution must run through audited server jobs; this UI only previews requests and draft retention settings.

## PBIS rewards

`supabase/migrations/20261019000800_pbis_rewards.sql` defines school-scoped behavior categories and an insert-only point-award ledger. Teachers manage their own categories; school and district administrators manage scoped defaults. Award inserts require an active SIS role and actor match, and category-free quick awards store a null category. The classroom UI supports the district matrix defaults, custom labels/icons/values, +1 to +5 quick awards with optional notes, and single, bulk, and table-group selection. Category edits and ledger activity remain local sample state until authenticated SIS-backed data adapters are connected. The migration intentionally constrains ledger awards to +1 to +5; negative demo categories are disabled by default and are not persisted by this ledger.

## Data security boundary

The current database migrations cover SIS, masked voice, emergency-command, and RBAC foundations; broader SIS/LMS services and district authentication UX remain unimplemented. The UI's shared-data layer is not an authorization boundary. Production data access must derive tenant and school scope from authenticated membership, enforce field-level restrictions through column privileges or vetted views/functions, audit sensitive reads and writes, and never trust client-supplied roles or tenant IDs. Supabase messaging, 911 dispatch, identity checks, badge printing, and hardware integrations are not connected. Kiosk and emergency workflows remain demonstrations and must not be used for live safety operations, identity verification, custody, or payroll time.