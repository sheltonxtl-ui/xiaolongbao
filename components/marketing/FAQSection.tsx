type FAQItem = { question: string; answer: string };

type FAQSectionProps = {
  title?: string;
  subtitle?: string;
  items: FAQItem[];
};

export function FAQSection({
  title = "Frequently asked questions",
  subtitle,
  items,
}: FAQSectionProps) {
  return (
    <section className="py-16 sm:py-24" aria-labelledby="faq-heading">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2
            id="faq-heading"
            className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl"
          >
            {title}
          </h2>
          {subtitle ? (
            <p className="mt-4 text-lg text-zinc-600 dark:text-zinc-400">{subtitle}</p>
          ) : null}
        </div>
        <div className="mx-auto mt-12 max-w-3xl divide-y divide-zinc-200 dark:divide-zinc-800">
          {items.map((item) => (
            <details
              key={item.question}
              className="group py-4 first:pt-0 [&_summary::-webkit-details-marker]:hidden"
            >
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-left font-semibold text-foreground">
                {item.question}
                <span className="text-zinc-400 transition group-open:rotate-180">▼</span>
              </summary>
              <p className="mt-3 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
                {item.answer}
              </p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
