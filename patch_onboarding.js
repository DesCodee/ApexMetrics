const fs = require('fs');

// 1. Fix App.tsx
let appCode = fs.readFileSync('src/App.tsx', 'utf8');
appCode = appCode.replace(
  "onComplete={() => setDbUser({ ...dbUser, onboardingCompleted: true })}",
  "onComplete={(profileData) => setDbUser({ ...dbUser, ...profileData, onboardingCompleted: true })}"
);
fs.writeFileSync('src/App.tsx', appCode);

// 2. Fix Onboarding.tsx
let onboardCode = fs.readFileSync('src/components/Onboarding.tsx', 'utf8');
onboardCode = onboardCode.replace(
  "const profile = {",
  "const profile = {\n    age: Number(age) || 20,"
);
fs.writeFileSync('src/components/Onboarding.tsx', onboardCode);

