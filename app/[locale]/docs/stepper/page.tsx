import Page from "@/app/(source)/docs/stepper/page";
import { generateDocumentationMetadata, generateDocumentationStaticParams, LocalizedDocumentationPage } from "../_page";
export const generateStaticParams = generateDocumentationStaticParams;
export const generateMetadata = ({ params }: { params: Promise<{ locale: string }> }) => generateDocumentationMetadata("stepper", params);
export default function Stepper({ params }: { params: Promise<{ locale: string }> }) { return <LocalizedDocumentationPage slug="stepper" Page={Page} params={params} />; }
