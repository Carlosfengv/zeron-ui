import type { Metadata } from "next";
import { NextIntlClientProvider } from "next-intl";
import "../globals.css";
import { AppProviders } from "@/app-providers";
import commonMessages from "@/messages/en/common.json";
import homeMessages from "@/messages/en/home.json";
import introductionMessages from "@/messages/en/docs/introduction.json";
import buttonMessages from "@/messages/en/docs/button.json";
import dataGridMessages from "@/messages/en/docs/data-grid.json";
import accordionMessages from "@/messages/en/docs/accordion.json";
import switchMessages from "@/messages/en/docs/switch.json";
import tableMessages from "@/messages/en/docs/table.json";
import thinkingIndicatorMessages from "@/messages/en/docs/thinking-indicator.json";
import checkboxGroupMessages from "@/messages/en/docs/checkbox-group.json";
import checkboxMessages from "@/messages/en/docs/checkbox.json";
import dialogMessages from "@/messages/en/docs/dialog.json";
import badgeMessages from "@/messages/en/docs/badge.json";
import kbdMessages from "@/messages/en/docs/kbd.json";
import inputMessages from "@/messages/en/docs/input.json";
import tooltipMessages from "@/messages/en/docs/tooltip.json";
import inputCopyMessages from "@/messages/en/docs/input-copy.json";
import dataTableMessages from "@/messages/en/docs/data-table.json";
import badgeOverflowMessages from "@/messages/en/docs/badge-overflow.json";
import radioGroupMessages from "@/messages/en/docs/radio-group.json";
import colorPickerMessages from "@/messages/en/docs/color-picker.json";
import popoverMessages from "@/messages/en/docs/popover.json";
import dropdownMessages from "@/messages/en/docs/dropdown.json";
import breadcrumbMessages from "@/messages/en/docs/breadcrumb.json";
import stepperMessages from "@/messages/en/docs/stepper.json";
import chatMessageMessages from "@/messages/en/docs/chat-message.json";
import surfacesMessages from "@/messages/en/docs/surfaces.json";
import motionMessages from "@/messages/en/docs/motion.json";
import semanticTokensMessages from "@/messages/en/docs/semantic-tokens.json";
import scrollbarsMessages from "@/messages/en/docs/scrollbars.json";
import inputGroupMessages from "@/messages/en/docs/input-group.json";
import selectMessages from "@/messages/en/docs/select.json";
import sliderMessages from "@/messages/en/docs/slider.json";
import tabsMessages from "@/messages/en/docs/tabs.json";
import cardMessages from "@/messages/en/docs/card.json";
import thinkingStepsMessages from "@/messages/en/docs/thinking-steps.json";
import askUserQuestionsMessages from "@/messages/en/docs/ask-user-questions.json";

const messages = {
  ...commonMessages,
  ...homeMessages,
  ...introductionMessages,
  ...buttonMessages,
  ...dataGridMessages,
  ...accordionMessages,
  ...switchMessages,
  ...tableMessages,
  ...thinkingIndicatorMessages,
  ...checkboxGroupMessages,
  ...checkboxMessages,
  ...dialogMessages,
  ...badgeMessages,
  ...kbdMessages,
  ...inputMessages,
  ...tooltipMessages,
  ...inputCopyMessages,
  ...dataTableMessages,
  ...badgeOverflowMessages,
  ...radioGroupMessages,
  ...colorPickerMessages,
  ...popoverMessages,
  ...dropdownMessages,
  ...breadcrumbMessages,
  ...stepperMessages,
  ...chatMessageMessages,
  ...surfacesMessages,
  ...motionMessages,
  ...semanticTokensMessages,
  ...scrollbarsMessages,
  ...inputGroupMessages,
  ...selectMessages,
  ...sliderMessages,
  ...tabsMessages,
  ...cardMessages,
  ...thinkingStepsMessages,
  ...askUserQuestionsMessages,
};

export const metadata: Metadata = {
  metadataBase: new URL("https://zeron-ui.vercel.app"),
  title: "Zeron Design",
  description: "Open Source UI components created by Zeron Design",
};

export default function SourceLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <NextIntlClientProvider locale="en" messages={messages}>
          <AppProviders>{children}</AppProviders>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
