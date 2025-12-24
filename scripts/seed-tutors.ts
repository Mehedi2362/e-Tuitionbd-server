/**
 * Seed Skilled Tutors Script
 * Run: pnpm tsx scripts/seed-tutors.ts
 * 
 * এই script MongoDB-এ 30 জন skilled tutor তৈরি করে
 */

import 'dotenv/config';
import bcrypt from "bcrypt";
import { MongoClient, ServerApiVersion } from "mongodb";
import type { IUser } from "../src/shared/models/types.js";

// ==================== Mock Tutor Data ====================
const DEFAULT_TUTOR_PASSWORD = "TutorPass@123";

const MOCK_TUTORS = [
    {
        name: "রহিম আহমেদ",
        email: "rahim.ahmed@tutor.com",
        phone: "01711234567",
        password: DEFAULT_TUTOR_PASSWORD,
        title: "Mathematics & Science Specialist",
        location: "Dhaka, Bangladesh",
        qualifications: "Bachelor's in Mathematics, Masters in Education",
        experience: 8,
        subjects: ["Math", "Physics", "Chemistry"],
        bio: "Experienced tutor specializing in science and mathematics for SSC and HSC students.",
        education: [
            { degree: "Bachelor of Science", institution: "University of Dhaka", year: "2010" },
            { degree: "Master of Education", institution: "BRAC University", year: "2015" }
        ],
        certifications: [
            { name: "Advanced Mathematics Teaching", issuer: "Cambridge Institute", year: "2016" },
            { name: "Science Education Certification", issuer: "British Council", year: "2017" }
        ],
        availability: { weekdays: "4PM - 8PM", weekends: "10AM - 4PM" },
        rating: 4.8,
        reviewCount: 45,
        studentsCount: 28,
        classesCount: 152,
        isVerified: true,
    },
    {
        name: "ফাতিমা খান",
        email: "fatima.khan@tutor.com",
        phone: "01712345678",
        password: DEFAULT_TUTOR_PASSWORD,
        title: "English & IELTS Expert",
        location: "Dhaka, Bangladesh",
        qualifications: "Bachelor's in English, IELTS 7.5",
        experience: 6,
        subjects: ["English", "IELTS", "Writing"],
        bio: "Professional English tutor helping students excel in IELTS and general English.",
        education: [
            { degree: "Bachelor of Arts", institution: "Dhaka University", year: "2012" },
            { degree: "IELTS Preparation", institution: "British Institute", year: "2014" }
        ],
        certifications: [
            { name: "IELTS Trainer Certification", issuer: "British Council", year: "2015" },
            { name: "Advanced English Teaching", issuer: "TESOL", year: "2018" }
        ],
        availability: { weekdays: "3PM - 9PM", weekends: "9AM - 5PM" },
        rating: 4.9,
        reviewCount: 52,
        studentsCount: 35,
        classesCount: 198,
        isVerified: true,
    },
    {
        name: "করিম হোসেন",
        email: "karim.hosen@tutor.com",
        phone: "01813456789",
        password: DEFAULT_TUTOR_PASSWORD,
        title: "Physics Specialist",
        location: "Khulna, Bangladesh",
        qualifications: "BSc in Physics, Masters in Science Education",
        experience: 10,
        subjects: ["Physics", "Math", "Science"],
        bio: "Dedicated physics teacher with expertise in O-Level and A-Level physics.",
        education: [
            { degree: "Bachelor of Science", institution: "Khulna University", year: "2008" },
            { degree: "Master of Science Education", institution: "Chittagong University", year: "2013" }
        ],
        certifications: [
            { name: "Physics Teaching Excellence", issuer: "National University", year: "2014" }
        ],
        availability: { weekdays: "5PM - 8PM", weekends: "11AM - 4PM" },
        rating: 4.7,
        reviewCount: 38,
        studentsCount: 30,
        classesCount: 186,
        isVerified: true,
    },
    {
        name: "নাজমা বেগম",
        email: "nazma.begum@tutor.com",
        phone: "01914567890",
        password: DEFAULT_TUTOR_PASSWORD,
        title: "Chemistry Expert",
        location: "Sylhet, Bangladesh",
        qualifications: "Bachelor's in Chemistry, B.Ed",
        experience: 7,
        subjects: ["Chemistry", "Science", "Biology"],
        bio: "Expert chemistry tutor for secondary and higher secondary students.",
        education: [
            { degree: "Bachelor of Science", institution: "Sylhet University", year: "2011" },
            { degree: "Bachelor of Education", institution: "BRAC University", year: "2013" }
        ],
        certifications: [
            { name: "Chemistry Education Certification", issuer: "Science Council", year: "2015" }
        ],
        availability: { weekdays: "4PM - 8PM", weekends: "10AM - 3PM" },
        rating: 4.6,
        reviewCount: 41,
        studentsCount: 26,
        classesCount: 165,
        isVerified: true,
    },
    {
        name: "আবদুল মালেক",
        email: "abdul.malek@tutor.com",
        phone: "01715678901",
        password: DEFAULT_TUTOR_PASSWORD,
        title: "Programming & Web Developer",
        location: "Dhaka, Bangladesh",
        qualifications: "Bachelor's in Computer Science",
        experience: 5,
        subjects: ["Programming", "JavaScript", "Python"],
        bio: "Tech-savvy tutor teaching programming and web development to aspiring developers.",
        education: [
            { degree: "Bachelor of Science", institution: "Bangladesh University of Engineering and Technology", year: "2015" }
        ],
        certifications: [
            { name: "Full Stack Web Development", issuer: "Udacity", year: "2018" },
            { name: "JavaScript Certification", issuer: "Codecademy", year: "2019" }
        ],
        availability: { weekdays: "6PM - 9PM", weekends: "2PM - 6PM" },
        rating: 4.8,
        reviewCount: 48,
        studentsCount: 32,
        classesCount: 174,
        isVerified: true,
    },
    {
        name: "সালমা আক্তার",
        email: "salma.akter@tutor.com",
        phone: "01816789012",
        password: DEFAULT_TUTOR_PASSWORD,
        title: "History & Social Studies Teacher",
        location: "Rajshahi, Bangladesh",
        qualifications: "Bachelor's in Bangladesh Studies, Masters in History",
        experience: 8,
        subjects: ["History", "Bangladesh Studies", "Social Studies"],
        bio: "Passionate history educator helping students understand Bangladesh and world history.",
        education: [
            { degree: "Bachelor of Arts", institution: "Rajshahi University", year: "2010" },
            { degree: "Master of Arts", institution: "University of Dhaka", year: "2014" }
        ],
        certifications: [
            { name: "History Teaching Certificate", issuer: "History Association Bangladesh", year: "2015" }
        ],
        availability: { weekdays: "3PM - 8PM", weekends: "10AM - 4PM" },
        rating: 4.7,
        reviewCount: 36,
        studentsCount: 24,
        classesCount: 158,
        isVerified: true,
    },
    {
        name: "মোহাম্মদ জাকি",
        email: "zakir.islam@tutor.com",
        phone: "01917890123",
        password: DEFAULT_TUTOR_PASSWORD,
        title: "Bangla Literature Expert",
        location: "Dhaka, Bangladesh",
        qualifications: "Bachelor's in Bangla Literature",
        experience: 9,
        subjects: ["Bangla", "Literature", "Grammar"],
        bio: "Expert Bangla tutor with focus on literature, grammar and written expression.",
        education: [
            { degree: "Bachelor of Arts", institution: "Dhaka University", year: "2009" },
            { degree: "Diploma in Creative Writing", institution: "Bangladesh Writers Guild", year: "2012" }
        ],
        certifications: [
            { name: "Bangla Literature Teaching", issuer: "National Academy", year: "2013" }
        ],
        availability: { weekdays: "4PM - 9PM", weekends: "10AM - 5PM" },
        rating: 4.9,
        reviewCount: 55,
        studentsCount: 38,
        classesCount: 205,
        isVerified: true,
    },
    {
        name: "রুনা রায়",
        email: "runa.roy@tutor.com",
        phone: "01718901234",
        password: DEFAULT_TUTOR_PASSWORD,
        title: "Economics & Business Specialist",
        location: "Dhaka, Bangladesh",
        qualifications: "Bachelor's in Economics, MBA",
        experience: 6,
        subjects: ["Economics", "Business Studies", "Accounting"],
        bio: "Economics specialist helping students grasp microeconomics and macroeconomics concepts.",
        education: [
            { degree: "Bachelor of Science", institution: "University of Dhaka", year: "2012" },
            { degree: "Master of Business Administration", institution: "BRAC University", year: "2015" }
        ],
        certifications: [
            { name: "Economics Teaching Certification", issuer: "Economic Society", year: "2016" }
        ],
        availability: { weekdays: "5PM - 8PM", weekends: "11AM - 4PM" },
        rating: 4.6,
        reviewCount: 39,
        studentsCount: 25,
        classesCount: 162,
        isVerified: true,
    },
    {
        name: "সাইফুল ইসলাম",
        email: "saiful.islam@tutor.com",
        phone: "01819012345",
        password: DEFAULT_TUTOR_PASSWORD,
        title: "IT & Web Design Expert",
        location: "Chittagong, Bangladesh",
        qualifications: "Bachelor's in Information Technology",
        experience: 7,
        subjects: ["IT", "Web Design", "Database Management"],
        bio: "IT professional teaching web development and database design to students.",
        education: [
            { degree: "Bachelor of Science", institution: "Chittagong University", year: "2011" }
        ],
        certifications: [
            { name: "Web Design Professional", issuer: "Adobe", year: "2014" },
            { name: "Database Management Certification", issuer: "Microsoft", year: "2016" }
        ],
        availability: { weekdays: "6PM - 9PM", weekends: "1PM - 5PM" },
        rating: 4.7,
        reviewCount: 42,
        studentsCount: 27,
        classesCount: 172,
        isVerified: true,
    },
    {
        name: "তামান্না ইয়াসমিন",
        email: "tamanna.yasmin@tutor.com",
        phone: "01720123456",
        password: DEFAULT_TUTOR_PASSWORD,
        title: "General Science Teacher",
        location: "Dhaka, Bangladesh",
        qualifications: "Bachelor's in General Science",
        experience: 5,
        subjects: ["Science", "Biology", "Health"],
        bio: "Enthusiastic science tutor making complex concepts simple and understandable.",
        education: [
            { degree: "Bachelor of Science", institution: "University of Dhaka", year: "2015" }
        ],
        certifications: [
            { name: "Science Education Diploma", issuer: "British Council", year: "2017" }
        ],
        availability: { weekdays: "3PM - 7PM", weekends: "10AM - 4PM" },
        rating: 4.8,
        reviewCount: 44,
        studentsCount: 31,
        classesCount: 186,
        isVerified: true,
    },
    {
        name: "আহসান আলী",
        email: "ahsan.ali@tutor.com",
        phone: "01821234567",
        password: DEFAULT_TUTOR_PASSWORD,
        title: "Senior Mathematics Educator",
        location: "Dhaka, Bangladesh",
        qualifications: "Bachelor's in Mathematics, B.Ed",
        experience: 11,
        subjects: ["Math", "Advanced Math", "Statistics"],
        bio: "Senior mathematics educator with expertise in algebra, geometry, and calculus.",
        education: [
            { degree: "Bachelor of Science", institution: "University of Dhaka", year: "2008" },
            { degree: "Bachelor of Education", institution: "BRAC University", year: "2011" }
        ],
        certifications: [
            { name: "Advanced Mathematics Teaching", issuer: "Cambridge", year: "2012" },
            { name: "Statistics Certification", issuer: "Statistical Society", year: "2015" }
        ],
        availability: { weekdays: "4PM - 8PM", weekends: "10AM - 5PM" },
        rating: 4.9,
        reviewCount: 58,
        studentsCount: 40,
        classesCount: 215,
        isVerified: true,
    },
    {
        name: "নিলুফার সুলতানা",
        email: "nilufer.sultana@tutor.com",
        phone: "01722234567",
        password: DEFAULT_TUTOR_PASSWORD,
        title: "Sociology & Social Sciences Expert",
        location: "Sylhet, Bangladesh",
        qualifications: "Bachelor's in Sociology",
        experience: 6,
        subjects: ["Sociology", "Civics", "Social Studies"],
        bio: "Expert in social sciences helping students understand society and culture.",
        education: [
            { degree: "Bachelor of Arts", institution: "Sylhet University", year: "2012" }
        ],
        certifications: [
            { name: "Social Studies Teaching", issuer: "UNESCO", year: "2015" }
        ],
        availability: { weekdays: "4PM - 8PM", weekends: "9AM - 3PM" },
        rating: 4.6,
        reviewCount: 37,
        studentsCount: 23,
        classesCount: 155,
        isVerified: true,
    },
    {
        name: "ইউনুস খন্দকার",
        email: "yunus.khondokar@tutor.com",
        phone: "01823345678",
        password: DEFAULT_TUTOR_PASSWORD,
        title: "Applied Physics & Engineering",
        location: "Dhaka, Bangladesh",
        qualifications: "Bachelor's in Applied Physics",
        experience: 8,
        subjects: ["Physics", "Math", "Engineering"],
        bio: "Physics expert teaching engineering and advanced physics concepts.",
        education: [
            { degree: "Bachelor of Science", institution: "Bangladesh University of Engineering and Technology", year: "2010" }
        ],
        certifications: [
            { name: "Engineering Physics Certification", issuer: "BUET", year: "2013" }
        ],
        availability: { weekdays: "5PM - 8PM", weekends: "10AM - 4PM" },
        rating: 4.8,
        reviewCount: 46,
        studentsCount: 29,
        classesCount: 180,
        isVerified: true,
    },
    {
        name: "জান্নাত ফারুক",
        email: "jannat.faroque@tutor.com",
        phone: "01724345678",
        password: DEFAULT_TUTOR_PASSWORD,
        title: "Biology & Medical Sciences Teacher",
        location: "Khulna, Bangladesh",
        qualifications: "Bachelor's in Pharmacology",
        experience: 5,
        subjects: ["Biology", "Chemistry", "Medical Science"],
        bio: "Medical student helping prepare aspiring doctors and healthcare professionals.",
        education: [
            { degree: "Bachelor of Science", institution: "Khulna University", year: "2016" }
        ],
        certifications: [
            { name: "Medical Sciences Diploma", issuer: "Bangladesh Medical College", year: "2018" }
        ],
        availability: { weekdays: "6PM - 9PM", weekends: "11AM - 4PM" },
        rating: 4.7,
        reviewCount: 40,
        studentsCount: 26,
        classesCount: 168,
        isVerified: true,
    },
    {
        name: "মাহমুদ হাসান",
        email: "mahmud.hasan@tutor.com",
        phone: "01825456789",
        password: DEFAULT_TUTOR_PASSWORD,
        title: "Engineering & Technology Expert",
        location: "Dhaka, Bangladesh",
        qualifications: "Bachelor's in Civil Engineering",
        experience: 7,
        subjects: ["Engineering", "Mathematics", "Physics"],
        bio: "Engineering professional tutoring future engineers in technical subjects.",
        education: [
            { degree: "Bachelor of Science", institution: "Bangladesh University of Engineering and Technology", year: "2013" }
        ],
        certifications: [
            { name: "Civil Engineering Certification", issuer: "BUET", year: "2015" }
        ],
        availability: { weekdays: "5PM - 9PM", weekends: "10AM - 5PM" },
        rating: 4.9,
        reviewCount: 51,
        studentsCount: 34,
        classesCount: 195,
        isVerified: true,
    },
    {
        name: "সীমা চৌধুরী",
        email: "seema.choudhury@tutor.com",
        phone: "01726456789",
        password: DEFAULT_TUTOR_PASSWORD,
        title: "Business & Commerce Educator",
        location: "Dhaka, Bangladesh",
        qualifications: "Bachelor's in Business Administration",
        experience: 6,
        subjects: ["Business Studies", "Accounting", "Economics"],
        bio: "Business educator helping students excel in commerce and business subjects.",
        education: [
            { degree: "Bachelor of Business Administration", institution: "BRAC University", year: "2013" }
        ],
        certifications: [
            { name: "Accounting Certification", issuer: "ICAB", year: "2016" }
        ],
        availability: { weekdays: "4PM - 8PM", weekends: "11AM - 4PM" },
        rating: 4.6,
        reviewCount: 38,
        studentsCount: 24,
        classesCount: 160,
        isVerified: true,
    },
    {
        name: "ফারহান রেজা",
        email: "farhan.reza@tutor.com",
        phone: "01827567890",
        password: DEFAULT_TUTOR_PASSWORD,
        title: "Geography & Environmental Science",
        location: "Rajshahi, Bangladesh",
        qualifications: "Bachelor's in Geography, B.Ed",
        experience: 7,
        subjects: ["Geography", "Environmental Studies", "Social Studies"],
        bio: "Geography specialist with expertise in physical and human geography.",
        education: [
            { degree: "Bachelor of Arts", institution: "Rajshahi University", year: "2011" },
            { degree: "Bachelor of Education", institution: "BRAC University", year: "2013" }
        ],
        certifications: [
            { name: "Geography Teaching Certificate", issuer: "Geography Association", year: "2015" }
        ],
        availability: { weekdays: "4PM - 8PM", weekends: "10AM - 3PM" },
        rating: 4.7,
        reviewCount: 43,
        studentsCount: 28,
        classesCount: 175,
        isVerified: true,
    },
    {
        name: "হাফসা খাতুন",
        email: "hafsa.khatun@tutor.com",
        phone: "01728567890",
        password: DEFAULT_TUTOR_PASSWORD,
        title: "Islamic Studies & Quran Expert",
        location: "Dhaka, Bangladesh",
        qualifications: "Bachelor's in Islamic Studies",
        experience: 8,
        subjects: ["Islamic Studies", "Arabic", "Quran"],
        bio: "Islamic education specialist teaching Quranic studies and Islamic principles.",
        education: [
            { degree: "Bachelor of Arts", institution: "Islamic University Bangladesh", year: "2012" }
        ],
        certifications: [
            { name: "Quranic Studies Certification", issuer: "Al-Azhar Institute", year: "2015" }
        ],
        availability: { weekdays: "3PM - 8PM", weekends: "10AM - 5PM" },
        rating: 4.8,
        reviewCount: 49,
        studentsCount: 33,
        classesCount: 192,
        isVerified: true,
    },
    {
        name: "করিম শাহ",
        email: "karim.shah@tutor.com",
        phone: "01829678901",
        password: DEFAULT_TUTOR_PASSWORD,
        title: "Physical Education & Sports",
        location: "Chittagong, Bangladesh",
        qualifications: "Bachelor's in Physical Education, B.Ed",
        experience: 5,
        subjects: ["Physical Education", "Health", "Sports"],
        bio: "PE educator promoting healthy lifestyle and sports excellence.",
        education: [
            { degree: "Bachelor of Physical Education", institution: "Chittagong University", year: "2015" }
        ],
        certifications: [
            { name: "Sports Science Certification", issuer: "International Sports Council", year: "2017" }
        ],
        availability: { weekdays: "5PM - 8PM", weekends: "9AM - 4PM" },
        rating: 4.6,
        reviewCount: 35,
        studentsCount: 21,
        classesCount: 142,
        isVerified: true,
    },
    {
        name: "বিলকিস বেগম",
        email: "bilkis.begum@tutor.com",
        phone: "01730789012",
        password: DEFAULT_TUTOR_PASSWORD,
        title: "Fine Arts & Visual Arts Teacher",
        location: "Dhaka, Bangladesh",
        qualifications: "Bachelor's in Fine Arts",
        experience: 6,
        subjects: ["Art", "Drawing", "Painting"],
        bio: "Creative art teacher inspiring students to express themselves through art.",
        education: [
            { degree: "Bachelor of Fine Arts", institution: "Dhaka University", year: "2014" }
        ],
        certifications: [
            { name: "Contemporary Art Certification", issuer: "International Art Academy", year: "2017" }
        ],
        availability: { weekdays: "4PM - 8PM", weekends: "10AM - 4PM" },
        rating: 4.7,
        reviewCount: 41,
        studentsCount: 27,
        classesCount: 170,
        isVerified: true,
    },
    {
        name: "তানভীর হোসেন",
        email: "tanveer.hosen@tutor.com",
        phone: "01831890123",
        password: DEFAULT_TUTOR_PASSWORD,
        title: "Music Educator & Performer",
        location: "Dhaka, Bangladesh",
        qualifications: "Bachelor's in Music",
        experience: 7,
        subjects: ["Music", "Vocal", "Instrumental"],
        bio: "Professional musician teaching classical and modern music.",
        education: [
            { degree: "Bachelor of Music", institution: "Dhaka University", year: "2011" }
        ],
        certifications: [
            { name: "Classical Music Certification", issuer: "All India Music Association", year: "2013" }
        ],
        availability: { weekdays: "5PM - 8PM", weekends: "11AM - 5PM" },
        rating: 4.8,
        reviewCount: 47,
        studentsCount: 30,
        classesCount: 188,
        isVerified: true,
    },
    {
        name: "মলিকা রহমান",
        email: "molika.rahman@tutor.com",
        phone: "01731890123",
        password: DEFAULT_TUTOR_PASSWORD,
        title: "Information & Research Specialist",
        location: "Sylhet, Bangladesh",
        qualifications: "Bachelor's in Library Science",
        experience: 5,
        subjects: ["Information Science", "Research Methods", "Academic Writing"],
        bio: "Information specialist helping students develop research and writing skills.",
        education: [
            { degree: "Bachelor of Library Science", institution: "Sylhet University", year: "2016" }
        ],
        certifications: [
            { name: "Research Methods Certification", issuer: "Research Council", year: "2018" }
        ],
        availability: { weekdays: "4PM - 8PM", weekends: "10AM - 3PM" },
        rating: 4.6,
        reviewCount: 36,
        studentsCount: 22,
        classesCount: 148,
        isVerified: true,
    },
    {
        name: "বাসিল আহমেদ",
        email: "basil.ahmed@tutor.com",
        phone: "01832901234",
        password: DEFAULT_TUTOR_PASSWORD,
        title: "Home Economics & Nutrition Expert",
        location: "Rajshahi, Bangladesh",
        qualifications: "Bachelor's in Home Science, B.Ed",
        experience: 6,
        subjects: ["Home Science", "Nutrition", "Domestic Management"],
        bio: "Home economics expert teaching practical life skills and nutrition.",
        education: [
            { degree: "Bachelor of Home Science", institution: "Rajshahi University", year: "2013" }
        ],
        certifications: [
            { name: "Nutrition Certification", issuer: "Nutrition Council", year: "2016" }
        ],
        availability: { weekdays: "4PM - 8PM", weekends: "10AM - 4PM" },
        rating: 4.7,
        reviewCount: 39,
        studentsCount: 25,
        classesCount: 165,
        isVerified: true,
    },
    {
        name: "আমিরা মোস্তফা",
        email: "amira.mostafa@tutor.com",
        phone: "01733901234",
        password: DEFAULT_TUTOR_PASSWORD,
        title: "Health Science & Medical Educator",
        location: "Dhaka, Bangladesh",
        qualifications: "Bachelor's in Public Health",
        experience: 5,
        subjects: ["Health Science", "Biology", "Medical Science"],
        bio: "Health science professional preparing students for medical courses.",
        education: [
            { degree: "Bachelor of Public Health", institution: "BRAC University", year: "2016" }
        ],
        certifications: [
            { name: "Health Science Certification", issuer: "WHO", year: "2018" }
        ],
        availability: { weekdays: "5PM - 8PM", weekends: "10AM - 4PM" },
        rating: 4.8,
        reviewCount: 44,
        studentsCount: 28,
        classesCount: 176,
        isVerified: true,
    },
    {
        name: "রফিকুল ইসলাম",
        email: "rofiqul.islam@tutor.com",
        phone: "01834012345",
        password: DEFAULT_TUTOR_PASSWORD,
        title: "Environmental Science Expert",
        location: "Khulna, Bangladesh",
        qualifications: "Bachelor's in Environmental Science",
        experience: 7,
        subjects: ["Environmental Science", "Ecology", "Conservation"],
        bio: "Environmental educator promoting ecological awareness and sustainability.",
        education: [
            { degree: "Bachelor of Environmental Science", institution: "Khulna University", year: "2012" }
        ],
        certifications: [
            { name: "Environmental Education Certificate", issuer: "UNEP", year: "2015" }
        ],
        availability: { weekdays: "4PM - 8PM", weekends: "10AM - 5PM" },
        rating: 4.9,
        reviewCount: 53,
        studentsCount: 36,
        classesCount: 202,
        isVerified: true,
    },
    {
        name: "সোফিয়া খান",
        email: "sofia.khan@tutor.com",
        phone: "01735012345",
        password: DEFAULT_TUTOR_PASSWORD,
        title: "Psychology & Human Development",
        location: "Dhaka, Bangladesh",
        qualifications: "Bachelor's in Psychology, B.Ed",
        experience: 6,
        subjects: ["Psychology", "Social Science", "Human Development"],
        bio: "Psychology educator helping students understand human behavior and development.",
        education: [
            { degree: "Bachelor of Science", institution: "University of Dhaka", year: "2013" },
            { degree: "Bachelor of Education", institution: "BRAC University", year: "2015" }
        ],
        certifications: [
            { name: "Psychology Teaching Certification", issuer: "Psychology Association", year: "2016" }
        ],
        availability: { weekdays: "4PM - 8PM", weekends: "11AM - 4PM" },
        rating: 4.6,
        reviewCount: 38,
        studentsCount: 24,
        classesCount: 158,
        isVerified: true,
    },
    {
        name: "জামিল আক্তার",
        email: "jamil.akter@tutor.com",
        phone: "01836123456",
        password: DEFAULT_TUTOR_PASSWORD,
        title: "Law & Legal Studies Expert",
        location: "Dhaka, Bangladesh",
        qualifications: "Bachelor's in Law",
        experience: 8,
        subjects: ["Law", "Constitutional Law", "Business Law"],
        bio: "Law educator preparing students for law examinations and legal studies.",
        education: [
            { degree: "Bachelor of Laws", institution: "University of Dhaka", year: "2012" }
        ],
        certifications: [
            { name: "Constitutional Law Certification", issuer: "Bar Council", year: "2015" }
        ],
        availability: { weekdays: "5PM - 8PM", weekends: "10AM - 4PM" },
        rating: 4.8,
        reviewCount: 45,
        studentsCount: 29,
        classesCount: 181,
        isVerified: true,
    },
    {
        name: "নিশান আল হাসনাত",
        email: "nishan.hasnat@tutor.com",
        phone: "01737123456",
        password: DEFAULT_TUTOR_PASSWORD,
        title: "Textile Engineering Specialist",
        location: "Chittagong, Bangladesh",
        qualifications: "Bachelor's in Textile Engineering",
        experience: 5,
        subjects: ["Engineering", "Technology", "Mathematics"],
        bio: "Technical educator teaching engineering and advanced technology concepts.",
        education: [
            { degree: "Bachelor of Science", institution: "Chittagong University", year: "2016" }
        ],
        certifications: [
            { name: "Textile Engineering Certification", issuer: "Textile Association", year: "2018" }
        ],
        availability: { weekdays: "6PM - 9PM", weekends: "1PM - 5PM" },
        rating: 4.7,
        reviewCount: 40,
        studentsCount: 26,
        classesCount: 170,
        isVerified: true,
    },
    {
        name: "গুলশান জামিল",
        email: "gulshan.jamil@tutor.com",
        phone: "01838234567",
        password: DEFAULT_TUTOR_PASSWORD,
        title: "Pharmacy & Chemical Sciences",
        location: "Dhaka, Bangladesh",
        qualifications: "Bachelor's in Pharmacy",
        experience: 6,
        subjects: ["Chemistry", "Biology", "Pharmaceutical Science"],
        bio: "Pharmacy professional teaching medicinal and chemical sciences.",
        education: [
            { degree: "Bachelor of Pharmacy", institution: "University of Dhaka", year: "2014" }
        ],
        certifications: [
            { name: "Pharmaceutical Science Certificate", issuer: "Pharmacy Council", year: "2017" }
        ],
        availability: { weekdays: "5PM - 8PM", weekends: "11AM - 4PM" },
        rating: 4.9,
        reviewCount: 50,
        studentsCount: 32,
        classesCount: 190,
        isVerified: true,
    },
    {
        name: "রুমানা আহমেদ",
        email: "rumana.ahmed@tutor.com",
        phone: "01739234567",
        password: DEFAULT_TUTOR_PASSWORD,
        title: "Senior English & IELTS Teacher",
        location: "Dhaka, Bangladesh",
        qualifications: "Master's in English, TESOL Certified",
        experience: 9,
        subjects: ["English", "IELTS", "Literature"],
        bio: "Senior English educator with international teaching experience and certifications.",
        education: [
            { degree: "Bachelor of Arts", institution: "University of Dhaka", year: "2010" },
            { degree: "Master of Arts", institution: "BRAC University", year: "2013" }
        ],
        certifications: [
            { name: "TESOL Certification", issuer: "TESOL International", year: "2014" },
            { name: "IELTS Trainer Certification", issuer: "British Council", year: "2016" }
        ],
        availability: { weekdays: "3PM - 9PM", weekends: "9AM - 5PM" },
        rating: 4.9,
        reviewCount: 56,
        studentsCount: 39,
        classesCount: 212,
        isVerified: true,
    },
];

async function seedTutors() {
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

        // Hash password for all mock tutors
        const hashedPassword = await bcrypt.hash(DEFAULT_TUTOR_PASSWORD, 10);

        let successCount = 0;
        let skipCount = 0;

        console.log(`\n📚 ${MOCK_TUTORS.length} জন Tutor তৈরি করতে যাচ্ছি...\n`);

        for (const tutorData of MOCK_TUTORS) {
            // Check if tutor already exists
            const existingTutor = await usersCollection.findOne({ email: tutorData.email });

            if (existingTutor) {
                console.log(`⏭️  Skip: ${tutorData.name} - ইতিমধ্যে exist করে`);
                skipCount++;
                continue;
            }

            // Create tutor user
            const tutorUser: IUser = {
                name: tutorData.name,
                email: tutorData.email,
                phone: tutorData.phone,
                password: hashedPassword,
                role: "tutor",
                photoUrl: null,
                status: "active",
                qualifications: tutorData.qualifications,
                experience: tutorData.experience.toString(),
                subjects: tutorData.subjects,
                bio: tutorData.bio,
                location: tutorData.location,
                education: tutorData.education,
                certifications: tutorData.certifications,
                availability: tutorData.availability,
                rating: tutorData.rating,
                reviewCount: tutorData.reviewCount,
                studentsCount: tutorData.studentsCount,
                classesCount: tutorData.classesCount,
                isVerified: tutorData.isVerified,
                createdAt: new Date(),
                updatedAt: new Date(),
            };

            const result = await usersCollection.insertOne(tutorUser);
            console.log(`✅ তৈরি: ${tutorData.name}`);
            successCount++;
        }

        console.log("\n" + "━".repeat(50));
        console.log(`✨ সফল: ${successCount} জন Tutor তৈরি হয়েছে`);
        console.log(`⏭️  Skip: ${skipCount} জন (ইতিমধ্যে exist)}`);
        console.log("━".repeat(50));
        console.log(`🔑 সকল Tutor এর Password: ${DEFAULT_TUTOR_PASSWORD}\n`);

        await client.close();
    } catch (error) {
        console.error("❌ Error seeding tutors:", error);
        process.exit(1);
    }
}

seedTutors();
