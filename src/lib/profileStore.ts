// Basit bir state management için
export interface ProfileData {
    userType: 'freelancer' | 'employer' | null;
    formData: {
        name: string;
        email: string;
        phone: string;
        location: string;
        companyName: string;
        companySize: string;
        jobTitle: string;
        hourlyRate: string;
        skills: string;
        bio: string;
    };
}

// LocalStorage için yardımcı fonksiyonlar
export const saveProfileToStorage = (profile: ProfileData) => {
    if (typeof window !== 'undefined') {
        localStorage.setItem('talentConnect_profile', JSON.stringify(profile));
    }
};

export const getProfileFromStorage = (): ProfileData | null => {
    if (typeof window !== 'undefined') {
        const saved = localStorage.getItem('talentConnect_profile');
        return saved ? JSON.parse(saved) : null;
    }
    return null;
};

export const clearProfileStorage = () => {
    if (typeof window !== 'undefined') {
        localStorage.removeItem('talentConnect_profile');
    }
};