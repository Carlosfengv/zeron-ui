import Page from "@/app/(source)/docs/chat-message/page";
import { generateDocumentationMetadata, generateDocumentationStaticParams, LocalizedDocumentationPage } from "../_page";
export const generateStaticParams = generateDocumentationStaticParams;
export const generateMetadata = ({ params }: { params: Promise<{ locale: string }> }) => generateDocumentationMetadata("chat-message", params);
export default function ChatMessage({ params }: { params: Promise<{ locale: string }> }) { return <LocalizedDocumentationPage slug="chat-message" Page={Page} params={params} />; }
