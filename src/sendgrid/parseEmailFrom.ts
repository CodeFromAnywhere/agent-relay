import { extractEmails } from "./extractEmails.js";
export const parseEmailFrom = (from: string) => {
  const nameStartIdx = from.indexOf('"');
  const nameEndIdx = from.lastIndexOf('"');

  if (nameStartIdx === -1 || nameEndIdx === -1) {
    const email = extractEmails(from)?.[0];
    return { email };
  }

  const name = from.substring(nameStartIdx + 1, nameEndIdx);
  const emailPart = from.substring(nameEndIdx + 3, from.length - 1); // Skip space and angle brackets
  const email = extractEmails(emailPart)?.[0];
  return { email, name };
};
