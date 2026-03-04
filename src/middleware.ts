import { type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

export async function middleware(request: NextRequest) {
  return await updateSession(request);
}

export const config = {
  matcher: [
    /*
     * 以下のパスを除く全てのリクエストにマッチ:
     * - _next/static, _next/image (静的ファイル)
     * - favicon.ico, sitemap.xml, robots.txt (メタファイル)
     */
    "/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)",
  ],
};
