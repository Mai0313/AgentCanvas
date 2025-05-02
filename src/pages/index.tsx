import { Link } from "@heroui/link";
import { button as buttonStyles } from "@heroui/theme";

import { title, subtitle } from "@/components/primitives";
import DefaultLayout from "@/layouts/default";

export default function IndexPage() {
  return (
    <DefaultLayout>
      <section className="flex flex-col items-center justify-center gap-4 py-8 md:py-10">
        <div className="inline-block max-w-lg text-center justify-center">
          <span className={title()}>Make&nbsp;</span>
          <span className={title({ color: "violet" })}>Agent&nbsp;</span>
          <br />
          <span className={title()}>
            become more&nbsp;
            <span className={title({ color: "violet" })}>interactive</span>
          </span>
          <div className={subtitle({ class: "mt-4" })}>Interactive Chatbot</div>
        </div>

        <div className="flex gap-3">
          <Link
            isExternal
            className={buttonStyles({
              color: "primary",
              radius: "full",
              variant: "shadow",
            })}
            href={"/chat"}
          >
            Quick Start
          </Link>
        </div>
      </section>
    </DefaultLayout>
  );
}
