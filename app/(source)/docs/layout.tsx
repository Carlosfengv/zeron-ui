export default function DocsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="py-20 sm:py-28 w-full max-w-[960px] mx-auto mt-12 lg:mt-0">
      {children}
    </div>
  );
}
