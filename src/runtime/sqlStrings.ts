import type {
  ConditionExpression,
  LogicalCondition,
  PrimitiveCondition,
  Table,
} from "../types";

/** Escapes single quotes for safe embedding into SQL string literals. */
export const escapeString = (value: string) => value.replaceAll("'", "''");

/** Quotes primitive values according to SQL literal rules. */
export const quoteValue = (value: unknown): string => {
  if (typeof value === "string") return `'${escapeString(value)}'`;
  if (typeof value === "number" || typeof value === "bigint") return `${value}`;
  if (typeof value === "boolean") return value ? "true" : "false";
  if (value === null) return "NULL";
  const description = value === undefined ? "undefined" : typeof value;
  throw new Error(`Unsupported value in SQL builder (${description})`);
};

type ComparisonKind = PrimitiveCondition<Table<string, any>>["kind"];

const CMP_SYMBOLS: Record<ComparisonKind, string> = {
  eq: "=",
  ne: "!=",
  gt: ">",
  gte: ">=",
  lt: "<",
  lte: "<=",
};

const isLogicalCondition = (
  condition: ConditionExpression<any>
): condition is LogicalCondition<any> =>
  condition.kind === "and" || condition.kind === "or";

/** Serializes a condition expression (primitive or logical) to SQL text. */
export const conditionToSql = (condition: ConditionExpression<any>): string => {
  if (!condition) return "";
  if (isLogicalCondition(condition)) {
    const left = conditionToSql(condition.left);
    const right = conditionToSql(condition.right);
    const operator = condition.kind === "and" ? "AND" : "OR";
    return `(${left}) ${operator} (${right})`;
  }

  const operator = CMP_SYMBOLS[condition.kind];
  return `${condition.col} ${operator} ${quoteValue(condition.val)}`;
};

/** Builds a plain INSERT statement string given raw column/value lists. */
export const buildInsertSql = (
  tableName: string,
  columns: readonly string[],
  values: readonly unknown[]
): string => {
  const columnList = columns.join(", ");
  const valueList = values.map((value) => quoteValue(value)).join(", ");
  return `INSERT INTO ${tableName} (${columnList}) VALUES (${valueList})`;
};

/** Builds a plain UPDATE statement string from set pairs and optional WHERE. */
export const buildUpdateSql = (
  tableName: string,
  setPairs: readonly [string, unknown][],
  where?: ConditionExpression<any>
): string => {
  const setPart = setPairs
    .map(([column, value]) => `${column} = ${quoteValue(value)}`)
    .join(", ");
  const wherePart = where ? ` WHERE ${conditionToSql(where)}` : "";
  return `UPDATE ${tableName} SET ${setPart}${wherePart}`;
};

/** Builds a plain DELETE statement string with an optional WHERE clause. */
export const buildDeleteSql = (
  tableName: string,
  where?: ConditionExpression<any>
): string => {
  const wherePart = where ? ` WHERE ${conditionToSql(where)}` : "";
  return `DELETE FROM ${tableName}${wherePart}`;
};
