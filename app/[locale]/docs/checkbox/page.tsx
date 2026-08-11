import Page from "@/app/(source)/docs/checkbox/page";
import { generateDocumentationMetadata, generateDocumentationStaticParams, LocalizedDocumentationPage } from "../_page";
export const generateStaticParams = generateDocumentationStaticParams;
export const generateMetadata = ({ params }: { params: Promise<{ locale: string }> }) => generateDocumentationMetadata("checkbox", params);
export default function Checkbox({ params }: { params: Promise<{ locale: string }> }) { return <LocalizedDocumentationPage slug="checkbox" Page={Page} params={params} />; }
