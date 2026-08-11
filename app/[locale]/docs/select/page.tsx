import Page from "@/app/(source)/docs/select/page";
import { generateDocumentationMetadata, generateDocumentationStaticParams, LocalizedDocumentationPage } from "../_page";
export const generateStaticParams = generateDocumentationStaticParams;
export const generateMetadata = ({ params }: { params: Promise<{ locale: string }> }) => generateDocumentationMetadata("select", params);
export default function Select({ params }: { params: Promise<{ locale: string }> }) { return <LocalizedDocumentationPage slug="select" Page={Page} params={params} />; }
