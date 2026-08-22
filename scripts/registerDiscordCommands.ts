// A CLI script's stdout is its interface — the logging service writes structured
// JSON meant for a server log, which is the wrong thing to show someone running
// this by hand. no-console is disabled here for that reason only.
/* eslint-disable no-console */
import { COMMAND_DEFINITIONS } from "../src/domains/discord/commandDefinitions";
import { loadEnvFiles } from "./loadEnv";

loadEnvFiles();

const DISCORD_API = "https://discord.com/api/v10";

/**
 * Publishes the slash commands to Discord.
 *
 *   npm run discord:register                     → global (up to an hour to appear)
 *   npm run discord:register -- --guild <id>     → one guild, live immediately
 *
 * Guild registration is what you want while iterating; global is what ships.
 * The call is a PUT, so it is the complete set — a command deleted from
 * COMMAND_DEFINITIONS disappears from Discord on the next run.
 */
async function main(): Promise<void> {
  const applicationId = process.env.DISCORD_APPLICATION_ID;
  const botToken = process.env.DISCORD_BOT_TOKEN;

  if (!applicationId || !botToken) {
    console.error(
      "DISCORD_APPLICATION_ID and DISCORD_BOT_TOKEN must be set (see docs/DISCORD_BOT.md)."
    );
    process.exit(1);
  }

  const guildFlag = process.argv.indexOf("--guild");
  const guildId = guildFlag === -1 ? undefined : process.argv[guildFlag + 1];
  if (guildFlag !== -1 && !guildId) {
    console.error("--guild needs a guild id.");
    process.exit(1);
  }

  const url = guildId
    ? `${DISCORD_API}/applications/${applicationId}/guilds/${guildId}/commands`
    : `${DISCORD_API}/applications/${applicationId}/commands`;

  const res = await fetch(url, {
    method: "PUT",
    headers: {
      Authorization: `Bot ${botToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(COMMAND_DEFINITIONS),
  });

  if (!res.ok) {
    console.error(`Discord rejected the registration (${res.status}):`);
    console.error(await res.text());
    process.exit(1);
  }

  const registered = (await res.json()) as { name: string }[];
  console.log(
    `Registered ${registered.length} command(s) ${guildId ? `in guild ${guildId}` : "globally"}: ` +
      registered.map((c) => `/${c.name}`).join(", ")
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
