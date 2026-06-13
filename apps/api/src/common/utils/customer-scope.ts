import { ForbiddenException } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { JwtPayload } from '../../auth/interfaces/jwt-payload.interface';
import { PrismaService } from '../../prisma/prisma.service';

export async function resolveCustomerId(
  prisma: PrismaService,
  user: JwtPayload,
): Promise<string | null> {
  if (user.role !== UserRole.CUSTOMER) return null;

  const customer = await prisma.customer.findUnique({
    where: { userId: user.sub },
    select: { id: true },
  });

  if (!customer) {
    throw new ForbiddenException('No customer profile linked to this account');
  }

  return customer.id;
}

export async function assertCustomerResource(
  prisma: PrismaService,
  user: JwtPayload,
  customerId: string,
) {
  const ownId = await resolveCustomerId(prisma, user);
  if (ownId && ownId !== customerId) {
    throw new ForbiddenException('Access denied');
  }
}
