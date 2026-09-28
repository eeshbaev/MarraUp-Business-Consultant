// A thin compatibility shim over expo-sqlite's sync API, shaped exactly
// like node:sqlite's DatabaseSync (.exec(sql), .prepare(sql).run/get/all
// (...positionalArgs)). This lets db.ts be ported from the web app almost
// verbatim — every query call site (2000+ lines of well-tested CRUD)
// stays byte-for-byte identical; only this file and the getDb() connection
// setup at the top of db.ts differ between the two apps.
import * as SQLite from "expo-sqlite";

export class DatabaseSyncShim {
  private db: SQLite.SQLiteDatabase;

  constructor(dbName: string) {
    this.db = SQLite.openDatabaseSync(dbName);
  }

  exec(sql: string): void {
    this.db.execSync(sql);
  }

  prepare(sql: string) {
    const db = this.db;
    return {
      run(...args: unknown[]) {
        db.runSync(sql, args as SQLite.SQLiteBindParams);
      },
      get(...args: unknown[]) {
        return db.getFirstSync(sql, args as SQLite.SQLiteBindParams) as Record<string, unknown> | undefined;
      },
      all(...args: unknown[]) {
        return db.getAllSync(sql, args as SQLite.SQLiteBindParams) as Record<string, unknown>[];
      },
    };
  }
}
