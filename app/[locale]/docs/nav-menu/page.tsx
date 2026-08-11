import Page from "@/app/(source)/docs/nav-menu/page";
import { generateDocumentationMetadata, generateDocumentationStaticParams, LocalizedDocumentationPage } from "../_page";
export const generateStaticParams = generateDocumentationStaticParams;
export const generateMetadata = ({ params }: { params: Promise<{ locale: string }> }) => generateDocumentationMetadata("nav-menu", params);
export default function NavMenu({ params }: { params: Promise<{ locale: string }> }) { return <LocalizedDocumentationPage slug="nav-menu" Page={Page} params={params} />; }
