# Home Assistant Pack

Public-safe starter context for a fictional Home Assistant installation.

This starter pack is a curated local example, not a marketplace listing and not an endorsement by the Open Home Foundation. Third-party marks are used only as identifiers.

The records are synthetic, public-safe notes for exercising Contextarr validation, review, render, compose, and export flows. The pack contains no credentials, no private data, no install hooks, and no executable commands.

## Why this pack exists

This pack shows how smart-home context can help an AI reason about automation intent while keeping people, routines, locations, credentials, and executable configuration out of exports.

## What an AI can safely know

An AI can know synthetic automation classes, device-group roles, dashboard conventions, maintenance reminders, and which changes require human review.

## What must never be exported

Never export access tokens, exact addresses, room-by-room occupancy, camera feeds, alarm details, real entity IDs, device serials, webhook URLs, executable automations, or private household routines.

## Best export target

Use ChatGPT or Markdown exports for human-readable automation review. Use JSON records only for local demo validation.

## Demo question to ask

Which automation class needs human review before changing?

## Proof path

Review `records/automation-map.md`, `records/device-groups.md`, `raw/automation-map.md`, and `raw/device-groups.md` to confirm automation review classes are clear and non-executable.
