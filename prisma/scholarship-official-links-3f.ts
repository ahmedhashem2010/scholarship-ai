/**
 * TASK 3F — Official website / application URL backfill for the Final MVP 50.
 *
 * Data-only update. Identity is nameEn; the fill-empty merge in
 * scripts/lib/scholarship-data.mjs writes ONLY the two URL fields (existing
 * nameAr/country/degree values are included verbatim so they compare equal and
 * are never rewritten).
 *
 * officialWebsite: the authoritative page explaining the scholarship.
 * applicationUrl:  the official application portal/page. May equal
 *                  officialWebsite when the organisation uses one page for both.
 *                  NULL = applied for automatically via admission (no separate
 *                  portal) — never guessed.
 *
 * All URLs were verified 11 Aug 2026 against the provider's own domain; the
 * full evidence trail is in the task's research log. A few applicationUrls are
 * hosted on a vendor platform owned/operated for the provider (University of
 * Sydney → sydney.au1.qualtrics.com, Univ. of Melbourne → unimelb-scholarships.
 * smartygrants.com.au, Manaaki NZ → mnzspapplicantportal.powerappsportals.com).
 *
 * Apply: npx tsx scripts/import-scholarships.mjs prisma/scholarship-official-links-3f.ts [--apply]
 */

export const scholarshipOfficialLinks: {
  nameEn: string;
  nameAr: string;
  country: string;
  degree: string;
  officialWebsite: string | null;
  applicationUrl: string | null;
}[] = [
  {
    nameEn: "Australia Awards Scholarship",
    nameAr: "منحة جوائز أستراليا",
    country: "Australia",
    degree: "Bachelor / Master / PhD",
    officialWebsite:
      "https://www.dfat.gov.au/people-to-people/australia-awards/australia-awards-scholarships",
    applicationUrl: "https://oasis.dfat.gov.au/",
  },
  {
    nameEn: "Banach NAWA Scholarship (Poland)",
    nameAr: "برنامج باناش ناوا البولندي للمنح الدراسية",
    country: "Poland",
    degree: "Master",
    officialWebsite:
      "https://nawa.gov.pl/en/students/foreign-students/the-banach-scholarship-programme",
    applicationUrl: "https://programs.nawa.gov.pl/",
  },
  {
    nameEn: "Chevening Scholarship (UK Government)",
    nameAr: "منحة Chevening البريطانية",
    country: "United Kingdom",
    degree: "Master",
    officialWebsite: "https://www.chevening.org/",
    applicationUrl: "https://www.chevening.org/apply/",
  },
  {
    nameEn: "Chinese Government Scholarship (CSC)",
    nameAr: "منحة الحكومة الصينية",
    country: "China",
    degree: "Bachelor / Master / PhD",
    officialWebsite: "https://www.campuschina.org/",
    applicationUrl: "https://studyinchina.csc.edu.cn/",
  },
  {
    nameEn: "Erasmus Mundus Joint Master Degree",
    nameAr: "منحة إيراسموس موندوس",
    country: "Multiple (Europe)",
    degree: "Master",
    officialWebsite:
      "https://erasmus-plus.ec.europa.eu/opportunities/individuals/students/erasmus-mundus-joint-masters",
    applicationUrl:
      "https://www.eacea.ec.europa.eu/scholarships/erasmus-mundus-catalogue_en",
  },
  {
    nameEn:
      "Eric Bleumink Fund Scholarship for International Masters Students at the University of Groningen",
    nameAr: "منحة صندوق إريك بليومينك لطلاب الماجستير الدوليين في جامعة خرونينجن",
    country: "Netherlands",
    degree: "Master",
    officialWebsite:
      "https://www.rug.nl/education/scholarships/eric-bleumink-fellowship?lang=en",
    applicationUrl: null,
  },
  {
    nameEn: "Fulbright Foreign Student Program (USA)",
    nameAr: "منحة فولبرايت الأمريكية",
    country: "United States",
    degree: "Master / PhD",
    officialWebsite: "https://foreign.fulbrightonline.org/",
    applicationUrl: "https://foreign.fulbrightonline.org/apply",
  },
  {
    nameEn: "Fully Funded ADB Master's Scholarship in Asia and Pacific 2026",
    nameAr: "منحة ماجستير بنك التنمية الآسيوي الممولة بالكامل في آسيا والمحيط الهادئ 2026",
    country: "Japan",
    degree: "Master",
    officialWebsite: "https://www.adb.org/work-with-us/careers/japan-scholarship-program",
    applicationUrl:
      "https://www.adb.org/work-with-us/careers/japan-scholarship-program/procedures-applying",
  },
  {
    nameEn: "Fully Funded Research Scholarships at CQUniversity Australia",
    nameAr: "منحة أبحاث ممولة بالكامل في جامعة CQUniversity أستراليا",
    country: "Australia",
    degree: "Master / PhD",
    officialWebsite:
      "https://www.cqu.edu.au/study/international/international-scholarships",
    applicationUrl:
      "https://www.cqu.edu.au/study/prepare/scholarships/find-a-scholarship/745610/research-training-program-rtp-stipend-scholarship",
  },
  {
    nameEn: "Fully Funded Scholarships for Bachelor's, Master's, and PhD in Germany 2026",
    nameAr: "منح دراسية ممولة بالكامل لدرجات البكالوريوس والماجستير والدكتوراه في ألمانيا 2026",
    country: "Germany",
    degree: "Master / PhD",
    officialWebsite: "https://www.boell.de/en/scholarships",
    applicationUrl:
      "https://stipendium.boell.de/Default.aspx?lg=ENU&tp=3&an=&ad=&lk=2",
  },
  {
    nameEn:
      "Fully Funded Scholarships for Undergraduates Students at Abu Dhabi University",
    nameAr: "منح دراسية ممولة بالكامل لطلاب البكالوريوس في جامعة أبوظبي",
    country: "United Arab Emirates",
    degree: "Bachelor",
    officialWebsite: "https://www.adu.ac.ae/study/financials/scholarships",
    applicationUrl: null,
  },
  {
    nameEn: "Fully Funded Scholarships in Iraq 2026 for International Students",
    nameAr: "منح دراسية ممولة بالكامل في العراق 2026 للطلاب الدوليين",
    country: "Iraq",
    degree: "Bachelor / Master / PhD",
    officialWebsite: "https://studyiniraq.scrd-gate.gov.iq/",
    applicationUrl: "https://studyiniraq.scrd-gate.gov.iq/",
  },
  {
    nameEn:
      "Fully Funded Shanghai Government Scholarship 2026 with Stipend & Accommodation",
    nameAr: "منحة حكومة شنغهاي الممولة بالكامل 2026 مع منحة ومسكن",
    country: "China",
    degree: "Bachelor / Master / PhD",
    officialWebsite: "https://edu.sh.gov.cn/study_en_scholarships/index.html",
    applicationUrl: "https://www.study-shanghai.cn/",
  },
  {
    nameEn:
      "Fully Funded Undergraduate and Postgraduate Scholarships at Curtin University in Australia",
    nameAr: "منح دراسية ممولة بالكامل للبكالوريوس والدراسات العليا في جامعة كورتين في أستراليا",
    country: "Australia",
    degree: "Bachelor / Master / PhD",
    officialWebsite: "https://www.curtin.edu.au/study/scholarships/",
    applicationUrl: null,
  },
  {
    nameEn: "Fully Funded Undergraduate, Master’s & PhD Scholarship in China 2026",
    nameAr: "منحة دراسية ممولة بالكامل للبكالوريوس والماجستير والدكتوراه في الصين 2026",
    country: "China",
    degree: "Bachelor / Master / PhD",
    officialWebsite: "https://ic.ustc.edu.cn/en/admission.php",
    applicationUrl: "https://isa.ustc.edu.cn/user/login.asp",
  },
  {
    nameEn:
      "Fully-funded Bachelor's Scholarships in Various Disciplines from Nanyang Technological University in Singapore",
    nameAr: "منح البكالوريوس الممولة بالكامل في مختلف التخصصات من جامعة نانيانغ التكنولوجية في سنغافورة",
    country: "Singapore",
    degree: "Bachelor",
    officialWebsite:
      "https://www.ntu.edu.sg/admissions/undergraduate/scholarships/scholarship-opportunities",
    applicationUrl: null,
  },
  {
    nameEn: "Gates Cambridge Scholarship (UK)",
    nameAr: "منحة جيتس كامبريدج",
    country: "United Kingdom",
    degree: "Master / PhD",
    officialWebsite: "https://www.gatescambridge.org/",
    applicationUrl: "https://www.gatescambridge.org/apply/",
  },
  {
    nameEn:
      "Government of Turkey Research Scholarships in Different Fields in PhD in Turkey",
    nameAr: "منح بحثية حكومية تركية في مجالات مختلفة في دكتوراه في تركيا",
    country: "Turkey",
    degree: "PhD",
    officialWebsite: "https://www.turkiyeburslari.gov.tr/shorttermprograms",
    applicationUrl: "https://tbbs.turkiyeburslari.gov.tr",
  },
  {
    nameEn: "Greek Government Scholarship (IKY — Foreign Nationals)",
    nameAr: "منحة الحكومة اليونانية للطلاب الأجانب",
    country: "Greece",
    degree: "Bachelor",
    officialWebsite: "https://www.iky.gr/en/",
    applicationUrl: "https://ams.iky.gr/",
  },
  {
    nameEn:
      "Human Rights Scholarship 2026 at the University of Melbourne | Fully Funded Master’s & PhD in Australia",
    nameAr: "منحة حقوق الإنسان 2026 في جامعة ملبورن | ماجستير ودكتوراه ممولين بالكامل في أستراليا",
    country: "Australia",
    degree: "Master / PhD",
    officialWebsite:
      "https://scholarships.unimelb.edu.au/awards/human-rights-scholarship",
    applicationUrl:
      "https://unimelb-scholarships.smartygrants.com.au/2027-Human-Rights",
  },
  {
    nameEn: "Innopolis University Scholarship (Russia)",
    nameAr: "منحة جامعة إينوبوليس التقنية",
    country: "Russia",
    degree: "Bachelor / Master / PhD",
    officialWebsite: "https://innopolis.university/en/",
    applicationUrl: "https://apply.innopolis.university/en",
  },
  {
    nameEn: "KAUST Fellowship (Saudi Arabia)",
    nameAr: "منحة كاوست — جامعة الملك عبدالله",
    country: "Saudi Arabia",
    degree: "Master / PhD",
    officialWebsite: "https://kaust.edu.sa/en/study/applying-to-kaust",
    applicationUrl: "https://admissions.kaust.edu.sa/how-to-apply",
  },
  {
    nameEn: "Knight-Hennessy Scholars (Stanford)",
    nameAr: "منحة نايت-هينسي — ستانفورد",
    country: "United States",
    degree: "Master / PhD",
    officialWebsite: "https://knight-hennessy.stanford.edu/",
    applicationUrl: "https://knight-hennessy.stanford.edu/admission",
  },
  {
    nameEn: "Les Roches Scholarship (Switzerland)",
    nameAr: "منح معهد لي روش (Les Roches)",
    country: "Switzerland",
    degree: "Bachelor / Master",
    officialWebsite: "https://lesroches.edu/",
    applicationUrl: null,
  },
  {
    nameEn: "MAIPs-UniSIRAJ Higher Education Scholarship (Malaysia)",
    nameAr: "منحة MAIPs-UniSIRAJ للتعليم العالي",
    country: "Malaysia",
    degree: "Bachelor / Master / PhD",
    officialWebsite: "https://unisiraj.edu.my/",
    applicationUrl: "https://unisiraj.edu.my/admission/",
  },
  {
    nameEn: "Manaaki New Zealand Scholarships",
    nameAr: "منحة ماناكي النيوزيلندية",
    country: "New Zealand",
    degree: "Bachelor / Master / PhD",
    officialWebsite: "https://www.nzscholarships.govt.nz/",
    applicationUrl: "https://mnzspapplicantportal.powerappsportals.com/",
  },
  {
    nameEn: "Mastercard Foundation Scholarship at the University of Pretoria",
    nameAr: "منحة مؤسسة ماستركارد في جامعة بريتوريا",
    country: "South Africa",
    degree: "Master",
    officialWebsite: "https://www.up.ac.za/mastercard-foundation-scholars-program",
    applicationUrl:
      "https://www.up.ac.za/mastercard-foundation-scholars-program/how-apply",
  },
  {
    nameEn:
      "McCall MacBain Scholarship | Fully Funded Master's Programs at McGill University in Canada",
    nameAr: "منحة ماكول ماكباين | برامج ماجستير ممولة بالكامل في جامعة ماكجيل في كندا",
    country: "Canada",
    degree: "Master",
    officialWebsite: "https://mccallmacbainscholars.org/",
    applicationUrl: "https://mccallmacbainscholars.org/apply/",
  },
  {
    nameEn:
      "Merit Excellence Scholarships Undergraduate and Graduate Students at Deakin University in Australia",
    nameAr: "منح متميزة للتميز لطلاب البكالوريوس والدراسات العليا في جامعة ديكين في أستراليا",
    country: "Australia",
    degree: "Bachelor / Master / PhD",
    officialWebsite:
      "https://www.deakin.edu.au/international-students/international-student-scholarships",
    applicationUrl: null,
  },
  {
    nameEn: "MEXT Scholarship (Japanese Government Scholarship)",
    nameAr: "منحة MEXT اليابانية",
    country: "Japan",
    degree: "Bachelor / Master / PhD",
    officialWebsite: "https://www.studyinjapan.go.jp/",
    applicationUrl:
      "https://www.studyinjapan.go.jp/en/planning/scholarships/mext-scholarships/",
  },
  {
    nameEn: "New Zealand Government Scholarship for International Students 2026",
    nameAr: "منحة حكومة نيوزيلندا للطلاب الدوليين 2026",
    country: "New Zealand",
    degree: "Bachelor / Master / PhD",
    officialWebsite: "https://www.nzscholarships.govt.nz/",
    applicationUrl: "https://www.nzscholarships.govt.nz/international-tertiary-students",
  },
  {
    nameEn:
      "Partial Funded Scholarships for Undergraduates and Graduates at the University of Bradford in the UK",
    nameAr: "منح جزئيا ممولة للبكالوريوس والدراسات العليا في جامعة برادفورد في المملكة المتحدة",
    country: "United Kingdom",
    degree: "Bachelor / Master / PhD",
    officialWebsite: "https://www.bradford.ac.uk/scholarships/",
    applicationUrl: null,
  },
  {
    nameEn: "Partially Funded Harvard MBA Scholarship 2026",
    nameAr: "منحة ماجستير إدارة الأعمال في جامعة هارفارد جزئية 2026",
    country: "United States",
    degree: "Master",
    officialWebsite: "https://www.hbs.edu/mba/financial-aid/tuition-assistance",
    applicationUrl: null,
  },
  {
    nameEn:
      "Partially Funded Undergraduate Excellence Scholarships at Glasgow University in the UK",
    nameAr: "منح متميزة جزئيًا للبكالوريوس في جامعة غلاسكو في المملكة المتحدة",
    country: "United Kingdom",
    degree: "Bachelor",
    officialWebsite: "https://www.gla.ac.uk/scholarships/",
    applicationUrl: null,
  },
  {
    nameEn: "Partially-Funded University of Bradford MERO Scholarship",
    nameAr: "منحة جامعة برادفورد MERO جزئيًا",
    country: "United Kingdom",
    degree: "Bachelor / Master / PhD",
    officialWebsite:
      "https://www.bradford.ac.uk/scholarships/mero-scholarship-for-middle-east-north-africa-south-asia-south-east-asia-2023-24/",
    applicationUrl: null,
  },
  {
    nameEn:
      "PhD Scholarships for Development Countries Students at the University of Cambridge 2026",
    nameAr: "منح دكتوراه لطلاب من الدول النامية في جامعة كامبريدج 2026",
    country: "United Kingdom",
    degree: "PhD",
    officialWebsite: "https://www.cambridgetrust.org/postgraduate-applicants/",
    applicationUrl: null,
  },
  {
    nameEn: "Rhodes Scholarship (Oxford)",
    nameAr: "منحة رودس — أوكسفورد",
    country: "United Kingdom",
    degree: "Master / PhD",
    officialWebsite: "https://www.rhodeshouse.ox.ac.uk/",
    applicationUrl: "https://www.rhodeshouse.ox.ac.uk/scholarships/applications/",
  },
  {
    nameEn: "Romanian Government Scholarship (MFA Scholarships for non-EU Students)",
    nameAr: "منحة الحكومة الرومانية",
    country: "Romania",
    degree: "Bachelor / Master / PhD",
    officialWebsite: "https://www.mae.ro/",
    applicationUrl: "https://scholarships.studyinromania.gov.ro/",
  },
  {
    nameEn: "Russian Government Quota Scholarship (Rossotrudnichestvo)",
    nameAr: "منحة الحكومة الروسية",
    country: "Russia",
    degree: "Bachelor / Master / PhD",
    officialWebsite: "https://education-in-russia.com/",
    applicationUrl: "https://education-in-russia.com/",
  },
  {
    nameEn: "Saudi Government Scholarship (Study in Saudi)",
    nameAr: "منحة الحكومة السعودية (ادرس في السعودية)",
    country: "Saudi Arabia",
    degree: "Bachelor / Master / PhD",
    officialWebsite: "https://studyinsaudi.moe.gov.sa/",
    applicationUrl: "https://studyinsaudi.sa/en",
  },
  {
    nameEn: "Schwarzman Scholars (China)",
    nameAr: "منحة شوارزمان الصينية",
    country: "China",
    degree: "Master",
    officialWebsite: "https://www.schwarzmanscholars.org/",
    applicationUrl: "https://www.schwarzmanscholars.org/admissions/",
  },
  {
    nameEn: "Stipendium Hungaricum Scholarship",
    nameAr: "منحة Stipendium Hungaricum",
    country: "Hungary",
    degree: "Bachelor / Master / PhD",
    officialWebsite: "https://stipendiumhungaricum.hu/",
    applicationUrl: "https://apply.stipendiumhungaricum.hu/",
  },
  {
    nameEn: "Study in Kazakhstan Scholarship Program",
    nameAr: "منحة الحكومة الكازاخستانية (Study in Kazakhstan)",
    country: "Kazakhstan",
    degree: "Bachelor / Master / PhD",
    officialWebsite: "https://studyin.kz/",
    applicationUrl: "https://studyin.kz/admission",
  },
  {
    nameEn: "Swedish Institute Scholarship for Global Professionals",
    nameAr: "منحة المعهد السويدي",
    country: "Sweden",
    degree: "Master",
    officialWebsite: "https://si.se/",
    applicationUrl:
      "https://si.se/en/apply/scholarships/swedish-institute-scholarships-for-global-professionals/",
  },
  {
    nameEn: "Swiss Government Excellence Scholarship",
    nameAr: "منحة الحكومة السويسرية",
    country: "Switzerland",
    degree: "PhD / Research",
    officialWebsite: "https://www.sbfi.admin.ch/",
    applicationUrl:
      "https://www.sbfi.admin.ch/sbfi/en/home/education/scholarships-and-grants/swiss-government-excellence-scholarships.html",
  },
  {
    nameEn: "Turkiye Burslari Scholarship (Türkiye)",
    nameAr: "منحة تركيا بورسلاري",
    country: "Turkey",
    degree: "Bachelor / Master / PhD",
    officialWebsite:
      "https://www.turkiyeburslari.gov.tr/en/scholarships/turkish-government-scholarships-for-international-students",
    applicationUrl: "https://tbbs.turkiyeburslari.gov.tr",
  },
  {
    nameEn: "Undergraduate & Postgraduate Business Scholarships at QUT in Australia",
    nameAr: "منح أعمال لطلاب البكالوريوس والدراسات العليا في QUT في أستراليا",
    country: "Australia",
    degree: "Bachelor / Master",
    officialWebsite:
      "https://www.qut.edu.au/study/fees-and-scholarships/scholarships/international-merit-scholarship",
    applicationUrl: null,
  },
  {
    nameEn:
      "University of Sydney International Scholarship for Postgraduates Students 2026",
    nameAr: "منحة جامعة سيدني الدولية للدراسات العليا 2026",
    country: "Australia",
    degree: "Master / PhD",
    officialWebsite:
      "https://www.sydney.edu.au/scholarships/international/postgraduate-research/general.html",
    applicationUrl: null,
  },
  {
    nameEn: "University of Sydney Undergraduate Scholarship 2026 (Fully Funded)",
    nameAr: "منحة جامعة سيدني للبكالوريوس 2026 (ممولة بالكامل)",
    country: "Australia",
    degree: "Bachelor",
    officialWebsite:
      "https://www.sydney.edu.au/scholarships/e/sydney-international-undergraduate-academic-excellence-scholarship.html",
    applicationUrl: "https://sydney.au1.qualtrics.com/jfe/form/SV_4UVYI4CvxYuhwy2",
  },
  {
    nameEn:
      "Üsküdar University Scholarship 2026 in Turkey | Scholarships for International Students",
    nameAr: "منحة جامعة أسكودار 2026 في تركيا | منح للطلاب الدوليين",
    country: "Turkey",
    degree: "Bachelor / Master / PhD",
    officialWebsite: "https://uskudar.edu.tr/en/scholarships",
    applicationUrl: null,
  },
];

export default scholarshipOfficialLinks;
