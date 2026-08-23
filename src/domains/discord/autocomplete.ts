import { searchPlayers } from "@/domains/riot";
import {
  CommandOptionType,
  type AutocompleteChoice,
  type AutocompleteInteraction,
  type CommandOption,
} from "@/lib/discord/interactionTypes";

// Discord's hard cap on a choice list.
const MAX_CHOICES = 25;

function focusedOption(options: CommandOption[] | undefined): CommandOption | undefined {
  for (const option of options ?? []) {
    if (
      option.type === CommandOptionType.String ||
      option.type === CommandOptionType.Integer ||
      option.type === CommandOptionType.Boolean
    ) {
      if (option.focused) return option;
      continue;
    }
    // A subcommand's options are nested one level down, so the focused option
    // for `/lolai something riot-id:…` is not in the top-level list.
    const nested = focusedOption(option.options);
    if (nested) return nested;
  }
  return undefined;
}

function optionValue(options: CommandOption[] | undefined, name: string): string | undefined {
  const found = options?.find((o) => o.name === name);
  return found && found.type === CommandOptionType.String ? found.value : undefined;
}

/**
 * Suggests Riot IDs while someone types.
 *
 * Answered inline rather than deferred: autocomplete has the same 3-second
 * budget as everything else but no deferred response type, so it may only ever
 * read the player index — a Postgres prefix query — and never call Riot.
 */
export async function handleAutocomplete(
  interaction: AutocompleteInteraction
): Promise<AutocompleteChoice[]> {
  const options = interaction.data.options;
  const focused = focusedOption(options);
  if (!focused || focused.name !== "riot-id" || focused.type !== CommandOptionType.String) {
    return [];
  }

  const region = optionValue(options, "region");
  const hits = await searchPlayers(focused.value, {
    region,
    limit: MAX_CHOICES,
  });

  return hits.map((hit) => {
    const riotId = `${hit.gameName}#${hit.tagLine}`;
    return {
      name: `${riotId} · ${hit.region.toUpperCase()}`.slice(0, 100),
      value: riotId.slice(0, 100),
    };
  });
}
