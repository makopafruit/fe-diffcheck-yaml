// src/services/products.ts
export type ApicApi = {
  id: string;
  info: {
    "x-ibm-name": string;
    title: string;
    version: string;
  };
};

/** ------- List (existing) ------- */
const mockApis: ApicApi[] = [
  {
    id: "584a77xxxx123",
    info: {
      "x-ibm-name": "billspayment",
      title: "BillsPayment",
      version: "1.0.0",
    },
  },
  {
    id: "584a77xxxx124",
    info: {
      "x-ibm-name": "sample",
      title: "sample",
      version: "1.0.0",
    },
  },
];

export async function fetchApicApis(signal?: AbortSignal): Promise<ApicApi[]> {
  // Keep your mock for now. Swap to real fetch when ready.
  // const res = await fetch("https://dummyjson.com/products", { signal });
  // if (!res.ok) throw new Error(`Failed to fetch apis: ${res.status}`);
  // const data = await res.json();
  // return data.products;
  return mockApis;
}

/** =========================
 *  Details by ID (Swagger)
 *  =========================
 */

/** A minimal type for your Swagger 2.0 document; extend as needed */
export type ApiDetailSwagger = {
  swagger: "2.0";
  info: {
    "x-ibm-name": string;
    title: string;
    version: string;
    description?: string;
    contact?: { name?: string; email?: string };
  };
  schemes?: string[];
  host?: string;
  consumes?: string[];
  produces?: string[];
  securityDefinitions?: Record<string, unknown>;
  security?: unknown[];
  "x-ibm-configuration"?: Record<string, unknown>;
  paths?: Record<string, unknown>;
  definitions?: Record<string, unknown>;
  tags?: unknown[];
  basePath?: string;
};

/** Mock details (keyed by app id) */
const MOCK_API_DETAILS: Record<string, ApiDetailSwagger> = {
  // 👇 tie your provided swagger to a real list id (adjust if needed)
  "584a77xxxx123": {
    swagger: "2.0",
    info: {
      "x-ibm-name": "test-api-jordan",
      title: "Test API - Jordan",
      version: "1.0.0",
      description: "for testing purpose only",
      contact: { name: "jordan", email: "jdpagkatipunan@unionbankph.com" },
    },
    schemes: ["https"],
    host: "$(catalog.host)",
    consumes: ["application/json"],
    produces: ["application/json"],
    securityDefinitions: {
      clientSecretHeader: {
        type: "apiKey",
        description: "",
        in: "header",
        name: "X-IBM-Client-Secret",
      },
      clientIdHeader: {
        type: "apiKey",
        in: "header",
        name: "X-IBM-Client-Id",
      },
    },
    security: [{ clientIdHeader: [], clientSecretHeader: [] }],
    "x-ibm-configuration": {
      testable: true,
      enforced: true,
      cors: { enabled: true },
      assembly: {
        execute: [
          {
            "operation-switch": {
              title: "operation-switch",
              case: [
                {
                  operations: [{ verb: "get", path: "/testing" }],
                  execute: [{ invoke: { "target-url": "$(target-url)$(request.path)" } }],
                },
                {
                  operations: [{ verb: "post", path: "/testing" }],
                  execute: [{ invoke: { "target-url": "qweqzzxc" } }],
                },
              ],
              otherwise: [],
              version: "1.0.0",
            },
          },
        ],
        catch: [],
      },
      phase: "realized",
      properties: {
        coreUrl: { value: "", description: "", encoded: false },
        password: { value: "", description: "", encoded: false },
        username: { value: "", description: "", encoded: false },
      },
      catalogs: {
        UAT: {
          properties: { username: "jordan@uat", password: "password@uat", coreUrl: "www.uat.com" },
        },
        Dev: {
          properties: { username: "jordan@dev", password: "password@dev" },
        },
      },
    },
    paths: {
      "/testing": {
        get: {
          responses: { 200: { description: "200 OK" } },
          tags: ["test"],
          summary: "",
          description: "test get method request",
          parameters: [
            {
              name: "userId",
              type: "string",
              required: false,
              in: "query",
              description: "user id to get specific user",
            },
          ],
        },
        post: {
          responses: { 200: { description: "200 OK" } },
          tags: ["test"],
          description: "to test post method request",
          parameters: [{ name: "body", required: false, in: "body", schema: { type: "object" } }],
        },
        put: {
          responses: { 200: { description: "200 OK" } },
          tags: ["test"],
          description: "for testing put method request",
          parameters: [
            { name: "body", required: false, in: "body", schema: { type: "object" } },
            { name: "profileName", type: "string", required: true, in: "path", description: "profile name" },
          ],
        },
        delete: {
          responses: { 200: { description: "200 OK" } },
          tags: ["test"],
          description: "for testing delete method",
          parameters: [
            { name: "userId", type: "string", required: true, in: "path", description: "user id to be deleted" },
          ],
        },
      },
    },
    definitions: {},
    tags: [],
    basePath: "/jordan",
  },
    "584a77xxxx124": {
    swagger: "2.0",
    info: {
      "x-ibm-name": "sample",
      title: "Test API - sample",
      version: "1.0.0",
      description: "for testing purpose only",
      contact: { name: "sample", email: "sample@unionbankph.com" },
    },
    schemes: ["https"],
    host: "$(catalog.host)",
    consumes: ["application/json"],
    produces: ["application/json"],
    securityDefinitions: {
      clientSecretHeader: {
        type: "apiKey",
        description: "",
        in: "header",
        name: "X-IBM-Client-Secret",
      },
      clientIdHeader: {
        type: "apiKey",
        in: "header",
        name: "X-IBM-Client-Id",
      },
    },
    security: [{ clientIdHeader: [], clientSecretHeader: [] }],
    "x-ibm-configuration": {
      testable: true,
      enforced: true,
      cors: { enabled: true },
      assembly: {
        execute: [
          {
            "operation-switch": {
              title: "operation-switch",
              case: [
                {
                  operations: [{ verb: "get", path: "/testing" }],
                  execute: [{ invoke: { "target-url": "$(target-url)$(request.path)" } }],
                },
                {
                  operations: [{ verb: "post", path: "/testing" }],
                  execute: [{ invoke: { "target-url": "qweqzzxc" } }],
                },
              ],
              otherwise: [],
              version: "1.0.0",
            },
          },
        ],
        catch: [],
      },
      phase: "realized",
      properties: {
        coreUrl: { value: "", description: "", encoded: false },
        password: { value: "", description: "", encoded: false },
        username: { value: "", description: "", encoded: false },
      },
      catalogs: {
        UAT: {
          properties: { username: "jordan@uat", password: "password@uat", coreUrl: "www.uat.com" },
        },
        Dev: {
          properties: { username: "jordan@dev", password: "password@dev" },
        },
      },
    },
    paths: {
      "/testing": {
        get: {
          responses: { 200: { description: "200 OK" } },
          tags: ["test"],
          summary: "",
          description: "test get method request",
          parameters: [
            {
              name: "userId",
              type: "string",
              required: false,
              in: "query",
              description: "user id to get specific user",
            },
          ],
        },
        post: {
          responses: { 200: { description: "200 OK" } },
          tags: ["test"],
          description: "to test post method request",
          parameters: [{ name: "body", required: false, in: "body", schema: { type: "object" } }],
        },
        put: {
          responses: { 200: { description: "200 OK" } },
          tags: ["test"],
          description: "for testing put method request",
          parameters: [
            { name: "body", required: false, in: "body", schema: { type: "object" } },
            { name: "profileName", type: "string", required: true, in: "path", description: "profile name" },
          ],
        },
        delete: {
          responses: { 200: { description: "200 OK" } },
          tags: ["test"],
          description: "for testing delete method",
          parameters: [
            { name: "userId", type: "string", required: true, in: "path", description: "user id to be deleted" },
          ],
        },
      },
    },
    definitions: {},
    tags: [],
    basePath: "/jordan",
  }
};

/** Fetch details by id (mock-first; swap to real when backend is ready) */
export async function fetchApiById(
  id: string,
  signal?: AbortSignal,
  opts?: { useMock?: boolean }
): Promise<ApiDetailSwagger> {
  // Use mock by default while backend isn’t wired
  const useMock = opts?.useMock ?? true;

  if (useMock) {
    // optional: simulate latency
    await new Promise((r) => setTimeout(r, 150));
    const doc = MOCK_API_DETAILS[id];
    if (!doc) {
      throw new Error(`API detail not found for id: ${id}`);
    }
    return doc;
  }

  // Example real fetch (adjust URL to your APIC gateway)
  const res = await fetch(`/apis/${encodeURIComponent(id)}`, { signal });
  if (!res.ok) throw new Error(`Failed to fetch api by id (${id}): ${res.status}`);
  const data = (await res.json()) as ApiDetailSwagger;
  return data;
}
