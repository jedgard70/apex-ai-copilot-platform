import type { IncomingHttpHeaders } from "node:http";

export interface PublicUrlEnvironment {
  readonly APP_PUBLIC_URL?: string;
  /** Backwards-compatible alias used by older integrations. */
  readonly PUBLIC_APP_URL?: string;
  readonly PORT?: string;
}

export interface PublicUrlRequest {
  readonly headers: IncomingHttpHeaders;
}

/** Single source of truth for URLs that can leave the application. */
export class PublicUrlResolver {
  private readonly environment: PublicUrlEnvironment;

  public constructor(environment: PublicUrlEnvironment = process.env) {
    this.environment = environment;
  }

  public origin(request?: PublicUrlRequest): string {
    const configured = this.environment.APP_PUBLIC_URL ?? this.environment.PUBLIC_APP_URL;
    if (configured !== undefined && configured.trim().length > 0) {
      return normalizeOrigin(configured);
    }

    const host = headerValue(request?.headers.host);
    if (host !== undefined) {
      const forwardedProtocol = headerValue(request?.headers["x-forwarded-proto"]);
      const protocol = forwardedProtocol?.split(",")[0]?.trim() || inferProtocol(host);
      return normalizeOrigin(`${protocol}://${host}`);
    }

    const port = this.environment.PORT?.trim() || "3010";
    return `http://127.0.0.1:${port}`;
  }

  public url(path: string, request?: PublicUrlRequest): string {
    const normalizedPath = path.startsWith("/") ? path : `/${path}`;
    return `${this.origin(request)}${normalizedPath}`;
  }
}

function headerValue(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) return value[0];
  return value;
}

function inferProtocol(host: string): "http" | "https" {
  return host.startsWith("localhost") || host.startsWith("127.0.0.1") ? "http" : "https";
}

function normalizeOrigin(value: string): string {
  const parsed = new URL(value.trim());
  parsed.search = "";
  parsed.hash = "";
  parsed.pathname = parsed.pathname.replace(/\/+$/u, "");
  return parsed.toString().replace(/\/$/u, "");
}

export const publicUrlResolver = new PublicUrlResolver();
