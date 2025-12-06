export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-void-deep flex items-center justify-center">
      <div className="w-full max-w-md px-4">{children}</div>
    </div>
  );
}
