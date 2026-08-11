import Page from "@/app/(source)/docs/input-group/page";
import { generateDocumentationMetadata, generateDocumentationStaticParams, LocalizedDocumentationPage } from "../_page";
export const generateStaticParams = generateDocumentationStaticParams;
export const generateMetadata = ({ params }: { params: Promise<{ locale: string }> }) => generateDocumentationMetadata("input-group", params);
export default function InputGroup({ params }: { params: Promise<{ locale: string }> }) { return <LocalizedDocumentationPage slug="input-group" Page={Page} params={params} />; }
