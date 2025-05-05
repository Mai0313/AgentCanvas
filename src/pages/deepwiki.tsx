import { title } from "@/components/primitives";
import DefaultLayout from "@/layouts/default";

export default function DeepWikiPage() {
  return (
    <DefaultLayout>
      <section className="flex flex-col items-center justify-center gap-4 py-8 md:py-10">
        <div className="inline-block max-w-lg text-center justify-center">
          <h1 className={title()}>Deep Wiki</h1>
          <h2 className="text-2xl font-bold text-center">Coming Soon</h2>
        </div>
      </section>
    </DefaultLayout>
  );
}
