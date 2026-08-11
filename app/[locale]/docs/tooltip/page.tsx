import Page from "@/app/(source)/docs/tooltip/page";
import { generateDocumentationMetadata, generateDocumentationStaticParams, LocalizedDocumentationPage } from "../_page";
export const generateStaticParams = generateDocumentationStaticParams;
export const generateMetadata = ({ params }: { params: Promise<{ locale: string }> }) => generateDocumentationMetadata("tooltip", params);
export default function Tooltip({ params }: { params: Promise<{ locale: string }> }) { return <LocalizedDocumentationPage slug="tooltip" Page={Page} params={params} />; }
