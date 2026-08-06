# Ubiquitous Language — Florida FAR/BAR Deadline Calculator

## 1. Project Purpose

FAR/BAR Contract Deadline Tracker for Florida real estate transactions. Automates computation of all critical dates derived from a contract's effective date and closing date. Intended for use by agents, attorneys, and transaction coordinators to eliminate manual deadline calculation errors.

---

## 2. Domain Terminology

| Term | Definition |
|---|---|
| **FAR/BAR** | Florida Association of Realtors / Florida Bar joint contract form — the standard residential purchase agreement in Florida |
| **Effective Date** | The date the contract was last signed by all parties. This is the triggering event for all forward-counting deadlines. |
| **Calendar Days** | All days including weekends and holidays. FAR/BAR counts all deadlines in calendar days unless explicitly stated otherwise. |
| **Business Day** | Monday through Friday, excluding federal holidays. Used only for end-date adjustment (STANDARD F), not for counting. |
| **Paragraph 2(a)** | Initial deposit clause — specifies the amount and deadline for the buyer's initial earnest money deposit |
| **Paragraph 2(b)** | Additional deposit clause |
| **Paragraph 6(b)** | Condo/HOA disclosure obligations and buyer's termination rights |
| **Paragraph 8(b)** | Loan application and approval contingency |
| **Paragraph 10(d)** | Flood zone disclosure and termination right |
| **Paragraph 12(a)** | Inspection period — buyer's right to inspect and cancel |
| **Paragraph 12(e)** | Walk-through inspection prior to closing |
| **STANDARD A(ii)** | Title objection and cure period provisions |
| **STANDARD D** | Estoppel letter requirements for leased properties |
| **STANDARD F** | FAR/BAR boilerplate: if any deadline falls on a Saturday, Sunday, or federal holiday, it extends to the next business day |
| **Condo Rider** | Addendum modifying Paragraph 6(b) for condominium properties — changes delivery and review timeframes |
| **Right of First Refusal** | Condo association's or members' right to purchase the unit in lieu of Buyer; triggers 5-day docs deadline under Condo Rider §2(c) |
| **Nondeveloper Disclosure** | §5 of Condo Rider: disclosure of Declaration, Bylaws, Financials, FAQ; triggers 7-business-day voidability if docs not pre-provided before signing |
| **Milestone Inspection Report** | Structural inspection required under §553.899 F.S. for qualifying buildings |
| **Structural Integrity Reserve Study (SIRS)** | Study required under §§718.103(26) and 718.112(2)(g) F.S. |
| **Turnover Inspection Report** | Report for turnover inspections performed on/after July 1, 2023, per §718.301(4)(p)(q) F.S. |
| **Condo Association Approval** | §1 of Condo Rider: buyer must be approved by association N calendar days before closing; seller must initiate the process N calendar days after effective date |
| **Business Days (Condo Rider)** | The Condo Rider explicitly uses "excluding Saturdays, Sundays, and Legal Holidays" for its 7-day termination windows — distinct from the base FAR/BAR contract which uses calendar days throughout. Legally significant distinction. |
| **Title Commitment** | Lender's (or title company's) written commitment to issue title insurance |
| **Estoppel Letter** | Written statement from an HOA or condo association certifying dues, violations, and assessments owed at closing |
| **Walk-Through** | Buyer's final inspection of the property before closing |

---

## 3. All 21 Deadline Rules

| # | Deadline | Default Days | Day Type | Direction | Reference | Applies To |
|---|---|---|---|---|---|---|
| 1 | Initial Deposit | 3 | Calendar | Forward from effective | Para 2(a) | All contracts |
| 2 | Additional Deposit | 10 | Calendar | Forward from effective | Para 2(b) | All contracts |
| 3 | Loan Application | 5 | Calendar | Forward from effective | Para 8(b)(i) | Financed purchases |
| 4 | Inspection Period | 15 | Calendar | Forward from effective | Para 12(a) | All contracts |
| 5 | Flood Zone Termination | 20 | Calendar | Forward from effective | Para 10(d) | All contracts |
| 6 | Loan Approval | 30 | Calendar | Forward from effective | Para 8(b) | Financed purchases |
| 7 | Seller Lease Disclosure | 5 | Calendar | Forward from effective | Para 6(b) | If property is leased |
| 8 | Seller initiates Condo Assoc. approval | 5 | Calendar | Forward from effective | Condo Rider §1 | Condo — assoc. approval required |
| 9 | Buyer approved by Condo Assoc. | 5 | Calendar | Backward from closing | Condo Rider §1 | Condo — assoc. approval required |
| 10 | Right of First Refusal docs | 5 | Calendar | Forward from effective | Condo Rider §2(c) | Condo — ROFR applies |
| 11 | Nondeveloper disclosure termination | 7 | **Business** | Forward from effective | Condo Rider §5(b) | Condo — docs NOT pre-provided |
| 12 | Buyer's requested docs termination | 7 | **Business** | Forward from receipt of all docs | Condo Rider §6(b) | Condo — buyer requested docs |
| 13 | Milestone/SIRS/Turnover voidability | 7 | **Business** | Forward from effective | Condo Rider §9(d) | Condo — any inspection report completed |
| 14 | Title Commitment | 5 (cash) / 15 (financed) | Calendar | Backward from closing | Para 9(c) | All contracts |
| 15 | Survey | 5 | Calendar | Backward from closing | Para 9(d) | Optional / buyer-elected |
| 16 | Estoppel Letters | 10 | Calendar | Backward from closing | STANDARD D | Leased properties |
| 17 | Walk-Through Option 1 | 1 | Calendar | Backward from closing | Para 12(e) | Buyer's choice |
| 18 | Walk-Through Option 2 | 0 | Calendar | Same day as closing | Para 12(e) | Buyer's choice |
| 19 | Title Objection | 5 | Calendar | After title commitment received | STANDARD A(ii) | Conditional on title issues |
| 20 | Title Cure | 30 | Calendar | After title objection | STANDARD A(ii) | Conditional on objection |
| 21 | Closing Date | 0 | — | — | Para 4 | All contracts |

---

## 4. Business Day Adjustment Logic (STANDARD F)

1. All deadlines are computed in **calendar days** first.
2. After computing the raw calendar date, check if it falls on:
   - Saturday
   - Sunday
   - A recognized federal holiday (see list below)
3. **Forward-counting deadlines** (from effective date): if the result is a weekend/holiday, move **forward** to the next business day.
4. **Backward-counting deadlines** (from closing date): if the result is a weekend/holiday, move **backward** to the prior business day.

### Federal Holidays Recognized

- New Year's Day (January 1)
- Martin Luther King Jr. Day (3rd Monday of January)
- Presidents Day (3rd Monday of February)
- Memorial Day (last Monday of May)
- Independence Day (July 4)
- Labor Day (1st Monday of September)
- Veterans Day (November 11)
- Thanksgiving Day (4th Thursday of November)
- Christmas Day (December 25)

When a holiday falls on Saturday, it is observed on Friday. When it falls on Sunday, it is observed on Monday.

---

## 5. Counting Convention — Day After Triggering Event

### Correct FAR/BAR Rule
Counting begins **the calendar day after** the triggering event.

- Contract signed (effective) on **Monday** → Day 1 = **Tuesday** → 3-day deposit due **Thursday**
- Contract signed on **Friday** → Day 1 = **Saturday** → 3-day deposit raw = **Monday** → STANDARD F: due **Monday** (already a business day)

### Known Bug (as of initial implementation)
The current implementation begins counting **on** the effective date (Day 0 = effective date itself), which shifts every forward-counting deadline one day too early.

**Fix required:** Change `addCalendarDays(effectiveDate, N)` to use `effectiveDate + 1` as the base:

```js
// WRONG (current):
addDays(effectiveDate, N)

// CORRECT (FAR/BAR):
addDays(effectiveDate, N + 1)  // or: addDays(addDays(effectiveDate, 1), N)
```

Core files: `src/utils/deadlineRules.js`, `src/utils/businessDays.js`

---

## 6. Configurable vs. Hardcoded Deadlines

### Current State
The initial deposit deadline is hardcoded at 3 calendar days (Para 2(a) default). Other deadlines use hardcoded day counts as well.

### Problem
Real contracts frequently specify non-standard timeframes:
- Initial deposit: 10 days instead of 3
- Inspection period: 10 days instead of 15
- Loan approval: 45 days instead of 30

### Fix Required
Expose per-deadline day-count overrides in `ManualEntryForm`. The standard FAR/BAR default pre-fills each field, but users must be able to edit any day count to match the actual contract terms. The override applies only to the current contract calculation — it does not change system defaults.

---

## 7. Condo Rider Deadlines (CR-7 Rev. 06/2025 — Confirmed)

**Source:** Florida Realtors/Florida Bar Condominium Rider CR-7 Rev. 06/2025
**Status:** Confirmed from CR-7 Rev. 06/2025 (lead underwriter review)

### Critical Legal Distinction: Business Days vs. Calendar Days

The condo rider's 7-day windows **explicitly exclude Saturdays, Sundays, and Legal Holidays**, making them **business day counts**. This is legally distinct from the base FAR/BAR contract which uses calendar days throughout.

### All 8 Deadline Entries from the Rider

| Section | Deadline | Days | Day Type | Direction |
|---------|----------|------|----------|-----------|
| §1 | Seller initiates Condo Assoc. approval process | 5 (default) | Calendar | Forward from effective |
| §1 | Buyer must be approved by Condo Assoc. | 5 (default) | Calendar | Backward from closing |
| §2(c) | Right of First Refusal docs signed/delivered | 5 (default) | Calendar | Forward from effective |
| §5(b) | Nondeveloper disclosure termination window | 7 | **Business** | Forward from execution + receipt |
| §5(b) | Buyer closing extension right (awaiting condo docs) | up to 7 | **Business** | Forward from receipt |
| §6(b) | Buyer's requested docs termination right | 7 | **Business** | Forward from receipt of all docs |
| §9(d) | Voidability: milestone / SIRS / turnover reports | 7 | **Business** | Forward from execution + receipt |
| §9(d) | Closing extension right (awaiting inspection reports) | up to 7 | **Business** | Forward from receipt |

### §5(a) vs §5(b) — Pre-provided vs. Not Pre-provided Docs
- If condo docs were provided **before** contract signing (§5(a)): nondeveloper termination window does **not** apply
- If condo docs were **not** provided before signing (§5(b)): 7-business-day termination window begins from execution + receipt of docs

### §9(d) — Applicable Reports
Voidability applies when **any** of the following are completed for the unit:
- Milestone Inspection Report (§553.899 F.S.)
- Structural Integrity Reserve Study (SIRS) (§§718.103(26) and 718.112(2)(g) F.S.)
- Turnover Inspection Report performed on/after July 1, 2023 (§718.301(4)(p)(q) F.S.)

---

## 8. Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19 + Vite 7, custom CSS (WFG design system, no Tailwind) |
| Auth | Firebase Authentication (Google OAuth) |
| Database | Firestore (contract storage, user preferences) |
| PDF Export | jsPDF (branded deadline summary export) |
| Core Logic | `src/utils/deadlineRules.js`, `src/utils/businessDays.js` |
| Deployment | Vercel |

---

## 9. Known Issues Summary

| # | Issue | Severity | Status |
|---|---|---|---|
| 1 | Day-after counting bug — deadlines off by 1 day | High | Fix pending |
| 2 | Initial deposit days not configurable | Medium | Fix pending |
| 3 | Condo rider dates outdated | Medium | In progress — CR-7 Rev. 06/2025 confirmed; 6 new deadline rules implemented |
| 4 | Condo rider 7-day windows use business days; `addBusinessDays()` needed in `businessDays.js` | Medium | Resolved — `addBusinessDays()` already present; condo deadlines now use it |
