const fs = require('fs');
let code = fs.readFileSync('src/lib/api.ts', 'utf8');

code = code.replace(
  /export async function getWorkoutHistory.*?\n}/s,
  `export async function getWorkoutHistory(uid: string) {
  const q = query(collection(db, 'workoutSessions'), where('userId', '==', uid));
  const snap = await getDocs(q);
  const docs = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  // Sort client-side to avoid Firebase composite index requirement
  return docs.sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime());
}`
);

fs.writeFileSync('src/lib/api.ts', code);
