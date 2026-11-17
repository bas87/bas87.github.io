---
title: Why AI agents feel slow
date: 2026-11-15
description: It's usually not the tools or the model. It's how many LLM calls the agent makes. Fewer calls, faster answer.
---

I spent a few hours this week making an AI agent answer faster. Here are my notes.

## Where the time goes

The agent worked in a loop: call a tool, think, call another tool, think, then answer. It took almost five minutes.

The trace showed that the tools were fast, each one under a second. The time was in the model calls, and there were many of them. One step alone took over two minutes.

```
total time ≈ number of LLM calls × time per call
```

So it's mostly the number of LLM calls.

## What helps less than you think

- A faster model. Each call is a bit faster, but you still have all the calls.
- Subagents or parallel work. If the task is linear (A, then B, then answer), more agents only add more LLM calls. Parallel agents help only when the questions are independent.

## What helps: fewer LLM calls

1. **Let the LLM answer in one call.** Tell it: "Answer from what you have. Dig deeper only if the user asks." Without this, the model keeps loading more to be thorough.
2. **Get the data for it.** Load what the agent would load in its first steps before the LLM starts, and put it in the context. Those calls are gone. (How I did it: [the tool call the model never made](/notes/synthetic-tool-call/).)
3. **Lower the thinking level.** The model doesn't need deep thinking to sum up data it already has. Low thinking made each call much shorter.

In the end the agent answered in one LLM call instead of many. It's also cheaper.
