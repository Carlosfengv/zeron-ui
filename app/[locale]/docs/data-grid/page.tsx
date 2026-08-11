import Page from "@/app/(source)/docs/data-grid/page";
import { generateDocumentationMetadata, generateDocumentationStaticParams, LocalizedDocumentationPage } from "../_page";
export const generateStaticParams = generateDocumentationStaticParams;
export const generateMetadata = ({ params }: { params: Promise<{ locale: string }> }) => generateDocumentationMetadata("data-grid", params);
export default function DataGrid({ params }: { params: Promise<{ locale: string }> }) { return <LocalizedDocumentationPage slug="data-grid" Page={Page} params={params} />; }
