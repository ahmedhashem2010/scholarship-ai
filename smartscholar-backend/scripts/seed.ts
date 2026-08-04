import { getPrisma, closePrisma, loadEnv, requireEnv, slugify, parseArgs, flagBoolean, flagNumber, today, fmt } from './lib';

type CountrySeed = [code: string, code3: string, name: string, nameAr: string, phone: string, continent: string, currency: string | null];
type CurrencySeed = [code: string, name: string, nameAr: string, symbol: string];
type LanguageSeed = [code: string, name: string, nameAr: string, nativeName: string];
type DegreeSeed = [name: string, nameAr: string, sort: number];
type FieldSeed = [slug: string, name: string, nameAr: string, parentSlug: string | null];

const CONTINENTS: Array<[string, string, string]> = [
  ['AF', 'Africa', 'أفريقيا'],
  ['AS', 'Asia', 'آسيا'],
  ['EU', 'Europe', 'أوروبا'],
  ['NA', 'North America', 'أمريكا الشمالية'],
  ['OC', 'Oceania', 'أوقيانوسيا'],
  ['SA', 'South America', 'أمريكا الجنوبية'],
];

const CURRENCIES: CurrencySeed[] = [
  ['USD', 'US Dollar', 'دولار أمريكي', '$'],
  ['EUR', 'Euro', 'يورو', '€'],
  ['GBP', 'British Pound', 'جنيه إسترليني', '£'],
  ['EGP', 'Egyptian Pound', 'جنيه مصري', 'E£'],
  ['AED', 'UAE Dirham', 'درهم إماراتي', 'د.إ'],
  ['SAR', 'Saudi Riyal', 'ريال سعودي', 'ر.س'],
  ['KWD', 'Kuwaiti Dinar', 'دينار كويتي', 'د.ك'],
  ['QAR', 'Qatari Riyal', 'ريال قطري', 'ر.ق'],
  ['BHD', 'Bahraini Dinar', 'دينار بحريني', 'د.ب'],
  ['OMR', 'Omani Rial', 'ريال عماني', 'ر.ع'],
  ['JOD', 'Jordanian Dinar', 'دينار أردني', 'د.أ'],
  ['MAD', 'Moroccan Dirham', 'درهم مغربي', 'د.م'],
  ['TND', 'Tunisian Dinar', 'دينار تونسي', 'د.ت'],
  ['DZD', 'Algerian Dinar', 'دينار جزائري', 'د.ج'],
  ['LYD', 'Libyan Dinar', 'دينار ليبي', 'ل.د'],
  ['IQD', 'Iraqi Dinar', 'دينار عراقي', 'د.ع'],
  ['SYP', 'Syrian Pound', 'ليرة سورية', 'ل.س'],
  ['LBP', 'Lebanese Pound', 'ليرة لبنانية', 'ل.ل'],
  ['YER', 'Yemeni Rial', 'ريال يمني', 'ر.ي'],
  ['TRY', 'Turkish Lira', 'ليرة تركية', '₺'],
  ['CNY', 'Chinese Yuan', 'يوان صيني', '¥'],
  ['JPY', 'Japanese Yen', 'ين ياباني', '¥'],
  ['INR', 'Indian Rupee', 'روبية هندية', '₹'],
  ['PKR', 'Pakistani Rupee', 'روبية باكستانية', '₨'],
  ['AUD', 'Australian Dollar', 'دولار أسترالي', 'A$'],
  ['CAD', 'Canadian Dollar', 'دولار كندي', 'C$'],
  ['CHF', 'Swiss Franc', 'فرنك سويسري', '₣'],
  ['NOK', 'Norwegian Krone', 'كرونة نرويجية', 'kr'],
  ['SEK', 'Swedish Krona', 'كرونة سويدية', 'kr'],
  ['DKK', 'Danish Krone', 'كرونة دنماركية', 'kr'],
  ['RUB', 'Russian Ruble', 'روبل روسي', '₽'],
  ['ZAR', 'South African Rand', 'راند جنوب أفريقي', 'R'],
  ['BRL', 'Brazilian Real', 'ريال برازيلي', 'R$'],
  ['MXN', 'Mexican Peso', 'بيزو مكسيكي', '$'],
  ['KRW', 'South Korean Won', 'وون كوري', '₩'],
  ['SGD', 'Singapore Dollar', 'دولار سنغافوري', 'S$'],
  ['MYR', 'Malaysian Ringgit', 'رينغيت ماليزي', 'RM'],
  ['NZD', 'New Zealand Dollar', 'دولار نيوزيلندي', 'NZ$'],
  ['HKD', 'Hong Kong Dollar', 'دولار هونغ كونغ', 'HK$'],
  ['PLN', 'Polish Zloty', 'زلوتي بولندي', 'zł'],
  ['CZK', 'Czech Koruna', 'كرونة تشيكية', 'Kč'],
  ['HUF', 'Hungarian Forint', 'فورنت هنغاري', 'Ft'],
  ['RON', 'Romanian Leu', 'ليو روماني', 'lei'],
  ['UAH', 'Ukrainian Hryvnia', 'هريفنيا أوكرانية', '₴'],
  ['ILS', 'Israeli Shekel', 'شيكل إسرائيلي', '₪'],
];

const LANGUAGES: LanguageSeed[] = [
  ['ar', 'Arabic', 'العربية', 'العربية'],
  ['en', 'English', 'الإنجليزية', 'English'],
  ['fr', 'French', 'الفرنسية', 'Français'],
  ['de', 'German', 'الألمانية', 'Deutsch'],
  ['es', 'Spanish', 'الإسبانية', 'Español'],
  ['pt', 'Portuguese', 'البرتغالية', 'Português'],
  ['it', 'Italian', 'الإيطالية', 'Italiano'],
  ['ru', 'Russian', 'الروسية', 'Русский'],
  ['zh', 'Chinese', 'الصينية', '中文'],
  ['ja', 'Japanese', 'اليابانية', '日本語'],
  ['ko', 'Korean', 'الكورية', '한국어'],
  ['tr', 'Turkish', 'التركية', 'Türkçe'],
  ['ur', 'Urdu', 'الأردية', 'اردو'],
  ['hi', 'Hindi', 'الهندية', 'हिन्दी'],
  ['nl', 'Dutch', 'الهولندية', 'Nederlands'],
  ['sv', 'Swedish', 'السويدية', 'Svenska'],
  ['no', 'Norwegian', 'النرويجية', 'Norsk'],
  ['da', 'Danish', 'الدانماركية', 'Dansk'],
  ['fi', 'Finnish', 'الفنلندية', 'Suomi'],
  ['pl', 'Polish', 'البولندية', 'Polski'],
  ['el', 'Greek', 'اليونانية', 'Ελληνικά'],
  ['he', 'Hebrew', 'العبرية', 'עברית'],
  ['fa', 'Persian', 'الفارسية', 'فارسی'],
  ['ms', 'Malay', 'الماليزية', 'Bahasa Melayu'],
  ['id', 'Indonesian', 'الإندونيسية', 'Bahasa Indonesia'],
  ['th', 'Thai', 'التايلاندية', 'ไทย'],
  ['vi', 'Vietnamese', 'الفيتنامية', 'Tiếng Việt'],
  ['sw', 'Swahili', 'السواحلية', 'Kiswahili'],
  ['cs', 'Czech', 'التشيكية', 'Čeština'],
  ['uk', 'Ukrainian', 'الأوكرانية', 'Українська'],
];

const DEGREES: DegreeSeed[] = [
  ['Secondary School', 'تعليم ثانوي', 10],
  ['High School', 'الثانوية العامة', 20],
  ['Diploma', 'دبلوم', 30],
  ['Associate Degree', 'درجة الزمالة', 40],
  ["Bachelor's Degree", 'درجة البكالوريوس', 50],
  ["Master's Degree", 'درجة الماجستير', 60],
  ['Doctorate (PhD)', 'درجة الدكتوراه', 70],
  ['Certificate', 'شهادة', 80],
  ['Short Course', 'دورة قصيرة', 90],
  ['Exchange Program', 'برنامج تبادل', 100],
  ['Language Course', 'دورة لغة', 110],
  ['Research', 'بحث', 120],
  ['Summer School', 'مدرسة صيفية', 130],
  ['Other', 'أخرى', 990],
];

const FIELDS: FieldSeed[] = [
  ['computer-science', 'Computer Science', 'علوم الحاسوب', null],
  ['software-engineering', 'Software Engineering', 'هندسة البرمجيات', 'computer-science'],
  ['data-science', 'Data Science', 'علم البيانات', 'computer-science'],
  ['artificial-intelligence', 'Artificial Intelligence', 'الذكاء الاصطناعي', 'computer-science'],
  ['information-technology', 'Information Technology', 'تكنولوجيا المعلومات', 'computer-science'],
  ['cybersecurity', 'Cybersecurity', 'الأمن السيبراني', 'computer-science'],
  ['engineering', 'Engineering', 'الهندسة', null],
  ['mechanical-engineering', 'Mechanical Engineering', 'الهندسة الميكانيكية', 'engineering'],
  ['electrical-engineering', 'Electrical Engineering', 'الهندسة الكهربائية', 'engineering'],
  ['civil-engineering', 'Civil Engineering', 'الهندسة المدنية', 'engineering'],
  ['business-administration', 'Business Administration', 'إدارة الأعمال', null],
  ['economics', 'Economics', 'الاقتصاد', null],
  ['finance', 'Finance', 'التمويل', null],
  ['accounting', 'Accounting', 'المحاسبة', null],
  ['medicine', 'Medicine', 'الطب', null],
  ['pharmacy', 'Pharmacy', 'الصيدلة', null],
  ['dentistry', 'Dentistry', 'طب الأسنان', null],
  ['nursing', 'Nursing', 'التمريض', null],
  ['law', 'Law', 'القانون', null],
  ['architecture', 'Architecture', 'الهندسة المعمارية', null],
  ['education', 'Education', 'التربية', null],
  ['psychology', 'Psychology', 'علم النفس', null],
  ['international-relations', 'International Relations', 'العلاقات الدولية', null],
  ['media-communications', 'Media & Communications', 'الإعلام والاتصال', null],
  ['arts-design', 'Arts & Design', 'الفنون والتصميم', null],
  ['mathematics', 'Mathematics', 'الرياضيات', null],
  ['physics', 'Physics', 'الفيزياء', null],
  ['chemistry', 'Chemistry', 'الكيمياء', null],
  ['biology', 'Biology', 'علم الأحياء', null],
  ['environmental-science', 'Environmental Science', 'العلوم البيئية', null],
  ['agriculture', 'Agriculture', 'الزراعة', null],
  ['public-health', 'Public Health', 'الصحة العامة', null],
  ['linguistics', 'Linguistics', 'اللغويات', null],
];

const COUNTRIES: CountrySeed[] = [
  ['AF', 'AFG', 'Afghanistan', 'أفغانستان', '+93', 'AS', 'AFN'],
  ['AL', 'ALB', 'Albania', 'ألبانيا', '+355', 'EU', 'ALL'],
  ['DZ', 'DZA', 'Algeria', 'الجزائر', '+213', 'AF', 'DZD'],
  ['AD', 'AND', 'Andorra', 'أندورا', '+376', 'EU', 'EUR'],
  ['AO', 'AGO', 'Angola', 'أنغولا', '+244', 'AF', 'AOA'],
  ['AG', 'ATG', 'Antigua and Barbuda', 'أنتيغوا وباربودا', '+1268', 'NA', 'XCD'],
  ['AR', 'ARG', 'Argentina', 'الأرجنتين', '+54', 'SA', 'ARS'],
  ['AM', 'ARM', 'Armenia', 'أرمينيا', '+374', 'AS', 'AMD'],
  ['AU', 'AUS', 'Australia', 'أستراليا', '+61', 'OC', 'AUD'],
  ['AT', 'AUT', 'Austria', 'النمسا', '+43', 'EU', 'EUR'],
  ['AZ', 'AZE', 'Azerbaijan', 'أذربيجان', '+994', 'AS', 'AZN'],
  ['BS', 'BHS', 'Bahamas', 'باهاماس', '+1242', 'NA', 'BSD'],
  ['BH', 'BHR', 'Bahrain', 'البحرين', '+973', 'AS', 'BHD'],
  ['BD', 'BGD', 'Bangladesh', 'بنغلاديش', '+880', 'AS', 'BDT'],
  ['BB', 'BRB', 'Barbados', 'باربادوس', '+1246', 'NA', 'BBD'],
  ['BY', 'BLR', 'Belarus', 'بيلاروسيا', '+375', 'EU', 'BYN'],
  ['BE', 'BEL', 'Belgium', 'بلجيكا', '+32', 'EU', 'EUR'],
  ['BZ', 'BLZ', 'Belize', 'بليز', '+501', 'NA', 'BZD'],
  ['BJ', 'BEN', 'Benin', 'بنين', '+229', 'AF', 'XOF'],
  ['BT', 'BTN', 'Bhutan', 'بوتان', '+975', 'AS', 'BTN'],
  ['BO', 'BOL', 'Bolivia', 'بوليفيا', '+591', 'SA', 'BOB'],
  ['BA', 'BIH', 'Bosnia and Herzegovina', 'البوسنة والهرسك', '+387', 'EU', 'BAM'],
  ['BW', 'BWA', 'Botswana', 'بوتسوانا', '+267', 'AF', 'BWP'],
  ['BR', 'BRA', 'Brazil', 'البرازيل', '+55', 'SA', 'BRL'],
  ['BN', 'BRN', 'Brunei', 'بروناي', '+673', 'AS', 'BND'],
  ['BG', 'BGR', 'Bulgaria', 'بلغاريا', '+359', 'EU', 'BGN'],
  ['BF', 'BFA', 'Burkina Faso', 'بوركينا فاسو', '+226', 'AF', 'XOF'],
  ['BI', 'BDI', 'Burundi', 'بوروندي', '+257', 'AF', 'BIF'],
  ['KH', 'KHM', 'Cambodia', 'كمبوديا', '+855', 'AS', 'KHR'],
  ['CM', 'CMR', 'Cameroon', 'الكاميرون', '+237', 'AF', 'XAF'],
  ['CA', 'CAN', 'Canada', 'كندا', '+1', 'NA', 'CAD'],
  ['CV', 'CPV', 'Cape Verde', 'الرأس الأخضر', '+238', 'AF', 'CVE'],
  ['CF', 'CAF', 'Central African Republic', 'جمهورية أفريقيا الوسطى', '+236', 'AF', 'XAF'],
  ['TD', 'TCD', 'Chad', 'تشاد', '+235', 'AF', 'XAF'],
  ['CL', 'CHL', 'Chile', 'تشيلي', '+56', 'SA', 'CLP'],
  ['CN', 'CHN', 'China', 'الصين', '+86', 'AS', 'CNY'],
  ['CO', 'COL', 'Colombia', 'كولومبيا', '+57', 'SA', 'COP'],
  ['KM', 'COM', 'Comoros', 'جزر القمر', '+269', 'AF', 'KMF'],
  ['CG', 'COG', 'Congo', 'جمهورية الكونغو', '+242', 'AF', 'XAF'],
  ['CD', 'COD', 'DR Congo', 'الكونغو الديمقراطية', '+243', 'AF', 'CDF'],
  ['CR', 'CRI', 'Costa Rica', 'كوستاريكا', '+506', 'NA', 'CRC'],
  ['CI', 'CIV', "Côte d'Ivoire", 'ساحل العاج', '+225', 'AF', 'XOF'],
  ['HR', 'HRV', 'Croatia', 'كرواتيا', '+385', 'EU', 'HRK'],
  ['CU', 'CUB', 'Cuba', 'كوبا', '+53', 'NA', 'CUP'],
  ['CY', 'CYP', 'Cyprus', 'قبرص', '+357', 'EU', 'EUR'],
  ['CZ', 'CZE', 'Czechia', 'التشيك', '+420', 'EU', 'CZK'],
  ['DK', 'DNK', 'Denmark', 'الدنمارك', '+45', 'EU', 'DKK'],
  ['DJ', 'DJI', 'Djibouti', 'جيبوتي', '+253', 'AF', 'DJF'],
  ['DM', 'DMA', 'Dominica', 'دومينيكا', '+1767', 'NA', 'XCD'],
  ['DO', 'DOM', 'Dominican Republic', 'جمهورية الدومينيكان', '+1809', 'NA', 'DOP'],
  ['EC', 'ECU', 'Ecuador', 'الإكوادور', '+593', 'SA', 'USD'],
  ['EG', 'EGY', 'Egypt', 'مصر', '+20', 'AF', 'EGP'],
  ['SV', 'SLV', 'El Salvador', 'السلفادور', '+503', 'NA', 'USD'],
  ['GQ', 'GNQ', 'Equatorial Guinea', 'غينيا الاستوائية', '+240', 'AF', 'XAF'],
  ['ER', 'ERI', 'Eritrea', 'إريتريا', '+291', 'AF', 'ERN'],
  ['EE', 'EST', 'Estonia', 'إستونيا', '+372', 'EU', 'EUR'],
  ['SZ', 'SWZ', 'Eswatini', 'إسواتيني', '+268', 'AF', 'SZL'],
  ['ET', 'ETH', 'Ethiopia', 'إثيوبيا', '+251', 'AF', 'ETB'],
  ['FJ', 'FJI', 'Fiji', 'فيجي', '+679', 'OC', 'FJD'],
  ['FI', 'FIN', 'Finland', 'فنلندا', '+358', 'EU', 'EUR'],
  ['FR', 'FRA', 'France', 'فرنسا', '+33', 'EU', 'EUR'],
  ['GA', 'GAB', 'Gabon', 'الغابون', '+241', 'AF', 'XAF'],
  ['GM', 'GMB', 'Gambia', 'غامبيا', '+220', 'AF', 'GMD'],
  ['GE', 'GEO', 'Georgia', 'جورجيا', '+995', 'AS', 'GEL'],
  ['DE', 'DEU', 'Germany', 'ألمانيا', '+49', 'EU', 'EUR'],
  ['GH', 'GHA', 'Ghana', 'غانا', '+233', 'AF', 'GHS'],
  ['GR', 'GRC', 'Greece', 'اليونان', '+30', 'EU', 'EUR'],
  ['GD', 'GRD', 'Grenada', 'غرينادا', '+1473', 'NA', 'XCD'],
  ['GT', 'GTM', 'Guatemala', 'غواتيمالا', '+502', 'NA', 'GTQ'],
  ['GN', 'GIN', 'Guinea', 'غينيا', '+224', 'AF', 'GNF'],
  ['GW', 'GNB', 'Guinea-Bissau', 'غينيا بيساو', '+245', 'AF', 'XOF'],
  ['GY', 'GUY', 'Guyana', 'غيانا', '+592', 'SA', 'GYD'],
  ['HT', 'HTI', 'Haiti', 'هايتي', '+509', 'NA', 'HTG'],
  ['HN', 'HND', 'Honduras', 'هندوراس', '+504', 'NA', 'HNL'],
  ['HU', 'HUN', 'Hungary', 'المجر', '+36', 'EU', 'HUF'],
  ['IS', 'ISL', 'Iceland', 'آيسلندا', '+354', 'EU', 'ISK'],
  ['IN', 'IND', 'India', 'الهند', '+91', 'AS', 'INR'],
  ['ID', 'IDN', 'Indonesia', 'إندونيسيا', '+62', 'AS', 'IDR'],
  ['IR', 'IRN', 'Iran', 'إيران', '+98', 'AS', 'IRR'],
  ['IQ', 'IRQ', 'Iraq', 'العراق', '+964', 'AS', 'IQD'],
  ['IE', 'IRL', 'Ireland', 'أيرلندا', '+353', 'EU', 'EUR'],
  ['IL', 'ISR', 'Israel', 'إسرائيل', '+972', 'AS', 'ILS'],
  ['IT', 'ITA', 'Italy', 'إيطاليا', '+39', 'EU', 'EUR'],
  ['JM', 'JAM', 'Jamaica', 'جامايكا', '+1876', 'NA', 'JMD'],
  ['JP', 'JPN', 'Japan', 'اليابان', '+81', 'AS', 'JPY'],
  ['JO', 'JOR', 'Jordan', 'الأردن', '+962', 'AS', 'JOD'],
  ['KZ', 'KAZ', 'Kazakhstan', 'كازاخستان', '+7', 'AS', 'KZT'],
  ['KE', 'KEN', 'Kenya', 'كينيا', '+254', 'AF', 'KES'],
  ['KI', 'KIR', 'Kiribati', 'كيريباتي', '+686', 'OC', 'AUD'],
  ['KP', 'PRK', 'North Korea', 'كوريا الشمالية', '+850', 'AS', 'KPW'],
  ['KR', 'KOR', 'South Korea', 'كوريا الجنوبية', '+82', 'AS', 'KRW'],
  ['KW', 'KWT', 'Kuwait', 'الكويت', '+965', 'AS', 'KWD'],
  ['KG', 'KGZ', 'Kyrgyzstan', 'قيرغيزستان', '+996', 'AS', 'KGS'],
  ['LA', 'LAO', 'Laos', 'لاوس', '+856', 'AS', 'LAK'],
  ['LV', 'LVA', 'Latvia', 'لاتفيا', '+371', 'EU', 'EUR'],
  ['LB', 'LBN', 'Lebanon', 'لبنان', '+961', 'AS', 'LBP'],
  ['LS', 'LSO', 'Lesotho', 'ليسوتو', '+266', 'AF', 'LSL'],
  ['LR', 'LBR', 'Liberia', 'ليبيريا', '+231', 'AF', 'LRD'],
  ['LY', 'LBY', 'Libya', 'ليبيا', '+218', 'AF', 'LYD'],
  ['LI', 'LIE', 'Liechtenstein', 'ليختنشتاين', '+423', 'EU', 'CHF'],
  ['LT', 'LTU', 'Lithuania', 'ليتوانيا', '+370', 'EU', 'EUR'],
  ['LU', 'LUX', 'Luxembourg', 'لوكسمبورغ', '+352', 'EU', 'EUR'],
  ['MG', 'MDG', 'Madagascar', 'مدغشقر', '+261', 'AF', 'MGA'],
  ['MW', 'MWI', 'Malawi', 'ملاوي', '+265', 'AF', 'MWK'],
  ['MY', 'MYS', 'Malaysia', 'ماليزيا', '+60', 'AS', 'MYR'],
  ['MV', 'MDV', 'Maldives', 'المالديف', '+960', 'AS', 'MVR'],
  ['ML', 'MLI', 'Mali', 'مالي', '+223', 'AF', 'XOF'],
  ['MT', 'MLT', 'Malta', 'مالطا', '+356', 'EU', 'EUR'],
  ['MH', 'MHL', 'Marshall Islands', 'جزر مارشال', '+692', 'OC', 'USD'],
  ['MR', 'MRT', 'Mauritania', 'موريتانيا', '+222', 'AF', 'MRU'],
  ['MU', 'MUS', 'Mauritius', 'موريشيوس', '+230', 'AF', 'MUR'],
  ['MX', 'MEX', 'Mexico', 'المكسيك', '+52', 'NA', 'MXN'],
  ['FM', 'FSM', 'Micronesia', 'ميكرونيزيا', '+691', 'OC', 'USD'],
  ['MD', 'MDA', 'Moldova', 'مولدوفا', '+373', 'EU', 'MDL'],
  ['MC', 'MCO', 'Monaco', 'موناكو', '+377', 'EU', 'EUR'],
  ['MN', 'MNG', 'Mongolia', 'منغوليا', '+976', 'AS', 'MNT'],
  ['ME', 'MNE', 'Montenegro', 'الجبل الأسود', '+382', 'EU', 'EUR'],
  ['MA', 'MAR', 'Morocco', 'المغرب', '+212', 'AF', 'MAD'],
  ['MZ', 'MOZ', 'Mozambique', 'موزمبيق', '+258', 'AF', 'MZN'],
  ['MM', 'MMR', 'Myanmar', 'ميانمار', '+95', 'AS', 'MMK'],
  ['NA', 'NAM', 'Namibia', 'ناميبيا', '+264', 'AF', 'NAD'],
  ['NR', 'NRU', 'Nauru', 'ناورو', '+674', 'OC', 'AUD'],
  ['NP', 'NPL', 'Nepal', 'نيبال', '+977', 'AS', 'NPR'],
  ['NL', 'NLD', 'Netherlands', 'هولندا', '+31', 'EU', 'EUR'],
  ['NZ', 'NZL', 'New Zealand', 'نيوزيلندا', '+64', 'OC', 'NZD'],
  ['NI', 'NIC', 'Nicaragua', 'نيكاراغوا', '+505', 'NA', 'NIO'],
  ['NE', 'NER', 'Niger', 'النيجر', '+227', 'AF', 'XOF'],
  ['NG', 'NGA', 'Nigeria', 'نيجيريا', '+234', 'AF', 'NGN'],
  ['MK', 'MKD', 'North Macedonia', 'مقدونيا الشمالية', '+389', 'EU', 'MKD'],
  ['NO', 'NOR', 'Norway', 'النرويج', '+47', 'EU', 'NOK'],
  ['OM', 'OMN', 'Oman', 'عُمان', '+968', 'AS', 'OMR'],
  ['PK', 'PAK', 'Pakistan', 'باكستان', '+92', 'AS', 'PKR'],
  ['PW', 'PLW', 'Palau', 'بالاو', '+680', 'OC', 'USD'],
  ['PA', 'PAN', 'Panama', 'بنما', '+507', 'NA', 'PAB'],
  ['PG', 'PNG', 'Papua New Guinea', 'بابوا غينيا الجديدة', '+675', 'OC', 'PGK'],
  ['PY', 'PRY', 'Paraguay', 'باراغواي', '+595', 'SA', 'PYG'],
  ['PE', 'PER', 'Peru', 'بيرو', '+51', 'SA', 'PEN'],
  ['PH', 'PHL', 'Philippines', 'الفلبين', '+63', 'AS', 'PHP'],
  ['PL', 'POL', 'Poland', 'بولندا', '+48', 'EU', 'PLN'],
  ['PT', 'PRT', 'Portugal', 'البرتغال', '+351', 'EU', 'EUR'],
  ['QA', 'QAT', 'Qatar', 'قطر', '+974', 'AS', 'QAR'],
  ['RO', 'ROU', 'Romania', 'رومانيا', '+40', 'EU', 'RON'],
  ['RU', 'RUS', 'Russia', 'روسيا', '+7', 'EU', 'RUB'],
  ['RW', 'RWA', 'Rwanda', 'رواندا', '+250', 'AF', 'RWF'],
  ['KN', 'KNA', 'Saint Kitts and Nevis', 'سانت كيتس ونيفيس', '+1869', 'NA', 'XCD'],
  ['LC', 'LCA', 'Saint Lucia', 'سانت لوسيا', '+1758', 'NA', 'XCD'],
  ['VC', 'VCT', 'Saint Vincent and the Grenadines', 'سانت فنسنت وجزر غرينادين', '+1784', 'NA', 'XCD'],
  ['WS', 'WSM', 'Samoa', 'ساموا', '+685', 'OC', 'WST'],
  ['SM', 'SMR', 'San Marino', 'سان مارينو', '+378', 'EU', 'EUR'],
  ['ST', 'STP', 'São Tomé and Príncipe', 'ساو تومي وبرينسيبي', '+239', 'AF', 'STN'],
  ['SA', 'SAU', 'Saudi Arabia', 'السعودية', '+966', 'AS', 'SAR'],
  ['SN', 'SEN', 'Senegal', 'السنغال', '+221', 'AF', 'XOF'],
  ['RS', 'SRB', 'Serbia', 'صربيا', '+381', 'EU', 'RSD'],
  ['SC', 'SYC', 'Seychelles', 'سيشل', '+248', 'AF', 'SCR'],
  ['SL', 'SLE', 'Sierra Leone', 'سيراليون', '+232', 'AF', 'SLL'],
  ['SG', 'SGP', 'Singapore', 'سنغافورة', '+65', 'AS', 'SGD'],
  ['SK', 'SVK', 'Slovakia', 'سلوفاكيا', '+421', 'EU', 'EUR'],
  ['SI', 'SVN', 'Slovenia', 'سلوفينيا', '+386', 'EU', 'EUR'],
  ['SB', 'SLB', 'Solomon Islands', 'جزر سليمان', '+677', 'OC', 'SBD'],
  ['SO', 'SOM', 'Somalia', 'الصومال', '+252', 'AF', 'SOS'],
  ['ZA', 'ZAF', 'South Africa', 'جنوب أفريقيا', '+27', 'AF', 'ZAR'],
  ['SS', 'SSD', 'South Sudan', 'جنوب السودان', '+211', 'AF', 'SSP'],
  ['ES', 'ESP', 'Spain', 'إسبانيا', '+34', 'EU', 'EUR'],
  ['LK', 'LKA', 'Sri Lanka', 'سريلانكا', '+94', 'AS', 'LKR'],
  ['SD', 'SDN', 'Sudan', 'السودان', '+249', 'AF', 'SDG'],
  ['SR', 'SUR', 'Suriname', 'سورينام', '+597', 'SA', 'SRD'],
  ['SE', 'SWE', 'Sweden', 'السويد', '+46', 'EU', 'SEK'],
  ['CH', 'CHE', 'Switzerland', 'سويسرا', '+41', 'EU', 'CHF'],
  ['SY', 'SYR', 'Syria', 'سوريا', '+963', 'AS', 'SYP'],
  ['TW', 'TWN', 'Taiwan', 'تايوان', '+886', 'AS', 'TWD'],
  ['TJ', 'TJK', 'Tajikistan', 'طاجيكستان', '+992', 'AS', 'TJS'],
  ['TZ', 'TZA', 'Tanzania', 'تنزانيا', '+255', 'AF', 'TZS'],
  ['TH', 'THA', 'Thailand', 'تايلاند', '+66', 'AS', 'THB'],
  ['TL', 'TLS', 'Timor-Leste', 'تيمور الشرقية', '+670', 'AS', 'USD'],
  ['TG', 'TGO', 'Togo', 'توغو', '+228', 'AF', 'XOF'],
  ['TO', 'TON', 'Tonga', 'تونغا', '+676', 'OC', 'TOP'],
  ['TT', 'TTO', 'Trinidad and Tobago', 'ترينيداد وتوباغو', '+1868', 'NA', 'TTD'],
  ['TN', 'TUN', 'Tunisia', 'تونس', '+216', 'AF', 'TND'],
  ['TR', 'TUR', 'Turkey', 'تركيا', '+90', 'AS', 'TRY'],
  ['TM', 'TKM', 'Turkmenistan', 'تركمانستان', '+993', 'AS', 'TMT'],
  ['TV', 'TUV', 'Tuvalu', 'توفالو', '+688', 'OC', 'AUD'],
  ['UG', 'UGA', 'Uganda', 'أوغندا', '+256', 'AF', 'UGX'],
  ['UA', 'UKR', 'Ukraine', 'أوكرانيا', '+380', 'EU', 'UAH'],
  ['AE', 'ARE', 'United Arab Emirates', 'الإمارات العربية المتحدة', '+971', 'AS', 'AED'],
  ['GB', 'GBR', 'United Kingdom', 'المملكة المتحدة', '+44', 'EU', 'GBP'],
  ['US', 'USA', 'United States', 'الولايات المتحدة الأمريكية', '+1', 'NA', 'USD'],
  ['UY', 'URY', 'Uruguay', 'أوروغواي', '+598', 'SA', 'UYU'],
  ['UZ', 'UZB', 'Uzbekistan', 'أوزبكستان', '+998', 'AS', 'UZS'],
  ['VU', 'VUT', 'Vanuatu', 'فانواتو', '+678', 'OC', 'VUV'],
  ['VA', 'VAT', 'Vatican City', 'الفاتيكان', '+39', 'EU', 'EUR'],
  ['VE', 'VEN', 'Venezuela', 'فنزويلا', '+58', 'SA', 'VES'],
  ['VN', 'VNM', 'Vietnam', 'فيتنام', '+84', 'AS', 'VND'],
  ['YE', 'YEM', 'Yemen', 'اليمن', '+967', 'AS', 'YER'],
  ['ZM', 'ZMB', 'Zambia', 'زامبيا', '+260', 'AF', 'ZMW'],
  ['ZW', 'ZWE', 'Zimbabwe', 'زيمبابوي', '+263', 'AF', 'ZWL'],
];

interface ScholarshipSeed {
  slug: string;
  title: string;
  titleAr: string;
  description: string;
  provider: string;
  providerType: string;
  country: string;
  degree: string;
  fundingType: string;
  closingInDays: number;
  officialWebsite: string;
  isFeatured: boolean;
}

const SCHOLARSHIPS: ScholarshipSeed[] = [
  {
    slug: 'daad-development-related-postgraduate-courses',
    title: 'DAAD Development-Related Postgraduate Courses',
    titleAr: 'منح دااد للدراسات العليا المرتبطة بالتنمية',
    description:
      'Fully funded postgraduate scholarships for students from developing countries, including all Arab League states, to study at German universities. Covers tuition, monthly stipend, health insurance and travel.',
    provider: 'DAAD',
    providerType: 'GOVERNMENT',
    country: 'DE',
    degree: 'master',
    fundingType: 'FULLY_FUNDED',
    closingInDays: 60,
    officialWebsite: 'https://www.daad.de',
    isFeatured: true,
  },
  {
    slug: 'chevening-scholarships',
    title: 'Chevening Scholarships',
    titleAr: 'منح تشيفنينغ',
    description:
      'The UK Government\u2019s global scholarship programme, funding one-year master\u2019s degrees at any UK university. Open to citizens of Chevening-eligible countries including Egypt, Jordan, Lebanon and Morocco.',
    provider: 'UK Foreign, Commonwealth & Development Office',
    providerType: 'GOVERNMENT',
    country: 'GB',
    degree: 'master',
    fundingType: 'FULLY_FUNDED',
    closingInDays: 45,
    officialWebsite: 'https://www.chevening.org',
    isFeatured: true,
  },
  {
    slug: 'fulbright-foreign-student-program',
    title: 'Fulbright Foreign Student Program',
    titleAr: 'برنامج فولبرايت للطلاب الدوليين',
    description:
      'Grants for graduate study in the United States, covering tuition, living costs, health insurance and airfare. Administered by binational Fulbright Commissions, including in Egypt, Jordan, Iraq and the Gulf.',
    provider: 'US Department of State / Bureau of Educational and Cultural Affairs',
    providerType: 'GOVERNMENT',
    country: 'US',
    degree: 'master',
    fundingType: 'FULLY_FUNDED',
    closingInDays: 75,
    officialWebsite: 'https://foreign.fulbrightonline.org',
    isFeatured: true,
  },
  {
    slug: 'kaust-king-abdullah-scholarships',
    title: 'KAUST Scholarships for Master\u2019s and PhD',
    titleAr: 'منح جامعة الملك عبدالله للعلوم والتقنية',
    description:
      'Full funding for MS and PhD study in science, engineering and mathematics at King Abdullah University of Science and Technology in Saudi Arabia. Includes tuition, housing, medical cover and a generous annual stipend.',
    provider: 'King Abdullah University of Science and Technology',
    providerType: 'UNIVERSITY',
    country: 'SA',
    degree: 'doctorate',
    fundingType: 'FULLY_FUNDED',
    closingInDays: 90,
    officialWebsite: 'https://www.kaust.edu.sa',
    isFeatured: true,
  },
  {
    slug: 'erasmus-mundus-joint-masters',
    title: 'Erasmus Mundus Joint Master\u2019s Degrees',
    titleAr: 'منح إيراسموس موندوس للماجستير المشترك',
    description:
      'Fully funded joint master\u2019s programmes delivered by consortia of European universities, open to students from all nationalities including the Arab world. Covers tuition, travel and monthly allowance.',
    provider: 'European Commission',
    providerType: 'INTERNATIONAL_ORGANIZATION',
    country: 'DE',
    degree: 'master',
    fundingType: 'FULLY_FUNDED',
    closingInDays: 120,
    officialWebsite: 'https://www.eacea.ec.europa.eu',
    isFeatured: false,
  },
  {
    slug: 'isdb-merit-scholarship',
    title: 'IsDB Merit Scholarship for High Technology',
    titleAr: 'منحة البنك الإسلامي للتنمية للتقنية العالية',
    description:
      'Scholarships from the Islamic Development Bank for graduate study in high-technology and applied fields for students from OIC member countries, including Egypt, Jordan, Sudan, Morocco and Indonesia.',
    provider: 'Islamic Development Bank',
    providerType: 'INTERNATIONAL_ORGANIZATION',
    country: 'SA',
    degree: 'master',
    fundingType: 'FULLY_FUNDED',
    closingInDays: 50,
    officialWebsite: 'https://www.isdb.org',
    isFeatured: false,
  },
];

async function seedContinents(prisma: Awaited<ReturnType<typeof getPrisma>>): Promise<Map<string, string>> {
  const map = new Map<string, string>();
  for (const [code, name, nameAr] of CONTINENTS) {
    const row = await prisma.continent.upsert({
      where: { code },
      create: { code, name, nameAr, slug: slugify(name) },
      update: { name, nameAr, slug: slugify(name) },
    });
    map.set(code, row.id);
  }
  return map;
}

async function seedCurrencies(prisma: Awaited<ReturnType<typeof getPrisma>>, countryCurrencies: Set<string>): Promise<Map<string, string>> {
  const map = new Map<string, string>();
  const known = new Map<string, CurrencySeed>(CURRENCIES.map((c) => [c[0], c]));
  const all = new Set<string>([...CURRENCIES.map((c) => c[0]), ...countryCurrencies]);
  for (const code of all) {
    const seed = known.get(code);
    const row = await prisma.currency.upsert({
      where: { code },
      create: {
        code,
        name: seed ? seed[1] : code,
        nameAr: seed ? seed[2] : null,
        symbol: seed ? seed[3] : null,
      },
      update: {
        name: seed ? seed[1] : undefined,
        nameAr: seed ? seed[2] : undefined,
        symbol: seed ? seed[3] : undefined,
      },
    });
    map.set(code, row.id);
  }
  return map;
}

async function seedLanguages(prisma: Awaited<ReturnType<typeof getPrisma>>): Promise<Map<string, string>> {
  const map = new Map<string, string>();
  for (const [code, name, nameAr, nativeName] of LANGUAGES) {
    const row = await prisma.language.upsert({
      where: { code },
      create: { code, name, nameAr, nativeName },
      update: { name, nameAr, nativeName },
    });
    map.set(code, row.id);
  }
  return map;
}

async function seedCountries(
  prisma: Awaited<ReturnType<typeof getPrisma>>,
  continents: Map<string, string>,
  currencies: Map<string, string>,
): Promise<Map<string, string>> {
  const map = new Map<string, string>();
  for (const [code, code3, name, nameAr, phone, continent, currency] of COUNTRIES) {
    const row = await prisma.country.upsert({
      where: { code },
      create: {
        code,
        code3,
        name,
        nameAr,
        phoneCode: phone,
        continentId: continents.get(continent) ?? continents.get('EU')!,
        currencyId: currency ? currencies.get(currency) ?? null : null,
        slug: slugify(name),
      },
      update: {
        code3,
        name,
        nameAr,
        phoneCode: phone,
        continentId: continents.get(continent) ?? continents.get('EU')!,
        currencyId: currency ? currencies.get(currency) ?? null : null,
        slug: slugify(name),
      },
    });
    map.set(code, row.id);
  }
  return map;
}

async function seedDegreeLevels(prisma: Awaited<ReturnType<typeof getPrisma>>): Promise<Map<string, string>> {
  const map = new Map<string, string>();
  for (const [name, nameAr, sort] of DEGREES) {
    const slug = slugify(name);
    const row = await prisma.degreeLevel.upsert({
      where: { slug },
      create: { name, nameAr, slug, sortOrder: sort },
      update: { name, nameAr, sortOrder: sort },
    });
    map.set(slug, row.id);
  }
  return map;
}

async function seedStudyFields(prisma: Awaited<ReturnType<typeof getPrisma>>): Promise<Map<string, string>> {
  const map = new Map<string, string>();
  for (const [slug, name, nameAr] of FIELDS) {
    const row = await prisma.studyField.upsert({
      where: { slug },
      create: { name, nameAr, slug, sortOrder: 0 },
      update: { name, nameAr },
    });
    map.set(slug, row.id);
  }
  for (const [slug, , , parentSlug] of FIELDS) {
    if (!parentSlug) continue;
    const parentId = map.get(parentSlug);
    if (!parentId) continue;
    await prisma.studyField.update({ where: { slug }, data: { parentId } });
  }
  return map;
}

async function seedProviders(
  prisma: Awaited<ReturnType<typeof getPrisma>>,
): Promise<Map<string, string>> {
  const map = new Map<string, string>();
  for (const s of SCHOLARSHIPS) {
    const slug = slugify(s.provider);
    const row = await prisma.provider.upsert({
      where: { slug },
      create: {
        name: s.provider,
        slug,
        providerType: s.providerType as never,
        website: s.officialWebsite,
        isVerified: true,
        verificationStatus: 'VERIFIED',
        status: 'PUBLISHED',
      },
      update: {
        name: s.provider,
        providerType: s.providerType as never,
        website: s.officialWebsite,
        isVerified: true,
        verificationStatus: 'VERIFIED',
        status: 'PUBLISHED',
      },
    });
    map.set(s.provider, row.id);
  }
  return map;
}

async function seedScholarships(
  prisma: Awaited<ReturnType<typeof getPrisma>>,
  providers: Map<string, string>,
  countries: Map<string, string>,
  degrees: Map<string, string>,
): Promise<number> {
  const now = today();
  let created = 0;
  let updated = 0;
  for (const s of SCHOLARSHIPS) {
    const closing = new Date(now.getTime() + s.closingInDays * 86400000);
    const opening = new Date(now.getTime() - 10 * 86400000);
    const degreeSlug = s.degree === 'master' ? 'master-s-degree' : s.degree === 'doctorate' ? 'doctorate-phd' : slugify(s.degree);
    const data = {
      title: s.title,
      titleAr: s.titleAr,
      description: s.description,
      providerId: providers.get(s.provider) ?? null,
      countryId: countries.get(s.country) ?? null,
      degreeLevelId: degrees.get(degreeSlug) ?? null,
      fundingType: s.fundingType as never,
      openingDate: opening,
      closingDate: closing,
      officialWebsite: s.officialWebsite,
      status: 'ACTIVE' as const,
      verificationStatus: 'VERIFIED' as const,
      isFeatured: s.isFeatured,
      isFullyFunded: true,
      isActive: true,
      sourceUrl: s.officialWebsite,
    };
    const existing = await prisma.scholarship.findUnique({ where: { slug: s.slug } });
    let scholarshipId: string;
    if (existing) {
      await prisma.scholarship.update({ where: { slug: s.slug }, data });
      scholarshipId = existing.id;
      updated += 1;
    } else {
      scholarshipId = (await prisma.scholarship.create({ data: { ...data, slug: s.slug } })).id;
      created += 1;
    }
    const cycleLabel = `${closing.getFullYear()} cycle`;
    const cycle = await prisma.scholarshipCycle.findFirst({
      where: { scholarshipId, cycleLabel, deletedAt: null },
    });
    const cycleData = {
      cycleLabel,
      openingDate: opening,
      closingDate: closing,
      isCurrent: true,
      status: closing >= now ? 'OPEN' as const : 'CLOSED' as const,
    };
    if (cycle) {
      await prisma.scholarshipCycle.update({ where: { id: cycle.id }, data: cycleData });
    } else {
      await prisma.scholarshipCycle.create({ data: { ...cycleData, scholarshipId } });
    }
  }
  return created;
}

async function seedUniversities(
  prisma: Awaited<ReturnType<typeof getPrisma>>,
  countries: Map<string, string>,
  target: number,
): Promise<number> {
  if (target <= 0) return 0;
  const countryCodes = [...countries.keys()];
  let created = 0;
  for (let n = 0; n < target; n++) {
    const code = countryCodes[n % countryCodes.length];
    const nameAr = countries.get(code);
    const base = slugify(`university of ${code}-${n}`);
    const slug = `${base}-${Math.floor(n / countryCodes.length) + 1}`;
    const exists = await prisma.university.findUnique({ where: { slug } });
    if (exists) continue;
    await prisma.university.create({
      data: {
        name: `University of ${code.toUpperCase()} ${Math.floor(n / countryCodes.length) + 1}`,
        nameAr,
        slug,
        countryId: countries.get(code)!,
        status: 'PUBLISHED',
        verificationStatus: 'VERIFIED',
        isFeatured: false,
      },
    });
    created += 1;
  }
  return created;
}

async function main(): Promise<void> {
  loadEnv();
  requireEnv('DATABASE_URL');
  const { flags } = parseArgs();
  const withScholarships = !flagBoolean(flags, 'no-scholarships', false);
  const universitiesTarget = flagNumber(flags, 'universities', 0);

  const prisma = getPrisma();
  const started = Date.now();

  console.log('[seed] connecting to database...');
  const continents = await seedContinents(prisma);
  const countryCurrencies = new Set<string>();
  for (const [, , , , , , currency] of COUNTRIES) {
    if (currency) countryCurrencies.add(currency);
  }
  const currencies = await seedCurrencies(prisma, countryCurrencies);
  await seedLanguages(prisma);
  const countries = await seedCountries(prisma, continents, currencies);
  const degrees = await seedDegreeLevels(prisma);
  await seedStudyFields(prisma);

  if (withScholarships) {
    const providers = await seedProviders(prisma);
    await seedScholarships(prisma, providers, countries, degrees);
  }

  const universitiesCreated = await seedUniversities(prisma, countries, universitiesTarget);

  const [continentCount, currencyCount, languageCount, countryCount, degreeCount, fieldCount, providerCount, scholarshipCount, universityCount] =
    await Promise.all([
      prisma.continent.count(),
      prisma.currency.count(),
      prisma.language.count(),
      prisma.country.count(),
      prisma.degreeLevel.count(),
      prisma.studyField.count(),
      prisma.provider.count(),
      prisma.scholarship.count(),
      prisma.university.count(),
    ]);

  console.log('[seed] done in %dms', Date.now() - started);
  console.log('  continents          %s', fmt(continentCount));
  console.log('  currencies          %s', fmt(currencyCount));
  console.log('  languages           %s', fmt(languageCount));
  console.log('  countries           %s', fmt(countryCount));
  console.log('  degree levels       %s', fmt(degreeCount));
  console.log('  study fields        %s', fmt(fieldCount));
  console.log('  providers           %s', fmt(providerCount));
  console.log('  scholarships        %s', fmt(scholarshipCount));
  console.log('  universities        %s (+%s generated this run)', fmt(universityCount), fmt(universitiesCreated));
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('[seed] failed:', err);
    process.exit(1);
  })
  .finally(() => closePrisma());
