/** "Juan Dela Cruz" -> "Juan"; households from before names were collected get a neutral hello. */
export const firstName = (name: string | null) => name?.trim().split(/\s+/)[0] ?? null;
