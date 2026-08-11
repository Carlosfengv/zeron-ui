import Page from "@/app/(source)/docs/button/page";
import { generateDocumentationMetadata, generateDocumentationStaticParams, LocalizedDocumentationPage } from "../_page";
export const generateStaticParams = generateDocumentationStaticParams;
export const generateMetadata = ({ params }: { params: Promise<{ locale: string }> }) => generateDocumentationMetadata("button", params);
export default function Button({ params }: { params: Promise<{ locale: string }> }) { return <LocalizedDocumentationPage slug="button" Page={Page} params={params} />; }
