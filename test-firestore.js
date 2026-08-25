import { initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
const app = initializeApp({ projectId: 'local-fortress-qjf39' });
const db = getFirestore(app, 'ai-studio-apexmetrics-f8ab602d-cd22-4a06-a8ad-4f5aada95daa');
console.log(db ? "DB connected" : "Failed");
