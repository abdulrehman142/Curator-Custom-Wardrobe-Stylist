'use client';

import { useRouter } from 'next/navigation';
import Button from '@/components/Button';
import Card from '@/components/Card';
import { Upload, Shirt, Sparkles, TrendingUp, ShoppingBag, BookOpen, Home, User } from 'lucide-react';

export default function HomeClient() {
  const router = useRouter();

  const features = [
    {
      icon: <Shirt className="w-8 h-8" />,
      title: 'Virtual Wardrobe',
      description: 'Catalog and organize all your clothing items with photos, descriptions, and smart categorization.',
      href: '/wardrobe',
    },
    {
      icon: <User className="w-8 h-8" />,
      title: 'Face Analysis',
      description: 'Upload your photo to get personalized clothing recommendations based on your skin tone and face shape.',
      href: '/face-recommend',
    },
    {
      icon: <Sparkles className="w-8 h-8" />,
      title: 'Style Quiz',
      description: 'Discover your personal style preferences and get personalized recommendations based on your taste.',
      href: '/style-quiz',
    },
    {
      icon: <TrendingUp className="w-8 h-8" />,
      title: 'Outfit Recommendations',
      description: 'Get AI-powered outfit suggestions based on your wardrobe, occasion, weather, and style preferences.',
      href: '/outfits',
    },
    {
      icon: <BookOpen className="w-8 h-8" />,
      title: 'Styling Tips',
      description: 'Learn color coordination, pattern mixing, and styling techniques tailored to your body type.',
      href: '/styling-tips',
    },
    {
      icon: <ShoppingBag className="w-8 h-8" />,
      title: 'Shopping Assistant',
      description: 'Find gap items to complete your wardrobe and discover pieces that match your style.',
      href: '/shopping',
    },
    {
      icon: <TrendingUp className="w-8 h-8" />,
      title: 'Trends & Inspiration',
      description: 'Stay updated with current fashion trends aligned with your personal style preferences.',
      href: '/trends',
    },
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="px-3 md:px-4 lg:px-8 py-12 md:py-24 lg:py-32">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-3xl md:text-5xl lg:text-6xl font-display mb-4 md:mb-6 text-[#231212] dark:text-white">
            Your Personal Curator
          </h1>
          <p className="text-base md:text-lg lg:text-xl font-body mb-8 md:mb-12 text-black dark:text-white opacity-80 max-w-2xl mx-auto">
            Build, organize, and style your wardrobe with AI-powered recommendations. 
            Discover your personal style and create outfits that make you feel confident.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button onClick={() => router.push('/upload')}>
              <span className="flex items-center gap-2">
                <Upload className="w-4 h-4" />
                Upload Your First Item
              </span>
            </Button>
            <Button variant="secondary" onClick={() => router.push('/style-quiz')}>
              Take Style Quiz
            </Button>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="px-3 md:px-4 lg:px-8 py-12 md:py-24">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-2xl md:text-4xl font-display text-center mb-8 md:mb-16 text-[#231212] dark:text-white">
            Everything You Need to Style Your Wardrobe
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 lg:gap-8">
            {features.map((feature, index) => (
              <Card
                key={index}
                className="hover:scale-105 transition-transform duration-smooth"
                onClick={() => router.push(feature.href)}
              >
                <div className="flex flex-col items-center text-center">
                  <div className="mb-4 text-[#231212] dark:text-white">
                    {feature.icon}
                  </div>
                  <h3 className="text-xl md:text-2xl font-display mb-2 text-[#231212] dark:text-white">
                    {feature.title}
                  </h3>
                  <p className="text-sm md:text-base font-body text-black dark:text-white opacity-70">
                    {feature.description}
                  </p>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="px-3 md:px-4 lg:px-8 py-12 md:py-24 bg-white dark:bg-black">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-2xl md:text-4xl font-display mb-4 md:mb-6 text-[#231212] dark:text-white">
            Ready to Transform Your Wardrobe?
          </h2>
          <p className="text-base md:text-lg font-body mb-8 text-black dark:text-white opacity-80">
            Join thousands of users who are discovering their personal style and building wardrobes they love.
          </p>
          <Button onClick={() => router.push('/upload')}>
            Get Started Now
          </Button>
        </div>
      </section>
    </div>
  );
}

