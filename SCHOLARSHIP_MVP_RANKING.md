# SmartScholar MVP Scholarship Ranking

Generated on 2026-08-10 by `scripts/rank-mvp-scholarships.mjs`.
Deterministic ranking — every score is computed from scholarship fields by `scripts/lib/mvp-ranking.mjs`.
No scholarships were added, deleted or modified. Nothing was written to the database.

> Task 2H is applied (Task 2J, Phase 2): the database holds 250
> scholarships. The 8 new Task 2H records and 3 Task 2H updates are live.
> Records marked † previously needed the in-memory overlay; the overlay is now
> a no-op and marks are retained only for traceability. See
> `SCHOLARSHIP_MVP_CATALOG.md` for the official MVP catalog (Top 50).

## Scoring formula (100 points)

| Component | Weight | What is scored (from database fields) |
|---|---|---|
| Data completeness | 20 | 10 checks × 2: eligibleCountries, eligibleEducation, fieldOfStudy, benefits, requirements, requiredDocuments, deadline, englishRequirement, age/GPA depth, description |
| Source quality | 15 | `source` = MANUAL → 15; SCRAPED with official URL → 10; SCRAPED aggregator (for9a.com) → 3 |
| Deadline quality | 15 | Confirmed future 2026/27 deadline → 15; null + curated (cycle in requirements) → 10; null + scraped → 8; expired → 0 |
| Funding | 15 | Keyword tiers over benefits+description: fully funded 15, tuition+stipend 12, tuition+accommodation 10, substantial 8, partial 5, unknown 2, none 0 |
| Bachelor relevance | 10 | Bachelor's / undergraduate eligible → 10; Master/PhD only → 4; unknown → 5 |
| Egypt/MENA eligibility | 10 | Egypt explicitly listed → 10; MENA country listed → 9; `All` (international) → 8; other countries → 5; unknown → 4 |
| Application usability | 5 | Official application URL / MANUAL → 5; aggregator link → 2 |
| Matching confidence | 5 | country + education + field all structured → 5; partial → 3; none → 1 |
| Programme value | 3 | Government/official/university → 3; aggregator → 1 |
| Freshness | 2 | updatedAt within 90 days → 2; within 365 → 1; older → 0 |
| **Total** | **100** | |

Notes:
- Scores are fully reproducible from the scholarship fields; no AI is involved.
- Expired deadlines score 0 in the deadline component but the record is never deleted.
- "Data completeness" measures whether a field is present, not whether it is current (currency is scored separately).

## Top 50

| Rank | Scholarship | Country | Degree | Funding | Deadline | Source quality | Score | Why it made the Top 50 |
|---|---|---|---|---|---|---|---|---|
| 1 | Russian Government Quota Scholarship (Rossotrudnichestvo) † | Russia | Bachelor / Master / PhD | Fully funded | 2027-01-15 | Official (curated) | 96 | official government/university source; confirmed 2026/27 deadline; fully funded / tuition + stipend; Bachelor's / high-school eligible; open to Egyptians / MENA / internationals; complete structured data |
| 2 | Schwarzman Scholars (China) | China | Master | Fully funded | 2026-09-09 | Official (curated) | 92 | official government/university source; confirmed 2026/27 deadline; fully funded / tuition + stipend; open to Egyptians / MENA / internationals; complete structured data |
| 3 | Gates Cambridge Scholarship (UK) | United Kingdom | Master / PhD | Tuition + stipend | 2026-12-03 | Official (curated) | 89 | official government/university source; confirmed 2026/27 deadline; fully funded / tuition + stipend; open to Egyptians / MENA / internationals; complete structured data |
| 4 | Greek Government Scholarship (IKY — Foreign Nationals) † | Greece | Bachelor | Fully funded | — | Official (curated) | 89 | official government/university source; fully funded / tuition + stipend; Bachelor's / high-school eligible; open to Egyptians / MENA / internationals; complete structured data |
| 5 | MAIPs-UniSIRAJ Higher Education Scholarship (Malaysia) † | Malaysia | Bachelor / Master / PhD | Fully funded | — | Official (curated) | 89 | official government/university source; fully funded / tuition + stipend; Bachelor's / high-school eligible; open to Egyptians / MENA / internationals; complete structured data |
| 6 | Romanian Government Scholarship (MFA Scholarships for non-EU Students) | Romania | Bachelor / Master / PhD | Fully funded | — | Official (curated) | 89 | official government/university source; fully funded / tuition + stipend; Bachelor's / high-school eligible; open to Egyptians / MENA / internationals; complete structured data |
| 7 | Saudi Government Scholarship (Study in Saudi) † | Saudi Arabia | Bachelor / Master / PhD | Fully funded | — | Official (curated) | 89 | official government/university source; fully funded / tuition + stipend; Bachelor's / high-school eligible; open to Egyptians / MENA / internationals; complete structured data |
| 8 | Manaaki New Zealand Scholarships | New Zealand | Bachelor / Master / PhD | Fully funded | — | Official (curated) | 88 | official government/university source; fully funded / tuition + stipend; Bachelor's / high-school eligible; complete structured data |
| 9 | Knight-Hennessy Scholars (Stanford) | United States | Master / PhD | Tuition + stipend | 2026-10-06 | Official (curated) | 87 | official government/university source; confirmed 2026/27 deadline; fully funded / tuition + stipend; open to Egyptians / MENA / internationals; complete structured data |
| 10 | King Saud University Scholarship (Saudi Arabia) | Saudi Arabia | Bachelor / Master / PhD | Fully funded | 2026-05-30 | Official (curated) | 85 | official government/university source; fully funded / tuition + stipend; Bachelor's / high-school eligible; open to Egyptians / MENA / internationals; complete structured data |
| 11 | Lester B. Pearson International Scholarship (University of Toronto) | Canada | Bachelor | Fully funded | 2025-11-15 | Official (curated) | 85 | official government/university source; fully funded / tuition + stipend; Bachelor's / high-school eligible; open to Egyptians / MENA / internationals; complete structured data |
| 12 | Mohammed Bin Rashid Al Maktoum Scholarship (UAE) | United Arab Emirates | Bachelor / Master / PhD | Fully funded | 2026-07-15 | Official (curated) | 85 | official government/university source; fully funded / tuition + stipend; Bachelor's / high-school eligible; open to Egyptians / MENA / internationals; complete structured data |
| 13 | Orange Tulip Scholarship (Netherlands) | Netherlands | Bachelor / Master | Fully funded | 2026-04-01 | Official (curated) | 85 | official government/university source; fully funded / tuition + stipend; Bachelor's / high-school eligible; open to Egyptians / MENA / internationals; complete structured data |
| 14 | Qatar University International Student Scholarship | Qatar | Bachelor / Master / PhD | Fully funded | 2026-03-31 | Official (curated) | 85 | official government/university source; fully funded / tuition + stipend; Bachelor's / high-school eligible; open to Egyptians / MENA / internationals; complete structured data |
| 15 | Sawiris Foundation Scholarship for Egyptians | Egypt | Bachelor / Master / PhD | Fully funded | 2026-06-01 | Official (curated) | 85 | official government/university source; fully funded / tuition + stipend; Bachelor's / high-school eligible; open to Egyptians / MENA / internationals; complete structured data |
| 16 | University of Bologna Study Grant for International Students (Italy) | Italy | Bachelor / Master | Fully funded | 2026-04-30 | Official (curated) | 85 | official government/university source; fully funded / tuition + stipend; Bachelor's / high-school eligible; open to Egyptians / MENA / internationals; complete structured data |
| 17 | University of Queensland — Destination Australia Scholarship | Australia | Bachelor / Master / PhD | Fully funded | 2026-02-28 | Official (curated) | 85 | official government/university source; fully funded / tuition + stipend; Bachelor's / high-school eligible; open to Egyptians / MENA / internationals; complete structured data |
| 18 | University of Warsaw — Polish Government Scholarship | Poland | Bachelor / Master / PhD | Fully funded | 2026-06-30 | Official (curated) | 85 | official government/university source; fully funded / tuition + stipend; Bachelor's / high-school eligible; open to Egyptians / MENA / internationals; complete structured data |
| 19 | Australia Awards Scholarship | Australia | Bachelor / Master / PhD | Fully funded | — | Official URL | 84 | official government/university source; fully funded / tuition + stipend; Bachelor's / high-school eligible; open to Egyptians / MENA / internationals; complete structured data |
| 20 | Turkiye Burslari Scholarship (Türkiye) | Turkey | Bachelor / Master / PhD | Fully funded | — | Official URL | 84 | official government/university source; fully funded / tuition + stipend; Bachelor's / high-school eligible; open to Egyptians / MENA / internationals; complete structured data |
| 21 | Commonwealth Scholarships (UK) | United Kingdom | Master / PhD | Fully funded | 2026-10-20 | Official (curated) | 82 | official government/university source; confirmed 2026/27 deadline; fully funded / tuition + stipend; complete structured data |
| 22 | Heinrich Böll Foundation Scholarship (Germany) | Germany | Bachelor / Master / PhD | Tuition + stipend | 2026-03-01 | Official (curated) | 82 | official government/university source; fully funded / tuition + stipend; Bachelor's / high-school eligible; open to Egyptians / MENA / internationals; complete structured data |
| 23 | Rhodes Scholarship (Oxford) | United Kingdom | Master / PhD | Tuition + stipend | — | Official (curated) | 82 | official government/university source; fully funded / tuition + stipend; open to Egyptians / MENA / internationals; complete structured data |
| 24 | Study in Kazakhstan Scholarship Program † | Kazakhstan | Bachelor / Master / PhD | Tuition + accommodation | — | Official (curated) | 82 | official government/university source; substantial funding; Bachelor's / high-school eligible; open to Egyptians / MENA / internationals; complete structured data |
| 25 | Innopolis University Scholarship (Russia) † | Russia | Bachelor / Master / PhD | Substantial | — | Official (curated) | 80 | official government/university source; substantial funding; Bachelor's / high-school eligible; open to Egyptians / MENA / internationals; complete structured data |
| 26 | KAUST Fellowship (Saudi Arabia) | Saudi Arabia | Master / PhD | Fully funded | — | Official URL | 80 | official government/university source; fully funded / tuition + stipend; open to Egyptians / MENA / internationals; complete structured data |
| 27 | ARES Scholarship (Belgium) | Belgium | Master | Fully funded | 2026-02-07 | Official (curated) | 79 | official government/university source; fully funded / tuition + stipend; open to Egyptians / MENA / internationals; complete structured data |
| 28 | Banach NAWA Scholarship (Poland) † | Poland | Master | Tuition + stipend | — | Official (curated) | 79 | official government/university source; fully funded / tuition + stipend; open to Egyptians / MENA / internationals; complete structured data |
| 29 | Chevening Scholarship (UK Government) | United Kingdom | Master | Fully funded | 2026-10-06 | Official URL | 79 | confirmed 2026/27 deadline; fully funded / tuition + stipend; open to Egyptians / MENA / internationals; complete structured data |
| 30 | Clarendon Fund Scholarship (University of Oxford) | United Kingdom | Master / PhD | Fully funded | 2026-01-10 | Official (curated) | 79 | official government/university source; fully funded / tuition + stipend; open to Egyptians / MENA / internationals; complete structured data |
| 31 | ETH Zurich Excellence Scholarship (Switzerland) | Switzerland | Master | Fully funded | 2025-12-15 | Official (curated) | 79 | official government/university source; fully funded / tuition + stipend; open to Egyptians / MENA / internationals; complete structured data |
| 32 | Fully Funded Scholarships for Undergraduates Students at Abu Dhabi University | United Arab Emirates | Bachelor | Fully funded | 2027-06-30 | Aggregator (scraped) | 79 | confirmed 2026/27 deadline; fully funded / tuition + stipend; Bachelor's / high-school eligible; open to Egyptians / MENA / internationals; complete structured data |
| 33 | Fully Funded Shanghai Government Scholarship 2026 with Stipend & Accommodation | China | Bachelor / Master / PhD | Fully funded | 2027-04-30 | Aggregator (scraped) | 79 | confirmed 2026/27 deadline; fully funded / tuition + stipend; Bachelor's / high-school eligible; open to Egyptians / MENA / internationals; complete structured data |
| 34 | Fully Funded Undergraduate and Postgraduate Scholarships at Curtin University in Australia | Australia | Bachelor / Master / PhD | Fully funded | 2027-04-30 | Aggregator (scraped) | 79 | confirmed 2026/27 deadline; fully funded / tuition + stipend; Bachelor's / high-school eligible; open to Egyptians / MENA / internationals; complete structured data |
| 35 | Fully Funded Undergraduate, Master’s & PhD Scholarship in China 2026 | China | Bachelor / Master / PhD | Fully funded | 2026-09-30 | Aggregator (scraped) | 79 | confirmed 2026/27 deadline; fully funded / tuition + stipend; Bachelor's / high-school eligible; open to Egyptians / MENA / internationals; complete structured data |
| 36 | Fully-funded Bachelor's Scholarships in Various Disciplines from Nanyang Technological University in Singapore | Singapore | Bachelor | Fully funded | 2027-03-19 | Aggregator (scraped) | 79 | confirmed 2026/27 deadline; fully funded / tuition + stipend; Bachelor's / high-school eligible; open to Egyptians / MENA / internationals; complete structured data |
| 37 | Mälardalen University Scholarship (Sweden) | Sweden | Master | Fully funded | 2026-01-15 | Official (curated) | 79 | official government/university source; fully funded / tuition + stipend; open to Egyptians / MENA / internationals; complete structured data |
| 38 | New Zealand Government Scholarship for International Students 2026 | New Zealand | Bachelor / Master / PhD | Fully funded | 2027-03-31 | Aggregator (scraped) | 79 | confirmed 2026/27 deadline; fully funded / tuition + stipend; Bachelor's / high-school eligible; open to Egyptians / MENA / internationals; complete structured data |
| 39 | University of Geneva Excellence Master Fellowship (Switzerland) | Switzerland | Master | Fully funded | 2026-02-28 | Official (curated) | 79 | official government/university source; fully funded / tuition + stipend; open to Egyptians / MENA / internationals; complete structured data |
| 40 | University of Tokyo — ADB Scholarship | Japan | Master / PhD | Fully funded | 2026-02-15 | Official (curated) | 79 | official government/university source; fully funded / tuition + stipend; open to Egyptians / MENA / internationals; complete structured data |
| 41 | Üsküdar University Scholarship 2026 in Turkey \| Scholarships for International Students † | Turkey | Bachelor / Master / PhD | Fully funded | 2026-08-30 | Aggregator (scraped) | 79 | confirmed 2026/27 deadline; fully funded / tuition + stipend; Bachelor's / high-school eligible; open to Egyptians / MENA / internationals; complete structured data |
| 42 | Vanier Canada Graduate Scholarship | Canada | PhD | Fully funded | 2025-11-07 | Official (curated) | 79 | official government/university source; fully funded / tuition + stipend; open to Egyptians / MENA / internationals; complete structured data |
| 43 | VLIR-UOS Scholarship (Belgium — Master) | Belgium | Master | Fully funded | 2026-02-01 | Official (curated) | 79 | official government/university source; fully funded / tuition + stipend; open to Egyptians / MENA / internationals; complete structured data |
| 44 | Les Roches Scholarship (Switzerland) † | Switzerland | Bachelor / Master | Partial | — | Official (curated) | 77 | official government/university source; Bachelor's / high-school eligible; open to Egyptians / MENA / internationals; complete structured data |
| 45 | Austrian Government Scholarship (OeAD) | Austria | Master / PhD / Research | Tuition + stipend | 2026-03-01 | Official (curated) | 76 | official government/university source; fully funded / tuition + stipend; open to Egyptians / MENA / internationals; complete structured data |
| 46 | Chinese Government Scholarship (CSC) | China | Bachelor / Master / PhD | Fully funded | — | Official URL | 76 | fully funded / tuition + stipend; Bachelor's / high-school eligible; open to Egyptians / MENA / internationals; complete structured data |
| 47 | Danish Government Scholarship (University of Copenhagen) | Denmark | Master | Tuition + stipend | 2026-03-01 | Official (curated) | 76 | official government/university source; fully funded / tuition + stipend; open to Egyptians / MENA / internationals; complete structured data |
| 48 | Fully Funded ADB Master's Scholarship in Asia and Pacific 2026 | Japan | Master | Fully funded | 2026-12-30 | Aggregator (scraped) | 75 | confirmed 2026/27 deadline; fully funded / tuition + stipend; open to Egyptians / MENA / internationals; complete structured data |
| 49 | Government of Turkey Research Scholarships in Different Fields in PhD in Turkey | Turkey | PhD | Fully funded | 2027-02-20 | Aggregator (scraped) | 75 | confirmed 2026/27 deadline; fully funded / tuition + stipend; open to Egyptians / MENA / internationals; complete structured data |
| 50 | Mastercard Foundation Scholarship at the University of Pretoria | South Africa | Master | Fully funded | 2026-09-30 | Aggregator (scraped) | 75 | confirmed 2026/27 deadline; fully funded / tuition + stipend; open to Egyptians / MENA / internationals; complete structured data |

## Tier B — kept, ranked 51+ (still worth showing in a full catalog, not in the MVP Top 50)

Threshold: score 30+. 189 scholarships.

| Rank | Scholarship | Country | Degree | Score |
|---|---|---|---|
| 51 | Fully Funded Scholarships in Iraq 2026 for International Students | Iraq | Bachelor / Master / PhD | 74 |
| 52 | Merit Excellence Scholarships Undergraduate and Graduate Students at Deakin University in Australia | Australia | Bachelor / Master / PhD | 74 |
| 53 | Partially-Funded University of Bradford MERO Scholarship | United Kingdom | Bachelor / Master / PhD | 74 |
| 54 | Eric Bleumink Fund Scholarship for International Masters Students at the University of Groningen | Netherlands | Master | 73 |
| 55 | Fully Funded Research Scholarships at CQUniversity Australia | Australia | Master / PhD | 73 |
| 56 | Human Rights Scholarship 2026 at the University of Melbourne \| Fully Funded Master’s & PhD in Australia † | Australia | Master / PhD | 73 |
| 57 | McCall MacBain Scholarship \| Fully Funded Master's Programs at McGill University in Canada | Canada | Master | 73 |
| 58 | MEXT Scholarship (Japanese Government Scholarship) | Japan | Bachelor / Master / PhD | 73 |
| 59 | PhD Scholarships for Development Countries Students at the University of Cambridge 2026 | United Kingdom | PhD | 73 |
| 60 | Stipendium Hungaricum Scholarship | Hungary | Bachelor / Master / PhD | 73 |
| 61 | University of Sydney International Scholarship for Postgraduates Students 2026 | Australia | Master / PhD | 73 |
| 62 | GKS Scholarship (Global Korea Scholarship — KGSP) | South Korea | Bachelor / Master / PhD | 72 |
| 63 | Government of Ireland International Education Scholarship (GOI-IES) | Ireland | Master / PhD | 72 |
| 64 | Partial Funded Scholarships for Undergraduates and Graduates at the University of Bradford in the UK | United Kingdom | Bachelor / Master / PhD | 72 |
| 65 | Undergraduate & Postgraduate Business Scholarships at QUT in Australia | Australia | Bachelor / Master | 72 |
| 66 | University of Sydney Undergraduate Scholarship 2026 (Fully Funded) | Australia | Bachelor | 72 |
| 67 | Erasmus Mundus Joint Master Degree | Multiple (Europe) | Master | 70 |
| 68 | Fulbright Foreign Student Program (USA) | United States | Master / PhD | 70 |
| 69 | Fully Funded Scholarships for Bachelor's, Master's, and PhD in Germany 2026 | Germany | Master / PhD | 70 |
| 70 | Swedish Institute Scholarship for Global Professionals | Sweden | Master | 70 |
| 71 | Holland Scholarship (Netherlands) | Netherlands | Bachelor / Master | 69 |
| 72 | Partially Funded Undergraduate Excellence Scholarships at Glasgow University in the UK | United Kingdom | Bachelor | 69 |
| 73 | PEC-PG Brazilian Government Scholarship † | Brazil | Master / PhD | 69 |
| 74 | Swiss Government Excellence Scholarship | Switzerland | PhD / Research | 69 |
| 75 | Partially Funded Harvard MBA Scholarship 2026 | United States | Master | 68 |
| 76 | Concordia University Entrance Scholarships for Bachelor's Students | Canada | Bachelor | 67 |
| 77 | Fully Funded Undergraduate and Master's Scholarships at University of Siena, Italy 2026 | Italy | Bachelor / Master | 67 |
| 78 | University of Winnipeg Scholarship 2026 in Canada for International Students with Funding up to CAD 5,000 | Canada | Bachelor / Master / PhD | 67 |
| 79 | Partially Funded Bachelor's Scholarship in USA 2026 | United States | Bachelor | 66 |
| 80 | Gilman International Scholarship 2026 \| Fully Funded Program for Undergraduate Students in the USA | United States | Bachelor | 64 |
| 81 | DAAD EPOS Scholarship (Development-Related Postgraduate Courses) | Germany | Master / PhD | 63 |
| 82 | DAAD GERSs (German Egyptian Research Scholarships) | Germany | Master / PhD | 63 |
| 83 | DAAD Scholarship (Germany) — Master & PhD | Germany | Master / PhD | 63 |
| 84 | Eiffel Excellence Scholarship (France) | France | Master / PhD | 63 |
| 85 | Italian Government Scholarship (MAECI) | Italy | Master / PhD / Research | 63 |
| 86 | Master’s in Renewable and Sustainable Energy in the United Kingdom 2026 | United Kingdom | Master | 63 |
| 87 | Partially Funded Master Scholarships of up to £9,000 from the University of Southampton | United Kingdom | Master | 63 |
| 88 | Partially Funded Master's Scholarship in UK From York University 2026 | United Kingdom | Master | 63 |
| 89 | Study Opportunity in Europe at EMUNI University \| Master’s and PhD with Partial Scholarships | Slovenia | Master / PhD | 63 |
| 90 | National Scholarship Program Slovakia 2026 for International Students | Slovakia | Master / PhD | 61 |
| 91 | Aberdeen Global Scholarship for Postgraduate Students from Africa | United Kingdom | Master | 60 |
| 92 | Florida Nursing Scholarship 2026 for Nursing Students in Florida | United States | Bachelor / Master / PhD | 52 |
| 93 | DAAD EPOS Scholarship 2026-27 for Postgraduate Studies in Germany | Germany | Master | 51 |
| 94 | Study in Istanbul: Altınbaş University Scholarship 2026 \| Scholarships for International Students | Turkey | Bachelor | 50 |
| 95 | Top Five Fully Funded Scholarships This Week | Germany | Bachelor / Master / PhD | 48 |
| 96 | Onsi Sawiris Graduate Scholarship in USA | United States | Master | 46 |
| 97 | DAAD Funded Scholarships for International Students in Germany | Germany | Bachelor / Master / PhD | 45 |
| 98 | Funded Scholarship for Pre-medical and Medical Students from BeMo | Canada | Bachelor / Master / PhD | 45 |
| 99 | Opportunity to study a diploma in the United States with partial funding at KCC 2026 | United States | Bachelor / Master / PhD | 45 |
| 100 | Scholarship for Palestinian Bachelor Students from Ahdaf | Palestine | Bachelor | 45 |
| 101 | Swiss Government Excellence Scholarships 2026-2027 | Multiple | Bachelor / Master / PhD | 45 |
| 102 | Full and Partial Scholarships/Financial Aid for International Students at Brac University 2026 | Bangladesh | Bachelor / Master / PhD | 43 |
| 103 | Partial Bachelor's Scholarships at the Canadian University Dubai 2026 | United Arab Emirates | Bachelor | 43 |
| 104 | Fully Funded AWS AI & ML Scholarship with Udacity 2026 | Multiple (Global) | Bachelor / Master / PhD | 42 |
| 105 | Fully Funded Bachelor's Scholarship in USA 2026 From The University of Southern Mississippi | United States | Bachelor | 42 |
| 106 | Fully Funded Fulbright Foreign Student Scholarship to the USA, 2026-2027 | United States | Bachelor / Master / PhD | 42 |
| 107 | Fully Funded Scholarship in the United States for Jordanians 2026 | United States | Bachelor / Master / PhD | 42 |
| 108 | Fully Funded Study in Taiwan: TaiwanICDF Scholarship 2026 | China | Bachelor / Master / PhD | 42 |
| 109 | Goldsmiths Sanctuary Scholarship 2027 in the UK With Fully Funded Scholarship for Refugees | United Kingdom | Bachelor / Master / PhD | 42 |
| 110 | Onsi Sawiris Scholarship 2026 for Egyptian Students Fully Funded Bachelor’s in USA | United States; United States; United States; United States | Bachelor | 42 |
| 111 | Research Scholarships for PhD Students Earth Science Research at ANU in Australia | Australia | PhD | 42 |
| 112 | Robert Gordon University Vice-Chancellor Scholarship 2026 (Fully Funded Bachelor’s) | United Kingdom | Bachelor | 42 |
| 113 | Partial Funded Master's Scholarship in Artificial Intelligence UK 2026 | United Kingdom | Master | 41 |
| 114 | Partially Funded Business & Economics Scholarships for International Students in the University of Melbourne in Australia | Australia | Bachelor / Master / PhD | 41 |
| 115 | Partially Funded Scholarships in Australia for all Majors at Newman College in the University of Melbourne | Australia | Bachelor / Master / PhD | 41 |
| 116 | Tuition Fees Scholarships in Philosophy at ANU in Australia | Australia | Bachelor / Master / PhD | 41 |
| 117 | Bachelor and Postgraduate Scholarships for Jordanians from Waikato University in New Zealand | New Zealand | Master | 39 |
| 118 | Catholic Foresters Undergraduate Scholarship 2026 in the United States | United States | Master | 39 |
| 119 | Earmarked PhD Scholarships for Researchers Covering Tuition Fees and Stipend at University of Queensland in Australia | Australia | PhD | 39 |
| 120 | Erasmus Mundus Joint Master Degree Scholarships | Multiple | Master | 39 |
| 121 | Fully Funded Master's Scholarship in Computer Science at University of London UK 2026 | United Kingdom | Master | 39 |
| 122 | Partially Funded Postgraduate Scholarships from the University of South Australia | Australia | Master | 39 |
| 123 | Fully and Partially Funded Scholarships for Bachelor Programs at TAGCUI | Jordan | Bachelor | 38 |
| 124 | Funded Scholarship for International Students at Federation University in Australia | Australia | Bachelor / Master / PhD | 38 |
| 125 | Funded Undergraduate Scholarships in all Disciplines from the University of Maine in the USA | United States | Master | 38 |
| 126 | Partially Funded MSc Scholarship in Construction and Project Management in the UK from the University of Bradford | United Kingdom | Bachelor / Master / PhD | 38 |
| 127 | Bachelor Scholarship in Electrical Engineering from Dubai Electricity and Water Authority | United Arab Emirates | Bachelor | 36 |
| 128 | Bachelor Scholarships up to $15,000 for International Students from ANU University in Australia | Australia | Bachelor | 36 |
| 129 | Bachelor Scholarships up to $7500 in Australia | Australia | Bachelor | 36 |
| 130 | Canadian Francophonie Scholarship Program Fully Funded 2027 for Master’s and PhD | Canada | Master / PhD | 36 |
| 131 | CUSEF Young Leaders Scholarship 2026 | Canada | Bachelor / Master / PhD | 36 |
| 132 | Earliest Modern Human Colonisation Research Scholarship at ANU in Australia | Australia | Bachelor / Master / PhD | 36 |
| 133 | Fully Funded Fulbright Scholarships for Masters/PhD in USA 2026 Fully Funded | United States | Master / PhD | 36 |
| 134 | Fully Funded Master's & PhD Scholarship in Germany 2027 for Africans | Germany | Master / PhD | 36 |
| 135 | Fully Funded Master's and PhD Scholarships in Germany 2026 | Germany | Master / PhD | 36 |
| 136 | Fully Funded Master's Scholarship at SBW Berlin Germany 2026 | Germany | Master | 36 |
| 137 | Fully Funded Master's Scholarship by ACU for Commonwealth Students 2026-2027 | Multiple (Commonwealth) | Master | 36 |
| 138 | Fully Funded Master's Scholarship in Belgium 2026 for International Students | Belgium | Master | 36 |
| 139 | Fully Funded Master's Scholarship in Canada 2026 at University of Guelph | Canada | Master | 36 |
| 140 | Fully Funded Master's Scholarship in Japan 2026 for Developing Countries | Japan | Master | 36 |
| 141 | Fully Funded PhD Scholarships in Spain 2026 For Different Specialties by The Spanish Government | Spain | PhD | 36 |
| 142 | Fully Funded Scholarship to Study Bachelor’s, Master’s & PhD in Azerbaijan 2027 (Including Medical Fields) | Azerbaijan | Master / PhD | 36 |
| 143 | Funded Bachelor Scholarship in Accountancy at QUT in Australia | Australia | Bachelor | 36 |
| 144 | Funded Bachelor's Scholarships in Science and Engineering from Nanyang Technological University in Singapore | Singapore | Bachelor | 36 |
| 145 | Funded Bachelor's Scholarships in Various Disciplines from Nanyang Technological University in Singapore | Singapore | Bachelor | 36 |
| 146 | Funded MBA Scholarship from Queensland University of Technology in Australia 2026 | Australia | Bachelor | 36 |
| 147 | H.H. Sheikh Hamdan Bin Zayed Scholarship for Emirati high schools Students | United Arab Emirates | Bachelor / Master / PhD | 36 |
| 148 | HAN University Bachelor Scholarships in Netherlands 2026-23 | Netherlands | Bachelor | 36 |
| 149 | International Excellence Scholarship Bachelor's Degree at Birmingham University | United Kingdom | Bachelor | 36 |
| 150 | International Scholarship for Students Entering their First University Year from University of Calgary in Canada | Canada | Bachelor / Master / PhD | 36 |
| 151 | JISPA 2026: Fully Funded Master's & PhD Scholarships in Japan | Japan | Master / PhD | 36 |
| 152 | Jordan Petroleum Refinery Company Scholarship 2026 | Jordan | Bachelor / Master / PhD | 36 |
| 153 | Koç University Scholarship 2026 in Turkey \| Fully Funded for Undergraduate, Master's, and PhD Programs | Turkey | Master / PhD | 36 |
| 154 | Online IELTS Scholarships from IELTSPodcast 2026 | Multiple | Bachelor / Master / PhD | 36 |
| 155 | Partially Funded Bachelor of Commerce Scholarships from the University of Melbourne in Australia | Australia | Bachelor | 36 |
| 156 | Partially Funded Bachelor Scholarships at Pfeiffer University | United States | Bachelor | 36 |
| 157 | Partially Funded Scholarships for all majors at the University of Melbourne in Australia | Australia | Bachelor / Master / PhD | 36 |
| 158 | Partially Funded Scholarships for International Students at Curtin University in Australia | Australia | Bachelor / Master / PhD | 36 |
| 159 | Partially Funded Scholarships in Engineering in the University of Melbourne | Australia | Bachelor / Master / PhD | 36 |
| 160 | Partially Funded Scholarships of $18,750 per year from the Australian National University | Australia | Bachelor / Master / PhD | 36 |
| 161 | Partially-Funded Scholarship for International Students at University of Tasmania in Australia | Australia | Bachelor / Master / PhD | 36 |
| 162 | Research Program Scholarships in Philosophy at ANU in Australia (Partially Funded) | Australia | Bachelor / Master / PhD | 36 |
| 163 | Scholarship in Information Technology for Tawjihi Certificate Holders from ASAC | Jordan | Bachelor / Master / PhD | 36 |
| 164 | Starter Support Scholarship at Curtin University 2026 | Australia | Bachelor / Master / PhD | 36 |
| 165 | TESIECS Scholarship 2026 in Africa \| Fully Funded for Master’s & PhD | Multiple (Africa) | Master / PhD | 36 |
| 166 | Tuition Fee Waiver Scholarships in All Specialties for International Students at the University of Melbourne in Australia | Australia | Bachelor / Master / PhD | 36 |
| 167 | William and Janet Lahey Art Education & Visual Arts Scholarship at California State University | United States | Bachelor / Master / PhD | 36 |
| 168 | Fully Funded Scholarship in Canada 2026 for Global Development | Canada | Bachelor | 35 |
| 169 | Partially Funded Science Graduate Scholarships for International Students at the University of Melbourne in Australia | Australia | Master | 35 |
| 170 | PhD Scholarships in Engineering up to $27,596 at QUT in Australia | Australia | PhD | 35 |
| 171 | Full MBA Scholarship at the Breyer State Theology University | Multiple | Bachelor | 33 |
| 172 | Latin America Scholarship at University of Essex in the UK | United Kingdom | Bachelor / Master / PhD | 33 |
| 173 | Partially Funded Bachelor of Commerce Global Scholarships for International Students at the University of Melbourne in Australia | Australia | Bachelor | 33 |
| 174 | Ara International Student Academic Scholarship 2026 | New Zealand | Bachelor / Master / PhD | 32 |
| 175 | Computer Science Undergraduate Scholarships at Birmingham University in the UK | United Kingdom | Master | 32 |
| 176 | Eastern Mediterranean University Scholarships | Cyprus | Bachelor / Master / PhD | 32 |
| 177 | International Undergraduate Scholarships at University of Melbourne in Australia | Australia | Master | 32 |
| 178 | Partially funded Bachelor's and Master's Scholarships at Swinburne University in Australia | Australia | Master | 32 |
| 179 | Partially Funded Global KU Scholarships in South Korea 2026 By Korea University | Republic of Korea | Bachelor | 32 |
| 180 | Partially Funded PhD Scholarships in Meteorology at the University of Reading in the UK | United Kingdom | PhD | 32 |
| 181 | Partially Funded Scholarship for a PhD in Australia at Curtin University | Australia | PhD | 32 |
| 182 | Partially Funded Scholarship for Undergraduates in Nanyang Technological University in Singapore | Singapore | Master | 32 |
| 183 | Partially Funded Scholarships for Undergraduates Student in ANU University in Australia | Australia | Master | 32 |
| 184 | Postgraduate Scholarships at Abu Dhabi University 2026 | United Arab Emirates | Master | 32 |
| 185 | Postgraduate Scholarships at University of Plymouth in the United Kingdom 2026 | United Kingdom | Master | 32 |
| 186 | Undergraduate & Postgraduate Engineering and Design Scholarships at QUT in Australia | Australia | Master | 32 |
| 187 | Undergraduate Excellence Scholarships at Swinburne University of Technology in Australia | Australia | Master | 32 |
| 188 | University of Debrecen 2026 Scholarship for International Students in Hungary | Hungary | Bachelor / Master / PhD | 32 |
| 189 | A & J Duct Cleaning Scholarship 2026 in the USA with Funding up to $2,000 | United States | Bachelor / Master / PhD | 30 |
| 190 | Alvernia University Undergraduate Scholarship in USA 2026-25 - Partially Funded | United States | Master | 30 |
| 191 | Computing and Engineering Research PhD Scholarship at University of Surrey in UK | United Kingdom | PhD | 30 |
| 192 | Cross-Cultural Undergraduate Scholarship in Winona State University in the US | United States | Master | 30 |
| 193 | Dynamic Soft Matter Materials PhD Scholarship in Australia from QUT | Australia | PhD | 30 |
| 194 | Federation University Australia Global Excellence Scholarship for Undergraduate and Postgraduate Students | Australia | Master | 30 |
| 195 | Fully Funded MBA Scholarship in Netherlands 2027 | Netherlands | Bachelor | 30 |
| 196 | Funded Law Master Scholarship for International Students at ANU in Australia | Australia | Master | 30 |
| 197 | Funded Scholarship for Undergraduate Students at Western Sydney in Australia | Australia | Master | 30 |
| 198 | Funded Undergraduate Excellence Scholarships in Creative Industries in Australia | Australia | Master | 30 |
| 199 | Gerda Henkel Foundation's PhD Research Scholarships | Germany | PhD | 30 |
| 200 | Global Graduate Merit Scholarship for International Students at Melbourne Business School | Australia | Master | 30 |
| 201 | Graduate Research Scholarships for International Students at the University of Melbourne in Australia | Australia | Master | 30 |
| 202 | GREAT Scholarship at the University of Kent in the UK 2026 | United Kingdom | Bachelor / Master / PhD | 30 |
| 203 | Humanities and Social Sciences Undergraduate Scholarship from Nanyang Technological University 2026 | Singapore | Master | 30 |
| 204 | Kantner Foundation Scholarship 2026 in United States to Support Students and Young Entrepreneurs | United States | Bachelor / Master / PhD | 30 |
| 205 | Leadership and Talent Management Program in Spain 2026 | Spain | Bachelor / Master / PhD | 30 |
| 206 | Master and PhD Scholarships for international students at Chulalongkorn University 2026 | Thailand | Master / PhD | 30 |
| 207 | Master Scholarships in Business for Africans at The University of Birmingham in the UK | United Kingdom | Master | 30 |
| 208 | Master Scholarships in Business for International Students at Bond University in Australia | Australia | Master | 30 |
| 209 | Master's Scholarships for Talented Disabled People at the University of Cambridge 2026 | United Kingdom | Master | 30 |
| 210 | MBA in International Tourism and Hospitality Management in Spain 2026 | Spain | Bachelor | 30 |
| 211 | Medical Sciences PhD Scholarships at ANU in Australia | Australia | PhD | 30 |
| 212 | Merit Based Graduate Scholarship for UAE graduate Students by Abu Dhabi University | United Arab Emirates | Master | 30 |
| 213 | Monash International Leadership Scholarship 2026 in Australia with Full Tuition Funding | Australia | Bachelor / Master / PhD | 30 |
| 214 | Nanyang Technological University Undergraduate Scholarship in Singapore 2026 | Singapore | Master | 30 |
| 215 | Online Postgraduate Scholarships for International Students at Abertay University | United Kingdom | Master | 30 |
| 216 | Partial Funded Scholarships for Undergraduate Students in Various Majors in Australian National University | Australia | Master | 30 |
| 217 | Partial Undergraduate Scholarships in All Study Areas at the University of Maine | United States | Master | 30 |
| 218 | Partially Funded Master Scholarships in Commerce, Economics and Management from the University of Melbourne in Australia 2026 | Australia | Master | 30 |
| 219 | Partially Funded Master’s Scholarships from the Faculty of Engineering and Information Technology at the University of Melbourne in Australia | Australia | Master | 30 |
| 220 | Partially Funded Postgraduate Scholarships at Deakin University in Australia | Australia | Master | 30 |
| 221 | Partially Funded Scholarships for Undergraduate and Graduate in Australia | Australia | Master | 30 |
| 222 | Partially Funded Undergraduate Scholarships for Emarati and GCC Students at Abu Dhabi University | United Arab Emirates | Master | 30 |
| 223 | Partially-Funded International Relations, Politics and Security Studies Undergraduate Scholarship at University of Bradford | United Kingdom | Master | 30 |
| 224 | Partially-Funded Undergraduate Scholarship from Albukhary International University in Malaysia | Malaysia | Master | 30 |
| 225 | PhD Scholarship in Biomedical Engineering and Materials at QUT in Australia | Australia | PhD | 30 |
| 226 | Phd Scholarships in Science and Information Technology up to $15,000 at QUT in Australia | Australia | PhD | 30 |
| 227 | Phd Scholarships in Science and Mathematics at Queensland University of Technology in Australia | Australia | PhD | 30 |
| 228 | Postgraduate Scholarship and Internship in Computer Science at Maharishi International University in the US | United States | Master | 30 |
| 229 | Scholarship for Athletes from Undergraduates and Graduates at Queensland University in Australia | Australia | Master | 30 |
| 230 | Scholarship For Undergraduate Students in History and Philosophy in Qeensland University in Australia | Australia | Master | 30 |
| 231 | Undergraduate & Postgraduate Engineering and Science Scholarships at QUT in Australia | Australia | Master | 30 |
| 232 | Undergraduate Scholarship in English Literature in Qeensland University in Australia | Australia | Master | 30 |
| 233 | Undergraduate Scholarship in Music to learn Piano at ANU in Australia 2026 Partially Funded | Australia | Master | 30 |
| 234 | Undergraduate Scholarships from Seattle University in the United States | United States | Master | 30 |
| 235 | Undergraduate Scholarships in Business, Science and Art at QUT | Australia | Master | 30 |
| 236 | Undergraduate Scholarships in Creative Arts, Communication and Design at Queensland University of Technology in Australia | Australia | Master | 30 |
| 237 | Undergraduate Scholarships in USA at Portland State University 2026 | United States | Master | 30 |
| 238 | Undergraduate Scholarships up to $20,000 in Business at Queensland University of Technology in Australia 2026 | Australia | Master | 30 |
| 239 | University of Bristol Think Big Scholarship 2026 in the UK (Up to £26,000 Funding) | United Kingdom | Bachelor / Master / PhD | 30 |

## Tier C — hidden from the MVP (too incomplete / expired / aggregator-only / low quality)

Threshold: score < 30. 11 scholarships. These are not deleted — the app's existing `isActive` flag (see below) can hide them.

| Rank | Scholarship | Country | Degree | Score |
|---|---|---|---|
| 240 | Partial Scholarships for Master's at Nottingham Trent University 2027, UK | United Kingdom | Master | 29 |
| 241 | Partially Funded Bachelor's and Master's Scholarships in the UK 2027 | United Kingdom | Master | 29 |
| 242 | Fully Funded Master's Scholarship in Business Administration in Spain 2026 | Spain | Master | 24 |
| 243 | Fully Funded Scholarship for Bachelor’s, Master’s, and Doctoral Studies in Italy – 2026 | Italy | Master / PhD | 24 |
| 244 | Glenmore Medical Scholarship 2026 in the UK \| Funding for Health Master’s Studies at The University of Edinburgh | United States | Master | 24 |
| 245 | Master’s Scholarship in German Language in Jordan 2026 | Jordan | Master | 24 |
| 246 | NYC Mayor's Undergraduate Scholarship 2026: Work and Study Opportunity | United States | Master | 24 |
| 247 | Opportunity to Study a Master’s in Human Resource Management and Strategic Change 2026 in Spain | Spain | Master | 24 |
| 248 | Partially Funded Scholarship for Master’s and PhD Studies in Russia 2026 | Russia | Master / PhD | 24 |
| 249 | SOAS Master's Scholarships (International) 2026 | United Kingdom | Master | 24 |
| 250 | Universidad Carlos III de Madrid Scholarship 2026 for Master’s Studies \| Financial Support to Study in Spain | Spain | Master | 24 |

## Statistics

Total scholarships audited: **250**
Top 50: **50** (official MVP catalog: `SCHOLARSHIP_MVP_CATALOG.md`)
Tier B (worth keeping): **189**
Tier C (hide from MVP): **11**

Of the **Top 50**:

| Measure | Count |
|---|---|
| Bachelor's-eligible (recent high-school graduates) | 29 |
| Fully funded | 40 |
| Tuition + stipend | 7 |
| Government / official source (MANUAL) | 35 |
| Official application / source URL | 38 |
| Accepting international students (All / listed) | 48 |
| Clearly eligible for Egyptians / MENA | 30 |
| Confirmed 2026/27 deadline | 16 |
| Complete structured eligibility (country + education + field) | 49 |

## Hiding mechanism

The application already has a safe active/inactive mechanism:

- Schema: `Scholarship.isActive` (default `true`), plus `inactiveReason` and `deadlineType`.
- Every student-facing query goes through `src/lib/scholarship-filters.ts`
  (`visibleScholarshipWhere` / `withVisibility`), which requires
  `isActive: true`. This is used by `/api/scholarships` (list/search) and
  `/api/scholarships/match` (matching).
- Setting `isActive: false` (optionally with `inactiveReason: "MVP_TIER_C"`)
  would hide a Tier C record from the MVP catalogue without deleting it.

Recommendation: this mechanism can be used safely to hide Tier C records when
the product decision is made. It is NOT applied here — the ranking is a report
only, and the Top 50 has not been made the MVP-visible catalog yet.

## Data notes

- 250 scholarships audited (Task 2H applied — all 250 in the database). Source values seen: MANUAL (curated) and SCRAPED (for9a.com aggregator).
- All records carry `deadlineType = "UNKNOWN"`, so deadline scoring does not rely on it.
- 16 of the Top 50 have a confirmed future 2026/27 deadline.
- Data-quality flag: one record ("Onsi Sawiris Scholarship 2026 for Egyptian Students Fully Funded Bachelor's in USA", rank 110) has a corrupted country value ("United States; United States; United States; United States") — flagged for cleanup, not scored differently.
- Tier C is the 11 lowest-scoring records (score < 30): incomplete, expired or aggregator-only listings. They remain in the database.
