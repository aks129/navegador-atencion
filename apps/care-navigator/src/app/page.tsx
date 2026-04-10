import { redirect } from 'next/navigation';

// Fallback for when middleware locale redirect doesn't fire at root
export default function RootPage() {
  redirect('/es/patient/launch');
}
