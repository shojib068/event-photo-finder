---
description: Build the whole wedding face-search web app from the specs, run it on localhost and print the link
argument-hint: [optional: extra instructions, or a single screen name to build only that screen]
allowed-tools: Read, Write, Edit, Bash, Glob, Grep, Task
---

Build the wedding face-search web app from the project documents, run it locally, and give me the link. Extra instructions from me (may be empty): $ARGUMENTS

Work in the phases below, in order. Do not skip a phase. Do not ask me questions unless something is blocked (see "When blocked").

## Phase 1: Read everything first
Read these completely before writing any code:
1. CLAUDE.md (rules and conventions)
2. docs/functional-spec.md
3. docs/technical-spec.md
4. docs/screen.md
5. docs/directories.md
6. Every skill in .claude/skills/ (if the folder exists) and every agent in .claude/agents/
7. .claude/settings.json (hooks that will check your work)

Then write a short plan (do not save it to a file): the folders you will create, the backend modules, the screens and the order you will build them. If the documents contradict each other, follow this priority: CLAUDE.md > technical-spec > functional-spec > screen.md > directories.md for layout. List every contradiction in the final report.

## Phase 2: Project setup
- Create the folder structure exactly as in docs/directories.md.
- Set up the frontend and backend as defined in docs/technical-spec.md (framework, router, content/config file, API client, hooks).
- Create .env.example with every setting needed (Drive service account, base URL, token settings, match threshold, tunnel). Never create or edit a real .env, and never invent secrets.
- Add npm scripts: dev, build, lint, typecheck, and one script that starts everything for local use.

## Phase 3: Backend
Build everything docs/technical-spec.md requires, following the rules in functional-spec.md section 5 and 6:
- Drive folder links: add, validate, list, status (Queued / Indexing... / Ready), Active on/off.
- Indexing queue and face indexing behind the provider interface (InsightFace, ArcFace) with the local vector index. Matching threshold is fixed at about 90%.
- Selfie match endpoint: selfie used in memory only, never saved or logged. Match only against the photos of the scanned link.
- Private gallery with a long random non-expiring token. Photos and ZIP served through the app. The Drive folder is never made public.
- QR code data for each link.
Write tests for matching scope, token privacy and the Active/Ready rules if the technical spec defines a test setup.

## Phase 4: Screens (use the screen-builder agent)
Build each screen by delegating to the screen-builder subagent, one screen per delegation, one after another (not in parallel), in this order:
1. welcome
2. not-available
3. selfie
4. searching
5. match
6. no-match
7. admin

After each screen, read the agent's summary. If it lists open questions, record them and continue. If lint, typecheck or a hook fails, make the agent fix it before the next screen. If $ARGUMENTS names a single screen, build only that one and skip the rest of this phase.

## Phase 5: Check the whole app
- Run npm run lint, npm run typecheck and npm run build. Fix all errors.
- Check the rules across the whole codebase:
  - No Google Drive URLs or IDs in the frontend.
  - Selfie never written to localStorage, IndexedDB, logs or disk.
  - Token never logged.
  - Message text comes from the content/config file only.
  - Navigation uses the router.
- Walk through the guest flow in the code: QR link -> Not Available or Welcome -> Selfie -> Searching -> Match or No Match -> Try again.

## Phase 6: Run on localhost and give me the link
1. Install dependencies if needed (npm install). Make sure the face model and its Python packages are installed if the backend needs them. If they cannot be installed, say so and continue.
2. Start the app in the background using the start script. Do not block on it.
3. Wait until it answers: poll the local URL with curl (up to about 60 seconds). Check the guest page and the admin page both return a successful response.
4. If it fails, read the logs, fix the cause, and restart. Try up to 3 times.
5. Phones need HTTPS for the camera. If cloudflared or ngrok is installed, start a secure tunnel in the background and read the public https URL from its output. If neither is installed, say that the QR code will only work on phones after a tunnel is set up, and show the exact command to run.

## Final report (keep it short)
Print, in this order:
1. **Admin link:** the local admin URL, for example http://localhost:PORT/admin
2. **Guest link format:** the local URL pattern guests open, and the tunnel https URL if one is running
3. **What is running:** processes and ports, and how to stop them
4. **What I need from you:** missing .env values (Drive service account and the email to share folders with), the pending message texts (Welcome, Sorry, Not Available), and anything blocked
5. **Open questions and contradictions** found in the documents
6. **Checks:** lint, typecheck, build results (pass or fail)

## When blocked
- Missing credentials or secrets: build and run everything else, use clearly named placeholders in .env.example, and list what is missing in the report. Never fake a working Drive connection.
- A document is missing: stop that phase, explain which file is missing, and continue with the phases that do not depend on it.
- Never change docs/, CLAUDE.md, or .claude/ unless I ask.