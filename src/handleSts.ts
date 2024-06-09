import { getOperations } from "openapi-util/build/node/getOperations";
import {
  fetchOpenapi,
  getFormContextFromOpenapi,
  getOperationRequestInit,
} from "openapi-util";

const agentWsUrl = "wss://sts.sandbox.deepgram.com/agent";

type AssistantType = {
  instructions: string;
  openapiUrl?: string;
  /** @description Used to authenticate to the OpenAPI to use tools */
  openapiAuthToken?: string;
};

export const handleSts = async (request: Request) => {
  const url = new URL(request.url);

  // NB: needed to use this syntax because XML uses & for something else and we can't put it in the XML without changing things.
  const [_, firstChunk, adminAuthToken, deepgramToken, ...agentUrlChunks] =
    url.pathname.split("/");
  const agentUrl = agentUrlChunks.join("/");

  console.log("OKOK", { adminAuthToken, deepgramToken, agentUrl });

  if (!adminAuthToken || !agentUrl || !deepgramToken) {
    return new Response(
      `<?xml version="1.0" encoding="UTF-8"?>
            <Response>
                <Say>Please ensure your agent and deepgram token are defined!</Say>
            </Response>`,
      { headers: { "content-type": "text/xml" } },
    );
  }

  const fullUrl = `https://${agentUrl}`;
  const assistant = await fetch(fullUrl, {
    method: "POST",
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${adminAuthToken}`,
    },
  }).then((res) => res.json() as Promise<AssistantType>);

  if (
    !assistant ||
    Object.getOwnPropertyNames(assistant).includes("isSuccessful")
  ) {
    return new Response(
      `<?xml version="1.0" encoding="UTF-8"?>
            <Response>
                <Say>Could not find assistant from url</Say>
            </Response>`,
      { headers: { "content-type": "text/xml" } },
    );
  }

  const upgradeHeader = request.headers.get("Upgrade");
  if (!upgradeHeader || upgradeHeader !== "websocket") {
    // TODO: Allow it to also record stuff in realtime
    return new Response(
      `<?xml version="1.0" encoding="UTF-8"?>
  <Response>
      <Connect>
          <Stream url="wss://${url.host}/${adminAuthToken}/${deepgramToken}/${agentUrl}" />
      </Connect>
      <Say>Conversation has ended. Goodbye!</Say>
  </Response>`,
      {
        headers: { "content-type": "text/xml" },
      },
    );
  }

  console.log("We're a websocket!");

  const webSocketPair = new WebSocketPair();
  const [client, server] = Object.values(webSocketPair);

  //The 'credentials' field on 'RequestInitializerDict' is not implemented. <-- TODO: do something else that is supported by cloudflare
  // const openapi = assistant.openapiUrl
  //   ? ((await resolveSchemaRecursive({
  //       documentUri: assistant.openapiUrl,
  //       shouldDereference: true,
  //     })) as OpenapiDocument | undefined)
  //   : undefined;
  const openapi = await fetchOpenapi(assistant.openapiUrl);
  const operations = openapi ? await getOperations(openapi) : undefined;

  const functions =
    openapi && operations
      ? operations.map((item) => {
          const { method, path } = item;

          const formContext = getFormContextFromOpenapi({
            //@ts-ignore
            method,
            path,
            openapi,
          });
          const { parameters, schema, securitySchemes, servers } = formContext;

          const { fetchRequestInit, url } = getOperationRequestInit({
            path,
            method,
            //@ts-ignore
            servers,
            data: {},
            parameters,
            securitySchemes,
          });

          return {
            name: item.id, // e.g. get_weather
            description: item.operation.description || item.operation.summary,

            // url string, the API endpoint where your function exists
            // NB: as this can be based on the data (and parameters) we might have a problem with some openapis
            url,
            parameters: item.resolvedRequestBodySchema,

            // Bearer token for provided api endpoint so we can auth to your function
            key: `Bearer ${assistant.openapiAuthToken}`,
          };
        })
      : undefined;

  console.log({ functions });

  handleWebSocketSession(server, { assistant, deepgramToken, functions });

  return new Response(null, {
    status: 101,
    webSocket: client,
  });
};

async function handleWebSocketSession(
  webSocket: WebSocket,
  context: {
    assistant: AssistantType;
    deepgramToken: string;
    functions: any[] | undefined;
  },
) {
  webSocket.accept();

  const { assistant, functions, deepgramToken } = context;

  const configMessage = {
    type: "SettingsConfiguration",
    audio: {
      input: {
        encoding: "mulaw",
        sample_rate: 8000,
      },
      output: {
        encoding: "mulaw",
        sample_rate: 8000,
        container: "none",
        buffer_size: 250,
      },
    },
    agent: {
      listen: {
        model: "nova-2",
      },
      think: {
        provider: "open_ai",
        model: "gpt-4o",
        instructions: assistant.instructions,
        // functions,
      },
      speak: {
        model: "aura-asteria-en",
      },
      context: {
        // messages: [
        // optional, llm message thread to pick back up existing conversation (e.g if websocket connection breaks), coming soon
        // TODO: It would be great if the messages here can be a summary of all kinds of things that we know about the user through past conversations. But this stuff should probably be made available through some sort of endpoint, as this is intended to be a universal api.
        // ],
      },
    },
  };

  const audioQueue: any[] = [];
  let streamSid: undefined | string = undefined;

  let stsWs: WebSocket | null = null;

  function connectToSts() {
    return new WebSocket(agentWsUrl, ["token", deepgramToken]);
  }

  async function handleStsWebSocket() {
    stsWs = connectToSts();
    stsWs.addEventListener("open", () => {
      stsWs?.send(JSON.stringify(configMessage));
    });

    stsWs.addEventListener("message", async (event) => {
      const message = event.data;

      if (typeof message === "string") {
        // this logs what is happening
        console.log(message);
        return;
      }

      const rawMulaw = message;
      const mulawString = String.fromCharCode(...new Uint8Array(rawMulaw));
      const mediaMessage = {
        event: "media",
        streamSid,
        media: { payload: btoa(mulawString) },
      };

      webSocket.send(JSON.stringify(mediaMessage));
    });
  }

  async function handleTwilioWebSocket() {
    const BUFFER_SIZE = 20 * 160;
    let inbuffer: Uint8Array = new Uint8Array(0);

    webSocket.addEventListener("message", async (event) => {
      const data = JSON.parse(event.data as string);
      if (data.event === "start") {
        const start = data.start;
        console.log("got our streamsid", start.streamSid);
        streamSid = start.streamSid;
      }
      if (data.event === "connected") {
        return;
      }
      if (data.event === "media") {
        const media = data.media;
        const chunk = new Uint8Array(
          atob(media.payload)
            .split("")
            .map((char) => char.charCodeAt(0)),
        );
        if (media.track === "inbound") {
          const newBuffer = new Uint8Array(inbuffer.length + chunk.length);
          newBuffer.set(inbuffer);
          newBuffer.set(chunk, inbuffer.length);
          inbuffer = newBuffer;
        }
      }
      if (data.event === "stop") {
        return;
      }

      while (inbuffer.length >= BUFFER_SIZE) {
        const chunk = inbuffer.slice(0, BUFFER_SIZE);
        audioQueue.push(chunk);
        inbuffer = inbuffer.slice(BUFFER_SIZE);

        if (stsWs && stsWs.readyState === WebSocket.OPEN) {
          stsWs.send(chunk.buffer);
        } else {
          console.warn("STS WebSocket not open, cannot send chunk");
        }
      }
    });
  }

  handleStsWebSocket();
  handleTwilioWebSocket();
}
