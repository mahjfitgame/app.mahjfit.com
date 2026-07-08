// file: tools/migration/upgrade.ts

/// <reference types="node" />

import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const ROOT_DIR = process.cwd();

const DRIZZLE_DIR = path.join(ROOT_DIR, 'drizzle');
const CONFIG_FILE = path.join(ROOT_DIR, 'drizzle.config.ts');

const OUTPUT_FILE = path.join(ROOT_DIR, 'public', 'db', 'upgrade.up.sql');

function ensureDir(dir: string): void {
  fs.mkdirSync(dir, { recursive: true });
}

function findSqlFiles(dir: string): string[] {
  const found: string[] = [];

  function walk(currentDir: string): void {
    const items = fs.readdirSync(currentDir);

    for (const item of items) {
      const fullPath = path.join(currentDir, item);
      const stat = fs.statSync(fullPath);

      if (stat.isDirectory()) {
        walk(fullPath);
        continue;
      }

      if (item.endsWith('.sql')) {
        found.push(fullPath);
      }
    }
  }

  if (fs.existsSync(dir)) {
    walk(dir);
  }

  found.sort();
  return found;
}

function getNewestFile(files: string[]): string | undefined {
  let newestFile: string | undefined;
  let newestTime = 0;

  for (const file of files) {
    const stat = fs.statSync(file);

    if (stat.mtimeMs > newestTime) {
      newestTime = stat.mtimeMs;
      newestFile = file;
    }
  }

  return newestFile;
}

function buildUpgradeSql(sqlFile: string): string {
  const relative = path.relative(ROOT_DIR, sqlFile);
  const sql = fs.readFileSync(sqlFile, 'utf8').trim();

  return [
    '-- --------------------------------------------------',
    '-- Auto-generated SQLite upgrade SQL',
    '-- Source: latest Drizzle migration',
    `-- Migration: ${relative}`,
    '-- Do not edit manually',
    '-- --------------------------------------------------',
    '',
    sql,
    '',
  ].join('\n');
}

function main(): void {
  ensureDir(path.dirname(OUTPUT_FILE));

  const beforeFiles = new Set(findSqlFiles(DRIZZLE_DIR));

  execFileSync(
    process.platform === 'win32' ? 'npx.cmd' : 'npx',
    [
      'drizzle-kit',
      'generate',
      '--config',
      CONFIG_FILE,
    ],
    {
      cwd: ROOT_DIR,
      stdio: 'inherit',
    },
  );

  const afterFiles = findSqlFiles(DRIZZLE_DIR);
  const newFiles = afterFiles.filter((file) => !beforeFiles.has(file));

  if (newFiles.length === 0) {
    fs.writeFileSync(
      OUTPUT_FILE,
      [
        '-- --------------------------------------------------',
        '-- No schema upgrade generated',
        '-- Drizzle detected no schema changes',
        '-- --------------------------------------------------',
        '',
      ].join('\n'),
      'utf8',
    );

    console.log(`No changes. Created empty upgrade file: ${path.relative(ROOT_DIR, OUTPUT_FILE)}`);
    return;
  }

  const newestMigration = getNewestFile(newFiles);

  if (!newestMigration) {
    throw new Error('Drizzle generated files, but no newest migration could be detected.');
  }

  const upgradeSql = buildUpgradeSql(newestMigration);

  fs.writeFileSync(OUTPUT_FILE, upgradeSql, 'utf8');

  console.log(`Created: ${path.relative(ROOT_DIR, OUTPUT_FILE)}`);
  console.log(`From: ${path.relative(ROOT_DIR, newestMigration)}`);
}

main();