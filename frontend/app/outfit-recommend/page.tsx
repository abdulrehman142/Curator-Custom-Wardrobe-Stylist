import { Suspense } from 'react';
import OutfitRecommendClient from './OutfitRecommendClient';

export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

export default function OutfitRecommendPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <OutfitRecommendClient />
    </Suspense>
  );
}
