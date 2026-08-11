import Page from "@/app/(source)/docs/app-shell/page";
import { generateDocumentationMetadata, generateDocumentationStaticParams, LocalizedDocumentationPage } from "../_page";
export const generateStaticParams = generateDocumentationStaticParams;
export const generateMetadata = ({ params }: { params: Promise<{ locale: string }> }) => generateDocumentationMetadata("app-shell", params);
export default function AppShell({ params }: { params: Promise<{ locale: string }> }) { return <LocalizedDocumentationPage slug="app-shell" Page={Page} params={params} />; }
