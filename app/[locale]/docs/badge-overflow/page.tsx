import Page from "@/app/(source)/docs/badge-overflow/page";
import { generateDocumentationMetadata, generateDocumentationStaticParams, LocalizedDocumentationPage } from "../_page";
export const generateStaticParams = generateDocumentationStaticParams;
export const generateMetadata = ({ params }: { params: Promise<{ locale: string }> }) => generateDocumentationMetadata("badge-overflow", params);
export default function BadgeOverflow({ params }: { params: Promise<{ locale: string }> }) { return <LocalizedDocumentationPage slug="badge-overflow" Page={Page} params={params} />; }
