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

# Allow for any attachments

Now we are relying on gpt4 to process just the images which is useful as it is much more integrated and will be in the future, but what about processing of all kinds of stuff? An AI can do this in many ways and that is why we need cool tools.

Let's do it like this:

- provide `attachmentUrls` as text in an additional message, but provide some additional context for each file
- tools provided can use these URLs & context as parameters.

This way we can make our own multimodal LLM with extra functionalities that depend on the usecase. This keeps the model super general purpose.

A good start would be to create an agent that allows for image generation, speech generation, and speech analsysis. Perfect for whatsapp!

# Self Control

Adding tools to call someone or to hang up the call are super cool for twilio calls. Let's try this out!

In `/message` a tool that would change the tools to another agent would also be super interesting.

# Apply for grant

https://www.ngi.eu/opencalls/#ngizerocommonsfund3rd

apply with ai!
