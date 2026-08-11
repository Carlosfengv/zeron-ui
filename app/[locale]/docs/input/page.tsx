import Page from "@/app/(source)/docs/input/page";
import { generateDocumentationMetadata, generateDocumentationStaticParams, LocalizedDocumentationPage } from "../_page";
export const generateStaticParams = generateDocumentationStaticParams;
export const generateMetadata = ({ params }: { params: Promise<{ locale: string }> }) => generateDocumentationMetadata("input", params);
export default function Input({ params }: { params: Promise<{ locale: string }> }) { return <LocalizedDocumentationPage slug="input" Page={Page} params={params} />; }
