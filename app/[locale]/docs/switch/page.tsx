import Page from "@/app/(source)/docs/switch/page";
import { generateDocumentationMetadata, generateDocumentationStaticParams, LocalizedDocumentationPage } from "../_page";
export const generateStaticParams = generateDocumentationStaticParams;
export const generateMetadata = ({ params }: { params: Promise<{ locale: string }> }) => generateDocumentationMetadata("switch", params);
export default function Switch({ params }: { params: Promise<{ locale: string }> }) { return <LocalizedDocumentationPage slug="switch" Page={Page} params={params} />; }
