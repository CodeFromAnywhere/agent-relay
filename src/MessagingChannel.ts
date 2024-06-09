/**
 * Available messaging channels in order of preference
 */
export const availableMessagingChannels = [
  "whatsapp",
  "email",
  "sms",
  "messenger",
  "web",
  "call",
] as const;
export type MessagingChannel = (typeof availableMessagingChannels)[number];
