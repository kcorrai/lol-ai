import { ESPORTS_PREFS_KEY } from "@/lib/stores/esportsPrefsStore";

/** The attribute on `<html>` that the spoiler rules in globals.css key off. */
export const HIDE_SCORES_ATTRIBUTE = "data-hide-scores";

/**
 * Sets spoiler mode on `<html>` before the page paints.
 *
 * Inlined into the esports layout, so a returning reader who hides scores never
 * sees one flash up while React loads. It reads the store's persisted copy
 * directly because the store itself has not loaded yet; `SpoilerToggle` keeps
 * the attribute in step after that.
 */
export const SPOILER_PREPAINT_SCRIPT = `try{var p=JSON.parse(localStorage.getItem(${JSON.stringify(
  ESPORTS_PREFS_KEY
)})||"null");if(p&&p.state&&p.state.hideScores)document.documentElement.setAttribute(${JSON.stringify(
  HIDE_SCORES_ATTRIBUTE
)},"true")}catch(e){}`;
