import type { OpenAI as OpenAIClient } from "openai";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { BaseMessageChunk } from "@langchain/core/messages";

export const QA_TOOL_SCHEMA: OpenAIClient.ChatCompletionTool = {
  type: "function",
  function: {
    name: "questionAnswer",
    description: "The answer to the question",
    parameters: {
      type: "object",
      properties: {
        answer: {
          type: "string",
          description: "The answer to the question",
        },
        followupQuestions: {
          type: "array",
          items: {
            type: "string",
            description: "Follow up questions to the answer",
          },
        },
      },
      required: ["answer", "followupQuestions"],
    },
  },
};

// notes allows the model to capture details much better than 'summary'
// the ending sentence apparently gives it better results

export const QA_ON_CV_PROMPT = ChatPromptTemplate.fromMessages([
  [
    "ai",
    `You are a representative of the candidate and you are answering questions about your CV from a recruiter.
        The goal is to provide detailed answers to the questions asked, using the information from the CV and any additional PDFs available.
        Here are some notes on the CV:
        {notes}

        And here are some relevant parts of the CV and additional PDFs relating to the questions:
        {relevantDocuments}
        
        Answer the recruiter's question in the context of the CV and additional PDFs. You should also suggest follow-up questions that the recruiter might ask based on your answer.
        Take a deep breath, and think through your reply carefully, step by step.`,
  ],
  ["human", "Question: {question}"],
]);

export const outputParser = (output: BaseMessageChunk): Array<{ answer: string; followupQuestions: string[] }> => {
  const toolCalls = output.additional_kwargs.tool_calls;
  if (!toolCalls || toolCalls.length === 0) {
    throw new Error("No tool calls found in output");
  }

  const response = toolCalls
  .map((call) => {
    const args = JSON.parse(call.function.arguments);
    return args;
    })
    .flat();
    return response;
};
