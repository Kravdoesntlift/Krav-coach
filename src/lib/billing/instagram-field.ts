import type Stripe from "stripe";

// Derived from the method itself rather than named directly: this SDK moves
// the parameter types around between versions, and the signature does not.
type SessionParams = NonNullable<Parameters<Stripe["checkout"]["sessions"]["create"]>[0]>;
type CustomField = NonNullable<SessionParams["custom_fields"]>[number];
type CustomText = NonNullable<SessionParams["custom_text"]>;

/**
 * The Instagram handle, asked at the till, on every checkout that takes money.
 *
 * The close friends list is where the group gets followed week by week, and
 * it is the one place that works today: a broadcast channel needs a thousand
 * followers and the account is not there yet. Asking here rather than by DM
 * afterwards means a payment is its own proof of purchase, with no screenshot
 * to chase and nobody to take at their word.
 *
 * Written once and shared by all four checkouts so the wording cannot drift.
 *
 * It is required, after being optional and useless. Stripe draws an optional
 * custom field as a ticked-open checkbox: on a phone the buyer sees a box
 * labelled "Instagram" with no input under it, and a box nobody taps is a
 * question nobody answers. Checked on a live mobile checkout, which is where
 * almost all of this traffic lands. Required draws the input itself, and the
 * cost of that, somebody who is not on Instagram, is paid off by the line
 * under the field telling them what to write instead.
 */

const HANDLE_KEY = "instagram";

export function instagramField(lang: "pt" | "en" = "pt"): CustomField[] {
  return [{
    key: HANDLE_KEY,
    label: {
      type: "custom",
      custom: lang === "en" ? "Your Instagram, for close friends" : "O teu Instagram, para os amigos chegados",
    },
    type: "text",
    optional: false,
    text: { maximum_length: 40 },
  }];
}

/**
 * The line above the pay button.
 *
 * Following is the only step the coach cannot do himself: a close friends
 * story never reaches somebody who does not follow the account, so a buyer
 * who leaves a handle and walks away gets nothing. Said here, where they are
 * still paying attention, as well as in the email afterwards.
 */
export function instagramSubmitText(lang: "pt" | "en" = "pt"): CustomText {
  return {
    submit: {
      message: lang === "en"
        ? "Leave your Instagram above and follow @kravdoesntlift: I can only add you to my close friends if you follow the account, and that is where the 90 days get followed week by week. Not on Instagram? Write \u201cno account\u201d and carry on."
        : "Deixa o teu Instagram aí em cima e segue @kravdoesntlift: só te posso adicionar aos amigos chegados se me seguires, e é lá que acompanho os 90 dias semana a semana. Não tens Instagram? Escreve \u201cnão tenho\u201d e segue em frente.",
    },
  };
}

/** The handle somebody typed, straight off the completed session. */
export function instagramFromSession(session: Stripe.Checkout.Session): string | null {
  return session.custom_fields?.find((f) => f.key === HANDLE_KEY)?.text?.value ?? null;
}
