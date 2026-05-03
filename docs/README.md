# Documentation Guide

This `docs/` folder is organized for both development clarity and hackathon review speed.

## Recommended reading order

1. [../README.md](../README.md) for the product overview and quick start.
2. [architecture/system-architecture.md](architecture/system-architecture.md) for the technical design.
3. [demo/demo-package.md](demo/demo-package.md) and [demo/demo-guide.md](demo/demo-guide.md) for the presentation flow.
4. [setup/ibm-pro-setup.md](setup/ibm-pro-setup.md) for IBM configuration.
5. [planning/implementation-plan.md](planning/implementation-plan.md) and [planning/phased-plan.md](planning/phased-plan.md) for feasibility and roadmap context.

## Folder map

- `architecture/`: system design, data flow, and component responsibilities
- `setup/`: IBM credentials, quickstart, and environment setup material
- `demo/`: demo guide, package notes, checklist, summary, and presentation outline
- `planning/`: implementation planning, phased scope, verification, and feasibility artifacts
- `archive/`: working notes and progress documents kept for traceability but not needed for first-pass review

## Judging criteria checklist

| Criterion | Review entry points |
| --- | --- |
| Completeness and feasibility | [architecture/system-architecture.md](architecture/system-architecture.md), [planning/implementation-plan.md](planning/implementation-plan.md), [planning/verification-summary.md](planning/verification-summary.md) |
| Creativity and innovation | [../README.md](../README.md), [demo/demo-summary.md](demo/demo-summary.md) |
| Design and usability | [../README.md](../README.md), `after-mvp/apps/ui`, [demo/presentation-outline.md](demo/presentation-outline.md) |
| Effectiveness and efficiency | [planning/phased-plan.md](planning/phased-plan.md), [setup/ibm-pro-implementation-summary.md](setup/ibm-pro-implementation-summary.md) |

## Notes

- The core submission is local-first and usable without cloud credentials.
- IBM services are integrated as clear product enhancements rather than placeholder logos.
- Screenshot assets can be added under `docs/screenshots/` and then embedded from the root README.
