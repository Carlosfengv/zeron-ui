import { docOrder } from "@/docs/components";
import { InstallCommand } from "@/docs/InstallCommand";
import { IntroPager } from "@/docs/IntroPager";

export default function DocsIndex() {
  const firstComponent = docOrder[0];

  return (
    <div className="flex flex-col gap-8 px-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1
            className="text-[22px] sm:text-[28px] text-foreground leading-none mb-2 font-bold"
          >
            Introduction
          </h1>
          <p className="text-[13px] text-muted-foreground">
            Why these components feel different.
          </p>
        </div>
        {firstComponent && <IntroPager nextSlug={firstComponent.slug} nextName={firstComponent.name} />}
      </div>

      <section className="flex flex-col gap-6 text-[14px] text-foreground/90 leading-relaxed">
        <div className="flex flex-col gap-2">
          <h3
            className="text-[16px] text-foreground leading-none font-semibold"
          >
            Motion that communicates
          </h3>
          <p>
            Every animation here points at something. When two list items
            merge their backgrounds, the component tells you they belong
            together. The hover highlight follows your cursor before you
            click, so the row you&apos;re about to land on confirms
            itself first. Motion has a job to create meaning.
          </p>
        </div>

        <div className="flex flex-col gap-2">
          <h3
            className="text-[16px] text-foreground leading-none font-semibold"
          >
            Hover as preview
          </h3>
          <p>
            The interaction starts before you click. The closest
            interactive thing to your cursor gets a faint highlight;
            buttons gain a little weight as you approach. By the time
            your finger lands, you&apos;ve had a moment to reconsider,
            which is mostly the point.
          </p>
        </div>

        <div className="flex flex-col gap-2">
          <h3
            className="text-[16px] text-foreground leading-none font-semibold"
          >
            Spring physics, not durations
          </h3>
          <p>
            Animations use springs, not fixed-duration eases. Toggle a
            switch and immediately toggle it back: the spring picks up
            wherever it was and reverses, instead of finishing the first
            animation before starting the second. Three presets, named
            fast, moderate, and slow, cover most of the library.
          </p>
        </div>

        <div className="flex flex-col gap-2">
          <h3
            className="text-[16px] text-foreground leading-none font-semibold"
          >
            Drop-in compatible
          </h3>
          <p>
            Built on shadcn/ui and Base UI. Your theme tokens
            (colors, radii, fonts) work as-is. One CLI command installs
            a component along with whatever it needs.
          </p>
        </div>

        <div className="flex flex-col gap-2">
          <h3
            className="text-[16px] text-foreground leading-none font-semibold"
          >
            Customize using the right panel
          </h3>
          <p>
            The panel on the right lets you change things on the fly.
            Switch between light and dark mode, adjust the brand color, and
            toggle the corner radius from rounded to pill. Press T or R to
            change theme and radius from the keyboard.
          </p>
        </div>
      </section>

      <hr className="border-border/60 my-8" />
      <div className="flex flex-col gap-3 mb-4">
        <h2
          className="text-[16px] text-foreground leading-none font-semibold"
        >
          Installation
        </h2>
        <div className="flex flex-col gap-2 mt-2">
          <p className="text-[13px] text-muted-foreground flex items-center gap-2 ml-1">
            <span className="inline-flex items-center justify-center size-[18px] rounded-full bg-muted text-muted-foreground text-[11px] shrink-0 font-medium">1</span>
            Initialize a project that does not have components.json:
          </p>
          <InstallCommand value="npx zeron-ui init" compact />
        </div>
        <div className="flex flex-col gap-2 mt-2">
          <p className="text-[13px] text-muted-foreground flex items-center gap-2 ml-1">
            <span className="inline-flex items-center justify-center size-[18px] rounded-full bg-muted text-muted-foreground text-[11px] shrink-0 font-medium">2</span>
            Install any component:
          </p>
          <InstallCommand value="npx zeron-ui add button" compact />
        </div>
        <hr className="border-border/60 mt-4" />
        <p className="text-[13px] text-muted-foreground">
          Or use the shadcn-compatible Registry directly:
        </p>
        <InstallCommand value="npx shadcn@latest add https://www.zerondesign.com/r/button.json" compact />
        <p className="text-[13px] text-muted-foreground">
          Dependencies and shared utilities are resolved automatically.
          Font weight animations require the Inter variable font.
        </p>
      </div>

      <hr className="border-border/60 my-8" />
      <div className="flex flex-col gap-3 mb-4">
        <h2
          className="text-[16px] text-foreground leading-none font-semibold"
        >
          Icons
        </h2>
        <p className="text-[13px] text-muted-foreground">
          Components render named icon slots with HugeIcons defaults. The
          shared icon provider remains available for product-specific
          overrides, while the documentation site ships only the HugeIcons
          implementation.
        </p>
      </div>
    </div>
  );
}
