import OpenAI from 'openai';

export const TIME_BUDGET_MESSAGE = 'The agent stopped after 150 seconds.';

/** The model answered, but the answer can't be used: for example, tool arguments that aren't valid JSON. */
export class UnreadableOutputError extends Error {}

/**
 * Streams one chat completion. `onText` receives the reply so far after
 * every chunk. The request is aborted at the run's deadline, including any
 * retries by the SDK.
 */
export async function streamCompletion({ openai, messages, tools = [], deadline, onText }) {
  const stream = openai.chat.completions.stream(
    {
      model: process.env.OPENROUTER_MODEL,
      messages,
      ...(tools.length > 0 && { tools }),
    },
    { signal: AbortSignal.timeout(Math.max(deadline - Date.now(), 1)) },
  );
  if (onText) stream.on('content.delta', ({ snapshot }) => onText(snapshot));
  try {
    const completion = await stream.finalChatCompletion();
    return completion.choices[0].message;
  } catch (err) {
    // The SDK parses the arguments of strict tools. Errors that don't come
    // from the API mean that the output itself was broken.
    if (
      err instanceof SyntaxError ||
      (err instanceof OpenAI.OpenAIError && !(err instanceof OpenAI.APIError))
    ) {
      throw new UnreadableOutputError(err.message);
    }
    throw err;
  }
}

/** A message for the person who asked, or null if the error is not a model error. */
export function modelFailureMessage(err) {
  if (err instanceof OpenAI.APIUserAbortError) return TIME_BUDGET_MESSAGE;
  if (
    err instanceof OpenAI.APIError &&
    err.status >= 400 &&
    err.status < 500 &&
    err.status !== 408 &&
    err.status !== 429
  ) {
    return 'The model provider rejected the request. Check the model ID and the API key.';
  }
  if (err instanceof OpenAI.APIError) return "The model didn't respond. Try again in a minute.";
  return null;
}
