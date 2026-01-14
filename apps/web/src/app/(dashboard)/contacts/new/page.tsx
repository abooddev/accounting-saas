'use client';

import { useRouter } from 'next/navigation';
import { useCreateContact } from '@/hooks/use-contacts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ContactForm, type ContactFormData } from '@/components/contacts/contact-form';

export default function NewContactPage() {
  const router = useRouter();
  const createContact = useCreateContact();

  const handleSubmit = async (data: ContactFormData) => {
    await createContact.mutateAsync({
      ...data,
      email: data.email || undefined,
    });
    router.push('/contacts');
  };

  return (
    <div className="max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle>New Contact</CardTitle>
        </CardHeader>
        <CardContent>
          <ContactForm
            onSubmit={handleSubmit}
            isLoading={createContact.isPending}
          />
        </CardContent>
      </Card>
    </div>
  );
}
