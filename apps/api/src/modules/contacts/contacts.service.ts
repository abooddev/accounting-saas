import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { eq, and, isNull, or, ilike } from 'drizzle-orm';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { DRIZZLE } from '../../database/database.module';
import * as schema from '../../database/schema';
import { contacts, Contact, NewContact } from '../../database/schema';
import { CreateContactDto } from './dto/create-contact.dto';
import { UpdateContactDto } from './dto/update-contact.dto';

interface ContactFilters {
  type?: 'supplier' | 'customer' | 'both';
  search?: string;
  isActive?: boolean;
}

@Injectable()
export class ContactsService {
  constructor(
    @Inject(DRIZZLE) private db: NodePgDatabase<typeof schema>,
  ) {}

  async create(tenantId: string, dto: CreateContactDto): Promise<Contact> {
    const data: NewContact = {
      tenantId,
      type: dto.type,
      name: dto.name,
      nameAr: dto.nameAr,
      phone: dto.phone,
      email: dto.email,
      address: dto.address,
      taxNumber: dto.taxNumber,
      paymentTermsDays: dto.paymentTermsDays ?? 0,
      creditLimit: dto.creditLimit?.toString() ?? '0',
    };

    if (dto.notes) {
      data.notes = dto.notes;
    }

    const [contact] = await this.db.insert(contacts).values(data).returning();
    return contact;
  }

  async findAll(tenantId: string, filters?: ContactFilters): Promise<Contact[]> {
    const conditions = [
      eq(contacts.tenantId, tenantId),
      isNull(contacts.deletedAt),
    ];

    if (filters?.type) {
      conditions.push(eq(contacts.type, filters.type));
    }

    if (filters?.isActive !== undefined) {
      conditions.push(eq(contacts.isActive, filters.isActive));
    }

    if (filters?.search) {
      conditions.push(
        or(
          ilike(contacts.name, `%${filters.search}%`),
          ilike(contacts.nameAr ?? '', `%${filters.search}%`),
          ilike(contacts.phone ?? '', `%${filters.search}%`),
          ilike(contacts.email ?? '', `%${filters.search}%`),
        )!,
      );
    }

    return this.db
      .select()
      .from(contacts)
      .where(and(...conditions))
      .orderBy(contacts.name);
  }

  async findById(tenantId: string, id: string): Promise<Contact> {
    const [contact] = await this.db
      .select()
      .from(contacts)
      .where(
        and(
          eq(contacts.id, id),
          eq(contacts.tenantId, tenantId),
          isNull(contacts.deletedAt),
        ),
      )
      .limit(1);

    if (!contact) {
      throw new NotFoundException('Contact not found');
    }

    return contact;
  }

  async update(tenantId: string, id: string, dto: UpdateContactDto): Promise<Contact> {
    await this.findById(tenantId, id);

    const updateData: Partial<NewContact> = {
      updatedAt: new Date(),
    };

    if (dto.type !== undefined) updateData.type = dto.type;
    if (dto.name !== undefined) updateData.name = dto.name;
    if (dto.nameAr !== undefined) updateData.nameAr = dto.nameAr;
    if (dto.phone !== undefined) updateData.phone = dto.phone;
    if (dto.email !== undefined) updateData.email = dto.email;
    if (dto.address !== undefined) updateData.address = dto.address;
    if (dto.taxNumber !== undefined) updateData.taxNumber = dto.taxNumber;
    if (dto.paymentTermsDays !== undefined) updateData.paymentTermsDays = dto.paymentTermsDays;
    if (dto.creditLimit !== undefined) updateData.creditLimit = dto.creditLimit.toString();
    if (dto.notes !== undefined) updateData.notes = dto.notes;
    if (dto.isActive !== undefined) updateData.isActive = dto.isActive;

    const [contact] = await this.db
      .update(contacts)
      .set(updateData)
      .where(and(eq(contacts.id, id), eq(contacts.tenantId, tenantId)))
      .returning();

    return contact;
  }

  async delete(tenantId: string, id: string): Promise<void> {
    await this.findById(tenantId, id);

    await this.db
      .update(contacts)
      .set({ deletedAt: new Date(), updatedAt: new Date() })
      .where(and(eq(contacts.id, id), eq(contacts.tenantId, tenantId)));
  }
}
