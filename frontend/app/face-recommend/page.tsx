import { Suspense } from 'react';
import FaceRecommendClient from './FaceRecommendClient';

export default function FaceRecommendPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <FaceRecommendClient />
    </Suspense>
  );
}
