const EMAIL = /\b\S+@\S+\.\S+\b/g;
const PHONE = /\b(?:\+?\d[\d\s/()-]{6,}\d)\b/g;
const PLACEHOLDER_PERSON = /\b(?:max mustermann|erika musterfrau|john doe)\b/gi;

const LEGAL_FORMS = new Set(
  ["gmbh", "ag", "se", "eg", "kg", "ug", "inc", "ltd", "llc", "plc", "oy", "ab", "nv", "bv"].map(
    (value) => value,
  ),
);

const ROLE_TITLES = new Set(
  [
    "cio",
    "cto",
    "cdo",
    "ceo",
    "cfo",
    "coo",
    "ciso",
    "head",
    "leitung",
    "leiter",
    "leiterin",
    "director",
    "vp",
    "svp",
  ].map((value) => value),
);

const TITLECASE_WORD = /^[A-ZÄÖÜ][a-zäöüß]+$/;

/**
 * V1 query sanitizer — bounded rules, not an NER model.
 *
 * Removes:
 * - email addresses
 * - phone-like tokens
 * - placeholder names (Max Mustermann, Erika Musterfrau, John Doe)
 * - after the first token, a Titlecase given+family pair that is not a role or legal form
 *
 * Keeps:
 * - the first token (treated as the company seed)
 * - ALL-CAPS tokens (DATEV, SAP, IBM)
 * - legal forms (GmbH, AG, SE, eG, …)
 * - role titles (CIO, CTO, CDO, Head, Leitung, …)
 */
export function sanitizeSearchQuery(value: string): string {
  const withoutContacts = value
    .replace(EMAIL, " ")
    .replace(PHONE, " ")
    .replace(PLACEHOLDER_PERSON, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (!withoutContacts) return "";

  const tokens = withoutContacts.split(" ");
  const kept: string[] = [];

  for (let index = 0; index < tokens.length; index += 1) {
    const token = tokens[index];
    if (!token || isContactResidue(token)) continue;
    if (index === 0) {
      kept.push(token);
      continue;
    }
    if (isKeepToken(token)) {
      kept.push(token);
      continue;
    }
    const next = tokens[index + 1];
    if (next && looksLikePersonName(token) && looksLikePersonName(next) && !isKeepToken(next)) {
      index += 1;
      continue;
    }
    if (looksLikePersonName(token)) continue;
    kept.push(token);
  }

  return kept.join(" ").replace(/\s+/g, " ").trim();
}

function isKeepToken(token: string): boolean {
  const lower = token.toLocaleLowerCase("de");
  if (LEGAL_FORMS.has(lower) || ROLE_TITLES.has(lower)) return true;
  return token === token.toUpperCase() && token.length > 1 && /[A-ZÄÖÜ]/.test(token);
}

function looksLikePersonName(token: string): boolean {
  if (isKeepToken(token)) return false;
  return TITLECASE_WORD.test(token);
}

function isContactResidue(token: string): boolean {
  return /^[+\d][\d()/.-]*$/.test(token);
}
