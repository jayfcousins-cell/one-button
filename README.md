# One Button

A voice to-do app that lives on your phone's lock screen. Hold one button, say what you need, and it becomes a task, a question for Claude, a conversation written up, or a change to the app itself. The app improves by voice: say "change the app so that...", a plan comes back, a preview appears, you approve, it goes live.

This copy is Jay's. Yours should be a fork.

## Fork it

1. Fork this repository on GitHub.
2. Turn on GitHub Pages for your fork (Settings, Pages, deploy from the `main` branch, root folder). Your app is now at `https://<you>.github.io/one-button/`.
3. Ask the person who runs the server you will use for a key. Open your app once through the link they send; the key stays on that phone.
4. Add the page to your home screen. On iPhone, a Shortcut can put the button on the lock screen (torch slot or Back Tap).

Every fork reaches one server by default (see the `API` line near the top of `index.html`). The server holds each person's own list under their own key. Nobody's data is in this repository, ever.

## Change it by voice

Say the change into the button. The build loop plans it, builds a preview from a branch, and waits for your approval before anything goes live. Every change is one commit, written in the words you said, signed "From <you> by voice".

Changes made on any fork are offered to every other fork as invitations. Adopting one makes a commit that says which commit it came from, so lineage is visible both ways. Copying without that line is the odd signal, not the norm.

## Run your own server

`server/onebutton.js` is the whole back end: transcription, task sorting, lists, interviews, asks, spaces. It runs as a Firebase Cloud Function with secrets `ONE_BUTTON_KEY` (the owner's key), `GROQ_KEY` (speech to text) and `OPENROUTER_KEY` (the model). Point your fork's `API` line at it.

## Licence

GNU Affero General Public License v3. Fork, change, share, and share your changes back the same way, including when you run it as a service.
