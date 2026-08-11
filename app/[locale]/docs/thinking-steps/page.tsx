import Page from "@/app/(source)/docs/thinking-steps/page";
import { generateDocumentationMetadata, generateDocumentationStaticParams, LocalizedDocumentationPage } from "../_page";
export const generateStaticParams = generateDocumentationStaticParams;
export const generateMetadata = ({ params }: { params: Promise<{ locale: string }> }) => generateDocumentationMetadata("thinking-steps", params);
export default function ThinkingSteps({ params }: { params: Promise<{ locale: string }> }) { return <LocalizedDocumentationPage slug="thinking-steps" Page={Page} params={params} />; }
