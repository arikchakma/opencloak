const PLURAL = new Intl.PluralRules("en");
const NUMBER = new Intl.NumberFormat("en");

export const number = (n: number) => NUMBER.format(n);

export function count(n: number, one: string, other: string) {
  return `${NUMBER.format(n)} ${PLURAL.select(n) === "one" ? one : other}`;
}
