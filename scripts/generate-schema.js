#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { Parser } = require('@dbml/core');

/**
 * DBML to Drizzle ORM schema generator
 * Converts DBML schema to TypeScript Drizzle schema
 */

// DBML type to Drizzle type mapping
const typeMapping = {
  'serial': 'serial',
  'integer': 'integer',
  'text': 'text',
  'varchar': 'varchar',
  'date': 'date',
  'timestamp': 'timestamp',
  'boolean': 'boolean',
  'jsonb': 'jsonb'
};

// Generate Drizzle column definition
function generateColumn(column) {
  const { name, type, settings } = column;

  let drizzleType = typeMapping[type.type_name] || type.type_name;
  let columnDef = `${drizzleType}('${name}'`;

  // Handle varchar with length
  if (type.type_name === 'varchar' && type.args && type.args[0]) {
    columnDef = `varchar('${name}', { length: ${type.args[0]} }`;
  }

  columnDef += ')';

  // Add constraints
  if (settings.pk) {
    columnDef += '.primaryKey()';
  }

  if (settings.not_null) {
    columnDef += '.notNull()';
  }

  if (settings.hasOwnProperty('default')) {
    const defaultValue = settings.default;
    if (defaultValue === 'now()') {
      columnDef += '.defaultNow()';
    } else if (defaultValue === false || defaultValue === true) {
      columnDef += `.default(${defaultValue})`;
    } else if (typeof defaultValue === 'string') {
      if (defaultValue.startsWith('{') && defaultValue.endsWith('}')) {
        // JSON default value
        columnDef += `.default(${defaultValue})`;
      } else {
        columnDef += `.default('${defaultValue}')`;
      }
    } else {
      columnDef += `.default(${defaultValue})`;
    }
  }

  return columnDef;
}

// Generate references for foreign keys
function generateReferences(tables) {
  const references = [];

  tables.forEach(table => {
    table.fields.forEach(column => {
      if (column.type.type_name === 'integer' || column.type.type_name === 'varchar') {
        // Check if this column has a reference in the DBML
        const refName = `${table.name}.${column.name}`;
        // This is a simplified approach - in a real implementation, you'd parse the refs from DBML
      }
    });
  });

  return references;
}

// Generate table relations
function generateRelations(database) {
  const relations = [];

  // Parse refs from database
  if (database.refs) {
    const relationsMap = new Map();

    database.refs.forEach(ref => {
      const [leftTable, leftField] = ref.endpoints[0].tableName ?
        [ref.endpoints[0].tableName, ref.endpoints[0].fieldNames[0]] :
        [ref.endpoints[1].tableName, ref.endpoints[1].fieldNames[0]];
      const [rightTable, rightField] = ref.endpoints[1].tableName ?
        [ref.endpoints[1].tableName, ref.endpoints[1].fieldNames[0]] :
        [ref.endpoints[0].tableName, ref.endpoints[0].fieldNames[0]];

      // Generate one-to-many relation
      if (!relationsMap.has(rightTable)) {
        relationsMap.set(rightTable, []);
      }
      relationsMap.get(rightTable).push({
        name: leftTable,
        type: 'many',
        table: leftTable
      });

      // Generate many-to-one relation
      if (!relationsMap.has(leftTable)) {
        relationsMap.set(leftTable, []);
      }
      relationsMap.get(leftTable).push({
        name: rightTable,
        type: 'one',
        table: rightTable,
        fields: [leftField],
        references: [rightField]
      });
    });

    // Generate relation code
    relationsMap.forEach((rels, tableName) => {
      const relationsCode = rels.map(rel => {
        if (rel.type === 'many') {
          return `  ${rel.name}: many(${rel.table}),`;
        } else {
          return `  ${rel.name}: one(${rel.table}, {
    fields: [${tableName}.${rel.fields[0]}],
    references: [${rel.table}.${rel.references[0]}],
  }),`;
        }
      }).join('\n');

      relations.push(`export const ${tableName}Relations = relations(${tableName}, ({ one, many }) => ({
${relationsCode}
}));`);
    });
  }

  return relations;
}

// Generate TypeScript types
function generateTypes(tables) {
  const types = [];

  tables.forEach(table => {
    const tableName = table.name;
    const pascalCase = tableName.split('_').map(word =>
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join('');

    types.push(`export type ${pascalCase} = typeof ${tableName}.$inferSelect;`);
    types.push(`export type New${pascalCase} = typeof ${tableName}.$inferInsert;`);
  });

  // Add custom composite types based on relations
  types.push(`
export type TodoWithAuditLogs = Todo & {
  auditLogs: AuditLog[];
};

export type UserWithAppsAndRoles = User & {
  apps: UserApp[];
  roles: UserRole[];
};

// Serialized types for tRPC (Date -> string)
export type TodoSerialized = Omit<Todo, 'created_at' | 'updated_at' | 'deleted_at'> & {
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
};

export type AuditLogSerialized = Omit<AuditLog, 'created_at'> & {
  created_at: string;
};

export type TodoWithAuditLogsSerialized = Omit<TodoSerialized, 'auditLogs'> & {
  auditLogs: AuditLogSerialized[];
};`);

  return types;
}

// Main generation function
function generateDrizzleSchema() {
  try {
    // Read DBML file
    const dbmlPath = path.join(process.cwd(), 'schema.dbml');
    const dbmlContent = fs.readFileSync(dbmlPath, 'utf8');

    // Parse DBML
    const database = Parser.parse(dbmlContent, 'dbml');

    // Generate imports
    const imports = `import { pgTable, serial, text, date, boolean, timestamp, integer, varchar, jsonb } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';`;

    // Generate table definitions
    const tables = database.schemas[0].tables.map(table => {
      const columns = table.fields.map(column => {
        const columnDef = generateColumn(column);
        return `  ${column.name}: ${columnDef},`;
      }).join('\n');

      // Add references for foreign keys
      const references = table.fields
        .filter(field => field.type.type_name === 'integer' && field.name.endsWith('_id'))
        .map(field => {
          const refTableName = field.name.replace('_id', 's');
          if (field.name === 'todo_id') {
            return `  ${field.name}: integer('${field.name}').notNull().references(() => todos.id),`;
          } else if (field.name === 'user_id') {
            return `  ${field.name}: varchar('${field.name}', { length: 256 }).notNull().references(() => users.user_id),`;
          }
          return null;
        })
        .filter(Boolean);

      const allColumns = [...columns.split('\n'), ...references].join('\n');

      return `export const ${table.name} = pgTable('${table.name}', {
${allColumns}
});`;
    }).join('\n\n');

    // Generate relations
    const relations = generateRelations(database.schemas[0]);

    // Generate types
    const types = generateTypes(database.schemas[0].tables);

    // Combine all parts
    const schemaContent = `${imports}

${tables}

${relations.join('\n\n')}

${types.join('\n')}
`;

    // Write to schema file
    const outputPath = path.join(process.cwd(), 'src', 'server', 'db', 'schema.ts');
    fs.writeFileSync(outputPath, schemaContent);

    console.log('✅ Drizzle schema generated successfully from DBML!');
    console.log(`📝 Output: ${outputPath}`);

  } catch (error) {
    console.error('❌ Error generating schema:', error.message);
    process.exit(1);
  }
}

// Run the generator
generateDrizzleSchema();