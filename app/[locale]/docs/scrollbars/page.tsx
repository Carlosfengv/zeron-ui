import Page from "@/app/(source)/docs/scrollbars/page";
import { generateDocumentationMetadata, generateDocumentationStaticParams, LocalizedDocumentationPage } from "../_page";
export const generateStaticParams = generateDocumentationStaticParams;
export const generateMetadata = ({ params }: { params: Promise<{ locale: string }> }) => generateDocumentationMetadata("scrollbars", params);
export default function Scrollbars({ params }: { params: Promise<{ locale: string }> }) { return <LocalizedDocumentationPage slug="scrollbars" Page={Page} params={params} />; }
