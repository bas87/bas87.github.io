---
title: The tool call the model never made
date: 2026-11-17
description: A quick question doesn't need a super agent. Make the first tool call yourself and let the model answer in one go.
---

In my [last note](/notes/why-ai-agents-feel-slow/) I found that speed is mostly about the number of LLM calls. So I want the agent to answer in one LLM call.

## The idea

In my case the agent needs data to answer. There are two obvious ways to get it:

- **Let the agent load it.** The tool is already there, but on the question I tested it took 3 LLM calls and about 48 seconds.
- **Put the data into the user's message.** No extra call, but the tool already knows how to load the data. To use the same code before the agent starts, I would have to move it to a shared place, and then two places know how to load the data. It was also slower than I expected: with the same 50 rows as JSON in the message, the request was about 92K tokens with 0% prompt cache, and the answer took about 18 seconds.

So I make the tool call myself, the same one the agent would make first. I run the tool before the model starts and put the call and its result into the history, as if the agent had done it. The tool stays where it is, and the frontend sends `data_id` only with the first message.

In LangChain it's a small middleware:

```python
from langchain.agents.middleware import AgentMiddleware
from langchain_core.messages import AIMessage, RemoveMessage


class DataPreloadMiddleware(AgentMiddleware):
    def __init__(self, tools):
        super().__init__()
        self.tool = next(t for t in tools if t.name == "get_user_data")

    async def abefore_agent(self, state, runtime):
        data_id = runtime.context.data_id
        if not data_id:
            return None  # normal chat, do nothing

        question = state["messages"][-1]
        call = {
            "name": self.tool.name,
            "args": {"data_id": data_id, "limit": 50},
            "id": f"preload_{data_id}",
            "type": "tool_call",
        }
        result = await self.tool.ainvoke(call)

        # tool call first, then the question (Gemini rejects a made-up tool call after the user's message)
        return {
            "messages": [
                RemoveMessage(id=question.id),
                AIMessage(content="", tool_calls=[call]),
                result,
                question.model_copy(update={"id": None}),
            ]
        }
```

There is one more thing in the same middleware (`wrap_model_call`). In the first answer, the model can use only one tool: suggest next steps. All other tools are hidden, so it can't go and load more data. It just answers. It's the same "answer first" idea from the last note, but done in code, not in the prompt. In the next message all tools are back, so the user can ask for more.

Result: about 10 seconds (the tool about 1.6s, one LLM call about 6s), down from 48 and 18.
