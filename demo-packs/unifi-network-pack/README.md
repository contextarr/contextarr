# UniFi Network Pack

Public-safe starter context for a fictional UniFi network.

This starter pack is a curated local example, not a marketplace listing and not an endorsement by Ubiquiti. Third-party marks are used only as identifiers.

The records are synthetic, public-safe notes for exercising Contextarr validation, review, render, compose, and export flows. The pack contains no credentials, no private data, no install hooks, and no executable commands.

## Why this pack exists

This pack shows how a home-office network can give an AI useful operational context without exporting controller data, rule dumps, addresses, hostnames, or device identifiers.

## What an AI can safely know

An AI can know synthetic topology intent, zone purpose, traffic-class expectations, maintenance review cadence, and the kinds of support questions a maintainer wants answered.

## What must never be exported

Never export controller URLs, credentials, private addressing, MAC addresses, serial numbers, floor plans, live device names, firewall exports, client lists, or provider account details.

## Best export target

Use the Codex or Markdown export when reviewing policy intent with an assistant. Use JSON records only for local validation and demo automation.

## Demo question to ask

Does the VLAN intent allow this traffic class?

## Proof path

Review `records/vlans-and-subnets.md`, `records/firewall-notes.md`, `raw/vlans-and-subnets.md`, and `raw/firewall-notes.md` to confirm the pack explains traffic intent without exposing sensitive network facts.
