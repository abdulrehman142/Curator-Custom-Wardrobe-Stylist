import { Suspense } from 'react';
import TestS3UploadClient from './TestS3UploadClient';

export default function TestS3UploadPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <TestS3UploadClient />
    </Suspense>
  );
}
