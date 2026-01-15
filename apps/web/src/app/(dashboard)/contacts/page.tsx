'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useContacts, useDeleteContact } from '@/hooks/use-contacts';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Plus,
  Pencil,
  Trash2,
  Search,
  Users,
  Building2,
  UserCheck,
  Loader2,
  AlertTriangle,
} from 'lucide-react';
import type { Contact } from '@accounting/shared';

const getContactTypeBadge = (type: string) => {
  switch (type) {
    case 'customer':
      return {
        className: 'badge-success',
        icon: Users,
        label: 'Customer',
      };
    case 'supplier':
      return {
        className: 'badge-warning',
        icon: Building2,
        label: 'Supplier',
      };
    case 'both':
      return {
        className: 'bg-[hsl(var(--cedar))]/10 text-[hsl(var(--cedar))] border border-[hsl(var(--cedar))]/20',
        icon: UserCheck,
        label: 'Both',
      };
    default:
      return {
        className: 'bg-muted text-muted-foreground border border-border',
        icon: Users,
        label: type,
      };
  }
};

export default function ContactsPage() {
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [deleteContact, setDeleteContact] = useState<Contact | null>(null);

  const { data: contacts, isLoading } = useContacts({
    search: search || undefined,
    type: typeFilter === 'all' ? undefined : typeFilter as 'supplier' | 'customer' | 'both',
  });

  const deleteMutation = useDeleteContact();

  const handleDelete = async () => {
    if (deleteContact) {
      await deleteMutation.mutateAsync(deleteContact.id);
      setDeleteContact(null);
    }
  };

  return (
    <div className="space-y-6 animate-slide-up">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold text-[hsl(var(--charcoal))]">
            Contacts
          </h1>
          <p className="mt-1 text-muted-foreground">
            Manage your customers and suppliers
          </p>
        </div>
        <Link href="/contacts/new">
          <button className="btn-cedar flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Add Contact
          </button>
        </Link>
      </div>

      {/* Filters Card */}
      <div className="card-premium p-4">
        <div className="flex gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search contacts..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 input-warm"
            />
          </div>
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-40 border-2 border-border hover:border-[hsl(var(--cedar))]/50 transition-colors">
              <SelectValue placeholder="All types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All types</SelectItem>
              <SelectItem value="supplier">Suppliers</SelectItem>
              <SelectItem value="customer">Customers</SelectItem>
              <SelectItem value="both">Both</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Contacts Table */}
      <div className="card-premium overflow-hidden">
        <table className="table-warm">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left py-4 px-4 text-sm font-semibold text-muted-foreground bg-muted/30">
                Name
              </th>
              <th className="text-left py-4 px-4 text-sm font-semibold text-muted-foreground bg-muted/30">
                Type
              </th>
              <th className="text-left py-4 px-4 text-sm font-semibold text-muted-foreground bg-muted/30">
                Phone
              </th>
              <th className="text-left py-4 px-4 text-sm font-semibold text-muted-foreground bg-muted/30">
                Email
              </th>
              <th className="text-left py-4 px-4 text-sm font-semibold text-muted-foreground bg-muted/30">
                Payment Terms
              </th>
              <th className="text-left py-4 px-4 text-sm font-semibold text-muted-foreground bg-muted/30 w-24">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={6} className="text-center py-12">
                  <div className="flex flex-col items-center gap-3">
                    <Loader2 className="h-8 w-8 animate-spin text-[hsl(var(--cedar))]" />
                    <span className="text-muted-foreground">Loading contacts...</span>
                  </div>
                </td>
              </tr>
            ) : contacts?.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center py-12">
                  <div className="flex flex-col items-center gap-3">
                    <Users className="h-12 w-12 text-muted-foreground/50" />
                    <div>
                      <p className="font-medium text-foreground">No contacts found</p>
                      <p className="text-sm text-muted-foreground">
                        Add your first contact to get started
                      </p>
                    </div>
                    <Link href="/contacts/new">
                      <button className="btn-gold flex items-center gap-2 mt-2">
                        <Plus className="h-4 w-4" />
                        Add Contact
                      </button>
                    </Link>
                  </div>
                </td>
              </tr>
            ) : (
              contacts?.map((contact, index) => {
                const typeBadge = getContactTypeBadge(contact.type);
                const TypeIcon = typeBadge.icon;
                return (
                  <tr
                    key={contact.id}
                    className="border-b border-border/50 hover:bg-muted/30 transition-colors animate-slide-up"
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    <td className="py-4 px-4">
                      <div>
                        <div className="font-medium text-[hsl(var(--charcoal))]">
                          {contact.name}
                        </div>
                        {contact.nameAr && (
                          <div className="text-sm text-muted-foreground" dir="rtl">
                            {contact.nameAr}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${typeBadge.className}`}
                      >
                        <TypeIcon className="h-3 w-3" />
                        {typeBadge.label}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-muted-foreground">
                      {contact.phone || '-'}
                    </td>
                    <td className="py-4 px-4 text-muted-foreground">
                      {contact.email || '-'}
                    </td>
                    <td className="py-4 px-4">
                      <span className="inline-flex items-center px-2 py-0.5 rounded bg-muted text-sm text-muted-foreground">
                        {contact.paymentTermsDays === 0
                          ? 'Cash'
                          : `Net ${contact.paymentTermsDays}`}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex gap-1">
                        <Link href={`/contacts/${contact.id}`}>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="hover:bg-[hsl(var(--cedar))]/10 hover:text-[hsl(var(--cedar))]"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                        </Link>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setDeleteContact(contact)}
                          className="hover:bg-[hsl(var(--terracotta))]/10 hover:text-[hsl(var(--terracotta))]"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteContact} onOpenChange={() => setDeleteContact(null)}>
        <DialogContent className="card-premium border-[hsl(var(--terracotta))]/20">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-[hsl(var(--terracotta))]/10">
                <AlertTriangle className="h-5 w-5 text-[hsl(var(--terracotta))]" />
              </div>
              <DialogTitle className="font-display text-xl">Delete Contact</DialogTitle>
            </div>
            <DialogDescription className="pt-2">
              Are you sure you want to delete &quot;{deleteContact?.name}&quot;? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setDeleteContact(null)}
              className="border-2 hover:bg-muted"
            >
              Cancel
            </Button>
            <button
              onClick={handleDelete}
              disabled={deleteMutation.isPending}
              className="bg-[hsl(var(--terracotta))] text-white font-semibold px-6 py-2 rounded-lg transition-all duration-200 hover:bg-[hsl(var(--terracotta))]/90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {deleteMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4" />
                  Delete
                </>
              )}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
