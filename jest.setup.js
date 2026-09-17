// Learn more: https://github.com/testing-library/jest-dom
import "@testing-library/jest-dom";
import { TextEncoder, TextDecoder } from "util";
import { toHaveNoViolations } from "jest-axe";

// Extend Jest matchers with jest-axe
expect.extend(toHaveNoViolations);

// Polyfill for TextEncoder/TextDecoder
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

// Polyfill for setImmediate
global.setImmediate = global.setImmediate || ((fn, ...args) => global.setTimeout(fn, 0, ...args));

// Mock Headers.prototype.getSetCookie for NextRequest compatibility
if (typeof Headers !== "undefined" && Headers.prototype) {
  if (!Headers.prototype.getSetCookie) {
    Headers.prototype.getSetCookie = function () {
      return [];
    };
  }
  // Also add get method if missing
  if (!Headers.prototype.get) {
    Headers.prototype.get = function (name) {
      return null;
    };
  }
}

// Mock Web APIs for Next.js server-side tests
// Provide minimal Request class for Next.js
if (typeof Request === "undefined") {
  global.Request = class Request {
    constructor(input, init = {}) {
      const url = typeof input === "string" ? input : input.url;
      const method = init.method || "GET";
      const headers = new Headers(init.headers);
      const body = init.body;

      // Use property descriptors to match native Request behavior
      Object.defineProperty(this, "url", {
        value: url,
        writable: false,
        enumerable: true,
        configurable: true,
      });

      Object.defineProperty(this, "method", {
        value: method.toUpperCase(),
        writable: false,
        enumerable: true,
        configurable: true,
      });

      Object.defineProperty(this, "headers", {
        value: headers,
        writable: false,
        enumerable: true,
        configurable: true,
      });

      this._bodyInit = body;
      this._bodyUsed = false;
    }

    async json() {
      if (this._bodyUsed) {
        throw new TypeError("Body has already been consumed");
      }
      this._bodyUsed = true;
      if (typeof this._bodyInit === "string") {
        return JSON.parse(this._bodyInit);
      }
      return this._bodyInit || {};
    }

    async text() {
      if (this._bodyUsed) {
        throw new TypeError("Body has already been consumed");
      }
      this._bodyUsed = true;
      return this._bodyInit || "";
    }

    clone() {
      return new Request(this.url, {
        method: this.method,
        headers: this.headers,
        body: this._bodyInit,
      });
    }
  };
}

// Only mock Response if it doesn't exist or is incomplete
if (typeof Response === "undefined" || !Response.json) {
  const OriginalResponse = typeof Response !== "undefined" ? Response : class Response {};

  global.Response = class Response extends OriginalResponse {
    static json(data, init) {
      return new Response(JSON.stringify(data), {
        ...init,
        headers: {
          "Content-Type": "application/json",
          ...(init?.headers || {}),
        },
      });
    }
    constructor(body, init) {
      super(body, init);
      if (body && typeof body === "string") {
        this.body = body;
      }
      this.status = init?.status || 200;
      this.statusText = init?.statusText || "";
      this.headers = new Headers(init?.headers || {});
      this.ok = this.status >= 200 && this.status < 300;
    }
    async json() {
      if (this.body && typeof this.body === "string") {
        return JSON.parse(this.body);
      }
      return super.json ? super.json() : {};
    }
    async text() {
      if (this.body) {
        return this.body;
      }
      return super.text ? super.text() : "";
    }
  };
}

// Only mock Headers if it doesn't exist or is incomplete
if (typeof Headers === "undefined") {
  global.Headers = class Headers {
    constructor(init) {
      this.map = new Map();
      if (init) {
        Object.entries(init).forEach(([key, value]) => {
          this.map.set(key.toLowerCase(), value);
        });
      }
    }
    get(name) {
      return this.map.get(name?.toLowerCase()) || null;
    }
    set(name, value) {
      this.map.set(name.toLowerCase(), value);
    }
    has(name) {
      return this.map.has(name?.toLowerCase());
    }
    delete(name) {
      this.map.delete(name?.toLowerCase());
    }
    forEach(callback) {
      this.map.forEach((value, key) => callback(value, key, this));
    }
    getSetCookie() {
      return [];
    }
  };
}

// Mock react-markdown
jest.mock("react-markdown", () => {
  return function ReactMarkdown({ children, className }) {
    return <div className={className}>{children}</div>;
  };
});

// Mock remark-gfm
jest.mock("remark-gfm", () => {
  return function remarkGfm() {
    return () => {};
  };
});

// Mock next/navigation
jest.mock("next/navigation", () => ({
  useRouter: jest.fn(() => ({
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
    back: jest.fn(),
    pathname: "/",
    query: {},
    asPath: "/",
  })),
  usePathname: jest.fn(() => "/"),
  useSearchParams: jest.fn(() => new URLSearchParams()),
}));

// Mock next-auth
jest.mock("next-auth/react", () => ({
  useSession: jest.fn(() => ({
    data: null,
    status: "unauthenticated",
  })),
  signIn: jest.fn(),
  signOut: jest.fn(),
}));

// Global test timeout
jest.setTimeout(10000);

// Mock URL.createObjectURL and URL.revokeObjectURL
global.URL.createObjectURL = jest.fn(() => "mock-object-url");
global.URL.revokeObjectURL = jest.fn();

// ---------------------------------------------------------------------------
// Global fetch mock.
//
// jsdom does not implement fetch, so any component that calls it in an effect
// (for example FundingStatusBar) threw "ReferenceError: fetch is not defined".
// This default resolves an empty successful response; tests that need specific
// data override it per call:
//
//   (global.fetch as jest.Mock).mockResolvedValueOnce({
//     ok: true,
//     json: async () => ({ ... }),
//   });
//
// Clear queued overrides between tests with jest.clearAllMocks()/
// mockReset() as usual - the jest.fn() below is reset, not replaced.
// ---------------------------------------------------------------------------
function createFetchMock() {
  return jest.fn(() =>
    Promise.resolve({
      ok: true,
      status: 200,
      statusText: "OK",
      headers: new Map(),
      json: async () => ({}),
      text: async () => "",
      blob: async () => new Blob(),
      arrayBuffer: async () => new ArrayBuffer(0),
      clone() {
        return this;
      },
    })
  );
}

if (typeof global.fetch === "undefined" || !jest.isMockFunction(global.fetch)) {
  global.fetch = createFetchMock();
}

// Suppress console errors during tests (optional)
global.console = {
  ...console,
  error: jest.fn(),
  warn: jest.fn(),
};

// Mock edge-runtime cookies to prevent Headers.get issues
jest.mock("next/dist/compiled/@edge-runtime/cookies", () => ({
  RequestCookies: jest.fn().mockImplementation(() => ({
    get: jest.fn(),
    getAll: jest.fn(() => []),
    has: jest.fn(() => false),
    set: jest.fn(),
    delete: jest.fn(),
    clear: jest.fn(),
    [Symbol.iterator]: function* () {},
  })),
  ResponseCookies: jest.fn().mockImplementation(() => ({
    get: jest.fn(),
    getAll: jest.fn(() => []),
    has: jest.fn(() => false),
    set: jest.fn(),
    delete: jest.fn(),
    clear: jest.fn(),
    [Symbol.iterator]: function* () {},
  })),
}));

// Mock Cloudflare headers for testing
// These headers are automatically added by Cloudflare proxy in production
// but need to be mocked in test/dev environments
global.mockCloudflareHeaders = (country = "US", ip = "203.0.113.42") => {
  return new Headers({
    "cf-ipcountry": country,
    "cf-connecting-ip": ip,
    "cf-ray": "8b9c7d6e5f4a3b2c-SJC",
    "cf-visitor": '{"scheme":"https"}',
    "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
  });
};
