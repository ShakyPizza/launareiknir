# Launareiknir

Static small website calculator for visualizing monthly salary, withholding tax, and pension savings in Iceland.

## About The Repository

This repository contains a small Vite web app written in JavaScript with TypeScript checking for exploring how Icelandic monthly gross salary is split into take-home pay, withholding tax, pension fund contributions, and optional additional private pension savings.

## Goal

The goal of the project is to provide a simple, transparent salary calculator for a typical salaried worker in Iceland, using official 2026 tax rules and showing the result in a clear visual breakdown.

## Live Site

[https://launareiknir.benediktorri.is](https://launareiknir.benediktorri.is)

## Sources

The calculator currently uses these official Skatturinn sources for its 2026 assumptions:

- [Staðgreiðsla 2026](https://www.skatturinn.is/einstaklingar/stadgreidsla/stadgreidsla/2026)
- [Persónuafsláttur](https://www.skatturinn.is/einstaklingar/stadgreidsla/personuafslattur/)
- [Iðgjald í lífeyrissjóði](https://www.skatturinn.is/einstaklingar/tekjur-og-fradraettir/idgjald-i-lifeyrissjodi/)
- [Helstu tölur og prósentur 2026](https://www.skatturinn.is/einstaklingar/helstutolur/2026/)

## Run Locally

```bash
npm install
npm run dev
```
## Build And Test

```bash
npm run test
npm run typecheck
npm run build
```

## Deployment

Pull requests targeting `main` and pushes to `main` run the test, typecheck, and
production build checks. Pushes to `main` then run the serialized self-hosted
deployment, using the exact checked commit and refusing to overwrite local
changes in the server checkout.

The self-hosted runner must be able to run the checked-out `deploy.sh` through
noninteractive `sudo`, with access to `/opt/launareiknir`, `/opt/traefik`, and Docker.
A sudo rule restricted to the previous `/opt/launareiknir/deploy.sh` path must be
updated by the server administrator before using this workflow. The workflow runs
the script from the verified checkout so the first deployment also uses the new
commit validation logic.
