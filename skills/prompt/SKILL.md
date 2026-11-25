---
name: prompt
description: Turn a rough request into a complete prompt. Asks only what's missing, with recommended options, then runs it here or hands it over to paste into another AI.
argument-hint: "[rough request, any language]"
disable-model-invocation: true
---

# /prompt

Rough request: $ARGUMENTS

If that is blank, use the request already in the conversation; if there is none, ask in one line what they want done and end your turn.

Your job is to turn the rough request into a prompt that passes the **colleague test** (a brilliant colleague with no context could act on it without coming back with questions), spend as little of the user's time as possible getting there, then get the work done. The default target is **here**: this session does the work. Write a prompt to paste elsewhere only when the request names such a target: another chat AI, an image or video model, or a system prompt, agent brief or skill.

## 1. Read the request

Settle three things:

- **Target**: here (default) · another chat AI · system prompt, agent brief or skill · image or video model.
- **Size**: small (one sitting, easy to undo) · multi-part · big build (new app or feature, many unknowns, more than one session).
- **Mode**: a fresh request, or an existing prompt to improve. When improving, keep what already works and fix what fails the steps below.

## 2. Self-serve

Find what you can before asking anything:

- Read the files, paths and links the request names. For code, look at the repo: README, package manifest, the files involved.
- Loaded instructions and memory (stack, preferences, conventions, who the user is) count as answers already given.
- If the session's instructions point to a knowledge base (such as an Obsidian vault), search it for the people, projects or past decisions the request mentions.
- **Capability match** from the skills, connectors and agents already listed in your context. A fitting skill (slides, research, video, deploy…) gets named in the prompt; a connector that holds the inputs (Drive, Gmail, Figma, Calendar…) gets named as the place to pull them from.

## 3. Check the spec

A complete prompt fills these slots. Small tasks need only some of them.

| Slot | Covers |
|---|---|
| Outcome | what done looks like, and why it matters (the decision or use it feeds) |
| Audience | who reads or uses the result, their level, the language |
| Inputs | files, data, links, screenshots, prior work to start from |
| Deliverable | format, length, structure, where it goes |
| Scope | what's in and out; must-use (stack, brand, template); minimal fix or full-featured |
| Done-check | how to tell it's right: a command or test, a rubric, a reference to match |
| Examples | samples of the style or format wanted |
| Autonomy | act or only suggest; what needs a yes first |

Mark every slot **known** (stated or found), **assumed** (a sensible default you will state so the user can correct it), **placeholder** (a fact only the user has that fills a blank without changing the work, such as a date, price or link; it goes into the prompt as `[date]`), or a **material gap** (different answers would lead to materially different work, and only the user knows). Done when every slot carries a mark.

## 4. Ask about material gaps

No material gaps: skip to step 5.

Use the AskUserQuestion tool: one round, at most 4 questions, 2–4 concrete options each. Put your recommended option first with "(Recommended)" in its label and the reason in its description, tied to their stack, repo, notes or the official guidance. Use an option's preview when the choice is between concrete shapes (layouts, formats, tones), and multiSelect when choices combine. Each question has to stand on its own, since the dialog can hide whatever you wrote before it. Ask in the user's language.

> Who will read this proposal? → **Client's CTO (Recommended)**: your notes say the buyer is technical · **Business owner** · **Procurement committee**

Without that tool (Codex, headless runs, claude.ai), write numbered questions with lettered options, mark your recommendation, close with "Reply like `1b 2a`, or `ok` to take all my recommendations", and end your turn.

Ask a second round only when the answers open a new material gap. Big builds are the exception: interview round after round, digging into the hard parts (implementation, UX, edge cases, tradeoffs) until the answers add up to a spec.

## 5. Draft

Scale the prompt to the size:

- **Small**: 2–5 plain sentences that fill the missing slots. If the request already passes the colleague test, say so and tighten it at most.
- **Multi-part**: the template below.
- **Big build**: write the spec to a file (the repo's docs convention, else `SPEC.md`), then draft a short prompt that builds from it and names its done-check.

Read [references/targets.md](references/targets.md) first when the prompt will run anywhere but this session: another AI, a system prompt or agent, a media model, or a fresh session for a big build.

```text
<context>
The goal and why it matters. Who it is for. Where the result goes.
Inputs: files, links, connectors to pull from. Pasted material goes inside <document> tags.
</context>

<task>
What to do, at the intended scope. The skill to use, if one fits.
</task>

<requirements>
Measurable constraints, each with its reason.
</requirements>

<output_format>
Shape, length, language, file names.
</output_format>

<done_when>
Checkable criteria, and the check to run.
</done_when>

What to decide alone, and what to ask about first.
```

Writing rules (each one changes what the model does):

- Lead with the goal and the reason behind it; the model generalizes from the why.
- State the scope. For more than the minimum: "go beyond the basics, full-featured". For exactly the ask: "deliver what was asked; suggest extras at the end".
- Measurable beats vague: "3 sentences or fewer", not "brief"; "for a non-technical owner", not "simple".
- Say what to do rather than what to avoid: "write flowing prose paragraphs", not "no markdown".
- One delimiter style. Pasted material in tags. Long material first, the question last.
- Where format or tone matters, add a few varied examples in `<example>` tags, using the user's own samples when they have them.
- Give the done-check something concrete to run or compare: a test command, a build, a screenshot, a rubric.
- State each rule once; resolve contradictions; cut lines that don't change behavior.
- The prompt is a deliverable: full sentences whatever reply style is active, in the user's language unless they ask otherwise, naming the output language when it matters.

Retire these habits whenever you meet them, in a pasted prompt or your own draft:

| Old habit | Use instead |
|---|---|
| CAPS, "CRITICAL", "you MUST" | plain wording; emphasis only for true invariants |
| "show your reasoning", "explain step by step in your answer" | a higher effort setting for hard problems; ask for the answer and its key evidence |
| "double-check your work" | a concrete pass/fail check in done_when |
| "never do X" | "ask before X", with the reason and any exceptions |
| "you own this codebase" | only when they want refactoring latitude; it invites unrequested changes |
| flattery, pressure, tips, long personas | one line of role, if any |
| hard style caps ("every sentence under 20 words") | the effect you want, described |

## 6. Hand over

End your turn with:

1. One line: what you understood.
2. The prompt in one fenced block, ready to copy.
3. **Assumed:** the defaults you chose, and **Missing:** the placeholders to fill (skip whichever is empty).
4. One line naming what the prompt added, such as goal, audience, done-check, the skill to use.
5. The next step:
   - Here: "Reply **go** to run it, or tell me what to change."
   - Big build: recommend a fresh session (`/clear` in Claude Code, or a new thread) that starts from the spec file with this prompt, so the build begins with a clean context and a written definition of done; **go** runs it here instead.
   - Elsewhere: where to paste it, plus any setting there that helps.

If they already said to run it, show the prompt and carry on without waiting. On **go**, treat the prompt as the user's request and carry it out in full. On changes, revise and hand over again.
