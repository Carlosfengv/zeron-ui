import Page from "@/app/(source)/docs/input-copy/page";
import { generateDocumentationMetadata, generateDocumentationStaticParams, LocalizedDocumentationPage } from "../_page";
export const generateStaticParams = generateDocumentationStaticParams;
export const generateMetadata = ({ params }: { params: Promise<{ locale: string }> }) => generateDocumentationMetadata("input-copy", params);
export default function InputCopy({ params }: { params: Promise<{ locale: string }> }) { return <LocalizedDocumentationPage slug="input-copy" Page={Page} params={params} />; }
