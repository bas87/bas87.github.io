---
title: Two requests, one answer
date: 2026-11-20
description: Gemini wrote my text and my tool call in two LLM calls, one after the other. With tool_choice I send two requests at the same time and merge them into one response.
---

My agent's first answer is text plus next-step buttons from a tool call. Gemini doesn't write both in one response. It does them in two LLM calls, one after the other.

So this is a hook only for Gemini. Other models, like Claude, send the text and the tool call in one response. They get one normal request.

For Gemini I send two requests at the same time, with the same history. One is forced to call the buttons tool, the other can only write text. Both use [`tool_choice`](https://docs.langchain.com/oss/python/langchain/models#forcing-tool-calls). I wait for the slower one, not the sum ([why that matters](/notes/why-ai-agents-feel-slow/)). It saves about 4 to 5 seconds.

```
       same history
        /        \
request A      request B
tool call      text only
        \        /
      one response
           ↓
  agent runs the tool
           ↓
          end
```

```python
# sketch, inside a wrap_model_call middleware
steps, answer = await asyncio.gather(
    model.bind_tools(tools, tool_choice="next_steps").ainvoke(messages),
    model.bind_tools(tools, tool_choice="none").ainvoke(messages),
)
answer.tool_calls = steps.tool_calls  # return as one response
```

The agent runs the tool normally. Then I end the turn: the merged message has no thought signature for that call, and Gemini rejected it (HTTP 400) when the same turn continued.

One catch: the prompt must agree with `tool_choice`. When the text request's prompt still asked for the tool call, and a LangChain middleware added text about another tool, Gemini returned `MALFORMED_FUNCTION_CALL` on every request.

One trade-off: the buttons don't see the answer text.

If two outputs don't need each other, ask for them at the same time.
