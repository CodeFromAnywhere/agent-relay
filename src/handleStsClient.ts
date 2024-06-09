import {
  fetchOpenapi,
  getFormContextFromOpenapi,
  getOperationRequestInit,
} from "openapi-util";
import { AssistantType } from "./types";
import { getOperations } from "openapi-util/build/node/getOperations";

export const handleStsClient = async (request: Request) => {
  const url = new URL(request.url);
  const agentUrl = url.searchParams.get("agentUrl");
  const adminAuthToken = url.searchParams.get("adminAuthToken");
  const deepgramToken = url.searchParams.get("deepgramToken");

  if (!agentUrl || !adminAuthToken || !deepgramToken) {
    const html = await fetch(
      "https://raw.githubusercontent.com/CodeFromAnywhere/agent-relay/main/src/index.html",
      { method: "GET" },
    ).then((x) => x.text());

    return new Response(html, {
      headers: {
        "content-type": "text/html;charset=UTF-8",
      },
    });
  }

  const fullUrl = `https://${agentUrl}`;
  const assistant = await fetch(fullUrl, {
    method: "POST",
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${adminAuthToken}`,
    },
  }).then((res) => res.json() as Promise<AssistantType>);
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
            method: "post",
            // Bearer token for provided api endpoint so we can auth to your function
            key: `${assistant.openapiAuthToken}`,
          };
        })
      : undefined;

  console.log({ functions });

  const html = `<!DOCTYPE html>
  <html lang="en">
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <meta name="robots" content="noindex" />
      <title>WebSocket Microphone Streaming</title>
      <style>
        body {
          display: flex;
          justify-content: center;
          align-items: center;
          height: 100vh;
          margin: 0;
          flex-direction: column;
          background-color: #f0f0f0;
        }
        canvas {
          width: 100%;
          height: 100%;
          max-width: 350px;
          max-height: 350px;
          margin-bottom: 15%;
        }
        #startContainer {
          position: absolute;
          top: 100px;
          text-align: center;
          display: flex;
          flex-direction: column;
          width: 400px;
        }
        #startContainer select {
          padding: 10px;
          margin-bottom: 10px;
          border: 2px solid #ccc;
          border-radius: 5px;
          font-size: 14px;
        }
        #startConversationBtn {
          padding: 10px 20px;
          border: none;
          border-radius: 5px;
          background-color: #007bff;
          color: white;
          cursor: pointer;
          transition: background-color 0.2s ease;
        }
        #startConversationBtn:hover {
          background-color: #0056b3;
        }
        #instructionsContainer {
          position: absolute;
          bottom: 100px;
          text-align: center;
          display: flex;
          flex-direction: column;
          width: 400px;
        }
        #instructionsInput {
          padding: 10px;
          margin-bottom: 10px;
          border: 2px solid #ccc;
          border-radius: 5px;
          resize: vertical;
          font-size: 14px;
        }
        #updateInstructionsBtn {
          padding: 10px 20px;
          border: none;
          border-radius: 5px;
          background-color: #007bff;
          color: white;
          cursor: pointer;
          transition: background-color 0.2s ease;
        }
        #updateInstructionsBtn:hover {
          background-color: #0056b3;
        }
        #buttonContainer {
          position: absolute;
          bottom: 250px;
          display: flex;
          justify-content: center;
          gap: 20px;
        }
        .circle-button {
          width: 60px;
          height: 60px;
          border-radius: 50%;
          background-color: #ddd;
          display: flex;
          justify-content: center;
          align-items: center;
          cursor: pointer;
          transition: box-shadow 0.3s ease;
          flex-direction: column;
          text-align: center;
        }
        .circle-button img {
          width: 50%;
          height: 50%;
        }
        .circle-button.selected {
          box-shadow: 0 0 10px 3px rgba(0, 0, 0, 0.5);
        }
        .button-title {
          margin-top: 5px;
          font-size: 12px;
        }
        @media only screen and (max-width: 768px) {
          #buttonContainer {
            bottom: 150px;
            gap: 10px;
          }
          #instructionsContainer {
            bottom: 10px;
            width: 350px;
          }
          #startContainer {
            top: 10px;
            width: 350px;
          }
          canvas {
            margin-bottom: 50%;
          }
        }
      </style>
      <script>
        window.onload = function () {
          var voiceInput = document.getElementById("voice");
          var modelInput = document.getElementById("model");
  
          document.getElementById("startConversationBtn").addEventListener("click", function () {
            document.getElementById("startContainer").style.display = "none";
            document.getElementById("blobCanvas").style.display = "flex";
            document.getElementById("buttonContainer").style.display = "flex";
            document.getElementById("instructionsContainer").style.display = "flex";
  
            var voice = voiceInput.options[voiceInput.selectedIndex].value;
            var providerAndModel = modelInput.options[modelInput.selectedIndex].value.split("+");
  
            // TODO - Paste your API key in here.
            var ws = new WebSocket("wss://sts.sandbox.deepgram.com/agent", ["token", "${deepgramToken}"]);
  
            // Blob animation setup
            var targetAudioLevel = 0;
            var audioLevel = 0;
  
            // Global audio context
            var audioContext = new (window.AudioContext ||
              window.webkitAudioContext)({ latencyHint: "interactive" });
  
            // Configuration settings for the agent
            var config_settings = {
              type: "SettingsConfiguration",
              audio: {
                input: {
                  encoding: "linear16",
                  sample_rate: 16000
                },
                output: {
                  encoding: "linear16",
                  sample_rate: 48000,
                  container: "none",
                  buffer_size: 250,
                }
              },
              agent: {
                listen: {
                  model: "nova-2"
                },
                think: {
                  provider: providerAndModel[0],
                  model: providerAndModel[1],
                  instructions: "${assistant.instructions}"
                 // functions: ${JSON.stringify(functions)}
                },
                speak: {
                  model: voice
                }
              }
            };
  
            // Update the text area to match the initial instructions
            document.getElementById("instructionsInput").value =
              config_settings.agent.think.instructions;
  
              // button selection code
            var voice_selection = voice; // Default selection
            document.getElementById(voice_selection).classList.add("selected");
  
            document.querySelectorAll(".circle-button").forEach((button) => {
              button.addEventListener("click", function () {
                document
                  .querySelector(".circle-button.selected")
                  .classList.remove("selected");
                this.classList.add("selected");
                var voice_selection = this.id;
                console.log("Voice selection changed to:", voice_selection);
  
                ws.send(JSON.stringify({
                  "type": "UpdateSpeak",
                  "model": voice_selection
                }));
              });
            });
  
            // Update the instructions when a button is clicked
            document
              .getElementById("updateInstructionsBtn")
              .addEventListener("click", function () {
                var instructions =
                  document.getElementById("instructionsInput").value;
                ws.send(JSON.stringify({
                  "type": "UpdateInstructions",
                  "instructions": instructions
                }))
              });
  
            function updateBlobSize(level) {
              targetAudioLevel = level; // Set the new target level
            }
  
            function animateBlob() {
              var canvas = document.getElementById("blobCanvas");
              var ctx = canvas.getContext("2d");
              var time = performance.now() * 0.001;
              // Smoothing the transition by moving audioLevel towards targetAudioLevel
              audioLevel += (targetAudioLevel - audioLevel) * 0.05;
              var centerX = canvas.width / 2;
              var centerY = canvas.height / 2;
              var baseSize = 200 + audioLevel * 100; // Adjust base size based on audio level
              // Create a gradient from deep teal to lighter teal
              var gradient = ctx.createRadialGradient(
                centerX,
                centerY,
                baseSize * 0.00005,
                centerX,
                centerY,
                baseSize
              );
              gradient.addColorStop(0, "#005f73"); // Deep teal
              gradient.addColorStop(1, "#005f73 "); // Lighter teal
  
              canvas.width = canvas.width; // Clear canvas for new frame
              ctx.beginPath();
              ctx.moveTo(centerX, centerY);
              // Create a rounded, flowing shape by varying the radius subtly
  
              for (let angle = 0; angle <= Math.PI * 2; angle += 0.01) {
                let smoothRandom =
                  Math.sin(angle * (3 + Math.random() * 0.005) + time) * 5 +
                  Math.cos(angle * (5 + Math.random() * 0.005) + time) * 5;
                let radius = baseSize + smoothRandom; // Incorporate the smoothed random factor
                let x = centerX + radius * Math.cos(angle);
                let y = centerY + radius * Math.sin(angle);
                ctx.lineTo(x, y);
              }
  
              ctx.closePath();
              ctx.fillStyle = gradient;
              ctx.fill();
  
              // Gradually decrease audioLevel to return to normal size
              audioLevel *= 0.95;
  
              requestAnimationFrame(animateBlob);
            }
  
            ws.binaryType = 'arraybuffer';
  
            ws.onopen = function () {
              console.log("WebSocket connection established.");
              ws.send(JSON.stringify(config_settings)); // Send initial config on connection
              startStreaming();
            };
  
            ws.onerror = function (error) {
              console.error("WebSocket error:", error);
            };
  
            ws.onmessage = function (event) {
              // console.log("receiving message?");
              if (typeof event.data === "string") {
                console.log("Text message received:", event.data);
                // Handle text messages here
              } else if (
                event.data instanceof ArrayBuffer
              ) {
                // update blob animation size based on audio level
                var simulatedVolumeLevel = 0.05; // This should be replaced with real analysis
                updateBlobSize(simulatedVolumeLevel * 5); // Adjust scale as needed
  
                feedAudioData(event.data);
              } else {
                console.error("Unsupported message format.");
              }
            };
  
            var audioContextOut = new (window.AudioContext || window.webkitAudioContext)({ latencyHint: "interactive", sampleRate: 48000 });
            var startTime = -1;
  
            function feedAudioData(audioData) {
              // See https://stackoverflow.com/a/61481513 for tips on smooth playback
  
              var audioDataView = new Int16Array(audioData);
  
              if (audioDataView.length === 0) {
                console.error("Received audio data is empty.");
                return;
              }
  
              var audioBuffer = audioContextOut.createBuffer(
                1,
                audioDataView.length,
                48000
              ); // 1 channel, 48 kHz sample rate
              var audioBufferChannel = audioBuffer.getChannelData(0);
  
              // Copy audio data to the buffer
              for (var i = 0; i < audioDataView.length; i++) {
                audioBufferChannel[i] = audioDataView[i] / 32768; // Convert linear16 PCM to float [-1, 1]
              }
  
              var source = audioContextOut.createBufferSource();
              source.buffer = audioBuffer;
              source.connect(audioContextOut.destination);
  
              if (startTime < audioContextOut.currentTime) {
                startTime = audioContextOut.currentTime;
              }
              source.start(startTime);
              startTime += audioBuffer.duration;
            }
  
            function startStreaming() {
              if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
                console.error("getUserMedia is not supported in this browser.");
                return;
              }
  
              var constraints = {
                audio: {
                  sampleRate: 16000,
                  channelCount: 1,
                  volume: 1.0,
                  echoCancellation: true,
                  noiseSuppression: false,
                  latency: 0,
                },
              };
  
              navigator.mediaDevices
                .getUserMedia(constraints)
                .then(function (stream) {
                  var audioContext = new AudioContext();
                  var microphone = audioContext.createMediaStreamSource(stream);
                  var processor = audioContext.createScriptProcessor(4096, 1, 1);
  
                  processor.onaudioprocess = function (event) {
                    // console.log("sending audio data?");
                    var inputData = event.inputBuffer.getChannelData(0);
                    // update blob size based on audio level
                    var rms = Math.sqrt(
                      inputData.reduce((sum, value) => sum + value * value, 0) /
                        inputData.length
                    );
                    updateBlobSize(rms * 5); // Scale RMS value to control size
  
                    var downsampledData = downsample(inputData, 48000, 16000);
                    ws.send(convertFloat32ToInt16(downsampledData));
                  };
  
              microphone.connect(processor);
              processor.connect(audioContext.destination);
            })
            .catch(function (error) {
              console.error("Error accessing microphone:", error);
            });
        }
  
        function downsample(buffer, fromSampleRate, toSampleRate) {
          if (fromSampleRate === toSampleRate) {
            return buffer;
          }
          var sampleRateRatio = fromSampleRate / toSampleRate;
          var newLength = Math.round(buffer.length / sampleRateRatio);
          var result = new Float32Array(newLength);
          var offsetResult = 0;
          var offsetBuffer = 0;
          while (offsetResult < result.length) {
            var nextOffsetBuffer = Math.round(
              (offsetResult + 1) * sampleRateRatio
            );
            var accum = 0, count = 0;
            for (
              var i = offsetBuffer;
              i < nextOffsetBuffer && i < buffer.length;
              i++
            ) {
              accum += buffer[i];
              count++;
            }
            result[offsetResult] = accum / count;
            offsetResult++;
            offsetBuffer = nextOffsetBuffer;
          }
          return result;
        }
  
        function convertFloat32ToInt16(buffer) {
          var l = buffer.length;
          var buf = new Int16Array(l);
          while (l--) {
            buf[l] = Math.min(1, buffer[l]) * 0x7fff;
          }
          return buf.buffer;
        }
        animateBlob(); // Start the blob animation
      });
    };
  </script>
  </head>
  
  <body>
    <canvas id="blobCanvas" width="700" height="700" style="display: none;"></canvas>
    <div id="startContainer">
      <select id="voice">
        <option value="aura-asteria-en">Asteria</option>
        <option value="aura-athena-en">Athena</option>
      </select>
      <select id="model">
        <option value="anthropic+claude-3-haiku-20240307">Anthropic: Claude 3 Haiku</option>
        <option value="groq+llama3-8b-8192">Groq: Llama 3 8b</option>
        <option value="groq+llama3-70b-8192">Groq: Llama 3 70b</option>
        <option value="groq+mixtral-8x7b-32768">Groq: Mixtral 8x7b</option>
        <option value="open_ai+gpt-3.5-turbo">OpenAI: GPT 3.5 Turbo</option>
      </select>
      <button id="startConversationBtn">Start Conversation</button>
    </div>
    <div id="instructionsContainer" style="display: none;">
      <textarea
        id="instructionsInput"
        placeholder="Enter instructions here..."
      ></textarea>
      <button id="updateInstructionsBtn">Update Instructions</button>
    </div>
    <div id="buttonContainer" style="display: none;">
      <div class="circle-button" id="aura-asteria-en">
        <div class="button-title">Asteria</div>
      </div>
      <div class="circle-button" id="aura-athena-en">
        <div class="button-title">Athena</div>
      </div>
    </div>
  </body>
  </html>`;
  return new Response(html, {
    headers: {
      "content-type": "text/html;charset=UTF-8",
    },
  });
};
