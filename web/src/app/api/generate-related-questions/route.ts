import { NextRequest } from "next/server";
import { generateText } from "ai";

import { createOpenAI } from "@ai-sdk/openai";

const kimi = createOpenAI({
  baseURL: process.env.KIMI_API_URL,
  apiKey: process.env.KIMI_API_KEY,
});

export async function POST(req: NextRequest) {
  try {
    const { answer } = await req.json();
    debugger;
    if (!answer) {
      return new Response(JSON.stringify({ error: "Answer is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const prompt = `Based on the following answer, generate three related follow-up questions and return in JSON format:

Answer:
${answer}

Related questions JSON format: { "questions": [ "Question1", "Question2", "Question3" ] }
`;

    const model = kimi("moonshot-v1-128k");

    const object = await generateText({
      model,
      prompt: prompt,
      temperature: 0.1,
    });

    if (!object) {
      throw new Error("No object generated");
    }

    // const openai = new OpenAI({
    //   apiKey: process.env.KIMI_API_KEY,
    //   baseURL: process.env.KIMI_API_URL,
    // });

    // const completion = await openai.chat.completions.create({
    //   model: "gpt-3.5-turbo",
    //   messages: [{ role: "user", content: prompt }],
    //   max_tokens: 150,
    //   temperature: 0.5,
    // });

    // const generatedText = completion;
    // console.log("generatedText:", generatedText);
    // const questions = generatedText
    //   .split("\n")
    //   .map((q: string) => q.trim())
    //   .filter((q: string) => q);

    return new Response(JSON.stringify({ questions: object.text }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error generating related questions:", error);
    return new Response(
      JSON.stringify({ error: "Failed to generate related questions" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}
