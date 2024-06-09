/** returns a phonenumber with + unless you also specify "isWithoutPlus"*/
export const normalizePhoneNumber = (
  phoneNumber: string | undefined,
  isWithoutPlus?: boolean,
) => {
  if (!phoneNumber) return undefined;
  const withoutWhatsappPrefix = phoneNumber?.startsWith("whatsapp:")
    ? phoneNumber.substring("whatsapp:".length)
    : phoneNumber;
  const withoutSpacesDashes = withoutWhatsappPrefix
    .replaceAll("-", "")
    .replaceAll(" ", "");

  const withoutPlus = isWithoutPlus
    ? withoutSpacesDashes.replace("+", "")
    : withoutSpacesDashes;
  return withoutPlus;
};
