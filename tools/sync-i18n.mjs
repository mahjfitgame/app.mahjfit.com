// file: ./tools/sync-i18n.mjs
import fs from 'node:fs/promises';
import path from 'node:path';

const PROJECT_ROOT = process.cwd();

const SOURCE_ROOTS = [
    'src/lang',
    'src/app/area',
    'src/app/base',
    'src/app/module',
    'libs/src',
];

const GLOBAL_I18N_DIRS = [
    'src/lang/i18n'
];

const PUBLIC_DIR = 'public';
const PUBLIC_URL_ROOT = 'i18n-runtime';
const PUBLIC_OUTPUT_ROOT = `${PUBLIC_DIR}/${PUBLIC_URL_ROOT}`;

const REGISTRY_FILE = path.join(
    PROJECT_ROOT,
    PUBLIC_OUTPUT_ROOT,
    'registry.json'
);

const LANG_FILE_REGEX = /^[a-z]{2}(-[A-Z]{2})?\.json$/;

async function exists(filePath) {
    try {
        await fs.access(filePath);
        return true;
    } catch {
        return false;
    }
}

function toPosixPath(value) {
    return value.split(path.sep).join('/');
}

function removeLeadingSourcePrefix(value) {
    const posix = toPosixPath(value);

    if (posix.startsWith('src/app/')) {
        return posix.replace('src/app/', 'app/');
    }

    if (posix.startsWith('libs/src/')) {
        return posix.replace('libs/src/', 'libs/');
    }

    return posix;
}

function moduleKeyFromOutputPath(outputModulePath) {
    return outputModulePath
        .replace(/\//g, '.')
        .replace(/[^a-zA-Z0-9_.-]/g, '-');
}

async function findI18nDirs(dir, result = []) {
    if (!(await exists(dir))) {
        return result;
    }

    const entries = await fs.readdir(dir, {
        withFileTypes: true
    });

    let index = 0;
    const len = entries.length;

    while (index < len) {
        const entry = entries[index];
        index++;

        const fullPath = path.join(dir, entry.name);

        if (!entry.isDirectory()) {
            continue;
        }

        if (
            entry.name === 'node_modules' ||
            entry.name === '.angular' ||
            entry.name === 'dist' ||
            entry.name === '.git'
        ) {
            continue;
        }

        if (entry.name === 'i18n') {
            result.push(fullPath);
            continue;
        }

        await findI18nDirs(fullPath, result);
    }

    return result;
}

async function cleanOutput() {
    const outputPath = path.join(PROJECT_ROOT, PUBLIC_OUTPUT_ROOT);

    await fs.rm(outputPath, {
        recursive: true,
        force: true
    });

    await fs.mkdir(outputPath, {
        recursive: true
    });
}

async function copyI18nDir(i18nDir) {
    const files = await fs.readdir(i18nDir, {
        withFileTypes: true
    });

    const langFiles = files
        .filter((file) => file.isFile())
        .filter((file) => LANG_FILE_REGEX.test(file.name));

    if (langFiles.length === 0) {
        return null;
    }

    const moduleSourcePath = path.dirname(i18nDir);
    const relativeModulePath = path.relative(PROJECT_ROOT, moduleSourcePath);
    const outputModulePath = removeLeadingSourcePrefix(relativeModulePath);

    const outputDir = path.join(
        PROJECT_ROOT,
        PUBLIC_OUTPUT_ROOT,
        outputModulePath
    );

    await fs.mkdir(outputDir, {
        recursive: true
    });

    const langs = [];

    let index = 0;
    const len = langFiles.length;

    while (index < len) {
        const file = langFiles[index];
        index++;

        const sourceFile = path.join(i18nDir, file.name);
        const outputFile = path.join(outputDir, file.name);

        await fs.copyFile(sourceFile, outputFile);

        langs.push(file.name.replace('.json', ''));
    }

    const relativeI18nDir = toPosixPath(path.relative(PROJECT_ROOT, i18nDir));
    const isGlobal = GLOBAL_I18N_DIRS.includes(relativeI18nDir);

    const publicPath = `/${toPosixPath(path.join(PUBLIC_URL_ROOT, outputModulePath))}`;

    return {
        key: isGlobal ? 'global' : moduleKeyFromOutputPath(outputModulePath),
        source: relativeI18nDir,
        path: publicPath,
        langs: langs.sort(),
        global: isGlobal
    };
}

async function main() {
    await cleanOutput();

    const allI18nDirs = [];

    let rootIndex = 0;
    const rootLen = SOURCE_ROOTS.length;

    while (rootIndex < rootLen) {
        const root = SOURCE_ROOTS[rootIndex];
        rootIndex++;

        const fullRoot = path.join(PROJECT_ROOT, root);
        const dirs = await findI18nDirs(fullRoot);

        allI18nDirs.push(...dirs);
    }

    const uniqueDirs = Array.from(new Set(allI18nDirs));

    const registry = [];

    let index = 0;
    const len = uniqueDirs.length;

    while (index < len) {
        const i18nDir = uniqueDirs[index];
        index++;

        const item = await copyI18nDir(i18nDir);

        if (item) {
            registry.push(item);
        }
    }

    registry.sort((a, b) => {
        if (a.global && !b.global) {
            return -1;
        }

        if (!a.global && b.global) {
            return 1;
        }

        return a.key.localeCompare(b.key);
    });

    await fs.writeFile(
        REGISTRY_FILE,
        JSON.stringify(
            {
                generated_at: new Date().toISOString(),
                items: registry
            },
            null,
            2
        ),
        'utf8'
    );

    console.log(`i18n synced: ${registry.length} module(s)`);
    console.log(`registry: ${toPosixPath(path.relative(PROJECT_ROOT, REGISTRY_FILE))}`);
}

main().catch((error) => {
    console.error(error);
    process.exit(1);
});