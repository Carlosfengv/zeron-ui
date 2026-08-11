import Page from "@/app/(source)/docs/top-nav/page";
import { generateDocumentationMetadata, generateDocumentationStaticParams, LocalizedDocumentationPage } from "../_page";
export const generateStaticParams = generateDocumentationStaticParams;
export const generateMetadata = ({ params }: { params: Promise<{ locale: string }> }) => generateDocumentationMetadata("top-nav", params);
export default function TopNav({ params }: { params: Promise<{ locale: string }> }) { return <LocalizedDocumentationPage slug="top-nav" Page={Page} params={params} />; }
