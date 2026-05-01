import "dotenv/config";
import prisma from "../src/lib/prisma";

async function test() {
  try {
    console.log("Checking DB connection...");
    console.log("DB URL:", process.env.DATABASE_URL ? "SET" : "MISSING");
    
    const company = await prisma.company.findFirst();
    if (!company) {
      console.log("No company found");
      return;
    }
    console.log("Found company:", company.name);

    const user = await prisma.user.findFirst({ where: { companyId: company.id } });
    if (!user) {
        console.log("No user found");
        return;
    }
    console.log("Found user:", user.name);

    console.log("Attempting to create activity log...");
    if (!(prisma as any).activityLog) {
      console.log("CRITICAL: prisma.activityLog is UNDEFINED");
      return;
    }

    const log = await (prisma as any).activityLog.create({
      data: {
        actionType: "CREATE",
        entityType: "ITEM",
        performedBy: user.id,
        performedByName: user.name,
        companyId: company.id,
      }
    });
    console.log("Log created successfully with ID:", log.id);

    const logs = await (prisma as any).activityLog.findMany({
      where: { companyId: company.id }
    });
    console.log("Current log count for company:", logs.length);
  } catch (err) {
    console.error("Error during test:", err);
  } finally {
    process.exit(0);
  }
}

test();
