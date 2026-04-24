import pkg from 'pg';
const { Pool } = pkg;
import bcrypt from "bcryptjs";
import "dotenv/config";

const SOURCE_URL = "postgres://dcdacf0eb3c643e41841da80d14f3074ceaaf138884b4013a42a00ee617c3864:sk_CtFnWtZGMbiXsfEPsc7E3@db.prisma.io:5432/postgres?sslmode=require";

async function fixRemoteLogin() {
  const username = "aniket";
  const password = "admin123";
  const hashedPassword = await bcrypt.hash(password, 10);
  const companyId = "ss-cuttings-id";

  console.log(`Setting up user [${username}] in PRODUCTION...`);
  const pool = new Pool({ connectionString: SOURCE_URL });
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // Ensure user exists and has correct password/company
    const check = await client.query('SELECT id FROM "User" WHERE username = $1', [username]);
    
    if (check.rows.length > 0) {
      await client.query(
        'UPDATE "User" SET password = $1, role = \'OWNER\', "companyId" = $2 WHERE username = $3',
        [hashedPassword, companyId, username]
      );
    } else {
      await client.query(
        'INSERT INTO "User" (id, username, password, name, role, "companyId") VALUES (gen_random_uuid(), $1, $2, $3, \'OWNER\', $4)',
        [username, hashedPassword, 'Aniket Gupta', companyId]
      );
    }

    await client.query('COMMIT');
    console.log(`✅ Production user [${username}] is now ready with password [${password}].`);
    console.log(`   Linked to Company: ${companyId}`);

  } catch (error) {
    await client.query('ROLLBACK');
    console.error("Failed to fix remote login:", error);
  } finally {
    client.release();
    await pool.end();
  }
}

fixRemoteLogin();
