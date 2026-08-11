import Page from "@/app/(source)/docs/sidebar/page";
import { generateDocumentationMetadata, generateDocumentationStaticParams, LocalizedDocumentationPage } from "../_page";
export const generateStaticParams = generateDocumentationStaticParams;
export const generateMetadata = ({ params }: { params: Promise<{ locale: string }> }) => generateDocumentationMetadata("sidebar", params);
export default function Sidebar({ params }: { params: Promise<{ locale: string }> }) { return <LocalizedDocumentationPage slug="sidebar" Page={Page} params={params} />; }
