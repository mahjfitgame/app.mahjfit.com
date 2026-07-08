#!/usr/bin/env node

/**
 * Generate a private development CA and a server certificate for localhost/LAN.
 *
 * Change only PROJECT_CERTIFICATE_NAME for each project.
 *
 * Example:
 *   PROJECT_CERTIFICATE_NAME = 'BFW API'
 *
 * This will generate:
 *   bfw-api-localhost-ca-key.pem
 *   bfw-api-localhost-ca.crt
 *
 * Examples:
 *   node tools/openssl-localhost.mjs
 *   node tools/openssl-localhost.mjs --hosts api.test,192.168.1.230 --no-install
 *
 * A certificate is trusted only on machines where the generated CA .crt file is
 * installed as a trusted root. Generating or trusting it on the API server
 * cannot modify browsers/API clients on other LAN computers.
 */
import { execFileSync } from 'node:child_process';
import {
  chmodSync,
  existsSync,
  mkdirSync,
  renameSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { isIP } from 'node:net';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * Change this one value per project.
 *
 * Examples:
 *   'BFW API'       -> bfw-api-
 *   'Mahjfit API'   -> mahjfit-api-
 *   'Shared App'    -> shared-app-
 *
 * You can also override without editing:
 *   SSL_CERTIFICATE_NAME="Mahjfit API" node tools/openssl-localhost.mjs
 */
const PROJECT_CERTIFICATE_NAME =
  process.env.SSL_CERTIFICATE_NAME?.trim() || 'BFW PWA';

function normalizeProjectDisplayName(value) {
  const displayName = String(value || '').trim().replace(/\s+/g, ' ');

  if (!displayName) {
    throw new Error('PROJECT_CERTIFICATE_NAME cannot be empty.');
  }

  return displayName;
}

function toKebabCase(value) {
  return normalizeProjectDisplayName(value)
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

const projectDisplayName = normalizeProjectDisplayName(PROJECT_CERTIFICATE_NAME);
const projectSlug = toKebabCase(projectDisplayName);
const projectFilePrefix = `${projectSlug}-`;

const projectDirectory = join(dirname(fileURLToPath(import.meta.url)), '..');

const sslDirectory = resolve(
  projectDirectory,
  process.env.SSL_DIRECTORY ?? 'ssl',
);

/**
 * Dynamic CA names.
 *
 * For PROJECT_CERTIFICATE_NAME = 'BFW API':
 *   bfw-api-localhost-ca-key.pem
 *   bfw-api-localhost-ca.crt
 *   bfw-api-localhost-ca.srl
 */
const rootCaKey = join(
  sslDirectory,
  `${projectFilePrefix}localhost-ca-key.pem`,
);

const rootCaCertificate = join(
  sslDirectory,
  `${projectFilePrefix}localhost-ca.crt`,
);

const rootCaSerial = join(
  sslDirectory,
  `${projectFilePrefix}localhost-ca.srl`,
);

/**
 * Server certificate files.
 *
 * Keeping these names unchanged avoids breaking your existing NestJS/Angular
 * SSL config if it already reads localhost-key.pem and localhost-crt.pem.
 */
const localhostKey = join(sslDirectory, 'localhost-key.pem');
const localhostCsr = join(sslDirectory, 'localhost.csr');
const localhostExtensions = join(sslDirectory, 'localhost.ext');
const localhostCertificate = join(sslDirectory, 'localhost-crt.pem');

/**
 * Old legacy names from your earlier script.
 * These are migrated only when the new dynamic CA does not already exist.
 */
const legacyRootCaKey = join(sslDirectory, 'myLocalCA.key');
const legacyRootCaCertificate = join(sslDirectory, 'myLocalCA.pem');
const legacyRootCaCrt = join(sslDirectory, 'myLocalCA.crt');
const legacyLocalhostCertificate = join(sslDirectory, 'localhost.pem');

function run(command, args, options = {}) {
  execFileSync(command, args, {
    cwd: projectDirectory,
    stdio: 'inherit',
    ...options,
  });
}

function usage() {
  console.log(`Usage: node tools/openssl-localhost.mjs [options]

Project certificate name:
  ${projectDisplayName}

Generated CA file prefix:
  ${projectFilePrefix}

Options:
  --hosts <list>  Add comma-separated DNS names/IPs to the defaults.
                  Defaults always include localhost, loopback, 0.0.0.0, and
                  every address from 192.168.0.0 through 192.168.0.255.
  --install       Install the CA on this machine (default).
  --no-install    Generate files without changing this machine's trust store.
  --help          Show this help.

Important: copy ssl/${projectFilePrefix}localhost-ca.crt to every LAN client and install it in that
client's Trusted Root Certification Authorities store. Never copy/share
ssl/${projectFilePrefix}localhost-ca-key.pem.`);
}

function parseArguments(argv) {
  let install = true;
  let hosts;

  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];

    if (argument === '--help') {
      usage();
      process.exit(0);
    } else if (argument === '--install') {
      install = true;
    } else if (argument === '--no-install') {
      install = false;
    } else if (argument === '--hosts') {
      hosts = argv[index + 1];
      index += 1;

      if (!hosts) {
        throw new Error('--hosts requires a comma-separated value.');
      }
    } else {
      throw new Error(`Unknown option: ${argument}`);
    }
  }

  return { install, hosts };
}

function defaultHosts() {
  const hosts = ['localhost', '127.0.0.1', '::1', '0.0.0.0'];

  for (let lastOctet = 0; lastOctet <= 255; lastOctet += 1) {
    hosts.push(`192.168.0.${lastOctet}`);
  }

  return hosts;
}

function validateHosts(value) {
  const hosts = [
    ...new Set(
      [...defaultHosts(), ...(value ? value.split(',') : [])]
        .map((host) => host.trim())
        .filter(Boolean),
    ),
  ];

  const validDnsName =
    /^(?=.{1,253}$)(?!-)(?:[a-zA-Z0-9-]{1,63}\.)*[a-zA-Z0-9-]{1,63}$/;

  if (hosts.length === 0) {
    throw new Error('At least one host is required.');
  }

  for (const host of hosts) {
    if (!isIP(host) && !validDnsName.test(host)) {
      throw new Error(`Invalid DNS name or IP address: ${host}`);
    }
  }

  return hosts;
}

function installTrustRoot() {
  console.log("\nInstalling the CA in this machine's trust store...");

  switch (process.platform) {
    case 'darwin':
      run('sudo', [
        'security',
        'add-trusted-cert',
        '-d',
        '-r',
        'trustRoot',
        '-k',
        '/Library/Keychains/System.keychain',
        rootCaCertificate,
      ]);
      break;

    case 'linux':
      run('sudo', [
        'cp',
        rootCaCertificate,
        `/usr/local/share/ca-certificates/${projectSlug}-local-development-ca.crt`,
      ]);
      run('sudo', ['update-ca-certificates']);
      break;

    case 'win32':
      run('powershell.exe', [
        '-NoProfile',
        '-Command',
        `Start-Process powershell -Verb RunAs -Wait -ArgumentList @('-NoProfile', '-Command', 'Import-Certificate -FilePath ''${rootCaCertificate.replaceAll("'", "''")}'' -CertStoreLocation Cert:\\LocalMachine\\Root')`,
      ]);
      break;

    default:
      console.warn(`Unsupported OS. Install ${rootCaCertificate} manually.`);
  }
}

function migrateLegacyCaNames() {
  const hasNewCa = existsSync(rootCaKey) || existsSync(rootCaCertificate);
  const hasLegacyKey = existsSync(legacyRootCaKey);
  const hasLegacyCertificate = existsSync(legacyRootCaCertificate);

  if (hasNewCa || (!hasLegacyKey && !hasLegacyCertificate)) {
    return;
  }

  if (hasLegacyKey !== hasLegacyCertificate) {
    throw new Error(
      `Incomplete legacy CA in ${sslDirectory}. Both myLocalCA.key and myLocalCA.pem are required for automatic migration.`,
    );
  }

  console.log(
    `Migrating existing legacy CA files to ${projectFilePrefix} naming convention...`,
  );

  renameSync(legacyRootCaKey, rootCaKey);
  renameSync(legacyRootCaCertificate, rootCaCertificate);
  rmSync(legacyRootCaCrt, { force: true });
}

function writeClientInstructions(hosts) {
  const additionalHosts = hosts.filter(
    (host) => !defaultHosts().includes(host),
  );

  writeFileSync(
    join(sslDirectory, 'INSTALL-CA-ON-LAN-CLIENTS.txt'),
    `${projectDisplayName} local HTTPS certificate
${'='.repeat(projectDisplayName.length + 30)}

Project certificate name:
  ${projectDisplayName}

Generated file prefix:
  ${projectFilePrefix}

This one server certificate is valid for:
- localhost
- 127.0.0.1 and ::1
- 0.0.0.0
- every IP from 192.168.0.0 through 192.168.0.255
${additionalHosts.map((host) => `- ${host}\n`).join('')}

Every computer/device that calls this API must trust ${projectFilePrefix}localhost-ca.crt.
Certificate generation on the server alone cannot make LAN clients trust it.

FILES
-----
${projectFilePrefix}localhost-ca-key.pem
  The CA private key. It signs server certificates. Keep it secret on the
  server and NEVER copy it to clients.

${projectFilePrefix}localhost-ca.crt
  The CA public certificate. It is PEM-encoded even though its filename ends
  in .crt. Copy and install ONLY this file on LAN clients.

localhost-key.pem
  The API server private key. NestJS uses it as the HTTPS "key". Keep it secret.

localhost-crt.pem
  The API server public certificate. NestJS sends it to HTTPS clients as the
  HTTPS "cert". It contains localhost, loopback, 0.0.0.0, and all
  192.168.0.x SAN entries.

FILE EXTENSIONS
---------------
.pem means PEM text encoding (Base64 with BEGIN/END lines).
.crt means "certificate"; this .crt file is also encoded as PEM text.
The words "-key" and "-crt" in each filename make its purpose explicit.

Windows, run PowerShell as Administrator:
  Import-Certificate -FilePath .\\${projectFilePrefix}localhost-ca.crt -CertStoreLocation Cert:\\LocalMachine\\Root

macOS:
  sudo security add-trusted-cert -d -r trustRoot -k /Library/Keychains/System.keychain ./${projectFilePrefix}localhost-ca.crt

Ubuntu/Debian:
  sudo cp ./${projectFilePrefix}localhost-ca.crt /usr/local/share/ca-certificates/${projectSlug}-local-development-ca.crt
  sudo update-ca-certificates

Firefox may use its own certificate store. Import ${projectFilePrefix}localhost-ca.crt under:
  Settings > Privacy & Security > Certificates > View Certificates >
  Authorities > Import, then allow it to identify websites.

Node.js clients, when system trust is unavailable:
  NODE_EXTRA_CA_CERTS=/absolute/path/to/${projectFilePrefix}localhost-ca.crt node your-client.js

After installation, fully restart the browser/client.

SECURITY: distribute only ${projectFilePrefix}localhost-ca.crt. Never share private key files.
`,
  );
}

const { install, hosts: hostsArgument } = parseArguments(process.argv.slice(2));
const hosts = validateHosts(hostsArgument);

mkdirSync(sslDirectory, { recursive: true });
migrateLegacyCaNames();

for (const oldFile of [
  localhostKey,
  localhostCertificate,
  legacyLocalhostCertificate,
  localhostCsr,
  localhostExtensions,
  rootCaSerial,
]) {
  rmSync(oldFile, { force: true });
}

console.log(`Project certificate name: ${projectDisplayName}`);
console.log(`Generated CA file prefix: ${projectFilePrefix}`);
console.log(`Generating a certificate for: ${hosts.join(', ')}`);

if (existsSync(rootCaKey) !== existsSync(rootCaCertificate)) {
  throw new Error(
    `Incomplete CA in ${sslDirectory}. Restore both ${projectFilePrefix}localhost-ca-key.pem and ${projectFilePrefix}localhost-ca.crt, or remove both to generate a new CA.`,
  );
}

if (!existsSync(rootCaKey)) {
  console.log('1. Generating an unencrypted private root CA key...');

  run('openssl', ['genrsa', '-out', rootCaKey, '3072']);

  console.log('2. Generating the root CA certificate...');

  run('openssl', [
    'req',
    '-x509',
    '-new',
    '-key',
    rootCaKey,
    '-sha256',
    '-days',
    '3650',
    '-out',
    rootCaCertificate,
    '-subj',
    `/CN=${projectDisplayName} Local Development CA/O=${projectDisplayName} Development`,
    '-addext',
    'basicConstraints=critical,CA:TRUE,pathlen:0',
    '-addext',
    'keyUsage=critical,keyCertSign,cRLSign',
    '-addext',
    'subjectKeyIdentifier=hash',
  ]);
} else {
  console.log(
    '1-2. Reusing the existing CA so current LAN trust remains valid.',
  );
}

chmodSync(rootCaKey, 0o600);

console.log('3. Generating the HTTPS server key and CSR...');

run('openssl', ['genrsa', '-out', localhostKey, '2048']);
chmodSync(localhostKey, 0o600);

run('openssl', [
  'req',
  '-new',
  '-key',
  localhostKey,
  '-out',
  localhostCsr,
  '-subj',
  `/CN=${hosts[0]}/O=${projectDisplayName} Development`,
]);

const dnsHosts = hosts.filter((host) => !isIP(host));
const ipHosts = hosts.filter((host) => isIP(host));

writeFileSync(
  localhostExtensions,
  `authorityKeyIdentifier=keyid,issuer
basicConstraints=critical,CA:FALSE
keyUsage=critical,digitalSignature,keyEncipherment
extendedKeyUsage=serverAuth
subjectAltName=@alt_names

[alt_names]
${dnsHosts.map((host, index) => `DNS.${index + 1}=${host}`).join('\n')}
${ipHosts.map((host, index) => `IP.${index + 1}=${host}`).join('\n')}
`,
);

console.log('4. Signing the HTTPS server certificate...');

run('openssl', [
  'x509',
  '-req',
  '-in',
  localhostCsr,
  '-CA',
  rootCaCertificate,
  '-CAkey',
  rootCaKey,
  '-CAcreateserial',
  '-out',
  localhostCertificate,
  '-days',
  '825',
  '-sha256',
  '-extfile',
  localhostExtensions,
]);

for (const temporaryFile of [localhostCsr, localhostExtensions, rootCaSerial]) {
  rmSync(temporaryFile, { force: true });
}

writeClientInstructions(hosts);

console.log(`\nCertificates generated in ${sslDirectory}`);

if (install) {
  installTrustRoot();
}

console.log(`
LAN CLIENT ACTION REQUIRED
Copy ONLY ${rootCaCertificate} to every client and install it as a trusted root.
See ${join(sslDirectory, 'INSTALL-CA-ON-LAN-CLIENTS.txt')}.
Never distribute ${rootCaKey}.
Fully restart browsers and API clients after installing the CA.`);