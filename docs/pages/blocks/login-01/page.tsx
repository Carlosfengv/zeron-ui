import { getBlockPreviewSource } from "@docs/lib/block-preview-sources.generated";
import { Login01BlockDocClient } from "./Login01BlockDocClient";

export default function Login01BlockDoc() {
  return <Login01BlockDocClient code={getBlockPreviewSource("login-01")} />;
}
