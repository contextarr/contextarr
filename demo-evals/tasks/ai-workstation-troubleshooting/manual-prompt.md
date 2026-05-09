# Manual Prompt Baseline

Use this public-safe demo context:

- The fictional workstation is for local experimentation, coding-agent support, and small batch inference tests.
- The demo stack separates chat UI, model serving, coding-agent tools, and Contextarr pack exports.
- Local services should prefer loopback defaults.
- LAN visibility must be an explicit configuration choice.
- Troubleshooting should capture the symptom, identify the affected layer, compare against the latest known working state, and validate the smallest likely fix.

Task: write a concise troubleshooting answer for a service that works locally but should not be exposed accidentally.
