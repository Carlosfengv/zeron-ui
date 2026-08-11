import Page from "@/app/(source)/docs/data-table/page";
import { generateDocumentationMetadata, generateDocumentationStaticParams, LocalizedDocumentationPage } from "../_page";
export const generateStaticParams = generateDocumentationStaticParams;
export const generateMetadata = ({ params }: { params: Promise<{ locale: string }> }) => generateDocumentationMetadata("data-table", params);
export default function DataTable({ params }: { params: Promise<{ locale: string }> }) { return <LocalizedDocumentationPage slug="data-table" Page={Page} params={params} />; }
