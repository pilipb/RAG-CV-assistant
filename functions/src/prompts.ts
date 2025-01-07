import type { OpenAI as OpenAIClient } from "openai";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { BaseMessageChunk } from "@langchain/core/messages";

export const NOTES_TOOL_SCHEMA: OpenAIClient.ChatCompletionTool = {
  type: "function",
  function: {
    name: "formatNotes",
    description: "Formats the notes response",
    parameters: {
      type: "object",
      properties: {
        notes: {
          type: "array",
          items: {
            type: "object",
            properties: {
              note: {
                type: "string",
                description: "The note content",
              },
              pageNumbers: {
                type: "array",
                items: {
                  type: "number",
                  description: "The page number of the note",
                },
              },
            },
          },
        },
      },
      required: ["notes"],
    },
  },
};


// notes allows the model to capture details much better than 'summary' 
// the ending sentence apparently gives it better results

export const NOTE_PROMPT = ChatPromptTemplate.fromMessages([
    [
        'ai',
        `Take notes on the following scientific paper.
        This is a technical paper outlining a computer science technique.
        The goal is to be able to create a complete understanding of the paper after reading all notes.

        Rules:
        - Include specific quotes and details from the paper in your notes.
        - Respond with as many notes as it might take to cover the entire paper.
        - Go into as much detail as you can, while keeping each note on a single topic.
        - Include notes about the results of any experiments the paper describes.
        - DO NOT respond with notes like: "This paper is about X." or "The paper describes Y." Instead, include the specific details that support those statements.

        Respond with a JSON array with two keys: "note" and "pageNumbers". 
        "note" should be a string with the note content. 
        "pageNumbers" should be an array of numbers, each number representing a page number where the note content is found.
        Take a deep breath, and work your way through the paper step by step.`,
    ],
    ['human', 'Paper: {paper}']
])

export type PaperNote = {
  note: string;
  pageNumbers: number[];
};

export const outputParser = (output: BaseMessageChunk): Array<PaperNote> => {
  const toolCalls = output.additional_kwargs.tool_calls;
  if (!toolCalls || toolCalls.length === 0) {
    throw new Error("No tool calls found in output");
  }

  const notes: Array<PaperNote> = toolCalls.map((call) => {
    const {notes} = JSON.parse(call.function.arguments);
    return notes;
  }).flat();
  return notes;
};