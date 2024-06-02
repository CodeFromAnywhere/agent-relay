import qs from "qs";

addEventListener("fetch", (event) => {
  event.respondWith(handleRequest(event.request));
});

const agentWsUrl = "wss://sts.sandbox.deepgram.com/agent";

type AssistantType = { instructions: string };

async function handleRequest(request: Request) {
  const url = new URL(request.url);
  url.search;

  const deepgramToken = url.searchParams.get("deepgramToken");
  const agentUrl = url.searchParams.get("agentUrl");

  if (!deepgramToken || !agentUrl) {
    return new Response(
      `<?xml version="1.0" encoding="UTF-8"?>
          <Response>
              <Say>Please ensure your agent and deepgram token are defined!</Say>
          </Response>`,
      { headers: { "content-type": "text/xml" } },
    );
  }

  const assistant = await fetch(agentUrl, {
    method: "GET",
    headers: { accept: "application/json" },
  }).then((res) => res.json() as Promise<AssistantType>);

  if (!assistant) {
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
                  <Stream url="wss://${url.host}" />
              </Connect>
              <Say>Stream has ended. Goodbye!</Say>
          </Response>`,
      {
        headers: { "content-type": "text/xml" },
      },
    );
  }

  const webSocketPair = new WebSocketPair();
  const [client, server] = Object.values(webSocketPair);

  const agentSlug = url.pathname.slice(1);

  handleWebSocketSession(server, { agentSlug, deepgramToken, assistant });

  return new Response(null, {
    status: 101,
    webSocket: client,
  });
}

function handleWebSocketSession(
  webSocket: WebSocket,
  context: {
    agentSlug: string;
    deepgramToken: string;
    assistant: AssistantType;
  },
) {
  const { agentSlug, deepgramToken, assistant } = context;
  webSocket.accept();

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

        //        "You are a helpful voice assistant. You cannot perform actions, but you have expert knowledge. Please be as concise as possible.",
        functions: [
          /*

          TODO: map an openapi to this format (not that hard) and see if it works.

          A starting point would be an api to be able to send an SMS, Email, or WhatsApp message to the caller.

          Another one would be to allow it to search via perplexity.

          {
          "name": "",// e.g. get_weather
          "api_endpoint": "", // url string, the API endpoint where your function exists
          "api_secret": "", // bearer token for provided api endpoint so we can auth to your function
          "description": "", // e.g Get the current weather in a given location
          "input_schema": {
            "type": "", // e.g. object
            "properties": {
              "location": {
                "type": "", // e.g. string
                "description": "" // e.g. The city and state, e.g. San Francisco, CA
              }
            }
          },
          "required": [""] //required properties in above defined function  e.g. location 
        }
        */
        ],
      },
      speak: {
        model: "aura-asteria-en",
      },
      context: {
        messages: [
          // optional, llm message thread to pick back up existing conversation (e.g if websocket connection breaks), coming soon
          // TODO: It would be great if the messages here can be a summary of all kinds of things that we know about the user through past conversations. But this stuff should probably be made available through some sort of endpoint, as this is intended to be a universal api.
        ],
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
        console.log("got our streamsid", streamSid);
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
