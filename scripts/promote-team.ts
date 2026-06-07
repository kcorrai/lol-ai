import { PrismaClient } from "@prisma/client";

const EMAIL = "yanlizcakaan@gmail.com";

async function main() {
  const prisma = new PrismaClient();
  try {
    const user = await prisma.user.findUnique({
      where: { email: EMAIL },
      select: { id: true, subscription: { select: { plan: true, status: true } } },
    });

    if (!user) {
      console.error("User not found:", EMAIL);
      process.exit(1);
    }

    console.log("Current subscription:", user.subscription);

    await prisma.subscription.upsert({
      where: { userId: user.id },
      update: { plan: "team", status: "active" },
      create: { userId: user.id, plan: "team", status: "active" },
    });

    console.log("✓ Plan updated to 'team' for", EMAIL);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((err) => { console.error(err); process.exit(1); });
