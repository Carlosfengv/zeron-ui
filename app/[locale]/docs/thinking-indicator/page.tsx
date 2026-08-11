import Page from "@/app/(source)/docs/thinking-indicator/page";
import { generateDocumentationMetadata, generateDocumentationStaticParams, LocalizedDocumentationPage } from "../_page";
export const generateStaticParams = generateDocumentationStaticParams;
export const generateMetadata = ({ params }: { params: Promise<{ locale: string }> }) => generateDocumentationMetadata("thinking-indicator", params);
export default function ThinkingIndicator({ params }: { params: Promise<{ locale: string }> }) { return <LocalizedDocumentationPage slug="thinking-indicator" Page={Page} params={params} />; }
