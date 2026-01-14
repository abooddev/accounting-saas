'use client';

import { useRouter, useParams } from 'next/navigation';
import { useContact, useUpdateContact } from '@/hooks/use-contacts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ContactForm, type ContactFormData } from '@/components/contacts/contact-form';

export default function EditContactPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const { data: contact, isLoading } = useContact(id);
  const updateContact = useUpdateContact();

  const handleSubmit = async (data: ContactFormData) => {
    await updateContact.mutateAsync({
      id,
      data: {
        ...data,
        email: data.email || undefined,
      },
    });
    router.push('/contacts');
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!contact) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        Contact not found
      </div>
    );
  }

  return (
    <div className="max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle>Edit Contact</CardTitle>
        </CardHeader>
        <CardContent>
          <ContactForm
            contact={contact}
            onSubmit={handleSubmit}
            isLoading={updateContact.isPending}
          />
        </CardContent>
      </Card>
    </div>
  );
}
