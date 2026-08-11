import Page from "@/app/(source)/docs/card/page";
import { generateDocumentationMetadata, generateDocumentationStaticParams, LocalizedDocumentationPage } from "../_page";
export const generateStaticParams = generateDocumentationStaticParams;
export const generateMetadata = ({ params }: { params: Promise<{ locale: string }> }) => generateDocumentationMetadata("card", params);
export default function Card({ params }: { params: Promise<{ locale: string }> }) { return <LocalizedDocumentationPage slug="card" Page={Page} params={params} />; }
