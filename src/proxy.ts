import { auth0 } from "./lib/auth0";

export async function proxy(request: Request) {
  // This scaffolding uses the Auth0 middleware shape expected by @auth0/nextjs-auth0.
  // In non-Next runtimes adapt as needed.
  // @ts-ignore
  return await auth0.middleware(request);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)",
  ],
};
