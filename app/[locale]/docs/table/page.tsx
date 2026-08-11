import Page from "@/app/(source)/docs/table/page";
import { generateDocumentationMetadata, generateDocumentationStaticParams, LocalizedDocumentationPage } from "../_page";
export const generateStaticParams = generateDocumentationStaticParams;
export const generateMetadata = ({ params }: { params: Promise<{ locale: string }> }) => generateDocumentationMetadata("table", params);
export default function Table({ params }: { params: Promise<{ locale: string }> }) { return <LocalizedDocumentationPage slug="table" Page={Page} params={params} />; }
