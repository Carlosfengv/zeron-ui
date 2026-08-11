import Page from "@/app/(source)/docs/input-message/page";
import { generateDocumentationMetadata, generateDocumentationStaticParams, LocalizedDocumentationPage } from "../_page";
export const generateStaticParams = generateDocumentationStaticParams;
export const generateMetadata = ({ params }: { params: Promise<{ locale: string }> }) => generateDocumentationMetadata("input-message", params);
export default function InputMessage({ params }: { params: Promise<{ locale: string }> }) { return <LocalizedDocumentationPage slug="input-message" Page={Page} params={params} />; }
