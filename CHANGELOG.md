<!-- API Documentation:
Reference: https://developers.deepgram.com/reference/voicebot-api-phase-preview-copy
Python client example code: https://developers.deepgram.com/reference/ai-agent-api-python-client
JS client example code https://developers.deepgram.com/reference/js-example-client
Twilio Integration Example:
https://github.com/nikolawhallon/sts-twilio/tree/main -->

**🎉 Now I can potentially already use all agents inside of actionschema!**

# Improve sts with custom agents

✅ Ensure `/agent.json` returns an actual assistant JSON!

✅ Copy repo to `deepgram-twilio-agent-demo` and leave as-is there.

✅ Get param `?agentUrl=xxx&deepgramToken=xxx` in url

✅ Use that deepgram token instead of hosted secret.

✅ Try fetching `agentUrl` (if not available, use default config)

✅ The instructions can be mapped into this config!

✅ Make an assistant that uses tools in the 'platform.openai.com'

✅ Ensure syncing agents works (agents all end up in the db). Seems broken.

✅ Fetch it in `agent.actionschema.com/asst_gwokTex8ADkoZTVWMz604vHs/details.json` and confirm it shows itself including functions and any other settings.

# Test STS with new setup

✅ First refactor agents

✅ Put all info we have into the stuff and see what we need to present in `details`

Fix these node compatibility issues of cloudflare

```md
[ERROR] No matching export in "node-modules-polyfills:child_process" for import "execSync"

    node_modules/from-anywhere/build/node/executeCommandQuietUnlessFail.js:1:9:
      1 │ import { execSync } from "node:child_process";
        ╵          ~~~~~~~~

✘ [ERROR] No matching export in "node-modules-polyfills:util" for import "promisify"

    node_modules/from-anywhere/build/node/fs-util/fs.js:3:9:
      3 │ import { promisify } from "util";
        ╵          ~~~~~~~~~

✘ [ERROR] No matching export in "node-modules-polyfills:readline" for import "createInterface"

    node_modules/from-anywhere/build/node/fs-util/readFilePerLine.js:1:9:
      1 │ import { createInterface } from "readline";
        ╵
```

✅ Deploy wrangler successfully

✅ Use this as URL in twilio

✅ Call it and confirm! Now every GPT can be used via a phonenumber (via my token) simply by providing a URL in Twilio.

**🎉 Now people login with openai and can speak sts with all their agents! ^^**

# Whatsapp Client

✅ Can I transform the `receiveWhatsappTwilio` thing so it must contain the `?agentUrl=xxx&Authorization=xxx` and correctly responds?

✅ Should call `/message` endpoint

✅ Do the same for all other things Twilio serves, basically creating a Twilio+GPT Link.

# HTML STS Client

✅ `index.ts:99` --> Fix JSONParseError

✅ Setup Local Tunnel in `npm run dev`: https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/get-started/create-local-tunnel/ <-- NEEDS A FIXED URL TO PUT IN A PHONE NUMBER

✅ Get a Whatsapp Phone Number and talk to Wijnand AI that is in dev...

✅ https://developers.deepgram.com/reference/js-example-client

✅ The websocket is now made available through a URL in twilio containing all info - without there being a datastore. However, it can be great for PR if we allow people to find agents and either chat with them (via opengpts) or speak (via html client).

✅ Render a button on the agent that opens the browser client for talking to it through websocket (requires user to fill a deepgram token)

# Self Control

Adding tools to call someone or to hang up the call are super cool for twilio calls. Let's try this out!

In `/message` a tool that would change the tools to another agent would also be super interesting.
