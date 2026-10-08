import BeforeAfterSlider from "@/components/BeforeAfterSlider";
import { TRANSFORMATIONS } from "@/lib/transformations";

/**
 * The clients' own before and after, next to the coach's.
 *
 * Not an auto-advancing carousel, deliberately: each card is a slider the
 * visitor drags, and a strip that moves on its own pulls the photo out from
 * under the thumb. On a phone it scrolls sideways and snaps, which is the
 * gesture people already expect from photos.
 */
export default function ClientTransformations({ lang }: { lang: "pt" | "en" }) {
  if (TRANSFORMATIONS.length === 0) return null;
  const isEN = lang === "en";

  return (
    <section className="pb-20">
      <div className="max-w-2xl mx-auto px-5">
        <p className="text-center text-xs font-semibold tracking-widest uppercase text-zinc-600 mb-3">
          {isEN ? "Transformations" : "Transformações"}
        </p>
        <h2 className="text-center text-2xl font-black text-white mb-2">
          {isEN ? "People who did the work" : "Pessoas que fizeram o trabalho"}
        </h2>
        <p className="text-center text-sm text-zinc-500 mb-7 max-w-md mx-auto leading-relaxed">
          {isEN
            ? "Published with their permission. Drag each photo to compare."
            : "Publicadas com a autorização deles. Arrasta cada foto para comparares."}
        </p>
      </div>

      <div
        className="flex gap-4 overflow-x-auto px-5 pb-3 snap-x snap-mandatory sm:justify-center"
        style={{ scrollbarWidth: "none" }}
      >
        {TRANSFORMATIONS.map((t) => (
          <figure
            key={t.name + t.result}
            className="snap-center shrink-0 w-[270px] rounded-3xl p-4 space-y-3"
            style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}
          >
            <BeforeAfterSlider
              beforeUrl={`/transformacoes/${t.before}`}
              afterUrl={`/transformacoes/${t.after}`}
              beforeLabel={isEN ? "Before" : "Antes"}
              afterLabel={isEN ? "After" : "Depois"}
              aspectRatio="4/5"
            />
            <figcaption className="space-y-1">
              <div className="flex items-baseline justify-between gap-2">
                <span className="text-white text-sm font-bold">{t.name}</span>
                <span className="text-[11px] text-zinc-500">{isEN ? t.duration.en : t.duration.pt}</span>
              </div>
              <p className="text-lg font-black" style={{ color: "#C9A84C" }}>{t.result}</p>
              <p className="text-xs leading-relaxed text-zinc-400">{isEN ? t.note.en : t.note.pt}</p>
            </figcaption>
          </figure>
        ))}
      </div>
    </section>
  );
}
