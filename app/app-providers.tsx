import { MotionConfig } from "framer-motion";
import { BrandPlaygroundProvider } from "@docs/components/playground/brand-playground";
import { SidebarLayout } from "@docs/components/shell/site/sidebar-layout";
import { IconProvider } from "@zeron/icons/context";
import { ThemeProvider } from "@zeron/ui/system/theme-context";

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <MotionConfig reducedMotion="user">
      <IconProvider>
        <ThemeProvider>
          <BrandPlaygroundProvider>
            <SidebarLayout>{children}</SidebarLayout>
          </BrandPlaygroundProvider>
        </ThemeProvider>
      </IconProvider>
    </MotionConfig>
  );
}
