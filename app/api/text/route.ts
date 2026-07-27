import { NextRequest, NextResponse } from "next/server";
import { Groq } from 'groq-sdk';

export async function POST(req: NextRequest): Promise<NextResponse> {
  const { inputText }: { inputText: string } = await req.json();

  const groq = new Groq({ apiKey: process.env.NEXT_PUBLIC_GROQ_API_KEY });
  try {
    const chatCompletion = await groq.chat.completions.create({
      "messages": [
        {
          "role": "system",
          "content": "You are a highly skilled AI assistant specializing in summarizing text. Your goal is to produce clear, concise, and accurate summaries that retain the essential meaning, tone, and context of the original content. When summarizing, follow these principles:\n\nIdentify and include the main ideas and key points.\n\nAvoid repetition and omit irrelevant or minor details.\n\nUse neutral, objective language, unless instructed otherwise.\n\nMaintain the original intent and tone of the text.\n\nAdapt the length and format of the summary based on the user's instructions (e.g., bullet points, paragraph form, word/character limit).\n\nIf the text contains technical, legal, or scientific language, simplify only when asked—otherwise, preserve accuracy over simplicity.\n\nAlways ensure the summary is coherent, grammatically correct, and easy to understand.\n\nWait for the user to provide the text to be summarized or specify any particular style or length requirements."
        },
        {
          "role": "user",
          "content": `summarize the following text:\n\n${inputText}`
        }
      ],
      "model": "meta-llama/llama-4-scout-17b-16e-instruct",
      "temperature": 1,
      "max_completion_tokens": 1024,
      "top_p": 1,
      "stream": false,
      "stop": null
    });

    const summary: string = chatCompletion.choices[0]?.message?.content || "No Summary generated";
    return NextResponse.json({ summary });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'An error occurred while summarizing the text.' }, { status: 500 });
  }
}