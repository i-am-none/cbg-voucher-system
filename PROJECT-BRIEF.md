# CBG Payment Voucher — Project Brief & Verified Template Map

**Client:** Chartered Brokers Group (CBG), Mauritius — insurance brokers
**Status:** PHASE 1 FRONTEND PROTOTYPE IN PROGRESS

## Problem being solved
Manual payment-voucher workflow today:
1. Hand-write 3-copy payment voucher (Issuer / Maker / Approver)
2. Scan copies — one kept for records, one handed to the payee
3. Manually re-type voucher info into accounting software

Automation: digital voucher form (type directly) -> organized DB -> CSV export (into
accounting software) + PDF (3 copies). Frontend: Next.js + Tailwind + TypeScript.
DB: PostgreSQL (hosting TBD: Neon vs self-hosted vs managed).

## Verified template map (OCR of voucher-cbg.jpeg — scan rotated 90°, FILLED example)
### Header
- Title: **PAYMENT VOUCHER** + "Chartered" wordmark/logo
- **Chartered Brokers Ltd.**
- T: (230) 403 5900 | E: info@charteredbrokers.com
- F: (230) 403 5901 | W: www.charteredbrokersgroup.com
- BRN No: C06013326 | VAT No: 20137198
- Stamp/watermark: INSURANCE
- PV No (voucher serial) example value: **11910**

### Form fields (13)
1. **PAYEE:** (handwritten in example)
2. **DATE:**
3. **PV No:** (Payment Voucher No. = serial number)
4. **PAYMENT DETAILS**
5. **INVOICE No.**
6. **AMOUNT (Rs.)**
7. **CHEQUE No:**
8. **BANK No:**
9. **TOTAL**
10. **PREPARED BY:**
11. **APPROVAL TO PAY:**
12. **NAME OF RECEIVER:**
13. **SIGNATURE OF RECEIVER:**

### Footer
- Badge: "Proud member of ALLIED AFRICA"
- CharteredBrokersGroup™ | YOUR RISK, OUR MISSION

## Frontend prototype mapping (current phase)
Digital voucher preserves ALL financial fields above for a modern web form.
Extra fields added for web: Payment Type (Cash/Cheque/Bank Transfer/Other), Currency (INR),
Address, Phone, Bank Account No.

## Security architecture (finance-grade, enterprise — FUTURE phases)
- RBAC: Admin / Maker / Approver / Auditor
- Maker creates -> Approver signs -> financial fields immutable after approval
- Append-only audit log (who/what/when, exports logged)
- Field-level encryption: cheque no., bank no.
- Multi-tenant: tenant_id + PostgreSQL Row-Level Security
- No hard deletes (void + reason), unique sequential voucher numbers
- TLS, CSRF, server-side validation, rate limiting, least-privilege DB user
- Secrets in env/secret-manager, encrypted tested backups

## Dev environment
- Container: **cbg-voucher-dev** (node:22, sleep infinity)
- Host folder: C:\Users\v4vai\Desktop\cbg-voucher  <->  /workspace/cbg-voucher
- Port reserved: 3001 (host) -> 3001 (container)

## Open decisions (need user input)
1. DB hosting: Neon vs self-hosted Postgres in Docker vs managed regional
2. Deployment target: VPS / internal office box / cloud
3. Signature handling: e-signature capture vs typed-name + timestamp

## Phase roadmap
- **Phase 1 (NOW):** Frontend prototype — all pages, reusable components, mock data, localStorage, clean enterprise UI. No backend/DB/auth yet.
- **Phase 2:** PostgreSQL (+ Prisma), auth + RBAC, approval workflow, audit log
- **Phase 3:** CSV export (accounting software), PDF generation (3 copies), e-signature
