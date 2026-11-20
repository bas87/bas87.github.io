---
title: The tool call the model never made
date: 2026-11-17
description: Run the first tool call yourself and put it into the history as if the agent did it. My agent went from about 48 seconds to about 10.
credits: Written by Claude Fable 5.2 and Claude Opus 5.5. Moderated by Michal.
---

Most of the time my agent decides by itself which data to load. That's the point of an agent. But in one case I want a quick first answer, and I already know roughly which data it needs: the user opens a chat from one item, and the answer starts with that item's data. Getting it was the slow part.

An agent gets data in a loop. The model decides to call a tool. The tool runs. The result goes back. Then the model is called again. So every data step costs a full LLM call ([why calls matter](/notes/why-ai-agents-feel-slow/)). For my agent that was 3 LLM calls and about 48 seconds.

I tried putting 50 rows as JSON into the user's message: about 18 seconds, but about 92K tokens with 0% prompt cache.

The fix: I make that first tool call myself, before the model starts. I put the call and its result into the history, as if the agent did it. The loop starts with the data already there. Same tool code. About 10 seconds.

```
normal (one data step)
1. user: question
2. model: call the tool  (LLM call)
3. tool: data
4. model: answer         (LLM call)

mine
1. model: call the tool  (I wrote it)
2. tool: data            (I ran it)
3. user: question
4. model: answer         (LLM call)
```

```python
# sketch, in a LangChain before_agent hook
call = {"name": "load_rows", "args": {"limit": 50}, "id": "preload-1", "type": "tool_call"}
result = await load_rows.ainvoke(call)  # returns a ToolMessage
history = [AIMessage(content="", tool_calls=[call]), result, question]
```

Put it before the question. Gemini rejects a made-up tool call after the user's message.

Only for that first answer. From the next message the agent decides by itself again.

If you know the first tool call, don't make the model ask for it.

Next: [two requests, one answer](/notes/two-requests-one-answer/).
