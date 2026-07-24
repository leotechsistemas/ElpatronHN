const initSqlJs = require('sql.js');
const fs = require('fs');

async function main() {
  const SQL = await initSqlJs();
  const dbPath = process.argv[2] || 'C:\\Users\\pc\\Desktop\\soluciones\\data\\patron-prod.db';
  const buffer = fs.readFileSync(dbPath);
  const db = new SQL.Database(buffer);

  const tables = [
    { name: 'users', id: 1 },
    { name: 'providers', id: 1 },
    { name: 'products', id: 1 },
    { name: 'clients', id: 1 },
    { name: 'sales', id: 1 },
    { name: 'payments', id: 1 },
    { name: 'interactions', id: 1 },
    { name: 'reminders', id: 1 },
    { name: 'stock_logs', id: 1 },
    { name: 'quotations', id: 1 },
    { name: 'production_tasks', id: 1 },
  ];

  let h2Sql = '-- H2 Data Export (PostgreSQL Compatibility Mode)\n';
  h2Sql += '-- Generated from sql.js: ' + dbPath + '\n\n';

  let pgSql = '-- PostgreSQL Data Export\n';
  pgSql += '-- Generated from sql.js: ' + dbPath + '\n\n';

  for (const { name } of tables) {
    try {
      const result = db.exec('SELECT * FROM ' + name);
      if (result.length === 0 || result[0].values.length === 0) continue;

      const cols = result[0].columns;
      const rows = result[0].values;

      h2Sql += '-- ' + name + ' (' + rows.length + ' rows)\n';
      pgSql += '-- ' + name + ' (' + rows.length + ' rows)\n';

      for (const row of rows) {
        const escaped = row.map(v => {
          if (v === null || v === undefined) return 'NULL';
          if (typeof v === 'number') return v.toString();
          const s = String(v).replace(/'/g, "''");
          return "'" + s + "'";
        });

        const colsList = cols.join(', ');
        const valsList = escaped.join(', ');

        h2Sql += 'INSERT INTO ' + name + ' (' + colsList + ') VALUES (' + valsList + ');\n';
        pgSql += 'INSERT INTO ' + name + ' (' + colsList + ') VALUES (' + valsList + ');\n';
      }
      h2Sql += '\n';
      pgSql += '\n';
    } catch (e) {
      h2Sql += '-- ' + name + ': ERROR - ' + e.message + '\n\n';
      pgSql += '-- ' + name + ': ERROR - ' + e.message + '\n\n';
    }
  }

  const outDir = __dirname;
  fs.writeFileSync(outDir + '\\data-h2.sql', h2Sql);
  fs.writeFileSync(outDir + '\\data-postgres.sql', pgSql);

  console.log('Exportado exitosamente:');
  console.log('  - data-h2.sql (' + h2Sql.length + ' bytes)');
  console.log('  - data-postgres.sql (' + pgSql.length + ' bytes)');
}

main().catch(console.error);
