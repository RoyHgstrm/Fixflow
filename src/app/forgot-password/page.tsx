import ForgotPasswordClientPage from './ForgotPasswordClientPage';
import ClientOnly from '../_components/ClientOnly';

export default function ForgotPasswordPage() {
  return (
    <ClientOnly>
      <ForgotPasswordClientPage />
    </ClientOnly>
  );
}