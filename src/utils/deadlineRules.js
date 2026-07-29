/**
 * FAR/BAR Contract Deadline Rules for Florida
 * Based on Standard Residential Contract (Rev.12/24)
 *
 * CRITICAL: Per STANDARD F (Lines 523-529):
 * - Calendar days are used (NOT business days)
 * - If deadline falls on weekend/holiday, it extends to next business day
 */

import { addCalendarDays, subtractCalendarDays, ensureBusinessDay, parseLocalDate } from './businessDays';

/**
 * Static list of all possible deadline definitions.
 * Used by the configure panel to show all options (all selected by default).
 * appliesTo: 'all' | 'financed' | 'condo'
 */
export const DEADLINE_DEFINITIONS = [
  { id: 'initial-deposit',         name: 'Initial Deposit Due',                  category: 'Deposits',           appliesTo: 'all',      note: '' },
  { id: 'additional-deposit',      name: 'Additional Deposit Due',               category: 'Deposits',           appliesTo: 'all',      note: '' },
  { id: 'loan-application',        name: 'Loan Application',                     category: 'Financing',          appliesTo: 'financed', note: 'Financed transactions only' },
  { id: 'loan-approval',           name: 'Loan Approval Period Ends',            category: 'Financing',          appliesTo: 'financed', note: 'Financed transactions only' },
  { id: 'inspection-period',       name: 'Inspection Period Ends',               category: 'Inspections',        appliesTo: 'all',      note: '' },
  { id: 'flood-zone-termination',  name: 'Flood Zone Termination Period',        category: 'Contingencies',      appliesTo: 'all',      note: '' },
  { id: 'lease-disclosure',        name: 'Seller Lease Disclosure',              category: 'Seller Obligations', appliesTo: 'all',      note: 'Only if property has active leases' },
  { id: 'condo-docs-delivery',     name: 'Condo/HOA Documents Delivery',         category: 'Condo / HOA',        appliesTo: 'condo',    note: 'Condo/HOA properties only' },
  { id: 'condo-review-termination',name: 'Condo Review Termination Right',       category: 'Condo / HOA',        appliesTo: 'condo',    note: 'Condo/HOA properties only' },
  { id: 'title-commitment',        name: 'Title Evidence (Commitment) Due',      category: 'Title',              appliesTo: 'all',      note: '' },
  { id: 'title-objection',         name: 'Title Objection Deadline',             category: 'Title',              appliesTo: 'all',      note: 'Conditional on title commitment delivery' },
  { id: 'title-cure',              name: 'Title Cure Period Ends',               category: 'Title',              appliesTo: 'all',      note: 'Conditional – only if objections are raised' },
  { id: 'survey',                  name: 'Survey Completion',                    category: 'Title',              appliesTo: 'all',      note: 'Optional – only if Buyer orders survey' },
  { id: 'estoppel-letters',        name: 'Estoppel Letters Due',                 category: 'Seller Obligations', appliesTo: 'all',      note: 'Only if property is subject to lease' },
  { id: 'walkthrough-option-1',    name: 'Walk-Through Inspection (Day Before)', category: 'Inspections',        appliesTo: 'all',      note: 'Buyer picks one walk-through option' },
  { id: 'walkthrough-option-2',    name: 'Walk-Through Inspection (Day Of)',     category: 'Inspections',        appliesTo: 'all',      note: 'Buyer picks one walk-through option' },
  { id: 'closing',                 name: 'Closing Date',                         category: 'Closing',            appliesTo: 'all',      note: '' },
];

/**
 * Estimate closing date if not provided
 * Industry standard: 30-45 days from effective date
 */
function estimateClosingDate(effectiveDate, transactionType) {
  const days = transactionType === 'cash' ? 30 : 45;
  return addCalendarDays(parseLocalDate(effectiveDate), days);
}

/**
 * Calculate all deadlines for a contract
 * @param {Object} contractData - Contract information
 * @returns {Object} - Contains deadlines array and metadata
 */
export function calculateAllDeadlines(contractData) {
  const {
    effectiveDate,
    closingDate,
    transactionType, // 'cash' or 'financed'
    isCondo = false,
    initialDepositDays = 3,
  } = contractData;

  // Parse date strings as local time (not UTC) to avoid off-by-one day errors
  const effective = parseLocalDate(effectiveDate);

  let closing = closingDate ? parseLocalDate(closingDate) : null;
  const isClosingEstimated = !closing;

  // Estimate closing if not provided
  if (!closing) {
    closing = estimateClosingDate(effectiveDate, transactionType);
  }

  // CRITICAL: Ensure closing date is on a business day
  // This is essential per FAR/BAR standards - closings cannot occur on weekends/holidays
  closing = ensureBusinessDay(closing);

  const deadlines = [];

  // ==========================================
  // FORWARD CALCULATIONS (from Effective Date)
  // ==========================================

  // 1. Initial Deposit - configurable calendar days (Paragraph 2(a), Line 28-32)
  deadlines.push({
    id: 'initial-deposit',
    name: 'Initial Deposit Due',
    description: 'Buyer must deliver initial deposit to escrow agent',
    dueDate: addCalendarDays(effective, initialDepositDays),
    calendarDays: initialDepositDays,
    category: 'Deposit',
    priority: 'critical',
    appliesTo: 'all',
    contractReference: 'Paragraph 2(a)',
  });

  // 2. Additional Deposit - 10 calendar days (Paragraph 2(b), Line 36-37)
  deadlines.push({
    id: 'additional-deposit',
    name: 'Additional Deposit Due',
    description: 'Buyer must deliver additional deposit to escrow agent',
    dueDate: addCalendarDays(effective, 10),
    calendarDays: 10,
    category: 'Deposit',
    priority: 'high',
    appliesTo: 'all',
    contractReference: 'Paragraph 2(b)',
  });

  // 3. Loan Application - 5 calendar days (Paragraph 8(b)(i), Line 98)
  if (transactionType === 'financed') {
    deadlines.push({
      id: 'loan-application',
      name: 'Loan Application',
      description: 'Buyer must make application for financing',
      dueDate: addCalendarDays(effective, 5),
      calendarDays: 5,
      category: 'Financing',
      priority: 'critical',
      appliesTo: 'financed',
      contractReference: 'Paragraph 8(b)(i)',
    });
  }

  // 4. Inspection Period - 15 calendar days (Paragraph 12(a), Line 277)
  deadlines.push({
    id: 'inspection-period',
    name: 'Inspection Period Ends',
    description: 'Buyer must complete all property inspections',
    dueDate: addCalendarDays(effective, 15),
    calendarDays: 15,
    category: 'Inspection',
    priority: 'high',
    appliesTo: 'all',
    contractReference: 'Paragraph 12(a)',
  });

  // 5. Flood Zone Termination Period - 20 calendar days (Paragraph 10(d), Line 242)
  deadlines.push({
    id: 'flood-zone-termination',
    name: 'Flood Zone Termination Period',
    description: 'Buyer may terminate if property is in special flood hazard area',
    dueDate: addCalendarDays(effective, 20),
    calendarDays: 20,
    category: 'Contingency',
    priority: 'medium',
    appliesTo: 'all',
    contractReference: 'Paragraph 10(d)',
  });

  // 6. Loan Approval Period - 30 calendar days (Paragraph 8(b), Line 90)
  if (transactionType === 'financed') {
    deadlines.push({
      id: 'loan-approval',
      name: 'Loan Approval Period Ends',
      description: 'Buyer must obtain loan approval (or notify Seller)',
      dueDate: addCalendarDays(effective, 30),
      calendarDays: 30,
      category: 'Financing',
      priority: 'critical',
      appliesTo: 'financed',
      contractReference: 'Paragraph 8(b)',
    });
  }

  // 7. Seller Delivers Lease Information - 5 calendar days (Paragraph 6(b), Line 77)
  // Only if property is subject to leases (we'll show it always with note)
  deadlines.push({
    id: 'lease-disclosure',
    name: 'Seller Lease Disclosure',
    description: 'Seller must disclose any lease/occupancy agreements (if applicable)',
    dueDate: addCalendarDays(effective, 5),
    calendarDays: 5,
    category: 'Seller Obligations',
    priority: 'medium',
    appliesTo: 'all',
    contractReference: 'Paragraph 6(b)',
    note: 'Only applicable if property is subject to lease or occupancy after closing',
  });

  // 8. Condo Documents Delivery - 5 calendar days (Paragraph 6(b), Line 77)
  if (isCondo) {
    deadlines.push({
      id: 'condo-docs-delivery',
      name: 'Condo/HOA Documents Delivery',
      description: 'Seller must deliver condo/HOA documents and disclosures',
      dueDate: addCalendarDays(effective, 5),
      calendarDays: 5,
      category: 'Condo',
      priority: 'high',
      appliesTo: 'condo',
      contractReference: 'Paragraph 6(b)',
    });

    // 9. Buyer Condo Termination - 5 days after receipt (assume timely delivery)
    deadlines.push({
      id: 'condo-review-termination',
      name: 'Condo Review Termination Right',
      description: 'Buyer may terminate within 5 days after receiving condo docs',
      dueDate: addCalendarDays(effective, 10), // 5 + 5
      calendarDays: 10,
      category: 'Condo',
      priority: 'medium',
      appliesTo: 'condo',
      contractReference: 'Paragraph 6(b)',
      note: 'Calculated assuming Seller delivers docs on time (day 5)',
    });
  }

  // ==========================================
  // BACKWARD CALCULATIONS (from Closing Date)
  // ==========================================

  // 10. Title Evidence (Commitment) Deadline (Paragraph 9(c), Line 171-174)
  const titleDays = transactionType === 'cash' ? 5 : 15;
  deadlines.push({
    id: 'title-commitment',
    name: 'Title Evidence (Commitment) Due',
    description: `Title insurance commitment must be delivered (${transactionType === 'cash' ? 'Cash' : 'Financed'})`,
    dueDate: subtractCalendarDays(closing, titleDays),
    calendarDays: titleDays,
    category: 'Title',
    priority: 'critical',
    appliesTo: 'all',
    contractReference: 'Paragraph 9(c)',
    calculatedFrom: 'closing',
    isEstimated: isClosingEstimated,
  });

  // 11. Survey Deadline - At least 5 days before closing (Paragraph 9(d), Line 197)
  deadlines.push({
    id: 'survey',
    name: 'Survey Completion',
    description: 'Property survey must be completed (if ordered by Buyer)',
    dueDate: subtractCalendarDays(closing, 5),
    calendarDays: 5,
    category: 'Title',
    priority: 'medium',
    appliesTo: 'all',
    contractReference: 'Paragraph 9(d)',
    calculatedFrom: 'closing',
    isEstimated: isClosingEstimated,
    note: 'Optional - only if Buyer orders survey',
  });

  // 12. Seller Delivers Estoppel Letters - At least 10 days before closing (STANDARD D, Line 504)
  deadlines.push({
    id: 'estoppel-letters',
    name: 'Estoppel Letters Due',
    description: 'Seller must provide tenant estoppel letters (if property is leased)',
    dueDate: subtractCalendarDays(closing, 10),
    calendarDays: 10,
    category: 'Seller Obligations',
    priority: 'medium',
    appliesTo: 'all',
    contractReference: 'STANDARD D',
    calculatedFrom: 'closing',
    isEstimated: isClosingEstimated,
    note: 'Only applicable if property is subject to lease',
  });

  // 13. Walk-Through Inspection - Day before OR day of closing (Paragraph 12(e), Line 373-378)
  // Show BOTH options
  const dayBeforeClosing = new Date(closing);
  dayBeforeClosing.setDate(dayBeforeClosing.getDate() - 1);
  // Ensure day before is also a business day
  const dayBefore = ensureBusinessDay(dayBeforeClosing);

  deadlines.push({
    id: 'walkthrough-option-1',
    name: 'Walk-Through Inspection (Option 1)',
    description: 'Buyer walk-through inspection - Day Before Closing',
    dueDate: dayBefore,
    calendarDays: 1,
    category: 'Inspection',
    priority: 'high',
    appliesTo: 'all',
    contractReference: 'Paragraph 12(e)',
    calculatedFrom: 'closing',
    isEstimated: isClosingEstimated,
    note: 'Buyer chooses: day before OR day of closing',
    isOption: true,
  });

  deadlines.push({
    id: 'walkthrough-option-2',
    name: 'Walk-Through Inspection (Option 2)',
    description: 'Buyer walk-through inspection - Day of Closing (before closing time)',
    dueDate: closing, // Already ensured to be business day above
    calendarDays: 0,
    category: 'Inspection',
    priority: 'high',
    appliesTo: 'all',
    contractReference: 'Paragraph 12(e)',
    calculatedFrom: 'closing',
    isEstimated: isClosingEstimated,
    note: 'Buyer chooses: day before OR day of closing',
    isOption: true,
  });

  // 14. Closing Date (already adjusted to business day above)
  deadlines.push({
    id: 'closing',
    name: isClosingEstimated ? 'Estimated Closing Date' : 'Closing Date',
    description: isClosingEstimated
      ? `Estimated closing date (${transactionType === 'cash' ? '30' : '45'} days is typical for ${transactionType} transactions). Adjusted to next business day if needed.`
      : 'Target closing date per contract. Adjusted to next business day if weekend/holiday.',
    dueDate: closing,
    calendarDays: 0,
    category: 'Closing',
    priority: 'critical',
    appliesTo: 'all',
    contractReference: 'Paragraph 4',
    isEstimated: isClosingEstimated,
  });

  // ==========================================
  // CONDITIONAL DEADLINES (calculated from other events)
  // ==========================================

  // 15. Title Objection Period - 5 days after receiving Title Commitment (STANDARD A(ii), Line 477)
  const titleCommitmentDate = subtractCalendarDays(closing, titleDays);
  deadlines.push({
    id: 'title-objection',
    name: 'Title Objection Deadline',
    description: 'Buyer must notify Seller of title defects',
    dueDate: addCalendarDays(titleCommitmentDate, 5),
    calendarDays: 5,
    category: 'Title',
    priority: 'high',
    appliesTo: 'all',
    contractReference: 'STANDARD A(ii)',
    dependsOn: 'title-commitment',
    note: 'Calculated assuming Seller delivers Title Commitment on time',
    isConditional: true,
  });

  // 16. Title Cure Period - 30 days after Seller receives objection (STANDARD A(ii), Line 480)
  const titleObjectionDate = addCalendarDays(titleCommitmentDate, 5);
  deadlines.push({
    id: 'title-cure',
    name: 'Title Cure Period Ends',
    description: 'Seller must cure title defects (if any were identified)',
    dueDate: addCalendarDays(titleObjectionDate, 30),
    calendarDays: 30,
    category: 'Title',
    priority: 'high',
    appliesTo: 'all',
    contractReference: 'STANDARD A(ii)',
    dependsOn: 'title-objection',
    note: 'Only applicable if Buyer raises title objections',
    isConditional: true,
  });

  // Sort by due date
  return {
    deadlines: deadlines.sort((a, b) => a.dueDate - b.dueDate),
    metadata: {
      effectiveDate: effective,
      closingDate: closing,
      isClosingEstimated,
      transactionType,
      isCondo,
    }
  };
}

/**
 * Get deadline status based on days remaining
 */
export function getDeadlineStatus(daysRemaining) {
  if (daysRemaining < 0) return 'overdue';
  if (daysRemaining === 0) return 'due-today';
  if (daysRemaining <= 3) return 'urgent';
  if (daysRemaining <= 7) return 'upcoming';
  return 'future';
}

/**
 * Get status label
 */
export function getStatusLabel(status) {
  const labels = {
    overdue: 'Overdue',
    'due-today': 'Due Today',
    urgent: 'Urgent',
    upcoming: 'Upcoming',
    future: 'Future',
  };
  return labels[status] || 'Unknown';
}

/**
 * Get priority color
 */
export function getPriorityColor(priority) {
  const colors = {
    critical: '#dc2626', // red-600
    high: '#ea580c', // orange-600
    medium: '#ca8a04', // yellow-600
    low: '#16a34a', // green-600
  };
  return colors[priority] || '#6b7280';
}
