import createMiddleware from "next-intl/middleware";
import { routing } from "./src/i18n/routing";

export default createMiddleware(routing);

export const config = {
  matcher: [
    "/",
    "/docs/:path*",
    "/(en|zh-cn)",
    "/(en|zh-cn)/docs/:path*",
  ],
};
