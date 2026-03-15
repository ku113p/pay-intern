import { LoginForm } from '../components/auth/LoginForm';

export function LoginPage() {
  return (
    <div className="max-w-md mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Sign in</h1>
      <LoginForm />
    </div>
  );
}
