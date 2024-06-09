import { handleSts } from "./handleSts";
import { handleStsClient } from "./handleStsClient";
import { handleTwilioMessage } from "./handleTwilioMessage";
import { handleSendgridMessage } from "./sendgrid/handleSendgridMessage";

addEventListener("fetch", (event) => {
  event.respondWith(handleRequest(event.request));
});

async function handleRequest(request: Request) {
  const url = new URL(request.url);
  const firstChunk = url.pathname.split("/")?.[1];

  if (firstChunk === "twilio") {
    // twilio handler
    return handleTwilioMessage(request);
  }

  if (firstChunk === "sendgrid") {
    // sendgrid handler
    return handleSendgridMessage(request);
  }

  if (firstChunk === "sts") {
    return handleSts(request);
  }

  return handleStsClient(request);
}
