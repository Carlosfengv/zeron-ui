import Page from "@/app/(source)/docs/checkbox-group/page";
import { generateDocumentationMetadata, generateDocumentationStaticParams, LocalizedDocumentationPage } from "../_page";
export const generateStaticParams = generateDocumentationStaticParams;
export const generateMetadata = ({ params }: { params: Promise<{ locale: string }> }) => generateDocumentationMetadata("checkbox-group", params);
export default function CheckboxGroup({ params }: { params: Promise<{ locale: string }> }) { return <LocalizedDocumentationPage slug="checkbox-group" Page={Page} params={params} />; }
