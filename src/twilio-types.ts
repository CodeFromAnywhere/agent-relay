import VoiceResponse from "twilio/lib/twiml/VoiceResponse";
import { Twilio } from "twilio";
export type TwilioContext = {
  voiceResponse: VoiceResponse;
  /**parsed from parameters */
  participantRelationsParse?: {
    email: string | undefined;
    phoneNumber: string | undefined;
    name: string | undefined;
  }[];
  webhookInput: { [key: string]: string | undefined };
  host: string;
  url: string;
  twilioClient: Twilio;
  personPhoneNumber: string;
  customParameters: TwilioCallCustomParameters;
};

/** must be all string */
export type TwilioCallCustomParameters = {
  /** If true, this recording will not end up in the `phone-recording-inbox` but rather in a certain db model. Must be "true" */
  isDbEntry?: string;

  /** If given, this means this is where the db entry needs to be done */
  modelName?: string;
  /** If given, this means this is the specific __id on which to send the db entry */
  __id?: string;
  /** the parameter that needs tobe altered/inserted with the recording */
  objectParameterKey?: string;

  /** If given it means this text was said before the recording */
  prompt?: string;

  /**
   * Should contain all participants that the recording should be forwarded to, except yourself.
   *
   * If given, we assume that from/to are sometimes screenless/google meet
   *
   * Therefore, the original phone-number of the initiator should always be the last one (the suffix)
   *
   * format:
   * - comma-separated
   * - if name is available, name is put before ":"
   *
   * Example value: `bruna:31688888888,carlos:carlos@gmail.com,henk@devries.nl,4611111111,wijnand:31699999999`
   */
  participants?: string;

  /** Number to gather immediately rather than going to gather yourself  */
  gatherDigits?: string;
  // /** If you call someone else, the new call originalCaller will be provided, which is your number without + (normalised) */
  // originalCaller?: string;

  // /**  */
  // dialNumber?: string;
};

/**
 * NB: couln't find this in the docs or api spec... Made myself, but it is probably not 100% accurate! just tested with a simple WhatsApp message.
 */
export type TwilioMessageWebhookType = {
  MediaUrl0?: string;
  MediaContentType0?: string;

  /**
   * Location stuff
   */
  Latitude?: string;
  Longitude?: string;
  Address?: string;
  Label?: string;

  /**
   * instareply button, if clicked
   */
  ButtonText?: string;
  SmsMessageSid: string;

  /**
   * if there are media this is the number of media like '1'
   */
  NumMedia: string;
  /**
   * ProfileName of the sender (whatsapp?)
   */
  ProfileName: string;
  SmsSid: string;
  /**
   * seems to be the phone number without + (whatsapp)
   */
  WaId?: string;
  SmsStatus: string;
  /**
   * The message!
   */
  Body: string;

  /**
   * The phonenumber where the message should go
   */
  To: string;

  NumSegments: string;
  ReferralNumMedia: string;
  /**
   * Id of the message, to be stored because it is given for a reply
   */
  MessageSid: string;
  /**
   * If the message is a reply on some message, this is the id of the original message
   */
  OriginalRepliedMessageSid?: string;
  /**
   * `whatsapp:xxxxxx`
   */
  OriginalRepliedMessageSender?: string;
  /**
   * Useful to verify to the correct persona
   */
  AccountSid: string;
  /**
   * The phone number where the message came from
   */
  From: string;
  ApiVersion: string;
};
