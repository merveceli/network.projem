import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();

        // Burada veritabanına kaydetme işlemi yapılacak
        // Supabase, MongoDB vs.

        console.log('API kayıt:', body);

        // Başarılı yanıt
        return NextResponse.json({
            success: true,
            message: 'Profil başarıyla oluşturuldu',
            data: body,
            redirectTo: body.userType === 'freelancer' ? '/profile/freelancer' : '/profile/employer'
        });

    } catch (error) {
        console.error('Profil oluşturma hatası:', error);
        return NextResponse.json(
            { success: false, error: 'Profil oluşturulamadı' },
            { status: 500 }
        );
    }
}