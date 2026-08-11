import Page from "@/app/(source)/docs/kbd/page";
import { generateDocumentationMetadata, generateDocumentationStaticParams, LocalizedDocumentationPage } from "../_page";
export const generateStaticParams = generateDocumentationStaticParams;
export const generateMetadata = ({ params }: { params: Promise<{ locale: string }> }) => generateDocumentationMetadata("kbd", params);
export default function Kbd({ params }: { params: Promise<{ locale: string }> }) { return <LocalizedDocumentationPage slug="kbd" Page={Page} params={params} />; }
