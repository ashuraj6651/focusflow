export const MOTIVATIONAL_QUOTES = [
  { text: "The secret of getting ahead is getting started.", author: "Mark Twain" },
  { text: "It does not matter how slowly you go as long as you do not stop.", author: "Confucius" },
  { text: "Success is not final, failure is not fatal: it is the courage to continue that counts.", author: "Winston Churchill" },
  { text: "Believe you can and you're halfway there.", author: "Theodore Roosevelt" },
  { text: "The only way to do great work is to love what you do.", author: "Steve Jobs" },
  { text: "Education is the most powerful weapon which you can use to change the world.", author: "Nelson Mandela" },
  { text: "The beautiful thing about learning is that nobody can take it away from you.", author: "B.B. King" },
  { text: "Study hard what interests you the most in the most undisciplined, irreverent and original manner possible.", author: "Richard Feynman" },
  { text: "The more that you read, the more things you will know.", author: "Dr. Seuss" },
  { text: "An investment in knowledge pays the best interest.", author: "Benjamin Franklin" },
  { text: "The expert in anything was once a beginner.", author: "Helen Hayes" },
  { text: "Learning is not attained by chance, it must be sought for with ardor.", author: "Abigail Adams" },
  { text: "The mind is not a vessel to be filled, but a fire to be kindled.", author: "Plutarch" },
  { text: "Live as if you were to die tomorrow. Learn as if you were to live forever.", author: "Mahatma Gandhi" },
  { text: "The only person you are destined to become is the person you decide to be.", author: "Ralph Waldo Emerson" },
  { text: "Don't watch the clock; do what it does. Keep going.", author: "Sam Levenson" },
  { text: "You don't have to be great to start, but you have to start to be great.", author: "Zig Ziglar" },
  { text: "The capacity to learn is a gift; the ability to learn is a skill; the willingness to learn is a choice.", author: "Brian Herbert" },
  { text: "Success is the sum of small efforts repeated day in and day out.", author: "Robert Collier" },
  { text: "Push yourself, because no one else is going to do it for you.", author: "Unknown" },
  { text: "Great things never come from comfort zones.", author: "Unknown" },
  { text: "Dream it. Wish it. Do it.", author: "Unknown" },
  { text: "The harder you work for something, the greater you'll feel when you achieve it.", author: "Unknown" },
  { text: "Discipline is the bridge between goals and accomplishment.", author: "Jim Rohn" },
  { text: "Knowledge is power. Information is liberating.", author: "Kofi Annan" },
];

export const STUDY_TIPS = [
  "Use the Pomodoro Technique: 25 minutes of focused study followed by a 5-minute break.",
  "Teach what you've learned to someone else. It reinforces your understanding.",
  "Create mind maps to visualize connections between concepts.",
  "Review material within 24 hours to improve long-term retention.",
  "Use active recall instead of passive re-reading.",
  "Break large topics into smaller, manageable chunks.",
  "Study in short, focused sessions rather than long cramming sessions.",
  "Get enough sleep — it's crucial for memory consolidation.",
  "Use spaced repetition for memorizing facts and vocabulary.",
  "Eliminate distractions by using focus mode while studying.",
  "Take handwritten notes to improve retention and understanding.",
  "Use the Feynman Technique: explain concepts in simple terms.",
  "Set specific, measurable goals for each study session.",
  "Review past mistakes to avoid repeating them.",
  "Stay hydrated and eat brain-boosting foods while studying.",
  "Use color-coding to organize your notes and materials.",
  "Practice with past exam papers under timed conditions.",
  "Create a dedicated study space free from distractions.",
  "Listen to ambient sounds to improve concentration.",
  "Take regular breaks to prevent burnout and maintain focus.",
];

export const AMBIENT_SOUNDS = [
  { id: 'rain', name: 'Rain', icon: 'CloudRain' },
  { id: 'forest', name: 'Forest', icon: 'Trees' },
  { id: 'fireplace', name: 'Fireplace', icon: 'Flame' },
  { id: 'cafe', name: 'Cafe', icon: 'Coffee' },
  { id: 'ocean', name: 'Ocean', icon: 'Waves' },
  { id: 'whitenoise', name: 'White Noise', icon: 'Radio' },
] as const;

export const DEFAULT_HABITS = [
  { name: 'Study', icon: 'BookOpen', color: '#7C3AED' },
  { name: 'Reading', icon: 'BookOpen', color: '#3B82F6' },
  { name: 'Workout', icon: 'Dumbbell', color: '#EF4444' },
  { name: 'Meditation', icon: 'Brain', color: '#10B981' },
  { name: 'Water Intake', icon: 'Droplets', color: '#06B6D4' },
  { name: 'Sleep', icon: 'Moon', color: '#8B5CF6' },
];

export const ACCENT_COLORS = [
  { name: 'Purple', value: '#7C3AED' },
  { name: 'Blue', value: '#3B82F6' },
  { name: 'Green', value: '#10B981' },
  { name: 'Pink', value: '#EC4899' },
  { name: 'Orange', value: '#F97316' },
  { name: 'Red', value: '#EF4444' },
  { name: 'Cyan', value: '#06B6D4' },
  { name: 'Yellow', value: '#EAB308' },
];

export const GREETING_MESSAGES: Record<string, string> = {
  morning: 'Good Morning ',
  afternoon: 'Good Afternoon ',
  evening: 'Good Evening ',
  night: 'Good Night ',
};

export const BADGE_TYPES = [
  { name: 'First Step', icon: '🎯', description: 'Complete your first task' },
  { name: 'Streak Starter', icon: '🔥', description: 'Maintain a 3-day streak' },
  { name: 'Focus Master', icon: '🧠', description: 'Complete 10 focus sessions' },
  { name: 'Marathon Studier', icon: '📚', description: 'Study for 8 hours in a day' },
  { name: 'Goal Crusher', icon: '🏆', description: 'Complete 5 goals' },
  { name: 'Habit Hero', icon: '💪', description: 'Complete all habits for 7 days' },
  { name: 'Early Bird', icon: '🌅', description: 'Start studying before 8 AM' },
  { name: 'Night Owl', icon: '🦉', description: 'Study past midnight' },
  { name: 'Perfect Day', icon: '⭐', description: 'Complete all daily tasks' },
  { name: 'Week Warrior', icon: '🎖️', description: 'Maintain a 7-day streak' },
];