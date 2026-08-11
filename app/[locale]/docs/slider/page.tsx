import Page from "@/app/(source)/docs/slider/page";
import { generateDocumentationMetadata, generateDocumentationStaticParams, LocalizedDocumentationPage } from "../_page";
export const generateStaticParams = generateDocumentationStaticParams;
export const generateMetadata = ({ params }: { params: Promise<{ locale: string }> }) => generateDocumentationMetadata("slider", params);
export default function Slider({ params }: { params: Promise<{ locale: string }> }) { return <LocalizedDocumentationPage slug="slider" Page={Page} params={params} />; }
