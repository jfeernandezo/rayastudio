# Security Policy

## Reporting a Vulnerability

If you discover a security vulnerability in Raya Studio, please report it
**privately** instead of opening a public issue.

- **E-mail:** adm@v3nexus.com.br
- Include: a clear description, steps to reproduce, affected version/commit,
  and any proof-of-concept if available.
- We aim to acknowledge reports within 5 business days and to provide an
  initial assessment within 10 business days.

Please do **not** disclose the vulnerability publicly until we have had a
reasonable opportunity to investigate and release a fix.

## Supported Versions

Only the `main` branch is actively maintained. Older tags do not receive
security patches.

## Scope

In scope:
- Authentication and session handling
- Server-side input validation and authorization
- Dependency vulnerabilities affecting the running application

Out of scope:
- Self-hosted deployments running with default `.env.example` placeholders
- Issues that require physical access to a user's machine
- Social-engineering attacks against project maintainers
