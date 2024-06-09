import { TwilioMessageWebhookType } from "./twilio-types.js";
export const getLocationFromWebhook = (
  webhookInput: TwilioMessageWebhookType,
):
  | {
      location: { latitude: number; longitude: number };
      address?: string;
      label?: string;
    }
  | undefined => {
  if (!webhookInput.Latitude || !webhookInput.Longitude) {
    return;
  }

  return {
    location: {
      latitude: Number(webhookInput.Latitude),
      longitude: Number(webhookInput.Longitude),
    },
    address: webhookInput.Address,
    label: webhookInput.Label,
  };
};
