import { MotionConfig } from "framer-motion";
import { BrandPlaygroundProvider } from "@/docs/brand-playground";
import { ShapeShortcut } from "@/docs/shape-shortcut";
import { SidebarLayout } from "@/docs/site/sidebar-layout";
import { ProIconProvider } from "@/lib/pro-icon-provider";
import { ShapeProvider } from "@/lib/shape-context";
import { ThemeProvider } from "@/lib/theme-context";

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <MotionConfig reducedMotion="user">
      <ShapeProvider defaultShape="rounded">
        <ProIconProvider>
          <ShapeShortcut />
          <ThemeProvider>
            <BrandPlaygroundProvider>
              <SidebarLayout>{children}</SidebarLayout>
            </BrandPlaygroundProvider>
          </ThemeProvider>
        </ProIconProvider>
      </ShapeProvider>
    </MotionConfig>
  );
}
