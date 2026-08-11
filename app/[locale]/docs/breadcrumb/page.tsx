import Page from "@/app/(source)/docs/breadcrumb/page";
import { generateDocumentationMetadata, generateDocumentationStaticParams, LocalizedDocumentationPage } from "../_page";
export const generateStaticParams = generateDocumentationStaticParams;
export const generateMetadata = ({ params }: { params: Promise<{ locale: string }> }) => generateDocumentationMetadata("breadcrumb", params);
export default function Breadcrumb({ params }: { params: Promise<{ locale: string }> }) { return <LocalizedDocumentationPage slug="breadcrumb" Page={Page} params={params} />; }
