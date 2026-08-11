import Page from "@/app/(source)/docs/radio-group/page";
import { generateDocumentationMetadata, generateDocumentationStaticParams, LocalizedDocumentationPage } from "../_page";
export const generateStaticParams = generateDocumentationStaticParams;
export const generateMetadata = ({ params }: { params: Promise<{ locale: string }> }) => generateDocumentationMetadata("radio-group", params);
export default function RadioGroup({ params }: { params: Promise<{ locale: string }> }) { return <LocalizedDocumentationPage slug="radio-group" Page={Page} params={params} />; }
