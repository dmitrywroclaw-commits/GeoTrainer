export function nextCardId(ids: readonly string[], currentId: string): string | undefined {
  const index = ids.indexOf(currentId);
  return index >= 0 && ids.length > 1 ? ids[(index + 1) % ids.length] : undefined;
}

export function randomCardId(ids: readonly string[], currentId: string, random = Math.random): string | undefined {
  const index = ids.indexOf(currentId);
  if (index < 0 || ids.length < 2) return undefined;
  const choice = Math.min(Math.floor(random() * (ids.length - 1)), ids.length - 2);
  return ids[choice >= index ? choice + 1 : choice];
}
