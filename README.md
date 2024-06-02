# Twilio STS Agent

This is a POC of Deepgram Agents Twilio Integration, hosted on CloudFlare Workers.

> Deepgram agent api: It’s a single, unified websocket API for building end-to-end voice agents. It lets you stream voice audio in, and get human-like voice responses back in real-time through a raw audio stream. It handles all of the conversational nuance to make the bot flow like a real human conversation. It’s very low-latency, and you can interrupt it without any additional logic - it just works.

## Installation

```
npm install -g wrangler
git clone https://github.com/CodeFromAnywhere/twilio-sts-agent.git
cd twilio-sts-agent
wrangler deploy
```

Take the resulting `*.workers.dev` URL

Add `?deepgramToken=xxx&agentUrl=xxx` to the url, and add that as a webhook URL of your twilio phone number.

Done!

## Usage

Call your Twilio phone number
