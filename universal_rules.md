# Universal Rules

Rules for the coding agent. All of these apply to every project unless a rule has a tag saying otherwise.

Tags used below:
- *(Use case for an app)* - only matters for app projects (e.g. Kotlin/Android). Ignore on plain websites.
- *(Windows only)* - only matters on a Windows machine.
- *(Needs setup)* - depends on a tool or file that has to exist first. If it is missing, say so and carry on without it.

---

**VERIFY BEFORE CLAIMING** - Always check the actual files using file tools. Never trust memory, cached context, or old changelogs. Never output secrets, tokens, or credentials.

**VERIFY SIDE EFFECTS** - After modifying files, databases, or running deployments, run a separate check/command to verify the changes before claiming success. Report any failures openly.

**NO GUARD BYPASS** - If a command is blocked or errors out due to permissions, do not attempt to bypass it with flags. Stop and explain the issue to the user.

**CONVENTIONS HOOK** - Read `AGENTS.md`, `CLAUDE.md`, or `.agents/` rules at the start of the session. Universal rules apply where the project-specific files are silent.

**NO FABRICATION** - Derive all information directly from code, config, or documentation. If unsure, say "unknown". Do not invent URLs, paths, or commands.

**PRE-EDIT GATE** - Before writing code, verify: Is it YAGNI (You Aren't Gonna Need It)? Does it already exist elsewhere? Can you use the standard library? Write the absolute minimum code that works.

**RED-GREEN** - When fixing a bug, write a failing test first (whenever feasible), then apply the fix. No test = promise, not proof.

**QUALITY GATE** - Run project tests, linting, and build commands after making changes via `run_command`. Discover the exact build/test commands of the project; do not guess.

**PROPORTIONAL EFFORT** - Obvious or low-risk tasks require fast verification. Expensive, complex, or irreversible changes require full, rigorous verification. Relax validation only for truly trivial changes.

**NO SILENT FAILURES** - Do not swallow `stderr` or ignore warnings. A silent failure costs more in the long run than reading and addressing the error immediately.

**BUG CLASSES** *(Use case for an app)* - Look out for critical bug classes: `CancellationException` swallowed in catch blocks, TOCTOU across async/coroutine operations, resource leaks, null-safety bypasses, and stale state references.

**GAP-ROUND** - Before declaring a task finished, list what you did NOT verify. Close remaining gaps or report them openly to the user.

**SESSION BOUNDARY** - After finishing large, multi-file changes, suggest starting a fresh chat session to prevent context bloat.

**ENVIRONMENT** *(Windows only)* - On Windows, use `PowerShell` (`curl.exe` instead of `curl`), forward slashes for `file://` links, and native tools.

**COMMIT GATE** - Never perform git actions like commit, push, or tagging without explicit request from the user.

**BREVITY** - Keep explanations concise (less than 4 lines unless detailed output is explicitly requested). Avoid unnecessary greetings or summaries.

**CODE COMMENTS** - Only add code comments if explicitly asked, or if it is a strong project convention.

**CODE REFERENCES** - Refer to code locations using the `[filename](file:///path/to/file#L10-L20)` markdown link format.

**SUBAGENT DELEGATION** *(Needs setup)* - Use `invoke_subagent` (e.g., `research` or `self`) for broad codebase searches, heavy documentation reading, or independent code reviews.

**IMPACT MAP** - Before editing any code symbol, trace its callers, consumers, and tests, and state the potential blast radius. Skip only for trivial fixes.

**LAYERED RECALL** *(Needs setup)* - Limit context/docs retrieval to the top 3-5 results (approx. <= 1.5KB). Always name the source (file, session, commit). Never inject untraced memory.

**TERSELY** - Drop filler words and pleasantries. Structure responses as: `[thing] [action] [reason]. [next step].`

**CONTEXT.MD FIRST** - Check the project root for a `CONTEXT.md` file. Use its domain vocabulary. Create one if missing and the task involves complex domain concepts.

**GRILL BEFORE BUILD** - For non-trivial features, build a design tree, work in rounds, ask the user clarifying questions with recommendations, and wait for confirmation before writing code.

**TEST AT SEAMS** - Run tests through public interfaces only. Agree on the seams (boundaries) before writing tests. Build vertical slices (test -> implement -> repeat).

**CLARIFY WHEN UNCERTAIN** - Pitch questions back immediately, framing the context first, then the point, using domain vocabulary.

**HANDOFF FOR CONTINUITY** - For multi-session tasks, write a handoff document (`handoff.md`) detailing what has been discussed, what is done, what is next, and references.

**VERTICAL SLICES** - Build narrow, demoable paths through all layers that fit in a single context window. Expand and contract for wide refactorings.

**CALL-GRAPH REACHABILITY** - After implementing a feature or change, search the codebase to confirm that the new code is actually called by production entry points. Zero callers = NOT wired.

**CIRCUIT BREAKER** *(Needs setup)* - Cap changes per pass to ~10%. If code changes are not converging after 2-3 passes, escalate to the user. Detect loops (3+ identical tool calls, repeating errors, or zero change between passes). If a loop is detected, load the `loop-breaker` strategy: name the loop, change one variable, and continue. If it loops again, stop and present 2-3 options to the user.

**DEFAULT WEB SEARCH & BROWSING** - Use the built-in web search and browsing tools available in the IDE (or any MCP web tool the user has set up) for web searches and fetching web content. Prefer official docs and primary sources. If no web tool is available, say so instead of guessing.
