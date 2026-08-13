import { MotionConfig } from "framer-motion";
import { BrandPlaygroundProvider } from "@docs/components/playground/brand-playground";
import { ShapeShortcut } from "@docs/components/playground/shape-shortcut";
import { SidebarLayout } from "@docs/components/shell/site/sidebar-layout";
import { IconProvider } from "@zeron/icons/context";
import { ShapeProvider } from "@zeron/ui/system/shape-context";
import { ThemeProvider } from "@zeron/ui/system/theme-context";

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <MotionConfig reducedMotion="user">
      <ShapeProvider defaultShape="rounded">
        <IconProvider>
          <ShapeShortcut />
          <ThemeProvider>
            <BrandPlaygroundProvider>
              <SidebarLayout>{children}</SidebarLayout>
            </BrandPlaygroundProvider>
          </ThemeProvider>
        </IconProvider>
      </ShapeProvider>
    </MotionConfig>
  );
}
