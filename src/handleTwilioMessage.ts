import querystring from "querystring";
import MessagingResponse from "twilio/lib/twiml/MessagingResponse.js";
import { getYoutubeId, isUrl } from "from-anywhere";
import { normalizePhoneNumber } from "./normalizePhoneNumber.js";
import { getLocationFromWebhook } from "./getLocationFromWebhook.js";
import { getPhoneNumberLocation } from "./getIsEeaCountryCode.js";
import { MessagingChannel } from "./MessagingChannel.js";
import { fetchVCard } from "./fetchVcard.js";
import { TwilioMessageWebhookType } from "./twilio-types.js";

export const replyMessage = (message?: string) => {
  const twiml = new MessagingResponse();

  if (message) {
    twiml.message(message);
  }

  return new Response(twiml.toString(), {
    headers: { "content-type": "text/xml" },
  });
};

/**
 * This is where sms/whastapp messages are received via the twilio webhook.
 */

export const handleTwilioMessage = async (request: Request) => {
  const url = request.url;
  const params = new URL(url).searchParams;
  const agentSlug = params.get("agentSlug");
  const authToken = params.get("authToken");
  const twilioAccountSid = params.get("twilioAccountSid");
  const twilioAuthToken = params.get("twilioAuthToken");

  if (!agentSlug || !authToken || !twilioAccountSid || !twilioAuthToken) {
    console.log("Could not find parameters");
    return replyMessage();
  }

  //NB: see https://stackoverflow.com/questions/42128238/how-can-i-read-the-data-received-in-application-x-www-form-urlencoded-format-on
  const raw = await request.text();
  const webhookInput = querystring.parse(raw) as TwilioMessageWebhookType;

  if (!webhookInput) {
    console.log("Could not find body ");
    return replyMessage();
  }

  const host = request.headers.get("host");
  const to = webhookInput.To;
  const rawFromNumber = webhookInput.From;
  const fromNumber = normalizePhoneNumber(rawFromNumber);
  const phoneNumberLocation = fromNumber
    ? getPhoneNumberLocation(fromNumber)
    : undefined;
  const fromName = webhookInput.ProfileName;
  const quickReply = webhookInput.ButtonText;
  const whatsappMessageSid = webhookInput.MessageSid;
  const message = webhookInput.Body || "";

  // webhookInput.Longitude
  console.log(`WhatsApp received message:`, { message, quickReply });

  const toParts = to.split(":");
  const toType = toParts[0];
  const toId = toParts[1];

  const isMessenger = toType === "messenger";
  const isWhatsapp = toType === "whatsapp";

  const messagingChannel: MessagingChannel | undefined = isMessenger
    ? "messenger"
    : isWhatsapp
    ? "whatsapp"
    : "sms";
  const isSms = messagingChannel === "sms";

  if (!fromNumber) {
    console.log("Couldn't find your phone number");

    return replyMessage();
  }

  const location = getLocationFromWebhook(webhookInput);

  const mediaType = webhookInput.MediaContentType0?.split("/")[0];
  const isVcard = webhookInput.MediaContentType0?.split("/")[1] === "vcard";
  const isAudio = mediaType === "audio";
  const isVideo = mediaType === "video";
  const isImage = mediaType === "image";
  const isYoutubeUrl = isUrl(message) && !!getYoutubeId(message);
  const isReadingUrl = isUrl(message) && !getYoutubeId(message);

  const contacts =
    isVcard && webhookInput.MediaUrl0
      ? await fetchVCard(webhookInput.MediaUrl0)
      : undefined;

  const isContacts = contacts && contacts.length > 0;
  // NB: the authToken is required!

  console.log({
    isAudio,
    isVideo,
    isImage,
    isYoutubeUrl,
    isReadingUrl,
    isContacts,
    location,
  });

  const endpoint = `https://agent.actionschema.com/${agentSlug}/message`;
  const body = {
    message,
    // TODO: findOrCreate threadId based on phoneNumber
    //threadId
    attachmentUrls:
      isImage && webhookInput.MediaUrl0 ? [webhookInput.MediaUrl0] : undefined,
  };
  console.log({ endpoint, body, authToken });

  const response: any = await fetch(endpoint, {
    method: "POST",
    body: JSON.stringify(body),
    headers: {
      Authorization: `Bearer ${authToken}`,
      Accept: "application/json",
      "Content-Type": "application/json",
    },
  }).then((res) => res.json());

  const responseMessage = response.messages
    ?.filter((x: any) => x.role === "assistant")
    .map((x: any) => x.content)
    .join("\n\n");

  console.log({ response, responseMessage });
  // NB: respond with xml to to twilio so it knows what to send back
  // TODO: if it's too big, chunk it and send chunks
  return replyMessage(responseMessage);
};
