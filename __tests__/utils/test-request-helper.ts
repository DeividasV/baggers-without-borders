/**
 * Helper to create NextRequest objects for testing
 * Handles the Headers initialization properly
 */

import { NextRequest } from "next/server";

export function createMockNextRequest(
  url: string,
  init?: RequestInit
): NextRequest {
  // Create a proper Headers object
  const headers = new Headers(init?.headers || {});

  // Ensure required methods exist
  if (!headers.get) {
    headers.get = function (name: string) {
      return null;
    };
  }

  if (!(headers as any).getSetCookie) {
    (headers as any).getSetCookie = function () {
      return [];
    };
  }

  const request = new Request(url, {
    ...init,
    headers,
  });

  return new NextRequest(request);
}
