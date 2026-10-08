import Image from "next/image";
import { TRANSFORMATIONS } from "@/lib/transformations";

/**
 * The clients' before and after, above the written reviews.
 *
 * A photo is read in a second and a paragraph is not, so this sits higher on
 * the page than the testimonials. The strip runs edge to edge and snaps,
 * which is the gesture people already use on photos, rather than advancing on
 * its own and moving the card somebody is looking at.
 */
export default function ClientTransformations({ lang }: { lang: "pt" | "en" }) {
  if (TRANSFORMATIONS.length === 0) return null;
  const isEN = lang === "en";

  return (
    <section className="pb-24">
      <div className="max-w-2xl mx-auto px-5">
        <p className="text-center text-xs font-semibold tracking-widest uppercase text-zinc-600 mb-3">
          {isEN ? "Transformations" : "Transformações"}
        </p>
        <h2 className="text-center text-2xl font-black text-white mb-2">
          {isEN ? "People who did the work" : "Pessoas que fizeram o trabalho"}
        </h2>
        <p className="text-center text-sm text-zinc-500 mb-7 max-w-md mx-auto leading-relaxed">
          {isEN
            ? "Real clients, their own numbers, published with their permission."
            : "Clientes reais, com os números deles, publicados com a autorização deles."}
        </p>
      </div>

      <div className="flex gap-4 overflow-x-auto px-5 pb-2 snap-x snap-mandatory [scrollbar-width:none] [&::-webkit-scrollbar]:hidden md:justify-center">
        {TRANSFORMATIONS.map((t) => (
          <figure key={t.image} className="snap-center shrink-0 w-[280px] space-y-3">
            <div
              className="relative w-full overflow-hidden rounded-3xl"
              // The story cards carry empty space under the content, which is
              // fine in a feed and reads as a broken card next to two others.
              // Cropped from the top to where the longest of them ends.
              style={{ aspectRatio: "9/13", border: "1px solid rgba(201,168,76,0.22)" }}
            >
              <Image
                src={`/transformacoes/${t.image}`}
                alt={
                  isEN
                    ? `${t.name}, before and after: ${t.result.en}`
                    : `${t.name}, antes e depois: ${t.result.pt}`
                }
                fill
                sizes="280px"
                className="object-cover object-top"
              />
            </div>
            <figcaption className="px-1 space-y-1">
              <div className="flex items-baseline justify-between gap-2">
                <span className="text-white text-sm font-bold">{t.name}</span>
                <span className="text-sm font-black" style={{ color: "#C9A84C" }}>
                  {isEN ? t.result.en : t.result.pt}
                </span>
              </div>
              <p className="text-xs leading-relaxed text-zinc-400">{isEN ? t.note.en : t.note.pt}</p>
            </figcaption>
          </figure>
        ))}
      </div>
    </section>
  );
}
