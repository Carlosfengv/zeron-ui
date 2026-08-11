import Page from "@/app/(source)/docs/motion/page";
import { generateDocumentationMetadata, generateDocumentationStaticParams, LocalizedDocumentationPage } from "../_page";
export const generateStaticParams = generateDocumentationStaticParams;
export const generateMetadata = ({ params }: { params: Promise<{ locale: string }> }) => generateDocumentationMetadata("motion", params);
export default function Motion({ params }: { params: Promise<{ locale: string }> }) { return <LocalizedDocumentationPage slug="motion" Page={Page} params={params} />; }
