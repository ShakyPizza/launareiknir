# Launareiknir v1

## Markmið
- Byggja eina statíska síðu á íslensku fyrir GitHub Pages sem sýnir mánaðarlaun sjónrænt sem `nettó`, `staðgreiðslu` og `lífeyrissparnað`.
- Miða við venjulegan launamann og 2026 reglur Skattsins, án sérreglna sem myndu rugla fyrstu útgáfu.

## Staðfestar forsendur
- Skattþrep 2026 í staðgreiðslu:
  - `31,49%` af tekjum `0 - 498.122 kr.`
  - `37,99%` af tekjum `498.123 - 1.398.450 kr.`
  - `46,29%` af tekjum yfir `1.398.450 kr.`
- Persónuafsláttur á mánuði: `72.492 kr.`
- Frádráttarbært iðgjald í lífeyrissjóð: `4%`
- Frádráttarbær séreign í v1: `0-4%`
- V1 notar mánaðarútreikning eingöngu.

## Athugasemd um ósamræmi
- Á síðu Skattsins um staðgreiðslu 2026 birtist ársupphæð persónuafsláttar sem `869.898 kr.`.
- Á síðu Skattsins um persónuafslátt 2026 birtist uppsöfnuð ársupphæð út frá `72.492 kr.` á mánuði sem `869.904 kr.`.
- Þar sem þessi reiknivél er mánaðarbundin notar hún `72.492 kr.` sem stjórnandi forsendu.

## Heimildir
- [Staðgreiðsla 2026](https://www.skatturinn.is/einstaklingar/stadgreidsla/stadgreidsla/2026)
- [Persónuafsláttur](https://www.skatturinn.is/einstaklingar/stadgreidsla/personuafslattur/)
- [Iðgjald í lífeyrissjóði](https://www.skatturinn.is/einstaklingar/tekjur-og-fradraettir/idgjald-i-lifeyrissjodi/)
- [Helstu tölur og prósentur 2026](https://www.skatturinn.is/einstaklingar/helstutolur/2026/)

## Utan scope í v1
- Fleiri en einn launagreiðandi
- Persónuafsláttur maka
- Börn og barnaskattur
- Takmörkuð skattskylda
- Sjómannareglur
- Aðrir sértækir frádráttarliðir
- Sveitarfélagaval

## TODO síðar
- Bæta við ensku
- Bæta við pólsku
- Meta hvort styðja eigi fleiri launatímabil og sérreglur síðar
