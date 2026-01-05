import { Suspense } from 'react';
import DocumentUpload from '../../components/DocumentUpload';

export default function DocumentsPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <div className="min-h-screen bg-gray-50">
        <DocumentUpload />
      </div>
    </Suspense>
  );
}
