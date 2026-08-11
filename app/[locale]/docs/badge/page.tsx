import Page from "@/app/(source)/docs/badge/page";
import { generateDocumentationMetadata, generateDocumentationStaticParams, LocalizedDocumentationPage } from "../_page";
export const generateStaticParams = generateDocumentationStaticParams;
export const generateMetadata = ({ params }: { params: Promise<{ locale: string }> }) => generateDocumentationMetadata("badge", params);
export default function Badge({ params }: { params: Promise<{ locale: string }> }) { return <LocalizedDocumentationPage slug="badge" Page={Page} params={params} />; }
