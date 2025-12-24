// ==================== Review Types ====================

export interface IReview {
    _id?: string;
    tutorId: string;
    studentId: string;
    studentName: string;
    studentPhoto?: string | null;
    rating: number; // 1-5
    comment: string;
    createdAt: Date;
    updatedAt: Date;
}

export interface TutorReviewResponse {
    _id: string;
    student: {
        name: string;
        photo?: string;
    };
    rating: number;
    comment: string;
    createdAt: string;
}

export interface CreateReviewInput {
    tutorId: string;
    rating: number;
    comment: string;
}

export interface UpdateReviewInput {
    rating?: number;
    comment?: string;
}
