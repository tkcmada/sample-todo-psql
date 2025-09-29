#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { Parser } = require('@dbml/core');

/**
 * Lightweight TypeScript types generator from DBML
 * Uses the official @dbml/core parser to generate only TypeScript interfaces
 * SQL generation is handled by the official dbml2sql tool
 *
 * Convention: singular table names map directly to capitalized type names
 * e.g., 'todo' -> 'Todo', 'user_app' -> 'UserApp'
 */

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

// Convert table name to TypeScript interface name by convention
function getTypeName(tableName) {
  return tableName.split('_').map(word =>
    word.charAt(0).toUpperCase() + word.slice(1)
  ).join('') + 'Type';
}

// Convert table name to base type alias (without 'Type' suffix)
function getBaseTypeName(tableName) {
  return tableName.split('_').map(word =>
    word.charAt(0).toUpperCase() + word.slice(1)
  ).join('');
}

// Convert DBML field type to TypeScript type
function getFieldTsType(field) {
  const dbmlType = field.type?.type_name || field.type || 'text';
  const baseType = String(dbmlType).toLowerCase().split('(')[0]; // Handle varchar(256) -> varchar
  return tsTypeMapping[baseType] || 'string';
}

// Generate TypeScript interface for a table
function generateInterface(table) {
  const typeName = getTypeName(table.name);

  const fields = table.fields.map(field => {
    const tsType = getFieldTsType(field);
    const isOptional = !field.not_null && !field.pk;
    const nullableSuffix = isOptional ? ' | null' : '';
    const optionalSuffix = isOptional ? '?' : '';

    return `  ${field.name}${optionalSuffix}: ${tsType}${nullableSuffix};`;
  }).join('\n');

  return `export interface ${typeName} {
${fields}
}`;
}

// Generate CRUD operation types
function generateCRUDTypes(table) {
  const baseTypeName = getBaseTypeName(table.name);

  // Create type - required fields only
  const createFields = table.fields
    .filter(field => !field.pk && field.not_null && !field.dbdefault)
    .map(field => {
      const tsType = getFieldTsType(field);
      return `  ${field.name}: ${tsType};`;
    });

  // Optional fields for create
  const optionalCreateFields = table.fields
    .filter(field => !field.pk && (!field.not_null || field.dbdefault))
    .map(field => {
      const tsType = getFieldTsType(field);
      return `  ${field.name}?: ${tsType} | null;`;
    });

  const createInterface = `export interface Create${baseTypeName}Type {
${createFields.join('\n')}${createFields.length > 0 && optionalCreateFields.length > 0 ? '\n' : ''}${optionalCreateFields.join('\n')}
}`;

  // Update type - id required, all others optional
  const updateFields = table.fields.map(field => {
    const tsType = getFieldTsType(field);
    if (field.pk) {
      return `  ${field.name}: ${tsType};`;
    } else {
      return `  ${field.name}?: ${tsType} | null;`;
    }
  });

  const updateInterface = `export interface Update${baseTypeName}Type {
${updateFields.join('\n')}
}`;

  return [createInterface, updateInterface];
}

// Composite types are defined manually in separate schema files

// Generate basic type aliases
function generateTypeAliases(tables) {
  const aliases = [];

  aliases.push('// Basic type aliases for compatibility');

  tables.forEach(table => {
    const baseTypeName = getBaseTypeName(table.name);
    const typeName = getTypeName(table.name);
    aliases.push(`export type ${baseTypeName} = ${typeName};`);
    aliases.push(`export type New${baseTypeName} = Create${baseTypeName}Type;`);
  });

  return aliases;
}

// Main generation function
function generateTypesFromDBML() {
  try {
    console.log('🚀 DBML TypeScript Types Generator (Convention-Based)');
    console.log('=====================================================');

    const dbmlPath = path.join(process.cwd(), 'schema.dbml');
    const outputPath = path.join(process.cwd(), 'src', 'lib', 'types-generated.ts');

    console.log('📖 Parsing DBML file for TypeScript types...');
    const dbmlContent = fs.readFileSync(dbmlPath, 'utf-8');
    const database = Parser.parse(dbmlContent, 'dbml');
    const schema = database.schemas[0];

    console.log(`✅ Found ${schema.tables.length} tables to generate types for`);

    const interfaces = [];
    const crudTypes = [];
    let totalInterfaces = 0;

    // Generate base interfaces and CRUD types
    schema.tables.forEach(table => {
      console.log(`  🔧 Generating interface for table: ${table.name}`);
      interfaces.push(generateInterface(table));
      crudTypes.push(...generateCRUDTypes(table));
      totalInterfaces++;
    });

    // Generate type aliases
    const typeAliases = generateTypeAliases(schema.tables);

    // Combine all generated code
    const output = [
      '// Generated TypeScript types from DBML schema',
      '// This file is auto-generated from schema.dbml using the official @dbml/core parser',
      '// Do not edit this file directly - edit schema.dbml instead',
      '',
      ...interfaces,
      '',
      '// CRUD Operation Types',
      ...crudTypes,
      '',
      ...typeAliases,
      ''
    ].join('\n');

    fs.writeFileSync(outputPath, output);

    console.log('✅ TypeScript types generated from DBML!');
    console.log(`📝 Output: ${outputPath}`);
    console.log(`📊 Generated ${totalInterfaces} interfaces, ${crudTypes.length} CRUD types`);
    console.log('🎉 Type generation completed!');

  } catch (error) {
    console.error('❌ Error generating types:', error.message);
    process.exit(1);
  }
}

// Run the generator
if (require.main === module) {
  generateTypesFromDBML();
}

module.exports = { generateTypesFromDBML };