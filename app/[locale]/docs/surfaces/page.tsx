import Page from "@/app/(source)/docs/surfaces/page";
import { generateDocumentationMetadata, generateDocumentationStaticParams, LocalizedDocumentationPage } from "../_page";
export const generateStaticParams = generateDocumentationStaticParams;
export const generateMetadata = ({ params }: { params: Promise<{ locale: string }> }) => generateDocumentationMetadata("surfaces", params);
export default function Surfaces({ params }: { params: Promise<{ locale: string }> }) { return <LocalizedDocumentationPage slug="surfaces" Page={Page} params={params} />; }
