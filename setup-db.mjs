import pg from 'pg';
import fs from 'fs';
import * as dotenv from 'dotenv';

const { Pool } = pg;
dotenv.config({ path: '.env.local' });

async function runMigration() {
    console.log('Neon vertabanına bağlanılıyor...');
    
    // Add ?sslmode=require if using connection string
    const connectionString = process.env.DATABASE_URL;
    
    const pool = new Pool({
        connectionString,
        ssl: { rejectUnauthorized: false }
    });
    
    try {
        console.log('Schema dosyası okunuyor...');
        const schema = fs.readFileSync('neon_schema.sql', 'utf8');
        
        console.log('Tablolar oluşturuluyor (Bu işlem birkaç saniye sürebilir)...');
        await pool.query(schema);
        
        console.log('✅ Veritabanı tabloları başarıyla oluşturuldu!');
    } catch (error) {
        console.error('❌ Hata oluştu:', error);
    } finally {
        await pool.end();
    }
}

runMigration();
