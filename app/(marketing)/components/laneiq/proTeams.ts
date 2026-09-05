/**
 * The team crests the two esports illustrations draw.
 *
 * Both of them used to draw a blank tile where a logo belongs — the Arsenal panel wrote "G2 vs
 * FNC" in text and the showcase screen wrote "TBD", and a section whose whole subject is what
 * the pros are doing showed nothing anybody could recognise.
 *
 * These are Riot's own published logos, on the host the esports domain already reads (ADR-016)
 * and already allowed by the CSP and `next.config.mjs`. The urls come from `getTeams` on the
 * lolesports feed rather than being guessed: the filenames are upload-stamped and cannot be
 * derived from a team's name. The feed publishes them over plain http, so they are written
 * here as https, which is what `httpsAsset` does to the live ones.
 *
 * The scores and kickoff times beside them are invented, and every drawing that uses these
 * says so in its own caption. What is real is the crest, which is the part a reader recognises.
 */

export interface ProTeam {
  /** Three-letter code, drawn beside the crest and used as its fallback. */
  code: string;
  /** Full name, for the accessible label of any drawing that names one. */
  name: string;
  logo: string;
}

const HOST = "https://static.lolesports.com/teams";

export const PRO_TEAMS = {
  G2: { code: "G2", name: "G2 Esports", logo: `${HOST}/G2-FullonDark.png` },
  FNC: { code: "FNC", name: "Fnatic", logo: `${HOST}/1631819669150_fnc-2021-worlds.png` },
  T1: { code: "T1", name: "T1", logo: `${HOST}/1726801573959_539px-T1_2019_full_allmode.png` },
  GEN: { code: "GEN", name: "Gen.G", logo: `${HOST}/1773829250929_GENGLOGO_GOLD.png` },
  HLE: { code: "HLE", name: "Hanwha Life", logo: `${HOST}/1631819564399_hle-2021-worlds.png` },
  BLG: {
    code: "BLG",
    name: "Bilibili Gaming",
    logo: `${HOST}/1682322954525_Bilibili_Gaming_logo_20211.png`,
  },
  JDG: { code: "JDG", name: "JD Gaming", logo: `${HOST}/1627457924722_29.png` },
  TES: {
    code: "TES",
    name: "Top Esports",
    logo: `${HOST}/1592592064571_TopEsportsTES-01-FullonDark.png`,
  },
} as const satisfies Record<string, ProTeam>;

export type ProTeamCode = keyof typeof PRO_TEAMS;
