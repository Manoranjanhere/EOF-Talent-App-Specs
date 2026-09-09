export function withoutPassword<T extends { passwordHash?: string | null }>(row: T) {
  const { passwordHash, ...safe } = row;
  void passwordHash;
  return safe;
}
