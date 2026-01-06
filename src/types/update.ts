import type {
  Column,
  Join,
  Quote,
  Table,
  TableName,
  TableSchema,
} from "./core";
import type { ConditionExpression, WherePart } from "./conditions";

/** Describes the mutation portion of an UPDATE statement for a table. */
export type UpdateOptions<TTable extends Table<string, any>> = {
  set: Partial<Record<Column<TTable>, TableSchema<TTable>[Column<TTable>]>>;
  where?: ConditionExpression<TTable>;
};

type AssignmentFragments<
  TTable extends Table<string, any>,
  S extends Partial<Record<Column<TTable>, any>>
> = {
  [K in keyof S & string]: `${K} = ${Quote<S[K]>}`;
};

type AssignmentUnion<
  TTable extends Table<string, any>,
  S extends Partial<Record<Column<TTable>, any>>
> = AssignmentFragments<TTable, S>[keyof S & string];

type Permutation<T, K = T> = [T] extends [never]
  ? []
  : K extends K
  ? [K, ...Permutation<Exclude<T, K>>]
  : never;

type SetPart<
  TTable extends Table<string, any>,
  S extends Partial<Record<Column<TTable>, any>>
> = AssignmentUnion<TTable, S> extends infer Fragments extends string
  ? [Fragments] extends [never]
    ? never
    : Permutation<Fragments> extends infer Seq
    ? Seq extends readonly string[]
      ? Join<Seq, ", ">
      : never
    : never
  : never;

/** String-literal UPDATE statement constrained by the table schema. */
export type Update<
  TTable extends Table<string, any>,
  Opts extends UpdateOptions<TTable>
> = `UPDATE ${TableName<TTable>} SET ${SetPart<TTable, Opts["set"]>}${WherePart<
  Opts["where"]
>}`;
