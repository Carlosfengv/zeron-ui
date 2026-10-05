/** A real, ASCII PDF with deterministic content and matching displayed file size. */
export function createTransactionDemoPdf(): Uint8Array {
  const commands = "BT /F1 18 Tf 48 740 Td (DEMONSTRATION - not a payment receipt) Tj 0 -40 Td /F1 14 Tf (Invoice INV-1430) Tj 0 -28 Td (Amount: USD 23,000.00) Tj 0 -28 Td (Sender: Lily Hayes) Tj 0 -28 Td (Transaction: txn-1430) Tj ET\n";
  function build(padding: number) {
    const stream = commands + " ".repeat(padding);
    const objects = ["<< /Type /Catalog /Pages 2 0 R >>", "<< /Type /Pages /Kids [3 0 R] /Count 1 >>", "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>", "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>", `<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`];
    let source = "%PDF-1.4\n";
    const offsets: number[] = [];
    objects.forEach((object, index) => { offsets.push(source.length); source += `${index + 1} 0 obj\n${object}\nendobj\n`; });
    const xref = source.length;
    source += `xref\n0 6\n0000000000 65535 f \n${offsets.map((offset) => `${String(offset).padStart(10, "0")} 00000 n \n`).join("")}trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`;
    return source;
  }
  let padding = 347000 - build(0).length;
  for (let attempt = 0; attempt < 3; attempt++) padding += 347000 - build(padding).length;
  return new TextEncoder().encode(build(padding));
}
