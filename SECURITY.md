# Security Policy

## Reporting a vulnerability

Please **do not** open a public issue for a security problem. Use GitHub's
[private vulnerability reporting](https://github.com/99Ayush/fin-buddy/security/advisories/new)
so the report stays private until a fix is ready.

A useful report includes:

- the affected commit or version
- reproduction steps
- the impact you observed
- any suggested mitigation

I aim to acknowledge reports within 72 hours.

## Scope and expectations

Fin-Buddy handles financial documents. PII masking runs locally before any provider call; raw documents must never be sent to a third-party API or committed to the repository.

## Supported versions

The main branch is the supported version. Older commits are not patched.