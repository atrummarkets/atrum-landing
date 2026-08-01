/**
 * Every word on the page, in narrative order.
 *
 * The six acts answer, in sequence: what is Atrum, why does privacy matter,
 * how does it work, why trust it, why join. Claims are held to what the
 * protocol actually does — public odds, hidden depth, hidden participants,
 * oracle resolution — and nothing beyond that.
 */

export const ACTS = [
  {
    id: "void",
    nav: "Atrum",
    label: "MMXXVI · Invite only",
    display: "Private prediction markets.",
    body: "The odds are public. You are not.",
    cue: "Descend",
  },
  {
    id: "sentinel",
    nav: "The house",
    label: "I · The house",
    display: "You are not being watched.",
    body: "Atrum is a prediction market without the crowd. The price stays common knowledge. Your size, your timing and your name do not.",
  },
  {
    id: "colonnade",
    nav: "The laws",
    label: "II · The laws",
    display: "Four laws of the house.",
    body: "They are not features. They are the conditions of entry.",
  },
  {
    id: "seal",
    nav: "The mechanism",
    label: "III · The mechanism",
    display: "Sealed, pooled, resolved.",
    body: "Three steps. Trust no operator.",
  },
  {
    id: "throne",
    nav: "The authority",
    label: "IV · The authority",
    display: "No one is sitting behind the glass.",
    body: "No operator can see your position, and none holds discretion. An oracle decides, on-chain. The house cannot take a side — it cannot see the table.",
  },
  {
    id: "oath",
    nav: "The oath",
    label: "V · The oath",
    display: "The doors open once.",
    body: "Atrum opens invite-only. Take the oath to hold a seat — earliest oath, earliest key.",
  },
  {
    id: "builders",
    nav: "The builders",
    label: "VI · The builders",
    display: "Built by two people.",
    body: "No institution behind it, no pedigree to trade on. Non-IITians, for the record.",
  },
] as const;

/** Act VII. The one place on the page that names anyone. */
export const BUILDERS = [
  {
    name: "Ayush",
    handle: "ayuxhtwt",
    portrait: "/team/ayush.png",
  },
  {
    name: "Divyansh",
    handle: "divyanshh_kalra",
    portrait: "/team/divyansh.png",
  },
] as const;

export type ActId = (typeof ACTS)[number]["id"];

/** Act III — one law per pillar, in the order the camera passes them. */
export const LAWS = [
  {
    n: "01",
    title: "Blind books",
    body: "Positions stay sealed until settlement. Nobody front-runs your trade, because nobody can see it.",
  },
  {
    n: "02",
    title: "Unnamed capital",
    body: "Deposit, wager and withdraw with no name attached. Proofs, not profiles.",
  },
  {
    n: "03",
    title: "Public odds",
    body: "The price is common knowledge. The pool behind it is not. Atrum hides the crowd, never the number.",
  },
  {
    n: "04",
    title: "Ruthless settlement",
    body: "Oracles resolve on-chain. No appeal, no house discretion, no exceptions.",
  },
] as const;

/** Act IV — the mechanism, engraved into the floor seal. */
export const MECHANISM = [
  {
    n: "01",
    title: "Commit",
    body: "Your stake enters an encrypted parimutuel pool. Threshold encryption hides the amount; a zero-knowledge proof shows the stake is real without revealing what it is.",
  },
  {
    n: "02",
    title: "Hold",
    body: "The pool grows. Odds move on aggregate weight alone — no order book, no visible depth, nothing for anyone to read off you.",
  },
  {
    n: "03",
    title: "Resolve",
    body: "An oracle settles the outcome on-chain and winners split the pool. Settlement finalises in roughly 300ms on Monad.",
  },
] as const;

/**
 * Act IV floor engraving. Illustrative market lines — the point they make is
 * "the number is public, the depth behind it is not", so volume is shown
 * deliberately sealed rather than as a figure.
 */
export const MARKETS = [
  { q: "BTC above $180K by Dec 31", p: "41%" },
  { q: "Fed cuts twice before Q4", p: "67%" },
  { q: "OpenAI ships an agent OS", p: "23%" },
  { q: "ETH/BTC reclaims 0.05", p: "55%" },
  { q: "TSMC 2nm slips to 2027", p: "18%" },
  { q: "A sovereign buys BTC", p: "34%" },
  { q: "Nvidia misses guidance", p: "12%" },
  { q: "Stablecoin bill signed", p: "72%" },
] as const;

/** Boot sequence. Each line is bound to a real load phase, not a timer. */
export const BOOT_LINES = [
  "Casting the monolith",
  "Binding the oracles",
  "Veiling the book",
  "Opening the vault",
] as const;
