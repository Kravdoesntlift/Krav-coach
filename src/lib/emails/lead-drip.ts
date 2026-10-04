import { priceLabel } from "@/lib/billing/tiers";
import { ebookPrice } from "@/lib/ebook/price";

/**
 * The three emails every lead receives after the free guide.
 *
 * They live outside the route because a route file may only export handlers,
 * and because an email nobody can render without sending it is an email nobody
 * ever checks. Prices come from the tier table and the book's price module, so
 * the sequence cannot keep quoting a number we no longer charge: it spent its
 * first months sending every lead straight at the most expensive thing we
 * sell, with nothing in between.
 */

/* ─── Email templates ─────────────────────────────────────────────────────────
   Intentionally plain, look like a personal email, not a newsletter.
   Short paragraphs, no images, no big headers.
────────────────────────────────────────────────────────────────────────────── */

function wrap(body: string, unsubUrl: string) {
  return `<!DOCTYPE html>
<html lang="pt">
<head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1.0"/></head>
<body style="margin:0;padding:0;background:#f9f9f9;">
<table width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#f9f9f9">
  <tr><td align="center" style="padding:40px 16px;">
    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:480px;">
      <tr>
        <td bgcolor="#ffffff" style="background:#ffffff;border-radius:12px;padding:36px 36px 32px;border:1px solid #ebebeb;">
          <p style="margin:0 0 24px 0;font-size:11px;font-weight:700;letter-spacing:0.2em;text-transform:uppercase;color:#C9A84C;font-family:Helvetica,Arial,sans-serif;">KRAV COACH</p>
          ${body}
          <p style="margin:32px 0 0;font-size:12px;color:#bbb;font-family:Helvetica,Arial,sans-serif;border-top:1px solid #f0f0f0;padding-top:20px;line-height:1.6;">
            Recebeste este email porque pediste o guia gratuito em kravcoaching.com<br>
            <a href="${unsubUrl}" style="color:#bbb;text-decoration:underline;">Cancelar subscrição destes emails</a>
          </p>
        </td>
      </tr>
    </table>
  </td></tr>
</table>
</body>
</html>`;
}

function p(text: string, style = "") {
  return `<p style="margin:0 0 18px 0;font-size:15px;color:#222222;line-height:1.7;font-family:Helvetica,Arial,sans-serif;${style}">${text}</p>`;
}

function link(href: string, text: string) {
  return `<a href="${href}" style="color:#C9A84C;text-decoration:none;font-weight:600;">${text}</a>`;
}

export type Lang = "pt" | "en";

export const SUBJECTS: Record<number, Record<Lang, string>> = {
  0: { pt: "Já leste?", en: "Did you read it?" },
  1: { pt: "O Guilherme", en: "About Guilherme" },
  2: { pt: "último email", en: "last email" },
};



const IG = "https://www.instagram.com/kravdoesntlift";
const SITE = "https://www.kravcoaching.com";
const EBOOK = `${SITE}/ebook`;
const START = `${SITE}/start`;

// ── Email 2: day 3 ────────────────────────────────────────────────────────────
export function email2(firstName: string, unsubUrl: string, lang: Lang) {
  const body = lang === "en"
    ? `
    ${p(`Hi ${firstName},`)}
    ${p("have you had a chance to open the guide?")}
    ${p("Most people download it, find it interesting, and then life carries on exactly the same. It is not a willpower problem. The guide gives you the principles and one example week, and then you are on your own deciding what week two looks like.")}
    ${p(`That is the part I wrote the book for: thirteen weeks in three blocks, with the progression rule written out for every exercise, gym version and home version. It is €${ebookPrice("en")}, it arrives by email in seconds, and there is no subscription attached: ${link(EBOOK, "the 90 Days programme")}.`)}
    ${p(`If you would rather just talk about where you are, reply here or message me on Instagram ${link(IG, "@kravdoesntlift")}.`)}
    ${p("André", "margin-bottom:0;")}
  `
    : `
    ${p(`Olá ${firstName},`)}
    ${p("já tiveste tempo de abrir o guia?")}
    ${p("A maioria das pessoas descarrega, acha interessante e depois a vida continua igual. Não é falta de vontade. O guia dá-te os princípios e uma semana de exemplo, e depois ficas sozinho a decidir como é a semana dois.")}
    ${p(`Foi para essa parte que escrevi o livro: treze semanas em três blocos, com a regra de progressão escrita para cada exercício, versão de ginásio e versão de casa. São €${ebookPrice("pt")}, chega ao email em segundos e não tem subscrição nenhuma agarrada: ${link(EBOOK, "o programa 90 Dias")}.`)}
    ${p(`Se preferires só falar sobre a tua situação, responde aqui ou fala comigo no Instagram ${link(IG, "@kravdoesntlift")}.`)}
    ${p("André", "margin-bottom:0;")}
  `;
  return wrap(body, unsubUrl);
}

// ── Email 3: day 7 ────────────────────────────────────────────────────────────
export function email3(firstName: string, unsubUrl: string, lang: Lang) {
  const body = lang === "en"
    ? `
    ${p(`Hi ${firstName},`)}
    ${p("Guilherme came to me at 67kg. He had been training for two years and knew what he was doing. His body just would not respond.")}
    ${p("He put on 20kg. With the physique he always wanted.")}
    ${p("It was not magic. It was having someone look at the numbers every week and adjust the plan around what was actually working for him.")}
    ${p(`That is what the 1:1 coaching is, at €${priceLabel("coaching")} a month. But you do not have to start there, and most people should not: the app builds your week from your answers and refreshes it every week for €${priceLabel("app")}, and the first 7 days are free with no card.`)}
    ${p(`Try it and see what a real plan feels like: ${link(START, "kravcoaching.com/start")}`)}
    ${p("André", "margin-bottom:0;")}
  `
    : `
    ${p(`Olá ${firstName},`)}
    ${p("o Guilherme chegou ao meu coaching com 67kg. Já treinava há dois anos e sabia o que estava a fazer. Mas o corpo não respondia.")}
    ${p("Ganhou 20kg. Com o físico que sempre quis.")}
    ${p("Não foi magia. Foi ter alguém a olhar para os números todas as semanas e ajustar o plano de acordo com o que estava a funcionar para ele.")}
    ${p(`É isso que é o coaching 1:1, a €${priceLabel("coaching")} por mês. Mas não tens de começar por aí, e a maioria das pessoas não devia: a app monta-te a semana a partir das tuas respostas e renova-a todas as semanas por €${priceLabel("app")}, e os primeiros 7 dias são grátis, sem cartão.`)}
    ${p(`Experimenta e vê o que é ter um plano a sério: ${link(START, "kravcoaching.com/start")}`)}
    ${p("André", "margin-bottom:0;")}
  `;
  return wrap(body, unsubUrl);
}

// ── Email 4: day 14 ───────────────────────────────────────────────────────────
export function email4(firstName: string, unsubUrl: string, lang: Lang) {
  const body = lang === "en"
    ? `
    ${p(`Hi ${firstName},`)}
    ${p("this is the last email I will send you about this.")}
    ${p("If you have not moved yet, the timing is not right, and there is nothing wrong with that. The guide is yours either way.")}
    ${p(`When it is the right time, there are three doors and you pick the size: the book with the full thirteen weeks for €${ebookPrice("en")} (${link(EBOOK, "90 Days")}), the app writing your week every week for €${priceLabel("app")} a month, or me writing it and adjusting it for €${priceLabel("coaching")}. The last two start with the same ${link(START, "7 free days, no card")}.`)}
    ${p(`Either way, reply here or find me on ${link(IG, "Instagram")}. I read everything.`)}
    ${p("André", "margin-bottom:0;")}
  `
    : `
    ${p(`Olá ${firstName},`)}
    ${p("não te mando mais emails sobre isto depois deste.")}
    ${p("Se ainda não avançaste é porque o momento não é o certo, e não há problema nenhum nisso. O guia fica teu de qualquer maneira.")}
    ${p(`Quando for a altura certa, há três portas e és tu que escolhes o tamanho: o livro com as treze semanas completas por €${ebookPrice("pt")} (${link(EBOOK, "90 Dias")}), a app a escrever-te a semana todas as semanas por €${priceLabel("app")} por mês, ou eu a escrevê-la e a ajustá-la por €${priceLabel("coaching")}. As duas últimas começam pelos mesmos ${link(START, "7 dias grátis, sem cartão")}.`)}
    ${p(`De qualquer forma, responde aqui ou fala comigo no ${link(IG, "Instagram")}. Leio tudo.`)}
    ${p("André", "margin-bottom:0;")}
  `;
  return wrap(body, unsubUrl);
}
