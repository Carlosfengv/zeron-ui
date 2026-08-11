import Page from "@/app/(source)/docs/dropdown/page";
import { generateDocumentationMetadata, generateDocumentationStaticParams, LocalizedDocumentationPage } from "../_page";
export const generateStaticParams = generateDocumentationStaticParams;
export const generateMetadata = ({ params }: { params: Promise<{ locale: string }> }) => generateDocumentationMetadata("dropdown", params);
export default function Dropdown({ params }: { params: Promise<{ locale: string }> }) { return <LocalizedDocumentationPage slug="dropdown" Page={Page} params={params} />; }
