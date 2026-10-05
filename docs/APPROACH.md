# Project Approach & Architecture — Build Secure 24

**Team ID:** 50  
**Project Name:** FinShield — Secure Personal Finance & AI Assistant  
**Team Size:** 4 Members (Surya Prashanthi Rayabattu, Sahithi Puppala, THOLICHUKKA MANUSHA, Thattishetti Bhavani)  
**Primary Track / Domain:** Secure Personal Finance & AI Assistant (PS-01) with Integrated ScamShield Financial Fraud Protection  

---

## 1. Problem Understanding, Scope & Threat Model

### 1.1 Problem Statement & Real-World Motivation
Personal financial management applications handle high-value, sensitive assets (income, expense ledgers, bank transactions, and budget targets). In modern digital finance ecosystems—especially in India with UPI and instant transfers—users are constantly targeted by fraudulent payment requests, phishing messages, malicious payment links, and impersonation scams. Most personal finance tools act as passive ledgers; they record money lost to scams only *after* the disaster has occurred.

**FinShield** solves this challenge by unifying:
1. **Core Secure Personal Finance (PS-01):** User lifecycle, Role-Based Access Control (RBAC), income/expense ledger tracking, category management, budget threshold alerts, transaction search/filter, multi-metric dashboard summaries, and secure CSV data export.
2. **Integrated ScamShield Fraud Protection Layer:** An active defensive engine that inspects suspicious messages, phishing URLs, and fraudulent UPI IDs, produces explainable risk assessments (LOW, MEDIUM, HIGH), and links detected scam patterns directly to ledger transactions to alert users before or immediately when transactions occur.
3. **Secure AI Financial Assistant:** Context-aware financial guidance powered by a server-side LLM integration (Gemini / OpenAI), strictly isolated to the authenticated user's authorized data and guarded against prompt injection and sensitive data leakage.

### 1.2 Target Users & Personas
- **Standard User (`USER` role):** Individual tracking personal expenses, creating category budgets, uploading or reviewing transaction history, running suspicious messages/UPI IDs through ScamShield, and consulting the AI assistant for budget insights. Trust level: Authenticated, unprivileged; strictly confined to own tenant data.
- **System Administrator (`ADMIN` role):** Platform maintainer reviewing system health, aggregated security audit logs, scam detection telemetry, and managing user account statuses without viewing plaintext financial entries. Trust level: Authenticated, privileged administrative operations only.
- **Auditor / Security Reviewer:** Read-only reviewer evaluating audit logs, access patterns, and compliance with the 24-hour Build Secure governance rules.

### 1.3 Critical Assets
The system protects the following high-value assets across storage, transit, and runtime:
1. **User Credentials & Auth Secrets:** Passwords (bcrypt hashes), JWT signing secrets, session identifiers, and refresh tokens.
2. **Personal Financial Records (PII & Financial Ledger):** Income/expense transactions, account balances, spending trends, and budget allocations.
3. **Scam Intelligence & Analysis History:** User-submitted suspicious texts, URLs, UPI IDs, risk reports, and user-flagged fraud incidents.
4. **Third-Party Secrets:** Server-side API keys for LLM providers (Gemini / OpenAI) and database connection strings.
5. **System Audit Logs:** Immutable records of authentication attempts, transaction creations, scam checks, and role changes.

### 1.4 Threat Model & STRIDE Assessment
We apply the STRIDE methodology to analyze potential threats to FinShield:
- **Spoofing Identity:** Adversaries attempting credential stuffing or token forgery to impersonate legitimate users.
  - *Countermeasure (Planned):* Strong password policy enforced via Zod, bcrypt hashing (work factor 10+), cryptographically signed JWTs with short expiry, and secure HTTP-only cookies.
- **Tampering with Data:** Malicious users modifying transaction amounts, spoofing scam risk ratings, or injecting malicious SQL/NoSQL payloads.
  - *Countermeasure (Planned):* Object-level authorization on all ledger mutations (`WHERE id = :id AND userId = :currentUserId`), Prisma ORM parameterized queries, and strict input validation.
- **Repudiation:** A user denying making a transaction or altering a budget.
  - *Countermeasure (Planned):* Append-only security audit log capturing user ID, action, timestamp, IP hash, and resource ID.
- **Information Disclosure:** Unauthenticated access to another user's financial ledger (IDOR / BOLA) or leakage of LLM API keys in client-side bundles.
  - *Countermeasure (Planned):* Universal tenant-isolation middleware, zero frontend exposure of AI keys, generic error messages in production, and CORS restrictions.
- **Denial of Service (DoS):** Automated bots flooding ScamShield inspection endpoints or expensive AI assistant queries.
  - *Countermeasure (Planned):* Tiered IP and user rate limiting via `express-rate-limit` on authentication, scam analysis, and AI endpoints.
- **Elevation of Privilege:** Standard users attempting to access admin analytics or switch their role to `ADMIN`.
  - *Countermeasure (Planned):* Role checks verified directly from server-side database claims/tokens; role field stripped from user update schemas.

### 1.5 Attack Surface
- **Public Ingress Endpoints:** `/api/auth/register`, `/api/auth/login`, `/health`. (Risk: Brute force, credential stuffing, enumeration).
- **Authenticated Financial API:** `/api/transactions`, `/api/budgets`, `/api/categories`, `/api/export`. (Risk: IDOR, Broken Object Level Authorization, CSV Formula Injection).
- **ScamShield Analysis Endpoints:** `/api/scamshield/analyze-text`, `/api/scamshield/analyze-url`, `/api/scamshield/analyze-upi`. (Risk: Regex DoS, prompt/payload injection, server abuse).
- **AI Assistant Endpoint:** `/api/ai/assistant`. (Risk: Excessive token consumption, indirect prompt injection, PII exfiltration).
- **Client Application (Web UI):** Browser execution context. (Risk: Cross-Site Scripting (XSS), token theft via JavaScript access, clickjacking).

### 1.6 OWASP Top 10 Considerations for FinShield
1. **A01:2021 — Broken Access Control:** Addressed by enforcing strict tenant checking (`userId` matches session) on every ledger, budget, and scam report query.
2. **A02:2021 — Cryptographic Failures:** Addressed by using standard algorithms (bcrypt for passwords, HTTPS/TLS in transit, secure hash signatures for tokens).
3. **A03:2021 — Injection (SQL & Command):** Addressed by using Prisma ORM with parameterized prepared statements; zero raw string concatenation for SQL queries.
4. **A04:2021 — Insecure Design:** Addressed by integrating ScamShield directly with the ledger to proactively flag suspicious outgoing UPI transfers before loss occurs.
5. **A05:2021 — Security Misconfiguration:** Addressed by deploying Helmet for HTTP security headers (CSP, HSTS, X-Frame-Options) and disallowing CORS wildcards in production.
6. **A06:2021 — Vulnerable & Outdated Components:** Addressed by pinning locked versions in `package.json` and running `npm audit`.
7. **A07:2021 — Identification & Authentication Failures:** Addressed by rate limiting login attempts, session invalidation on logout, and generic invalid credential notices.
8. **A08:2021 — Software & Data Integrity Failures:** Addressed by validating all inbound payloads via strict Zod schemas before touching business logic.
9. **A09:2021 — Security Logging & Monitoring Failures:** Addressed by structured audit logging for all authentication, authorization failure, and high-risk scam events.
10. **A10:2021 — Server-Side Request Forgery (SSRF):** Addressed by strictly validating URLs submitted to ScamShield using domain parsing and prohibiting internal IP ranges (e.g., `127.0.0.1`, `169.254.169.254`, `localhost`).

---

## 2. Technical Architecture & Secure System Design

### 2.1 High-Level Architecture Overview
FinShield follows a clean, decoupled 3-tier client-server architecture with dedicated security and AI proxy layers:

```
┌────────────────────────────────────────────────────────────────────────┐
│                        CLIENT TIER (Untrusted)                         │
│  React 19 + TypeScript + Vite + Tailwind CSS                           │
│  - Financial Dashboard, Budget Tracker & Category Visualizer           │
│  - ScamShield Inspection Workspace & Risk Indicator Widgets            │
│  - Secure AI Assistant Drawer with Sanitize Rendering                  │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ HTTPS (TLS 1.3)
                                    │ JSON Payload / SameSite Cookie
┌───────────────────────────────────▼────────────────────────────────────┐
│                    API GATEWAY & MIDDLEWARE TIER                       │
│  Node.js + Express.js                                                  │
│  - Helmet (CSP, HSTS, X-Content-Type-Options, Frameguard)              │
│  - CORS (Strict Origin Allowlist)                                      │
│  - Rate Limiter (express-rate-limit: Auth, AI, ScamShield)             │
│  - Auth Middleware (JWT Verification & User Context Extraction)        │
│  - RBAC Middleware (Role Validation: USER / ADMIN)                     │
│  - Zod Request Validation Middleware (Body, Query, Params)             │
└───────────────────┬───────────────────────────────┬────────────────────┘
                    │                               │
┌───────────────────▼─────────────┐ ┌───────────────▼────────────────────┐
│      CORE DOMAIN SERVICES       │ │     SCAMSHIELD & AI SERVICES       │
│  - Transaction & Ledger Service │ │  - Scam Message & Pattern Analyzer │
│  - Budget & Category Service    │ │  - Phishing URL Risk Inspector     │
│  - Financial Summary & Analytics│ │  - UPI ID Format & Risk Verifier   │
│  - Secure CSV Export Streamer   │ │  - Scam-to-Ledger Match Engine     │
│  - Audit & Security Logger      │ │  - AI Proxy Service (Gemini/OpenAI)│
└───────────────────┬─────────────┘ └───────────────┬────────────────────┘
                    │                               │
┌───────────────────▼───────────────────────────────▼────────────────────┐
│                       DATA PERSISTENCE TIER                            │
│  Prisma ORM (Parameterized Query Engine)                               │
│  PostgreSQL Managed Database (User, Transaction, Budget, ScamReport)   │
└────────────────────────────────────────────────────────────────────────┘
```

### 2.2 Data Flow & Trust Boundaries
There are four distinct trust boundaries in FinShield:
1. **Boundary 1 (Client to API Gateway):** The browser is completely untrusted. All input sent over HTTPS is validated on arrival. Client state is never assumed to be valid.
2. **Boundary 2 (API Gateway to Domain Services):** Requests that pass authentication and Zod schema validation enter the trusted domain layer carrying a verified `UserContext` (`userId`, `role`).
3. **Boundary 3 (Domain Services to PostgreSQL):** The database communicates over an encrypted connection string. Queries are parameterized by Prisma ORM. Queries always bind `userId` to enforce row-level tenant isolation.
4. **Boundary 4 (Domain Services to External AI Provider):** The external LLM API (Gemini / OpenAI) is treated as a third-party service. Prompts are constructed server-side; raw user financial secrets (like account numbers or passwords) are strictly excluded. The server API key never crosses Boundary 1.

### 2.3 Technology Stack Rationale
- **Frontend / Client: React 19 + TypeScript + Vite + Tailwind CSS**
  - *Rationale:* Fast compilation, robust type safety, automated JSX escaping to mitigate XSS, and modern accessible UI styling via Tailwind CSS.
- **Backend / API Framework: Node.js + Express.js + TypeScript**
  - *Rationale:* Lightweight, high-throughput asynchronous I/O, vast ecosystem of vetted security middleware (`helmet`, `cors`, `express-rate-limit`, `zod`), and seamless TypeScript sharing between models and validation schemas.
- **Database & Persistence: PostgreSQL + Prisma ORM**
  - *Rationale:* ACID compliance for financial records, strongly typed relational schemas, automatic migrations, and built-in protection against SQL injection via parameterized queries.
- **Authentication & Cryptography: bcrypt + JSON Web Tokens (JWT)**
  - *Rationale:* Industry-standard salted password hashing with adaptive work factor; stateless or cookie-bound signed tokens enabling low-latency verification while maintaining strict expiry control.
- **Validation Engine: Zod**
  - *Rationale:* Runtime schema enforcement with static TypeScript type inference, guaranteeing that unexpected or malicious payload properties are stripped before reaching service controllers.
- **AI Integration: Server-side Gemini / OpenAI SDK**
  - *Rationale:* Centralized prompt construction, token quota management, and complete secrecy of API tokens.

### 2.4 Authentication Architecture
- **Registration:**
  - Password strength validation via Zod: minimum 8 characters, at least 1 uppercase, 1 lowercase, 1 number, and 1 special character.
  - Password hashed using `bcrypt` with a minimum salt rounds factor of 10.
  - Default role assigned as `USER`. Role cannot be specified or overridden during registration.
- **Login & Token Issuance:**
  - Email/password verified against stored hash.
  - On success, a signed JWT is generated with payload `{ userId, role, email }` signed with a server-managed `JWT_SECRET`.
  - Expiration set to a short duration (e.g., 2 hours).
  - Delivered via an `HttpOnly`, `Secure` (in production), `SameSite=Strict` cookie or via Authorization header with client memory storage to prevent XSS-based token theft.
- **Logout:**
  - Client token invalidated / cookie cleared with immediate client redirect.

### 2.5 Authorization & Role-Based Access Control (RBAC)
- **Roles:**
  - `USER`: May perform CRUD on own transactions, budgets, categories, and ScamShield checks. Cannot view or modify records belonging to other users.
  - `ADMIN`: May view system-level telemetry, aggregated audit logs, user count statistics, and platform status. Admin endpoints are prefixed under `/api/admin/` and protected by `requireRole('ADMIN')` middleware.
- **Tenant Isolation (Anti-IDOR / Anti-BOLA):**
  - Every controller extracts `req.user.userId` from the verified token.
  - Every database query for a transaction or budget strictly appends `where: { id: resourceId, userId: req.user.userId }`.
  - If a resource exists but belongs to another user, the API responds with a generic `404 Not Found` (or `403 Forbidden`) to avoid resource enumeration.

### 2.6 Input Validation & Sanitization (Zod)
- All endpoints use dedicated Zod schemas for `req.body`, `req.query`, and `req.params`.
- Schemas strictly define allowable types, boundaries, and string lengths (e.g., transaction amounts must be positive numbers with max 2 decimal places; descriptions must be trimmed and max 255 chars).
- Unknown keys are stripped (`strip()` or `strict()`), preventing mass assignment vulnerabilities.

### 2.7 SQL Injection Prevention
- All database interactions use Prisma ORM query methods (`findMany`, `create`, `update`, `delete`), which compile to parameterized prepared statements.
- Direct raw queries (`$queryRawUnsafe`) are strictly forbidden. Any raw query needed must use Prisma's `$queryRaw` tagged template literal which automatically parameterizes all interpolated variables.

### 2.8 Cross-Site Scripting (XSS) Prevention
- **Contextual Escaping:** React automatically escapes all expressions embedded in JSX (`{...}`), preventing stored XSS when rendering transaction notes, categories, and scam messages.
- **Dangerous APIs Banned:** `dangerouslySetInnerHTML` is prohibited across all UI components.
- **HTTP Security Headers via Helmet:**
  - `Content-Security-Policy`: Restricts scripts and styles to trusted origins.
  - `X-Content-Type-Options: nosniff`: Prevents MIME-sniffing exploits.
  - `X-Frame-Options: DENY`: Prevents clickjacking attacks.
  - `Referrer-Policy: strict-origin-when-cross-origin`.

### 2.9 Secure File Handling & CSV Export
- **Personal Financial Export:**
  - Users can export transaction histories to CSV.
  - **CSV Formula Injection Defense:** Spreadsheet applications (Excel, Google Sheets, LibreOffice) execute formulas if a cell starts with `=`, `+`, `-`, `@`, `\t`, or `\r`. FinShield's export streamer sanitizes every text field (descriptions, category names, notes) by prepending a single quote (`'`) if the first character matches any formula prefix.
  - Streaming is bounded with pagination to prevent memory exhaustion DoS during large exports.
  - Response headers include `Content-Type: text/csv; charset=utf-8` and `Content-Disposition: attachment; filename="finshield-export-...csv"`.

### 2.10 Rate Limiting & Abuse Prevention
Configured via `express-rate-limit`:
1. **Auth Endpoints (`/api/auth/*`):** Max 5 attempts per 15-minute window per IP to prevent brute-force attacks and credential stuffing.
2. **ScamShield Analysis (`/api/scamshield/*`):** Max 30 requests per minute per authenticated user to prevent scanner exhaustion.
3. **AI Assistant (`/api/ai/*`):** Max 10 requests per minute per user to control token consumption and cost.
4. **General API Routes:** Max 100 requests per minute per IP for baseline DDoS throttling.

### 2.11 Secrets & Configuration Hygiene
- Zero hardcoded secrets in source code.
- All sensitive variables loaded from environment variables:
  - `DATABASE_URL`
  - `JWT_SECRET`
  - `AI_API_KEY` (Gemini or OpenAI)
  - `PORT`, `NODE_ENV`, `CLIENT_ORIGIN`
- A documented `.env.example` file is provided with placeholder values for setup.
- `.env` and `.env.local` are explicitly included in `.gitignore`.

### 2.12 AI Security & Privacy Isolation
- **Server-Side Broker:** Frontend never calls LLM providers directly; all calls transit `/api/ai/assistant`.
- **Authorized Data Scoping:** The backend queries only the authenticated user's current month budget and aggregated category totals to compose the context prompt. Raw sensitive credentials, unencrypted transaction IDs, or PII are omitted.
- **Prompt Injection Defense:** System instructions are clearly separated from user input using structured message roles (`system`, `user`). User messages are sanitized and enclosed within delimited boundaries (e.g. `"""User query"""`) to prevent override of system guardrails.
- **Model Output Validation:** AI responses are treated as untrusted text, rendered as plain text or Markdown with strict tag sanitization in the client.

### 2.13 Security Logging & Audit Trail
An append-only audit logging mechanism records critical security events:
- User registration, login, logout, and failed login attempts.
- Role changes and administrative operations.
- Creation, update, or deletion of high-value transactions.
- High-risk ScamShield detections and user flagging actions.
- Rate-limit violations.
*Log records store timestamp, event type, actor user ID, source IP (hashed for privacy), and outcome status (SUCCESS / FAILURE), without logging passwords or full card details.*

### 2.14 ScamShield Architecture & Risk Engine
ScamShield operates as an integrated fraud-detection engine within FinShield:
1. **Message Analyzer (`analyzeText`):**
   - Scans SMS, WhatsApp, and email snippets for urgency keywords ("lottery", "KYC expired", "account blocked", "electricity bill", "reward points", "claim now").
   - Identifies disguised phone numbers, spoofed alphanumeric sender headers, and malicious redirect links.
2. **URL Analyzer (`analyzeUrl`):**
   - Parses URLs to inspect protocol (flagging non-HTTPS), domain age/entropy, homograph attacks (e.g., punycode), excessive subdomains, top-level domains commonly used in phishing (`.xyz`, `.top`, `.tk`), and IP-based URLs.
   - Prevents SSRF: Rejects private/loopback IP addresses (`10.0.0.0/8`, `192.168.0.0/16`, `127.0.0.0/8`, `169.254.0.0/16`).
3. **UPI ID Analyzer (`analyzeUpi`):**
   - Validates VPA (Virtual Payment Address) structure against valid PSP handles (`@okaxis`, `@okhdfcbank`, `@paytm`, `@ybl`, etc.).
   - Detects fraudulent patterns such as deceptive merchant handles (e.g., `refund-customer-care@...`, `cashback-claim@...`, or handles mixing numbers with legitimate bank names).
4. **Risk Scoring Model:**
   - **LOW (0 - 39%):** Standard legitimate patterns, verified domain/PSP, no coercive triggers.
   - **MEDIUM (40 - 69%):** Mild anomalies, unfamiliar domain TLD, generic urgency words, unverified handle. Warning banner with caution advice.
   - **HIGH (70 - 100%):** Strong indicators of fraud (known scam keywords + unverified handle + phishing link). Prominent danger alert with actionable prevention advice.
5. **Explainability Engine:** Every scan returns a structured breakdown:
   - `riskLevel`: `LOW` | `MEDIUM` | `HIGH`
   - `riskScore`: Numeric score (0–100)
   - `riskFactors`: Array of human-readable explanations (e.g., *"Contains high-pressure urgency keywords"*, *"Unverified UPI handle impersonating customer support"*, *"URL uses high-risk suspicious TLD"*)
   - `recommendations`: Concrete safety steps for the user.

### 2.15 Scam-to-Ledger Linking & Suspicious Transaction Alerts
A key differentiator of FinShield is connecting scam intelligence directly to the user's financial ledger:
- When a user logs a transaction with a note, merchant name, or UPI ID, the system automatically checks it against known scam triggers or the user's recent ScamShield analysis history.
- If a user previously analyzed a UPI handle or message that received a `MEDIUM` or `HIGH` risk score, and subsequently an outgoing transaction matches that handle or message note, the ledger:
  1. Displays an inline warning badge on the transaction row (`Suspicious: Matches recent scam query`).
  2. Increments a "Prevented / Flagged Fraud" counter in the security dashboard.
  3. Prompts the user with a confirmation modal before finalizing payment records.

---

## 3. Implementation Milestones & 24-Hour Timeline

| Milestone / Phase | Time Window | Key Objectives & Deliverables | Security Verification | Status |
|---|---|---|---|---|
| **Phase 1: Foundation & Setup** | 0h – 4h | Onboarding completion, architecture design in `APPROACH.md`, database schema definition (Prisma), Express app scaffolding, and environment config. | Secret scan, `.gitignore` verification, baseline dependency check. | `IMPLEMENTED` |
| **Phase 2: Core Domain & Auth** | 4h – 10h | User registration/login with bcrypt & JWT, RBAC middleware, Zod validation, user isolation foundation, income/expense CRUD, and budget alerts. | Auth test suite, token expiry test, tenant isolation (IDOR) tests. | `IN DEVELOPMENT` |
| **Phase 3: ScamShield & AI Layer** | 10h – 16h | ScamShield engine (message, URL, UPI heuristic analyzers), explainable risk reports, scam-to-ledger matching logic, and server-side AI assistant proxy. | SSRF prevention test, regex safety verification, AI context isolation test. | `PLANNED` |
| **Phase 4: Security Hardening & Polish** | 16h – 21h | Zod validation coverage, Helmet CSP configuration, rate limiters, secure CSV export with formula injection escaping, and audit logging. | CSV injection tests, rate limit tests, XSS boundary checks. | `PLANNED` |
| **Phase 5: Deployment & Commit Freeze**| 21h – 24h | Frontend build on Vercel, backend build on Render/Railway, database migration verification, healthcheck check (`/api/health`), and commit freeze in `submission.yaml`. | Live deployment healthcheck verification, commit SHA lock. | `PLANNED` |

---

## 4. Architecture Decision Records (ADRs)

### ADR-001: Backend Architecture with Node.js & Express.js
- **Status:** Accepted
- **Context:** Need a robust, lightweight, and rapid API framework capable of running in a 24-hour hackathon environment while supporting rich security middleware.
- **Options Considered:**
  1. *Node.js + Express.js:* Highly mature, extensive security middleware ecosystem (`helmet`, `cors`, `express-rate-limit`), seamless TypeScript integration.
  2. *Python + FastAPI:* Strong async, but adds multi-language build complexity with the existing React/TypeScript frontend.
- **Decision & Rationale:** Chose Node.js + Express.js to keep full-stack TypeScript consistency across frontend models, Zod schemas, and backend controllers.
- **Security & Performance Trade-offs:** Lightweight single-event loop performance with low cold-start latency; requires explicit middleware configuration for security headers and error boundaries.

### ADR-002: Data Persistence with PostgreSQL & Prisma ORM
- **Status:** Accepted
- **Context:** Need an ACID-compliant relational database for user ledgers, financial budgets, and scam incident logs with guaranteed injection immunity.
- **Options Considered:**
  1. *PostgreSQL + Prisma ORM:* Strongly typed schema, automated migrations, built-in query parameterization protecting against SQL injection.
  2. *MongoDB + Mongoose:* Flexible documents, but weaker relational guarantees for budget-to-transaction ledgers and potential NoSQL operator injection.
- **Decision & Rationale:** Chose PostgreSQL with Prisma ORM for relational integrity, schema migrations, and default parameterized queries.
- **Security & Performance Trade-offs:** Strong schema enforcement prevents malformed data entry; query compilation overhead is negligible for hackathon traffic.

### ADR-003: Authentication via Bcrypt & JWT in Secure Cookies
- **Status:** Accepted
- **Context:** Need a stateless, secure authentication mechanism that resists token theft and credential replay attacks.
- **Options Considered:**
  1. *Bcrypt + JWT with HttpOnly Cookies:* Passwords hashed with salt factor 10; tokens inaccessible to client JavaScript, mitigating XSS token theft.
  2. *JWT stored in localStorage:* Easy to implement, but vulnerable to malicious third-party scripts reading tokens directly from localStorage.
- **Decision & Rationale:** Chose Bcrypt password hashing and JWT delivered via `HttpOnly`, `SameSite=Strict` cookies (with authorization header fallback for API testing).
- **Security & Performance Trade-offs:** Mitigates XSS token exfiltration; requires CSRF awareness which is handled by `SameSite=Strict` and custom header verification.

### ADR-004: Request Validation via Zod Schemas
- **Status:** Accepted
- **Context:** Need declarative, runtime input validation to eliminate injection, type juggling, and mass-assignment vulnerabilities.
- **Options Considered:**
  1. *Zod:* Zero-dependency TypeScript-first validation library sharing inferred types directly with frontend/backend interfaces.
  2. *Joi:* Mature, but lacks clean native TypeScript type inference.
- **Decision & Rationale:** Chose Zod for universal schema validation on every API controller.
- **Security & Performance Trade-offs:** Microsecond validation overhead; guarantees malformed or malicious unexpected keys are stripped immediately.

### ADR-005: AI Assistant Integration via Server-Side Broker
- **Status:** Accepted
- **Context:** Need an AI-powered financial advisory assistant without exposing vendor API keys or leaking user PII.
- **Options Considered:**
  1. *Server-Side AI Broker (Selected):* Frontend calls `/api/ai/assistant`; backend authenticates user, sanitizes financial summary into context, applies system prompts, and contacts Gemini/OpenAI securely.
  2. *Direct Client-Side SDK:* Client calls AI provider directly using a frontend environment key.
- **Decision & Rationale:** Chose Server-Side Broker. Direct client-side calls expose private API keys in browser network inspectors and prevent server-side prompt guardrails.
- **Security & Performance Trade-offs:** Minor additional latency for proxying; critical security gain in key secrecy, prompt injection containment, and tenant isolation.

### ADR-006: ScamShield Heuristic Engine with Explainability
- **Status:** Accepted
- **Context:** Need an immediate, responsive fraud inspection engine for messages, URLs, and UPI IDs without relying exclusively on slow or costly third-party commercial APIs.
- **Options Considered:**
  1. *Deterministic Heuristic & Pattern Engine (Selected):* Rule-based lexical, TLD, structural, and regex pattern matching combined with weighted risk scoring and human-readable explanation generation.
  2. *Black-box External Threat Intelligence API:* Requires external commercial paid subscriptions and introduces latency and availability risks.
- **Decision & Rationale:** Implemented an in-engine deterministic heuristic scanner with explainability, allowing reproducible 24-hour evaluations and zero external credential blockers.
- **Security & Performance Trade-offs:** Fast, zero-cost, and fully explainable; rules must be carefully constructed to avoid ReDoS (Regular Expression Denial of Service).

### ADR-007: CSV Formula Injection Mitigation for Data Export
- **Status:** Accepted
- **Context:** Financial transaction CSV exports opened in spreadsheet software can execute malicious formulas if cell contents begin with `=`, `+`, `-`, or `@`.
- **Options Considered:**
  1. *Prefix Sanitization (Selected):* Prepending a single apostrophe (`'`) to any cell value that starts with spreadsheet formula symbols.
  2. *Stripping Leading Characters:* Removing the symbols entirely, which mutates user data (e.g., negative expense signs).
- **Decision & Rationale:** Prefix sanitization preserves the human-readable text while causing spreadsheet engines to treat the cell value strictly as literal text.
- **Security & Performance Trade-offs:** Minimal string check during export generation; completely neutralizes remote command execution via spreadsheet DDE.

---

## 5. Engineering Journal & Real-Time Decision Log

### [2026-10-05 13:56 IST] Entry 1: Starter Repository Verification & Protocol Onboarding
- **Focus:** Initial repository setup, AGENTS.md trust root verification, team metadata confirmation (`metadata/team.yaml`), and onboarding agreement recording.
- **Key Challenges:** Ensuring zero leakage or adaptation of legacy repositories (ScamShield codebase) while setting up clean architectural boundaries.
- **Resolution:** Full inspection conducted, rules recited verbatim, agreement recorded in `docs/logs.txt`, and Git remote locked to Team 50 repository.

### [2026-10-05 18:20 IST] Entry 2: FinShield Architecture & Threat Model Specification
- **Focus:** Complete architectural specification in `docs/APPROACH.md`, encompassing PS-01 personal finance requirements, ScamShield fraud-protection layer, server-side AI proxy, and defense-in-depth security controls.
- **Key Challenges:** Designing a cohesive bridge between the passive transaction ledger and the active ScamShield fraud detection layer within 24-hour hackathon constraints.
- **Resolution:** Established the Scam-to-Ledger correlation model, formalized 7 ADRs, and defined clear milestone boundaries separating planned vs. completed components.

### [2026-10-05 19:15 IST] Entry 3: Milestone 2 — Backend Foundation, PostgreSQL Schema & Secure Authentication
- **Focus:** Built Express backend in `src/server/`, defined Prisma PostgreSQL schema with `User` model, implemented bcrypt password hashing, stateless JWT with HttpOnly cookies, Zod request validation, RBAC middleware, and user-isolation helper pattern (`assertUserOwnership`, `scopeQueryToUser`).
- **Key Challenges:** Enforcing strict anti-enumeration on authentication failures, preventing role-escalation payloads via Zod `.strict()`, and handling database connectivity transparently.
- **Resolution:** Full test suite with 14 automated tests passed (health, registration, duplicate rejection, login, invalid credentials, `/me`, logout, RBAC forbidden check, malformed input rejection, role injection rejection, rate limiting header checks, and DB connectivity). Integrated frontend auth client with backend endpoints.

### [2026-10-05 19:35 IST] Entry 4: Milestone 3 — PostgreSQL & Prisma Migration Pipeline
- **Focus:** Established canonical initial Prisma migration (`src/prisma/migrations/20261005190000_init/migration.sql`), migration lockfile, and automated database verification tooling (`src/server/scripts/checkDb.ts`).
- **Key Challenges:** Ensuring deterministic database schema synchronization and migration readiness while maintaining zero credential leaks and seamless graceful fallback when a live database is pending provisioning.
- **Resolution:** Scripted offline migration generation via Prisma diffing against the datamodel; validated schema fidelity; created a safe diagnostic tool that verifies database reachability without credential exposure; confirmed test suite execution (14 passing tests).

### [2026-10-05 19:48 IST] Entry 5: Milestone 3.1 — PostgreSQL Integration Testing & Verification
- **Focus:** Created dedicated live vs. fallback integration test suite (`src/server/tests/dbIntegration.test.ts`), enhanced schema diagnostics (`src/server/scripts/checkDb.ts`), hardened `.gitignore` against accidental `.env` leakage, and audited database connectivity state.
- **Key Challenges:** Distinguishing isolated unit/fallback test execution from live PostgreSQL operations to maintain 100% truthful reporting, ensuring zero secrets are committed or displayed in logs.
- **Resolution:** Implemented explicit store classification in test suites; verified that database schema definitions and migration scripts are ready for deployment; confirmed diagnostic utilities safely mask credentials; documented the local/cloud provisioning workflow for `DATABASE_URL`.

### [2026-10-05 21:30 IST] Entry 7: Milestone 5 — Secure Transaction CRUD & Tenant Data Isolation (IDOR/BOLA Defense)
- **Focus:** Implemented database-backed transaction management with strict per-user multi-tenant data isolation. Extended Prisma schema with `Transaction` model and `TransactionType` enum (`INCOME`, `EXPENSE`), applied migration `20261005213000_add_transactions` to Neon PostgreSQL, created Zod validation schemas (`createTransactionSchema`, `updateTransactionSchema`, `transactionQuerySchema`), tenant-scoped `transactionService`, Express controllers/routes mounted at `/api/transactions`, and connected the frontend `TransactionsPage`.
- **Key Challenges:** Eliminating Broken Object Level Authorization (BOLA/IDOR) vulnerabilities, defending against mass-assignment / parameter tampering (e.g., injecting `userId`, `role`, or `isAdmin`), avoiding resource enumeration by returning generic 404 responses for cross-tenant access attempts, and maintaining pristine database state through strict automated test cleanup.
- **Resolution:**
  - Configured compound indexes in PostgreSQL for tenant queries (`[userId]`, `[userId, transactionDate]`, `[userId, type]`, `[userId, category]`).
  - Enforced `where: { id: transactionId, userId: req.user.userId }` on all individual retrieval, update, and deletion operations, returning 404 when records do not belong to the authenticated user.
  - Applied `.strict()` on Zod request schemas to instantly reject extra/unauthorized properties (such as `userId`, `role`, `isAdmin`).
### [2026-10-05 22:00 IST] Entry 8: Milestone 6 — Live PostgreSQL Budgets & Mathematical Financial Dashboard
- **Focus:** Implemented real PostgreSQL-backed category budgets and live authenticated financial dashboard summary (`GET /api/dashboard/summary`). Added `Budget` model with normalized month (`YYYY-MM`), decimal limit amounts, composite unique constraint `[userId, category, month]`, and tenant indexes. Applied migration `20261005220000_add_budgets` to live Neon PostgreSQL. Implemented live transaction spend aggregation deriving mutable spend directly from real `Transaction` rows rather than storing denormalized totals. Implemented dashboard summary endpoint calculating real `currentBalance`, `totalIncome`, `totalExpenses`, `totalSavings`, `categoryBreakdown`, and `budgetAlerts`.
- **Key Challenges:** Maintaining strict mathematical consistency (`balance = income - expenses`, `savings = balance`, `categoryBreakdown sum == totalExpenses`), dynamically tracking budget utilization statuses (`SAFE` <80%, `WARNING` 80%-99%, `EXCEEDED` >=100%), preventing BOLA/IDOR on budget CRUD, enforcing mass-assignment rejection via `.strict()`, and ensuring 100% test isolation across suites.
- **Resolution:**
  - Automated dynamic budget utilization calculation directly via PostgreSQL aggregations over authenticated user transactions.
  - Implemented 10 comprehensive tests in `src/server/tests/budgetDashboard.test.ts` covering cross-user IDOR read/update/delete rejection (404), tenant-isolated listing, mass assignment blocking, 80% warning and 100% exceeded thresholds, and dashboard mathematical consistency.
  - Configured sequential test execution (`--test-concurrency=1`) preserving isolated test state. All 42 automated test assertions passed across 4 test suites with zero failures. Database row counts confirmed at 0 after teardown.
  - Connected frontend `BudgetsPage` (edit/delete/progress/alerts) and `DashboardPage` (live statistics/breakdown/alerts) to live backend endpoints.

### [2026-10-05 22:35 IST] Entry 9: Milestone 7 — ScamShield Fraud Analysis Engine & Ledger Linking
- **Focus:** Implemented the ScamShield fraud-analysis layer integrated into FinShield. Built deterministic rule-based heuristic inspection for suspicious payment messages, URLs, and UPI IDs. Designed SSRF-safe URL lexical analysis (executing zero outbound HTTP network requests). Implemented UPI ID extraction and monetary amount extraction. Implemented deterministic scoring (`LOW` 0–29, `MEDIUM` 30–59, `HIGH` 60–100) with explainable reasons and tailored security recommendations. Integrated scoped ledger transaction matching connecting analyzed fraud markers to the authenticated user's real transactions in Neon PostgreSQL (`where: { userId: req.user.id }`). Added persistent audit trail model `ScamAnalysis` in PostgreSQL via migration `20261005223000_add_scam_analysis`. Built full frontend UI in `ScamShieldPage.tsx` with live backend API calls, preset buttons, explainable indicators, and matched ledger transaction alerts.
- **Key Challenges:**
  - Preventing SSRF vulnerabilities when inspecting user-submitted URLs: Eliminated any outbound network requests by evaluating URLs purely through lexical parser inspection of protocol, high-risk TLDs, IP literals, URL shorteners, and financial brand spoofing keywords.
  - Ensuring tenant data isolation during ledger matching: Guaranteeing that when an analysis matches a UPI ID or monetary amount, User B never sees User A's transactions (tested and verified zero cross-tenant leakage).
  - Preventing ReDoS and payload abuse: Enforced strict Zod validation with upper bounds (max 5000 characters for message text, max 2000 for URL, max 256 for UPI), `.strict()` mass-assignment rejection, and linear-time heuristic regex matching.
- **Resolution:**
  - Designed `ScamService` (`src/server/services/scamService.ts`), `analyzeScamSchema` (`src/server/schemas/scamSchemas.ts`), `scamController.ts`, and mounted routes under `/api/scamshield/analyze` and `/api/scamshield/history`.
  - Authoritative 14-test integration suite in `src/server/tests/scamshield.test.ts` covering KYC urgency, OTP/PIN credential harvesting, utility disconnection extortion, part-time job lures, benign messages, SSRF-safe URL inspection, UPI and amount extraction, empty/oversized/mass-assignment payload rejection, 401 unauthenticated protection, scoped ledger transaction linking, and cross-user tenant isolation.
  - All 56 automated test assertions across all 5 test suites pass with zero failures against live Neon PostgreSQL. All test records cleanly torn down with database row counts verified at 0.
  - Updated frontend `ScamShieldPage.tsx` to communicate with the live backend, presenting real-time risk scores, category chips, extracted parameters, explainable indicators, protective recommendations, and ledger matching warning cards.

---



## 6. Testing, Security Verification & Deployment Record

### 6.1 Testing & Security Verification Strategy
- **Unit & Integration Tests (Planned for Phase 2 & 3):**
  - Authentication flow tests (registration, login, invalid credentials, token expiry).
  - RBAC and Tenant Isolation tests (ensuring User A cannot read or write User B's transactions or budgets).
  - Zod validation edge cases (rejecting negative transaction amounts, overly long strings, invalid UPI formats).
  - ScamShield heuristic tests (verifying LOW, MEDIUM, HIGH classifications and explanation generators).
  - CSV export formula escaping tests.
- **Static Analysis & Linting:**
  - ESLint configuration across TypeScript code.
  - Secret scanning via git pre-commit checks to verify zero API keys in tracked code.

### 6.2 Deployment Verification
- **Frontend Target:** Vercel (Production SPA build via Vite).
- **Backend Target:** Render / Railway (Node.js runtime with environment variable injection).
- **Database Target:** Managed PostgreSQL (Supabase / Neon / Render Postgres).
- **Health Check Endpoint:** `/health` (planned: returns `{ status: "ok", timestamp: "...", uptime: ... }`).
- **Deployment Records:** To be documented in `deployment/README.md` and finalized in `metadata/submission.yaml` before the October 6, 2026, 11:00 AM IST deadline.
