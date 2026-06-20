import { Injectable } from '@nestjs/common';
import { FinancialType, Prisma } from '@prisma/client';
import { AuditService } from '../common/services/audit.service';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateFinancialEntryDto,
  FinancialQueryDto,
} from './dto/financial.dto';

@Injectable()
export class FinancialsService {
  constructor(
    private prisma: PrismaService,
    private audit: AuditService,
  ) {}

  async create(
    tenantId: string,
    staffId: string,
    dto: CreateFinancialEntryDto,
  ) {
    const entry = await this.prisma.financialEntry.create({
      data: {
        tenantId,
        type: dto.type,
        direction: dto.direction,
        category: dto.category,
        description: dto.description,
        amount: dto.amount,
        receiptUrl: dto.receiptUrl,
        orderId: dto.orderId,
        recordedBy: staffId,
        entryDate: new Date(dto.entryDate),
      },
    });

    await this.audit.log({
      tenantId,
      userId: staffId,
      action: 'FINANCIAL_ENTRY_CREATED',
      entity: 'FinancialEntry',
      entityId: entry.id,
    });

    return entry;
  }

  async findAll(tenantId: string, query: FinancialQueryDto) {
    const where: Prisma.FinancialEntryWhereInput = { tenantId };

    if (query.type) {
      where.type = query.type as FinancialType;
    }
    if (query.from || query.to) {
      where.entryDate = {};
      if (query.from) where.entryDate.gte = new Date(query.from);
      if (query.to) where.entryDate.lte = new Date(query.to);
    }

    return this.prisma.financialEntry.findMany({
      where,
      orderBy: { entryDate: 'desc' },
    });
  }

  async getSummary(tenantId: string) {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const yearStart = new Date(now.getFullYear(), 0, 1);

    const entries = await this.prisma.financialEntry.findMany({
      where: { tenantId },
    });

    const sum = (type: FinancialType, from: Date) =>
      entries
        .filter((e) => e.type === type && e.entryDate >= from)
        .reduce((acc, e) => acc + Number(e.amount), 0);

    const pettyCash = entries
      .filter((e) => e.type === FinancialType.PETTY_CASH)
      .reduce((acc, e) => {
        const amt = Number(e.amount);
        return e.direction === 'OUT' ? acc - amt : acc + amt;
      }, 0);

    const incomeMonth = sum(FinancialType.INCOME, monthStart);
    const expenditureMonth = sum(FinancialType.EXPENDITURE, monthStart);
    const incomeYear = sum(FinancialType.INCOME, yearStart);
    const expenditureYear = sum(FinancialType.EXPENDITURE, yearStart);

    const monthlyTrend = Array.from({ length: 6 }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
      const end = new Date(d.getFullYear(), d.getMonth() + 1, 0);
      const label = d.toLocaleString('default', { month: 'short' });
      const income = entries
        .filter(
          (e) =>
            e.type === FinancialType.INCOME &&
            e.entryDate >= d &&
            e.entryDate <= end,
        )
        .reduce((a, e) => a + Number(e.amount), 0);
      const expenditure = entries
        .filter(
          (e) =>
            e.type === FinancialType.EXPENDITURE &&
            e.entryDate >= d &&
            e.entryDate <= end,
        )
        .reduce((a, e) => a + Number(e.amount), 0);
      return { month: label, income, expenditure };
    });

    return {
      incomeMonth,
      expenditureMonth,
      netMonth: incomeMonth - expenditureMonth,
      incomeYear,
      expenditureYear,
      netYear: incomeYear - expenditureYear,
      pettyCashBalance: pettyCash,
      monthlyTrend,
    };
  }
}
