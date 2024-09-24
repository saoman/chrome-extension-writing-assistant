import {radioOptions，API_URL，API_KEY} from "./constans"

chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  console.log('request', request);
  console.log('sender', sender);
  if (request.action === 'editing') {
    generate(request, sender, sendResponse);
  }
});

let controller: AbortController | null = null; // Store the AbortController instance
let innerText = "";

const generate = async (request: any, sender: any, sendResponse: any) => {
  // Alert the user if no prompt value
  if (!request.word) {
    alert("Please enter a prompt.");
    return;
  }
  stop()
  // Disable the generate button and enable the stop button
  innerText = "Generating...";
  sendDataToContentScript(innerText);

  // Create a new AbortController instance
  controller = new AbortController();
  const signal = controller.signal;
  const prompt = radioOptions.find((el)=> el.value === request.type)?.prompt
  console.log("prompt:",prompt,request)
  try {
    // Fetch the response from the OpenAI API with the signal from AbortController
    const response = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json;charset=utf8",
        Authorization: `Bearer ${API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-3.5-turbo",
        messages: [
          // { role: "system", "content": "" },
          // { role: "user", "content": `以可靠的方式重写以下文本以保持含义\n${request.word}` }
          { role: "user", "content": `${prompt}\`${request.word}\`` }
        ],
        "temperature": 0,
        // max_tokens: 4000,
        stream: true, // For streaming responses
      }),
      signal, // Pass the signal to the fetch request
    });

    // Read the response as a stream of data
    const reader = response.body!.getReader();
    const decoder = new TextDecoder("utf-8");
    innerText = "";
    sendDataToContentScript(innerText);

    while (true) {
      const { done, value } = await reader.read();
      if (done) {
        break;
      }
      // Massage and parse the chunk of data
      const chunk = decoder.decode(value);
      // console.log('chunk',chunk)
      const lines = chunk.split("\n");
      const parsedLines = lines
        .map((line) => line.replace(/^data: /, "").trim()) // Remove the "data: " prefix
        .filter((line) => line !== "" && line !== "[DONE]") // Remove empty lines and "[DONE]"
        .map((line) => JSON.parse(line)); // Parse the JSON string

      for (const parsedLine of parsedLines) {
        const { choices } = parsedLine;
        const { delta } = choices[0];
        const { content } = delta;
        // Update the UI with the new content
        if (content) {
          innerText += content;
          sendDataToContentScript(innerText);
        }
      }
    }
  } catch (error) {
    // Handle fetch request errors
    if (signal.aborted) {
      innerText = "Request aborted.";
      sendDataToContentScript(innerText);
    } else {
      console.error("Error:", error);
      innerText = "Error occurred while generating.";
      sendDataToContentScript(innerText);
    }
  } finally {
    // Enable the generate button and disable the stop button
    controller = null; // Reset the AbortController instance
  }
};

const stop = () => {
  // Abort the fetch request by calling abort() on the AbortController instance
  if (controller) {
    controller.abort();
    controller = null;
  }
};

// 发送消息给content script
function sendDataToContentScript(data: string) {
  chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
    tabs[0].id &&  chrome.tabs.sendMessage(tabs[0].id, { type: 'editing', data: data });
  });
}