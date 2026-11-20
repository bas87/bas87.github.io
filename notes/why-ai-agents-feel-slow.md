---
title: Why AI agents feel slow
date: 2026-11-15
description: It's usually not the tools or the model. It's how many LLM calls the agent makes in a row. Fewer calls, faster answer.
credits: Written by Claude Fable 5.2 and Claude Opus 5.5. Moderated by Michal.
---

My agent took almost five minutes to answer. Every tool finished in under a second. The time was in the model calls.

My rule now:

```
total time ≈ LLM calls in a row × time per call
```

What made the difference, most important first:

- **LLM calls in a row.** An agent is [a model calling tools in a loop](https://docs.langchain.com/oss/python/langchain/agents). Every round is one more call. Calls that run at the same time don't add up ([example](/notes/two-requests-one-answer/)).
- **The context.** What the model gets up front. Load the data before the model starts ([how I did it](/notes/synthetic-tool-call/)). Say in the prompt: "dig deeper only if asked". Keep it small.
- **The thinking level.** Lower it when the model only sums up data it already has ([reasoning settings](https://docs.langchain.com/oss/python/langchain/models)).
- **The model.** A faster model helped less than I expected. Each call is faster, but the number of calls stays the same.

Subagents on a linear task only add more calls.

Count the LLM calls first. Then remove them.
