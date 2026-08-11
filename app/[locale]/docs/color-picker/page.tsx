import Page from "@/app/(source)/docs/color-picker/page";
import { generateDocumentationMetadata, generateDocumentationStaticParams, LocalizedDocumentationPage } from "../_page";
export const generateStaticParams = generateDocumentationStaticParams;
export const generateMetadata = ({ params }: { params: Promise<{ locale: string }> }) => generateDocumentationMetadata("color-picker", params);
export default function ColorPicker({ params }: { params: Promise<{ locale: string }> }) { return <LocalizedDocumentationPage slug="color-picker" Page={Page} params={params} />; }
