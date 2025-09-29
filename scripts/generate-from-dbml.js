#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { Parser } = require('@dbml/core');

/**
 * DBML to Drizzle ORM schema generator
 * Dynamically reads schema.dbml and generates Drizzle schema and TypeScript types
 */

// DBML type to Drizzle type mapping
const typeMapping = {
  'serial': 'serial',
  'integer': 'integer',
  'int': 'integer',
  'text': 'text',
  'varchar': 'varchar',
  'date': 'date',
  'timestamp': 'timestamp',
  'boolean': 'boolean',
  'bool': 'boolean',
  'jsonb': 'jsonb',
  'json': 'jsonb'
};

// DBML type to TypeScript type mapping
const tsTypeMapping = {
  'serial': 'number',
  'integer': 'number',
  'int': 'number',
  'text': 'string',
  'varchar': 'string',
  'date': 'string',
  'timestamp': 'string',
  'boolean': 'boolean',
  'bool': 'boolean',
  'jsonb': 'Record<string, any>',
  'json': 'Record<string, any>'
};

// Generate Drizzle column definition
function generateDrizzleColumn(field) {
  const { name, type, pk, not_null, dbdefault } = field;
  const typeName = type.type_name.toLowerCase();

  let drizzleType = 'text';
  let columnDef;

  // Handle varchar with length
  if (typeName.startsWith('varchar')) {
    if (type.args) {
      columnDef = `varchar('${name}', { length: ${type.args} })`;
    } else {
      columnDef = `text('${name}')`;
    }
  } else {
    drizzleType = typeMapping[typeName] || 'text';
    columnDef = `${drizzleType}('${name}')`;
  }

  // Add constraints
  if (pk) {
    columnDef += '.primaryKey()';
  }

  if (not_null || pk) {
    columnDef += '.notNull()';
  }

  // Handle default values
  if (dbdefault) {
    const defaultValue = dbdefault.value;
    if (defaultValue === 'now()') {
      columnDef += '.defaultNow()';
    } else if (typeof defaultValue === 'boolean') {
      columnDef += `.default(${defaultValue})`;
    } else if (typeof defaultValue === 'object') {
      // JSON default value
      columnDef += `.default(${JSON.stringify(defaultValue)})`;
    } else if (typeof defaultValue === 'string') {
      columnDef += `.default('${defaultValue}')`;
    } else {
      columnDef += `.default(${defaultValue})`;
    }
  }

  return columnDef;
}

// Generate references for foreign keys
function generateReferences(database) {
  const references = new Map();

  if (database.refs) {
    database.refs.forEach(ref => {
      const fromEndpoint = ref.endpoints[0];
      const toEndpoint = ref.endpoints[1];

      if (fromEndpoint.tableName && toEndpoint.tableName) {
        const fromTable = fromEndpoint.tableName;
        const fromField = fromEndpoint.fieldNames[0];
        const toTable = toEndpoint.tableName;
        const toField = toEndpoint.fieldNames[0];

        if (!references.has(fromTable)) {
          references.set(fromTable, []);
        }
        references.get(fromTable).push({
          field: fromField,
          refTable: toTable,
          refField: toField
        });
      }
    });
  }

  return references;
}

// Generate table relations
function generateRelations(database, references) {
  const relations = [];
  const relationsMap = new Map();

  // Build relations from references
  references.forEach((refs, tableName) => {
    refs.forEach(ref => {
      // Many-to-one relation (current table has foreign key)
      if (!relationsMap.has(tableName)) {
        relationsMap.set(tableName, []);
      }
      relationsMap.get(tableName).push({
        name: ref.refTable,
        type: 'one',
        table: ref.refTable,
        fields: [ref.field],
        references: [ref.refField]
      });

      // One-to-many relation (referenced table)
      if (!relationsMap.has(ref.refTable)) {
        relationsMap.set(ref.refTable, []);
      }
      relationsMap.get(ref.refTable).push({
        name: tableName,
        type: 'many',
        table: tableName
      });
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

  return relations;
}

// Generate TypeScript interface from DBML table
function generateTSInterface(table) {
  const tableName = table.name;

  let typeName;
  if (tableName === 'todos') {
    typeName = 'TodoType';
  } else if (tableName === 'audit_logs') {
    typeName = 'AuditLogType';
  } else if (tableName === 'users') {
    typeName = 'UserType';
  } else if (tableName === 'user_apps') {
    typeName = 'UserAppType';
  } else if (tableName === 'user_roles') {
    typeName = 'UserRoleType';
  } else {
    // Convert snake_case to PascalCase
    const pascalCase = tableName.split('_').map(word =>
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join('');
    typeName = `${pascalCase}Type`;
  }

  const fields = table.fields.map(field => {
    const fieldName = field.name;
    const fieldTypeName = field.type.type_name.toLowerCase();
    let tsType;

    if (fieldTypeName.startsWith('varchar')) {
      tsType = 'string';
    } else {
      tsType = tsTypeMapping[fieldTypeName] || 'string';
    }

    // Handle nullable fields
    const isOptional = !field.not_null && !field.pk;
    const nullableSuffix = isOptional ? ' | null' : '';
    const optionalSuffix = isOptional ? '?' : '';

    return `  ${fieldName}${optionalSuffix}: ${tsType}${nullableSuffix};`;
  }).join('\n');

  return `export interface ${typeName} {
${fields}
}`;
}

// Generate CRUD operation types
function generateCRUDTypes(table) {
  const tableName = table.name;

  let baseTypeName;
  if (tableName === 'todos') {
    baseTypeName = 'Todo';
  } else if (tableName === 'audit_logs') {
    baseTypeName = 'AuditLog';
  } else if (tableName === 'users') {
    baseTypeName = 'User';
  } else if (tableName === 'user_apps') {
    baseTypeName = 'UserApp';
  } else if (tableName === 'user_roles') {
    baseTypeName = 'UserRole';
  } else {
    // Convert snake_case to PascalCase
    baseTypeName = tableName.split('_').map(word =>
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join('');
  }

  // Find required fields for create (non-auto, non-default)
  const createFields = table.fields
    .filter(field => !field.pk && field.not_null && !field.dbdefault)
    .map(field => {
      const fieldTypeName = field.type.type_name.toLowerCase();
      let tsType;
      if (fieldTypeName.startsWith('varchar')) {
        tsType = 'string';
      } else {
        tsType = tsTypeMapping[fieldTypeName] || 'string';
      }
      return `  ${field.name}: ${tsType};`;
    });

  // Add optional fields
  const optionalFields = table.fields
    .filter(field => !field.pk && (!field.not_null || field.dbdefault))
    .map(field => {
      const fieldTypeName = field.type.type_name.toLowerCase();
      let tsType;
      if (fieldTypeName.startsWith('varchar')) {
        tsType = 'string';
      } else {
        tsType = tsTypeMapping[fieldTypeName] || 'string';
      }
      return `  ${field.name}?: ${tsType} | null;`;
    });

  let createType = '';
  if (createFields.length > 0 || optionalFields.length > 0) {
    createType = `export interface Create${baseTypeName}Type {
${[...createFields, ...optionalFields].join('\n')}
}`;
  }

  // Update type - all fields optional except id
  const updateFields = table.fields
    .filter(field => !field.pk)
    .map(field => {
      const fieldTypeName = field.type.type_name.toLowerCase();
      let tsType;
      if (fieldTypeName.startsWith('varchar')) {
        tsType = 'string';
      } else {
        tsType = tsTypeMapping[fieldTypeName] || 'string';
      }
      return `  ${field.name}?: ${tsType} | null;`;
    });

  const pkField = table.fields.find(field => field.pk);
  let pkTsType = 'number';
  if (pkField) {
    const pkTypeName = pkField.type.type_name.toLowerCase();
    if (pkTypeName.startsWith('varchar')) {
      pkTsType = 'string';
    } else {
      pkTsType = tsTypeMapping[pkTypeName] || 'number';
    }
  }

  let updateType = '';
  if (updateFields.length > 0 && pkField) {
    updateType = `export interface Update${baseTypeName}Type {
  ${pkField.name}: ${pkTsType};
${updateFields.join('\n')}
}`;
  }

  return { createType, updateType };
}

// Main generation function
function generateDrizzleSchema() {
  try {
    // Read DBML file
    const dbmlPath = path.join(process.cwd(), 'schema.dbml');
    if (!fs.existsSync(dbmlPath)) {
      throw new Error(`DBML file not found: ${dbmlPath}`);
    }

    const dbmlContent = fs.readFileSync(dbmlPath, 'utf8');

    // Parse DBML
    console.log('📖 Parsing DBML file...');
    const database = Parser.parse(dbmlContent, 'dbml');

    if (!database.schemas || database.schemas.length === 0) {
      throw new Error('No schemas found in DBML file');
    }

    const schema = database.schemas[0];
    console.log(`✅ Found ${schema.tables.length} tables in schema`);

    // Generate references map
    const references = generateReferences(schema);

    // Generate imports
    const imports = `import { pgTable, serial, text, date, boolean, timestamp, integer, varchar, jsonb } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';`;

    // Generate table definitions
    const tables = schema.tables.map(table => {
      console.log(`  🔧 Generating table: ${table.name}`);

      const columns = table.fields.map(field => {
        // Check if this field has a reference
        const tableRefs = references.get(table.name) || [];
        const fieldRef = tableRefs.find(ref => ref.field === field.name);

        if (fieldRef) {
          // Generate foreign key column with reference
          const typeName = field.type.type_name.toLowerCase();
          let columnDef;

          if (typeName.startsWith('varchar') && field.type.args) {
            columnDef = `varchar('${field.name}', { length: ${field.type.args} })`;
          } else {
            const drizzleType = typeMapping[typeName] || 'integer';
            columnDef = `${drizzleType}('${field.name}')`;
          }

          if (field.not_null || field.pk) {
            columnDef += '.notNull()';
          }

          columnDef += `.references(() => ${fieldRef.refTable}.${fieldRef.refField})`;

          return `  ${field.name}: ${columnDef},`;
        } else {
          // Generate regular column
          const columnDef = generateDrizzleColumn(field);
          return `  ${field.name}: ${columnDef},`;
        }
      }).join('\n');

      return `export const ${table.name} = pgTable('${table.name}', {
${columns}
});`;
    }).join('\n\n');

    // Generate relations
    const relations = generateRelations(schema, references);

    // Generate Drizzle inferred types with proper naming
    const drizzleTypes = schema.tables.map(table => {
      let typeName;
      if (table.name === 'todos') {
        typeName = 'Todo';
      } else if (table.name === 'audit_logs') {
        typeName = 'AuditLog';
      } else if (table.name === 'users') {
        typeName = 'User';
      } else if (table.name === 'user_apps') {
        typeName = 'UserApp';
      } else if (table.name === 'user_roles') {
        typeName = 'UserRole';
      } else {
        // Convert snake_case to PascalCase
        typeName = table.name.split('_').map(word =>
          word.charAt(0).toUpperCase() + word.slice(1)
        ).join('');
      }

      return [
        `export type ${typeName} = typeof ${table.name}.$inferSelect;`,
        `export type New${typeName} = typeof ${table.name}.$inferInsert;`
      ].join('\n');
    }).join('\n\n');

    // Add composite types based on relations
    let compositeTypes = '';
    if (schema.tables.some(t => t.name === 'todos') && schema.tables.some(t => t.name === 'audit_logs')) {
      compositeTypes += `
export type TodoWithAuditLogs = Todo & {
  auditLogs: AuditLog[];
};`;
    }

    if (schema.tables.some(t => t.name === 'users')) {
      compositeTypes += `
export type UserWithAppsAndRoles = User & {
  apps: UserApp[];
  roles: UserRole[];
};`;
    }

    // Add serialized types for tRPC
    let serializedTypes = '';
    if (schema.tables.some(t => t.name === 'todos')) {
      serializedTypes += `
// Serialized types for tRPC (Date -> string)
export type TodoSerialized = Omit<Todo, 'created_at' | 'updated_at' | 'deleted_at'> & {
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
};`;
    }

    if (schema.tables.some(t => t.name === 'audit_logs')) {
      serializedTypes += `
export type AuditLogSerialized = Omit<AuditLog, 'created_at'> & {
  created_at: string;
};`;
    }

    if (compositeTypes.includes('TodoWithAuditLogs') && serializedTypes.includes('TodoSerialized')) {
      serializedTypes += `
export type TodoWithAuditLogsSerialized = Omit<TodoSerialized, 'auditLogs'> & {
  auditLogs: AuditLogSerialized[];
};`;
    }

    // Combine all parts
    const schemaContent = `${imports}

${tables}

${relations.join('\n\n')}

${drizzleTypes}${compositeTypes}${serializedTypes}
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

function generateTypes() {
  try {
    // Read DBML file
    const dbmlPath = path.join(process.cwd(), 'schema.dbml');
    if (!fs.existsSync(dbmlPath)) {
      throw new Error(`DBML file not found: ${dbmlPath}`);
    }

    const dbmlContent = fs.readFileSync(dbmlPath, 'utf8');

    // Parse DBML
    console.log('📖 Parsing DBML for TypeScript types...');
    const database = Parser.parse(dbmlContent, 'dbml');

    const schema = database.schemas[0];

    // Generate header
    const header = `// Generated types from DBML schema
// This file contains TypeScript type definitions derived from the database schema

`;

    // Generate interfaces for each table
    const interfaces = schema.tables.map(table => {
      console.log(`  🔧 Generating types for table: ${table.name}`);
      return generateTSInterface(table);
    }).join('\n\n');

    // Generate CRUD operation types
    const crudTypes = schema.tables.map(table => {
      const { createType, updateType } = generateCRUDTypes(table);
      return [createType, updateType].filter(Boolean).join('\n\n');
    }).filter(Boolean).join('\n\n');

    // Generate composite types
    let compositeTypes = '\n// Composite types\n';
    if (schema.tables.some(t => t.name === 'todos') && schema.tables.some(t => t.name === 'audit_logs')) {
      compositeTypes += `export interface TodoWithAuditLogsType extends TodoType {
  auditLogs: AuditLogType[];
}

`;
    }

    if (schema.tables.some(t => t.name === 'users')) {
      compositeTypes += `export interface UserWithAppsAndRolesType extends UserType {
  apps: UserAppType[];
  roles: UserRoleType[];
}
`;
    }

    // Combine all parts
    const typesContent = header + interfaces + '\n\n' + crudTypes + compositeTypes;

    // Write types file
    const typesPath = path.join(process.cwd(), 'src', 'lib', 'types-generated.ts');
    fs.writeFileSync(typesPath, typesContent);

    console.log('✅ TypeScript types generated from DBML!');
    console.log(`📝 Output: ${typesPath}`);

  } catch (error) {
    console.error('❌ Error generating types:', error.message);
    process.exit(1);
  }
}

// Main execution
const args = process.argv.slice(2);
const command = args[0] || 'all';

console.log('🚀 DBML Code Generator');
console.log('====================');

switch (command) {
  case 'schema':
    generateDrizzleSchema();
    break;
  case 'types':
    generateTypes();
    break;
  case 'all':
  default:
    generateDrizzleSchema();
    generateTypes();
    break;
}

console.log('🎉 Generation completed!');