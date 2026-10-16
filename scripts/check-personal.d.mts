export interface PersonalRule {
  name: string;
  pattern: RegExp;
  skip?: (path: string) => boolean;
}
export const RULES: PersonalRule[];
export function findPersonal(
  files: { path: string; text: string }[],
): { path: string; line: number; rule: string }[];
