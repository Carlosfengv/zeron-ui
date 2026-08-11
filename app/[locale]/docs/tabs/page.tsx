import Page from "@/app/(source)/docs/tabs/page";
import { generateDocumentationMetadata, generateDocumentationStaticParams, LocalizedDocumentationPage } from "../_page";
export const generateStaticParams = generateDocumentationStaticParams;
export const generateMetadata = ({ params }: { params: Promise<{ locale: string }> }) => generateDocumentationMetadata("tabs", params);
export default function Tabs({ params }: { params: Promise<{ locale: string }> }) { return <LocalizedDocumentationPage slug="tabs" Page={Page} params={params} />; }
