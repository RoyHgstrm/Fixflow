import ResetPasswordClientPage from './ResetPasswordClientPage';
import ClientOnly from '../_components/ClientOnly';

export default function ResetPasswordPage() {
  return (
    <ClientOnly>
      <ResetPasswordClientPage />
    </ClientOnly>
  );
}