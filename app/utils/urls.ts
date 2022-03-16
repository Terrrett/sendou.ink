export function oldSendouInkUserProfile({ discordId }: { discordId: string }) {
  return `https://sendou.ink/u/${discordId}`;
}

export function oldSendouInkPlayerProfile({
  principalId,
}: {
  principalId: string;
}) {
  return `https://sendou.ink/pid/${principalId}`;
}

export function sendouQFrontPage() {
  return "/play";
}
export function sendouQLookingPage() {
  return "/play/looking";
}
export function sendouQAddPlayersPage() {
  return "/play/add-players";
}
export function sendouQMatchPage(matchId: string) {
  return `/play/match/${matchId}`;
}
