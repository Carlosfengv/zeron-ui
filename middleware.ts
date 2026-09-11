import createMiddleware from "next-intl/middleware";
import { routing } from "./app/_i18n/routing";

export default createMiddleware(routing);

export const config = {
  matcher: [
    "/",
    "/docs/:path*",
    "/updates",
    "/block-demo/:path*",
    "/(en|zh-cn)",
    "/(en|zh-cn)/docs/:path*",
    "/(en|zh-cn)/updates",
    "/(en|zh-cn)/block-demo/:path*",
  ],
};
