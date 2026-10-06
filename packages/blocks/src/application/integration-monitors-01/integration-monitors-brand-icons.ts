import asana from "@thesvg/icons/asana";
import atlassian from "@thesvg/icons/atlassian";
import coda from "@thesvg/icons/coda";
import confluence from "@thesvg/icons/confluence";
import dropbox from "@thesvg/icons/dropbox";
import figma from "@thesvg/icons/figma";
import github from "@thesvg/icons/github";
import jira from "@thesvg/icons/jira";
import linear from "@thesvg/icons/linear";
import loom from "@thesvg/icons/loom";
import mailchimp from "@thesvg/icons/mailchimp";
import notion from "@thesvg/icons/notion";
import sentry from "@thesvg/icons/sentry";
import slack from "@thesvg/icons/slack";
import square from "@thesvg/icons/square";
import stripe from "@thesvg/icons/stripe";
import surveymonkey from "@thesvg/icons/surveymonkey";
import vercel from "@thesvg/icons/vercel";

// Only bundled, trusted artwork is rendered inline. Monochrome marks inherit
// the surrounding semantic foreground so they remain visible in both themes.
function monochrome(icon: { svg: string; variants: Record<string, string> }, color = "currentColor") {
  return { svg: (icon.variants.mono ?? icon.svg).replace("<svg ", `<svg fill="${color}" `) };
}

export const integrationMonitorBrandIcons: Readonly<Record<string, { svg: string } | undefined>> = {
  asana,
  atlassian,
  coda,
  confluence: monochrome(confluence),
  dropbox,
  figma,
  github: monochrome(github),
  jira,
  linear,
  loom,
  mailchimp: monochrome(mailchimp),
  notion: monochrome(notion),
  sentry: monochrome(sentry),
  slack,
  square: monochrome(square),
  stripe: monochrome(stripe, `#${stripe.hex}`),
  surveymonkey,
  vercel: monochrome(vercel),
};
