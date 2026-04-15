import pool from "./src/lib/db";

async function seedRacks() {
  const racks = [
    { name: "A-01", zone: "A", shelf: "1", bin: "1" },
    { name: "A-02", zone: "A", shelf: "1", bin: "2" },
    { name: "A-03", zone: "A", shelf: "1", bin: "3" },
    { name: "A-04", zone: "A", shelf: "2", bin: "1" },
    { name: "A-05", zone: "A", shelf: "2", bin: "2" },
    { name: "B-01", zone: "B", shelf: "1", bin: "1" },
    { name: "B-02", zone: "B", shelf: "1", bin: "2" },
    { name: "B-03", zone: "B", shelf: "1", bin: "3" },
    { name: "C-01", zone: "C", shelf: "1", bin: "1" },
    { name: "C-02", zone: "C", shelf: "1", bin: "2" },
  ];

  try {
    console.log("Seeding racks...");
    for (const rack of racks) {
      await pool.query(`
        INSERT INTO "Rack" ("rackName", zone, shelf, bin)
        VALUES ($1, $2, $3, $4)
        ON CONFLICT ("rackName") DO NOTHING
      `, [rack.name, rack.zone, rack.shelf, rack.bin]);
    }
    console.log("Racks seeded successfully.");
  } catch (err) {
    console.error("Error seeding racks:", err);
  } finally {
    process.exit();
  }
}

seedRacks();
