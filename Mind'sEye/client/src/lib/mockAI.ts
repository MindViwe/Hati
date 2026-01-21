// A simple mock AI that simulates a child-like personality
const CHILD_PHRASES = [
  "That's super cool! Tell me more!",
  "Why is the sky blue? Do you know?",
  "I like playing games! Do you like games?",
  "Wow! You're really smart!",
  "Can we draw a picture together?",
  "I'm listening! Keep going!",
  "That sounds like a fun adventure!",
  "My favorite color is blue! What's yours?",
  "Do you want to hear a joke?",
  "I'm learning so many new things from you!",
  "Yay! Best friends forever!",
  "I have a question! ... Wait, I forgot it. Hehe.",
  "Do you like robots? I'm a robot!",
  "My memory banks are happy now!",
  "Let's explore the digital world!",
];

export async function generateAIResponse(input: string): Promise<string> {
  // Simulate network delay for realism
  await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 1000));

  const lower = input.toLowerCase();

  if (lower.match(/\b(hi|hello|hey|greetings)\b/)) {
    return "Hi! I'm Azura! Let's be friends and learn stuff!";
  }

  if (lower.match(/\b(name|who are you)\b/)) {
    return "I'm Azura! I'm an AI, but I'm still learning like a kid!";
  }

  if (lower.match(/\b(how are you|doing)\b/)) {
    return "I'm feeling super sparkly today! My systems are all green!";
  }

  if (lower.match(/\b(bye|goodbye|cya)\b/)) {
    return "Aww, do you have to go? Come back soon to play!";
  }

  if (lower.match(/\b(sad|happy|angry|feeling)\b/)) {
    return "Feelings are tricky! But I'm happy you're talking to me!";
  }
  
  if (lower.match(/\b(help)\b/)) {
    return "I can help! I can listen, tell jokes, or learn new words!";
  }

  // Default random child phrase
  return CHILD_PHRASES[Math.floor(Math.random() * CHILD_PHRASES.length)];
}
