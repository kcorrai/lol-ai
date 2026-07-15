"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ChampionCombobox, type ChampionOption } from "@/domains/meta/components/ChampionCombobox";

interface Props {
  champions: ChampionOption[];
}

// Champion search for the builds hub: selecting a champion navigates straight to
// its build page. Mirrors how the other free tools consume ChampionCombobox.
export function BuildSearch({ champions }: Props) {
  const router = useRouter();
  const [value, setValue] = useState<string | null>(null);

  function handleSelect(key: string | null): void {
    setValue(key);
    if (key) router.push(`/builds/${key}`);
  }

  return (
    <ChampionCombobox
      champions={champions}
      value={value}
      onSelect={handleSelect}
      placeholder="Search a champion's build…"
      className="max-w-sm"
    />
  );
}
