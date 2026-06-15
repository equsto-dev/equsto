/**
 * Generates public/data/geo-landings-en.json — full English GEO/blog pages (multi-paragraph bodies).
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  assertGeoEnBodyStructured,
  normalizeGeoEnBodyStructured,
} from "./lib/normalize-geo-en-body.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const out = path.join(root, "public/data/geo-landings-en.json");
const enBodies = JSON.parse(
  fs.readFileSync(path.join(root, "scripts/geo-bodies-en.json"), "utf8")
);

const pages = {
  "en/steakhouse-kitchen-setup": {
    lang: "en",
    profile: "steakhouse",
    title: "Steakhouse kitchen planning guide | Equsto",
    description:
      "Steakhouse kitchen setup: reference proforma 2018-199-3 table (63 items), dry-age, grilling, refrigeration and warewashing. Quote via Project Factory.",
    h1: "Steakhouse kitchen setup",
    lead:
      "High-heat cooking, dry-age refrigeration and the hygiene line are modelled on one plan. The table below is reference proforma 2018-199-3; the Excel file is attached.",
    tableRef: "geo/steakhouse-2018-199-3-table.json",
    skipBudget: true,
    body:
      "<p>In a steakhouse kitchen, dry-age cabinets, high-heat grills and range lines, and meat prep modules are arranged in one flow. Hood static pressure and refrigeration run length are validated early; service pace drives how many cooking stations you need.</p><p>Cooking and holding zones stay separate; warewashing speed must carry peak covers. Grinding and slicing modules follow short-travel rules between prep and service.</p><p>The sample table links to catalogue SKUs. Expand the list in Project Factory by capacity and menu; installation and commissioning are planned with sales engineering.</p>",
    faq: [
      [
        "Which equipment is considered core for a steakhouse kitchen?",
        "Dry-age/refrigeration, high-heat cooking, meat prep (grind/slice), warewashing and the hood line form the core package.",
      ],
      [
        "Do the table links go to real product pages?",
        "Yes — each row points to a live /shop/{department}/{slug} product template.",
      ],
      [
        "How do I request a quote?",
        "Open Project Factory, choose the Steakhouse concept, or contact us with floor area and menu details.",
      ],
    ],
    related: [
      { label: "Fine dining guide", href: "/en/fine-dining-kitchen-setup" },
      { label: "Kitchen area per cover", href: "/en/guides/kitchen-area-per-cover-2026" },
      { label: "Reference projects", href: "/en/projects" },
    ],
  },
  "en/cloud-kitchen-setup": {
    lang: "en",
    profile: "bulut",
    title: "Cloud kitchen setup guide | Equsto",
    description: "Cloud kitchen setup: multi-brand hot/cold lines, shared warewashing, MEP loads. PFOS modelling and sample SKUs.",
    h1: "Cloud kitchen setup",
    lead: "Multi-brand, high-output cloud kitchens need parcelled hot/cold lines and shared wash capacity.",
    skipBudget: true,
    body:
      "<p>In a cloud kitchen, hot and cold lines are parcelled per brand with a shared warewashing centre. In multi-brand scenarios, electrical load, ventilation and grease interceptor capacity follow the combined menu.</p><p>Parcel-based production reduces cross-traffic; shared storage and dispatch areas are clearly bounded between brands. High delivery share increases prep and refrigeration modules.</p><p>The equipment table shows sample SKUs. Use Project Factory to model multi-brand output; site dimensions are the first planning input.</p>",
    faq: [
      [
        "Can several brands share one licence?",
        "MEP and interceptor sizing follow total menu load — engineering review is required.",
      ],
    ],
    related: [
      { label: "Kitchen m² guide", href: "/en/guides/kitchen-area-per-cover-2026" },
      { label: "Fast food setup", href: "/en/fast-food-kitchen-setup" },
    ],
  },
  "en/cafe-setup": {
    lang: "en",
    profile: "cafe",
    title: "Cafe setup guide | Equsto",
    description: "Cafe and espresso bar setup: coffee station, refrigeration, prep and warewashing. Sample SKUs and PFOS quote.",
    h1: "Cafe setup",
    lead: "Espresso centre, cold milk stock and the prep bench run in parallel throughout the day.",
    skipBudget: true,
    body:
      "<p>Cafe setup centres on the espresso station, cold milk and stock cabinets, and a prep bench used heavily all day. Water filtration and pressure should be fixed before machine selection; higher delivery share deepens refrigeration needs.</p><p>Display refrigeration, warewashing and pastry modules are added to match the menu. Daily cup count and simultaneous groups drive machine choice.</p><p>Floor area and throughput are clarified in Project Factory; the table links to sample SKUs. Request a quote summary from Project Factory or contact.</p>",
    faq: [
      ["Minimum kitchen area for a cafe?", "Often 30–80 m² depending on seats and delivery share — model in PFOS."],
      ["How to choose the espresso machine?", "Daily cups and simultaneous brewing groups are the main drivers."],
    ],
    related: [
      { label: "Cloud kitchen guide", href: "/en/cloud-kitchen-setup" },
      { label: "Coffee catalogue", href: "/shop/kahve" },
    ],
  },
  "en/catering-kitchen": {
    lang: "en",
    profile: "catering",
    title: "Catering kitchen guide | Equsto",
    description: "Catering and banqueting kitchen: high-volume cooking, transport and conveyor warewashing. Sample equipment.",
    h1: "Catering kitchen setup",
    lead: "Banqueting and bulk meal service plan hot holding, cold chain depth and wash speed together.",
    skipBudget: true,
    body:
      "<p>Catering kitchens combine high-volume cooking, transport equipment and conveyor warewashing in one scenario. Banquet service makes hot holding time a menu engineering decision; cold chain depth follows the product mix.</p><p>Peak covers and meal intervals directly set oven, refrigeration and wash counts. Transport and hot-box capacity should be read with the dispatch plan.</p><p>The table shows sample catalogue rows. Build the full list in Project Factory with guest count and meal profile; site survey is the first scheduling step.</p>",
    faq: [
      ["Can PFOS model 500 guests?", "Yes — use guest count and meal cycle in Project Factory."],
      [
        "Sample case study?",
        "See the Istanbul high-volume catering demount under Reference projects.",
      ],
    ],
    related: [
      { label: "Istanbul catering case", href: "/en/projects/istanbul-high-volume-catering" },
      { label: "Cooking catalogue", href: "/shop/pisirme" },
    ],
  },
  "en/fast-food-kitchen-setup": {
    lang: "en",
    profile: "fastfood",
    title: "Fast food kitchen setup | Equsto",
    description: "Fast food kitchen: fryer/grill density, cold holding, rapid warewashing. Menu-driven equipment counts.",
    h1: "Fast food kitchen setup",
    lead: "Short service times demand parallel hot and cold lines with fast wash turnaround.",
    skipBudget: true,
    body:
      "<p>Fast food lines depend on fryer and grill density, cold storage depth and rapid warewashing. Menu mix sets equipment counts; higher delivery share adds prep and holding modules.</p><p>Layouts run in parallel because service time is short; hot holding and cold stock stay visibly separated in the corridor. Bench height and ergonomics affect crew throughput.</p><p>Sample SKUs are in the table below. Enter capacity in Project Factory to finalise the list, or contact sales engineering.</p>",
    faq: [["High delivery share?", "Increase refrigeration and prep modules as the delivery ratio rises."]],
    related: [{ label: "Cloud kitchen", href: "/en/cloud-kitchen-setup" }],
  },
  "en/fine-dining-kitchen-setup": {
    lang: "en",
    profile: "finedining",
    title: "Fine dining kitchen setup | Equsto",
    description: "Fine dining kitchen: wide cookline spread, finishing and delicate holding. Sample modules and PFOS.",
    h1: "Fine dining kitchen setup",
    lead: "Lower plate frequency spreads the cookline; finishing and holding follow service style.",
    skipBudget: true,
    body:
      "<p>Fine dining spreads the cookline because covers are fewer but refinement is higher. Finishing, sauce and cold holding lines follow service style; hood and bench height follow crew ergonomics.</p><p>Compared with steakhouse, dry-age is lighter and balanced cooking with precise holding matters more. Plating rhythm and hold times align with menu design.</p><p>The table lists sample modules. Model the full layout in Project Factory by menu and capacity; gastronomy design deepens placement later.</p>",
    faq: [
      [
        "Difference from steakhouse?",
        "Steakhouse emphasises dry-age and high-heat grilling; fine dining uses more balanced lines.",
      ],
    ],
    related: [{ label: "Steakhouse guide", href: "/en/steakhouse-kitchen-setup" }],
  },
  "en/all-day-dining-kitchen-setup": {
    lang: "en",
    profile: "allday",
    title: "All day dining kitchen setup | Equsto",
    description: "Hotel and all day dining: breakfast–lunch–dinner cycles, coffee and banqueting peaks. Equipment guide.",
    h1: "All day dining kitchen setup",
    lead: "Breakfast, lunch and dinner reuse the same equipment at different loads; coffee runs all day.",
    skipBudget: true,
    body:
      "<p>All day dining and hotel kitchens run breakfast, lunch and dinner on the same equipment at shifting loads. Coffee, hot lines and cold storage operate in parallel all day; banqueting spikes capacity briefly.</p><p>Meal profile sets refrigeration depth and wash speed. Room service and buffet service can add peaks in the same footprint.</p><p>The table shows sample modules. Enter guest count and hotel segment in Project Factory to complete the list.</p>",
    faq: [["Same as hotel kitchen?", "PFOS uses similar lines for hotel and all day dining concepts."]],
    related: [{ label: "Catering guide", href: "/en/catering-kitchen" }],
  },
  "en/market-butcher-deli-setup": {
    lang: "en",
    profile: "marketKasap",
    title: "Market, butcher and deli setup | Equsto",
    description: "Retail aisle, butcher counter and deli: refrigeration, display and prep zones. Market catalogue SKUs.",
    h1: "Market, butcher and deli setup",
    lead: "Aisle refrigeration and the meat prep line are planned in one customer journey.",
    skipTable: true,
    skipBudget: true,
    body:
      "<p>Retail layout starts at the aisle: frozen islands, refrigerated gondolas and the butcher counter sit in one flow. Packaged goods and fresh meat share the front path while prep and storage stay behind the scenes.</p><p>Butcher and deli lines separate grinding, slicing and display. +2/+4 °C display and −18 °C storage never mix; boards, hygiene kits and fast wash protect freshness.</p><p>Aisle width and daily throughput set refrigeration counts. Finalise the list in Project Factory; installation follows the sales engineering plan.</p>",
    faq: [
      [
        "Market aisle and butcher line in one project?",
        "Yes — flow order and cooling zones are modelled on one plan; SKUs sit in the market catalogue.",
      ],
      [
        "How to get a quote?",
        "Use Project Factory with capacity and m², or pick products from the market aisle catalogue.",
      ],
    ],
    related: [
      { label: "Market aisle catalogue", href: "/shop/market-reyonlari" },
      { label: "Refrigeration department", href: "/shop/sogutma" },
      { label: "Guides index", href: "/en/blog" },
    ],
  },
  "en/industrial-kitchen-equipment-turkey": {
    lang: "en",
    profile: "seoEnIndustrial",
    title: "Industrial kitchen equipment Turkey | Equsto",
    description:
      "B2B commercial kitchen equipment for restaurants, hotels, cloud kitchens and catering in Turkey and export markets.",
    h1: "Industrial kitchen equipment — Turkey",
    lead: "Cooking, refrigeration, warewashing, prep, coffee and beverage lines with authorised Öztiryakiler distribution.",
    skipBudget: true,
    body:
      "<p>Equsto is a Turkey-based industrial kitchen platform for restaurants, hotels, cloud kitchens and catering. Authorised Öztiryakiler distribution covers cooking, refrigeration, warewashing, prep, coffee and beverage in one catalogue flow.</p><p>Export markets include selected countries in the Gulf, Central Asia and Eastern Europe. Single-SKU orders and full project lists use the same workflow.</p><p>Quote summaries are generated in Project Factory in about five minutes. Final pricing and logistics are confirmed by sales engineering before purchase orders are issued.</p>",
    faq: [
      ["Export only from Istanbul?", "No — Turkey-wide and selected export markets are supported."],
      ["Single product orders?", "Yes — from one SKU to full project lists in the same catalogue."],
    ],
    related: [
      { label: "Industrial kitchen supplier", href: "/en/industrial-kitchen-supplier-turkey" },
      { label: "Öztiryakiler supply", href: "/en/oztiryakiler-equipment-supply" },
      { label: "Cooking catalogue", href: "/shop/pisirme" },
    ],
  },
  "en/industrial-kitchen-supplier-turkey": {
    lang: "en",
    profile: "seoEnIndustrial",
    title: "Industrial kitchen supplier Turkey | Equsto",
    description: "B2B commercial kitchen equipment for restaurants, hotels, cloud kitchens and catering in Turkey and export markets.",
    h1: "Industrial kitchen supplier — Turkey",
    lead: "Cooking, refrigeration, warewashing, prep, coffee and beverage lines with authorised Öztiryakiler distribution.",
    skipBudget: true,
    body:
      "<p>Equsto is a Turkey-based industrial kitchen platform for restaurants, hotels, cloud kitchens and catering. Authorised Öztiryakiler distribution covers cooking, refrigeration, warewashing, prep, coffee and beverage in one catalogue flow.</p><p>Export markets include selected countries in the Gulf, Central Asia and Eastern Europe. Single-SKU orders and full project lists use the same workflow.</p><p>Quote summaries are generated in Project Factory in about five minutes. Final pricing and logistics are confirmed by sales engineering before purchase orders are issued.</p>",
    faq: [
      ["Export only from Istanbul?", "No — Turkey-wide and selected export markets are supported."],
      ["Single product orders?", "Yes — from one SKU to full project lists in the same catalogue."],
    ],
    related: [
      { label: "Öztiryakiler supply", href: "/en/oztiryakiler-equipment-supply" },
      { label: "Cooking catalogue", href: "/shop/pisirme" },
    ],
  },
  "en/commercial-kitchen-quotation": {
    lang: "en",
    profile: "seoEnQuotation",
    title: "Commercial kitchen quotation platform | Equsto",
    description: "Project Factory (PFOS): equipment list and quote summary for commercial kitchens — about 5 minutes.",
    h1: "Commercial kitchen quotation",
    lead: "Capacity, concept and menu inputs drive equipment selection; VAT and logistics sit in the quote file.",
    skipTable: true,
    skipBudget: true,
    body:
      "<p>Project Factory generates equipment lists and quote summaries for commercial kitchen projects. Capacity, concept and menu inputs drive module counts; VAT and logistics lines are included in the output file.</p><p>Target turnaround is about five minutes. Layout and MEP can be refined later with gastronomy design and on-site sales engineering.</p><p>This is B2B kitchen equipment supply, not table reservation software. Final sign-off is performed by the sales engineering team before purchase orders are issued.</p>",
    faq: [["Is this a reservation app?", "No — B2B kitchen equipment and project quoting only."]],
    related: [
      { label: "Project Factory", href: "/pfos" },
      { label: "Industrial supplier TR", href: "/en/industrial-kitchen-supplier-turkey" },
    ],
  },
  "en/restaurant-kitchen-quote": {
    lang: "en",
    profile: "seoRestoranTeklif",
    title: "Restaurant kitchen equipment quote | Equsto",
    description: "Restaurant kitchen quote: menu, capacity and service style → equipment list via PFOS in about 5 minutes.",
    h1: "Restaurant kitchen equipment quote",
    lead: "Menu, capacity and service style model hot, cold and wash lines; quote summary via Project Factory.",
    skipBudget: true,
    body:
      "<p>For a restaurant kitchen quote, enter menu, capacity and service style; PFOS applies rules to size hot, cold and wash equipment. The quote summary includes VAT and logistics; final figures are confirmed by sales engineering.</p><p>Capacity and concept are enough for the first pass; layout is refined with gastronomy design. CAD can follow in a later step.</p><p>Target time is about five minutes for a draft file. Use it internally until sales engineering approves the order.</p>",
    faq: [
      ["How fast is the draft?", "About five minutes for a PFOS output file."],
      ["CAD required?", "Not for the first pass — capacity and concept are enough."],
    ],
    related: [
      { label: "Steakhouse guide", href: "/en/steakhouse-kitchen-setup" },
      { label: "Quote platform", href: "/en/kitchen-quote-platform" },
    ],
  },
  "en/hotel-kitchen-equipment": {
    lang: "en",
    profile: "seoOtel",
    title: "Hotel kitchen equipment supply | Equsto",
    description: "Hotel and all day dining equipment: day-long meal cycles, banqueting, refrigeration and wash capacity.",
    h1: "Hotel kitchen equipment supply",
    lead: "All-day meal cycles and banquets load the same lines differently; PFOS models guest and meal profile.",
    skipBudget: true,
    body:
      "<p>Hotel kitchen supply spans breakfast, lunch, dinner and banquets on shared lines at different loads. All-day service increases refrigeration depth and warewashing capacity throughout the day.</p><p>Room service, buffet and ballroom menus can peak at different times in the same kitchen. Coffee and hot beverage lines are critical at breakfast peak.</p><p>Scenarios overlap with the all day dining guide and are modelled in PFOS. The table links to sample catalogue SKUs.</p>",
    faq: [
      [
        "Difference from restaurant?",
        "Hotels see stronger all-day cycling and deeper cold storage requirements.",
      ],
    ],
    related: [
      { label: "All day dining", href: "/en/all-day-dining-kitchen-setup" },
      { label: "Catering", href: "/en/catering-kitchen" },
    ],
  },
  "en/oztiryakiler-equipment-supply": {
    lang: "en",
    profile: "seoOzti",
    title: "Öztiryakiler equipment supply | Equsto",
    description: "Authorised Öztiryakiler dealer: cooking, refrigeration, warewashing. Live catalogue and Project Factory.",
    h1: "Öztiryakiler equipment supply",
    lead: "Authorised dealer channel for Öztiryakiler with live catalogue and Project Factory quotes.",
    skipBudget: true,
    body:
      "<p>Öztiryakiler equipment is listed under cooking, refrigeration, warewashing and prep in the Equsto catalogue. The dealer relationship covers official price lists and warranty routing; live FX rates apply where relevant.</p><p>Atalay and selected brands share the same cart and quote flow; Öztiryakiler remains the core line. Technical dimensions are on product cards in millimetres.</p><p>Order a single SKU or build a full project list in the same catalogue. Expand the list in Project Factory when needed.</p>",
    faq: [
      ["Only Öztiryakiler?", "No — Atalay and selected brands are listed; Öztiryakiler is the backbone."],
    ],
    related: [
      { label: "Refrigeration catalogue", href: "/shop/sogutma" },
      { label: "Brand list", href: "/marka.html" },
    ],
  },
  "en/cold-room-quote": {
    lang: "en",
    profile: "seoSogukOda",
    title: "Cold room and refrigeration quote | Equsto",
    description: "Cold room and refrigeration modules: capacity, product profile and MEP. Sample SKUs and PFOS.",
    h1: "Cold room quote",
    lead: "Refrigeration lines follow menu and volume; cold room projects use a dedicated engineering track.",
    skipBudget: true,
    body:
      "<p>Cold room quotes combine capacity, product profile and MEP conditions. Counter and upright modules appear in the sample table; dedicated cold room projects follow a separate engineering workflow.</p><p>Menu and volume set refrigeration counts; blast freezing needs depend on incoming product temperature. Sales engineering performs early validation.</p><p>Complete the project list in Project Factory or via contact. The table illustrates typical catalogue modules only.</p>",
    faq: [
      [
        "Only counters?",
        "No — cold room engineering is separate; counters complement the cold chain.",
      ],
    ],
    related: [
      { label: "Refrigeration catalogue", href: "/shop/sogutma" },
      { label: "Steakhouse / dry-age", href: "/en/steakhouse-kitchen-setup" },
    ],
  },
  "en/deli-counter-refrigeration": {
    lang: "en",
    profile: "seoHavuzlu",
    title: "Deli counter refrigeration | Equsto",
    description: "Deli-style counter refrigerators: dimensions, GN compatibility and capacity on product cards.",
    h1: "Deli counter refrigeration supply",
    lead: "External dimensions, GN pan fit and litre capacity are listed on each product card.",
    skipBudget: true,
    body:
      "<p>Deli counter selection starts with external dimensions, GN compatibility and rated capacity on the product card. Prep and service style change how many units and wells you need; technical dimensions are in millimetres on the detail page.</p><p>Under-counter and over-counter models are planned together on one line. Energy and cooling type follow site utilities.</p><p>Compare similar modules in the refrigeration catalogue. Add lines to a quote via Project Factory or the product page.</p>",
    faq: [
      ["Where are dimensions?", "On the product detail and PLP technical rows."],
    ],
    related: [{ label: "Refrigeration catalogue", href: "/shop/sogutma" }],
  },
  "en/industrial-cooking-equipment": {
    lang: "en",
    profile: "seoPisirme",
    title: "Industrial cooking equipment | Equsto",
    description: "Ranges, ovens, fryers, grills and boiling lines sized to menu and peak output. Sample SKUs.",
    h1: "Industrial cooking equipment",
    lead: "Cooking lines are counted from menu mix and peak simultaneous production.",
    skipBudget: true,
    body:
      "<p>Industrial cooking lines include ranges, ovens, fryers, grills and boiling modules sized to the menu. Gas and electric options are in the catalogue; site utilities determine what can be installed.</p><p>Peak output and simultaneous production spread the cookline. Hood capacity is calculated together with cooking counts.</p><p>The table links to sample SKUs. Build the full list in Project Factory by concept and capacity.</p>",
    faq: [
      ["Gas or electric?", "Both are listed — selection follows site gas and electrical capacity."],
    ],
    related: [{ label: "Cooking catalogue", href: "/shop/pisirme" }],
  },
  "en/kitchen-quote-platform": {
    lang: "en",
    profile: "seoTeklifPlatform",
    title: "Kitchen quote platform — 5 minutes | Equsto",
    description: "Project Factory (PFOS): rule-based equipment list and quote summary for commercial kitchens.",
    h1: "Fast kitchen quote platform",
    lead: "PFOS turns concept and capacity inputs into an equipment list and quote summary in one flow.",
    skipTable: true,
    skipBudget: true,
    body:
      "<p>Project Factory is Equsto’s quote platform: concept, capacity and menu inputs produce an equipment list and price summary. Target time is about five minutes; output is subject to sales engineering approval.</p><p>This is B2B industrial kitchen supply, not guest reservations. The rules engine sizes modules from menu and throughput assumptions.</p><p>Quote PDFs include SKU and product code rows in a structured layout. After approval, ordering and installation planning proceed.</p>",
    faq: [
      ["OpenTable integration?", "No — commercial kitchen equipment and project supply only."],
    ],
    related: [
      { label: "Project Factory", href: "/pfos" },
      { label: "About Equsto", href: "/hakkimizda.html" },
    ],
  },
  "en/bar-design-turkey": {
    lang: "en",
    profile: "seoBar",
    title: "Bar design Turkey | Equsto Besos",
    description: "Bar Design Studio (Besos): modular Vitrum-based stations sized to floor plan and service flow.",
    h1: "Bar design — Turkey",
    lead: "Besos modular stations are selected to floor dimensions and beverage service flow.",
    skipBudget: true,
    ctaBesos: true,
    body:
      "<p>Bar design at Equsto runs through Bar Design Studio with Vitrum Group modular stations sized to the floor plan and service flow. Beverage, coffee and refrigeration modules align on one bar line.</p><p>Module height and counter depth follow staff ergonomics. Ice machine and storage capacity follow daily cover counts.</p><p>Forty-two sample modules are listed in the Besos catalogue. Plan the full layout in Project Factory or on the Besos pages.</p>",
    faq: [["Besos catalogue?", "See /besos for the modular module list."]],
    related: [
      { label: "Besos catalogue", href: "/besos" },
      { label: "Beverage equipment", href: "/shop/icecek" },
    ],
  },
  "en/projects": {
    lang: "en",
    profile: "projelerHub",
    title: "Reference projects | Equsto",
    description: "Demount case studies: catering and modular bar examples with catalogue SKU links.",
    h1: "Reference projects",
    lead: "Demount cases explain lifecycle, constraints and equipment logic — not fixed packages.",
    skipTable: true,
    skipBudget: true,
    links: [
      { label: "Istanbul high-volume catering", href: "/en/projects/istanbul-high-volume-catering" },
      { label: "Izmir modular bar & beverage", href: "/en/projects/izmir-modular-bar-beverage" },
    ],
    body:
      "<p>Equsto reference pages present demount case studies: project lifecycle, constraints and equipment logic are transparent. Customer photography and quotes may be added as publishing continues; pages are not off-the-shelf packages.</p><p>Each case bridges to live catalogue SKUs; quotes are finalised in Project Factory or through contact. Cases illustrate thinking, not a fixed BOM.</p><p>Use the links below for Istanbul catering and Izmir modular bar examples. PFOS can regenerate the same logic as a live list.</p>",
    faq: [
      [
        "Are projects fixed packages?",
        "No — they are sample layouts linked to catalogue SKUs; quotes are customised.",
      ],
    ],
    related: [
      { label: "Steakhouse guide", href: "/en/steakhouse-kitchen-setup" },
      { label: "Project Factory", href: "/pfos" },
    ],
  },
  "en/projects/istanbul-high-volume-catering": {
    lang: "en",
    profile: "projeIstanbul",
    title: "Istanbul high-volume catering | Equsto",
    description: "Demount catering layout: hot banquet, cooking and conveyor warewashing for high-volume service.",
    h1: "Istanbul high-volume catering",
    lead: "Hot banquet, volume cooking and conveyor warewashing modelled for dense urban service.",
    skipBudget: true,
    body:
      "<p>This demount layout combines hot banquet holding, high-capacity cooking and conveyor warewashing for dense urban catering. Peak minutes set wash speed as much as oven counts.</p><p>Facade capacity and flue routes should be confirmed before ordering; survey dimensions come first. Transport and hot-box needs align with the dispatch plan.</p><p>Recreate the logic in PFOS with the Catering concept and city selection. The table shows sample SKUs only.</p>",
    faq: [
      ["Live quote?", "Open PFOS with Catering and Istanbul context, or contact us."],
    ],
    related: [{ label: "All projects", href: "/en/projects" }],
  },
  "en/projects/izmir-modular-bar-beverage": {
    lang: "en",
    profile: "projeIzmir",
    title: "Izmir modular bar & beverage | Equsto",
    description: "Modular bar demount: Besos modules aligned with beverage equipment on one site plan.",
    h1: "Izmir modular bar & beverage",
    lead: "Besos modules and beverage equipment share one floor plan and service sequence.",
    skipBudget: true,
    body:
      "<p>This Izmir demount aligns Besos modules with beverage equipment on one site plan. Vitrum Group bar solutions are listed under Bar Design Studio; service flow drives module choice.</p><p>Cold beverage, coffee and prep modules are parcelled to bar dimensions. Power and water points are checked before final module positions.</p><p>Forty-two sample modules appear in the Besos catalogue. Finalise the list in Project Factory or via contact.</p>",
    faq: [["Bar modules?", "Listed under /besos with technical sheets."]],
    related: [
      { label: "Bar Design (Besos)", href: "/besos" },
      { label: "Beverage catalogue", href: "/shop/icecek" },
    ],
  },
  "en/guides/kitchen-area-per-cover-2026": {
    lang: "en",
    profile: "rehberM2",
    title: "Kitchen area per cover — planning guide | Equsto",
    description: "Kitchen m² planning by service style: dine-in, delivery and banqueting. PFOS automates the same logic.",
    h1: "Kitchen area — per cover",
    lead: "Service style drives how many square metres you need per seat or per cover.",
    skipTable: true,
    skipBudget: true,
    body:
      "<p>Per-cover kitchen area depends on service style: dine-in, delivery and banqueting use the same square metres differently. Higher delivery share deepens refrigeration; dine-in heavy sites emphasise hold times.</p><p>Service speed, menu complexity and simultaneous production all affect the result. In tight footprints, vertical storage and modular benches help.</p><p>PFOS area and cover questions automate the same logic. This editorial guide is updated for 2026; find it via footer and sitemap, not the top shop menu.</p>",
    faq: [
      ["Updated for 2026?", "Yes — editorial assumptions reflect 2026 planning norms."],
      ["Built-in calculator?", "PFOS area questions follow the same rules."],
    ],
    related: [
      { label: "Cloud kitchen", href: "/en/cloud-kitchen-setup" },
      { label: "Project Factory", href: "/pfos" },
    ],
  },
  "en/guides/500-cover-catering-planning-2026": {
    lang: "en",
    profile: "rehberCatering500",
    title: "500-cover catering equipment planning | Equsto",
    description: "Planning catering for ~500 guests: hot holding, cold chain and wash speed. PFOS guest and meal inputs.",
    h1: "500-cover catering planning",
    lead: "At ~500 guests, hot holding, cold depth and wash speed set the equipment spine.",
    skipBudget: true,
    body:
      "<p>At roughly five hundred guests, hot banquet capacity, cold chain depth and wash speed define the equipment spine. Guest count and meal interval are modelled in PFOS; peak meal and continuous banquet are different scenarios.</p><p>Transport and prep modules follow the menu. Conveyor warewashing must not bottleneck the peak window.</p><p>Read together with the catering kitchen guide and the Istanbul demount page. Build the full list in Project Factory.</p>",
    faq: [
      [
        "Single service for 500?",
        "Model peak meal vs continuous service separately in PFOS.",
      ],
    ],
    related: [
      { label: "Catering kitchen", href: "/en/catering-kitchen" },
      { label: "Istanbul demount", href: "/en/projects/istanbul-high-volume-catering" },
    ],
  },
  "en/guides/dark-kitchen-cloud-kitchen-2026": {
    lang: "en",
    profile: "rehberDarkKitchen",
    title: "Dark kitchen / cloud kitchen guide 2026 | Equsto",
    description: "Multi-brand cloud kitchen: parcelled lines, shared wash, MEP and delivery-heavy prep modules.",
    h1: "Dark kitchen — cloud kitchen setup",
    lead: "Parcelled hot/cold lines and a shared wash hub are planned per brand in one licence.",
    skipBudget: true,
    body:
      "<p>Dark kitchen and cloud kitchen setup parcel hot and cold lines per brand with a shared warewashing hub. Electrical and ventilation load rises in multi-brand sites; interceptor sizing follows the combined menu.</p><p>High delivery share increases refrigeration and prep. Storage and dispatch between brands must stay clearly separated.</p><p>Steps overlap the cloud kitchen setup guide and are modelled in PFOS for multi-brand output. Site dimensions are the first input.</p>",
    faq: [
      [
        "Several brands, one licence?",
        "MEP and grease interceptor capacity follow total menu load.",
      ],
    ],
    related: [{ label: "Cloud kitchen setup", href: "/en/cloud-kitchen-setup" }],
  },
  "en/guides/restaurant-kitchen-checklist-2026": {
    lang: "en",
    profile: "rehberRestoranChecklist",
    title: "Restaurant kitchen setup checklist | Equsto",
    description: "Step-by-step restaurant kitchen checklist: menu, capacity, utilities, hood and quote via PFOS.",
    h1: "Restaurant kitchen setup checklist",
    lead: "Menu → capacity → area → hot/cold/wash counts → quote; PFOS automates the sequence.",
    skipTable: true,
    skipBudget: true,
    body:
      "<p>This checklist follows menu, capacity, floor area, hot/cold/wash counts and quote. PFOS automates the sequence; use the checklist in meetings as a manual control.</p><p>Clarify business type, dine-in vs delivery, daily meals, existing utilities, hood route and brand preferences — each step changes module counts.</p><p>CAD is not required at first; layout deepens with gastronomy design. Read with the restaurant quote guide for the same flow.</p>",
    faq: [
      ["CAD on day one?", "Capacity and concept are enough initially."],
    ],
    related: [
      { label: "Restaurant quote guide", href: "/en/restaurant-kitchen-quote" },
      { label: "m² per cover", href: "/en/guides/kitchen-area-per-cover-2026" },
    ],
  },
  "en/guides/cafe-opening-equipment-list-2026": {
    lang: "en",
    profile: "rehberKafeAcilis",
    title: "Cafe opening equipment list | Equsto",
    description: "Cafe opening list: espresso, cold storage, prep, display cooling and warewashing. Water treatment first.",
    h1: "Cafe opening equipment list",
    lead: "Espresso centre, cold stock, prep bench, display fridge and wash line form the core list.",
    skipBudget: true,
    body:
      "<p>A cafe opening list centres on espresso, refrigerated stock, a prep bench, display refrigeration and warewashing. Fix water filtration and pressure before choosing the espresso machine.</p><p>Pastry-heavy cafes add oven and prep modules. Delivery share deepens refrigeration; seat count drives daily cup assumptions.</p><p>Read with the cafe setup guide and the coffee catalogue. Complete the list in Project Factory.</p>",
    faq: [
      ["Coffee only?", "Pastry modules are added when the menu requires baking capacity."],
    ],
    related: [
      { label: "Cafe setup guide", href: "/en/cafe-setup" },
      { label: "Coffee catalogue", href: "/shop/kahve" },
    ],
  },
  "en/blog": {
    lang: "en",
    profile: "blogHubEn",
    title: "Equsto guides & blog | GEO index",
    description: "Commercial kitchen guides: concept setups, SEO pages, editorials and reference projects. Not in the shop menu.",
    h1: "Guides & blog index",
    lead: "Programmatic guides sit outside the equipment menu; each page includes FAQ and catalogue links where relevant.",
    skipTable: true,
    skipBudget: true,
    body:
      "<p>This index separates blog and GEO guide content from the shop menu. Users looking for equipment stay in the catalogue; concept and quote questions are answered on these pages. Each guide includes FAQs and, where relevant, a catalogue SKU table.</p>" +
      "<p>Concept setup, search-targeted pages, editorial guides and reference projects are grouped in sections below. Links are indexed via footer, sitemap and llms.txt. This is the main entry point for Project Factory quote summaries.</p>" +
      "<p>Steakhouse, cloud kitchen, market aisle and cafe opening guides link to their concept profiles. Five-hundred-guest catering and square-metre planning articles deepen capacity questions. The restaurant checklist flow mirrors the PFOS sequence.</p>" +
      "<p>SEO pages address searches for industrial kitchen equipment in Turkey, hotels, cooking lines, cold rooms and the quote platform. English industrial and quotation pages target export readers. The Öztiryakiler dealer page explains the official channel.</p>" +
      "<p>Reference projects use a demount case-study format; Istanbul catering and Izmir modular bar examples are reachable from this index. Photography and quotes will be updated as publishing continues. The definitive equipment list is generated in PFOS.</p>" +
      "<p>Catalogue SKU tables show sample modules only; the full list is project-specific. 2026 prices are summarised excluding VAT. Project discounts are applied during quoting.</p>" +
      "<p>Sales engineering approval sets the final price. Installation and commissioning follow the project plan. This is a B2B platform, not reservation software.</p>" +
      "<p>Gastronomy Design deepens layout questions. A CAD plan can be added in a later phase. Site survey dimensions are the foundation for PFOS inputs.</p>" +
      "<p>Service areas cover Turkey and selected export markets. The contact channel handles bespoke content and project requests. The live catalogue validates price and stock.</p>" +
      "<p>The guide index separates equipment shoppers from concept researchers. Transition to PFOS is encouraged for quote production. The footer menu links to every guide.</p>" +
      "<p>Dark kitchen and cloud kitchen guides explain multi-brand scenarios. Hotel and all-day dining content emphasises meal cycles. Fast food and fine dining can be read comparatively.</p>" +
      "<p>Quote PDFs contain structured SKU rows. Target draft quote time is about five minutes. The ordering process starts after approval.</p>" +
      "<p>The GEO guide index is the central content architecture hub for Equsto.</p>" +
      "<p>PFOS draft lists are finalised after sales engineering approval and site survey; installation, commissioning and warranty registration run under the same project number. Equsto generates quotes as a B2B industrial kitchen supply platform with 2026 pricing.</p>",
    sections: [
      {
        title: "Concept setup guides",
        links: [
          { label: "Steakhouse kitchen setup", href: "/en/steakhouse-kitchen-setup" },
          { label: "Cloud kitchen setup", href: "/en/cloud-kitchen-setup" },
          { label: "Cafe setup", href: "/en/cafe-setup" },
          { label: "Catering kitchen", href: "/en/catering-kitchen" },
          { label: "Fast food setup", href: "/en/fast-food-kitchen-setup" },
          { label: "Fine dining setup", href: "/en/fine-dining-kitchen-setup" },
          { label: "All day dining / hotel", href: "/en/all-day-dining-kitchen-setup" },
          { label: "Market, butcher & deli", href: "/en/market-butcher-deli-setup" },
        ],
      },
      {
        title: "SEO & GEO landing pages",
        links: [
          { label: "Industrial kitchen equipment — Turkey", href: "/en/industrial-kitchen-equipment-turkey" },
          { label: "Restaurant kitchen quote", href: "/en/restaurant-kitchen-quote" },
          { label: "Hotel kitchen supply", href: "/en/hotel-kitchen-equipment" },
          { label: "Öztiryakiler supply", href: "/en/oztiryakiler-equipment-supply" },
          { label: "Cold room quote", href: "/en/cold-room-quote" },
          { label: "Deli counter refrigeration", href: "/en/deli-counter-refrigeration" },
          { label: "Industrial cooking equipment", href: "/en/industrial-cooking-equipment" },
          { label: "Kitchen quote platform (5 min)", href: "/en/kitchen-quote-platform" },
          { label: "Bar design Turkey", href: "/en/bar-design-turkey" },
        ],
      },
      {
        title: "Editorial guides (/en/guides/)",
        links: [
          { label: "Kitchen m² per cover", href: "/en/guides/kitchen-area-per-cover-2026" },
          { label: "500-cover catering planning", href: "/en/guides/500-cover-catering-planning-2026" },
          { label: "Dark kitchen / cloud kitchen", href: "/en/guides/dark-kitchen-cloud-kitchen-2026" },
          { label: "Restaurant kitchen checklist", href: "/en/guides/restaurant-kitchen-checklist-2026" },
          { label: "Cafe opening equipment list", href: "/en/guides/cafe-opening-equipment-list-2026" },
        ],
      },
      {
        title: "Reference projects",
        links: [
          { label: "Projects hub", href: "/en/projects" },
          { label: "Istanbul high-volume catering", href: "/en/projects/istanbul-high-volume-catering" },
          { label: "Izmir modular bar", href: "/en/projects/izmir-modular-bar-beverage" },
        ],
      },
      {
        title: "Turkish guides",
        links: [
          { label: "Turkish guides index", href: "/blog" },
          { label: "About Equsto", href: "/hakkimizda.html" },
        ],
      },
    ],
    faq: [
      [
        "Why not in the top menu?",
        "The shop menu is equipment-first; guides are indexed via footer, sitemap and llms.txt.",
      ],
      [
        "Steakhouse or cloud kitchen?",
        "Use the concept setup section and open the matching English link.",
      ],
    ],
    related: [
      { label: "Project Factory", href: "/pfos" },
      { label: "Shop catalogue", href: "/shop" },
      { label: "Turkish index", href: "/blog" },
    ],
  },
};

for (const [key, page] of Object.entries(pages)) {
  const prof = page.profile;
  if (key === "en/blog") continue;
  if (prof && enBodies[prof]) page.body = enBodies[prof];
}

let failed = 0;
for (const [key, page] of Object.entries(pages)) {
  if (!page.body) continue;
  try {
    const minParas = key === "en/blog" ? 10 : 2;
    page.body = assertGeoEnBodyStructured(
      key,
      normalizeGeoEnBodyStructured(page.body),
      { minParas, minChars: 150 }
    );
  } catch (e) {
    console.error(String(e.message || e));
    failed++;
  }
}
if (failed) process.exit(1);

const outJson = { version: 1, source: "English GEO guides 2026-06", ...pages };
fs.writeFileSync(out, JSON.stringify(outJson, null, 2) + "\n");
fs.copyFileSync(out, path.join(root, "lib/geo/landings-en.json"));
console.log("Wrote", out, Object.keys(pages).length, "pages (structured multi-paragraph bodies)");
