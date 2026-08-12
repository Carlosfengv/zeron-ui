import Page from "@/app/(source)/docs/info-item/page";
import {
  generateDocumentationMetadata,
  generateDocumentationStaticParams,
  LocalizedDocumentationPage,
} from "../_page";

export const generateStaticParams = generateDocumentationStaticParams;

export const generateMetadata = ({
  params,
}: {
  params: Promise<{ locale: string }>;
}) => generateDocumentationMetadata("info-item", params);

export default function InfoItem({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  return <LocalizedDocumentationPage slug="info-item" Page={Page} params={params} />;
}
