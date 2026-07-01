const fs = require('fs');
const path = require('path');

const libInstruction = fs.readFileSync(path.join(__dirname, '../docs/agents/librarian-instruction.md'), 'utf8');
const oracleInstruction = fs.readFileSync(path.join(__dirname, '../docs/agents/oracle-instruction.md'), 'utf8');

const librarianConfig = {
  "name": "librarian",
  "description": "Processes new knowledge: extracts insights, tags content, discovers connections between notes, and generates summaries.",
  "instruction": libInstruction,
  "toolsets": ["POD", "WORKSPACE_CLI"],
  "visibility": "POD",
  "permissions": {
    "grants": [
      {
        "resource_type": "datastore_table",
        "resource_name": "notes",
        "permission_ids": ["datastore.record.read", "datastore.record.write", "datastore.table.read"]
      },
      {
        "resource_type": "datastore_table",
        "resource_name": "connections",
        "permission_ids": ["datastore.record.read", "datastore.record.write", "datastore.table.read"]
      },
      {
        "resource_type": "datastore_table",
        "resource_name": "insights",
        "permission_ids": ["datastore.record.read", "datastore.record.write", "datastore.table.read"]
      },
      {
        "resource_type": "datastore_table",
        "resource_name": "tasks",
        "permission_ids": ["datastore.record.read", "datastore.record.write", "datastore.table.read"]
      },
      {
        "resource_type": "folder",
        "resource_name": "/knowledge",
        "permission_ids": ["folder.read"]
      }
    ]
  }
};

const oracleConfig = {
  "name": "oracle",
  "description": "Retrieval and reasoning agent: answers questions from the knowledge base, surfaces forgotten context, and helps turn knowledge into tasks, drafts, or decisions.",
  "instruction": oracleInstruction,
  "toolsets": ["POD", "WEB_SEARCH", "WORKSPACE_CLI"],
  "visibility": "POD",
  "permissions": {
    "grants": [
      {
        "resource_type": "datastore_table",
        "resource_name": "notes",
        "permission_ids": ["datastore.record.read", "datastore.table.read"]
      },
      {
        "resource_type": "datastore_table",
        "resource_name": "connections",
        "permission_ids": ["datastore.record.read", "datastore.table.read"]
      },
      {
        "resource_type": "datastore_table",
        "resource_name": "insights",
        "permission_ids": ["datastore.record.read", "datastore.table.read"]
      },
      {
        "resource_type": "datastore_table",
        "resource_name": "tasks",
        "permission_ids": ["datastore.record.read", "datastore.record.write", "datastore.table.read"]
      },
      {
        "resource_type": "folder",
        "resource_name": "/knowledge",
        "permission_ids": ["folder.read"]
      }
    ]
  }
};

fs.writeFileSync(path.join(__dirname, '../lemma_schemas/librarian.json'), JSON.stringify(librarianConfig, null, 2));
fs.writeFileSync(path.join(__dirname, '../lemma_schemas/oracle.json'), JSON.stringify(oracleConfig, null, 2));
console.log("Successfully generated agent JSON files with inlined instructions!");
