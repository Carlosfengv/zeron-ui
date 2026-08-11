import Page from "@/app/(source)/docs/semantic-tokens/page";
import { generateDocumentationMetadata, generateDocumentationStaticParams, LocalizedDocumentationPage } from "../_page";
export const generateStaticParams = generateDocumentationStaticParams;
export const generateMetadata = ({ params }: { params: Promise<{ locale: string }> }) => generateDocumentationMetadata("semantic-tokens", params);
export default function SemanticTokens({ params }: { params: Promise<{ locale: string }> }) { return <LocalizedDocumentationPage slug="semantic-tokens" Page={Page} params={params} />; }
