import type { Client, InArgs, ResultSet } from '@libsql/client';
export type QueryResult<T = Record<string, unknown>> = {results: T[]; meta: {changes: number}};
function result<T>(rows: ResultSet): QueryResult<T> {
  return {results: rows.rows.map(row => Object.fromEntries(Object.entries(row))) as T[], meta: {changes: rows.rowsAffected}};
}
export class Statement {
  constructor(readonly client: Client, readonly sql: string, readonly args: InArgs = []) {}
  bind(...args: unknown[]) { return new Statement(this.client, this.sql, args as InArgs); }
  async all<T = Record<string, unknown>>() { return result<T>(await this.client.execute({sql: this.sql, args: this.args})); }
  async run() { return this.all(); }
  async first<T = Record<string, unknown>>() { return (await this.all<T>()).results[0] ?? null; }
}
export class SqlDatabase {
  constructor(readonly client: Client) {}
  prepare(sql: string) { return new Statement(this.client, sql); }
  async batch(statements: Statement[]) {
    return (await this.client.batch(statements.map(s => ({sql: s.sql, args: s.args})), 'write')).map(rows => result(rows));
  }
}
