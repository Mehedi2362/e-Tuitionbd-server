/**
 * Seed Students & Tuition Posts Script (Comprehensive Version)
 * Run: pnpm tsx scripts/seed-students-v2.ts
 * 
 * এই script MongoDB-এ 20 জন Bangladeshi student তৈরি করে
 * প্রতিটি student এর 2-3টি comprehensive tuition post থাকে
 */

import 'dotenv/config';
import bcrypt from "bcrypt";
import { MongoClient, ServerApiVersion } from "mongodb";
import type { IUser, ITuition } from "../src/shared/models/types.js";

const DEFAULT_STUDENT_PASSWORD = "Student@123";

const MOCK_STUDENTS = [
    {
        name: "রাইয়ান খান",
        email: "raiyan.khan@student.com",
        phone: "01711234567",
        location: "ধানমন্ডি, ঢাকা",
        bio: "HSC এ দুর্বল গণিতে সাহায্য চাই",
        tuitions: [
            {
                subject: "গণিত",
                class: "HSC",
                location: "ধানমন্ডি, ঢাকা",
                budget: 5000,
                schedule: "সপ্তাহে ৩ দিন, সন্ধ্যা (৬টা-৭:৩০)",
                description: "HSC গণিতে শক্তিশালী ভিত্তি তৈরি করতে চাই। Calculus, Algebra, Trigonometry সব topics। বিশেষত Integration এবং Differentiation এ দুর্বল। বোর্ড পরীক্ষায় ভালো ফলাফলের জন্য intensive tutoring দরকার।",
                requirements: "Experienced tutor যে HSC গণিতের সব chapters ভালোভাবে জানে এবং problem solving তে দক্ষ। যিনি concepts clear করতে পারেন এবং নিয়মিত practice করাবেন।",
                status: "approved" as const,
            },
            {
                subject: "ইংরেজি",
                class: "HSC",
                location: "ধানমন্ডি, ঢাকা",
                budget: 4000,
                schedule: "সপ্তাহে ২ দিন, দুপুর (১টা-২:৩০)",
                description: "English এ writing, grammar এবং literature সব ধরনের সমস্যা আছে। Essay writing, paragraph সহ সব কিছু improve করতে হবে। HSC board এর জন্য competitive level এ practice প্রয়োজন।",
                requirements: "Fluent English speaker যে grammar, writing techniques এবং literature এ expert। Regular assignments দিতে হবে এবং corrections provide করতে হবে।",
                status: "approved" as const,
            },
            {
                subject: "রসায়ন",
                class: "HSC",
                location: "ধানমন্ডি, ঢাকা",
                budget: 5500,
                schedule: "সপ্তাহে ২ দিন, সন্ধ্যা (৭:৩০-৯টা)",
                description: "Chemistry তে organic এবং inorganic উভয় শাখায় ভালো করতে হবে। Reaction mechanisms, periodicity, thermodynamics সব topics cover করতে হবে। Practical knowledge এবং theoretical concepts দুটোই প্রয়োজন।",
                requirements: "BSc Chemistry background বা chemistry তে expert। Experiments এবং real-life applications ব্যাখ্যা করতে পারে। Board exam এর question patterns জানে।",
                status: "pending" as const,
            },
        ],
    },
    {
        name: "সারা আকতার",
        email: "sara.akter@student.com",
        phone: "01712345678",
        location: "মোহাম্মদপুর, ঢাকা",
        bio: "Biology এ ভালো করতে চাই SSC তে",
        tuitions: [
            {
                subject: "বায়োলজি",
                class: "SSC",
                location: "মোহাম্মদপুর, ঢাকা",
                budget: 4500,
                schedule: "সপ্তাহে ৩ দিন, বিকেল (৪টা-৫:৩০)",
                description: "SSC Biology এ সব chapters এ ভালো করতে হবে। Cell structure, Photosynthesis, Reproduction, Ecology সব topics। Practical knowledge এবং diagram drawing important। Board exam এর জন্য well-prepared হতে হবে।",
                requirements: "Biology specialist tutor যে SSC curriculum ভালোভাবে জানে। Diagrams draw করাতে এবং practical understanding develop করাতে পারে।",
                status: "approved" as const,
            },
            {
                subject: "বাংলা",
                class: "SSC",
                location: "মোহাম্মদপুর, ঢাকা",
                budget: 3500,
                schedule: "সপ্তাহে ২ দিন, সন্ধ্যা (৭টা-৮:৩০)",
                description: "বাংলা বিষয়ে গদ্য এবং পদ্য উভয়েই improve করতে চাই। Literature analysis, বিভিন্ন লেখক এর style বুঝতে হবে। Marks maximize করার জন্য writing skills develop করতে হবে।",
                requirements: "Bengali literature expert যে classics এবং modern Bengali literature দুটোই ভালোভাবে জানে। Essay এবং creative writing guidance দিতে পারে।",
                status: "approved" as const,
            },
        ],
    },
    {
        name: "তামিম হোসেন",
        email: "tamim.hosen@student.com",
        phone: "01813456789",
        location: "আগারগাও, ঢাকা",
        bio: "Physics এ Expert tutor প্রয়োজন",
        tuitions: [
            {
                subject: "পদার্থবিজ্ঞান",
                class: "HSC",
                location: "আগারগাও, ঢাকা",
                budget: 6000,
                schedule: "সপ্তাহে ৩ দিন, সন্ধ্যা (৬:৩০-৮টা)",
                description: "HSC Physics তে Mechanics, Waves, Thermodynamics সব topics। Numerical problems solve করা এবং theoretical concepts clear করা দুটোই গুরুত্বপূর্ণ। Engineering entrance exam preparation এর জন্য advanced level problems solve করতে হবে।",
                requirements: "Physics specialist with engineering background। Problem-solving এ efficient এবং concepts explanation এ expert। Mathematical derivations এবং practical applications ভালোভাবে explain করতে পারে।",
                status: "approved" as const,
            },
            {
                subject: "গণিত",
                class: "HSC",
                location: "আগারগাও, ঢাকা",
                budget: 5500,
                schedule: "সপ্তাহে ২ দিন, দুপুর (১:৩০-৩টা)",
                description: "Advanced Mathematics - Integration, Differentiation, Complex Numbers, Vectors সব topics cover করতে হবে। Engineering entrance exam preparation এর জন্য tough problems practice দরকার। Speed এবং accuracy দুটোই develop করতে হবে।",
                requirements: "Master level mathematics knowledge। Entrance exam patterns জানে এবং time management শেখাতে পারে।",
                status: "approved" as const,
            },
        ],
    },
    {
        name: "নিলয় দাস",
        email: "nilay.das@student.com",
        phone: "01914567890",
        location: "ঐতিহাসিক ছয় দোকান, ঢাকা",
        bio: "Class 9 এ ভর্তি, সব বিষয়ে সাহায্য দরকার",
        tuitions: [
            {
                subject: "ইংরেজি",
                class: "নবম",
                location: "ঐতিহাসিক ছয় দোকান, ঢাকা",
                budget: 3500,
                schedule: "সপ্তাহে ৩ দিন, সন্ধ্যা (৬:৩০-৭:৩০)",
                description: "Class 9 English তে একেবারে শুরু থেকে শিখতে হবে। Grammar, Reading Comprehension, Writing skills সব develop করতে হবে। Basic foundation শক্তিশালী করতে হবে যাতে পরবর্তী classes এ ভালো করতে পারে।",
                requirements: "Patient tutor যে beginner level থেকে শুরু করতে পারে। Basic concepts clearly explain করতে পারে এবং regular practice এ উৎসাহ দিতে পারে।",
                status: "pending" as const,
            },
            {
                subject: "গণিত",
                class: "নবম",
                location: "ঐতিহাসিক ছয় দোকান, ঢাকা",
                budget: 4000,
                schedule: "সপ্তাহে ৩ দিন, দুপুর (১টা-২টা)",
                description: "Class 9 Mathematics - Algebra, Geometry, Statistics সব topics from scratch। Basic concepts clear করতে হবে এবং problem solving practice দিতে হবে।",
                requirements: "Class 9 mathematics expert যে fundamentals thoroughly শেখাতে পারে। Step-by-step problem solving teach করতে পারে।",
                status: "approved" as const,
            },
            {
                subject: "বিজ্ঞান",
                class: "নবম",
                location: "ঐতিহাসিক ছয় দোকান, ঢাকা",
                budget: 4500,
                schedule: "সপ্তাহে ২ দিন, সন্ধ্যা (৭:৩০-৮:৩০)",
                description: "Class 9 Science - Physics, Chemistry, Biology সব বিষয়। এক্সপেরিমেন্ট এবং practical knowledge সহ সব concepts।",
                requirements: "Science teacher যে তিনটি বিষয়েই ভালো দক্ষ এবং practical demonstrations দিতে পারে।",
                status: "approved" as const,
            },
        ],
    },
    {
        name: "আয়িশা সুলতানা",
        email: "ayisha.sultana@student.com",
        phone: "01715678901",
        location: "গুলশান, ঢাকা",
        bio: "English Spellman এর মতো ভালো হতে চাই",
        tuitions: [
            {
                subject: "ইংরেজি",
                class: "HSC",
                location: "গুলশান, ঢাকা",
                budget: 5500,
                schedule: "সপ্তাহে ৪ দিন, সন্ধ্যা (৬টা-৭:৩০)",
                description: "HSC English এ Literature এবং Grammar উভয়েই excellence achieve করতে চাই। বিভিন্ন লেখক, poems, novels সব গভীরভাবে বোঝা দরকার। Writing skills অত্যন্ত improve করতে হবে।",
                requirements: "Native English speaker অথবা fluent English এ expert। Literature এর গভীর জ্ঞান এবং critical analysis করার ক্ষমতা থাকতে হবে।",
                status: "approved" as const,
            },
            {
                subject: "ইতিহাস",
                class: "HSC",
                location: "গুলশান, ঢাকা",
                budget: 4000,
                schedule: "সপ্তাহে ২ দিন, দুপুর (১টা-২:৩০)",
                description: "HSC History - World History, Bangladesh History উভয়েই detailed knowledge প্রয়োজন। Different periods, important events, key figures সব জানতে হবে। Analytical thinking develop করতে হবে।",
                requirements: "History expert যে comprehensive knowledge আছে এবং interesting ভাবে history পড়াতে পারে। Context এবং perspectives explain করতে পারে।",
                status: "approved" as const,
            },
        ],
    },
    {
        name: "করিম আহমেদ",
        email: "karim.ahmed@student.com",
        phone: "01816789012",
        location: "উত্তরা, ঢাকা",
        bio: "Engineering প্রবেশিকায় ভালো করতে চাই",
        tuitions: [
            {
                subject: "পদার্থবিজ্ঞান",
                class: "HSC",
                location: "উত্তরা, ঢাকা",
                budget: 6000,
                schedule: "সপ্তাহে ৪ দিন, সন্ধ্যা (৭টা-৮:৩০)",
                description: "HSC Physics এ engineering level এ excellence প্রয়োজন। সব topics - Mechanics, Waves, Thermodynamics, Electricity, Magnetism সব advanced problems solve করতে হবে।",
                requirements: "Physics expert with engineering entrance exam experience। Advanced problem solving techniques শেখাতে পারে এবং tough questions handle করতে পারে।",
                status: "approved" as const,
            },
            {
                subject: "গণিত",
                class: "HSC",
                location: "উত্তরা, ঢাকা",
                budget: 6000,
                schedule: "সপ্তাহে ৪ দিন, সকাল (৯টা-১০:৩০)",
                description: "Engineering entrance exam preparation - Mathematics এ প্রতিযোগিতামূলক level এ prepare করতে হবে। সব advanced topics, integration, vectors, complex numbers সব।",
                requirements: "Mathematics expert with entrance exam preparation experience। Competitive exam strategy এবং time management শেখাতে পারে।",
                status: "approved" as const,
            },
            {
                subject: "রসায়ন",
                class: "HSC",
                location: "উত্তরা, ঢাকা",
                budget: 5500,
                schedule: "সপ্তাহে ২ দিন, দুপুর (১টা-২:৩০)",
                description: "HSC Chemistry - Organic এবং Inorganic উভয়েই advanced level prepare করতে হবে। Chemical reactions, mechanisms, problem solving সব practice দরকার।",
                requirements: "Chemistry expert যে entrance exam এর standards জানে এবং advanced topics clearly explain করতে পারে।",
                status: "pending" as const,
            },
        ],
    },
    {
        name: "নাজমা বেগম",
        email: "nazma.begum@student.com",
        phone: "01917890123",
        location: "ঢাকেশ্বরী, চট্টগ্রাম",
        bio: "চট্টগ্রাম থেকে Math tutor খুঁজছি",
        tuitions: [
            {
                subject: "গণিত",
                class: "SSC",
                location: "ঢাকেশ্বরী, চট্টগ্রাম",
                budget: 4000,
                schedule: "সপ্তাহে ৩ দিন, বিকেল (৪টা-৫টা)",
                description: "SSC Mathematics এ সব chapters সুদৃঢ় করতে হবে। Algebra, Geometry, Trigonometry, Statistics সব topics cover করতে হবে। Board exam এর জন্য adequate practice দরকার।",
                requirements: "SSC mathematics expert যে comprehensive curriculum জানে। Problem solving strategy শেখাতে পারে এবং exam preparation গাইড দিতে পারে।",
                status: "approved" as const,
            },
            {
                subject: "ইংরেজি",
                class: "SSC",
                location: "ঢাকেশ্বরী, চট্টগ্রাম",
                budget: 3500,
                schedule: "সপ্তাহে ২ দিন, সন্ধ্যা (৬টা-৭টা)",
                description: "SSC English - Speaking এবং Writing skills develop করতে চাই। Grammar, vocabulary, writing practice সব থাকবে। Communication skills improve করতে হবে।",
                requirements: "English teacher যে speaking এবং writing দুটোই গুরুত্ব দিতে পারে। Conversation practice করাতে পারে।",
                status: "approved" as const,
            },
        ],
    },
    {
        name: "শারিয়ার হোসেন",
        email: "shariar.hosen@student.com",
        phone: "01718901234",
        location: "বনানী, ঢাকা",
        bio: "Computer Science student, Extra Math tutor প্রয়োজন",
        tuitions: [
            {
                subject: "গণিত",
                class: "HSC",
                location: "বনানী, ঢাকা",
                budget: 5500,
                schedule: "সপ্তাহে ৩ দিন, সন্ধ্যা (৬টা-৭:৩০)",
                description: "HSC Mathematics - সব topics competent level এ prepare করতে হবে। Calculus, Algebra, Coordinate Geometry সব chapters। Computer science এর জন্য mathematical foundations শক্তিশালী থাকা দরকার।",
                requirements: "Mathematics expert যে competitive level prepare করতে পারে এবং CS related mathematics concepts explain করতে পারে।",
                status: "approved" as const,
            },
            {
                subject: "কম্পিউটার",
                class: "HSC",
                location: "বনানী, ঢাকা",
                budget: 5000,
                schedule: "সপ্তাহে ২ দিন, দুপুর (১টা-২:৩০)",
                description: "HSC Computer Science - C++ programming এবং theory উভয়েই শিখতে হবে। Data structures, algorithms, concepts সব। Practical coding skills develop করতে হবে।",
                requirements: "Computer science expert with programming experience। C++ programming thoroughly শেখাতে পারে এবং hands-on practice করাতে পারে।",
                status: "approved" as const,
            },
        ],
    },
    {
        name: "বিলাল হোসেন",
        email: "bilal.hosen@student.com",
        phone: "01819012345",
        location: "পল্লবী, ঢাকা",
        bio: "Class 8 এ আছি, সব subject পড়তে হবে",
        tuitions: [
            {
                subject: "ইংরেজি",
                class: "অষ্টম",
                location: "পল্লবী, ঢাকা",
                budget: 3000,
                schedule: "সপ্তাহে ৩ দিন, সন্ধ্যা (৬টা-৭টা)",
                description: "Class 8 English - basic সব concepts শিখতে হবে। Grammar, reading, writing সব fundamentals establish করতে হবে। Interest develop করতে হবে language এ।",
                requirements: "Patient English teacher যে basic level থেকে শুরু করতে পারে এবং fun এ পড়াতে পারে।",
                status: "approved" as const,
            },
            {
                subject: "বাংলা",
                class: "অষ্টম",
                location: "পল্লবী, ঢাকা",
                budget: 2800,
                schedule: "সপ্তাহে ২ দিন, দুপুর (১টা-২টা)",
                description: "Class 8 Bengali - পদ্য এবং গদ্য উভয়েই পড়তে হবে। বোঝা এবং analysis skills develop করতে হবে।",
                requirements: "Bengali teacher যে class 8 curriculum ভালো জানে এবং মজা করে পড়াতে পারে।",
                status: "pending" as const,
            },
            {
                subject: "গণিত",
                class: "অষ্টম",
                location: "পল্লবী, ঢাকা",
                budget: 3500,
                schedule: "সপ্তাহে ৩ দিন, বিকেল (৪টা-৫টা)",
                description: "Class 8 Mathematics - Algebra, Geometry fundamentals সব শিখতে হবে। Basic problem solving develop করতে হবে।",
                requirements: "Mathematics teacher যে student এর level বুঝে ধীরে ধীরে advance করতে পারে।",
                status: "approved" as const,
            },
        ],
    },
    {
        name: "রুমানা আক্তার",
        email: "rumana.akter@student.com",
        phone: "01720123456",
        location: "মিরপুর, ঢাকা",
        bio: "Medical entrance exam এ পড়ছি",
        tuitions: [
            {
                subject: "বায়োলজি",
                class: "HSC",
                location: "মিরপুর, ঢাকা",
                budget: 6500,
                schedule: "সপ্তাহে ৪ দিন, সন্ধ্যা (৬টা-৭:৩০)",
                description: "HSC Biology - medical entrance exam preparation। সব chapters in-depth coverage প্রয়োজন। Clinical aspects এবং practical knowledge important। Competitive level এ prepare করতে হবে।",
                requirements: "Biology expert with medical entrance exam experience। Detailed knowledge এবং interesting way এ concepts explain করতে পারে। Latest exam trends জানে।",
                status: "approved" as const,
            },
            {
                subject: "রসায়ন",
                class: "HSC",
                location: "মিরপুর, ঢাকা",
                budget: 6000,
                schedule: "সপ্তাহে ৪ দিন, দুপুর (১টা-২:৩০)",
                description: "HSC Chemistry - medical entrance এর জন্য। Organic chemistry detailed, inorganic সব chapters। Problem solving এবং mechanisms clear থাকা দরকার।",
                requirements: "Chemistry expert with medical exam background। Organic chemistry mechanisms clearly explain করতে পারে।",
                status: "approved" as const,
            },
        ],
    },
    {
        name: "হাবিব আহমেদ",
        email: "habib.ahmed@student.com",
        phone: "01821234567",
        location: "সিলেট শহর, সিলেট",
        bio: "দুর্বল ইংরেজি উন্নত করতে চাই",
        tuitions: [
            {
                subject: "ইংরেজি",
                class: "JSC",
                location: "সিলেট শহর, সিলেট",
                budget: 3500,
                schedule: "সপ্তাহে ৩ দিন, সন্ধ্যা (৬টা-৭টা)",
                description: "Class 10 English এ দুর্বল, উন্নতি করতে চাই। Grammar, speaking, writing সব ক্ষেত্রে improve দরকার। Communication confidence build করতে হবে।",
                requirements: "Patient English tutor যে speaking এবং listening দুটোতেই emphasis দিতে পারে। Regular conversation practice করাতে পারে।",
                status: "pending" as const,
            },
            {
                subject: "গণিত",
                class: "JSC",
                location: "সিলেট শহর, সিলেট",
                budget: 3800,
                schedule: "সপ্তাহে ৩ দিন, দুপুর (১টা-২টা)",
                description: "Class 10 Mathematics - comprehensive coverage প্রয়োজন। সব chapters এবং problem types practice করতে হবে।",
                requirements: "Mathematics expert যে JSC curriculum thoroughly জানে এবং step-by-step solving শেখাতে পারে।",
                status: "approved" as const,
            },
        ],
    },
    {
        name: "ফারহান আল ফাহিম",
        email: "farhan.fahim@student.com",
        phone: "01922345678",
        location: "খুলনা শহর, খুলনা",
        bio: "Science এ ভালো করতে চাই HSC তে",
        tuitions: [
            {
                subject: "পদার্থবিজ্ঞান",
                class: "HSC",
                location: "খুলনা শহর, খুলনা",
                budget: 5500,
                schedule: "সপ্তাহে ৩ দিন, সন্ধ্যা (৬টা-৭:৩০)",
                description: "HSC Physics - Mechanics detailed cover করতে হবে। Numerical problems solve করার অনেক practice দরকার।",
                requirements: "Physics specialist যে mechanics এ particularly strong এবং good at problem solving।",
                status: "approved" as const,
            },
            {
                subject: "রসায়ন",
                class: "HSC",
                location: "খুলনা শহর, খুলনা",
                budget: 5000,
                schedule: "সপ্তাহে ২ দিন, দুপুর (১টা-২:৩০)",
                description: "HSC Chemistry - organic compounds আর mechanism সব। Reactions এবং problem solving practice।",
                requirements: "Chemistry expert with organic chemistry specialization।",
                status: "approved" as const,
            },
            {
                subject: "গণিত",
                class: "HSC",
                location: "খুলনা শহর, খুলনা",
                budget: 5500,
                schedule: "সপ্তাহে ২ দিন, সন্ধ্যা (৭টা-৮:৩০)",
                description: "HSC Mathematics - Calculus particularly। Integration এবং differentiation problems।",
                requirements: "Mathematics expert in calculus with problem solving focus।",
                status: "pending" as const,
            },
        ],
    },
    {
        name: "রায়হান খালিদ",
        email: "rayhan.khalid@student.com",
        phone: "01723456789",
        location: "রাজশাহী শহর, রাজশাহী",
        bio: "Online tutor খুঁজছি সুবিধামত সময়ে",
        tuitions: [
            {
                subject: "বাংলা",
                class: "SSC",
                location: "রাজশাহী শহর, রাজশাহী",
                budget: 3500,
                schedule: "সপ্তাহে ২ দিন, সন্ধ্যা (অনলাইন, ৭টা-৮টা)",
                description: "SSC Bengali - essay এবং grammar दোनो। literature analysis এবং writing skills improve।",
                requirements: "Bengali expert who can do online teaching effectively।",
                status: "approved" as const,
            },
            {
                subject: "ইংরেজি",
                class: "SSC",
                location: "রাজশাহী শহর, রাজশাহী",
                budget: 4000,
                schedule: "সপ্তাহে ৩ দিন, দুপুর (অনলাইন, ১টা-২টা)",
                description: "SSC English - সব sections comprehensive coverage। Grammar, literature, writing সব।",
                requirements: "English expert for online teaching with good communication।",
                status: "approved" as const,
            },
        ],
    },
    {
        name: "সানিয়া হোসেন",
        email: "sania.hosen@student.com",
        phone: "01824567890",
        location: "বাংলাবাজার, ঢাকা",
        bio: "HSC Biology student, আরও ভালো করতে চাই",
        tuitions: [
            {
                subject: "বায়োলজি",
                class: "HSC",
                location: "বাংলাবাজার, ঢাকা",
                budget: 5500,
                schedule: "সপ্তাহে ৪ দিন, সন্ধ্যা (৬টা-৭:৩০)",
                description: "HSC Biology - Cell এবং Genetics খুব গভীরভাবে। সব mechanisms এবং processes clear।",
                requirements: "Biology expert particularly in cellular biology and genetics।",
                status: "approved" as const,
            },
            {
                subject: "পরিবেশ",
                class: "HSC",
                location: "বাংলাবাজার, ঢাকা",
                budget: 4000,
                schedule: "সপ্তাহে ২ দিন, দুপুর (१टा-२:३०)",
                description: "HSC Environmental Science - ecology এবং conservation issues।",
                requirements: "Environmental science expert with real-world examples।",
                status: "pending" as const,
            },
        ],
    },
    {
        name: "মুহাম্মদ মনিরুল",
        email: "monir.islam@student.com",
        phone: "01925678901",
        location: "সদরঘাট, ঢাকা",
        bio: "ভর্তি পরীক্ষায় ভালো করতে চাই",
        tuitions: [
            {
                subject: "গণিত",
                class: "HSC",
                location: "সদরঘাট, ঢাকা",
                budget: 6000,
                schedule: "সপ্তাহে ৪ দিন, সকাল (৯টা-१०:३०)",
                description: "HSC Mathematics - entrance exam preparation। Advanced problem solving এবং tricks।",
                requirements: "Mathematics expert with entrance exam experience and problem-solving shortcuts।",
                status: "approved" as const,
            },
            {
                subject: "ইংরেজি",
                class: "HSC",
                location: "সদরঘাট, ঢাকা",
                budget: 5000,
                schedule: "সপ্তাহে ३ दिन, সন্ধ্যা (७टा-८:३०)",
                description: "HSC English - entrance exam পড়ার জন্য comprehensive।",
                requirements: "English expert who knows competitive exam patterns।",
                status: "approved" as const,
            },
        ],
    },
    {
        name: "ফাতিমা ইয়াসমিন",
        email: "fatima.yasmin@student.com",
        phone: "01726789012",
        location: "নওয়াবপুর, ঢাকা",
        bio: "Class 7 তে আছি, সব subject এ দুর্বল",
        tuitions: [
            {
                subject: "বাংলা",
                class: "সপ্তম",
                location: "নওয়াবপুর, ঢাকা",
                budget: 2800,
                schedule: "সপ্তাহে २ দिन, दुपहर (१टा-२टा)",
                description: "Class 7 Bengali - reading এবং writing fundamentals।",
                requirements: "Bengali teacher for class 7 with patience and basic level expertise।",
                status: "approved" as const,
            },
            {
                subject: "গণিত",
                class: "সপ্তম",
                location: "নওয়াবপুর, ঢাকা",
                budget: 3200,
                schedule: "সপ্তাহে ३ দिन, सন्ध्या (६टा-७टा)",
                description: "Class 7 Mathematics - basics সব। arithmetic থেকে শুরু।",
                requirements: "Math teacher for class 7 with fundamentals focus।",
                status: "approved" as const,
            },
            {
                subject: "ইংরেজি",
                class: "সপ্তম",
                location: "নওয়াবপুর, ঢাকা",
                budget: 3000,
                schedule: "সপ্তাহে २ দिन, बिকेल (४टा-५टा)",
                description: "Class 7 English - basic grammar এবং vocabulary।",
                requirements: "English teacher for beginners with interactive teaching style।",
                status: "pending" as const,
            },
        ],
    },
    {
        name: "আবদুল করিম",
        email: "abdul.karim@student.com",
        phone: "01827890123",
        location: "বাড়িবাজার, ঢাকা",
        bio: "Medical student, Extra coaching প্রয়োজন",
        tuitions: [
            {
                subject: "বায়োলজি",
                class: "HSC",
                location: "বাড়িবাজার, ঢাকা",
                budget: 6500,
                schedule: "সপ্তাহে ४ दिन, सन्ध्या (६टा-७:३०)",
                description: "HSC Biology - medical entrance level। সব chapters in-depth coverage।",
                requirements: "Biology expert with medical entrance exam experience।",
                status: "approved" as const,
            },
            {
                subject: "রসায়ন",
                class: "HSC",
                location: "বাড়িবাজার, ঢাকা",
                budget: 6000,
                schedule: "সপ্তাহে ४ दिन, सुबह (९टा-१०:३०)",
                description: "HSC Chemistry - medical entrance prep। organic এবং inorganic দুটোই।",
                requirements: "Chemistry expert with medical exam preparation experience।",
                status: "approved" as const,
            },
        ],
    },
    {
        name: "জাহিদ হোসেন",
        email: "jahid.hosen@student.com",
        phone: "01928901234",
        location: "মতিঝিল, ঢাকা",
        bio: "Engineering থেকে পড়ছি, Extra Math টিউশন দরকার",
        tuitions: [
            {
                subject: "গণিত",
                class: "HSC",
                location: "মতিঝিল, ঢাকা",
                budget: 6500,
                schedule: "সপ্তাহে ४ दिन, सन्ध्या (७टा-८:३०)",
                description: "HSC Mathematics - engineering entrance preparation। advanced problems সব।",
                requirements: "Mathematics expert with engineering entrance experience।",
                status: "approved" as const,
            },
            {
                subject: "পদার্থবিজ্ঞান",
                class: "HSC",
                location: "মতিঝিল, ঢাকা",
                budget: 6000,
                schedule: "सप्ताह में ३ दिन, সকাল (९टा-१०:३०)",
                description: "HSC Physics - engineering exam prep। advanced numerical problems।",
                requirements: "Physics expert with engineering entrance background।",
                status: "approved" as const,
            },
        ],
    },
    {
        name: "সুমাইয়া খান",
        email: "sumaiya.khan@student.com",
        phone: "01729012345",
        location: "তেজতুরি, ঢাকা",
        bio: "নতুন ভর্তি, সব বিষয়ে ভালো করতে চাই",
        tuitions: [
            {
                subject: "ইংরেজি",
                class: "নবম",
                location: "তেজতুরি, ঢাকা",
                budget: 3500,
                schedule: "सप्ताह में ३ दिन, सन्ध्या (६टा-७टा)",
                description: "Class 9 English - new student preparation। সব skills develop।",
                requirements: "English teacher for new class 9 students with encouraging approach।",
                status: "approved" as const,
            },
            {
                subject: "গণিত",
                class: "নবম",
                location: "তেজতুরি, ঢাকা",
                budget: 4000,
                schedule: "सप्ताह में ३ दिन, दुपहर (१टा-२टा)",
                description: "Class 9 Mathematics - new student comprehensive prep।",
                requirements: "Math teacher for new class 9 with patient foundation building।",
                status: "approved" as const,
            },
            {
                subject: "বিজ্ঞান",
                class: "নবম",
                location: "তেজতুরি, ঢাকা",
                budget: 4200,
                schedule: "सप्ताह में २ दिन, सन्ध्या (७टा-८टा)",
                description: "Class 9 Science - new student এর জন্য সব fundamentals।",
                requirements: "Science teacher for new class 9 students।",
                status: "pending" as const,
            },
        ],
    },
    {
        name: "আমির হোসেন",
        email: "amir.hosen@student.com",
        phone: "01830123456",
        location: "লালমাটিয়া, ঢাকা",
        bio: "International exam preparation - IELTS, SAT দরকার",
        tuitions: [
            {
                subject: "ইংরেজি",
                class: "HSC",
                location: "লালমাটিয়া, ঢাকা",
                budget: 7000,
                schedule: "সপ्ताহे ४ दिन, सन्ध्या (६टा-७:३०)",
                description: "HSC English - IELTS preparation। speaking, listening, reading, writing সব skilled level।",
                requirements: "IELTS expert with proven track record। Speaking practice emphasize করতে পারে।",
                status: "approved" as const,
            },
            {
                subject: "গণিত",
                class: "HSC",
                location: "লালমাটিয়া, ঢাকা",
                budget: 6500,
                schedule: "सप्ताह में ३ दिन, सुबह (९टा-१०:३०)",
                description: "HSC Mathematics - SAT preparation। advanced problem solving এবং speed।",
                requirements: "Math expert with SAT preparation experience।",
                status: "approved" as const,
            },
        ],
    },
];

// Helper function - same as before
async function seedStudentsAndTuitions() {
    try {
        const MONGODB_URI = process.env.MONGODB_URI;
        const DB_NAME = process.env.DB_NAME;

        if (!MONGODB_URI || !DB_NAME) {
            throw new Error("MONGODB_URI এবং DB_NAME environment variable-এ defined নেই");
        }

        console.log("🔧 MongoDB এ connected হচ্ছে...");

        const client = new MongoClient(MONGODB_URI, {
            serverApi: {
                version: ServerApiVersion.v1,
                strict: true,
                deprecationErrors: true,
            },
        });

        await client.connect();
        const database = client.db(DB_NAME);
        const usersCollection = database.collection<IUser>('users');
        const tuitionsCollection = database.collection<ITuition>('tuitions');

        console.log("📚 শিক্ষার্থী এবং টিউশন পোস্ট তৈরি করছি...\n");

        let createdStudentsCount = 0;
        let createdTuitionsCount = 0;
        let skippedCount = 0;

        const hashedPassword = await bcrypt.hash(DEFAULT_STUDENT_PASSWORD, 10);

        for (const studentData of MOCK_STUDENTS) {
            const existingStudent = await usersCollection.findOne({
                email: studentData.email,
            });

            if (existingStudent) {
                console.log(`⚠️  শিক্ষার্থী ইতিমধ্যে exist করে: ${studentData.email}`);
                skippedCount++;
                continue;
            }

            const studentUser: IUser = {
                name: studentData.name,
                email: studentData.email,
                phone: studentData.phone,
                password: hashedPassword,
                role: "student",
                photoUrl: null,
                status: "active",
                location: studentData.location,
                bio: studentData.bio,
                qualifications: "",
                experience: "",
                subjects: [],
                createdAt: new Date(),
                updatedAt: new Date(),
            };

            await usersCollection.insertOne(studentUser);
            console.log(`✅ শিক্ষার্থী তৈরি: ${studentData.name}`);
            createdStudentsCount++;

            for (const tuition of studentData.tuitions) {
                const tuitionDoc: ITuition = {
                    student: {
                        email: studentData.email,
                        name: studentData.name,
                    },
                    subject: tuition.subject,
                    class: tuition.class,
                    location: tuition.location,
                    budget: tuition.budget,
                    schedule: tuition.schedule,
                    description: tuition.description,
                    requirements: tuition.requirements,
                    status: tuition.status,
                    applicationsCount: 0,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                };

                await tuitionsCollection.insertOne(tuitionDoc);
                console.log(
                    `   └─ টিউশন পোস্ট: ${tuition.subject} (${tuition.class}) - ৳${tuition.budget}`
                );
                createdTuitionsCount++;
            }

            console.log("");
        }

        console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
        console.log(`✅ মোট শিক্ষার্থী তৈরি: ${createdStudentsCount}`);
        console.log(`✅ মোট টিউশন পোস্ট তৈরি: ${createdTuitionsCount}`);
        console.log(`⚠️  Skip করা: ${skippedCount}`);
        console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
        console.log(`\n📧 Default Password: ${DEFAULT_STUDENT_PASSWORD}\n`);

        await client.close();
    } catch (error) {
        console.error("❌ Error seeding students and tuitions:", error);
        process.exit(1);
    }
}

seedStudentsAndTuitions();
