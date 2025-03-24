import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ShieldAlert } from 'lucide-react';

export default function Unauthorized() {
  const navigate = useNavigate();

  return (
    <div className="flex min-h-screen items-center justify-center bg-supply-50">
      <div className="mx-auto max-w-md text-center">
        <ShieldAlert className="mx-auto h-12 w-12 text-red-500" />
        <h1 className="mt-6 text-3xl font-bold tracking-tight text-supply-900">
          Access Denied
        </h1>
        <p className="mt-4 text-base text-supply-600">
          You don't have permission to access this page. Please contact your administrator
          if you believe this is a mistake.
        </p>
        <div className="mt-8 flex justify-center gap-4">
          <Button
            onClick={() => navigate(-1)}
            variant="outline"
          >
            Go Back
          </Button>
          <Button
            onClick={() => navigate('/')}
            variant="default"
          >
            Return Home
          </Button>
        </div>
      </div>
    </div>
  );
}
