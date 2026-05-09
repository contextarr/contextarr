# Encryption Model

Status: future architecture. No hosted registry, encrypted storage service, client-side encryption flow, or key management implementation is added by this document.

Encryption protects artifact confidentiality in transit or at rest. Encryption does not prove content is safe.

## Model

1. TLS for transport in a hosted registry, when hosted registry exists.
2. Artifact encryption at rest in registry storage.
3. Optional client-side encryption for private team registry artifacts.
4. Encryption metadata in registry manifest.
5. Signing and hashing are required for integrity.
6. Encryption does not prove content is safe.
7. Scanning must occur before encryption or inside a trusted private review pipeline.
8. Local cache encryption can be optional later.
9. Registry metadata may remain public for public listings while artifact payloads are protected.

## Public Registry

Public registry metadata may include name, object type, publisher, license, trust status, scanner status, review status, compatible targets, and public preview. Artifact payloads may remain encrypted at rest.

## Private Registry

Private registry artifacts may require tenant-managed or client-side keys. This must be researched before implementation because private registry artifacts may contain internal or private team context.

## Required Manifest Metadata

Future registry manifests should include:

- encryption mode
- algorithm name
- key id
- encrypted-at timestamp
- whether payload was scanned before encryption
- whether payload requires client-side decryption

## Limitations

- Encrypted malware is still malware.
- Encrypted prompt injection is still prompt injection.
- Encrypted private data still needs policy controls.
- Encryption cannot replace validation, scanning, signing, quarantine, local re-scan, or human review.
