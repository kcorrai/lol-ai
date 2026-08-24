import { useCallback, useEffect, useRef, useState } from "react";
import {
  readChampion,
  readChampionList,
  type DesktopChampion,
  type DesktopChampionList,
  type Lane,
} from "./champions";
import { coreRead, type Failed, type Loading, type Unavailable, type Unpaired } from "./coreRead";

export type ChampionListState =
  | Unavailable
  | Loading
  | Unpaired
  | Failed
  | { status: "ready"; list: DesktopChampionList };

export type ChampionState =
  /** Nothing picked yet — the pane's opening state, not an absence of data. */
  | { status: "idle" }
  | Unavailable
  | Loading
  | Unpaired
  | Failed
  | { status: "ready"; champion: DesktopChampion };

/** The lane a player who has not chosen one is most likely to want. */
const DEFAULT_LANE: Lane = "MIDDLE";

export interface Champions {
  lane: Lane;
  setLane: (lane: Lane) => void;
  list: ChampionListState;
  selected: string | null;
  select: (key: string | null) => void;
  champion: ChampionState;
}

/**
 * The champion browser's state: a lane, its list, and whichever champion is open.
 *
 * Both reads are cached for the life of the window. These answers change once a patch, and
 * a player comparing two mid laners would otherwise pay for the same request every time
 * they clicked back — over a connection already busy with a game.
 */
export function useChampions(): Champions {
  const [lane, setLane] = useState<Lane>(DEFAULT_LANE);
  const [selected, setSelected] = useState<string | null>(null);
  const [list, setList] = useState<ChampionListState>({ status: "loading" });
  const [champion, setChampion] = useState<ChampionState>({ status: "idle" });

  const lists = useRef(new Map<string, DesktopChampionList>());
  const champions = useRef(new Map<string, DesktopChampion>());

  useEffect(() => {
    const cached = lists.current.get(lane);
    if (cached) {
      setList({ status: "ready", list: cached });
      return;
    }

    return coreRead(
      () => readChampionList(lane),
      (result) => {
        if (result.status === "ok") {
          lists.current.set(lane, result.value);
          setList({ status: "ready", list: result.value });
          return;
        }
        setList(result);
      }
    );
  }, [lane]);

  useEffect(() => {
    if (!selected) {
      setChampion({ status: "idle" });
      return;
    }

    const key = `${lane}:${selected}`;
    const cached = champions.current.get(key);
    if (cached) {
      setChampion({ status: "ready", champion: cached });
      return;
    }

    return coreRead(
      () => readChampion(selected, lane),
      (result) => {
        if (result.status === "ok") {
          champions.current.set(key, result.value);
          setChampion({ status: "ready", champion: result.value });
          return;
        }
        setChampion(result);
      }
    );
  }, [lane, selected]);

  // Changing lane closes whatever was open: the same champion in another lane is a
  // different reading, and leaving the old one on screen under the new lane's list would
  // put two patches' worth of claims next to each other.
  const changeLane = useCallback((next: Lane) => {
    setLane(next);
    setSelected(null);
  }, []);

  return { lane, setLane: changeLane, list, selected, select: setSelected, champion };
}
