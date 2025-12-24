
// ==================== User Projections ====================
export const PUBLIC_USER_PROJECTION = {
    email: 1,
    name: 1,
    phone: 1,
    role: 1,
    photoUrl: 1,
    qualifications: 1,
    experience: 1,
    subjects: 1,
    bio: 1,
    status: 1,
    createdAt: 1,
};

export const TUTOR_LIST_PROJECTION = {
    name: 1,
    email: 1,
    photoUrl: 1,
    qualifications: 1,
    experience: 1,
    subjects: 1,
    bio: 1,
    createdAt: 1,
};

export const TUTOR_DETAIL_PROJECTION = {
    name: 1,
    email: 1,
    phone: 1,
    photoUrl: 1,
    qualifications: 1,
    experience: 1,
    subjects: 1,
    bio: 1,
    createdAt: 1,
};

// ==================== Tuition Projections ====================
export const TUITION_LIST_PROJECTION = {
    _id: 1,
    studentName: 1,
    subject: 1,
    class: 1,
    location: 1,
    budget: 1,
    schedule: 1,
    status: 1,
    applicationsCount: 1,
    createdAt: 1,
};

export const TUITION_DETAIL_PROJECTION = {
    _id: 1,
    studentId: 1,
    studentEmail: 1,
    studentName: 1,
    subject: 1,
    class: 1,
    location: 1,
    budget: 1,
    schedule: 1,
    description: 1,
    requirements: 1,
    status: 1,
    applicationsCount: 1,
    createdAt: 1,
    updatedAt: 1,
};

// ==================== Application Projections ====================
export const APPLICATION_LIST_PROJECTION = {
    _id: 1,
    tuitionId: 1,
    tutorId: 1,
    tutorName: 1,
    tutorEmail: 1,
    tutorPhotoUrl: 1,
    qualifications: 1,
    experience: 1,
    expectedSalary: 1,
    status: 1,
    createdAt: 1,
};

export const APPLICATION_DETAIL_PROJECTION = {
    _id: 1,
    tuitionId: 1,
    tutorId: 1,
    tutorEmail: 1,
    tutorName: 1,
    tutorPhotoUrl: 1,
    qualifications: 1,
    experience: 1,
    expectedSalary: 1,
    coverLetter: 1,
    status: 1,
    createdAt: 1,
    updatedAt: 1,
};

// ==================== Payment Projections ====================
export const PAYMENT_LIST_PROJECTION = {
    _id: 1,
    applicationId: 1,
    tuitionId: 1,
    studentId: 1,
    tutorId: 1,
    amount: 1,
    platformFee: 1,
    tutorEarnings: 1,
    status: 1,
    paidAt: 1,
    createdAt: 1,
};
