# Server

Source of truth for the One Button back end. It deploys from the Canopy functions folder:
copy `onebutton.js` and `ratelimit.js` to `~/canopy-mycelial/functions-default/`, then
`firebase deploy --only functions:default:oneButton --project canopy-website-ef7a8`.
Edit here, copy forward, never the other way round.
