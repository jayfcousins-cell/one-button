# One Button: the plan

Version 1 (5 Nov 2026) works on Jay's phone: the list on the lock screen, record a task by voice,
Open phone, a hidden interview recorder (three taps on the record button), a server that only
answers this app, and private interviews with share.

Every stage below ships on its own, gets its own security check, asks only for the phone
permissions it needs, and gets its own restore point before the next one starts.

## How time and place work

Every task can carry a **when** and a **where**, and either can bring it to the front.

- **When** is set by voice: "remind me Thursday at 9", "every Monday". When it is due, a
  **loud alarm** goes off over the lock screen and shows the task, with Done and Snooze.
- **Where** is learned, not set up by hand. There are two kinds of task:
  - **Fix-it tasks** ("the gate is broken", "the tap drips") belong where they were noticed.
    The phone notes where Jay was when he spoke, and the task comes back when he is there again.
  - **Buying tasks** ("buy eggs") are noted anywhere and done at a shop. Where they were said
    does not matter. The app learns each shop from where things get **ticked off**, item by item
    (eggs at the market, rope at the hardware shop). Arriving at a shop shows what that shop sells.
  - Some tasks need no place at all ("call Ahmed", "email the funder").
- The AI step decides which kind each task is. The app only asks when it is unsure, with one tap:
  "Tie this to here?"
- Places name themselves from patterns: "You've noted 6 things around here. Call it Home?"
- **Privacy:** exact positions and the pattern learning stay on the phone. The server and the AI
  only ever see a place name like "Home", never coordinates. Arrival alerts (Stage 3) need
  Android's "allow location all the time", so they get their own on/off switch.
- Location fences work at about 100 metres and can take a few minutes to notice arrival: right
  for "at the market", not for "in the kitchen".

## The lock screen list

Tasks are grouped into one row per kind (Buy, Fix, Check, Do), each with a count, closed by
default. Tapping a row opens it. Done 5 Nov 2026. In the Place stage, arriving at a shop opens
Buy by itself with only that shop's items.

## Stages

1. **Foundation.** Tasks move into Jay's own private store on the server, so they sync between
   phone and browser and survive a reinstall. Tasks gain when and where fields. The phone starts
   noting where each task was said and where each one is ticked off (kept on the phone only), so
   the patterns are there before they are needed. Current phone tasks are copied up on first sync.
   The store is shaped as lists with members from day one, so sharing needs no rebuild.
2. **Sharing and projects.** Share lists with other people, starting with a two-person prototype
   (Jay and his ex, so she can add tasks for him and things are clearer between them). Each person
   signs in as themselves, ideally with Weave login, so the server knows who added what and Jay can
   remove access at any time. Shared lists see only their own tasks, never Jay's places or patterns.
   Plug tasks into Jay's projects (Weave, Canopy, Dahab and others) as their own lists.
3. **Time.** Loud alarms set by voice, repeats, snooze.
4. **Place.** Suggested places, arrival alerts ("At the market: eggs, tomatoes"), and a
   **Here and now** list at the top of the lock screen.
5. **Map and timeline.** Places with their tasks on a map, timed tasks along a day or week strip.
6. **Phone apps.** Calendar, messages, Obsidian, maps, one at a time, each switched on by Jay,
   each with a clear line on what works from a locked phone and what needs unlocking.
7. **Deeper interviews.** Optional transcription and summary, only when Jay asks for it.

## Open questions

- Arrival alert: buzz every arrival, or once a day per place?
- A task with both a time and a place: alert when both are true, or either?
- Places private to Jay, or shareable later (a household "Home")?
