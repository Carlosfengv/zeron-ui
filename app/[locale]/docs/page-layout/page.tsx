import Page from "@/app/(source)/docs/page-layout/page";
import { generateDocumentationMetadata, generateDocumentationStaticParams, LocalizedDocumentationPage } from "../_page";
export const generateStaticParams = generateDocumentationStaticParams;
export const generateMetadata = ({ params }: { params: Promise<{ locale: string }> }) => generateDocumentationMetadata("page-layout", params);
export default function PageLayout({ params }: { params: Promise<{ locale: string }> }) { return <LocalizedDocumentationPage slug="page-layout" Page={Page} params={params} />; }
