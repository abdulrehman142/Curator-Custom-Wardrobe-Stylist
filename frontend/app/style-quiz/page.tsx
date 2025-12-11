'use client';

import { useState } from 'react';
import Card from '@/components/Card';
import Button from '@/components/Button';
import { ArrowRight, Check } from 'lucide-react';

interface QuizQuestion {
  id: string;
  question: string;
  options: { value: string; label: string; description?: string }[];
}

const quizQuestions: QuizQuestion[] = [
  {
    id: 'style',
    question: 'What best describes your personal style?',
    options: [
      { value: 'casual', label: 'Casual', description: 'Comfortable, relaxed, everyday wear' },
      { value: 'formal', label: 'Formal', description: 'Professional, polished, business attire' },
      { value: 'bohemian', label: 'Bohemian', description: 'Free-spirited, eclectic, artistic' },
      { value: 'minimalist', label: 'Minimalist', description: 'Clean lines, neutral colors, simple' },
      { value: 'trendy', label: 'Trendy', description: 'Fashion-forward, current styles' },
      { value: 'classic', label: 'Classic', description: 'Timeless, traditional, elegant' },
    ],
  },
  {
    id: 'body_type',
    question: 'What best describes your body type?',
    options: [
      { value: 'hourglass', label: 'Hourglass', description: 'Balanced shoulders and hips, defined waist' },
      { value: 'pear', label: 'Pear', description: 'Narrower shoulders, wider hips' },
      { value: 'apple', label: 'Apple', description: 'Broader shoulders, narrower hips' },
      { value: 'rectangle', label: 'Rectangle', description: 'Straight, balanced proportions' },
      { value: 'inverted_triangle', label: 'Inverted Triangle', description: 'Broad shoulders, narrow hips' },
    ],
  },
  {
    id: 'color_preference',
    question: 'What colors do you gravitate towards?',
    options: [
      { value: 'neutrals', label: 'Neutrals', description: 'Black, white, gray, beige' },
      { value: 'warm', label: 'Warm Tones', description: 'Reds, oranges, yellows, warm browns' },
      { value: 'cool', label: 'Cool Tones', description: 'Blues, greens, purples, cool grays' },
      { value: 'pastels', label: 'Pastels', description: 'Soft, light, muted colors' },
      { value: 'bold', label: 'Bold & Bright', description: 'Vibrant, saturated colors' },
      { value: 'mixed', label: 'Mixed', description: 'I like variety' },
    ],
  },
  {
    id: 'lifestyle',
    question: 'What best describes your lifestyle needs?',
    options: [
      { value: 'work', label: 'Work Focus', description: 'Professional attire is my priority' },
      { value: 'casual', label: 'Casual Daily', description: 'Everyday comfort and style' },
      { value: 'events', label: 'Events & Social', description: 'I attend many social gatherings' },
      { value: 'sports', label: 'Active Lifestyle', description: 'Athletic and active wear' },
      { value: 'mixed', label: 'Mixed', description: 'A bit of everything' },
    ],
  },
  {
    id: 'season',
    question: 'What season do you prefer dressing for?',
    options: [
      { value: 'spring', label: 'Spring', description: 'Light layers, fresh colors' },
      { value: 'summer', label: 'Summer', description: 'Light fabrics, bright colors' },
      { value: 'fall', label: 'Fall', description: 'Cozy layers, warm tones' },
      { value: 'winter', label: 'Winter', description: 'Warm layers, rich colors' },
      { value: 'all', label: 'All Seasons', description: 'I adapt to all seasons' },
    ],
  },
];

export default function StyleQuizPage() {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [completed, setCompleted] = useState(false);

  const handleAnswer = (questionId: string, value: string) => {
    setAnswers({ ...answers, [questionId]: value });
  };

  const handleNext = () => {
    if (currentQuestion < quizQuestions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    } else {
      // Quiz completed
      setCompleted(true);
      // Save preferences to localStorage
      localStorage.setItem('stylePreferences', JSON.stringify(answers));
    }
  };

  const handlePrevious = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
    }
  };

  const currentQ = quizQuestions[currentQuestion];
  const selectedAnswer = answers[currentQ.id];
  const canProceed = selectedAnswer !== undefined;

  if (completed) {
    return (
      <div className="max-w-4xl mx-auto px-3 md:px-4 lg:px-8 py-12 md:py-24">
        <Card className="text-center">
          <div className="mb-6">
            <div className="w-16 h-16 bg-[#231212] dark:bg-white rounded-full flex items-center justify-center mx-auto mb-4">
              <Check className="w-8 h-8 text-white dark:text-black" />
            </div>
            <h2 className="text-3xl md:text-4xl font-display mb-4 text-[#231212] dark:text-white">
              Quiz Complete!
            </h2>
            <p className="text-base md:text-lg font-body text-black dark:text-white opacity-70 mb-8">
              We've saved your style preferences. Your recommendations will now be personalized to your taste.
            </p>
          </div>
          <div className="space-y-4">
            <div className="text-left space-y-3">
              {Object.entries(answers).map(([questionId, answer]) => {
                const question = quizQuestions.find(q => q.id === questionId);
                const option = question?.options.find(o => o.value === answer);
                return (
                  <div key={questionId} className="border-b-2 border-white dark:border-white pb-3">
                    <p className="text-sm font-body text-black dark:text-white opacity-50 mb-1">
                      {question?.question}
                    </p>
                    <p className="text-base font-body font-semibold text-[#231212] dark:text-white">
                      {option?.label}
                    </p>
                  </div>
                );
              })}
            </div>
            <div className="pt-6 flex flex-col sm:flex-row gap-4 justify-center">
              <Button onClick={() => window.location.reload()}>
                Retake Quiz
              </Button>
              <Button variant="secondary" onClick={() => window.location.href = '/outfits'}>
                View Recommendations
              </Button>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-3 md:px-4 lg:px-8 py-12 md:py-24">
      {/* Progress Bar */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-body text-black dark:text-white opacity-70">
            Question {currentQuestion + 1} of {quizQuestions.length}
          </span>
          <span className="text-sm font-body text-black dark:text-white opacity-70">
            {Math.round(((currentQuestion + 1) / quizQuestions.length) * 100)}%
          </span>
        </div>
        <div className="w-full h-2 bg-neutral-soft dark:bg-white rounded-full overflow-hidden">
          <div
            className="h-full bg-[#231212] dark:bg-white transition-all duration-smooth"
            style={{ width: `${((currentQuestion + 1) / quizQuestions.length) * 100}%` }}
          />
        </div>
      </div>

      {/* Question Card */}
      <Card className="mb-6">
        <h2 className="text-2xl md:text-3xl font-display mb-8 text-[#231212] dark:text-white">
          {currentQ.question}
        </h2>
        <div className="space-y-3">
          {currentQ.options.map((option) => (
            <button
              key={option.value}
              onClick={() => handleAnswer(currentQ.id, option.value)}
              className={`w-full text-left p-4 rounded-md border-2 transition-all duration-smooth ${
                selectedAnswer === option.value
                  ? 'border-[#231212] dark:border-white bg-[#231212] dark:bg-white text-white dark:text-black'
                  : 'border-white dark:border-white hover:border-[#231212] dark:hover:border-white'
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-body font-semibold text-base md:text-lg mb-1">
                    {option.label}
                  </p>
                  {option.description && (
                    <p className="text-sm font-body opacity-70">
                      {option.description}
                    </p>
                  )}
                </div>
                {selectedAnswer === option.value && (
                  <Check className="w-5 h-5 flex-shrink-0" />
                )}
              </div>
            </button>
          ))}
        </div>
      </Card>

      {/* Navigation */}
      <div className="flex justify-between">
        <Button
          variant="secondary"
          onClick={handlePrevious}
          disabled={currentQuestion === 0}
          className={currentQuestion === 0 ? 'opacity-50 cursor-not-allowed' : ''}
        >
          Previous
        </Button>
        <Button
          onClick={handleNext}
          disabled={!canProceed}
          className={!canProceed ? 'opacity-50 cursor-not-allowed' : ''}
        >
          <span className="flex items-center gap-2">
            {currentQuestion === quizQuestions.length - 1 ? 'Complete' : 'Next'}
            <ArrowRight className="w-4 h-4" />
          </span>
        </Button>
      </div>
    </div>
  );
}

