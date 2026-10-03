import { getLocale } from "next-intl/server";
import { updatesCopy } from "./updates-copy";
import { UpdatesHistorySkeleton, UpdatesLayout } from "./updates-shell";

export default async function UpdatesLoading() {
  const locale = await getLocale();
  const text = updatesCopy[locale === "en" ? "en" : "zh"];
  return (
    <UpdatesLayout pending title={text.title} description={text.description}>
      <UpdatesHistorySkeleton label={text.loading} />
    </UpdatesLayout>
  );
}
