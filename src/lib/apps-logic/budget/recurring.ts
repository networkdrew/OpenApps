import { addInterval, isBeforeOrEqual } from "./dates";
import {
  createTransaction,
  type RecurringRule,
  type Transaction,
} from "./model";

/** Hard ceiling on occurrences generated in one pass, so a corrupt rule (e.g. interval 0) can never hang the UI. */
const MAX_OCCURRENCES_PER_RULE = 500;

export interface GenerateDueResult {
  transactions: Transaction[];
  updatedRules: RecurringRule[];
}

/**
 * For every active rule whose `nextDueDate` has arrived (on/before `asOf`),
 * creates one transaction per occurrence and advances the rule past `asOf`.
 * A rule that has passed its `endDate` is deactivated rather than deleted,
 * so it stays visible (and reactivatable) in the recurring list.
 */
export function generateDueTransactions(
  rules: readonly RecurringRule[],
  asOf: string,
): GenerateDueResult {
  const transactions: Transaction[] = [];
  const updatedRules: RecurringRule[] = [];

  for (const rule of rules) {
    if (!rule.active) {
      updatedRules.push(rule);
      continue;
    }

    let nextDueDate = rule.nextDueDate;
    let active: boolean = rule.active;
    let occurrences = 0;

    while (
      isBeforeOrEqual(nextDueDate, asOf) &&
      occurrences < MAX_OCCURRENCES_PER_RULE
    ) {
      if (rule.endDate && !isBeforeOrEqual(nextDueDate, rule.endDate)) {
        active = false;
        break;
      }
      transactions.push(
        createTransaction({
          accountId: rule.accountId,
          type: rule.type,
          amountCents: rule.amountCents,
          date: nextDueDate,
          categoryId: rule.categoryId,
          payee: rule.payee,
          memo: rule.memo,
          transferAccountId: null,
          cleared: false,
          recurringId: rule.id,
        }),
      );
      nextDueDate = addInterval(nextDueDate, rule.frequency, rule.interval);
      occurrences += 1;
      if (rule.endDate && !isBeforeOrEqual(nextDueDate, rule.endDate)) {
        active = false;
      }
    }

    updatedRules.push(
      nextDueDate === rule.nextDueDate && active === rule.active
        ? rule
        : { ...rule, nextDueDate, active },
    );
  }

  return { transactions, updatedRules };
}
