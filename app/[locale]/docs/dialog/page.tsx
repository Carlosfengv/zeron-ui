import Page from "@/app/(source)/docs/dialog/page";
import { generateDocumentationMetadata, generateDocumentationStaticParams, LocalizedDocumentationPage } from "../_page";
export const generateStaticParams = generateDocumentationStaticParams;
export const generateMetadata = ({ params }: { params: Promise<{ locale: string }> }) => generateDocumentationMetadata("dialog", params);
export default function Dialog({ params }: { params: Promise<{ locale: string }> }) { return <LocalizedDocumentationPage slug="dialog" Page={Page} params={params} />; }
