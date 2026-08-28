const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

if (!code.includes("import { AnimatePresence, motion } from 'motion/react';")) {
    code = code.replace("import { ErrorBoundary } from './components/ErrorBoundary';",
    "import { ErrorBoundary } from './components/ErrorBoundary';\nimport { AnimatePresence, motion } from 'motion/react';");
}

const originalRoutes = `
        {activeTab === 'home' && <Home user={user} tgUser={tgUser} />}
        {activeTab === 'log' && <Log user={user} />}
        {activeTab === 'body' && <Body user={user} />}
        {activeTab === 'pro' && <Pro user={user} onUpdate={handleCompleteOnboarding} />}
`;

const newRoutes = `
        <div className="flex-1 relative">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15, transition: { duration: 0.2 } }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
              className="absolute inset-0 pb-24 overflow-y-auto"
            >
              {activeTab === 'home' && <Home user={user} tgUser={tgUser} />}
              {activeTab === 'log' && <Log user={user} />}
              {activeTab === 'body' && <Body user={user} />}
              {activeTab === 'pro' && <Pro user={user} onUpdate={handleCompleteOnboarding} />}
            </motion.div>
          </AnimatePresence>
        </div>
`;

if (code.includes("{activeTab === 'home'")) {
    code = code.replace(originalRoutes, newRoutes);
}

fs.writeFileSync('src/App.tsx', code);
