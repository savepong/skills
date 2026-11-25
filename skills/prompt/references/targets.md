# Targets

Prompting advice per target, from the providers' official guides as researched on 2026-11-25 (sources at the end). Advice shifts with each model release: when the target model is newer than the ones named here, fetch its provider's current prompting guide before drafting.

## Claude: claude.ai, the API, a fresh Claude Code session

The template in SKILL.md is already shaped for Claude (Fable 5.x, Opus 5.x, Sonnet 5.x). What current models do by default, and the line that steers it:

- They follow instructions literally: "only report high-severity issues" gets exactly that. Write scope as you mean it.
- They add tests, docs, files and review rounds nobody asked for. Unless that is wanted: "Deliver what was asked, at the scope intended. If something extra would help, mention it at the end."
- On long multi-step work they can stop early and offer next steps. For unattended runs: "Keep working until everything asked for is done; stop only when you can't go on without me, or before a risky step."
- Approval rules work best naming exact actions ("ask before running migrations or pushing"); broad rules make them ask about routine work.
- Code: a check that comes back pass or fail lets Claude close the loop itself. Name the test, build or type-check command, or the screenshot to compare.
- Effort is the main quality lever. For hard, long-running work, suggest a higher effort (for example, start Claude Code with `--effort xhigh`); everyday tasks run well at the default.

## ChatGPT and OpenAI models (GPT-6.x)

- Short Markdown sections: Role (one line), Goal, Success criteria, Constraints, Output, Stop rules. Pasted material inside XML tags.
- Keep it lean and state each rule once: conflicting rules destabilize it more than missing detail.
- Newest models answer concisely by default. Ask for depth where it matters rather than adding "be concise".
- Describe behavior instead of labels: "short sentences, first names, no jargon" rather than "friendly".
- Autonomy: "Make reasonable, reversible assumptions, state them, and keep going. Ask only if blocked, if the scope would change, or before anything irreversible."
- For hard multi-step work, suggest a thinking or reasoning mode.

## Gemini

- Persona, task, context, format; drop the parts that don't apply.
- Role, key constraints and output format at the top (the system instruction, when available). Long context next. The question last, opened with "Based on the information above…".
- Gemini 3.x answers tersely by default: ask explicitly for detail or a conversational tone when wanted.
- Define ambiguous terms. One delimiter style throughout (XML tags or Markdown headings). Leave temperature and other sampling settings at their defaults.
- Recent facts: turn on search grounding or ask it to search. Arithmetic or counting: turn on code execution.

## System prompts, agent briefs, subagents, skills

Instructions a model will run many times:

- Sections: Role (one line) · Goal · Success criteria · Constraints · Tools and when to use each · Output · Stop and escalation rules.
- Tiered autonomy: explain, review or plan → read and report, change nothing. Change, build or fix → make in-scope edits and run non-destructive checks without asking. External writes, destructive actions, purchases, scope expansion → confirm first.
- Untrusted input (user messages, web pages, files) goes inside tags, labeled as data to process rather than instructions to follow.
- Keep it lean, then test with a few real inputs, changing one thing at a time.
- For a skill, AGENTS.md or CLAUDE.md, load the `writing-for-agents` skill when it is installed.

## Images and video

Generation, in this order: canvas (aspect ratio, shot, angle) · subject, specific · action · location · style or medium · lighting (source, direction, quality) · color palette · text in the image, exact words in quotes, font described in words, placement · each reference image's role ("Image 1 for the pose, Image 2 for the style").

Editing: "Using the provided image, change only the [element] to [new]. Keep everything else exactly the same, preserving the original style, lighting and composition." Iterate one change per turn in the same conversation, and proofread any text the model renders.

Video adds camera movement, duration, pacing and sound.

## Sources

- Anthropic, prompting best practices: https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/claude-prompting-best-practices
- Anthropic, per-model guides: https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/prompting-claude-fable-5-2 (same folder: `prompting-claude-opus-5`, `prompting-claude-sonnet-5-5`)
- Anthropic, Claude Code best practices: https://code.claude.com/docs/en/best-practices
- OpenAI, prompt engineering: https://developers.openai.com/api/docs/guides/prompt-engineering
- OpenAI, latest model guidance: https://developers.openai.com/api/docs/guides/latest-model
- Google, prompt design strategies (Gemini 3): https://aistudio.google.com/docs/prompting-strategies
- Google Cloud, prompt design strategies: https://docs.cloud.google.com/gemini-enterprise-agent-platform/models/prompts/prompt-design-strategies
- Google Workspace, writing effective prompts: https://workspace.google.com/resources/ai/writing-effective-prompts/
- Google, image prompting tips: https://blog.google/products/gemini/prompting-tips-nano-banana-pro/
