# OFFICIAL MANUAL


## 1. Purpose and scope

This is the official usage manual for `@bfw/api-sdk`. The SDK is a universal Node.js/JavaScript/TypeScript client for BFW API features exposed through GraphQL, REST, and WebSocket/realtime transports. It is designed for Node.js scripts, NestJS, Express, SSR applications, React, Angular, Vue, and vanilla browser applications.

Use this manual as:

- a developer integration guide;
- a tester checklist for verifying every SDK feature;
- a reference for installation, uninstall/reinstall, configuration,
  authentication, request/response interceptors, standard responses,
  cancellation, GraphQL CRUD, REST endpoints, file upload, request headers,
  and WebSocket usage;
- a quick guide for building and packing this SDK into a `.tgz` file for local/private distribution.

Important assumptions:

- Package name: `@bfw/api-sdk`.
- Current package version in this repository: `1.0.0`.
- Packed archive name for this version: `bfw-api-sdk-1.0.0.tgz`.
- This SDK is ESM (`"type": "module"`), so examples use `import` syntax.
- GraphQL base URL should normally point to the GraphQL endpoint, for example `https://api.example.com/graphql`.
- REST base URL should normally point to the REST root/base, for example `https://api.example.com/rest` or the server root expected by your API routes.

---

## 2. Getting the SDK package file

For private/manual installation, get the official SDK package archive from one of these sources:

1. Download the SDK package/archive from the official Git repository release/artifact location.
2. Download it from the official Google Drive/shared storage location.
3. If you do not know the correct link, ask the responsible BFW SDK/API owner or project maintainer.

The file provided to application developers is normally a `.tgz` package created with `npm pack`, for example:

```bash
bfw-api-sdk-1.0.0.tgz
```

Place this `.tgz` file in the root folder of the Node.js project where you want to install the SDK.

Example project layout:

```text
my-node-project/
  package.json
  bfw-api-sdk-1.0.0.tgz
  src/
    index.ts
```

---

## 3. Installing the SDK in a Node-based project using npm

### 3.1 First install from `.tgz`

From the root of your Node.js project:

```bash
npm i ./bfw-api-sdk-1.0.0.tgz
```

`./` is recommended because it clearly tells npm that the file is local. This is also accepted by npm in many cases:

```bash
npm i bfw-api-sdk-1.0.0.tgz
```

### 3.2 Verify installation

```bash
npm ls @bfw/api-sdk
```

You should see `@bfw/api-sdk@1.0.0` in the output.

### 3.3 Import test after installation

Create `sdk-import-test.mjs` in your project root:

```js
import { BfwApiSdk } from "@bfw/api-sdk";

console.log("SDK class loaded:", typeof BfwApiSdk);
```

Run:

```bash
node sdk-import-test.mjs
```

Expected output:

```text
SDK class loaded: function
```

### 3.4 Uninstall / remove the SDK

Either command removes the package from the project:

```bash
npm uninstall @bfw/api-sdk
```

or:

```bash
npm rm @bfw/api-sdk
```

After removal, verify:

```bash
npm ls @bfw/api-sdk
```

npm should show that the package is not installed.

### 3.5 Clean reinstall

When changing SDK package versions or reinstalling the same `.tgz` cleanly, use this sequence:

```bash
npm uninstall @bfw/api-sdk
npm rm @bfw/api-sdk
npm i ./bfw-api-sdk-1.0.0.tgz
npm ls @bfw/api-sdk
```

If npm still behaves as if the old package is installed, delete `node_modules` and the lock file only if your project policy allows it:

```bash
rm -rf node_modules package-lock.json
npm i
npm i ./bfw-api-sdk-1.0.0.tgz
```

---

## 4. Building and packing the SDK from this repository

Only maintainers normally do this. From this SDK repository root:

```bash
npm install
npm run build
npm pack
```

The pack command creates a file like:

```text
bfw-api-sdk-1.0.0.tgz
```

Before packing for users:

- update `package.json` version when the SDK changes;
- ensure `schema.graphql` and `swagger.json` are latest;
- run the build;
- run any trial/manual tests;
- provide the `.tgz` to consumers through the official Git repo, release storage, or Google Drive/shared storage.

---

## 5. Public imports and subpath imports

### 5.1 Main import

Use the root import for normal application development:

```ts
import {
  BfwApiSdk,
  BfwApiSdkResponse,
  BfwApiSdkDefaultResponseHeaders,
  BfwApiSdkDefaultRequestHeaders,
  BfwApiSdkError,
  AuthError,
  AUTO_REFRESH_TRIGGER_FROM_GRAPHQL_FAILURE,
  AUTO_RENEW_JWT_TRIGGER_FROM_GRAPHQL_REFRESH_FAILURE,
  type SigninCredentialsOptions,
} from "@bfw/api-sdk";
```

### 5.2 Domain-specific imports

The package exposes focused subpaths for better tree-shaking and clearer imports:

```ts
import { BfwApiSdk } from "@bfw/api-sdk";
import { BfwApiSdkDefaultRequestHeaders } from "@bfw/api-sdk/core";
import { ApiEndpointAuth, Setting } from "@bfw/api-sdk/graphql/endpoints";
import { RestApp, WebhookGateway } from "@bfw/api-sdk/rest/endpoints";
import type { WsSocketFactory } from "@bfw/api-sdk/ws";
```

Available public subpaths:

```text
@bfw/api-sdk
@bfw/api-sdk/core
@bfw/api-sdk/graphql
@bfw/api-sdk/graphql/libs
@bfw/api-sdk/graphql/libs/*
@bfw/api-sdk/graphql/endpoints
@bfw/api-sdk/graphql/endpoints/shared
@bfw/api-sdk/graphql/endpoints/business
@bfw/api-sdk/rest
@bfw/api-sdk/rest/libs
@bfw/api-sdk/rest/libs/*
@bfw/api-sdk/rest/endpoints
@bfw/api-sdk/ws
```

---

## 6. Basic SDK initialization

```ts
import { BfwApiSdk } from "@bfw/api-sdk";

export const sdk = new BfwApiSdk({
  graphql: {
    baseUrl: "https://api.example.com/graphql",
    ws: { baseUrl: "https://graphql-realtime.example.com" },
  },
  rest: {
    baseUrl: "https://api.example.com/rest",
    ws: { baseUrl: "https://rest-realtime.example.com" },
  },
});
```

If a domain does not use WebSocket features, omit its nested `ws` option:

```ts
const sdk = new BfwApiSdk({
  graphql: { baseUrl: "https://api.example.com/graphql" },
  rest: { baseUrl: "https://api.example.com/rest" },
});
```

The SDK creates two independent API domains, each with its own realtime subdomain:

```ts
sdk.graphql; // GraphQL services, auth, HTTP transport
sdk.graphql.ws; // GraphQL realtime connection and modules
sdk.rest; // REST services, auth, HTTP transport
sdk.rest.ws; // REST realtime connection and modules
```

---

## 7. Full configuration reference

```ts
import { BfwApiSdk, BfwApiSdkDefaultRequestHeaders } from "@bfw/api-sdk";
import { io } from "socket.io-client";

const currentState = {
  language: "en-US",
  bidi: "ltr",
  appClientInstanceId: 123,
  ctxs: "current-session-context",
};

const sdk = new BfwApiSdk({
  config: {
    tokenStore: {
      persistentStorageStrategy: "inmemory",
      fileName: "bfw-sdk-token.json",
      // filePath: '/absolute/or/relative/path/bfw-sdk-token.json',
      cookieName: "bfw.api.sdk.conf",
      cookiePath: "/",
      cookieMaxAgeSeconds: 60 * 60 * 24,
      cookieSecure: true,
      cookieSameSite: "Strict",
      browserSessionStorageKey: "bfw.api.sdk.session.conf",
      browserLocalStorageKey: "bfw.api.sdk.local.conf",
    },

    requestId: {
      enabled: true,
      headerName: "x-request-id",
      generator: () => crypto.randomUUID(),
    },

    defaultHeaderNames: {
      [BfwApiSdkDefaultRequestHeaders.ACCEPT_LANGUAGE]: "accept-language",
      [BfwApiSdkDefaultRequestHeaders.CURRENT_BIDI]: "bidi",
      [BfwApiSdkDefaultRequestHeaders.APOLLO_REQUIRE_PREFLIGHT]: "apollo-require-preflight",
      [BfwApiSdkDefaultRequestHeaders.APP_SAAS_INSTANCE_ID]: "asii",
      [BfwApiSdkDefaultRequestHeaders.CTXS]: "ctxs",
    },

    headers: {
      [BfwApiSdkDefaultRequestHeaders.ACCEPT_LANGUAGE]: () => currentState.language,
      [BfwApiSdkDefaultRequestHeaders.CURRENT_BIDI]: () => currentState.bidi,
      [BfwApiSdkDefaultRequestHeaders.APOLLO_REQUIRE_PREFLIGHT]: true,
      [BfwApiSdkDefaultRequestHeaders.APP_SAAS_INSTANCE_ID]: () => currentState.appClientInstanceId,
      [BfwApiSdkDefaultRequestHeaders.CTXS]: () => currentState.ctxs,
    },

    // Sign-in request variables include identify. Keep raw request logs off
    // unless your custom logger safely redacts credentials.
    logRequest: false,
    logResponse: true,
  },

  graphql: {
    baseUrl: "https://api.example.com/graphql",
    timeoutMs: 30000,
    signinCredentials: {
      username: process.env.BFW_GRAPHQL_USERNAME,
      identify: process.env.BFW_GRAPHQL_IDENTIFY,
    },
    tokenStore: {
      persistentStorageStrategy: "browserLocalStorage",
      browserLocalStorageKey: "bfw.graphql.jwt",
    },
    headers: {
      "x-client": "my-app",
    },
    browserCookie: true,
    ws: {
      baseUrl: "https://graphql-realtime.example.com",
      eventPrefix: "bfw.graphql",
      socket: {
        path: "/socket.io",
        transports: ["websocket"],
        withCredentials: true,
      },
      socketFactory: ({ url, options }) => io(url, options),
    },
  },

  rest: {
    baseUrl: "https://api.example.com/rest",
    timeoutMs: 30000,
    signinCredentials: {
      username: process.env.BFW_REST_USERNAME,
      identify: process.env.BFW_REST_IDENTIFY,
    },
    tokenStore: {
      persistentStorageStrategy: "browserLocalStorage",
      browserLocalStorageKey: "bfw.rest.jwt",
    },
    headers: {
      "x-client": "my-app",
    },
  },

});
```

### 7.1 `DomainOptions`

Each HTTP domain (`graphql`, `rest`) supports:

- `baseUrl` (required): endpoint base URL.
- `timeoutMs`: request timeout.
- `signinCredentials`: optional `username` and `identify` used only when the
  refresh token has expired. Both values must be non-empty or automatic sign-in
  remains disabled for that domain.
- `tokenStore`: optional domain-specific token persistence. It takes precedence
  over the global `config.tokenStore`.
- `ws`: optional domain-owned WebSocket configuration (`WsOptions`).
- `headers`: default headers for this domain; values may be static values or provider functions resolved before each request.
- `defaultHeaderNames`: rename SDK built-in headers for this domain only.
- `fetchImpl`: custom fetch implementation.
- `browserCookie`: browser credentials mode helper. `true` means `credentials: 'include'`; `false` means `credentials: 'omit'`; when omitted in a browser runtime, the SDK defaults to `credentials: 'include'` so browser-managed cookies are sent back to the API.
- `ssrCookie`: Node/SSR cookie forwarding string or function.
- `requestId`: request-id options for this domain.

### 7.2 Config precedence

Header merge order is:

1. default `headers`;
2. per-call `headers`.

Per-call headers win for that request only.

Global `config.defaultHeaderNames` applies to both REST and GraphQL. Per-domain `graphql.defaultHeaderNames` or `rest.defaultHeaderNames` can override for that domain.

Global `config.requestId` applies to both REST and GraphQL and takes precedence over per-domain `requestId`.

Global `config.tokenStore` is the fallback for both domains. A
`graphql.tokenStore` or `rest.tokenStore` replaces it for that domain. Use
different file paths, cookie names, or browser storage keys when GraphQL and
REST use different identities.

---

## 8. Request headers

### 8.1 Built-in request headers

```ts
import { BfwApiSdkDefaultRequestHeaders } from "@bfw/api-sdk";

BfwApiSdkDefaultRequestHeaders.REQ_RES_ID; // reqresid
BfwApiSdkDefaultRequestHeaders.ACCEPT_LANGUAGE; // accept-language
BfwApiSdkDefaultRequestHeaders.CURRENT_BIDI; // bidi
BfwApiSdkDefaultRequestHeaders.APOLLO_REQUIRE_PREFLIGHT; // apollo-require-preflight
BfwApiSdkDefaultRequestHeaders.APP_SAAS_INSTANCE_ID; // asii
BfwApiSdkDefaultRequestHeaders.CTXS; // ctxs
```

`BfwApiSdkDefaultRequestHeaders` is the official built-in request header object. Import it from `@bfw/api-sdk` or `@bfw/api-sdk/core`.

### 8.2 Header value types

Default request headers support static values and providers:

```ts
type RequestHeaderValue = string | boolean | number | null | undefined;
type RequestHeaderValueProvider = () => RequestHeaderValue | Promise<RequestHeaderValue>;
```

Before an HTTP request is sent, the SDK converts non-null header values to strings. This means `true` is sent as `"true"`, `false` as `"false"`, and `123` as `"123"`. Use `null` or `undefined` when a header should be skipped for that request.

### 8.3 Set headers at runtime for both REST and GraphQL

```ts
sdk
  .setHeaderAcceptLanguage("en-US")
  .setHeaderCurrentBidi("ltr")
  .setHeaderApolloRequirePreflight(true)
  .setHeaderAppSaasInstanceId(() => getAppSaasInstanceId())
  .setHeaderCtxs(() => getCtxs())
  .setHeaderRequestId(() => crypto.randomUUID());
```

### 8.4 Set custom headers

```ts
sdk.setRequestHeader("x-tenant-id", "tenant-1");
sdk.setRequestHeaders({
  "x-app-version": "1.2.3",
  "x-current-user": () => getCurrentUserId(),
  "x-feature-enabled": true,
});
```

### 8.5 Domain-only headers

```ts
sdk.graphql.setRequestHeader("x-graphql-only", "yes");
sdk.rest.setRequestHeader("x-rest-only", "yes");
```

### 8.6 Remove headers

```ts
sdk.removeBuiltinRequestHeader(BfwApiSdkDefaultRequestHeaders.REQ_RES_ID);
sdk.removeRequestHeader("x-tenant-id");
sdk.clearRequestHeaders();

sdk.graphql.clearRequestHeaders();
sdk.rest.clearRequestHeaders();
```

### 8.7 Per-call headers

Every generated GraphQL and REST service method accepts optional `headers` and
`signal` values. Low-level transports expose the same options.

```ts
await sdk.graphql.transport.execute({
  query: "query Ping { ping }",
  operationName: "Ping",
  headers: {
    [BfwApiSdkDefaultRequestHeaders.ACCEPT_LANGUAGE]: "fr-CA",
    "x-debug": "one-request-only",
  },
});
```

### 8.8 Cancel an individual request

Pass an `AbortController.signal` to cancel one SDK call:

```ts
const controller = new AbortController();

const request = sdk.graphql.country.find({
  filter: { skip: 0, take: 25 } as any,
  selection: {
    rows: { id: true, name: true },
    pagination: { total: true },
  } as any,
  headers: { "x-request-source": "country-screen" },
  signal: controller.signal,
});

controller.abort();
await request; // Rejects with the Fetch AbortError.
```

REST service calls use the same option:

```ts
const controller = new AbortController();

await sdk.rest.restApp.hello.get({
  signal: controller.signal,
});
```

When `signal` is omitted and `timeoutMs` is configured, the SDK creates a
timeout signal for the request. A supplied per-call signal replaces that
configured timeout signal; the SDK does not combine the two signals. A
before-request interceptor may also replace `request.signal`.

### 8.9 Before-request interceptors

REST and GraphQL have independent interceptor registrations:

```ts
sdk.rest.registerBeforeRequestInterceptor((request) => ({
  ...request,
  headers: {
    ...request.headers,
    "x-client-version": "1.0.0",
  },
}));

sdk.graphql.registerBeforeRequestInterceptor((request) => ({
  ...request,
  headers: {
    ...request.headers,
    "x-client-version": "1.0.0",
  },
  payload: processCommonRequestData(request.payload),
}));
```

The callback receives a complete `BfwApiSdkRequest`:

```ts
type BfwApiSdkRequest<TPayload = unknown> = {
  method: string;
  url: string;
  payload?: TPayload;
  headers: Record<string, string>;
  cookie?: string;
  credentials?: RequestCredentials;
  signal?: AbortSignal;
};

type BfwApiSdkRequestInterceptor = (
  request: BfwApiSdkRequest,
) => BfwApiSdkRequest | Promise<BfwApiSdkRequest>;
```

The SDK assembles default, dynamic, per-call, request-id, cookie, and
authorization values before invoking the interceptor. It then serializes the
returned payload, logs the transformed request, and calls Fetch. GraphQL JSON
payloads remain structured objects inside the interceptor. `FormData` remains
`FormData`; the SDK removes a manually supplied multipart `content-type` so
Fetch can generate the required boundary.

Important behavior:

- The callback may return the request directly or return a promise. The SDK
  always waits for the result before serialization, request logging, and Fetch.
- Each domain stores one before-request interceptor. Registering another
  replaces the previous callback; callbacks are not chained.
- Authenticated retry flows invoke the interceptor for every HTTP attempt, so
  the retry receives the refreshed authorization header.
- The callback must return a complete `BfwApiSdkRequest`.
- If the callback throws, rejects, or returns/resolves to an invalid value, the
  SDK logs the failure and sends the original assembled request.

Use an asynchronous interceptor when the request must wait for processing:

```ts
sdk.graphql.registerBeforeRequestInterceptor(async (request) => {
  const securityHeaders = await loadSecurityHeaders();

  return {
    ...request,
    headers: {
      ...request.headers,
      ...securityHeaders,
    },
  };
});
```

If background work must not delay the request, start it without awaiting it,
handle its rejection, and return the request immediately. Background work
cannot modify the request after it has been returned:

```ts
sdk.rest.registerBeforeRequestInterceptor((request) => {
  void recordRequestAudit(request)
    .catch((error) => {
      console.error("Request audit failed", error);
    })
    .finally(() => {
      console.log("Request audit finished");
    });

  return request;
});
```

### 8.10 Standard `BfwApiSdkResponse<T>`

Every generated GraphQL and REST endpoint service method and normal transport
call returns `BfwApiSdkResponse<T>`. The declared endpoint DTO is available
under `response.data`; HTTP information and helper methods remain on the same
object.

```ts
import {
  BfwApiSdkDefaultResponseHeaders,
} from "@bfw/api-sdk";

const response = await sdk.graphql.setting.find({
  filter: { skip: 0, take: 25 } as any,
  selection: {
    rows: { id: true, key: true, value: true },
    pagination: { total: true, pages: true },
  } as any,
});

console.log(response.data.rows);
console.log(response.ok);
console.log(response.status);
console.log(response.statusText);
console.log(response.url);
console.log(response.headers);
```

The public response values are:

- `data`: the typed endpoint DTO or transformed data.
- `ok`: Fetch-style success flag.
- `status` and `statusText`: HTTP status information.
- `url`: final request URL.
- `headers`: immutable, lowercase-normalized response-header map.

Header names are case-insensitive through `getHeader()`:

```ts
response.getHeader("Content-Type");
response.hasHeader("content-type");

response.getResponseHeader(BfwApiSdkDefaultResponseHeaders.REQ_RES_ID);
response.getResHeaderReqResId();
response.getResHeaderCtxs();
response.getResHeaderHostAuthorization();

response.headers.reqresid;
response.headers["content-type"];
```

The built-in response-header constants are:

```ts
BfwApiSdkDefaultResponseHeaders.REQ_RES_ID; // reqresid
BfwApiSdkDefaultResponseHeaders.CTXS; // ctxs
BfwApiSdkDefaultResponseHeaders.HOST_AUTHORIZATION; // hostauthorization
```

`getCookies()` returns an immutable array of raw `Set-Cookie` response values
when the server-side Fetch implementation exposes them:

```ts
for (const cookie of response.getCookies()) {
  console.log(cookie);
}
```

Browsers intentionally hide `Set-Cookie` from JavaScript, so `getCookies()`
returns an empty array in browser applications. For other custom response
headers, a cross-origin server must expose the names:

```http
Access-Control-Expose-Headers: reqresid, ctxs, hostauthorization
```

Use `map()` for a data-only transformation:

```ts
const rowsResponse = response.map((data) => data.rows ?? []);
```

Use `with()` when replacing data or HTTP metadata while retaining all values
not explicitly changed:

```ts
const processed = response.with({
  data: processCommonResponseData(response.data),
  headers: {
    ...response.headers,
    "x-processed": "true",
  },
});
```

`toJSON()` returns a serializable view containing `data`, `ok`, `status`,
`statusText`, `url`, and `headers`. Raw cookie values remain available only
through `getCookies()`.

```ts
console.log(JSON.stringify(response.toJSON()));
```

### 8.11 After-response interceptors

After-response interceptors receive and must return `BfwApiSdkResponse`:

Because one domain interceptor handles every endpoint DTO, its public type uses
`BfwApiSdkResponse<unknown>` for both input and output.

```ts
type BfwApiSdkResponseInterceptor = (
  response: BfwApiSdkResponse<unknown>,
) =>
  | BfwApiSdkResponse<unknown>
  | Promise<BfwApiSdkResponse<unknown>>;
```

```ts
sdk.rest.registerAfterResponseInterceptor((response) =>
  response.map(processCommonResponseData),
);

sdk.graphql.registerAfterResponseInterceptor((response) =>
  response.with({
    data: processCommonResponseData(response.data),
  }),
);
```

The response returned by the interceptor is returned directly to the consumer,
so `data`, headers, cookies, and all response helpers remain ready to use.
Do not return a plain object:

```ts
// Incorrect: spreading creates a plain object, not BfwApiSdkResponse.
sdk.graphql.registerAfterResponseInterceptor((response) => ({
  ...response,
  data: processCommonResponseData(response.data),
}));
```

Important behavior:

- The callback may return the response directly or return a promise. The SDK
  waits for asynchronous processing before resolving or rejecting the endpoint
  operation for the consumer.
- Each domain stores one after-response interceptor. A later registration
  replaces the earlier callback; callbacks are not chained.
- It runs once for the final result of an SDK operation, after GraphQL data is
  unwrapped. It does not run for every intermediate authentication retry.
- HTTP and GraphQL application errors are passed through the interceptor before
  `BfwApiSdkError` is thrown. Transforming an error response does not suppress
  the exception selected by the transport.
- Response logging occurs for each raw HTTP attempt before the final
  after-response transformation.
- If the callback throws, rejects, returns `undefined`, or returns/resolves to
  anything other than `BfwApiSdkResponse`, the SDK logs the failure and uses
  the original response.

Use `async` when the consumer must wait for processing:

```ts
sdk.graphql.registerAfterResponseInterceptor(async (response) => {
  await saveResponseAudit(response);
  return response.map(processCommonResponseData);
});
```

For deliberately non-blocking work, start the promise and return immediately.
JavaScript promises use `.finally()`, not `.finish()`:

```ts
sdk.rest.registerAfterResponseInterceptor((response) => {
  void saveResponseAudit(response)
    .catch((error) => {
      console.error("Response audit failed", error);
    })
    .finally(() => {
      console.log("Response audit finished");
    });

  return response;
});
```

### 8.12 After-response-error interceptors

After-response-error interceptors receive and must return `BfwApiSdkError`:

```ts
type BfwApiSdkErrorInterceptor = (
  error: BfwApiSdkError,
) => BfwApiSdkError | Promise<BfwApiSdkError>;
```

Register the interceptor independently for the REST and GraphQL domains:

```ts
import {
  BfwApiSdkError,
  type BfwApiSdkErrorInterceptor,
} from "@bfw/api-sdk/core";

const handleApiError: BfwApiSdkErrorInterceptor = (error) => {
  console.error("API error:", {
    status: error.status,
    url: error.url,
    messages: error.errors(),
    requestId: error.response?.getResHeaderReqResId(),
  });

  return error;
};

sdk.rest.registerAfterResponseErrorInterceptor(handleApiError);
sdk.graphql.registerAfterResponseErrorInterceptor(handleApiError);
```

Important behavior:

- The SDK first applies the after-response interceptor to the failed response,
  then creates `BfwApiSdkError`, then calls the after-response-error
  interceptor.
- The `BfwApiSdkError` returned by the callback is the error thrown to the
  consumer. Returning the input error preserves the same instance.
- The callback runs for non-2xx HTTP failures and GraphQL application errors,
  including GraphQL errors returned with HTTP status `200`.
- The callback may be synchronous or asynchronous. The SDK waits for it before
  rejecting the endpoint operation.
- Each domain stores one after-response-error interceptor. A later registration
  replaces the earlier callback; callbacks are not chained.
- If the callback throws, rejects, returns `undefined`, or returns/resolves to a
  value other than `BfwApiSdkError`, the SDK logs the interceptor failure and
  throws the original `BfwApiSdkError`.

### 8.13 Response security/navigation check

A browser application can inspect a built-in response header and start a
navigation when it is absent:

```ts
import type {
  BfwApiSdkResponseInterceptor,
} from "@bfw/api-sdk/core";

const securityResponseCheck: BfwApiSdkResponseInterceptor = (response) => {
  const hostAuthorization =
    response.getResHeaderHostAuthorization();

  if (!hostAuthorization?.trim() && typeof window !== "undefined") {
    const redirectPath = "/session-expired";

    // Prevent a redirect loop on the destination page.
    if (window.location.pathname !== redirectPath) {
      window.location.replace(
        `${redirectPath}?reason=missing-host-authorization`,
      );
    }
  }

  return response;
};

sdk.rest.registerAfterResponseInterceptor(securityResponseCheck);
sdk.graphql.registerAfterResponseInterceptor(securityResponseCheck);
```

Use a fixed, trusted redirect destination. Do not build a redirect URL from an
untrusted response value. Ensure the server exposes `hostauthorization` through
`Access-Control-Expose-Headers`, and exclude login/public calls when those
responses intentionally omit the header.

This callback is suitable for client-side session navigation, not for enforcing
security. Interceptor exceptions are caught and the original response is used,
and browser navigation may not happen immediately. The server must always
enforce authentication and authorization.

---

## 9. Authentication and token handling

The SDK has three independent authorization systems:

1. `jwtAuthorization`: stores JWT access/refresh token pairs. GraphQL and REST
   automatically refresh and retry only supported HTTP `401` failures whose
   message ends with a configured authentication code. If refresh itself
   reports an expired refresh token, optional `signinCredentials` can obtain a
   completely new token pair.
2. `jwtStatefulAuthorization`: stores a simple stateful bearer token when the API needs a separate stateful token header.
3. `jwtHostAuthorization`: stores a host bearer token for server-side functions that use the `hostauthorization` header.

### 9.1 Sign in with GraphQL auth helper

```ts
const login = await sdk.graphql.apiAuth.signin({
  username: "user@example.com",
  identify: "password",
});

sdk.graphql.jwtAuthorization.setTokens({
  jwt_access_token: login.data.jwt_access_token,
  jwt_refresh_token: login.data.jwt_refresh_token,
});

// REST has a separate JwtAuthorization instance, so copy tokens if REST calls need auth.
sdk.rest.jwtAuthorization.setTokens({
  jwt_access_token: login.data.jwt_access_token,
  jwt_refresh_token: login.data.jwt_refresh_token,
});
```

### 9.2 Sign up

```ts
const signup = await sdk.graphql.apiAuth.signup({
  username: "new-user",
  email: "new-user@example.com",
  identify: "password",
});
```

### 9.3 Initialize tokens on startup

Use this when the application already has tokens from another source:

```ts
const active = sdk.graphql.jwtAuthorization.initializeTokens({
  jwt_access_token: process.env.BFW_ACCESS_TOKEN ?? "",
  jwt_refresh_token: process.env.BFW_REFRESH_TOKEN ?? "",
});

console.log(active.source); // 'persistent' or 'bootstrap'
```

Force replacing persisted tokens:

```ts
sdk.graphql.jwtAuthorization.initializeTokens(
  { jwt_access_token: "access", jwt_refresh_token: "refresh" },
  { force: true },
);
```

### 9.4 Read, refresh, and clear tokens

```ts
const tokens = sdk.graphql.jwtAuthorization.getTokens();
const accessToken = await sdk.graphql.jwtAuthorization.getAccessToken();
const refreshedAccessToken = await sdk.graphql.jwtAuthorization.refresh();
const authHeader = await sdk.graphql.jwtAuthorization.getAuthHeader();

sdk.graphql.jwtAuthorization.clear();
sdk.rest.jwtAuthorization.clear();
```

### 9.5 Automatic access refresh and sign-in recovery

The public credential type is deliberately optional so configuration can be
enabled per environment:

```ts
type SigninCredentialsOptions = {
  username?: string;
  identify?: string;
};
```

Configure credentials independently for each domain:

```ts
const sdk = new BfwApiSdk({
  graphql: {
    baseUrl: "https://api.example.com/graphql",
    signinCredentials: {
      username: process.env.BFW_GRAPHQL_USERNAME,
      identify: process.env.BFW_GRAPHQL_IDENTIFY,
    },
    tokenStore: {
      persistentStorageStrategy: "file",
      fileName: "bfw.graphql.jwt.json",
    },
  },
  rest: {
    baseUrl: "https://api.example.com/rest",
    signinCredentials: {
      username: process.env.BFW_REST_USERNAME,
      identify: process.env.BFW_REST_IDENTIFY,
    },
    tokenStore: {
      persistentStorageStrategy: "file",
      fileName: "bfw.rest.jwt.json",
    },
  },
});
```

The automatic recovery sequence is:

1. An authenticated HTTP request returns status `401`.
2. The final whitespace-separated token of a supported error message must be
   `401.A1` or `401.A2`, matching
   `AUTO_REFRESH_TRIGGER_FROM_GRAPHQL_FAILURE` or its REST alias.
3. The SDK attempts one single-flight refresh using the stored refresh token.
4. If that refresh request returns HTTP `401` and its message ends with
   `401.A3.REFTKN`, the SDK calls the existing GraphQL `signin()` mutation with
   that domain's `signinCredentials`.
5. Sign-in must return both `jwt_access_token` and `jwt_refresh_token`. The SDK
   persists the pair and retries the original request once.

`signinCredentials` is a recovery fallback, not an eager login option. The SDK
does not sign in during construction, and it does not sign in merely because
tokens are absent. Initialize or restore an access/refresh pair first; automatic
sign-in begins only after the server rejects an attempted refresh with the
configured `401.A3.REFTKN` signal.

The matching is intentionally strict:

```text
Access token expired 401.A1       -> refresh
Access token expired 401.A2       -> refresh
Code 401.A1 was superseded        -> no refresh
HTTP 403 ending with 401.A1       -> no refresh
Refresh token expired 401.A3.REFTKN -> sign in, only when HTTP status is 401
```

GraphQL checks the standard GraphQL error message locations. REST searches
text values in its response body. WebSocket connection recovery uses the same
terminal `401.A1`/`401.A2` matching before calling the domain's shared
`JwtAuthorization.refresh()` path.

If either configured credential is missing or blank, automatic sign-in stays
disabled and the original refresh error is returned. Other refresh errors are
also returned unchanged. Concurrent failures share one refresh/sign-in
operation, and the SDK never starts an unlimited retry loop.

Credentials remain in SDK memory and are not saved in the token store. They
must still be sent in the GraphQL sign-in request, so avoid raw request logging
in production or use a custom logger/interceptor that redacts `identify`.

REST refresh and sign-in use the existing GraphQL authentication endpoint but
save the resulting tokens through the REST domain's own `JwtAuthorization`.

### 9.6 Stateful auth token

```ts
sdk.graphql.jwtStatefulAuthorization.setToken("stateful-token-value");
sdk.rest.jwtStatefulAuthorization.setToken("stateful-token-value");

const statefulHeader = await sdk.graphql.jwtStatefulAuthorization.getAuthHeader();
// { statefulauthorization: 'Bearer stateful-token-value' }

sdk.graphql.jwtStatefulAuthorization.clear();
```

### 9.7 Host auth token

The host token is independent from both `jwtAuthorization` and
`jwtStatefulAuthorization`. It is sent as a Bearer token on GraphQL and REST
requests made through SDK services.

```ts
sdk.graphql.jwtHostAuthorization.setToken("host-token-value");
sdk.rest.jwtHostAuthorization.setToken("host-token-value");

const hostHeader = await sdk.graphql.jwtHostAuthorization.getAuthHeader();
// { hostauthorization: 'Bearer host-token-value' }

sdk.graphql.jwtHostAuthorization.clear();
sdk.rest.jwtHostAuthorization.clear();
```

Passing either a plain token or `"Bearer <token>"` to `setToken()` is supported.
Per-request headers can override the generated header for that individual request.

### 9.8 Token store strategies

Global `config.tokenStore.persistentStorageStrategy` and domain-specific
`graphql.tokenStore` / `rest.tokenStore` support:

- `inmemory`: default; stores tokens only inside the current SDK instance/process.
- `auto`: Node file storage when possible, then browser session/local/cookie fallbacks, then memory.
- `file`: Node.js file storage.
- `cookie`: browser cookie storage.
- `browserSessionStorage`: browser `sessionStorage`.
- `browserLocalStorage`: browser `localStorage`.
- `browserIndexedDb`: reserved for future async storage; currently falls back to session/local storage.

Example Node file token storage:

```ts
const sdk = new BfwApiSdk({
  config: {
    tokenStore: {
      persistentStorageStrategy: "file",
      fileName: "bfw-jwt.json",
    },
  },
  graphql: { baseUrl: "https://api.example.com/graphql" },
  rest: { baseUrl: "https://api.example.com/rest" },
});
```

Example browser local storage:

```ts
const sdk = new BfwApiSdk({
  config: {
    tokenStore: {
      persistentStorageStrategy: "browserLocalStorage",
      browserLocalStorageKey: "my-app.bfw.tokens",
    },
  },
  graphql: { baseUrl: "/graphql" },
  rest: { baseUrl: "/rest" },
});
```

When both domains intentionally share one identity, a global token store
remains available for backward compatibility. When identities may differ, use
domain-specific stores:

```ts
graphql: {
  baseUrl: "/graphql",
  tokenStore: {
    persistentStorageStrategy: "browserLocalStorage",
    browserLocalStorageKey: "my-app.bfw.graphql.tokens",
  },
},
rest: {
  baseUrl: "/rest",
  tokenStore: {
    persistentStorageStrategy: "browserLocalStorage",
    browserLocalStorageKey: "my-app.bfw.rest.tokens",
  },
},
```

---

## 10. Low-level transports

Use service modules for normal development. Use transports for direct/manual testing, custom operations, or features not yet wrapped by a module.

### 10.1 Public GraphQL query

```ts
const result = await sdk.graphql.transport.execute<{ ping: string }>({
  query: "query Ping { ping }",
  operationName: "Ping",
});

console.log(result.data.ping);
```

### 10.2 Authenticated GraphQL query

```ts
const result = await sdk.graphql.transport.executeWithAuth<{
  me: { id: string };
}>({
  jwtAuthorization: sdk.graphql.jwtAuthorization,
  query: "query Me { me { id } }",
  operationName: "Me",
});

console.log(result.data.me.id);
```

### 10.3 Public REST request

```ts
const hello = await sdk.rest.transport.get("/hello");
const created = await sdk.rest.transport.post("/some-path", {
  name: "Example",
});

console.log(hello.data);
console.log(created.data);
```

### 10.4 Authenticated REST request

```ts
const response = await sdk.rest.transport.requestWithAuth({
  jwtAuthorization: sdk.rest.jwtAuthorization,
  method: "GET",
  path: "/protected/path",
});

console.log(response.data);
```

---

## 11. GraphQL module activation

GraphQL endpoint modules are lazy. Before using a module getter, call `sdk.graphql.use(Token)`.

```ts
import { BfwApiSdk } from "@bfw/api-sdk";
import { Setting } from "@bfw/api-sdk/graphql/endpoints";

const sdk = new BfwApiSdk({
  graphql: { baseUrl: "https://api.example.com/graphql" },
  rest: { baseUrl: "https://api.example.com/rest" },
});

sdk.graphql.use(Setting);

const settings = await sdk.graphql.setting.find({
  filter: { skip: 0, take: 10 },
  selection: {
    rows: { id: true, created: true },
    pagination: { total: true, pages: true, take: true },
  } as any,
});

console.log(settings.data.rows);
```

If you forget `use(Token)`, the module getter may be `undefined` because the SDK has not created/cached the service yet.

---

## 12. GraphQL CRUD method patterns

Most GraphQL modules follow this method set:

```text
find, findOneById, create, update, softDelete, delete, restore, upsert, softRemove, remove, recover
```

Some modules add file/upload and ordering helpers:

```text
upload, uploadDelete, recordPosition, markAsMain, json
```

### 12.1 `find`

Use `find` for paginated lists and filtered searches.

```ts
const result = await sdk.graphql.setting.find({
  filter: {
    skip: 0,
    take: 25,
    withDeleted: false,
    where: [
      {
        key: { equal: "site_name" },
      },
    ],
  } as any,
  selection: {
    rows: {
      id: true,
      key: true,
      value: true,
      created: true,
    },
    pagination: {
      total: true,
      remain: true,
      pages: true,
      take: true,
      pagination: {
        current: { page: true, count: true, skip: true },
        next: { page: true, count: true, skip: true },
      },
    },
  } as any,
});
```

Common filter fields:

- `skip`: number of records to skip.
- `take`: number of records to return.
- `withDeleted`: include soft-deleted records when supported.
- `where`: array of field filters.

Common operators in `where`:

```ts
{
  equal: "A";
}
{
  notEqual: "A";
}
{
  like: "%abc%";
}
{
  notLike: "%abc%";
}
{
  into: ["A", "B"];
}
{
  notInto: ["A", "B"];
}
{
  between: ["1", "10"];
}
{
  notBetween: ["1", "10"];
}
{
  lt: "10";
}
{
  lte: "10";
}
{
  mt: "10";
}
{
  mte: "10";
}
{
  nulls: true;
}
{
  matchFun: "custom-db-function-or-backend-supported-expression";
}
```

### 12.2 `findOneById`

```ts
const row = await sdk.graphql.setting.findOneById({
  input: { id: "setting-id" } as any,
  selection: {
    id: true,
    key: true,
    value: true,
    created: true,
  } as any,
});
```

### 12.3 `create`

Most `create` methods accept an array because the backend supports creating multiple records.

```ts
const created = await sdk.graphql.setting.create({
  input: [
    { key: "site_name", value: "BFW" },
    { key: "timezone", value: "UTC" },
  ] as any,
  selection: {
    id: true,
    key: true,
    value: true,
    created: true,
  } as any,
});
```

### 12.4 `update`

```ts
const updated = await sdk.graphql.setting.update({
  input: {
    where: [{ id: { equal: "setting-id" } }],
    set: { value: "New value" },
  } as any,
  selection: {
    affected: true,
    snapshot: { ids: true },
  } as any,
});
```

### 12.5 `upsert`

```ts
const upserted = await sdk.graphql.setting.upsert({
  input: {
    where: [{ key: { equal: "site_name" } }],
    create: { key: "site_name", value: "BFW" },
    update: { value: "BFW Updated" },
  } as any,
  selection: {
    affected: true,
    processStatus: { created: true, updated: true },
  } as any,
});
```

The exact DTO field names can vary by module/schema version. Use TypeScript IntelliSense from the imported DTOs for exact required fields.

### 12.6 Soft delete vs delete vs remove

```ts
await sdk.graphql.setting.softDelete({
  input: { where: [{ id: { equal: "setting-id" } }] } as any,
  selection: { affected: true } as any,
});

await sdk.graphql.setting.delete({
  input: { where: [{ id: { equal: "setting-id" } }] } as any,
  selection: { affected: true } as any,
});

await sdk.graphql.setting.remove({
  input: { id: "setting-id" } as any,
  selection: { affected: true } as any,
});
```

General meaning:

- `softDelete`: marks matching records as deleted without physically removing rows.
- `delete`: criteria-based hard delete.
- `softRemove`: record/entity-style soft remove.
- `remove`: record/entity-style hard remove.
- `restore`: restores soft-deleted records.
- `recover`: recovery-style operation when supported by backend.

### 12.7 Restore and recover

```ts
await sdk.graphql.setting.restore({
  input: { where: [{ id: { equal: "setting-id" } }] } as any,
  selection: { affected: true } as any,
});

await sdk.graphql.setting.recover({
  input: { id: "setting-id" } as any,
  selection: { affected: true } as any,
});
```

---

## 13. GraphQL selections

Every GraphQL service method requires a `selection` object. The SDK converts the object to a GraphQL selection set and ignores unknown fields that are not present in that module's selection schema.

### 13.1 Leaf fields

```ts
selection: {
  id: true,
  created: true,
}
```

### 13.2 Nested fields

```ts
selection: {
  id: true,
  user: {
    id: true,
    username: true,
    email: true,
  },
}
```

### 13.3 Include all known nested fields one level

When the schema supports a nested object, `true` can include the nested schema's known keys one level deep:

```ts
selection: {
  id: true,
  file_profile_photo_url: true,
}
```

### 13.4 Empty selections are invalid

Do not pass `{}`. At least one valid field must be selected.

---

## 14. GraphQL file upload

Modules that support upload have `upload` and `uploadDelete`. Examples include `apiEndpointAuth` and `apiEndpointAuthFile`.

### 14.1 Upload files

```ts
import { BfwApiSdkDefaultRequestHeaders } from "@bfw/api-sdk";
import { ApiEndpointAuth } from "@bfw/api-sdk/graphql/endpoints";

sdk.graphql.use(ApiEndpointAuth);

const file = new File(["hello"], "hello.txt", { type: "text/plain" });

const uploaded = await sdk.graphql.apiEndpointAuth.upload({
  attachment: [file],
  input: {
    ref_id: "record-id-to-link-file",
    id: "optional-existing-file-record-id",
  } as any,
  selection: {
    id: true,
    ref_id: true,
    file_name: true,
    access_url: { direct: true, secure: true, thumb: true },
  } as any,
  headers: {
    [BfwApiSdkDefaultRequestHeaders.APOLLO_REQUIRE_PREFLIGHT]: "true",
  },
});

console.log(uploaded.data);
```

Upload headers use the same global, GraphQL-domain, runtime, and per-call
header system as ordinary requests. The former `config.uploadHeaders` option is
not supported. Do not manually set `content-type: multipart/form-data`; the SDK
removes it so Fetch can add the correct multipart boundary.

### 14.2 Node.js file upload note

In modern Node.js versions, `File`, `Blob`, and `FormData` may be globally available. If your Node runtime does not provide them, use a compatible polyfill or create the file object with APIs supported by your runtime.

```ts
import { readFile } from "node:fs/promises";

const bytes = await readFile("./photo.png");
const file = new File([bytes], "photo.png", { type: "image/png" });
```

### 14.3 Delete uploaded file references

```ts
await sdk.graphql.apiEndpointAuth.uploadDelete({
  input: [
    { ref_id: "record-id", id: "file-record-id", rmdir_record: true },
  ] as any,
  selection: {
    affected: true,
    id: true,
    ref_id: true,
  } as any,
});
```

---

## 15. Special GraphQL helper methods

### 15.1 Record position

Some modules support moving/reordering records, for example `apiEndpointAuth.recordPosition`.

```ts
await sdk.graphql.apiEndpointAuth.recordPosition({
  input: {
    id: "record-id",
    position: 2,
  } as any,
  selection: { affected: true } as any,
});
```

### 15.2 Mark as main

Some modules support marking a record/file as the main one.

```ts
await sdk.graphql.apiEndpointAuth.markAsMain({
  input: {
    id: "record-id",
    ref_id: "parent-record-id",
  } as any,
  selection: { affected: true } as any,
});
```

### 15.3 JSON setting preference

```ts
import { SettingPreference } from "@bfw/api-sdk/graphql/endpoints";
```

`settingPreference` includes a `json` method in addition to normal CRUD.

```ts
sdk.graphql.use(SettingPreference);

const pref = await sdk.graphql.settingPreference.json({
  input: { key: "my.preference.key" } as any,
  selection: { id: true, value: true } as any,
});
```

---

## 16. GraphQL module catalogue

All modules below follow the activation pattern:

```ts
import { ModuleToken } from "@bfw/api-sdk/graphql/endpoints";

sdk.graphql.use(ModuleToken);
await sdk.graphql.moduleAccessor.find(/* ... */);
```

| Accessor on `sdk.graphql`    | Service class                       | Purpose                                                                                                                                                                            | Public methods                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| ---------------------------- | ----------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `apiEndpointAuth`            | `ApiEndpointAuthService`            | Module: ApiEndpointAuth - API endpoint authentication insert, update, delete, restore, recover etc                                                                                 | `upload`, `uploadDelete`, `find`, `findOneById`, `create`, `update`, `softDelete`, `delete`, `restore`, `upsert`, `softRemove`, `remove`, `recover`, `recordPosition`, `markAsMain`                                                                                                                                                                                                                                                                                 |
| `apiEndpointAuthFile`        | `ApiEndpointAuthFileService`        | Module: ApiEndpointAuthFile - API endpoint authentication file upload                                                                                                              | `upload`, `uploadDelete`, `find`, `findOneById`, `create`, `update`, `softDelete`, `delete`, `restore`, `upsert`, `softRemove`, `remove`, `recover`                                                                                                                                                                                                                                                                                                                 |
| `measurementCategory`        | `MeasurementCategoryService`        | Measurement category management with find and CRUD operations.                                                                                                                     | `find`, `findOneById`, `create`, `update`, `softDelete`, `delete`, `restore`, `upsert`, `softRemove`, `remove`, `recover`                                                                                                                                                                                                                                                                                                                                           |
| `measurementUnit`            | `MeasurementUnitService`            | Measurement unit management with find and CRUD operations.                                                                                                                         | `find`, `findOneById`, `create`, `update`, `softDelete`, `delete`, `restore`, `upsert`, `softRemove`, `remove`, `recover`                                                                                                                                                                                                                                                                                                                                           |
| `userFile`                   | `UserFileService`                   | Module: UserFile - User file management with find and CRUD operations.                                                                                                             | `upload`, `uploadDelete`, `find`, `findOneById`, `create`, `update`, `softDelete`, `delete`, `restore`, `upsert`, `softRemove`, `remove`, `recover`, `recordPosition`                                                                                                                                                                                                                                                                                               |
| `userAddress`                | `UserAddressService`                | Module: User Address - User address management with find and CRUD operations.                                                                                                      | `find`, `findOneById`, `create`, `update`, `softDelete`, `delete`, `restore`, `upsert`, `softRemove`, `remove`, `recover`                                                                                                                                                                                                                                                                                                                                           |
| `userIdentityCard`           | `UserIdentityCardService`           | Module: UserIdentityCard - User identity card management with find and CRUD operations.                                                                                            | `find`, `findOneById`, `create`, `update`, `softDelete`, `delete`, `restore`, `upsert`, `softRemove`, `remove`, `recover`                                                                                                                                                                                                                                                                                                                                           |
| `userProfessionalInfo`       | `UserProfessionalInfoService`       | Module: UserProfessionalInfo - User professional info management with find and CRUD operations.                                                                                    | `upload`, `uploadDelete`, `find`, `findOneById`, `create`, `update`, `softDelete`, `delete`, `restore`, `upsert`, `softRemove`, `remove`, `recover`                                                                                                                                                                                                                                                                                                                 |
| `userPersonalInfo`           | `UserPersonalInfoService`           | Module: UserPersonalInfo - User personal info management with find and CRUD operations.                                                                                            | `find`, `findOneById`, `create`, `update`, `softDelete`, `delete`, `restore`, `upsert`, `softRemove`, `remove`, `recover`                                                                                                                                                                                                                                                                                                                                           |
| `userAuthentication`         | `UserAuthenticationService`         | Module: User Authentication - User authentication insert, update, delete, restore, recover etc                                                                                     | `find`, `findOneById`, `create`, `update`, `softDelete`, `delete`, `restore`, `upsert`, `softRemove`, `remove`, `recover`, `signUp`, `grantSignUp`, `grantRole`, `signIn`, `otpSignIn`, `resetPassword`, `forgotPassword`, `recoverForgotPassword`, `signOut`, `whoAmI`, `stepSigninUser`, `stepSigninPassword`, `stepSigninMultiFAOption`, `stepSigninVerify`, `generateTwoFAQrCode`, `verifyTwoFAQrCode`, `regenrateTwoFARecoveryCode`, `verifyTwoFARecoveryCode` |
| `alertDuration`              | `AlertDurationService`              | Module: Alert Duration - Master data of alert duration such as, daily, weekly, monthly etc.                                                                                        | `find`, `findOneById`, `create`, `update`, `softDelete`, `delete`, `restore`, `upsert`, `softRemove`, `remove`, `recover`                                                                                                                                                                                                                                                                                                                                           |
| `academicDegree`             | `AcademicDegreeService`             | Module: Academic Degree - Master data of academic degrees such as, bachelor, master, doctorate, phd etc.                                                                           | `find`, `findOneById`, `create`, `update`, `softDelete`, `delete`, `restore`, `upsert`, `softRemove`, `remove`, `recover`                                                                                                                                                                                                                                                                                                                                           |
| `academicField`              | `AcademicFieldService`              | Module: Academic Field - Master data of academic fields such as, computer science, mathematics, physics etc.                                                                       | `find`, `findOneById`, `create`, `update`, `softDelete`, `delete`, `restore`, `upsert`, `softRemove`, `remove`, `recover`                                                                                                                                                                                                                                                                                                                                           |
| `formField`                  | `FormFieldService`                  | Module: Form Field - Master data of form fields such as, text, email, password etc.                                                                                                | `find`, `findOneById`, `create`, `update`, `softDelete`, `delete`, `restore`, `upsert`, `softRemove`, `remove`, `recover`                                                                                                                                                                                                                                                                                                                                           |
| `identityCardType`           | `IdentityCardTypeService`           | Module: Identity Card Type - Master data of identity card types such as, passport, national id etc.                                                                                | `find`, `findOneById`, `create`, `update`, `softDelete`, `delete`, `restore`, `upsert`, `softRemove`, `remove`, `recover`                                                                                                                                                                                                                                                                                                                                           |
| `jobTitle`                   | `JobTitleService`                   | Module: Job Title - Master data of job titles such as, software engineer, product manager, designer etc.                                                                           | `find`, `findOneById`, `create`, `update`, `softDelete`, `delete`, `restore`, `upsert`, `softRemove`, `remove`, `recover`                                                                                                                                                                                                                                                                                                                                           |
| `device`                     | `DeviceService`                     | Module: Device - Master data of devices such as, mobile, tablet, desktop etc.                                                                                                      | `find`, `findOneById`, `create`, `update`, `softDelete`, `delete`, `restore`, `upsert`, `softRemove`, `remove`, `recover`                                                                                                                                                                                                                                                                                                                                           |
| `securityQuestion`           | `SecurityQuestionService`           | Module: Security Question - Master data of security questions such as, what is your favorite color?, what is your favorite animal? etc.                                            | `find`, `findOneById`, `create`, `update`, `softDelete`, `delete`, `restore`, `upsert`, `softRemove`, `remove`, `recover`                                                                                                                                                                                                                                                                                                                                           |
| `thirdPartyPlatform`         | `ThirdPartyPlatformService`         | Module: ThirdPartyPlatform - Master data of third party platforms such as, facebook, google etc.                                                                                   | `find`, `findOneById`, `create`, `update`, `softDelete`, `delete`, `restore`, `upsert`, `softRemove`, `remove`, `recover`                                                                                                                                                                                                                                                                                                                                           |
| `multifactorAuthenticationType` | `MultifactorAuthenticationTypeService` | Master data for supported multi-factor authentication types.                                                                                                                   | `find`, `findOneById`, `create`, `update`, `softDelete`, `delete`, `restore`, `upsert`, `softRemove`, `remove`, `recover`                                                                                                                                                                                                                                                                                                                                           |
| `workStatus`                 | `WorkStatusService`                 | Module: Work Status - Master data of work status such as, full-time, part-time, freelancer etc.                                                                                    | `find`, `findOneById`, `create`, `update`, `softDelete`, `delete`, `restore`, `upsert`, `softRemove`, `remove`, `recover`                                                                                                                                                                                                                                                                                                                                           |
| `authorisationArea`          | `AuthorisationAreaService`          | Module: Authorisation Area - Master data of authorisation areas.                                                                                                                   | `find`, `findOneById`, `create`, `update`, `softDelete`, `delete`, `restore`, `upsert`, `softRemove`, `remove`, `recover`                                                                                                                                                                                                                                                                                                                                           |
| `authorisationRole`          | `AuthorisationRoleService`          | Module: Authorisation Role - Master data of authorisation roles.                                                                                                                   | `find`, `findOneById`, `create`, `update`, `softDelete`, `delete`, `restore`, `upsert`, `softRemove`, `remove`, `recover`                                                                                                                                                                                                                                                                                                                                           |
| `authorisationModule`        | `AuthorisationModuleService`        | Module: Authorisation Module - Master data of authorisation modules.                                                                                                               | `find`, `findOneById`, `create`, `update`, `softDelete`, `delete`, `restore`, `upsert`, `softRemove`, `remove`, `recover`                                                                                                                                                                                                                                                                                                                                           |
| `authorisationModuleAction`  | `AuthorisationModuleActionService`  | Module: Authorisation Module Action - Master data of authorisation module actions.                                                                                                 | `find`, `findOneById`, `create`, `update`, `softDelete`, `delete`, `restore`, `upsert`, `softRemove`, `remove`, `recover`                                                                                                                                                                                                                                                                                                                                           |
| `emailTemplate`              | `EmailTemplateService`              | Module: Email Template - Master data of email templates such as, welcome email, password reset email etc.                                                                          | `find`, `findOneById`, `create`, `update`, `softDelete`, `delete`, `restore`, `upsert`, `softRemove`, `remove`, `recover`                                                                                                                                                                                                                                                                                                                                           |
| `emailTemplateCategory`      | `EmailTemplateCategoryService`      | Module: Email Template Category - Master data of email template categories such as, user management, notifications etc.                                                            | `find`, `findOneById`, `create`, `update`, `softDelete`, `delete`, `restore`, `upsert`, `softRemove`, `remove`, `recover`                                                                                                                                                                                                                                                                                                                                           |
| `settingCategory`            | `SettingCategoryService`            | Module: Setting Category - Settings category management with find and CRUD operations.                                                                                             | `find`, `findOneById`, `create`, `update`, `softDelete`, `delete`, `restore`, `upsert`, `softRemove`, `remove`, `recover`                                                                                                                                                                                                                                                                                                                                           |
| `settingPreference`          | `SettingPreferenceService`          | Module: Setting Preference - Setting preference management with find and CRUD operations.                                                                                          | `find`, `findOneById`, `json`, `create`, `update`, `softDelete`, `delete`, `restore`, `upsert`, `softRemove`, `remove`, `recover`                                                                                                                                                                                                                                                                                                                                   |
| `settingType`                | `SettingTypeService`                | GraphQL endpoint module.                                                                                                                                                           | `find`, `findOneById`, `create`, `update`, `softDelete`, `delete`, `restore`, `upsert`, `softRemove`, `remove`, `recover`                                                                                                                                                                                                                                                                                                                                           |
| `setting`                    | `SettingService`                    | GraphQL endpoint module.                                                                                                                                                           | `find`, `findOneById`, `create`, `update`, `softDelete`, `delete`, `restore`, `upsert`, `softRemove`, `remove`, `recover`                                                                                                                                                                                                                                                                                                                                           |
| `staticData`                 | `StaticDataService`                 | GraphQL endpoint module.                                                                                                                                                           | `find`, `findOneById`, `create`, `update`, `softDelete`, `delete`, `restore`, `upsert`, `softRemove`, `remove`, `recover`                                                                                                                                                                                                                                                                                                                                           |
| `staticDataValue`            | `StaticDataValueService`            | GraphQL endpoint module.                                                                                                                                                           | `find`, `findOneById`, `create`, `update`, `softDelete`, `delete`, `restore`, `upsert`, `softRemove`, `remove`, `recover`                                                                                                                                                                                                                                                                                                                                           |
| `queueEmail`                 | `QueueEmailService`                 | Module: Queue Email - Queue of email delivery records with find and CRUD operations.                                                                                               | `find`, `findOneById`, `create`, `update`, `softDelete`, `delete`, `restore`, `upsert`, `softRemove`, `remove`, `recover`                                                                                                                                                                                                                                                                                                                                           |
| `queueSms`                   | `QueueSmsService`                   | Module: Queue SMS - Queue of SMS delivery records with find and CRUD operations.                                                                                                   | `find`, `findOneById`, `create`, `update`, `softDelete`, `delete`, `restore`, `upsert`, `softRemove`, `remove`, `recover`                                                                                                                                                                                                                                                                                                                                           |
| `queueWhatsapp`              | `QueueWhatsappService`              | Module: Queue Whatsapp - Queue of whatsapp delivery records with find and CRUD operations.                                                                                         | `find`, `findOneById`, `create`, `update`, `softDelete`, `delete`, `restore`, `upsert`, `softRemove`, `remove`, `recover`                                                                                                                                                                                                                                                                                                                                           |
| `queueFacebookdm`            | `QueueFacebookdmService`            | Module: Queue Facebook DM - Queue of Facebook DM delivery records with find and CRUD operations.                                                                                   | `find`, `findOneById`, `create`, `update`, `softDelete`, `delete`, `restore`, `upsert`, `softRemove`, `remove`, `recover`                                                                                                                                                                                                                                                                                                                                           |
| `queueType`                  | `QueueTypeService`                  | Module: Queue Type - Master data of various work queues such as, email sending, sms sending, whatsapp message sending etc.                                                         | `find`, `findOneById`, `create`, `update`, `softDelete`, `delete`, `restore`, `upsert`, `softRemove`, `remove`, `recover`                                                                                                                                                                                                                                                                                                                                           |
| `user`                       | `UserService`                       | Module: User - User management such as, create user, update user, delete user, restore user, recover user etc.                                                                     | `upload`, `uploadDelete`, `find`, `findOneById`, `create`, `update`, `softDelete`, `delete`, `restore`, `upsert`, `softRemove`, `remove`, `recover`                                                                                                                                                                                                                                                                                                                 |
| `userDevice`                 | `UserDeviceService`                 | Module: UserDevice - User device management with find and CRUD operations.                                                                                                         | `upload`, `uploadDelete`, `find`, `findOneById`, `create`, `handShake`, `update`, `softDelete`, `delete`, `restore`, `upsert`, `softRemove`, `remove`, `recover`                                                                                                                                                                                                                                                                                                    |
| `userSecurityQuestion`       | `UserSecurityQuestionService`       | Module: User Security Question - User security question management with find and CRUD operations.                                                                                  | `find`, `findOneById`, `create`, `update`, `softDelete`, `delete`, `restore`, `upsert`, `softRemove`, `remove`, `recover`                                                                                                                                                                                                                                                                                                                                           |
| `userTwofaRecoveryCode`      | `UserTwofaRecoveryCodeService`      | Module: User Twofa Recovery Code - User twofa recovery code management with find and CRUD operations.                                                                              | `find`, `findOneById`, `create`, `update`, `softDelete`, `delete`, `restore`, `upsert`, `softRemove`, `remove`, `recover`                                                                                                                                                                                                                                                                                                                                           |
| `faq`                        | `FaqService`                        | Module: Faq - Master data of faq.                                                                                                                                                  | `find`, `findOneById`, `create`, `update`, `softDelete`, `delete`, `restore`, `upsert`, `softRemove`, `remove`, `recover`                                                                                                                                                                                                                                                                                                                                           |
| `faqCategory`                | `FaqCategoryService`                | Module: Faq Category - Master data of faq categories.                                                                                                                              | `find`, `findOneById`, `create`, `update`, `softDelete`, `delete`, `restore`, `upsert`, `softRemove`, `remove`, `recover`                                                                                                                                                                                                                                                                                                                                           |
| `userFav`                    | `UserFavService`                    | Module: UserFav - User favourite management with find and CRUD operations.                                                                                                         | `find`, `findOneById`, `create`, `update`, `softDelete`, `delete`, `restore`, `upsert`, `softRemove`, `remove`, `recover`                                                                                                                                                                                                                                                                                                                                           |
| `userFavCategory`            | `UserFavCategoryService`            | Module: UserFavCategory - User favourite category management with find and CRUD operations.                                                                                        | `find`, `findOneById`, `create`, `update`, `softDelete`, `delete`, `restore`, `upsert`, `softRemove`, `remove`, `recover`                                                                                                                                                                                                                                                                                                                                           |
| `userAuthorisation`          | `UserAuthorisationService`          | Module: User Authorisation - User authorisation management such as, assign role to user, remove role from user, get user roles etc.                                                | `find`, `findOneById`, `create`, `update`, `softDelete`, `delete`, `restore`, `upsert`, `softRemove`, `remove`, `recover`                                                                                                                                                                                                                                                                                                                                           |
| `userHierarchy`              | `UserHierarchyService`              | Module: UserHierarchy - User hierarchy management with find and CRUD operations.                                                                                                   | `find`, `findOneById`, `create`, `update`, `softDelete`, `delete`, `restore`, `upsert`, `softRemove`, `remove`, `recover`                                                                                                                                                                                                                                                                                                                                           |
| `userAuthorisationPolicy`    | `UserAuthorisationPolicyService`    | Module: User Authorisation Policy - User authorisation policy management such as, allow/deny and ownership based access controls.                                                  | `find`, `findOneById`, `create`, `update`, `softDelete`, `delete`, `restore`, `upsert`, `softRemove`, `remove`, `recover`                                                                                                                                                                                                                                                                                                                                           |
| `crawlerJobResponseType`     | `CrawlerJobResponseTypeService`     | Module: CrawlerJobResponseType - Crawler response type management with find and CRUD operations.                                                                                   | `find`, `findOneById`, `create`, `update`, `softDelete`, `delete`, `restore`, `upsert`, `softRemove`, `remove`, `recover`                                                                                                                                                                                                                                                                                                                                           |
| `crawlerJobBatch`            | `CrawlerJobBatchService`            | Module: CrawlerJobBatch - Crawler job batch management with find and CRUD operations.                                                                                              | `find`, `findOneById`, `create`, `update`, `softDelete`, `delete`, `restore`, `upsert`, `softRemove`, `remove`, `recover`                                                                                                                                                                                                                                                                                                                                           |
| `crawlerJobBatchAuth`        | `CrawlerJobBatchAuthService`        | Module: CrawlerJobBatchAuth - Crawler job batch authentication management with find and CRUD operations.                                                                           | `find`, `findOneById`, `create`, `update`, `softDelete`, `delete`, `restore`, `upsert`, `softRemove`, `remove`, `recover`                                                                                                                                                                                                                                                                                                                                           |
| `crawlerJobBatchAttempt`     | `CrawlerJobBatchAttemptService`     | Module: CrawlerJobBatchAttempt - Crawler job batch attempt management with find and CRUD operations.                                                                               | `find`, `findOneById`, `create`, `update`, `softDelete`, `delete`, `restore`, `upsert`, `softRemove`, `remove`, `recover`                                                                                                                                                                                                                                                                                                                                           |
| `crawlerJobBatchQueue`       | `CrawlerJobBatchQueueService`       | Module: CrawlerJobBatchQueue - Crawler job batch queue management with find and CRUD operations.                                                                                   | `find`, `findOneById`, `create`, `update`, `softDelete`, `delete`, `restore`, `upsert`, `softRemove`, `remove`, `recover`                                                                                                                                                                                                                                                                                                                                           |
| `crawlerJobBatchResponse`    | `CrawlerJobBatchResponseService`    | Module: CrawlerJobBatchResponse - Crawler job batch response management with find and CRUD operations.                                                                             | `find`, `findOneById`, `create`, `update`, `softDelete`, `delete`, `restore`, `upsert`, `softRemove`, `remove`, `recover`                                                                                                                                                                                                                                                                                                                                           |
| `city`                       | `CityService`                       | Module: City - City management with find and CRUD operations.                                                                                                                      | `find`, `findOneById`, `create`, `update`, `softDelete`, `delete`, `restore`, `upsert`, `softRemove`, `remove`, `recover`                                                                                                                                                                                                                                                                                                                                           |
| `state`                      | `StateService`                      | Module: State - State management with find and CRUD operations.                                                                                                                    | `find`, `findOneById`, `create`, `update`, `softDelete`, `delete`, `restore`, `upsert`, `softRemove`, `remove`, `recover`                                                                                                                                                                                                                                                                                                                                           |
| `subregion`                  | `SubregionService`                  | Module: Subregion - Master data of subregions by region with find and CRUD operations.                                                                                             | `find`, `findOneById`, `create`, `update`, `softDelete`, `delete`, `restore`, `upsert`, `softRemove`, `remove`, `recover`                                                                                                                                                                                                                                                                                                                                           |
| `country`                    | `CountryService`                    | Module: Country - Country management with find and CRUD operations.                                                                                                                | `find`, `findOneById`, `create`, `update`, `softDelete`, `delete`, `restore`, `upsert`, `softRemove`, `remove`, `recover`                                                                                                                                                                                                                                                                                                                                           |
| `countryPhoneCode`           | `CountryPhoneCodeService`           | Module: CountryPhoneCode - Country phone code management with find and CRUD operations.                                                                                            | `find`, `findOneById`, `create`, `update`, `softDelete`, `delete`, `restore`, `upsert`, `softRemove`, `remove`, `recover`                                                                                                                                                                                                                                                                                                                                           |
| `countryLanguage`            | `CountryLanguageService`            | Module: CountryLanguage - Country language management with find and CRUD operations.                                                                                               | `find`, `findOneById`, `create`, `update`, `softDelete`, `delete`, `restore`, `upsert`, `softRemove`, `remove`, `recover`                                                                                                                                                                                                                                                                                                                                           |
| `countryTimezone`            | `CountryTimezoneService`            | Module: CountryTimezone - Country timezone management with find and CRUD operations.                                                                                               | `find`, `findOneById`, `create`, `update`, `softDelete`, `delete`, `restore`, `upsert`, `softRemove`, `remove`, `recover`                                                                                                                                                                                                                                                                                                                                           |
| `language`                   | `LanguageService`                   | Module: Language - Language management with find and CRUD operations.                                                                                                              | `find`, `findOneById`, `create`, `update`, `softDelete`, `delete`, `restore`, `upsert`, `softRemove`, `remove`, `recover`                                                                                                                                                                                                                                                                                                                                           |
| `region`                     | `RegionService`                     | Module: Region - Region management with find and CRUD operations.                                                                                                                  | `find`, `findOneById`, `create`, `update`, `softDelete`, `delete`, `restore`, `upsert`, `softRemove`, `remove`, `recover`                                                                                                                                                                                                                                                                                                                                           |
| `timezone`                   | `TimezoneService`                   | Module: Timezone - Timezone management with find and CRUD operations.                                                                                                              | `find`, `findOneById`, `create`, `update`, `softDelete`, `delete`, `restore`, `upsert`, `softRemove`, `remove`, `recover`                                                                                                                                                                                                                                                                                                                                           |
| `marketingCampaign`          | `MarketingCampaignService`          | Module: Marketing Campaign - Marketing campaign management with find and CRUD operations.                                                                                          | `find`, `findOneById`, `create`, `update`, `softDelete`, `delete`, `restore`, `upsert`, `softRemove`, `remove`, `recover`                                                                                                                                                                                                                                                                                                                                           |
| `marketingCampaignType`      | `MarketingCampaignTypeService`      | Module: Marketing Campaign Type - Master data of marketing campaign types.                                                                                                         | `find`, `findOneById`, `create`, `update`, `softDelete`, `delete`, `restore`, `upsert`, `softRemove`, `remove`, `recover`                                                                                                                                                                                                                                                                                                                                           |
| `session`                    | `SessionService`                    | Module: Session - User session management operations.                                                                                                                              | `find`, `findOneById`, `create`, `update`, `softDelete`, `delete`, `restore`, `upsert`, `softRemove`, `remove`, `recover`                                                                                                                                                                                                                                                                                                                                           |
| `sessionMeta`                | `SessionMetaService`                | Module: Session Meta - Session location/session metadata management with find and CRUD operations.                                                                                 | `find`, `findOneById`, `create`, `update`, `softDelete`, `delete`, `restore`, `upsert`, `softRemove`, `remove`, `recover`                                                                                                                                                                                                                                                                                                                                           |
| `webhookResponse`            | `WebhookResponseService`            | Module: WebhookResponse - Webhook response management with find and CRUD operations.                                                                                               | `find`, `findOneById`, `create`, `update`, `softDelete`, `delete`, `restore`, `upsert`, `softRemove`, `remove`, `recover`                                                                                                                                                                                                                                                                                                                                           |
| `webhookResponseData`        | `WebhookResponseDataService`        | Module: WebhookResponseData - Webhook response raw data management with find and CRUD operations.                                                                                  | `find`, `findOneById`, `create`, `update`, `softDelete`, `delete`, `restore`, `upsert`, `softRemove`, `remove`, `recover`                                                                                                                                                                                                                                                                                                                                           |
| `webPageHierarchy`           | `WebPageHierarchyService`           | Module: WebPageHierarchy - Web page hierarchy management with find and CRUD operations.                                                                                            | `find`, `findOneById`, `create`, `update`, `softDelete`, `delete`, `restore`, `upsert`, `softRemove`, `remove`, `recover`                                                                                                                                                                                                                                                                                                                                           |
| `webPageMaster`              | `WebPageMasterService`              | Module: WebPageMaster - Web page master management with find and CRUD operations.                                                                                                  | `find`, `findOneById`, `create`, `update`, `softDelete`, `delete`, `restore`, `upsert`, `softRemove`, `remove`, `recover`                                                                                                                                                                                                                                                                                                                                           |
| `businessDepartment`         | `BusinessDepartmentService`         | Module: BusinessDepartment - Business department management with find and CRUD operations.                                                                                         | `find`, `findOneById`, `create`, `update`, `softDelete`, `delete`, `restore`, `upsert`, `softRemove`, `remove`, `recover`                                                                                                                                                                                                                                                                                                                                           |
| `businessBranch`             | `BusinessBranchService`             | GraphQL endpoint module.                                                                                                                                                           | `find`, `findOneById`, `create`, `update`, `softDelete`, `delete`, `restore`, `upsert`, `softRemove`, `remove`, `recover`                                                                                                                                                                                                                                                                                                                                           |
| `businessInfo`               | `BusinessInfoService`               | Module: BusinessInfo - Business info management with find and CRUD operations.                                                                                                     | `find`, `findOneById`, `create`, `update`, `softDelete`, `delete`, `restore`, `upsert`, `softRemove`, `remove`, `recover`                                                                                                                                                                                                                                                                                                                                           |
| `business`                   | `BusinessService`                   | Module: Business - Business management module                                                                                                                                      | `find`, `findOneById`, `create`, `update`, `softDelete`, `delete`, `restore`, `upsert`, `softRemove`, `remove`, `recover`                                                                                                                                                                                                                                                                                                                                           |
| `businessPrimaryCategory`    | `BusinessPrimaryCategoryService`    | Module: BusinessPrimaryCategory - Business primary category management with find and CRUD operations.                                                                              | `find`, `findOneById`, `create`, `update`, `softDelete`, `delete`, `restore`, `upsert`, `softRemove`, `remove`, `recover`                                                                                                                                                                                                                                                                                                                                           |
| `businessSecondaryCategory`  | `BusinessSecondaryCategoryService`  | Module: BusinessSecondaryCategory - Business secondary category management with find and CRUD operations.                                                                          | `find`, `findOneById`, `create`, `update`, `softDelete`, `delete`, `restore`, `upsert`, `softRemove`, `remove`, `recover`                                                                                                                                                                                                                                                                                                                                           |
| `businessReview`             | `BusinessReviewService`             | Module: BusinessReview - Business review management with find and CRUD operations.                                                                                                 | `find`, `findOneById`, `create`, `update`, `softDelete`, `delete`, `restore`, `upsert`, `softRemove`, `remove`, `recover`                                                                                                                                                                                                                                                                                                                                           |
| `businessSalesArea`          | `BusinessSalesAreaService`          | Module: BusinessSalesArea - Business sales area management with find and CRUD operations.                                                                                          | `find`, `findOneById`, `create`, `update`, `softDelete`, `delete`, `restore`, `upsert`, `softRemove`, `remove`, `recover`                                                                                                                                                                                                                                                                                                                                           |
| `businessSalesRegion`        | `BusinessSalesRegionService`        | Module: BusinessSalesRegion - Business sales region management with find and CRUD operations.                                                                                      | `find`, `findOneById`, `create`, `update`, `softDelete`, `delete`, `restore`, `upsert`, `softRemove`, `remove`, `recover`                                                                                                                                                                                                                                                                                                                                           |
| `businessUserSalesLocation`  | `BusinessUserSalesLocationService`  | Module: BusinessUserSalesLocation - Business user sales location management with find and CRUD operations.                                                                         | `find`, `findOneById`, `create`, `update`, `softDelete`, `delete`, `restore`, `upsert`, `softRemove`, `remove`, `recover`                                                                                                                                                                                                                                                                                                                                           |
| `businessUser`               | `BusinessUserService`               | Module: BusinessUser - Business user management with find and CRUD operations.                                                                                                     | `find`, `findOneById`, `create`, `update`, `softDelete`, `delete`, `restore`, `upsert`, `softRemove`, `remove`, `recover`                                                                                                                                                                                                                                                                                                                                           |
| `connectionSource`           | `ConnectionSourceService`           | Module: Connection Source - Connection source management with find and CRUD operations.                                                                                            | `find`, `findOneById`, `create`, `update`, `softDelete`, `delete`, `restore`, `upsert`, `softRemove`, `remove`, `recover`                                                                                                                                                                                                                                                                                                                                           |
| `connectionSourceCategory`   | `ConnectionSourceCategoryService`   | Connection source category management with find and CRUD operations.                                                                                                               | `find`, `findOneById`, `create`, `update`, `softDelete`, `delete`, `restore`, `upsert`, `softRemove`, `remove`, `recover`                                                                                                                                                                                                                                                                                                                                           |
| `lead`                       | `LeadService`                       | Module: Lead - Lead management with find and CRUD operations.                                                                                                                      | `find`, `findOneById`, `create`, `update`, `softDelete`, `delete`, `restore`, `upsert`, `softRemove`, `remove`, `recover`                                                                                                                                                                                                                                                                                                                                           |
| `leadFollowup`               | `LeadFollowupService`               | Module: Lead Followup - Lead followup management with find and CRUD operations.                                                                                                    | `find`, `findOneById`, `create`, `update`, `softDelete`, `delete`, `restore`, `upsert`, `softRemove`, `remove`, `recover`                                                                                                                                                                                                                                                                                                                                           |
| `leadFollowupStatus`         | `LeadFollowupStatusService`         | Module: Lead Followup Status - Lead followup status management with find and CRUD operations.                                                                                      | `find`, `findOneById`, `create`, `update`, `softDelete`, `delete`, `restore`, `upsert`, `softRemove`, `remove`, `recover`                                                                                                                                                                                                                                                                                                                                           |
| `leadFollowupVia`            | `LeadFollowupViaService`            | Module: Lead Followup Via - Lead followup via management with find and CRUD operations.                                                                                            | `find`, `findOneById`, `create`, `update`, `softDelete`, `delete`, `restore`, `upsert`, `softRemove`, `remove`, `recover`                                                                                                                                                                                                                                                                                                                                           |
| `leadPotential`              | `LeadPotentialService`              | Module: Lead Potential - Lead potential management with find and CRUD operations.                                                                                                  | `find`, `findOneById`, `create`, `update`, `softDelete`, `delete`, `restore`, `upsert`, `softRemove`, `remove`, `recover`                                                                                                                                                                                                                                                                                                                                           |
| `newsLetterCategory`         | `NewsLetterCategoryService`         | Module: NewsLetterCategory - Newsletter category management with find and CRUD operations.                                                                                         | `find`, `findOneById`, `create`, `update`, `softDelete`, `delete`, `restore`, `upsert`, `softRemove`, `remove`, `recover`                                                                                                                                                                                                                                                                                                                                           |
| `newsLetter`                 | `NewsLetterService`                 | Module: NewsLetter - Newsletter management with find and CRUD operations.                                                                                                          | `find`, `findOneById`, `create`, `update`, `softDelete`, `delete`, `restore`, `upsert`, `softRemove`, `remove`, `recover`                                                                                                                                                                                                                                                                                                                                           |
| `newsLetterSchedule`         | `NewsLetterScheduleService`         | Module: NewsLetterSchedule - Newsletter schedule management with find and CRUD operations.                                                                                         | `find`, `findOneById`, `create`, `update`, `softDelete`, `delete`, `restore`, `upsert`, `softRemove`, `remove`, `recover`                                                                                                                                                                                                                                                                                                                                           |
| `newsLetterTrackLog`         | `NewsLetterTrackLogService`         | Module: NewsLetterTrackLog - Newsletter tracking log management with find and CRUD operations.                                                                                     | `find`, `findOneById`, `create`, `update`, `softDelete`, `delete`, `restore`, `upsert`, `softRemove`, `remove`, `recover`                                                                                                                                                                                                                                                                                                                                           |
| `newsLetterUser`             | `NewsLetterUserService`             | Module: NewsLetterUser - Newsletter user management with find and CRUD operations.                                                                                                 | `find`, `findOneById`, `create`, `update`, `softDelete`, `delete`, `restore`, `upsert`, `softRemove`, `remove`, `recover`                                                                                                                                                                                                                                                                                                                                           |
| `userNewsLetterSubscription` | `UserNewsLetterSubscriptionService` | Module: UserNewsLetterSubscription - User newsletter subscription management with find and CRUD operations.                                                                        | `find`, `findOneById`, `create`, `update`, `softDelete`, `delete`, `restore`, `upsert`, `softRemove`, `remove`, `recover`                                                                                                                                                                                                                                                                                                                                           |
| `userFavouriteProperty`      | `UserFavouritePropertyService`      | Module: User Favourite Property - User favourite property management such as, add to favourites, remove from favourites etc.                                                       | `find`, `findOneById`, `create`, `update`, `softDelete`, `delete`, `restore`, `upsert`, `softRemove`, `remove`, `recover`                                                                                                                                                                                                                                                                                                                                           |
| `retsMlsProvider`            | `RetsMlsProviderService`            | Module: Rets MLS Provider - RETS MLS provider management such as, create provider, update provider, delete provider, restore provider, recover provider etc.                       | `find`, `findOneById`, `create`, `update`, `softDelete`, `delete`, `restore`, `upsert`, `softRemove`, `remove`, `recover`                                                                                                                                                                                                                                                                                                                                           |
| `retsMlsProviderConfig`      | `RetsMlsProviderConfigService`      | Module: Rets MLS Provider Config - RETS MLS provider configuration management such as, create config, update config, delete config, restore config, recover config etc.            | `find`, `findOneById`, `create`, `update`, `softDelete`, `delete`, `restore`, `upsert`, `softRemove`, `remove`, `recover`                                                                                                                                                                                                                                                                                                                                           |
| `retsListingAgent`           | `RetsListingAgentService`           | Module: Rets Listing Agent - RETS listing agent management such as, create agent, update agent, delete agent, restore agent, recover agent etc.                                    | `find`, `findOneById`, `create`, `update`, `softDelete`, `delete`, `restore`, `upsert`, `softRemove`, `remove`, `recover`                                                                                                                                                                                                                                                                                                                                           |
| `retsListing`                | `RetsListingService`                | Module: Rets Listing - RETS listing management such as, create listing, update listing, delete listing, restore listing, recover listing etc.                                      | `find`, `findOneById`, `create`, `update`, `softDelete`, `delete`, `restore`, `upsert`, `softRemove`, `remove`, `recover`                                                                                                                                                                                                                                                                                                                                           |
| `retsListingMetadata`        | `RetsListingMetadataService`        | Module: Rets Listing Metadata - RETS listing metadata management such as, get listing metadata etc.                                                                                | `find`, `findOneById`, `create`, `update`, `softDelete`, `delete`, `restore`, `upsert`, `softRemove`, `remove`, `recover`                                                                                                                                                                                                                                                                                                                                           |
| `retsListingOffice`          | `RetsListingOfficeService`          | Module: Rets Listing Office - RETS listing office management such as, create office, update office, delete office, restore office, recover office etc.                             | `find`, `findOneById`, `create`, `update`, `softDelete`, `delete`, `restore`, `upsert`, `softRemove`, `remove`, `recover`                                                                                                                                                                                                                                                                                                                                           |
| `retsListingOpenHouse`       | `RetsListingOpenHouseService`       | Module: Rets Listing Open House - RETS listing open house management such as, create open house, update open house, delete open house, restore open house, recover open house etc. | `find`, `findOneById`, `create`, `update`, `softDelete`, `delete`, `restore`, `upsert`, `softRemove`, `remove`, `recover`                                                                                                                                                                                                                                                                                                                                           |

---

## 17. REST module activation and usage

REST modules are also lazy. Call `sdk.rest.use(Token)` first.

```ts
import { RestApp, WebhookGateway } from "@bfw/api-sdk/rest/endpoints";

sdk.rest.use(RestApp);
sdk.rest.use(WebhookGateway);

const hello = await sdk.rest.restApp.hello.get();
const posted = await sdk.rest.restApp.hello.post({
  input: { data: { test: true } },
});
```

### 17.1 REST module catalogue

| Accessor on `sdk.rest`   | Service class                   | Public methods                                                                          | Purpose                                                        |
| ------------------------ | ------------------------------- | --------------------------------------------------------------------------------------- | -------------------------------------------------------------- |
| `restApp`                | `RestAppService`                | `hello.get()`; `hello.post({ input })`                                                  | Health/trial echo endpoint.                                    |
| `jwks`                   | `JwksService`                   | `json.get()`                                                                            | Public JWKS key discovery endpoint.                            |
| `webCrawler`             | `WebCrawlerService`             | `submitOtp.get({ fingerprint, id, otp })`; `submitOtp.post({ fingerprint, id, input })` | Submit OTP for crawler jobs.                                   |
| `webScraper`             | `WebScraperService`             | `ping.get()`                                                                            | Public web-scraper ping.                                       |
| `webScrGoogleMyBusiness` | `WebScrGoogleMyBusinessService` | `init.post({ input })`; `enqueue.post({ input })`                                       | Google My Business scraping jobs.                              |
| `webScrFacebookDm`       | `WebScrFacebookDmService`       | `init.post({ input })`; `enqueue.post({ input })`                                       | Facebook DM scraping/sending jobs.                             |
| `webScrChatGpt`          | `WebScrChatGptService`          | `init.post({ input })`; `enqueue.post({ input })`                                       | ChatGPT scraping/prompt jobs.                                  |
| `webhookGateway`         | `WebhookGatewayService`         | `trial.post({ input })`; `websocket.get()`; `bulkSms.post({ input })`                   | Webhook-gateway trial, websocket check, and bulk SMS payloads. |

### 17.2 REST examples

#### JWKS

```ts
import { Jwks } from "@bfw/api-sdk/rest/endpoints";

sdk.rest.use(Jwks);
const jwks = await sdk.rest.jwks.json.get();
console.log(jwks.data.keys);
```

#### Web crawler OTP

```ts
import { WebCrawler } from "@bfw/api-sdk/rest/endpoints";

sdk.rest.use(WebCrawler);

await sdk.rest.webCrawler.submitOtp.get({
  fingerprint: "browser-fingerprint",
  id: "job-id",
  otp: "123456",
});

await sdk.rest.webCrawler.submitOtp.post({
  fingerprint: "browser-fingerprint",
  id: "job-id",
  input: { otp: "123456" },
});
```

#### Webhook gateway bulk SMS

```ts
import { WebhookGateway } from "@bfw/api-sdk/rest/endpoints";
import { WebhookGatewayBulkSmsTypeEnum } from "@bfw/api-sdk/rest/endpoints";

sdk.rest.use(WebhookGateway);

const result = await sdk.rest.webhookGateway.bulkSms.post({
  input: [
    {
      id: 1,
      type: WebhookGatewayBulkSmsTypeEnum.SENT,
      from: 15551230000,
      to: 15551239999,
      body: "Hello from BFW SDK",
    } as any,
  ],
});
```

#### Web scraper Google My Business job

```ts
import { WebScrGoogleMyBusiness } from "@bfw/api-sdk/rest/endpoints";

sdk.rest.use(WebScrGoogleMyBusiness);

const input = {
  client_id: "client-1",
  batch: {
    id: "batch-1",
    alert_email: "ops@example.com",
    at: new Date().toISOString(),
  },
  auth: { twofa: null },
  response: { type: "webhook", webhook: "https://example.com/hook" },
  queue: [
    {
      id: "queue-1",
      browse_url: "https://maps.google.com/?q=business",
      max_reviews: 5,
      b_name: "Business Name",
      b_city: "Toronto",
    },
  ],
} as any;

const immediate = await sdk.rest.webScrGoogleMyBusiness.init.post({ input });
const enqueued = await sdk.rest.webScrGoogleMyBusiness.enqueue.post({ input });
```

#### Facebook DM job

```ts
import { WebScrFacebookDm } from "@bfw/api-sdk/rest/endpoints";

sdk.rest.use(WebScrFacebookDm);

await sdk.rest.webScrFacebookDm.enqueue.post({
  input: {
    client_id: "client-1",
    batch: {
      id: "batch-1",
      alert_email: "ops@example.com",
      at: new Date().toISOString(),
    },
    auth: { u: "facebook-user", p: "password", twofa: null },
    response: { type: "webhook", webhook: "https://example.com/hook" },
    queue: [
      {
        id: "queue-1",
        browse_url: "https://facebook.com/user",
        message: "Hello",
      },
    ],
  } as any,
});
```

#### ChatGPT job

```ts
import { WebScrChatGpt } from "@bfw/api-sdk/rest/endpoints";

sdk.rest.use(WebScrChatGpt);

await sdk.rest.webScrChatGpt.enqueue.post({
  input: {
    client_id: "client-1",
    batch: {
      id: "batch-1",
      alert_email: "ops@example.com",
      at: new Date().toISOString(),
    },
    auth: { twofa: null },
    response: { type: "webhook", webhook: "https://example.com/hook" },
    global_prompt: "You are a helpful assistant.",
    queue: [
      {
        id: "queue-1",
        browse_url: "https://example.com",
        prompt: "Summarize this page.",
        prompt_template: "custom",
        prompt_template_var: {},
        reference_data: {},
      },
    ],
  } as any,
});
```

---

## 18. WebSocket / realtime usage

GraphQL and REST own independent realtime domains:

```ts
await sdk.graphql.ws.connect();
await sdk.rest.ws.connect();
```

Each realtime domain has its own `WsClient`, connection state, listeners, socket options, and authentication session. Connecting one domain never selects, changes, or refreshes credentials belonging to the other domain.

Typed WebSocket implementations stay beside the resource artifacts they use. For example, the user realtime implementation remains in `src/graphql/endpoints/shared/folk/user/ws.ts`. Shared and business `ws.domain.ts` files now follow the HTTP pattern directly: each contains factory binding plus a normal abstract accessor class, and the shared accessor extends the business accessor. `GraphqlWsDomain` extends the shared accessor class and composes one `WsDomain` for connection ownership.

### 18.1 Configure independent connections

Install the Socket.IO adapter when using Socket.IO:

```bash
npm i socket.io-client
```

Configure `ws` inside each API domain that needs realtime features:

```ts
import { BfwApiSdk } from "@bfw/api-sdk";
import { io } from "socket.io-client";

const sdk = new BfwApiSdk({
  graphql: {
    baseUrl: "https://api.example.com/graphql",
    ws: {
      baseUrl: "https://graphql-realtime.example.com",
      // Optional prefix added to each realtime event name.
      eventPrefix: "graphql",
      // Socket adapter settings forwarded to the realtime client.
      socket: {
        path: "/socket.io",
        transports: ["websocket"],
        withCredentials: true,
      },
      // Adapter factory that creates the concrete socket instance.
      socketFactory: ({ url, options }) => io(url, options),
    },
  },
  rest: {
    baseUrl: "https://api.example.com/rest",
    ws: {
      baseUrl: "https://rest-realtime.example.com",
      // Optional prefix added to each realtime event name.
      eventPrefix: "rest",
      // Socket adapter settings forwarded to the realtime client.
      socket: {
        path: "/socket.io",
        transports: ["websocket"],
        withCredentials: true,
      },
      // Adapter factory that creates the concrete socket instance.
      socketFactory: ({ url, options }) => io(url, options),
    },
  },
});
```

### 18.2 Authentication isolation

The GraphQL socket uses only `sdk.graphql.jwtAuthorization`:

```ts
sdk.graphql.jwtAuthorization.setTokens({
  jwt_access_token: process.env.GRAPHQL_ACCESS_TOKEN ?? "",
  jwt_refresh_token: process.env.GRAPHQL_REFRESH_TOKEN ?? "",
});

await sdk.graphql.ws.connect();
```

The REST socket uses only `sdk.rest.jwtAuthorization`:

```ts
sdk.rest.jwtAuthorization.setTokens({
  jwt_access_token: process.env.REST_ACCESS_TOKEN ?? "",
  jwt_refresh_token: process.env.REST_REFRESH_TOKEN ?? "",
});

await sdk.rest.ws.connect();
```

If a connection fails with a message ending in `401.A1` or `401.A2`, that
domain refreshes only its own auth session and retries the connection once.
When refresh reports HTTP `401` ending in `401.A3.REFTKN`, configured
`signinCredentials` can obtain and persist a new pair before the reconnect.
REST uses the GraphQL authentication endpoint for this operation while keeping
its own configured credentials and JWT state.

### 18.3 Typed GraphQL realtime modules

Typed GraphQL realtime modules are lazy. Activate each token before accessing
its getter:

```ts
import {
  GraphWsToken,
  UserAddressWsToken,
  UserWsToken,
} from "@bfw/api-sdk/graphql/endpoints";
import { YesNoEnum } from "@bfw/api-sdk/graphql/libs";

sdk.graphql.ws.use(GraphWsToken);
sdk.graphql.ws.use(UserWsToken);
sdk.graphql.ws.use(UserAddressWsToken);

await sdk.graphql.ws.connect();

const unsubscribeHello = await sdk.graphql.ws.graph.subsrcibeHello((payload) => {
  console.log(payload.msg);
});

const unsubscribeUserCreate = await sdk.graphql.ws.user.subscribeCreate({
  response: (payload) => {
    console.log(payload.id);
  },
});

const unsubscribeUserAddressCreate =
  await sdk.graphql.ws.userAddress.subscribeCreate({
    response: (payload) => {
      console.log(payload.id);
    },
  });

await sdk.graphql.ws.user.publishCreate({
  input: {
    username: "new_user",
    primary_email: "new_user@example.com",
    has_two_factor_auth: YesNoEnum.NO,
    connsrc_id: 1,
  },
});

unsubscribeHello();
unsubscribeUserCreate();
unsubscribeUserAddressCreate();
sdk.graphql.ws.disconnect();
```

REST currently has no registered typed realtime modules. Its low-level
`connect()`, `subscribe()`, `emit()`, state, and cleanup APIs remain available.

### 18.4 Low-level subscribe and emit

Both domains expose the same low-level API independently:

```ts
await sdk.rest.ws.connect();

const event = sdk.rest.ws.resolveEventName("job.completed");
const unsubscribe = sdk.rest.ws.subscribe(event, (payload) => {
  console.log(payload);
});

sdk.rest.ws.emit(sdk.rest.ws.resolveEventName("job.subscribe"), {
  jobId: 42,
});

unsubscribe();
sdk.rest.ws.disconnect();
```

Listeners may be registered before connecting; each domain buffers and flushes only its own listeners.

### 18.5 Connection state and cleanup

```ts
const stopWatchingGraphql = sdk.graphql.ws.onStateChange((state) => {
  console.log("GraphQL realtime:", state);
});

const stopWatchingRest = sdk.rest.ws.onStateChange((state) => {
  console.log("REST realtime:", state);
});

await Promise.all([
  sdk.graphql.ws.connect(),
  sdk.rest.ws.connect(),
]);

// Shut down independently when appropriate.
sdk.graphql.ws.disconnect();
sdk.rest.ws.disconnect();
stopWatchingGraphql();
stopWatchingRest();
```

Best practices:

- Configure `graphql.ws` and `rest.ws` separately when URLs, paths, prefixes, or credentials differ.
- Set tokens on the matching domain auth session before connecting.
- Use `sdk.graphql.ws.*` for GraphQL-owned realtime resources and `sdk.rest.ws.*` for REST-owned resources.
- Keep and invoke unsubscribe functions to avoid duplicate handlers.
- Disconnect each active domain during logout, teardown, or process shutdown.

---

## 19. Framework samples

### 19.1 Node.js script

```ts
import { BfwApiSdk } from "@bfw/api-sdk";
import { Setting } from "@bfw/api-sdk/graphql/endpoints";

const sdk = new BfwApiSdk({
  graphql: { baseUrl: process.env.BFW_GRAPHQL_URL! },
  rest: { baseUrl: process.env.BFW_REST_URL! },
});

sdk.graphql.jwtAuthorization.initializeTokens({
  jwt_access_token: process.env.BFW_ACCESS_TOKEN ?? "",
  jwt_refresh_token: process.env.BFW_REFRESH_TOKEN ?? "",
});

sdk.graphql.use(Setting);

const result = await sdk.graphql.setting.find({
  filter: { skip: 0, take: 10 } as any,
  selection: { rows: { id: true }, pagination: { total: true } } as any,
});

console.log(result.data.rows);
```

### 19.2 Express

```ts
import express from "express";
import { BfwApiSdk } from "@bfw/api-sdk";
import { Setting } from "@bfw/api-sdk/graphql/endpoints";

const app = express();

app.get("/settings", async (req, res, next) => {
  try {
    const sdk = new BfwApiSdk({
      graphql: {
        baseUrl: process.env.BFW_GRAPHQL_URL!,
        ssrCookie: () => req.headers.cookie,
      },
      rest: {
        baseUrl: process.env.BFW_REST_URL!,
        ssrCookie: () => req.headers.cookie,
      },
    });

    sdk.graphql.use(Setting);
    const response = await sdk.graphql.setting.find({
      filter: { skip: 0, take: 25 } as any,
      selection: { rows: { id: true }, pagination: { total: true } } as any,
    });

    res.json(response.data);
  } catch (error) {
    next(error);
  }
});
```

### 19.3 NestJS provider

```ts
import { Injectable } from "@nestjs/common";
import { BfwApiSdk } from "@bfw/api-sdk";
import { Setting } from "@bfw/api-sdk/graphql/endpoints";

@Injectable()
export class BfwSdkService {
  public readonly sdk = new BfwApiSdk({
    graphql: { baseUrl: process.env.BFW_GRAPHQL_URL! },
    rest: { baseUrl: process.env.BFW_REST_URL! },
  });

  constructor() {
    this.sdk.graphql.use(Setting);
  }

  async findSettings() {
    const response = await this.sdk.graphql.setting.find({
      filter: { skip: 0, take: 25 } as any,
      selection: { rows: { id: true }, pagination: { total: true } } as any,
    });
    return response.data;
  }
}
```

### 19.4 React

```tsx
import { useEffect, useMemo, useState } from "react";
import { BfwApiSdk } from "@bfw/api-sdk";
import { Setting } from "@bfw/api-sdk/graphql/endpoints";

export function SettingsList() {
  const [rows, setRows] = useState<any[]>([]);

  const sdk = useMemo(() => {
    const instance = new BfwApiSdk({
      graphql: { baseUrl: "/graphql", browserCookie: true },
      rest: { baseUrl: "/rest", browserCookie: true },
    });
    instance.graphql.use(Setting);
    return instance;
  }, []);

  useEffect(() => {
    sdk.graphql.setting
      .find({
        filter: { skip: 0, take: 25 } as any,
        selection: { rows: { id: true, key: true, value: true } } as any,
      })
      .then((response) => setRows(response.data.rows ?? []));
  }, [sdk]);

  return <pre>{JSON.stringify(rows, null, 2)}</pre>;
}
```

### 19.5 Angular service

```ts
import { Injectable } from "@angular/core";
import { BfwApiSdk } from "@bfw/api-sdk";
import { Setting } from "@bfw/api-sdk/graphql/endpoints";

@Injectable({ providedIn: "root" })
export class BfwSdkAngularService {
  private sdk = new BfwApiSdk({
    graphql: { baseUrl: "/graphql", browserCookie: true },
    rest: { baseUrl: "/rest", browserCookie: true },
  });

  constructor() {
    this.sdk.graphql.use(Setting);
  }

  async findSettings() {
    const response = await this.sdk.graphql.setting.find({
      filter: { skip: 0, take: 25 } as any,
      selection: { rows: { id: true, key: true, value: true } } as any,
    });
    return response.data;
  }
}
```

### 19.6 Vue composable

```ts
import { ref } from "vue";
import { BfwApiSdk } from "@bfw/api-sdk";
import { Setting } from "@bfw/api-sdk/graphql/endpoints";

const sdk = new BfwApiSdk({
  graphql: { baseUrl: "/graphql", browserCookie: true },
  rest: { baseUrl: "/rest", browserCookie: true },
});

sdk.graphql.use(Setting);

export function useSettings() {
  const rows = ref<any[]>([]);

  async function load() {
    const response = await sdk.graphql.setting.find({
      filter: { skip: 0, take: 25 } as any,
      selection: { rows: { id: true, key: true, value: true } } as any,
    });
    rows.value = response.data.rows ?? [];
  }

  return { rows, load };
}
```

### 19.7 Vanilla browser JavaScript

Bundle the SDK with your application bundler (Vite/Webpack/Rollup). Then:

```js
import { BfwApiSdk } from "@bfw/api-sdk";
import { RestApp } from "@bfw/api-sdk/rest/endpoints";

const sdk = new BfwApiSdk({
  graphql: { baseUrl: "/graphql", browserCookie: true },
  rest: { baseUrl: "/rest", browserCookie: true },
});

sdk.rest.use(RestApp);
const hello = await sdk.rest.restApp.hello.get();
console.log(hello.data);
```

---

## 20. Error handling

The SDK throws `BfwApiSdkError` for HTTP/GraphQL/REST API failures and `AuthError` for authentication/token failures.

```ts
import { BfwApiSdkError, AuthError } from "@bfw/api-sdk";

try {
  const result = await sdk.graphql.setting.find({
    filter: { skip: 0, take: 10 } as any,
    selection: { rows: { id: true } } as any,
  });
  console.log(result.data.rows);
  console.log(result.getResHeaderReqResId());
} catch (error) {
  if (error instanceof BfwApiSdkError) {
    console.error("API error:", error.status, error.url, error.body);
    console.error("Response headers:", error.response?.headers);
    console.error("Messages:", error.errors?.());
  } else if (error instanceof AuthError) {
    console.error("Auth error:", error.message, error.details);
  } else {
    console.error("Unknown error:", error);
  }
}
```

Testing checklist for errors:

- Call an authenticated endpoint without tokens and confirm `AuthError` or an auth failure.
- Call a GraphQL endpoint with an expired access token and valid refresh token;
  confirm refresh is attempted and the request retries once.
- Confirm a plain `401`, a non-401 response, or a message where `401.A1` /
  `401.A2` is not the final token does not start automatic refresh.
- Expire the refresh token and return HTTP `401` ending with
  `401.A3.REFTKN`; confirm configured `signinCredentials` obtain and persist a
  complete new token pair before the original request retries once.
- Remove either sign-in credential and confirm the original refresh error is
  preserved without a sign-in attempt.
- Call with invalid URL/base URL; confirm an `BfwApiSdkError` or fetch/network error is surfaced.
- Call GraphQL with an invalid/empty selection; confirm the SDK throws before sending or returns GraphQL errors.

---

## 21. Logging and debugging

### 21.1 Built-in request/response logs

```ts
const sdk = new BfwApiSdk({
  config: {
    logRequest: true,
    logResponse: true,
  },
  graphql: { baseUrl: "https://api.example.com/graphql" },
  rest: { baseUrl: "https://api.example.com/rest" },
});
```

### 21.2 Custom loggers

```ts
const sdk = new BfwApiSdk({
  config: {
    requestLogger: (ctx) => {
      console.log(
        "request",
        ctx.domain,
        ctx.method,
        ctx.url,
        ctx.headers,
        ctx.body,
      );
    },
    responseLogger: (ctx) => {
      console.log(
        "response",
        ctx.domain,
        ctx.method,
        ctx.response,
      );
    },
  },
  graphql: { baseUrl: "https://api.example.com/graphql" },
  rest: { baseUrl: "https://api.example.com/rest" },
});
```

---

## 22. Tester checklist

Use this checklist to verify the SDK in a consumer project.

### 22.1 Installation tests

```bash
npm uninstall @bfw/api-sdk
npm rm @bfw/api-sdk
npm i ./bfw-api-sdk-1.0.0.tgz
npm ls @bfw/api-sdk
node sdk-import-test.mjs
```

### 22.2 Initialization tests

- Create SDK with GraphQL and REST URLs.
- Create SDK with `ws` omitted.
- Create SDK with request headers and request ID enabled.
- Create SDK with `logRequest` and `logResponse` enabled.
- Create SDK with different GraphQL/REST `signinCredentials`.
- Create SDK with different GraphQL/REST domain token-store keys.

### 22.3 Auth tests

- `sdk.graphql.apiAuth.signin` with valid credentials.
- `sdk.graphql.apiAuth.signup` if signup is enabled in the environment.
- `jwtAuthorization.setTokens`, `getTokens`, `getAccessToken`, `getAuthHeader`.
- `sdk.graphql.jwtAuthorization.refresh` with a valid refresh token.
- GraphQL and REST access renewal for HTTP `401` ending in `401.A1`/`401.A2`.
- Refresh-token expiry renewal for HTTP `401` ending in `401.A3.REFTKN`.
- Missing/partial `signinCredentials` preserves the original refresh error.
- Concurrent expired requests cause one refresh and one sign-in.
- Sign-in missing either returned JWT leaves the previous stored pair unchanged.
- `jwtAuthorization.clear`.
- Token persistence strategy selected for the environment.

### 22.4 GraphQL CRUD tests

For at least one safe test module such as `setting`, `faqCategory`, or a test-only module:

1. `sdk.graphql.use(Token)`.
2. `find` with pagination.
3. `findOneById` for an existing ID.
4. `create` with one item.
5. `create` with multiple items.
6. `update` by ID/where.
7. `upsert`.
8. `softDelete`.
9. `restore`.
10. `softRemove`.
11. `recover`.
12. `delete` or `remove` only on disposable test records.
13. Invalid/empty selection error.
14. Per-call headers.

### 22.5 Upload tests

For a module that supports upload:

1. Upload one file.
2. Upload multiple files.
3. Verify returned `id`, `ref_id`, `file_name`, and `access_url`.
4. Delete one uploaded file reference.
5. Delete all uploaded file references with `rmdir_record: true` if safe.
6. Test `apollo-require-preflight` header.

### 22.6 REST tests

- `restApp.hello.get()`.
- `restApp.hello.post({ input })`.
- `jwks.json.get()`.
- `webScraper.ping.get()`.
- `webhookGateway.websocket.get()`.
- `webhookGateway.trial.post({ input })`.
- `webhookGateway.bulkSms.post({ input })` with safe test payload.
- Web crawler/web scraper job methods in a controlled environment.

### 22.7 WebSocket tests

- Create SDK with `socketFactory`.
- Listen to `onStateChange`.
- Connect.
- Subscribe to a test event.
- Emit a test event if supported.
- Disconnect.
- Verify connection refresh happens only for terminal `401.A1`/`401.A2`.
- Verify an expired refresh token uses that domain's `signinCredentials`.

### 22.8 HTTP lifecycle and response tests

- Confirm REST and GraphQL operations return `BfwApiSdkResponse`.
- Verify typed `data`, status, URL, normalized headers, named header helpers,
  cookies where the runtime exposes them, `map()`, and `with()`.
- Cancel one GraphQL and one REST request with `AbortController`.
- Verify REST and GraphQL before-request interceptors are independent and that a
  second registration replaces the first.
- Verify the before-request interceptor runs for each authentication retry.
- Verify REST and GraphQL after-response interceptors are independent, return
  `BfwApiSdkResponse`, and run only for the final operation response.
- Make an interceptor throw or return an invalid value and confirm the SDK logs
  the problem and falls back to the original request or response.

---

## 23. Troubleshooting and FAQ

### 23.1 `Cannot find package @bfw/api-sdk`

Run:

```bash
npm ls @bfw/api-sdk
npm i ./bfw-api-sdk-1.0.0.tgz
```

Make sure the `.tgz` file is in the project root or provide the correct relative path.

### 23.2 Module getter is undefined

Call `use(Token)` before reading the lazy module getter:

```ts
import { Setting } from "@bfw/api-sdk/graphql/endpoints";

sdk.graphql.use(Setting);
await sdk.graphql.setting.find(/* ... */);
```

### 23.3 Empty GraphQL selection error

Pass at least one valid field in `selection`:

```ts
selection: {
  id: true;
}
```

Unknown selection keys are ignored, so check field names against TypeScript IntelliSense and module `SelectionSchema` classes.

### 23.4 Unauthorized request

Check:

- tokens are set in the correct domain session (`sdk.graphql.jwtAuthorization` vs `sdk.rest.jwtAuthorization`);
- access token is not empty;
- refresh token is present if auto-refresh is expected;
- both `signinCredentials.username` and `signinCredentials.identify` are
  non-empty if recovery from an expired refresh token is expected;
- the failure is HTTP `401` and the supported code is the final token in the
  server message;
- GraphQL and REST use separate token-store keys when their identities differ;
- server accepts `Authorization: Bearer <token>`;
- stateful token is set if the endpoint requires it.

### 23.5 Browser cookies not sent

Use:

```ts
graphql: { baseUrl: '/graphql', browserCookie: true }
rest: { baseUrl: '/rest', browserCookie: true }
```

For cross-origin cookies, the server must also send compatible CORS headers, including `Access-Control-Allow-Credentials: true` and a non-wildcard origin.

### 23.6 SSR cookies not forwarded

Use `ssrCookie`:

```ts
graphql: { baseUrl: process.env.BFW_GRAPHQL_URL!, ssrCookie: () => req.headers.cookie }
rest: { baseUrl: process.env.BFW_REST_URL!, ssrCookie: () => req.headers.cookie }
```

### 23.7 Upload fails with content-type/boundary errors

Do not manually set `content-type` for multipart uploads. The SDK removes `content-type` for upload requests so the runtime can set the correct multipart boundary. Keep Apollo preflight or other normal headers only.

### 23.8 Old SDK version remains after reinstall

Run:

```bash
npm uninstall @bfw/api-sdk
npm rm @bfw/api-sdk
npm cache verify
npm i ./bfw-api-sdk-1.0.0.tgz
npm ls @bfw/api-sdk
```

If your project policy permits, clean `node_modules` and reinstall dependencies.

### 23.9 Current limitations and pending features

- **REST typed realtime modules:** no typed REST WebSocket modules are currently
  registered. Use `sdk.rest.ws.connect()`, `subscribe()`, `emit()`,
  `onStateChange()`, and `disconnect()` for low-level realtime work.
- **IndexedDB token persistence:** `browserIndexedDb` is reserved for a future
  asynchronous token-store implementation. The current synchronous API falls
  back to browser session storage, then local storage when available, and
  ultimately memory if neither browser store exists.

---

## 24. Maintainer notes for schema updates

This SDK depends on latest API schemas:

- GraphQL schema file: `schema.graphql`.
- REST/OpenAPI schema file: `swagger.json`.

When backend API changes:

1. Download/update `schema.graphql` from the GraphQL playground/schema source.
2. Download/update `swagger.json` from Swagger/OpenAPI JSON.
3. Update or generate SDK modules.
4. Run build.
5. Run trial tests.
6. Bump package version.
7. Run `npm pack`.
8. Publish/share the new `.tgz` through official channels.

---

## 25. Minimal complete trial file

Create `trial-new.mjs` in a consumer project or use this repository's root
`trial-new.mjs` for experiments:

```js
import { BfwApiSdk } from "@bfw/api-sdk";
import { RestApp } from "@bfw/api-sdk/rest/endpoints";
import { Setting } from "@bfw/api-sdk/graphql/endpoints";

const sdk = new BfwApiSdk({
  graphql: {
    baseUrl: process.env.BFW_GRAPHQL_URL || "http://localhost:20147/graphql",
    signinCredentials: {
      username: process.env.BFW_GRAPHQL_USERNAME,
      identify: process.env.BFW_GRAPHQL_IDENTIFY,
    },
    tokenStore: {
      persistentStorageStrategy: "file",
      fileName: "bfw.graphql.jwt.json",
    },
  },
  rest: {
    baseUrl: process.env.BFW_REST_URL || "http://localhost:20152",
    signinCredentials: {
      username: process.env.BFW_REST_USERNAME,
      identify: process.env.BFW_REST_IDENTIFY,
    },
    tokenStore: {
      persistentStorageStrategy: "file",
      fileName: "bfw.rest.jwt.json",
    },
  },
  config: {
    // Sign-in requests contain identify, so keep raw request logs disabled.
    logRequest: false,
    logResponse: true,
  },
});

sdk.rest.use(RestApp);
const hello = await sdk.rest.restApp.hello.get();
console.log(hello.data);

if (process.env.BFW_ACCESS_TOKEN || process.env.BFW_REFRESH_TOKEN) {
  sdk.graphql.jwtAuthorization.initializeTokens({
    jwt_access_token: process.env.BFW_ACCESS_TOKEN || "",
    jwt_refresh_token: process.env.BFW_REFRESH_TOKEN || "",
  });
}

sdk.graphql.use(Setting);
const settings = await sdk.graphql.setting.find({
  filter: { skip: 0, take: 5 },
  selection: { rows: { id: true }, pagination: { total: true } },
});
console.log(settings.data.rows);
```

Run:

```bash
BFW_GRAPHQL_USERNAME=user@example.com \
BFW_GRAPHQL_IDENTIFY=password \
node trial-new.mjs
```
