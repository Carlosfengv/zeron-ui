import Page from "@/app/(source)/docs/popover/page";
import { generateDocumentationMetadata, generateDocumentationStaticParams, LocalizedDocumentationPage } from "../_page";
export const generateStaticParams = generateDocumentationStaticParams;
export const generateMetadata = ({ params }: { params: Promise<{ locale: string }> }) => generateDocumentationMetadata("popover", params);
export default function Popover({ params }: { params: Promise<{ locale: string }> }) { return <LocalizedDocumentationPage slug="popover" Page={Page} params={params} />; }
