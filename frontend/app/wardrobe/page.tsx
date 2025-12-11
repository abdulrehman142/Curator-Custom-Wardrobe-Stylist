import { Suspense } from 'react';
import WardrobeClient from './WardrobeClient';

export default function WardrobePage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <WardrobeClient />
    </Suspense>
  );
}
