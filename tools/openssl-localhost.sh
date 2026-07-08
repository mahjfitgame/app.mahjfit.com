#!/usr/bin/env bash

# Create a local certificate authority (CA) and an HTTPS certificate.
#
# Change only PROJECT_CERTIFICATE_NAME for each project.
#
# Example:
#   PROJECT_CERTIFICATE_NAME="BFW API"
#
# This will generate:
#   bfw-api-localhost-ca-key.pem
#   bfw-api-localhost-ca.crt
#
# You can also override without editing:
#   SSL_CERTIFICATE_NAME="Mahjfit API" tools/openssl-localhost.sh
#
# Examples:
#   tools/openssl-localhost.sh
#   tools/openssl-localhost.sh --hosts api.test,192.168.1.230 --no-install
#   PEM pass phrase: opwq@AK56

set -euo pipefail

# -------------------------------------------------------------------
# ONE PROJECT NAME VARIABLE
# -------------------------------------------------------------------
# Set this one value per project.
#
# Examples:
#   "BFW API"      -> bfw-api-
#   "Mahjfit API"  -> mahjfit-api-
#   "Shared App"   -> shared-app-
#
# You can also override this from terminal:
#   SSL_CERTIFICATE_NAME="Mahjfit API" tools/openssl-localhost.sh
PROJECT_CERTIFICATE_NAME="${SSL_CERTIFICATE_NAME:-BFW PWA}"

normalize_project_display_name() {
  local value="$1"

  # Remove leading/trailing spaces and collapse multiple spaces.
  value="$(echo "$value" | sed -E 's/^[[:space:]]+//; s/[[:space:]]+$//; s/[[:space:]]+/ /g')"

  if [[ -z "$value" ]]; then
    echo "PROJECT_CERTIFICATE_NAME cannot be empty." >&2
    exit 1
  fi

  echo "$value"
}

to_kebab_case() {
  local value="$1"

  # Convert:
  #   BFW API -> bfw-api
  #   Mahjfit API -> mahjfit-api
  echo "$value" \
    | tr '[:upper:]' '[:lower:]' \
    | sed -E 's/&/ and /g' \
    | sed -E 's/[^a-z0-9]+/-/g' \
    | sed -E 's/^-+//; s/-+$//'
}

PROJECT_DISPLAY_NAME="$(normalize_project_display_name "$PROJECT_CERTIFICATE_NAME")"
PROJECT_SLUG="$(to_kebab_case "$PROJECT_DISPLAY_NAME")"
PROJECT_FILE_PREFIX="${PROJECT_SLUG}-"

# OpenSSL subject values use "/" as separators, so replacing "/" avoids
# accidentally breaking the subject string. Because apparently even names
# need adult supervision.
PROJECT_SUBJECT_NAME="${PROJECT_DISPLAY_NAME//\//-}"

PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SSL_DIR="${SSL_DIRECTORY:-$PROJECT_DIR/ssl}"
[[ "$SSL_DIR" = /* ]] || SSL_DIR="$PROJECT_DIR/$SSL_DIR"

# -------------------------------------------------------------------
# DYNAMIC CA FILES
# -------------------------------------------------------------------
# For PROJECT_CERTIFICATE_NAME="BFW API":
#   bfw-api-localhost-ca-key.pem
#   bfw-api-localhost-ca.crt
#   bfw-api-localhost-ca.srl
CA_KEY="$SSL_DIR/${PROJECT_FILE_PREFIX}localhost-ca-key.pem"
CA_CERT="$SSL_DIR/${PROJECT_FILE_PREFIX}localhost-ca.crt"
SERIAL_FILE="$SSL_DIR/${PROJECT_FILE_PREFIX}localhost-ca.srl"

# -------------------------------------------------------------------
# SERVER CERTIFICATE FILES
# -------------------------------------------------------------------
# Keeping these unchanged avoids breaking existing NestJS/Angular SSL config.
SERVER_KEY="$SSL_DIR/localhost-key.pem"
SERVER_CERT="$SSL_DIR/localhost-crt.pem"
CSR="$SSL_DIR/localhost.csr"
EXT_FILE="$SSL_DIR/localhost.ext"
INSTRUCTIONS="$SSL_DIR/INSTALL-CA-ON-LAN-CLIENTS.txt"

INSTALL_CA=true
EXTRA_HOSTS=""

usage() {
  cat <<HELP
Usage: tools/openssl-localhost.sh [options]

Project certificate name:
  $PROJECT_DISPLAY_NAME

Generated CA file prefix:
  $PROJECT_FILE_PREFIX

Options:
  --hosts <list>  Add comma-separated DNS names or IP addresses.
  --install       Install the CA on this computer (default).
  --no-install    Generate certificates without installing the CA.
  --help          Show this help.

The certificate always includes localhost, 127.0.0.1, ::1, 0.0.0.0,
and every address from 192.168.0.0 through 192.168.0.255.

Important:
  Copy ssl/${PROJECT_FILE_PREFIX}localhost-ca.crt to every LAN client and
  install it as a trusted root.

Never copy/share:
  ssl/${PROJECT_FILE_PREFIX}localhost-ca-key.pem
HELP
}

while (($# > 0)); do
  case "$1" in
    --hosts)
      [[ $# -ge 2 && -n "$2" ]] || {
        echo "--hosts requires a value" >&2
        exit 1
      }
      EXTRA_HOSTS="$2"
      shift 2
      ;;
    --install)
      INSTALL_CA=true
      shift
      ;;
    --no-install)
      INSTALL_CA=false
      shift
      ;;
    --help)
      usage
      exit 0
      ;;
    *)
      echo "Unknown option: $1" >&2
      usage
      exit 1
      ;;
  esac
done

command -v openssl >/dev/null || {
  echo "OpenSSL is required but was not found." >&2
  exit 1
}

mkdir -p "$SSL_DIR"

rm -f "$SERVER_KEY" "$SERVER_CERT" "$CSR" "$EXT_FILE" "$SERIAL_FILE"

trap 'rm -f "$CSR" "$EXT_FILE" "$SERIAL_FILE"' EXIT

echo "Project certificate name: $PROJECT_DISPLAY_NAME"
echo "Generated CA file prefix: $PROJECT_FILE_PREFIX"

# A CA key and certificate must always be kept together.
if [[ -f "$CA_KEY" && ! -f "$CA_CERT" ]] || [[ ! -f "$CA_KEY" && -f "$CA_CERT" ]]; then
  echo "Incomplete CA in $SSL_DIR." >&2
  echo "Restore both files or remove both files:" >&2
  echo "  $CA_KEY" >&2
  echo "  $CA_CERT" >&2
  exit 1
fi

if [[ ! -f "$CA_KEY" ]]; then
  echo "1. Creating the local CA..."

  openssl genrsa -out "$CA_KEY" 3072

  openssl req -x509 -new -key "$CA_KEY" -sha256 -days 3650 \
    -out "$CA_CERT" \
    -subj "/CN=${PROJECT_SUBJECT_NAME} Local Development CA/O=${PROJECT_SUBJECT_NAME} Development" \
    -addext "basicConstraints=critical,CA:TRUE,pathlen:0" \
    -addext "keyUsage=critical,keyCertSign,cRLSign" \
    -addext "subjectKeyIdentifier=hash"
else
  echo "1. Reusing the existing local CA..."
fi

chmod 600 "$CA_KEY"

# Build the OpenSSL extension file. OpenSSL validates the final values.
cat > "$EXT_FILE" <<'EXTENSIONS'
authorityKeyIdentifier=keyid,issuer
basicConstraints=critical,CA:FALSE
keyUsage=critical,digitalSignature,keyEncipherment
extendedKeyUsage=serverAuth
subjectAltName=@alt_names

[alt_names]
DNS.1=localhost
IP.1=127.0.0.1
IP.2=::1
IP.3=0.0.0.0
EXTENSIONS

ip_number=4

for last_octet in {0..255}; do
  echo "IP.$ip_number=192.168.0.$last_octet" >> "$EXT_FILE"
  ((ip_number += 1))
done

# Values containing ":" or containing only numbers and dots are IP addresses.
# All other values are DNS names.
dns_number=2

if [[ -n "$EXTRA_HOSTS" ]]; then
  IFS=',' read -ra hosts <<< "$EXTRA_HOSTS"

  for host in "${hosts[@]}"; do
    host="${host//[[:space:]]/}"
    [[ -n "$host" ]] || continue

    if [[ "$host" == *:* || "$host" =~ ^[0-9.]+$ ]]; then
      echo "IP.$ip_number=$host" >> "$EXT_FILE"
      ((ip_number += 1))
    else
      echo "DNS.$dns_number=$host" >> "$EXT_FILE"
      ((dns_number += 1))
    fi
  done
fi

echo "2. Creating the HTTPS certificate..."

openssl genrsa -out "$SERVER_KEY" 2048
chmod 600 "$SERVER_KEY"

openssl req -new -key "$SERVER_KEY" -out "$CSR" \
  -subj "/CN=localhost/O=${PROJECT_SUBJECT_NAME} Development"

openssl x509 -req -in "$CSR" -CA "$CA_CERT" -CAkey "$CA_KEY" \
  -CAcreateserial -out "$SERVER_CERT" -days 825 -sha256 \
  -extfile "$EXT_FILE"

cat > "$INSTRUCTIONS" <<EOF_INSTRUCTIONS
$PROJECT_DISPLAY_NAME local HTTPS certificate
$(printf '=%.0s' $(seq 1 $((${#PROJECT_DISPLAY_NAME} + 24))))

Project certificate name:
  $PROJECT_DISPLAY_NAME

Generated file prefix:
  $PROJECT_FILE_PREFIX

Install ${PROJECT_FILE_PREFIX}localhost-ca.crt as a trusted root on every
computer or device that connects to this API.

Never copy ${PROJECT_FILE_PREFIX}localhost-ca-key.pem to another computer.

FILES
-----
${PROJECT_FILE_PREFIX}localhost-ca-key.pem
  The CA private key. It signs server certificates. Keep it secret.

${PROJECT_FILE_PREFIX}localhost-ca.crt
  The CA public certificate. Copy and install only this file on LAN clients.

localhost-key.pem
  The API server private key. NestJS uses it as the HTTPS "key".

localhost-crt.pem
  The API server public certificate. NestJS uses it as the HTTPS "cert".

Windows, PowerShell as Administrator:
  Import-Certificate -FilePath .\\${PROJECT_FILE_PREFIX}localhost-ca.crt -CertStoreLocation Cert:\\LocalMachine\\Root

macOS:
  sudo security add-trusted-cert -d -r trustRoot -k /Library/Keychains/System.keychain ./${PROJECT_FILE_PREFIX}localhost-ca.crt

Ubuntu/Debian:
  sudo install -m 0644 ./${PROJECT_FILE_PREFIX}localhost-ca.crt /usr/local/share/ca-certificates/${PROJECT_SLUG}-local-development-ca.crt
  sudo update-ca-certificates

Firefox may use its own certificate store. Import ${PROJECT_FILE_PREFIX}localhost-ca.crt under:
  Settings > Privacy & Security > Certificates > View Certificates >
  Authorities > Import, then allow it to identify websites.

Node.js clients, when system trust is unavailable:
  NODE_EXTRA_CA_CERTS=/absolute/path/to/${PROJECT_FILE_PREFIX}localhost-ca.crt node your-client.js

Restart browsers and API clients after installing the CA.

SECURITY:
  Distribute only ${PROJECT_FILE_PREFIX}localhost-ca.crt.
  Never share private key files.
EOF_INSTRUCTIONS

install_ca() {
  case "${CERT_INSTALL_PLATFORM:-$(uname -s)}" in
    Darwin)
      sudo security add-trusted-cert -d -r trustRoot \
        -k /Library/Keychains/System.keychain "$CA_CERT"
      ;;

    Linux)
      [[ -f /etc/debian_version ]] || {
        echo "Automatic installation supports Ubuntu/Debian only." >&2
        return 1
      }

      sudo install -m 0644 "$CA_CERT" \
        "/usr/local/share/ca-certificates/${PROJECT_SLUG}-local-development-ca.crt"

      sudo update-ca-certificates
      ;;

    MINGW*|MSYS*|CYGWIN*|Windows_NT)
      windows_path="$CA_CERT"

      if command -v cygpath >/dev/null; then
        windows_path="$(cygpath -w "$CA_CERT")"
      fi

      powershell.exe -NoProfile -Command \
        "Start-Process powershell.exe -Verb RunAs -Wait -ArgumentList '-NoProfile','-Command','Import-Certificate -FilePath \"$windows_path\" -CertStoreLocation Cert:\\LocalMachine\\Root'"
      ;;

    *)
      echo "Unsupported operating system. Install $CA_CERT manually." >&2
      return 1
      ;;
  esac
}

if [[ "$INSTALL_CA" == true ]]; then
  echo "3. Installing the CA in this computer's trust store..."
  install_ca
fi

cat <<EOF_DONE

Certificates created in: $SSL_DIR

Copy only this CA certificate to LAN clients:
  $CA_CERT

Never share this private CA key:
  $CA_KEY

See this file for installation instructions:
  $INSTRUCTIONS

Fully restart browsers and API clients after installing the CA.
EOF_DONE