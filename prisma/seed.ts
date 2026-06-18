import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.warn("Seeding database...");

  // Add seed data here

  console.warn("Seed complete.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => {
    void prisma.$disconnect();
  });
