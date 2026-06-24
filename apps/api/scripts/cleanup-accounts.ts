/**
 * One-time script to delete all non-admin user accounts and cascade tenant data.
 *
 * Usage (from apps/api):
 *   pnpm exec ts-node scripts/cleanup-accounts.ts --dry-run
 *   pnpm exec ts-node scripts/cleanup-accounts.ts
 *
 * Protected: SUPER_ADMIN role and emails in PROTECTED_EMAILS.
 */
import { PrismaClient, UserRole } from '@prisma/client';

const PROTECTED_EMAILS = ['admin@stitchhub.com'];

const dryRun = process.argv.includes('--dry-run');
const prisma = new PrismaClient();

type UserRow = {
  id: string;
  email: string;
  role: UserRole;
  tenantId: string | null;
};

async function main() {
  const users = await prisma.user.findMany({
    select: {
      id: true,
      email: true,
      role: true,
      tenantId: true,
    },
  });

  const toDelete = users.filter(
    (u: UserRow) =>
      u.role !== UserRole.SUPER_ADMIN &&
      !PROTECTED_EMAILS.includes(u.email.toLowerCase()),
  );

  const protectedUsers = users.filter(
    (u: UserRow) => !toDelete.some((d: UserRow) => d.id === u.id),
  );

  console.log(`Found ${users.length} users total`);
  console.log(`Protected: ${protectedUsers.length}`);
  protectedUsers.forEach((u: UserRow) =>
    console.log(`  KEEP ${u.email} (${u.role})`),
  );
  console.log(`To delete: ${toDelete.length}`);

  const tenantIds = [
    ...new Set(
      toDelete
        .map((u: UserRow) => u.tenantId)
        .filter((id): id is string => Boolean(id)),
    ),
  ];

  if (dryRun) {
    toDelete.forEach((u: UserRow) =>
      console.log(`  [dry-run] would delete user ${u.email} (${u.id})`),
    );
    tenantIds.forEach((id: string) =>
      console.log(`  [dry-run] would delete tenant ${id} and related data`),
    );
    console.log('Dry run complete — no changes made.');
    return;
  }

  for (const tenantId of tenantIds) {
    console.log(`Deleting tenant ${tenantId}...`);
    await prisma.tenant.delete({ where: { id: tenantId } });
  }

  const orphanUsers = toDelete.filter((u: UserRow) => !u.tenantId);
  for (const user of orphanUsers) {
    console.log(`Deleting orphan user ${user.email}...`);
    await prisma.user.delete({ where: { id: user.id } });
  }

  console.log('Cleanup complete.');
}

main()
  .catch((err: unknown) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
