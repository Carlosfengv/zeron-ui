import Page from "@/app/(source)/docs/ask-user-questions/page";
import { generateDocumentationMetadata, generateDocumentationStaticParams, LocalizedDocumentationPage } from "../_page";
export const generateStaticParams = generateDocumentationStaticParams;
export const generateMetadata = ({ params }: { params: Promise<{ locale: string }> }) => generateDocumentationMetadata("ask-user-questions", params);
export default function AskUserQuestions({ params }: { params: Promise<{ locale: string }> }) { return <LocalizedDocumentationPage slug="ask-user-questions" Page={Page} params={params} />; }
