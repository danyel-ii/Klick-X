export class RequestSecurityError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
  }
}

export function assertSameOrigin(request: Request) {
  if (request.headers.get("sec-fetch-site") === "cross-site") {
    throw new RequestSecurityError("Cross-site requests are not allowed.", 403);
  }

  const origin = request.headers.get("origin");
  if (!origin) return;

  let requestOrigin: string;
  try {
    requestOrigin = new URL(request.url).origin;
  } catch {
    throw new RequestSecurityError("Invalid request URL.", 400);
  }
  if (origin !== requestOrigin) throw new RequestSecurityError("Cross-origin requests are not allowed.", 403);
}

export async function readJsonBody(request: Request, maxBytes: number): Promise<unknown> {
  const contentType = request.headers.get("content-type")?.split(";", 1)[0]?.trim().toLowerCase();
  if (contentType !== "application/json") throw new RequestSecurityError("Content-Type must be application/json.", 415);

  const declaredLength = Number(request.headers.get("content-length"));
  if (Number.isFinite(declaredLength) && declaredLength > maxBytes) {
    throw new RequestSecurityError("Request body is too large.", 413);
  }

  const text = await request.text();
  if (new TextEncoder().encode(text).byteLength > maxBytes) throw new RequestSecurityError("Request body is too large.", 413);
  try {
    return JSON.parse(text) as unknown;
  } catch {
    throw new RequestSecurityError("Request body must be valid JSON.", 400);
  }
}
