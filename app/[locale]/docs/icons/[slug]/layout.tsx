import type { ReactNode } from "react";

export default function IconDocumentationLayout({ children }: { children: ReactNode }) {
  return <div className="mx-auto mt-12 w-full max-w-[960px] py-20 sm:py-28 lg:mt-0">{children}</div>;
}
