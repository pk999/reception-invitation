# Reception Dinner Invitation Website

A custom static reception invitation site inspired by the feature set of
`rampatra/wedding-website`, rebuilt here as a fresh, modern single-page site.

## What is Included

- Full-screen hero invitation with countdown
- Reception dinner details
- Venue and map link
- Travel and stay notes
- Gallery placeholders
- RSVP form with invite-code validation
- Google Calendar link and `.ics` download
- One generated hero image saved at `assets/hero-mandap.png`

## Customize

Edit `config.js` to update names, reception venue, invite codes, RSVP deadline,
story text, reception details, travel notes, and gallery image paths.

For the RSVP form, set `invite.formEndpoint` in `config.js` to a Google Apps
Script or other form endpoint. Until then, RSVPs are validated and saved in the
guest's browser with `localStorage`.

## Preview

Open `index.html` directly in a browser. No build step is required.

## Reference

Reference repo: https://github.com/rampatra/wedding-website
