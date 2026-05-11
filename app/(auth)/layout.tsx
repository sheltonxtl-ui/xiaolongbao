import Link from "next/link";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-full bg-white text-neutral-950">
      <div className="mx-auto flex min-h-full max-w-lg flex-col px-4 py-10 sm:px-6 sm:py-14">
        <Link
          href="/"
          className="mb-10 text-sm font-semibold tracking-tight text-neutral-950 hover:opacity-70"
        >
          xiaolongbao
        </Link>
        <div className="flex flex-1 flex-col items-center justify-center pb-8">
          {children}
        </div>
      </div>
    </div>
  );
}
