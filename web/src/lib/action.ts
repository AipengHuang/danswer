"use server";

import { streamText, generateObject, generateText } from "ai";

import { createOpenAI } from "@ai-sdk/openai";
import { createStreamableValue } from "ai/rsc";

const gpt = createOpenAI({
  baseURL: process.env.OPENAI_API_URL,
  apiKey: process.env.OPENAI_API_KEY,
});

export async function getAiStreamMessage({ answer }: { answer: string }) {
  if (!answer) {
    return "";
  }

  const prompt = `基于以下回答，生成三个相关的后续问题，用中文表示，每个问题一行：

  回答：
  ${answer}
  
  相关问题：`;
  const stream = createStreamableValue("");

  (async () => {
    // const model = kimi("moonshot-v1-128k");
    const model = gpt("gpt-3.5-turbo");
    const { textStream } = await streamText({
      model,
      prompt: prompt,
      temperature: 0.5,
    });
    for await (const delta of textStream) {
      console.log(delta);
      stream.update(delta);
    }
    stream.done();
  })();

  return {
    output: stream.value,
  };
}

export async function getAiObject<T>({ answer }: { answer: string }) {
  try {
    if (!answer) {
      return "";
    }

    const prompt = `基于以下回答，生成三个相关的后续问题，用中文表示，每个问题一行：

    回答：
    ${answer}
    
    相关问题：`;
    const model = gpt("gpt-3.5-turbo");
    const object = await generateText({
      model,
      prompt: prompt,
      temperature: 0.5,
    });

    if (!object) {
      throw new Error("No object generated");
    }
    console.log("object:", object);
    return object.text;
  } catch (error) {
    console.error("Error in getAiObject:", error);
    throw error; // Re-throw error for upstream handling
  }
}
