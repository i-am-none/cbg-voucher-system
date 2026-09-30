# AGENTS.md — CBG Digital Payment Voucher System
## Enterprise Backend, Security, DevOps & RBAC Operating Contract

## 0. Document purpose

This document is the operating contract for every coding agent working on the backend integration.

The backend is a financial system. The objective is not merely to make database writes work. The objective is to establish a controlled chain from authenticated identity to authorized financial mutation, with tenant isolation, transactional integrity, auditability, recoverability and reproducible deployment.

The mandatory development cycle is:

```text
INSPECT
  ↓
RESEARCH RELEVANT SKILL / OFFICIAL DOCUMENTATION
  ↓
GENERATE DETAILED IMPLEMENTATION PROMPT
  ↓
REVIEW PLAN AGAINST REPOSITORY
  ↓
IMPLEMENT
  ↓
TEST
  ↓
SECURITY REVIEW
  ↓
REPORT
```

No non-trivial backend task may skip the prompt-generation stage.

### Prompt-first rule

Before implementation, the agent must generate a detailed implementation prompt containing:

- Role
- Objective
- Current repository findings
- Business requirement
- Technical requirements
- Security requirements
- Database impact
- Authentication impact
- Authorization impact
- Files to inspect
- Files to create
- Files to modify
- Files that must not be modified
- Migration strategy
- Testing strategy
- Rollback strategy
- Acceptance criteria
- Explicit non-goals
- Stop/clarification conditions

The agent must then execute that prompt, verify the result, and report what changed.



This file is the operating contract for every coding agent working on the CBG Digital Payment Voucher System.

The project is a financial workflow application for Chartered Brokers Group (CBG), Mauritius. It replaces a paper-based payment-voucher process with a controlled digital workflow.

This is **not a generic CRUD application**. The system handles financial records and must therefore prioritize:

1. Data integrity
2. Authorization correctness
3. Auditability
4. Tenant isolation
5. Security
6. Recoverability
7. Maintainability
8. User experience

A visually impressive feature that weakens any of the above is a failed feature.

---

# 1. Project context

## 1.1 Current business process

The existing CBG process is:

1. Employee manually writes a three-copy payment voucher.
2. Copies are used by Issuer / Maker / Approver.
3. Voucher is scanned for record keeping.
4. Another copy is provided to the payee where applicable.
5. Voucher information is manually re-entered into accounting software.

The application will progressively replace this with:

```text
Digital voucher entry
        ↓
Validation
        ↓
Database record
        ↓
Maker submission
        ↓
Approver review
        ↓
Approval / rejection
        ↓
Payment completion
        ↓
Accounting export
        ↓
Audit trail
        ↓
Long-term record
```

---

# 2. Current codebase baseline

The repository is a Next.js App Router application using:

- Next.js 16.3
- React 19
- TypeScript
- Tailwind CSS
- shadcn/ui
- React Hook Form
- Zod
- Framer Motion
- Lucide React
- Sonner

Current important routes:

```text
/
 /vouchers
 /vouchers/new
 /vouchers/[id]
```

Current reusable areas include:

```text
src/components/dashboard/
src/components/layout/
src/components/shared/
src/components/ui/
src/components/vouchers/
src/lib/
```

The current prototype uses:

```text
src/lib/voucher-store.ts
```

to persist mock voucher data in browser `localStorage`.

That localStorage implementation is **prototype-only** and must not survive as the production persistence mechanism.

The current voucher model already represents:

- voucher number
- date
- payment type
- payee
- payment details
- banking information
- authorization
- signatures
- timeline
- audit log
- created/updated timestamps
- creator

Do not throw away the existing frontend architecture merely because the persistence layer is changing.

The frontend is the existing product surface. Integrate the backend beneath it.

---

# 3. Verified voucher fields

The physical CBG voucher contains these core fields:

1. Payee
2. Date
3. PV No. / voucher serial number
4. Payment Details
5. Invoice No.
6. Amount (Rs.)
7. Cheque No.
8. Bank No.
9. Total
10. Prepared By
11. Approval To Pay
12. Name of Receiver
13. Signature of Receiver

The digital prototype also contains:

- Payment Type
- Currency
- Payee Address
- Payee Phone
- Bank Name
- Bank Account Number

The company header/footer contains CBG/Chartered Brokers branding and contact information.

Do not remove financial fields without an explicit requirement change.

---

# 4. Target architecture

The target production architecture is:

```text
                         Internet
                            │
                            ▼
                    Cloudflare / DNS
                            │
                            ▼
                  Managed Next.js Hosting
                            │
             ┌──────────────┴──────────────┐
             │                             │
             ▼                             ▼
        Better Auth                  Application Services
             │                             │
             └──────────────┬──────────────┘
                            │
                            ▼
                         Prisma
                            │
                            ▼
                     Neon PostgreSQL
                            │
             ┌──────────────┴──────────────┐
             │                             │
             ▼                             ▼
       Financial data                Audit/workflow
                            │
                            ▼
                    Private Object Storage
```

Initial infrastructure:

- PostgreSQL: Neon
- ORM: Prisma
- Authentication: Better Auth
- Application: existing Next.js App Router application
- Deployment: managed hosting initially
- DNS/edge: Cloudflare where appropriate
- Documents: private object storage, selected before attachment implementation
- CI/CD: Git-based CI with protected production deployment

Do not introduce Kubernetes, microservices, Redis, Kafka, Elasticsearch, service mesh or a custom API gateway without a demonstrated requirement.

Managed services reduce infrastructure responsibility. They do **not** remove application-level security responsibility.

# 5. Non-negotiable engineering principles

## 5.1 Never trust the client

Client-side validation is for UX.

It is NOT authorization.

It is NOT security.

It is NOT data integrity.

Every mutation must be validated and authorized on the server.

Example:

```text
Browser
  ↓
Client validation
  ↓
Server authentication
  ↓
Server authorization
  ↓
Server validation
  ↓
Database transaction
```

Never rely on:

```text
if (user.role === "approver") ...
```

in a client component as the actual security boundary.

The server must enforce the permission.

---

## 5.2 Never expose database credentials

Database credentials must never:

- appear in client components
- be prefixed with `NEXT_PUBLIC_`
- be committed to Git
- appear in logs
- be returned by API responses
- be embedded in generated frontend bundles

Use environment variables / deployment secret management.

---

## 5.3 Never use localStorage for production financial records

The current localStorage voucher store exists only because Phase 1 has no backend.

Once PostgreSQL is integrated:

- remove localStorage as the source of truth
- remove seeded production records
- retrieve vouchers from the server/database
- mutations must go through server-side application logic

localStorage may only be used for harmless UI preferences such as:

- sidebar state
- table page size
- theme preference

Never use it for financial records, roles, permissions, sessions, or approval state.

---

## 5.4 No hard deletes

Financial vouchers must not be physically deleted during normal application operation.

Instead:

```text
ACTIVE
VOIDED
```

or an equivalent immutable status transition should be used.

A voided voucher requires:

- actor
- timestamp
- reason
- previous status
- resulting status

The audit trail must remain.

If a future legal/compliance requirement requires actual deletion, that must be a separately designed data-retention process and never a normal UI delete button.

---

## 5.5 Approved financial fields become immutable

Once a voucher is approved:

- amount cannot be silently changed
- payee cannot be silently changed
- invoice number cannot be silently changed
- cheque number cannot be silently changed
- bank number cannot be silently changed
- payment description cannot be silently changed

If a correction is required after approval, implement an explicit correction/reversal workflow.

Do not allow:

```text
Approve → Edit amount → Save
```

That would destroy the integrity of the approval process.

---

# 6. Database strategy

## 6.1 PostgreSQL

Use PostgreSQL.

The database should remain portable PostgreSQL rather than using proprietary database features unnecessarily.

Neon is the initial hosting target because it provides managed PostgreSQL, connection pooling, branching, and serverless-friendly operation.

Official Prisma/Neon guidance should be consulted before configuring connections:

- https://www.prisma.io/docs/orm/v6/overview/databases/neon
- https://www.prisma.io/docs/orm/core-concepts/supported-databases/postgresql

---

## 6.2 Prisma

Use Prisma as the application data-access layer.

Prisma should provide:

- typed database access
- schema management
- migrations
- relation modeling
- transaction support

Do not use Prisma as an excuse to expose the database directly to the browser.

All financial operations must execute server-side.

---

## 6.3 Neon connection strategy

For Neon:

- use a pooled connection for application runtime traffic where appropriate
- use the direct connection for migrations/admin workflows where required by the current Prisma/Neon setup
- always require TLS/SSL
- never hard-code connection strings

Prisma's current guidance distinguishes pooled runtime connections from direct migration/admin connections. Follow the current official documentation rather than copying an old tutorial.

Do not blindly copy a Prisma/Neon configuration from an older blog post.

Official references:

- https://www.prisma.io/docs/orm/v6/overview/databases/neon
- https://www.prisma.io/docs/postgres/database/connection-pooling
- https://www.prisma.io/docs/postgres/database/connecting-to-your-database

---

# 7. Database domain model

The exact schema must be finalized before destructive implementation, but the conceptual model should contain at least:

```text
Tenant
User / Better Auth User
Organization Membership
Voucher
Voucher Status History
Voucher Audit Event
Voucher Export
Attachment / Document
```

Potential structure:

```text
Tenant
 ├── Users / Members
 ├── Vouchers
 │     ├── Status History
 │     ├── Audit Events
 │     └── Attachments
 └── Exports
```

---

# 8. Multi-tenancy

The system is expected to support financial records belonging to multiple CBG clients/entities.

Every tenant-owned financial record must have a tenant identifier.

At minimum:

```text
tenant_id
```

must exist on relevant business tables.

Never identify a tenant using:

- a client-provided query parameter alone
- a hidden form field
- localStorage
- a client-side React context
- a URL value that is trusted without server authorization

Tenant context must be derived from the authenticated server-side session/membership.

---

# 9. Row-Level Security

PostgreSQL Row-Level Security (RLS) is a future security layer, not a substitute for application authorization.

The implementation must not claim:

> "We have tenant_id, therefore the database is isolated."

That is false.

The application must first enforce tenant scope server-side.

If RLS is introduced, design and test it deliberately with the actual connection/session model. Do not enable RLS blindly and discover later that connection pooling prevents the intended tenant context from being propagated.

Required eventual invariant:

```text
A user can never read or mutate a voucher belonging to a tenant
for which that user has no authorized membership.
```

Test cross-tenant access explicitly.

---

# 10. Financial data types

Money must not be stored as JavaScript floating-point values in the database.

Do not use:

```text
Float
```

for monetary amounts.

Use PostgreSQL/Prisma decimal/numeric representation.

For example:

```text
Decimal(precision, scale)
```

with precision and scale chosen based on the accounting requirements.

Currency must be stored explicitly.

Do not calculate financial totals using binary floating-point arithmetic.

---

# 11. Voucher numbering

Voucher numbers must not be generated by the browser.

The current prototype generates numbers client-side.

Production numbering must be generated server-side and must be:

- unique
- concurrency-safe
- auditable
- deterministic
- tenant-aware if required by CBG
- resistant to duplicate creation

Never use:

```text
SELECT MAX(voucher_number) + 1
```

for production numbering.

Two simultaneous users can receive the same number.

Use a database-backed sequence/counter/transaction strategy.

The exact numbering policy must be confirmed with CBG before production rollout.

---

# 12. Voucher lifecycle

The target lifecycle is:

```text
DRAFT
   │
   ▼
PENDING_APPROVAL
   │
   ├──────────────► REJECTED
   │
   ▼
APPROVED
   │
   ▼
PAID
   │
   ▼
ARCHIVED / COMPLETED
```

A rejected voucher may be returned to an appropriate editable state only through an explicit workflow.

Do not allow arbitrary status changes from the frontend.

Example of forbidden behavior:

```text
PATCH /voucher/:id
{
  "status": "approved"
}
```

without a server-side permission and workflow check.

---

# 13. Maker / Approver separation

The minimum roles are:

```text
ADMIN
MAKER
APPROVER
AUDITOR
```

Recommended permissions:

### ADMIN

Can:

- manage users
- manage tenant membership
- configure application settings
- view vouchers
- manage roles
- view audit logs
- perform administrative actions

Admin must not automatically be treated as a payment approver unless CBG explicitly defines that policy.

### MAKER

Can:

- create vouchers
- save drafts
- edit own permitted drafts
- submit vouchers for approval
- view vouchers they are authorized to view

Cannot:

- approve their own voucher
- change approved financial fields
- bypass approval
- delete financial records

### APPROVER

Can:

- view pending vouchers
- review voucher details
- approve
- reject with reason
- view relevant history

Must not approve their own voucher if maker/approver separation is required by CBG.

### AUDITOR

Can:

- read vouchers
- read audit history
- read approval history
- inspect exports
- access reporting functionality

Cannot:

- create vouchers
- modify vouchers
- approve vouchers
- delete/void records unless explicitly granted a separate permission

---

# 14. Better Auth strategy

Use Better Auth as the authentication foundation.

Official references:

- https://better-auth.com/docs/introduction
- https://better-auth.com/docs/integrations/next
- https://better-auth.com/docs/adapters/prisma
- https://better-auth.com/docs/plugins/admin
- https://better-auth.com/docs/plugins/organization
- https://better-auth.com/docs/plugins/2fa

Better Auth's current Next.js integration mounts the auth handler at:

```text
/api/auth/[...all]
```

Follow the current official documentation when implementing it.

Do not invent a custom authentication system.

---

# 15. Better Auth + Prisma

Use the Better Auth Prisma adapter.

Authentication tables must live in PostgreSQL.

Do not create a second unrelated authentication database.

Better Auth schema changes must be managed through its supported schema generation/migration process and then reconciled with the project's Prisma migration workflow.

Never manually delete Better Auth tables because they "look unused."

---

# 16. Better Auth role strategy

Because this application is expected to become multi-tenant, prefer tenant/org-scoped roles rather than treating all roles as one global string.

Recommended conceptual model:

```text
Platform role:
    PLATFORM_ADMIN

Tenant/org roles:
    ADMIN
    MAKER
    APPROVER
    AUDITOR
```

Use Better Auth's organization/access-control capabilities where they fit the final tenant model.

Do not use dynamic runtime role creation initially unless CBG explicitly requires custom roles.

Start with a controlled fixed permission matrix.

---

# 17. Permission model

Authorization should be permission-based internally, even if the UI displays roles.

Example resources:

```text
voucher
voucher_approval
voucher_export
audit_log
tenant
user
report
```

Example actions:

```text
create
read
update
submit
approve
reject
mark_paid
export
void
manage
```

Example:

```text
voucher:create
voucher:read
voucher:update
voucher:submit
voucher:approve
voucher:reject
voucher:mark_paid
voucher:export
voucher:void
audit:read
user:manage
tenant:manage
```

A role is a bundle of permissions.

Do not scatter role checks throughout the codebase like:

```text
if role === "maker"
if role === "approver"
if role === "admin"
```

Prefer centralized authorization functions/policies.

---

# 18. Server-side authorization

Every financial mutation must follow:

```text
Request
 ↓
Authenticate session
 ↓
Resolve tenant
 ↓
Load target record
 ↓
Verify tenant ownership
 ↓
Verify permission
 ↓
Verify workflow state
 ↓
Validate input
 ↓
Execute transaction
 ↓
Write audit event
 ↓
Return safe response
```

The order may be optimized where appropriate, but no security step may be omitted.

---

# 19. Authentication security requirements

At minimum:

- secure session cookies
- HTTP-only cookies
- Secure cookies in production
- trusted origins configured explicitly
- HTTPS in production
- rate limiting
- password policy
- email verification if email/password authentication is used
- session revocation
- secure logout
- protection against brute-force authentication attempts

Better Auth provides secure-cookie behavior and built-in rate limiting. Configure it explicitly for the production environment and verify the deployed behavior.

Do not expose session tokens to JavaScript unless the chosen Better Auth flow explicitly requires it.

---

# 20. MFA / 2FA

Because this is financial software, MFA should be part of the production security roadmap.

Prefer TOTP-based 2FA initially unless CBG requires another mechanism.

Recommended:

```text
Password
   +
Authenticator-app TOTP
```

Do not make 2FA merely a frontend checkbox.

The server must enforce the authentication state.

Better Auth has an official two-factor plugin.

Do not implement home-grown OTP cryptography.

---

# 21. Audit logging

Audit logs are not application debug logs.

They are financial records.

Every important event must create an audit event.

At minimum:

```text
voucher.created
voucher.updated
voucher.submitted
voucher.approved
voucher.rejected
voucher.marked_paid
voucher.voided
voucher.exported
user.created
user.role_changed
user.disabled
authentication events where appropriate
```

Each audit event should capture as appropriate:

```text
id
tenant_id
actor_user_id
action
entity_type
entity_id
timestamp
metadata
request/correlation id
```

Do not store passwords, session tokens, or secrets in audit metadata.

---

# 22. Audit log integrity

Audit logs should be append-only from the application perspective.

No normal user should have a UI button that says:

```text
Delete audit event
```

Do not update old audit events to make history look cleaner.

If a correction is required, create a new event.

Example:

```text
voucher.amount_changed
```

followed by:

```text
voucher.approved
```

rather than rewriting the old event.

---

# 23. Approval integrity

Approval should happen inside a database transaction.

A successful approval should atomically:

1. Verify the session.
2. Verify the approver permission.
3. Verify tenant membership.
4. Verify the voucher is currently pending approval.
5. Verify the approver is allowed to approve it.
6. Freeze protected financial fields.
7. Update status.
8. Create status history.
9. Create audit event.

If any step fails, the transaction must roll back.

Do not create an approval record and update the voucher in separate unprotected operations.

---

# 24. Prevent self-approval

If CBG's policy requires maker-checker separation:

```text
created_by !== approved_by
```

must be enforced server-side.

Never rely on hiding the Approve button.

The API must reject self-approval even if a malicious user manually sends the request.

---

# 25. Sensitive fields

Potentially sensitive financial fields include:

- bank account number
- cheque number
- bank number
- personally identifying payee information

The project brief calls for field-level encryption for cheque number and bank number.

Before implementing encryption:

1. Confirm exactly which fields require encryption.
2. Decide whether searching/filtering those fields is required.
3. Choose encryption strategy.
4. Define key management.
5. Define rotation strategy.
6. Define backup/restore implications.
7. Define how authorized users decrypt data.

Do not invent encryption code casually.

Do not use:

```text
AES(key stored in source code)
```

That is not security.

Application-level encryption keys must live in a secret-management system/environment secrets, never in Git.

---

# 26. Searchability vs encryption

Encrypted fields cannot necessarily be searched like normal text.

Therefore, if CBG needs exact lookup by cheque number or bank number, design a separate safe lookup mechanism such as a keyed hash/index where appropriate.

Do not compromise encryption merely to make a table filter convenient.

---

# 27. Attachments

When document storage is implemented:

Do not store large PDFs/images directly in PostgreSQL unless there is a documented reason.

Prefer:

```text
Object storage
    ↓
Database stores metadata
```

Database metadata should include:

```text
id
tenant_id
voucher_id
storage_key
original_filename
mime_type
size
checksum
uploaded_by
created_at
```

Validate:

- MIME type
- file size
- extension
- content where possible

Never trust the filename extension.

Use signed/private URLs for private documents.

Do not expose a public bucket containing financial records.

---

# 28. CSV export

CSV export is a future accounting integration feature.

Before implementation, confirm:

- exact accounting software
- required columns
- date format
- amount format
- currency format
- account codes
- delimiter
- encoding
- header requirements
- whether one row equals one voucher or one line item

CSV export must be audited:

```text
who
when
tenant
filters
records exported
```

Never allow a user to export records outside their tenant.

---

# 29. PDF generation

PDF generation is a future feature.

The PDF should reproduce the relevant voucher information and eventually support the three-copy workflow if required:

```text
Issuer
Maker
Approver
```

Do not implement PDF generation by screenshotting the webpage.

Create a deterministic print/PDF representation from structured data.

---

# 30. Current frontend migration plan

The current frontend must transition from:

```text
React form
   ↓
localStorage
```

to:

```text
React form
   ↓
server action / route handler / application service
   ↓
validation
   ↓
authorization
   ↓
Prisma
   ↓
PostgreSQL
```

Do not make the browser connect directly to Neon.

---

# 31. Recommended application structure after backend integration

Keep the existing component structure, but introduce explicit server-side boundaries.

A recommended structure:

```text
src/
├── app/
│   ├── api/
│   │   └── auth/
│   │       └── [...all]/
│   ├── login/
│   ├── vouchers/
│   └── ...
│
├── components/
│   ├── dashboard/
│   ├── layout/
│   ├── shared/
│   ├── ui/
│   └── vouchers/
│
├── lib/
│   ├── auth.ts
│   ├── auth-client.ts
│   ├── db.ts
│   ├── permissions.ts
│   ├── validation.ts
│   ├── constants.ts
│   └── format.ts
│
├── server/
│   ├── vouchers/
│   ├── approvals/
│   ├── audit/
│   └── users/
│
└── prisma/
    ├── schema.prisma
    └── migrations/
```

Exact structure may vary if the framework version recommends a different convention.

Do not create folders merely for decoration.

---

# 32. Database access layer

Create a single reusable Prisma client.

Do not instantiate a new Prisma client inside every request.

Avoid:

```text
new PrismaClient()
```

inside route handlers repeatedly.

Use a controlled server-side database module.

Never import the database module into client components.

---

# 33. Validation strategy

Zod schemas can be reused conceptually, but distinguish:

```text
form validation
```

from:

```text
server/domain validation
```

The server must not assume that data passed from the frontend has been validated.

Validate again server-side.

For example:

```text
CreateVoucherInput
UpdateVoucherInput
SubmitVoucherInput
ApproveVoucherInput
RejectVoucherInput
VoidVoucherInput
```

should be separate where their rules differ.

Do not use one giant schema for every operation.

---

# 34. State machine discipline

Voucher status transitions must be explicit.

Example:

```text
DRAFT
  → PENDING_APPROVAL

PENDING_APPROVAL
  → APPROVED
  → REJECTED

APPROVED
  → PAID

DRAFT
  → VOIDED

REJECTED
  → DRAFT
```

The exact transitions must be confirmed with CBG.

Implement a centralized transition policy.

Do not allow:

```text
DRAFT → PAID
```

unless the business explicitly requires it.

---

# 35. Concurrency

Financial systems must assume concurrent users.

Example:

Two approvers open the same voucher.

Both click Approve.

Only one approval should succeed.

Use:

- transaction boundaries
- state checks
- appropriate database constraints
- optimistic concurrency/versioning where necessary

The second approval should receive a safe conflict response rather than silently creating duplicate state.

---

# 36. Idempotency

Important financial operations should be designed to avoid duplicate execution.

Especially:

- approval
- payment completion
- export generation
- external accounting integration later

A repeated request must not accidentally create:

```text
two approvals
two payments
two external accounting entries
```

where only one should exist.

---

# 37. Database constraints

Business rules should be enforced in both:

```text
application layer
```

and where appropriate:

```text
database layer
```

Examples:

- unique voucher number
- valid foreign keys
- non-null required financial fields
- valid status values
- valid tenant relationships

Never rely exclusively on frontend validation.

---

# 38. Migration discipline

Every production database change must be represented by a migration.

Do not use:

```text
prisma db push
```

as the production deployment strategy.

Use versioned migrations.

Development:

```text
migration creation
↓
local verification
↓
test database
↓
production migration
```

Never manually edit production tables to "quickly fix" something.

If an emergency production change is unavoidable, create the corresponding migration afterward and document the incident.

---

# 39. Environment separation

Maintain distinct environments:

```text
development
staging
production
```

At minimum, development and production must never share a database.

Preferred:

```text
Neon
├── development branch/database
├── staging branch/database
└── production branch/database
```

Neon's branching capability can be used where appropriate.

Never point local development at the production database.

---

# 40. Environment variables

Use variables such as:

```text
DATABASE_URL
DIRECT_URL
BETTER_AUTH_SECRET
BETTER_AUTH_URL / base URL as required by current Better Auth version
```

Additional secrets may be added later for:

```text
EMAIL_PROVIDER
OBJECT_STORAGE
ENCRYPTION_KEY
ERROR_MONITORING
```

Never commit `.env`.

Maintain:

```text
.env.example
```

containing variable names only, with fake/example values.

---

# 41. Git rules

Never commit:

- `.env`
- database passwords
- Better Auth secrets
- encryption keys
- private API keys
- production exports
- real customer financial data
- real voucher PDFs
- authentication cookies/tokens

If a secret is accidentally committed:

1. Rotate the secret immediately.
2. Remove it from the repository history where appropriate.
3. Audit whether it was accessed.
4. Document the incident.

Deleting the file from the latest commit is not sufficient if the secret remains in Git history.

---

# 42. Seed data

Seed data is allowed for development/testing.

It must be obviously fake.

Example:

```text
Demo Supplier Ltd.
demo@example.invalid
PV-DEMO-0001
```

Never seed:

- real CBG customer information
- real bank accounts
- real cheque numbers
- real employee credentials

---

# 43. Authentication UI

Add:

```text
/login
```

and eventually:

```text
/forgot-password
/reset-password
/profile
/security
```

The authenticated application should not render financial pages to unauthenticated users.

Use server-side session checks for protected pages/actions.

Do not merely hide navigation links.

---

# 44. Role-aware UI

The frontend may hide actions the current user cannot perform.

Example:

```text
Maker:
  Create Voucher       visible
  Approve              hidden

Approver:
  Create Voucher       optionally hidden
  Approve              visible

Auditor:
  Create Voucher       hidden
  Approve              hidden
  Audit Log            visible
```

But this is only UX.

The backend must independently enforce the same permission.

---

# 45. Error handling

Never expose:

- SQL errors
- stack traces
- database connection strings
- internal file paths
- authentication internals
- encryption details

to end users.

Return safe user-facing messages.

Log detailed errors server-side.

Use correlation/request IDs where practical.

---

# 46. Logging

Application logs must be structured enough to investigate failures.

Do not log:

- passwords
- session tokens
- full bank account numbers
- full cheque numbers
- encryption keys
- sensitive authentication data

Prefer redacted values:

```text
********1234
```

when identifying a financial field is necessary.

---

# 47. Testing requirements

Do not consider a feature complete because:

```text
npm run build
```

passes.

At minimum, important business logic needs tests.

Especially:

### Authorization

Test:

```text
Maker cannot approve
Maker cannot approve own voucher
Approver can approve permitted voucher
Auditor cannot modify
Tenant A cannot access Tenant B
Unauthenticated user cannot access protected data
```

### Workflow

Test:

```text
Draft → Submit
Submit → Approve
Submit → Reject
Approved → Paid
Invalid transition rejected
```

### Integrity

Test:

```text
Duplicate voucher number rejected
Approved amount cannot be modified
Concurrent approval handled correctly
Void requires reason
Audit event generated
```

---

# 48. Security testing checklist

Before production:

- authentication tests
- authorization tests
- tenant isolation tests
- session tests
- CSRF/trusted-origin tests
- rate-limit tests
- input validation tests
- SQL injection tests
- XSS tests
- file upload tests
- IDOR tests
- privilege escalation tests
- audit log tests
- backup restore test

IDOR is especially important.

This request:

```text
/vouchers/ABC123
```

must not reveal a voucher simply because the attacker guessed another ID.

---

# 49. Performance principles

Do not prematurely optimize.

Start with:

- indexed tenant_id
- indexed voucher number
- indexed date
- indexed status
- indexed created_by
- sensible pagination

Do not load 100,000 vouchers into the browser.

The history table should eventually query the server with:

```text
search
status
date
tenant
pagination
sorting
```

rather than filtering an entire database in React.

---

# 50. Pagination

Use server-side pagination for production voucher history.

Never implement production pagination by:

```text
SELECT * FROM vouchers
```

and then slicing the result in JavaScript.

Use database pagination.

Cursor pagination may become useful at scale, but offset pagination is acceptable initially if query patterns remain small and indexed.

---

# 51. Search

Search requirements must be defined before building sophisticated search infrastructure.

Initial search can support:

- voucher number
- payee name
- invoice number
- date
- status

Add PostgreSQL indexes based on actual query patterns.

Do not introduce Elasticsearch/OpenSearch for a voucher database that contains 10,000 records.

---

# 52. UI preservation rule

When backend integration begins:

**Do not redesign the application unnecessarily.**

The current frontend has already established:

- layout
- dashboard
- voucher history
- voucher creation
- voucher details
- reusable components

Backend integration should preserve the visual language unless a concrete usability/security requirement requires change.

---

# 53. API/server action design

Choose the least complex appropriate server boundary.

Possible options:

- Next.js Route Handlers
- Server Actions
- server-side application services

Do not create an API endpoint for every internal function merely because APIs feel enterprise-like.

Use a clear service layer for business operations.

Example conceptual functions:

```text
createVoucher()
updateDraftVoucher()
submitVoucher()
approveVoucher()
rejectVoucher()
markVoucherPaid()
voidVoucher()
listVouchers()
getVoucher()
exportVouchers()
```

These operations should centralize business rules.

---

# 54. Transaction boundaries

Use database transactions for multi-record state changes.

Examples:

```text
approveVoucher()
```

should update:

```text
voucher
voucher_status_history
audit_event
```

atomically.

If one operation fails, the whole operation should fail.

---

# 55. Auditability of exports

Every export should create an audit event.

Record:

```text
actor
tenant
timestamp
export type
filters
number of records
```

Avoid storing the full exported financial dataset in the audit table unless explicitly required.

---

# 56. Accounting integration boundary

The accounting software has not yet been fully identified.

Therefore:

**Do not hard-code an accounting-system-specific database schema now.**

First determine:

- accounting software name/version
- import format
- required fields
- whether CSV import exists
- whether API integration exists
- whether account codes are required

Then design the export adapter.

Keep the voucher domain independent from the accounting software.

---

# 57. Deployment strategy

Initial target:

```text
Managed Next.js hosting
+
Neon PostgreSQL
```

The application must remain portable.

Avoid provider-specific database features unless there is a strong reason.

Production deployment should include:

```text
HTTPS
secure environment variables
database backups
monitoring
error tracking
rate limiting
health checks
migration process
rollback plan
```

---

# 58. Backup strategy

A production financial system must have tested backups.

Define:

```text
backup frequency
retention
encryption
off-site storage
restore procedure
RPO
RTO
```

Do not say:

> "The provider has backups."

That is incomplete.

The team must know:

```text
How do we restore?
How long does restoration take?
How much data can we lose?
Who can initiate restoration?
```

Perform periodic restore tests.

---

# 59. Disaster recovery

Before production, document:

```text
Application unavailable
Database unavailable
Database corruption
Credential compromise
Accidental configuration deletion
Bad migration
Cloud provider outage
```

For each incident define:

```text
detection
containment
recovery
verification
communication
postmortem
```

---

# 60. Development workflow for coding agents

Every agent task must follow this sequence.

## Step 1 — Inspect

Before changing code:

- inspect package.json
- inspect relevant routes
- inspect components
- inspect current types
- inspect validation
- inspect current store/service
- inspect configuration
- inspect existing migrations if any

Do not assume the repository matches an older description.

---

## Step 2 — Understand

Write down:

```text
What currently exists?
What is changing?
Why is it changing?
What must not break?
What security boundary is affected?
```

---

## Step 3 — Plan

For non-trivial changes, identify:

- files to create
- files to modify
- schema changes
- migration changes
- authorization changes
- tests
- security implications

---

## Step 4 — Implement the smallest coherent change

Do not modify unrelated parts of the system.

Do not rewrite the application because a new feature touches one component.

---

## Step 5 — Validate

Run appropriate checks:

```text
npm run lint
npm run build
```

and relevant tests.

For database work also verify:

```text
migration
database connection
schema generation
query behavior
authorization
```

---

## Step 6 — Review security

Ask:

```text
Can an unauthenticated user do this?
Can another tenant do this?
Can another role do this?
Can a user bypass the UI?
Can duplicate requests cause duplicate financial state?
Can approved data be modified?
Is the action audited?
```

---

## Step 7 — Report

Every implementation task should end with:

```text
Implemented:
- ...

Changed:
- ...

Database:
- ...

Security:
- ...

Tests:
- ...

Remaining:
- ...
```

Never claim a feature is complete when a major security or database requirement is still mocked.

---

# 61. Backend implementation program

Do not implement the backend as one large task.

Every phase follows:

```text
1. Generate the detailed implementation prompt.
2. Inspect the repository against that prompt.
3. Read the relevant specialist skill if available.
4. Read current official vendor documentation.
5. Implement only that phase.
6. Run tests and validation.
7. Perform a security review.
8. Produce a completion report.
9. Only then begin the next phase.
```

## Phase 0 — Repository and dependency baseline

### Implementation prompt

```text
You are the lead backend engineer performing a repository baseline audit.

Inspect the complete repository before modifying anything.

Inspect:
- package.json
- lockfile
- prisma/
- prisma.config.ts
- src/lib/
- src/server/
- app/
- authentication code
- current voucher types
- validation schemas
- localStorage/mock persistence
- environment files
- deployment configuration
- test configuration
- Git status

Identify:
- current PostgreSQL assumptions
- current Prisma setup
- current database adapter
- unsafe client-trusted fields
- hard-coded actors
- hard-coded tenant assumptions
- missing authorization boundaries
- existing migrations
- dependency/version mismatches
- deployment assumptions
- security risks

Do not change business behavior.

Deliver:
- architecture findings
- security findings
- migration risks
- exact files that should change in Phase 1
- explicit assumptions requiring confirmation
```

### Acceptance

```text
[ ] Repository inspected
[ ] Current persistence path documented
[ ] Current auth path documented
[ ] Security gaps documented
[ ] No unnecessary code changed
```

---

## Phase 1 — Neon + Prisma database foundation

### Implementation prompt

```text
Establish the managed PostgreSQL foundation using Neon and Prisma.

Requirements:
- preserve the existing voucher domain
- create one reusable server-side Prisma Client
- configure pooled runtime database access
- configure direct database access for migrations/admin workflows where required
- require TLS
- create .env.example
- keep all credentials server-side
- create the initial normalized schema
- add foreign keys
- add unique constraints
- add indexes based on actual query patterns
- use Decimal/numeric for monetary values
- implement concurrency-safe voucher numbering
- use migrations, not production db push
- verify transactions
- remove obsolete database adapter code only after confirming it is unused

Do not connect the browser directly to Neon.

Before implementing, read current Prisma/Neon documentation because connection and migration behavior is version-sensitive.
```

### Acceptance

```text
[ ] Development Neon database connects
[ ] Prisma Client works server-side
[ ] Migration applies cleanly
[ ] Migration can be recreated/applied on a clean database
[ ] Financial fields use correct numeric representation
[ ] Constraints are tested
[ ] Browser cannot access DB credentials
[ ] Lint/typecheck/build pass
```

---

## Phase 2 — Better Auth foundation

### Implementation prompt

```text
Integrate Better Auth using the current official Next.js and Prisma integration.

Requirements:
- Better Auth server configuration
- Prisma adapter
- authentication schema
- /api/auth/[...all]
- secure session handling
- HTTP-only/Secure cookies as appropriate
- explicit trusted origins
- rate limiting
- login
- logout
- session retrieval
- protected-route strategy
- safe error behavior

Do not implement business RBAC yet beyond the minimum identity/session plumbing.

Do not invent password hashing, sessions, tokens or cryptography.

Generate the Better Auth schema using the supported tooling for the installed version, inspect the result, then create a controlled migration.

Verify every Better Auth API against current official documentation before implementation.
```

### Acceptance

```text
[ ] Login works
[ ] Logout works
[ ] Invalid login fails safely
[ ] Session is server-verifiable
[ ] Auth secrets are not client-visible
[ ] Trusted origins are explicit
[ ] Rate limiting is configured
[ ] Auth schema is migration-controlled
[ ] Authentication tests exist
```

---

## Phase 3 — Organization and tenant model

### Implementation prompt

```text
Implement the organization/tenant security boundary.

Requirements:
- define organization ownership
- define membership
- connect Better Auth identity to organization membership
- add organization_id to tenant-owned financial records
- derive organization from authenticated membership
- reject client-supplied tenant IDs as authoritative
- centralize tenant resolution
- test cross-tenant reads and mutations

Do not invent CBG's legal entity structure. If the business structure is ambiguous, stop and ask.

Do not implement advanced organization switching until the authorization model is correct.
```

### Acceptance

```text
[ ] Organization exists
[ ] Membership exists
[ ] Voucher belongs to organization
[ ] Tenant context is server-derived
[ ] Cross-tenant reads fail
[ ] Cross-tenant mutations fail
[ ] Tests prove isolation
```

---

## Phase 4 — Centralized RBAC and authorization

### Implementation prompt

```text
Implement centralized role-based access control with permission-based enforcement.

Roles:
- PLATFORM_ADMIN
- ADMIN
- MAKER
- APPROVER
- AUDITOR

Initial permission catalog:
- voucher:create
- voucher:read
- voucher:update
- voucher:submit
- voucher:approve
- voucher:reject
- voucher:mark_paid
- voucher:export
- voucher:void
- audit:read
- user:read
- user:manage
- organization:read
- organization:manage
- report:read

Requirements:
- central permission definitions
- role-to-permission mapping
- organization-scoped membership
- requireSession()
- requireMembership()
- requirePermission()
- requireTenantAccess()
- server-side enforcement
- UI visibility is only UX, never authorization
- maker cannot self-approve
- ADMIN does not automatically become APPROVER unless CBG explicitly approves that policy

Add negative authorization tests before wiring all UI actions.
```

### Acceptance

```text
[ ] Permissions are centralized
[ ] Roles map to permissions
[ ] Server checks exist
[ ] Maker cannot approve
[ ] Maker cannot self-approve
[ ] Auditor cannot mutate
[ ] Cross-tenant access fails
[ ] Privilege escalation tests pass
```

---

## Phase 5 — Replace localStorage with database persistence

### Implementation prompt

```text
Replace prototype localStorage persistence with server-side Prisma/PostgreSQL persistence while preserving the existing frontend.

Requirements:
- remove localStorage as financial source of truth
- retrieve vouchers from server/database
- create through application service
- update drafts through application service
- derive actor from Better Auth session
- derive organization from membership
- never trust actor or tenant values from the client
- keep existing UI structure
- add proper loading/error/empty states
- preserve existing voucher fields
- add authorization to every read and mutation

Do not redesign the frontend unless necessary for correctness or security.
```

### Acceptance

```text
[ ] No financial records use localStorage
[ ] Current user comes from session
[ ] Organization comes from membership
[ ] Voucher CRUD works
[ ] Existing pages remain functional
[ ] Unauthorized access fails server-side
[ ] Database operations are tested
```

---

## Phase 6 — Voucher state machine and financial workflow

### Implementation prompt

```text
Implement explicit domain operations:

createVoucher()
updateDraftVoucher()
submitVoucher()
approveVoucher()
rejectVoucher()
markVoucherPaid()
voidVoucher()

Candidate lifecycle:
DRAFT
PENDING_APPROVAL
REJECTED
APPROVED
PAID
COMPLETED
VOIDED

Requirements:
- centralized transition policy
- server-side authorization
- server-side validation
- transaction boundaries
- maker-checker separation
- approved-field immutability
- audit event for every state transition
- conflict handling for concurrent requests
- no arbitrary client-side status assignment
- no hard delete
```

### Acceptance

```text
[ ] Valid transitions work
[ ] Invalid transitions fail
[ ] Self-approval fails
[ ] Approved fields cannot be silently changed
[ ] Void requires reason
[ ] Concurrent approval is deterministic
[ ] Every transition is audited
```

---

## Phase 7 — Audit and financial traceability

### Implementation prompt

```text
Implement an append-only financial audit system.

Capture at minimum:
- voucher.created
- voucher.updated
- voucher.submitted
- voucher.approved
- voucher.rejected
- voucher.marked_paid
- voucher.voided
- voucher.exported
- user.created
- user.disabled
- user.role_changed
- membership.created
- membership.removed

Where appropriate, capture important authentication/security events.

Each event should include:
- id
- organization_id
- actor_user_id
- action
- entity_type
- entity_id
- timestamp
- request/correlation ID
- safe metadata

Never store passwords, tokens, secrets or encryption keys.

Audit events are not normal application logs and must not be editable/deletable through normal application operations.
```

### Acceptance

```text
[ ] Required mutations generate events
[ ] Actor is recorded
[ ] Organization is recorded
[ ] Entity is recorded
[ ] Timestamp exists
[ ] Secrets are excluded
[ ] Audit history cannot be rewritten normally
```

---

## Phase 8 — MFA / 2FA

### Implementation prompt

```text
Add production-grade MFA using Better Auth's supported two-factor capability.

Define before implementation:
- enrollment
- verification
- recovery
- disablement
- admin reset
- audit events
- session behavior after enabling/disabling MFA

Prefer TOTP using authenticator applications.

Do not implement custom OTP cryptography.

MFA must be enforced server-side, not represented only by frontend state.
```

### Acceptance

```text
[ ] Enrollment works
[ ] Verification works
[ ] Invalid codes fail
[ ] Recovery behavior is defined
[ ] Disablement is authorized
[ ] Security events are audited
[ ] MFA state cannot be forged client-side
```

---

## Phase 9 — Security hardening and threat model

### Implementation prompt

```text
Perform a formal security review of the backend.

Threats to evaluate:
- credential theft
- session theft
- IDOR
- cross-tenant access
- privilege escalation
- self-approval
- duplicate approval
- voucher tampering
- CSV exfiltration
- private document exposure
- XSS
- CSRF
- SQL injection
- brute-force authentication
- rate-limit bypass
- secret leakage
- malicious insider
- bad migration
- backup compromise
- provider outage

For every material threat document:
asset
attacker
attack
control
detection
response

Test the actual implementation. Do not merely state that the control exists.
```

### Acceptance

```text
[ ] Threat model documented
[ ] IDOR tested
[ ] Tenant isolation tested
[ ] Privilege escalation tested
[ ] Self-approval tested
[ ] Authentication abuse tested
[ ] Secret leakage checked
[ ] Security headers reviewed
[ ] Error leakage reviewed
[ ] Dependency security reviewed
```

---

## Phase 10 — CI/CD and DevOps

### Implementation prompt

```text
Create a reproducible production deployment pipeline.

Requirements:
- Git-based deployment
- CI on pull requests
- lint
- typecheck
- unit/integration tests
- build
- environment separation
- secret management
- staging/preview strategy
- production approval/protection where supported
- migration deployment strategy
- rollback strategy

Database migrations must be reviewed and deployed through controlled CI/CD or the approved deployment mechanism.

Do not deploy production directly from a developer laptop.
Do not use production credentials in preview environments unless explicitly isolated.
```

### Acceptance

```text
[ ] CI runs automatically
[ ] Build is reproducible
[ ] Tests gate deployment
[ ] Secrets are isolated
[ ] Staging is isolated
[ ] Production migration procedure is documented
[ ] Rollback procedure is documented
```

---

## Phase 11 — Observability, backups and disaster recovery

### Implementation prompt

```text
Implement production operational controls.

Requirements:
- application error monitoring
- structured logs
- request/correlation IDs
- database health monitoring
- deployment monitoring
- backup verification
- restore procedure
- RPO
- RTO
- incident response runbook

Do not log sensitive financial or authentication payloads.

A backup is not considered valid until restoration has been tested.
```

### Acceptance

```text
[ ] Errors are observable
[ ] Logs are redacted
[ ] Database health is observable
[ ] Backup policy is documented
[ ] Restore has been tested
[ ] RPO/RTO are documented
[ ] Incident response procedure exists
```

---

## Phase 12 — Private file/document storage

### Implementation prompt

```text
Implement private attachment storage only after database/auth/RBAC are stable.

Requirements:
- private object storage
- voucher attachment metadata
- organization ownership
- authorization before download
- signed/private access
- file size validation
- MIME validation
- content validation where practical
- checksum
- audit upload/download/access events
- no public financial-document bucket
```

### Acceptance

```text
[ ] Documents are private
[ ] Cross-tenant downloads fail
[ ] Unauthorized downloads fail
[ ] Upload validation exists
[ ] Access is auditable
```

---

## Phase 13 — Accounting export boundary

### Implementation prompt

```text
Implement CSV export only after the accounting software and exact import contract are confirmed.

Requirements:
- server-side export
- authorization
- tenant isolation
- deterministic field mapping
- exact accounting format
- appropriate encoding
- safe filename
- audit export
- no cross-tenant records

Do not hard-code an accounting-system-specific schema into the core voucher domain before the target system is confirmed.
```

### Acceptance

```text
[ ] Accounting format confirmed
[ ] Export matches sample import
[ ] Authorization enforced
[ ] Export audited
[ ] Tenant isolation verified
```

---

# 93. Specialist skill routing

For every phase, the agent must use the relevant specialist capability if the environment provides one.

Recommended mapping:

```text
Repository audit
→ repository/codebase analysis skill

Prisma / Neon / migrations
→ database / Prisma skill

Better Auth
→ authentication / Better Auth skill

RBAC / tenant isolation
→ authorization / security skill

Threat modeling
→ security skill

CI/CD / hosting
→ DevOps / deployment skill

Tests
→ testing skill

Observability
→ monitoring / DevOps skill

Object storage
→ storage/security skill
```

If the environment exposes a skill registry, search it before implementing the phase.

If no suitable skill exists, use official vendor documentation and explicitly record that fallback in the implementation report.

Do not claim that a skill was used if it was not available.

---

# 94. Official documentation policy

Security-sensitive APIs must be checked against current official documentation.

Primary references:

Better Auth:
- Introduction
- Next.js integration
- Prisma adapter
- Organization
- Admin/access control
- 2FA
- Rate limiting

Prisma:
- PostgreSQL connector
- Prisma Client connection pooling
- migrations
- Neon integration

Neon:
- PostgreSQL connection
- pooling
- branching
- backups/recovery
- security

Hosting provider:
- Next.js deployment
- environment secrets
- preview deployments
- production deployment protections

Never copy a configuration from a stale blog when the vendor's current documentation differs.

---

# 95. Production security checklist

Before production:

```text
[ ] HTTPS enforced
[ ] Secure cookies verified
[ ] Trusted origins explicit
[ ] Rate limiting configured
[ ] Password reset secured
[ ] MFA policy implemented or explicitly deferred
[ ] RBAC server-enforced
[ ] Tenant isolation tested
[ ] IDOR tested
[ ] Maker-checker enforced
[ ] Approved financial fields immutable
[ ] Audit events append-only
[ ] Secrets isolated
[ ] Database TLS enabled
[ ] Database credentials not client-visible
[ ] Private document storage
[ ] Security headers reviewed
[ ] Error leakage reviewed
[ ] Dependency vulnerabilities reviewed
[ ] Backup restore tested
[ ] Migration rollback strategy documented
[ ] CI/CD protected
[ ] Production access least-privileged
```

---

# 96. Agent stop conditions

The agent MUST stop and request clarification when:

- CBG approval policy is ambiguous
- voucher numbering policy is ambiguous
- tenant/legal entity structure is ambiguous
- accounting format affects schema
- retention requirements are unknown
- signature requirements affect legal validity
- encryption conflicts with required search behavior
- a destructive migration is required
- production credentials are missing
- a security design has materially different options
- implementation would silently change financial semantics

Never invent financial policy.

---

# 97. Forbidden shortcuts

Never:

- disable authentication to unblock development
- trust client-provided roles
- trust client-provided tenant IDs
- trust client-provided actor IDs
- connect the browser directly to PostgreSQL
- store financial records in localStorage
- use Float for monetary persistence
- use `MAX(number) + 1` for voucher numbering
- allow arbitrary status mutation
- allow self-approval
- hard-delete approved financial records
- log secrets
- commit `.env`
- seed real customer data
- use `prisma db push` for production migrations
- modify production schema manually without recording the migration
- create public financial-document storage
- rely on hidden UI buttons as authorization
- claim a security control exists without testing it
- claim compliance certification without a formal assessment
# 62. Do not implement Phase 3 prematurely

The following are intentionally later:

- PDF generation
- three-copy PDF output
- e-signatures
- accounting-system integration
- OCR
- AI invoice extraction
- analytics
- advanced reporting
- automated reconciliation

Do not add them while the database/auth/workflow foundation is unstable.

---

# 63. Agent stop conditions

The agent must stop and ask for clarification rather than guessing when:

- CBG's approval policy is ambiguous
- voucher numbering policy is ambiguous
- accounting software format is unknown and affects schema
- tenant structure is unclear
- retention/legal requirements are unclear
- signature requirements affect legal validity
- encryption requirements conflict with search requirements
- an irreversible migration is required
- production credentials are missing
- a security decision has multiple materially different implementations

Never silently invent a financial rule.

---

# 64. Forbidden shortcuts

Never:

- disable authentication to make a feature work
- bypass authorization for testing and forget to restore it
- expose database credentials
- connect the browser directly to PostgreSQL
- store production financial data in localStorage
- use floating point for monetary persistence
- use `MAX(number) + 1` for voucher numbering
- hard-delete approved vouchers
- allow client-side status mutation
- trust client-provided tenant IDs
- log secrets
- commit `.env`
- use real customer data in seed scripts
- use `prisma db push` as the production migration strategy
- modify production schema manually without recording the migration
- disable TLS
- create public document buckets for financial files
- rely on hidden buttons as authorization
- claim security merely because HTTPS is enabled

---

# 65. Dependency discipline

Before adding a dependency:

1. Determine whether the existing stack already solves the problem.
2. Check maintenance status.
3. Check security history.
4. Check bundle/runtime implications.
5. Check compatibility with Next.js/React/TypeScript versions.
6. Prefer established libraries.
7. Avoid duplicate libraries solving the same problem.

Do not install five libraries to solve a problem that can be solved with one existing dependency.

---

# 66. Documentation discipline

When making a significant architectural decision, update project documentation.

Document:

- why Neon was chosen
- why Better Auth was chosen
- role definitions
- tenant model
- voucher state machine
- database conventions
- security assumptions
- deployment process
- backup/restore process

Do not let architecture exist only inside the agent's temporary context.

---

# 67. Definition of done

A production feature is done only when:

```text
[ ] Business requirement implemented
[ ] UI implemented
[ ] Server-side validation implemented
[ ] Authorization implemented
[ ] Tenant isolation verified
[ ] Database constraints considered
[ ] Audit behavior implemented
[ ] Error handling implemented
[ ] Loading/empty/error states handled
[ ] Tests added
[ ] Lint passes
[ ] Build passes
[ ] Migration tested
[ ] No secrets committed
[ ] No production data used in tests
[ ] Documentation updated where necessary
```

For financial mutations, add:

```text
[ ] Transaction boundary verified
[ ] Duplicate execution considered
[ ] Concurrent execution considered
[ ] Approved-field immutability verified
```

---

# 68. Final architectural rule

The system should always be understandable as:

```text
UI
 ↓
Authenticated request
 ↓
Authorized operation
 ↓
Validated domain command
 ↓
Database transaction
 ↓
Audit event
 ↓
Response
```

If an implementation skips one of those boundaries without a documented reason, treat it as a design smell.

The objective is not merely to make the application work.

The objective is to make it difficult for an honest mistake, malicious user, concurrent request, software bug, or infrastructure failure to corrupt the financial record.

Build boringly where money is involved.

Boring is good.

Predictable is good.

Auditable is good.

A beautiful dashboard that lets the wrong employee approve a ₹10,000,000 payment is not a beautiful dashboard. It is an incident report with rounded corners.

---

# 69. Reference documentation

Agents should consult current official documentation rather than relying on remembered APIs.

Better Auth:
https://better-auth.com/docs/introduction

Better Auth + Next.js:
https://better-auth.com/docs/integrations/next

Better Auth + Prisma:
https://better-auth.com/docs/adapters/prisma

Better Auth Admin / Access Control:
https://better-auth.com/docs/plugins/admin

Better Auth Organization:
https://better-auth.com/docs/plugins/organization

Better Auth Security:
https://better-auth.com/docs/reference/security

Better Auth Cookies:
https://better-auth.com/docs/concepts/cookies

Better Auth 2FA:
https://better-auth.com/docs/plugins/2fa

Prisma + Neon:
https://www.prisma.io/docs/orm/v6/overview/databases/neon

Prisma PostgreSQL:
https://www.prisma.io/docs/orm/core-concepts/supported-databases/postgresql

Prisma connection pooling:
https://www.prisma.io/docs/postgres/database/connection-pooling

Prisma database connections:
https://www.prisma.io/docs/postgres/database/connecting-to-your-database

---

# 98. Agent instruction

You are working on a financial application.

Do not optimize for speed of coding at the expense of correctness.

For every substantial task, generate the full implementation prompt first and then execute it. The prompt is not a substitute for implementation. Implementation is not complete without verification.

Before making a change, understand the existing implementation.

Before touching the database, understand the data model.

Before adding authentication, understand the tenant and role model.

Before adding authorization, understand the workflow.

Before claiming completion, test the security boundary.

When uncertain about a financial rule, stop and ask.

When a shortcut would weaken auditability or tenant isolation, do not take the shortcut.

The repository's existing frontend is the starting point, not disposable scaffolding.

Build the system incrementally, keep migrations reversible where possible, keep financial state auditable, and treat every production database write as a consequential operation.


# 99. Definition of done

A backend feature is complete only when:

```text
[ ] Business requirement implemented
[ ] Server-side validation implemented
[ ] Authentication considered
[ ] Authorization implemented
[ ] Tenant isolation verified
[ ] Database constraints considered
[ ] Transaction boundary verified
[ ] Audit behavior implemented
[ ] Error handling implemented
[ ] Relevant tests added
[ ] Lint passes
[ ] Typecheck passes
[ ] Build passes
[ ] Migration tested
[ ] No secrets committed
[ ] No real financial data used in tests
[ ] Security review completed
[ ] Documentation updated where appropriate
```

For financial mutations additionally:

```text
[ ] Concurrency considered
[ ] Duplicate execution considered
[ ] Approved-field immutability verified
[ ] Recovery behavior considered
```

The final report for every implementation phase must contain:

```text
Implemented:
- ...

Changed:
- ...

Database:
- ...

Authentication:
- ...

Authorization:
- ...

Security:
- ...

Tests:
- ...

Migration:
- ...

Documentation:
- ...

Remaining:
- ...
```

Never report a mocked or partially implemented security control as complete.

The final architecture must remain understandable as:

```text
UI
 ↓
Authenticated request
 ↓
Authorized operation
 ↓
Validated domain command
 ↓
Database transaction
 ↓
Audit event
 ↓
Safe response
```

Identity must be explicit.
Authorization must be centralized.
Tenant boundaries must be enforced.
Financial transitions must be transactional.
Audit history must be append-only.
Secrets must be isolated.
Migrations must be controlled.
Backups must be recoverable.
Deployments must be reproducible.

Build boringly where money is involved.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
