import { useState } from 'react';
import { useNavigate } from 'react-router';
import { useAppState } from '@/hooks/useAppState';

const slides = [
  {
    image: '/onboarding-1.jpg',
    title: 'Understand Your Work Stress',
    description: 'Subl quietly analyzes your keyboard interactions and typing dynamics to detect early signs of stress while you work.',
  },
  {
    image: '/onboarding-2.jpg',
    title: 'Your Data Stays Private',
    description: 'Subl focuses only on behavioral patterns, not your content. Your activity remains private and secure, always.',
  },
  {
    image: '/onboarding-3.jpg',
    title: 'Stay Focused. Avoid Burnout.',
    description: 'Get gentle notifications and practical wellness suggestions when stress begins affecting your performance.',
  },
];

export default function Onboarding() {
  const [current, setCurrent] = useState(0);
  const navigate = useNavigate();
  const { completeOnboarding } = useAppState();

  const handleNext = () => {
    if (current < slides.length - 1) {
      setCurrent(current + 1);
    } else {
      completeOnboarding();
      navigate('/signup');
    }
  };

  const handleSkip = () => {
    completeOnboarding();
    navigate('/signup');
  };

  const slide = slides[current];

  return (
    <div className="min-h-screen bg-[#1a1f36] flex flex-col items-center justify-center px-6 py-12">
      <div className="max-w-sm w-full flex flex-col items-center">
        {/* Image */}
        <div className="w-full aspect-[3/4] max-h-[380px] mb-8 rounded-2xl overflow-hidden">
          <img src={slide.image} alt={slide.title} className="w-full h-full object-cover" />
        </div>

        {/* Title */}
        <h2 className="text-white text-xl font-semibold text-center mb-3">{slide.title}</h2>
        <p className="text-subl-grey-400 text-sm text-center leading-relaxed mb-8">{slide.description}</p>

        {/* Dots */}
        <div className="flex gap-2 mb-8">
          {slides.map((_, i) => (
            <span
              key={i}
              className={`h-2 rounded-full transition-all duration-300 ${
                i === current ? 'w-6 bg-subl-blue-500' : 'w-2 bg-subl-grey-600'
              }`}
            />
          ))}
        </div>

        {/* Buttons */}
        <button
          onClick={handleNext}
          className="w-full py-3.5 bg-subl-blue-500 hover:bg-subl-blue-600 text-white rounded-xl font-medium transition-colors mb-3"
        >
          {current === slides.length - 1 ? 'Get Started' : 'Next'}
        </button>
        <button
          onClick={handleSkip}
          className="text-subl-grey-400 text-sm hover:text-white transition-colors"
        >
          Skip
        </button>
      </div>
    </div>
  );
}
