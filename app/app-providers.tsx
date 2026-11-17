import { MotionConfig } from "motion/react";
import { BrandPlaygroundProvider } from "@docs/components/playground/brand-playground";
import { SidebarLayout } from "@docs/components/shell/site/sidebar-layout";
import { SiteShortcuts } from "@docs/components/shell/site/site-shortcuts";
import { IconProvider } from "@zeron/icons/context";
import { ThemeProvider } from "@zeron/ui/system/theme-context";
import { Toaster } from "@zeron/ui/toast";
import { FigmaCaptureToaster } from "@docs/components/content/FigmaCaptureToaster";

export function AppProviders({ children, enableSiteShortcuts = false }: {
  children: React.ReactNode;
  enableSiteShortcuts?: boolean;
}) {
  return (
    <MotionConfig reducedMotion="user">
      <IconProvider>
        <ThemeProvider>
          {enableSiteShortcuts && <SiteShortcuts />}
          <BrandPlaygroundProvider>
            <SidebarLayout>{children}</SidebarLayout>
            <FigmaCaptureToaster />
            <Toaster />
          </BrandPlaygroundProvider>
        </ThemeProvider>
      </IconProvider>
    </MotionConfig>
  );
}
