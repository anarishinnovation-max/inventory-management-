import pkg from 'pg';
const { Pool } = pkg;
import "dotenv/config";

const SOURCE_URL = "postgres://dcdacf0eb3c643e41841da80d14f3074ceaaf138884b4013a42a00ee617c3864:sk_CtFnWtZGMbiXsfEPsc7E3@db.prisma.io:5432/postgres?sslmode=require";

async function checkRemoteUsers() {
  console.log("Checking remote database for users...");
  const pool = new Pool({ connectionString: SOURCE_URL });
  const client = await pool.connect();

  try {
    const users = await client.query('SELECT * FROM "User"');
    console.log(`Total users in remote: ${users.rows.length}`);
    users.rows.forEach((user, index) => {
        console.log(`${index + 1}. [${user.username}] ${user.name} (Role: ${user.role}, Company: ${user.companyId})`);
        console.log(`   Password: ${user.password}`);
    });

  } catch (error) {
    console.error("Error fetching remote users:", error);
  } finally {
    client.release();
    await pool.end();
  }
}

checkRemoteUsers();
