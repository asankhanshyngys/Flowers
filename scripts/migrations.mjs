import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
export async function applyMigrations(client, directory = new URL('../drizzle/', import.meta.url)) {
  const journal = JSON.parse(await readFile(new URL('meta/_journal.json', directory), 'utf8'));
  for (const entry of journal.entries) {
    const filename = entry.tag + '.sql';
    const sql = await readFile(new URL(filename, directory), 'utf8');
    const checksum = createHash('sha256').update(sql.replace(/\r\n/g, '\n')).digest('hex');
    const tx = await client.transaction('write');
    try {
      const tracked = await tx.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='__flowers_migrations'");
      if (!tracked.rows.length) {
        const existing = await tx.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='products'");
        if (existing.rows.length) throw new Error('Existing unmanaged database detected. Import its migration history before continuing.');
      }
      await tx.execute('CREATE TABLE IF NOT EXISTS __flowers_migrations (name TEXT PRIMARY KEY, checksum TEXT NOT NULL, applied_at TEXT NOT NULL)');
      const previous = await tx.execute({sql: 'SELECT checksum FROM __flowers_migrations WHERE name=?', args: [filename]});
      if (previous.rows.length) {
        if (previous.rows[0].checksum !== checksum) throw new Error(`Applied migration changed: ${filename}`);
      } else {
        for (const statement of sql.split('--> statement-breakpoint').map(s => s.trim()).filter(Boolean)) await tx.execute(statement);
        await tx.execute({sql:'INSERT INTO __flowers_migrations(name,checksum,applied_at) VALUES (?,?,?)', args:[filename,checksum,new Date().toISOString()]});
      }
      await tx.commit();
    } catch (error) { await tx.rollback(); throw error; }
    finally { tx.close(); }
  }
}
