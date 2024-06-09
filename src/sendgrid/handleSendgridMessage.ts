import { tryGetFormData } from "./tryGetFormData";
import parseHtmlToMd from "html-to-md";
import { generateDateId, mergeObjectsArray, tryParseJson } from "from-anywhere";
import { parseEmailFrom } from "./parseEmailFrom.js";
import { sendgridProcessAttachments } from "./sendgridProcessAttachments.js";

export type SendgridInput = {
  /**
   * The raw headers of the email.
   */
  headers: any;
  /**
   * A string containing the verification results of any DKIM and domain keys signatures in the message.
   */
  dkim: string;
  /**
   * 	A string containing the number of attachments.
   */
  "content-ids": string;
  /**
   * 	Email recipient field, as taken from the message headers.
   */
  to: string;
  /**
   * 	Email body in plaintext formatting.
   */
  text: string;
  /**
   * 	HTML body of email. If not set, email did not have an HTML body.
   */
  html: string;
  /**
   * Email sender, as taken from the message headers.*/
  from: string;
  /**
   * A string of the sender’s ip address.
   */
  sender_ip: string;
  /**
   * 	Spam Assassin’s spam report.
   */
  spam_report: any;
  /**
   * 	A string containing the SMTP envelope. This will have 2 variables: to, which is a single-element array containing the address that we received the email to, and from, which is the return path for the message.
   */
  envelope: string;
  /**
   * Number of attachments included in email.
   */
  attachments: any;
  /**
   * Email Subject.
   */
  subject: string;
  /**
   * 	Spam Assassin’s rating for whether or not this is spam.
   */
  spam_score: any;
  /**
   * A JSON map where the keys are named attachment{X}. Each attachment key points to a JSON object containing three fields, filename, type, and content-id. The filename field is the name of the file (if it was provided). The type field is the media type of the file. X is the total number of attachments. For example, if the number of attachments is 0, there will be no attachment files. If the number of attachments is 3, parameters attachment1, attachment2, and attachment3 will have file uploads.
   */
  "attachment-info": string;
  /**
   * 	A string containing the character sets of the fields extracted from the message.
   */
  charsets: string;
  /**
   * 	The results of the Sender Policy Framework verification of the message sender and receiving IP address.
   */
  SPF: string;
};

export const getFormDataObject = (formData: FormData) => {
  return mergeObjectsArray(
    Array.from(formData.keys()).map((key) => {
      //@ts-ignore
      const value = formData.get(key)?.toString();
      return { [key]: value };
    }),
  );
};

/**
 * NB: follow this: https://docs.sendgrid.com/for-developers/parsing-email/setting-up-the-inbound-parse-webhook
 */
export const handleSendgridMessage = async (request: Request) => {
  console.log("SENDGRID RECEIVED", {
    headers: request.headers,
    raw: request,
    header: request.headers.get("content-type"),
  });

  const formData = await tryGetFormData(request);
  if (!formData) {
    console.log("Sendgrid formdata could not be found");
    return new Response("Success", {
      headers: { "content-type": "text/plain" },
    });
  }

  // const textString = await request.text();
  const input = getFormDataObject(formData) as SendgridInput;

  // console.log({ input, formData });

  const { email: fromEmail, name: fromName } = parseEmailFrom(input.from);
  const { email: toEmail } = parseEmailFrom(input.to);

  const envelope = input.envelope
    ? tryParseJson<{ to: string[]; from: string }>(input.envelope)
    : null;
  const finalTo = envelope?.to?.[0] || toEmail;
  const toPersonSlug = finalTo?.split("@")?.[0];

  const forwardedFrom = finalTo !== toEmail ? toEmail : undefined;

  const markdownText = input.html ? parseHtmlToMd(input.html) : undefined;

  console.log("Here without trouble");

  if (!toPersonSlug) {
    return new Response("No personslug", {
      headers: { "content-type": "text/plain" },
    });
  }

  console.log({ toPersonSlug });

  //  TODO: Put attachments in the right place, and get URLs for attachments
  const assetFilePaths = await sendgridProcessAttachments(formData);
  const attachmentUrls = "";

  const email = {
    __id: generateDateId(),
    subject: input.subject,
    toPersonSlug,
    fromEmail,
    fromName,
    forwardedFrom,
    ip: input.sender_ip,
    spamReport: input.spam_report,
    spamScore: input.spam_score,
    text: input.text,
    html: input.html,
    finalText: markdownText || input.text,
    markdownText,
    attachmentUrls,
    attachmentAmount: input.attachments ? Number(input.attachments) : 0,
  };
  console.log({ email });

  return new Response("Success", {
    headers: { "content-type": "text/plain" },
  });
};
