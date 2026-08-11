import Page from "@/app/(source)/docs/accordion/page";
import { generateDocumentationMetadata, generateDocumentationStaticParams, LocalizedDocumentationPage } from "../_page";
export const generateStaticParams = generateDocumentationStaticParams;
export const generateMetadata = ({ params }: { params: Promise<{ locale: string }> }) => generateDocumentationMetadata("accordion", params);
export default function Accordion({ params }: { params: Promise<{ locale: string }> }) { return <LocalizedDocumentationPage slug="accordion" Page={Page} params={params} />; }
