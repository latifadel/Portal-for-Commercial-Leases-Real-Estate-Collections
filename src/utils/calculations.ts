import {
  Contract,
  PaymentInstallment,
  PaymentFrequency,
  ContractStatus,
  ContractAlertLevel,
  PaymentStatus,
  AccruedRentSummaryItem,
  Tenant,
  Office
} from '../types';
import { differenceInDays, parseISO, addMonths, format, isBefore, isAfter, startOfDay } from 'date-fns';

/**
 * Calculate VAT amount
 * VAT Amount = Rental Value × VAT %
 */
export function calculateVAT(baseRent: number, vatRate: number): number {
  return Math.round(baseRent * vatRate * 100) / 100;
}

/**
 * Calculate Total with VAT
 * Total Contract Value = Rental Value + VAT
 */
export function calculateTotalWithVAT(baseRent: number, vatRate: number): number {
  const vat = calculateVAT(baseRent, vatRate);
  return Math.round((baseRent + vat) * 100) / 100;
}

/**
 * Calculate Days Overdue
 * Days Overdue = Current Date - Payment Due Date
 * Returns 0 or negative if not overdue yet.
 */
export function calculateDaysOverdue(dueDateStr: string, currentDateStr: string): number {
  try {
    const due = startOfDay(parseISO(dueDateStr));
    const current = startOfDay(parseISO(currentDateStr));
    const diff = differenceInDays(current, due);
    return diff > 0 ? diff : 0;
  } catch (e) {
    return 0;
  }
}

/**
 * Calculate Remaining Days until Contract End Date
 * Contract Remaining Days = Contract End Date - Current Date
 */
export function calculateContractRemainingDays(endDateStr: string, currentDateStr: string): number {
  try {
    const end = startOfDay(parseISO(endDateStr));
    const current = startOfDay(parseISO(currentDateStr));
    return differenceInDays(end, current);
  } catch (e) {
    return 0;
  }
}

/**
 * Calculate Contract Progress
 * Contract Progress = Time Passed / Total Contract Duration
 * Clamped between 0 and 1 (0% to 100%)
 */
export function calculateContractProgress(startDateStr: string, endDateStr: string, currentDateStr: string): number {
  try {
    const start = startOfDay(parseISO(startDateStr));
    const end = startOfDay(parseISO(endDateStr));
    const current = startOfDay(parseISO(currentDateStr));

    const totalDays = differenceInDays(end, start);
    if (totalDays <= 0) return 1;

    const elapsedDays = differenceInDays(current, start);
    if (elapsedDays <= 0) return 0;
    if (elapsedDays >= totalDays) return 1;

    return Math.min(1, Math.max(0, elapsedDays / totalDays));
  } catch (e) {
    return 0;
  }
}

/**
 * Automatically determine Contract Status based on dates and explicit cancellation/renewal
 */
export function determineContractStatus(
  contract: Pick<Contract, 'startDate' | 'endDate' | 'status'>,
  currentDateStr: string
): ContractStatus {
  if (contract.status === 'CANCELLED' || contract.status === 'RENEWED') {
    return contract.status;
  }

  try {
    const start = startOfDay(parseISO(contract.startDate));
    const end = startOfDay(parseISO(contract.endDate));
    const current = startOfDay(parseISO(currentDateStr));

    if (isBefore(current, start)) {
      return 'UPCOMING';
    }
    if (isAfter(current, end)) {
      return 'EXPIRED';
    }

    const daysRemaining = differenceInDays(end, current);
    if (daysRemaining <= 90) {
      return 'EXPIRING_SOON';
    }

    return 'ACTIVE';
  } catch (e) {
    return contract.status;
  }
}

/**
 * Get Contract Expiration Alert Visual Level
 * Alerts at: 90, 60, 30, 14, 7 days before, on expiration date, expired
 */
export function getContractAlertLevel(endDateStr: string, currentDateStr: string): ContractAlertLevel {
  const days = calculateContractRemainingDays(endDateStr, currentDateStr);

  if (days < 0) return 'EXPIRED';
  if (days <= 14) return 'URGENT';
  if (days <= 30) return 'WARNING';
  if (days <= 90) return 'UPCOMING';
  return 'NORMAL';
}

/**
 * Automatically determine Payment Installment Status
 */
/**
 * Automatically determine Payment Installment Status
 * Statuses: PAID, OVERDUE, PARTIALLY_PAID, DUE (Due Soon), UPCOMING
 * Overdue: Current Date > Due Date AND Remaining Amount > 0
 */
export function determinePaymentStatus(
  installment: Pick<PaymentInstallment, 'dueDate' | 'paidAmount' | 'totalAmount'>,
  currentDateStr: string
): PaymentStatus {
  const { dueDate, paidAmount, totalAmount } = installment;

  if (paidAmount >= totalAmount && totalAmount > 0) {
    return 'PAID';
  }

  const daysOverdue = calculateDaysOverdue(dueDate, currentDateStr);

  // If due date has passed and there is unpaid balance: OVERDUE
  if (daysOverdue > 0 && (totalAmount - paidAmount) > 0) {
    return 'OVERDUE';
  }

  // If partially paid but due date has not passed yet
  if (paidAmount > 0 && paidAmount < totalAmount) {
    return 'PARTIALLY_PAID';
  }

  // If due within the next 14 days
  const daysUntilDue = differenceInDays(startOfDay(parseISO(dueDate)), startOfDay(parseISO(currentDateStr)));
  if (daysUntilDue <= 14 && daysUntilDue >= 0) {
    return 'DUE';
  }

  return 'UPCOMING';
}

/**
 * Generate Expected Payment Schedule when a contract is created
 * Supports: MONTHLY, QUARTERLY, SEMI_ANNUAL, ANNUAL, ONE_TIME, CUSTOM
 */
export function generatePaymentSchedule(params: {
  contractId: string;
  tenantId: string;
  officeId: string;
  startDate: string;
  endDate: string;
  durationMonths: number;
  baseRent: number;
  vatRate: number;
  paymentFrequency: PaymentFrequency;
}): PaymentInstallment[] {
  const {
    contractId,
    tenantId,
    officeId,
    startDate,
    endDate,
    durationMonths,
    baseRent,
    vatRate,
    paymentFrequency,
  } = params;

  let intervals = 1;
  if (paymentFrequency === 'MONTHLY') intervals = Math.max(1, durationMonths);
  else if (paymentFrequency === 'QUARTERLY') intervals = Math.max(1, Math.ceil(durationMonths / 3));
  else if (paymentFrequency === 'SEMI_ANNUAL') intervals = Math.max(1, Math.ceil(durationMonths / 6));
  else if (paymentFrequency === 'ANNUAL') intervals = Math.max(1, Math.ceil(durationMonths / 12));
  else if (paymentFrequency === 'ONE_TIME') intervals = 1;
  else intervals = 1; // custom default

  const monthsPerInterval = durationMonths / intervals;
  const totalWithVat = calculateTotalWithVAT(baseRent, vatRate);
  const totalVat = calculateVAT(baseRent, vatRate);

  const basePerInstallment = Math.round((baseRent / intervals) * 100) / 100;
  const vatPerInstallment = Math.round((totalVat / intervals) * 100) / 100;
  const totalPerInstallment = Math.round((totalWithVat / intervals) * 100) / 100;

  const start = parseISO(startDate);
  const installments: PaymentInstallment[] = [];

  for (let i = 0; i < intervals; i++) {
    const periodStart = addMonths(start, Math.round(i * monthsPerInterval));
    const periodEnd = i === intervals - 1 
      ? parseISO(endDate) 
      : addMonths(start, Math.round((i + 1) * monthsPerInterval));

    const dueDateStr = format(periodStart, 'yyyy-MM-dd');
    const invoiceNum = `INV-${contractId.replace('CTR-', '')}-${String(i + 1).padStart(2, '0')}`;

    // Period label formatting
    let periodLabel = `Installment ${i + 1} of ${intervals}`;
    if (paymentFrequency === 'ONE_TIME') {
      periodLabel = `Full Contract Payment (100%)`;
    } else if (paymentFrequency === 'QUARTERLY') {
      periodLabel = `Q${(i % 4) + 1} Payment (${format(periodStart, 'MMM yyyy')})`;
    } else if (paymentFrequency === 'SEMI_ANNUAL') {
      periodLabel = `H${(i % 2) + 1} Payment (${format(periodStart, 'MMM yyyy')})`;
    } else if (paymentFrequency === 'MONTHLY') {
      periodLabel = `Month ${i + 1} (${format(periodStart, 'MMM yyyy')})`;
    } else if (paymentFrequency === 'ANNUAL') {
      periodLabel = `Year ${i + 1} Payment`;
    }

    // Adjust last installment for rounding discrepancies
    const isLast = i === intervals - 1;
    const currentBase = isLast 
      ? Math.round((baseRent - basePerInstallment * (intervals - 1)) * 100) / 100 
      : basePerInstallment;
    const currentVat = isLast 
      ? Math.round((totalVat - vatPerInstallment * (intervals - 1)) * 100) / 100 
      : vatPerInstallment;
    const currentTotal = isLast 
      ? Math.round((totalWithVat - totalPerInstallment * (intervals - 1)) * 100) / 100 
      : totalPerInstallment;

    installments.push({
      id: `inst-${contractId}-${i + 1}`,
      contractId,
      tenantId,
      officeId,
      invoiceNumber: invoiceNum,
      installmentNumber: i + 1,
      periodLabel,
      periodStartDate: format(periodStart, 'yyyy-MM-dd'),
      periodEndDate: format(periodEnd, 'yyyy-MM-dd'),
      dueDate: dueDateStr,
      baseAmount: currentBase,
      vatAmount: currentVat,
      totalAmount: currentTotal,
      paidAmount: 0,
      remainingAmount: currentTotal,
      status: 'UPCOMING',
      transactions: [],
    });
  }

  return installments;
}

/**
 * Calculate dynamic contract financials strictly based on contract and installment schedule:
 * - Base Rent
 * - VAT Amount
 * - Total Rent With VAT
 * - Rent Received (actual paid amount)
 * - Outstanding Balance (Total With VAT - Rent Received)
 * - Overdue Rent (Unpaid balance ONLY for installments whose due date has passed)
 */
export function calculateContractFinancials(
  contract: Contract,
  payments: PaymentInstallment[],
  currentDateStr: string
) {
  const vatRate = contract.vatRate ?? 0.15;
  const baseRent = contract.baseRent || 0;
  const vatAmount = contract.vatAmount ?? calculateVAT(baseRent, vatRate);
  const totalRentWithVat = contract.totalRent || calculateTotalWithVAT(baseRent, vatRate);

  const contractPayments = payments.filter(p => p.contractId === contract.id);
  const rentReceived = contractPayments.reduce((sum, p) => sum + (p.paidAmount || 0), 0);
  const outstandingBalance = Math.max(0, Math.round((totalRentWithVat - rentReceived) * 100) / 100);

  // Overdue Rent = ONLY unpaid amount from installments whose due dates have passed
  const overdueAmount = contractPayments.reduce((sum, p) => {
    const isPastDue = calculateDaysOverdue(p.dueDate, currentDateStr) > 0;
    const remaining = p.remainingAmount !== undefined ? p.remainingAmount : (p.totalAmount - (p.paidAmount || 0));
    return sum + (isPastDue && remaining > 0 ? remaining : 0);
  }, 0);

  return {
    baseRent,
    vatRate,
    vatAmount,
    totalRentWithVat,
    rentReceived,
    outstandingBalance,
    overdueAmount: Math.round(overdueAmount * 100) / 100,
  };
}

/**
 * Calculate Building Financial Summary KPIs
 */
export function calculateBuildingFinancialSummary(params: {
  tenants: Tenant[];
  offices: Office[];
  contracts: Contract[];
  payments: PaymentInstallment[];
  currentDateStr: string;
}): {
  totalTenants: number;
  activeLeases: number;
  totalOffices: number;
  occupiedOffices: number;
  occupancyRate: number;
  totalBaseRent: number;
  totalVat: number;
  totalContractValueWithVat: number;
  totalRentReceived: number;
  totalOutstandingRent: number;
  totalOverdueRent: number;
  overdueInstallmentsCount: number;
} {
  const { tenants, offices, contracts, payments, currentDateStr } = params;

  const totalTenants = tenants.length;
  const activeContracts = contracts.filter(c => c.status === 'ACTIVE' || c.status === 'EXPIRING_SOON');
  const activeLeases = activeContracts.length;

  const totalOffices = offices.length;
  const occupiedOffices = offices.filter(o => o.status === 'OCCUPIED').length;
  const occupancyRate = totalOffices > 0 ? Math.round((occupiedOffices / totalOffices) * 100) : 0;

  let totalBaseRent = 0;
  let totalVat = 0;
  let totalContractValueWithVat = 0;
  let totalRentReceived = 0;
  let totalOutstandingRent = 0;
  let totalOverdueRent = 0;

  contracts.forEach(c => {
    const fin = calculateContractFinancials(c, payments, currentDateStr);
    totalBaseRent += fin.baseRent;
    totalVat += fin.vatAmount;
    totalContractValueWithVat += fin.totalRentWithVat;
    totalRentReceived += fin.rentReceived;
    totalOutstandingRent += fin.outstandingBalance;
    totalOverdueRent += fin.overdueAmount;
  });

  const overdueInstallments = payments.filter(
    p => (p.remainingAmount > 0 || (p.totalAmount - (p.paidAmount || 0)) > 0) &&
         calculateDaysOverdue(p.dueDate, currentDateStr) > 0
  );

  return {
    totalTenants,
    activeLeases,
    totalOffices,
    occupiedOffices,
    occupancyRate,
    totalBaseRent: Math.round(totalBaseRent * 100) / 100,
    totalVat: Math.round(totalVat * 100) / 100,
    totalContractValueWithVat: Math.round(totalContractValueWithVat * 100) / 100,
    totalRentReceived: Math.round(totalRentReceived * 100) / 100,
    totalOutstandingRent: Math.round(totalOutstandingRent * 100) / 100,
    totalOverdueRent: Math.round(totalOverdueRent * 100) / 100,
    overdueInstallmentsCount: overdueInstallments.length,
  };
}

/**
 * Calculate Accrued Rental for a single contract up to a reporting date
 * Formula:
 * Accrued Rental represents rental income earned according to the contract period
 * up to the selected date, regardless of whether the tenant has paid it yet.
 * Strictly ignores future unearned rental amounts.
 */
export function calculateContractAccrual(
  contract: Contract,
  payments: PaymentInstallment[],
  tenant: Tenant | undefined,
  office: Office | undefined,
  reportDateStr: string
): AccruedRentSummaryItem {
  const start = startOfDay(parseISO(contract.startDate));
  const end = startOfDay(parseISO(contract.endDate));
  const reportDate = startOfDay(parseISO(reportDateStr));

  const totalDays = Math.max(1, differenceInDays(end, start));
  
  let earnedToDate = 0;
  let elapsedDays = 0;

  if (isBefore(reportDate, start)) {
    // Report date is before contract start: 0 earned
    earnedToDate = 0;
    elapsedDays = 0;
  } else if (isAfter(reportDate, end)) {
    // Report date is after contract end: 100% earned
    earnedToDate = contract.baseRent;
    elapsedDays = totalDays;
  } else {
    // Report date is strictly within contract period
    elapsedDays = differenceInDays(reportDate, start);
    const fraction = elapsedDays / totalDays;
    earnedToDate = Math.round(contract.baseRent * fraction * 100) / 100;
  }

  // Calculate actual cash received for this contract
  const contractPayments = payments.filter(p => p.contractId === contract.id);
  const amountReceived = contractPayments.reduce((acc, p) => acc + (p.paidAmount || 0), 0);

  // Accrued amount: Earned rent that has not yet been paid, or net earned
  // In accounting terms, Accrued Rent Receivable = max(0, earnedToDate - amountReceived)
  const accruedAmount = Math.max(0, Math.round((earnedToDate - amountReceived) * 100) / 100);

  // Total outstanding balance on the entire contract (including VAT)
  const totalContractVal = contract.totalRent;
  const outstandingAmount = Math.max(0, Math.round((totalContractVal - amountReceived) * 100) / 100);

  const progressPercent = Math.min(100, Math.max(0, Math.round((elapsedDays / totalDays) * 100)));

  return {
    contractId: contract.id,
    tenantId: contract.tenantId,
    tenantName: tenant ? tenant.name : 'Unknown Tenant',
    tenantNameAr: tenant ? tenant.nameAr : undefined,
    officeId: contract.officeId,
    officeNumber: office ? office.officeNumber : 'N/A',
    contractValue: contract.baseRent,
    startDate: contract.startDate,
    endDate: contract.endDate,
    totalDurationDays: totalDays,
    elapsedDays,
    earnedToDate,
    amountReceived,
    accruedAmount,
    outstandingAmount,
    contractStatus: contract.status,
    progressPercent,
  };
}
