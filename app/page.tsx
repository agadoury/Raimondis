import { getVoter } from "@/lib/auth";
import { listNominationsBy } from "@/lib/store";
import type { OwnNomination } from "@/lib/shared";
import Board from "./Board";
import PickVoter from "./PickVoter";

// "Who are you?" (name + 4-digit code) → nomination board.
// The only nominations ever sent to this page are the signed-in voter's own.
export default async function Home() {
  const voter = await getVoter();
  if (!voter) return <PickVoter />;

  const mine: OwnNomination[] = (await listNominationsBy(voter.id)).map(
    ({ id, nomineeId, awardName, reason, createdAt }) => ({ id, nomineeId, awardName, reason, createdAt }),
  );
  return <Board key={voter.id} voter={voter} initialNominations={mine} />;
}
