export const copy = {
  meta: {
    title: "Launareiknir 2026",
    eyebrow: "Staðgreiðsla á Íslandi",
    heading: "Sjáðu hvert launin fara",
    intro:
      "Mánaðarreiknivél fyrir venjulegan launamann sem sýnir nettó, staðgreiðslu og lífeyrissparnað samkvæmt opinberum reglum fyrir 2026."
  },
  controls: {
    title: "Forsendur",
    salaryLabel: "Mánaðarlaun",
    salaryHint: "Dragðu sleðann eða sláðu inn upphæð í krónum.",
    salaryInputLabel: "Upphæð í krónum",
    personalAllowance: "Nýta persónuafslátt",
    pensionFund: "Draga 4% iðgjald í lífeyrissjóð",
    additionalPension: "Séreignarsparnaður",
    additionalPensionHint:
      "Viðbótarsparnaður lækkar skattstofn í þessari einfölduðu v1 reiknivél.",
    monthlyLabel: "Á mánuði"
  },
  summary: {
    title: "Niðurstaða",
    netSalary: "Útborgað",
    takeHomeShare: "Hlutfall sem skilar sér heim",
    distribution: "Skipting brúttólauna",
    breakdownTitle: "Sundurliðun",
    grossSalary: "Brúttólaun",
    pensionFundAmount: "Iðgjald í lífeyrissjóð",
    additionalPensionAmount: "Séreignarsparnaður",
    taxableBase: "Skattstofn eftir frádrátt",
    taxBeforeAllowance: "Staðgreiðsla fyrir persónuafslátt",
    usedPersonalAllowance: "Nýttur persónuafsláttur",
    taxAfterAllowance: "Staðgreiðsla eftir persónuafslátt",
    netSalaryLine: "Nettólaun",
    taxBrackets: "Hvað lendir í hverju skattþrepi?",
    shareNet: "Nettó",
    shareTax: "Staðgreiðsla",
    sharePensionFund: "Lífeyrissjóður",
    shareAdditionalPension: "Séreign"
  },
  notes: {
    title: "Forsendur 2026",
    scope:
      "Reiknivélin er ætluð fyrir venjulegan launamann með mánaðarlaun. Hún nær ekki yfir sérreglur eins og fleiri en einn launagreiðanda, eða sjómannareglur.",
    inconsistency:
      "Mánaðartalan fyrir persónuafslátt, 72.492 kr., ræður útreikningi hér. Á Skattinum birtast bæði ársupphæðirnar 869.898 kr. og 869.904 kr. eftir samhengi.",
    linksTitle: "Heimildir hjá Skattinum"
  },
  links: [
    {
      label: "Staðgreiðsla 2026",
      href: "https://www.skatturinn.is/einstaklingar/stadgreidsla/stadgreidsla/2026"
    },
    {
      label: "Persónuafsláttur",
      href: "https://www.skatturinn.is/einstaklingar/stadgreidsla/personuafslattur/"
    },
    {
      label: "Iðgjald í lífeyrissjóði",
      href: "https://www.skatturinn.is/einstaklingar/tekjur-og-fradraettir/idgjald-i-lifeyrissjodi/"
    },
    {
      label: "Helstu tölur og prósentur 2026",
      href: "https://www.skatturinn.is/einstaklingar/helstutolur/2026/"
    }
  ]
} as const;
