"use client";

import { useState, useEffect, useCallback } from "react";

// ============================================
// Translation Data
// ============================================

interface Translations {
  [key: string]: {
    [lang: string]: string;
  };
}

const translations: Translations = {
  // Greetings
  "Good morning": {
    en: "Good morning",
    af: "Goeie môre",
    zu: "Sawubona ekuseni",
    xh: "Molo kusasa",
    st: "Dumela hoseng",
    nso: "Thobela gosasa",
    tn: "Dumela mo mosong",
    ts: "Avuxeni",
    ss: "Sawubona ekuseni",
    ve: "Ndi matsheloni",
    nr: "Lotjhani ekuseni"
  },
  "Good afternoon": {
    en: "Good afternoon",
    af: "Goeie middag",
    zu: "Sawubona ntambama",
    xh: "Molo emini",
    st: "Dumela motsheare",
    nso: "Thobela mosegare",
    tn: "Dumela mo motshegare",
    ts: "Xilexile",
    ss: "Sawubona emini",
    ve: "Ndi masiari",
    nr: "Lotjhani emini"
  },
  "Good evening": {
    en: "Good evening",
    af: "Goeie naand",
    zu: "Sawubona kusihlwa",
    xh: "Molo ngokuhlwa",
    st: "Dumela mantsiboea",
    nso: "Thobela mantšiboa",
    tn: "Dumela mo maitseboeng",
    ts: "Riperile",
    ss: "Sawubona kusihlwa",
    ve: "Ndi madekwana",
    nr: "Lotjhani ntambama"
  },
  
  // UI Elements
  "Your AI-powered legal research assistant for South African law": {
    en: "Your AI-powered legal research assistant for South African law",
    af: "Jou KI-aangedrewe regsnavorsingsassistent vir Suid-Afrikaanse reg",
    zu: "Umsizi wakho wocwaningo lwezomthetho oqhutshwa yi-AI wezomthetho zaseNingizimu Afrika",
    xh: "Umncedisi wakho wophando lwezomthetho oluqhutywa yi-AI yomthetho waseMzantsi Afrika",
    st: "Mothusi wa hao wa dipatlisiso tsa molao o tsamaiswang ke AI bakeng sa molao wa Afrika Borwa",
    nso: "Mothuši wa gago wa dinyakišišo tša molao wo o laolwago ke AI bakeng sa molao wa Afrika Borwa",
    tn: "Mothusi wa gago wa dipatlisiso tsa molao o tsamaisiwang ke AI bakeng sa molao wa Aforika Borwa",
    ts: "Muphfuni wa wena wa ndzavisiso wa nawu lowu wu fambisiwaka hi AI wa nawu wa Afrika Dzonga",
    ss: "Umsiti wakho wekucwaninga kwemtsetfo lohanjiswa yi-AI wemtsetfo waseNingizimu Afrika",
    ve: "Muthusi wau wa ṱhoḓisiso ya mulayo u shumisaho AI ya mulayo wa Afrika Tshipembe",
    nr: "Umsizi wakho wokurhubhulula kwezomthetho okuqhutshwa yi-AI wezomthetho zeNingizimu Afrika"
  },
  "AI-Powered Analysis": {
    en: "AI-Powered Analysis",
    af: "KI-aangedrewe Analise",
    zu: "Ukuhlaziya Okuqhutshwa yi-AI",
    xh: "Uhlalutyo Oluqhutywa yi-AI",
    st: "Tlhahlobo e tsamaiswang ke AI",
    nso: "Tshekatsheko ye e laolwago ke AI",
    tn: "Tshekatsheko e tsamaisiwang ke AI",
    ts: "Nxopaxopo lowu wu fambisiwaka hi AI",
    ss: "Kuhlaziya lokuhanjiswa yi-AI",
    ve: "Musaukanyedzo u shumisaho AI",
    nr: "Ukuhlaziya okuqhutshwa yi-AI"
  },
  "SA Legal Database": {
    en: "SA Legal Database",
    af: "SA Regsdatabasis",
    zu: "Idathabheyisi Yezomthetho YaseNingizimu Afrika",
    xh: "Idathabheyisi Yezomthetho YaseMzantsi Afrika",
    st: "Databese ya Molao ya Afrika Borwa",
    nso: "Databese ya Molao ya Afrika Borwa",
    tn: "Databese ya Molao ya Aforika Borwa",
    ts: "Databese ya Nawu ya Afrika Dzonga",
    ss: "Idathabheyisi Yemtsetfo YaseNingizimu Afrika",
    ve: "Databese ya Mulayo ya Afrika Tshipembe",
    nr: "Idathabheyisi Yezomthetho YeNingizimu Afrika"
  },
  "Verified Sources": {
    en: "Verified Sources",
    af: "Geverifieerde Bronne",
    zu: "Imithombo Eqinisekisiwe",
    xh: "Imithombo Eqinisekisiweyo",
    st: "Mehlodi e Netefaditsweng",
    nso: "Methopo ye e Netefaditšwego",
    tn: "Metswedi e Netefaditsweng",
    ts: "Swihlovo Leswi Tiyisitsweke",
    ss: "Imitfombo Leciniswekile",
    ve: "Zwiko Zwo Khwaṱhisedzwaho",
    nr: "Imitfombo Eqinisekisiwe"
  },
  "Explore Legal Topics": {
    en: "Explore Legal Topics",
    af: "Verken Regsonderwerpe",
    zu: "Hlola Izihloko Zezomthetho",
    xh: "Phonononga Izihloko Zezomthetho",
    st: "Hlahloba Dihloho tsa Molao",
    nso: "Nyakišiša Dihlogo tša Molao",
    tn: "Tlhotlhomisa Dikaroganyo tsa Molao",
    ts: "Kambisisa Tinhlokomhaka ta Nawu",
    ss: "Hlola Tinhloko Temtsetfo",
    ve: "Ṱoḓisisa Ṱhoho dza Mulayo",
    nr: "Hlola Iinhloko Zezomthetho"
  },
  "Get started with these common legal questions": {
    en: "Get started with these common legal questions",
    af: "Begin met hierdie algemene regsvrae",
    zu: "Qala ngalemibuzo evamile yezomthetho",
    xh: "Qala ngale mibuzo iqhelekileyo yezomthetho",
    st: "Qala ka dipotso tsena tse tloaelehileng tsa molao",
    nso: "Thoma ka dipotšišo tše tše tlwaelegilego tša molao",
    tn: "Simolola ka dipotso tse di tlwaelegileng tsa molao",
    ts: "Sungula hi swivutiso leswi swi tolovelekeke swa nawu",
    ss: "Cala ngalemibuto lejwayelekile yemtsetfo",
    ve: "Thoma nga mbudziso idzi dzi ḓoweleaho dza mulayo",
    nr: "Thoma ngemibuzo le ejwayelekile yezomthetho"
  },
  "Professional Legal Research": {
    en: "Professional Legal Research",
    af: "Professionele Regsnavorsing",
    zu: "Ucwaningo Lwezomthetho Olungcono",
    xh: "Uphando Lwezomthetho Olungcono",
    st: "Dipatlisiso tsa Molao tsa Porofeshenale",
    nso: "Dinyakišišo tša Molao tša Sephrofešenale",
    tn: "Dipatlisiso tsa Molao tsa Porofešenale",
    ts: "Ndzavisiso wa Nawu wa Xiprofexinali",
    ss: "Lucwaningo Lwemtsetfo Lweprofeshini",
    ve: "Ṱhoḓisiso ya Mulayo ya Vhuprofeshinala",
    nr: "Ukurhubhulula Kwezomthetho Kweprofeshini"
  },
  "Case Research": {
    en: "Case Research",
    af: "Saaknavorsing",
    zu: "Ucwaningo Lwamacala",
    xh: "Uphando Lwamacala",
    st: "Dipatlisiso tsa Diketsahalo",
    nso: "Dinyakišišo tša Dikgetse",
    tn: "Dipatlisiso tsa Dikgetse",
    ts: "Ndzavisiso wa Timhaka",
    ss: "Lucwaningo Lwemacala",
    ve: "Ṱhoḓisiso ya Mulandu",
    nr: "Ukurhubhulula Kwamacala"
  },
  "Legal Advice": {
    en: "Legal Advice",
    af: "Regsadvies",
    zu: "Iseluleko Sezomthetho",
    xh: "Icebiso Lezomthetho",
    st: "Keletso ya Molao",
    nso: "Keletšo ya Molao",
    tn: "Kgakololo ya Molao",
    ts: "Ndzayo wa Nawu",
    ss: "Seluleko Semtsetfo",
    ve: "Nyeletshedzo ya Mulayo",
    nr: "Iseluleko Sezomthetho"
  },
  "Document Review": {
    en: "Document Review",
    af: "Dokumenthersiening",
    zu: "Ukubuyekezwa Kwamadokhumenti",
    xh: "Ukuphononongwa Kwamaxwebhu",
    st: "Tlhahlobo ya Ditokomane",
    nso: "Tshekatsheko ya Ditokomane",
    tn: "Tshekatsheko ya Dikwalo",
    ts: "Nkambisiso wa Tidokumente",
    ss: "Kubuyeketwa Kwemadokhumenti",
    ve: "U Sedzulusa Maṅwalo",
    nr: "Ukubuyekezwa Kwamadokhumenti"
  },
  "Rights Check": {
    en: "Rights Check",
    af: "Regtekontroleer",
    zu: "Ukuhlola Amalungelo",
    xh: "Ukuhlola Amalungelo",
    st: "Tlhahlobo ya Ditokelo",
    nso: "Tshekatsheko ya Ditokelo",
    tn: "Tshekatsheko ya Ditshwanelo",
    ts: "Nkambisiso wa Timfanelo",
    ss: "Kuhlola Emalungelo",
    ve: "U Sedza Pfanelo",
    nr: "Ukuhlola Amalungelo"
  },
  "How can I help with your legal question?": {
    en: "How can I help with your legal question?",
    af: "Hoe kan ek help met jou regsvraag?",
    zu: "Ngingakusiza kanjani ngombuzo wakho wezomthetho?",
    xh: "Ndingakunceda njani ngombuzo wakho wezomthetho?",
    st: "Nka o thusa jwang ka potso ya hao ya molao?",
    nso: "Nka go thuša bjang ka potšišo ya gago ya molao?",
    tn: "Nka go thusa jang ka potso ya gago ya molao?",
    ts: "Ndzi nga ku pfuna njhani hi xivutiso xa wena xa nawu?",
    ss: "Ngingakusita njani ngembuzo wakho wemtsetfo?",
    ve: "Ndi nga ni thusa hani nga mbudziso yaṋu ya mulayo?",
    nr: "Ngingakusiza njani ngombuzo wakho wezomthetho?"
  },
  
  // Legal Categories
  "Constitutional Law": {
    en: "Constitutional Law",
    af: "Grondwetlike Reg",
    zu: "Umthetho Womthethosisekelo",
    xh: "Umthetho Womgaqo-siseko",
    st: "Molao wa Molaotheo",
    nso: "Molao wa Molaotheo",
    tn: "Molao wa Molaotheo",
    ts: "Nawu wa Vumbiwa",
    ss: "Umtsetfo Wemtsetfosisekelo",
    ve: "Mulayo wa Ndayotewa",
    nr: "Umthetho Womthethosisekelo"
  },
  "Legal Principles": {
    en: "Legal Principles",
    af: "Regsbeginsels",
    zu: "Izimiso Zezomthetho",
    xh: "Imigaqo Yezomthetho",
    st: "Melawana ya Molao",
    nso: "Melawana ya Molao",
    tn: "Melawana ya Molao",
    ts: "Milawu ya Nawu",
    ss: "Imigomo Yemtsetfo",
    ve: "Milayo ya Mulayo",
    nr: "Imigomo Yezomthetho"
  },
  "Consumer Rights": {
    en: "Consumer Rights",
    af: "Verbruikersregte",
    zu: "Amalungelo Abathengi",
    xh: "Amalungelo Abathengi",
    st: "Ditokelo tsa Bareki",
    nso: "Ditokelo tša Bareki",
    tn: "Ditshwanelo tsa Bareki",
    ts: "Timfanelo ta Vaxavi",
    ss: "Emalungelo Ebatsengi",
    ve: "Pfanelo dza Vharengisi",
    nr: "Amalungelo Wabathengi"
  },
  "Property Law": {
    en: "Property Law",
    af: "Eiendomsreg",
    zu: "Umthetho Wempahla",
    xh: "Umthetho Wepropati",
    st: "Molao wa Thepa",
    nso: "Molao wa Thoto",
    tn: "Molao wa Dithoto",
    ts: "Nawu wa Rifuwo",
    ss: "Umtsetfo Wetimphahla",
    ve: "Mulayo wa Ndaka",
    nr: "Umthetho Wezinto"
  },
  "Labour Law": {
    en: "Labour Law",
    af: "Arbeidsreg",
    zu: "Umthetho Wezabasebenzi",
    xh: "Umthetho Wabasebenzi",
    st: "Molao wa Basebetsi",
    nso: "Molao wa Bašomi",
    tn: "Molao wa Badiri",
    ts: "Nawu wa Vatirhi",
    ss: "Umtsetfo Webasebenti",
    ve: "Mulayo wa Vhashumi",
    nr: "Umthetho Wabasebenzi"
  },
  "Government": {
    en: "Government",
    af: "Regering",
    zu: "Uhulumeni",
    xh: "Urhulumente",
    st: "Mmuso",
    nso: "Mmušo",
    tn: "Puso",
    ts: "Mfumo",
    ss: "Hulumende",
    ve: "Muvhuso",
    nr: "Umbuso"
  },
  
  // Prompts
  "What makes a will legally binding in South Africa?": {
    en: "What makes a will legally binding in South Africa?",
    af: "Wat maak 'n testament wetlik bindend in Suid-Afrika?",
    zu: "Yini eyenza incwadi yefa ibe semthethweni eNingizimu Afrika?",
    xh: "Yintoni eyenza incwadi yelifa ibe semthethweni eMzantsi Afrika?",
    st: "Ke eng e etsang hore lengolo la boikarabelo le be semolao Afrika Borwa?",
    nso: "Ke eng se se dirago gore lengwalo la bohwa le be semolao Afrika Borwa?",
    tn: "Ke eng se se dirang gore lokwalo lwa boswa lo nne semolao mo Aforika Borwa?",
    ts: "I yini leyi endlaka leswaku papila ra ndzhaka ri va ra nawu eAfrika Dzonga?",
    ss: "Yini leyenta incwadzi yelifa ibe semtsetfweni eNingizimu Afrika?",
    ve: "Ndi mini zwi itaho uri ṅwalo wa mbuno u vhe mulayoni Afrika Tshipembe?",
    nr: "Yini eyenza incwadi yelifa ibe semthethweni eNingizimu Afrika?"
  },
  "How does ubuntu shape our constitutional democracy?": {
    en: "How does ubuntu shape our constitutional democracy?",
    af: "Hoe vorm ubuntu ons grondwetlike demokrasie?",
    zu: "Ubuntu luyibumba kanjani intando yeningi yethu yomthethosisekelo?",
    xh: "Ubuntu luyibumba njani intando yesininzi yethu yomgaqo-siseko?",
    st: "Botho bo bopa jwang demokrasi ya rona ya molaotheo?",
    nso: "Botho bo bopa bjang temokrasi ya rena ya molaotheo?",
    tn: "Botho bo bopa jang temokerasi ya rona ya molaotheo?",
    ts: "Vumunhu byi vumba njhani demokrasi ya hina ya vumbiwa?",
    ss: "Ubuntu lubumba njani inkhululeko yetfu yemtsetfosisekelo?",
    ve: "Vhuthu vhu bveledza hani demokirasi yashu ya ndayotewa?",
    nr: "Ubuntu lubumba njani intando yeningi yethu yomthethosisekelo?"
  },
  "What are my rights under the Consumer Protection Act?": {
    en: "What are my rights under the Consumer Protection Act?",
    af: "Wat is my regte onder die Wet op Verbruikersbeskerming?",
    zu: "Yimaphi amalungelo ami ngaphansi koMthetho Wokuvikelwa Kwabathengi?",
    xh: "Ngawaphi amalungelo am phantsi koMthetho Wokukhusela Abathengi?",
    st: "Ditokelo tsa ka ke dife tlasa Molao wa Tshireletso ya Bareki?",
    nso: "Ditokelo tša ka ke dife ka fase ga Molao wa Tšhireletšo ya Bareki?",
    tn: "Ditshwanelo tsa me ke dife ka fa tlase ga Molao wa Tshireletso ya Bareki?",
    ts: "Timfanelo ta mina i tihi ehansi ka Nawu wa Ku Sirhelela Vaxavi?",
    ss: "Ngimaphi emalungelo ami ngaphasi kweMtsetfo Wekuvikela Batsengi?",
    ve: "Pfanelo dzanga ndi dzifhio nga fhasi ha Mulayo wa u Tsireledza Vharengisi?",
    nr: "Ngimaphi amalungelo ami ngaphasi koMthetho Wokuvikela Abathengi?"
  },
  "Tenant vs Landlord rights under the Rental Housing Act": {
    en: "Tenant vs Landlord rights under the Rental Housing Act",
    af: "Huurder vs Verhuurder regte onder die Wet op Huurbehuising",
    zu: "Amalungelo omqashi vs umnikazi wendlu ngaphansi koMthetho Wezindlu Eziqashiswayo",
    xh: "Amalungelo omqeshi vs umnikazi wendlu phantsi koMthetho Wezindlu Eziqeshiswayo",
    st: "Ditokelo tsa mohiri vs monga ntlo tlasa Molao wa Matlo a Hirilweng",
    nso: "Ditokelo tša mohiri vs mong wa ntlo ka fase ga Molao wa Dintlo tša go Hirwa",
    tn: "Ditshwanelo tsa mohiri vs mong wa ntlo ka fa tlase ga Molao wa Matlo a a Hirilweng",
    ts: "Timfanelo ta muhiri vs n'wini wa yindlu ehansi ka Nawu wa Tindlu to Hirisiwa",
    ss: "Emalungelo emcashi vs umnikati wendlu ngaphasi kweMtsetfo Wetindlu Letichashiswako",
    ve: "Pfanelo dza muhiri vs mune wa nnḓu nga fhasi ha Mulayo wa Nnḓu dza u Hirwa",
    nr: "Amalungelo womqashi vs umnikazi wendlu ngaphasi koMthetho Wezindlu Eziqashiswako"
  },
  "What are my workplace rights as an employee?": {
    en: "What are my workplace rights as an employee?",
    af: "Wat is my werkplekregte as 'n werknemer?",
    zu: "Yimaphi amalungelo ami emsebenzini njengomsebenzi?",
    xh: "Ngawaphi amalungelo am emsebenzini njengomsebenzi?",
    st: "Ditokelo tsa ka mosebetsing ke dife jwalo ka mosebetsi?",
    nso: "Ditokelo tša ka mošomong ke dife bjalo ka mošomi?",
    tn: "Ditshwanelo tsa me kwa tirong ke dife jaaka modiri?",
    ts: "Timfanelo ta mina entirhweni i tihi tanihi mutirhi?",
    ss: "Ngimaphi emalungelo ami emsebentini njengemsebenti?",
    ve: "Pfanelo dzanga mushumoni ndi dzifhio sa mushumi?",
    nr: "Ngimaphi amalungelo ami emsebenzini njengomsebenzi?"
  },
  "How do Parliament, Courts, and the President work together?": {
    en: "How do Parliament, Courts, and the President work together?",
    af: "Hoe werk die Parlement, Howe en die President saam?",
    zu: "IPhalamende, Izinkantolo, noMongameli basebenza kanjani ndawonye?",
    xh: "IPalamente, Iinkundla, noMongameli basebenza njani kunye?",
    st: "Palamente, Makgotla, le Mopresidente ba sebetsa jwang mmoho?",
    nso: "Palamente, Makgotla, le Mopresidente ba šoma bjang mmogo?",
    tn: "Palamente, Dikgotlatshekelo, le Moporesidente ba dira jang mmogo?",
    ts: "Palamende, Tikhoto, na Presidente va tirha njhani swin'we?",
    ve: "Phalamennde, Khothe, na Phresidennde vha shuma hani vhoṱhe?",
    nr: "IPalamende, Iinkantolo, noMongameli basebenza njani ndawonye?"
  },
  
  // UI hints
  "Press": {
    en: "Press",
    af: "Druk",
    zu: "Cindezela",
    xh: "Cinezela",
    st: "Tobetsa",
    nso: "Tobetša",
    tn: "Tobetsa",
    ts: "Sindzisa",
    ss: "Cindzela",
    ve: "Dzhia",
    nr: "Gandelela"
  },
  "to send": {
    en: "to send",
    af: "om te stuur",
    zu: "ukuthumela",
    xh: "ukuthumela",
    st: "ho romela",
    nso: "go romela",
    tn: "go romela",
    ts: "ku rhumela",
    ss: "kutfumela",
    ve: "u rumela",
    nr: "ukuthumela"
  }
};

// ============================================
// Hook
// ============================================

export function useTranslation() {
  const [language, setLanguage] = useState("en");
  const [, forceUpdate] = useState(0);

  useEffect(() => {
    // Load initial preference
    const saved = localStorage.getItem("docketdive_language");
    if (saved) {
      setLanguage(saved);
    }

    // Listen for changes
    const handleChange = (e: CustomEvent) => {
      const newLang = e.detail.code;
      setLanguage(newLang);
      // Force a re-render to ensure all translations update
      forceUpdate(n => n + 1);
    };

    window.addEventListener("languageChange", handleChange as EventListener);
    return () => window.removeEventListener("languageChange", handleChange as EventListener);
  }, []);

  // Translation function - memoized but depends on language
  const t = useCallback((key: string): string => {
    const translation = translations[key];
    if (!translation) {
      // Key not found, return as-is
      return key;
    }
    // Return translation for current language, fallback to English, then key
    const result = translation[language] || translation["en"] || key;
    return result;
  }, [language]);

  return { t, language };
}

export default useTranslation;
