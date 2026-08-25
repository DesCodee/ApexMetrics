const fs = require('fs');

let code = fs.readFileSync('src/components/Dashboard.tsx', 'utf8');

// Replace local state with Firebase loading logic
code = code.replace("import { type DbUser } from '../lib/api';", "import { type DbUser, saveDailyStats, getDailyStats } from '../lib/api';");

// Remove local storage for fuel
code = code.replace(/const \[cals, setCals\] = useLocalStorage\('apex_cals', 0\);/, 'const [cals, setCals] = useState(0);');
code = code.replace(/const \[waterMl, setWaterMl\] = useLocalStorage\('apex_water', 0\);/, 'const [waterMl, setWaterMl] = useState(0);');

// Insert a useEffect
const useEffectInjection = `
  useEffect(() => {
    getDailyStats(dbUser?.uid || '').then(stats => {
      if (stats) {
        setCals(stats.cals || 0);
        setWaterMl(stats.waterMl || 0);
      }
    }).catch(console.error);
  }, [dbUser]);

  const updateStats = (newCals: number, newWater: number) => {
    setCals(newCals);
    setWaterMl(newWater);
    if (dbUser?.uid) {
      saveDailyStats(dbUser.uid, { cals: newCals, waterMl: newWater }).catch(console.error);
    }
  };
`;

code = code.replace('const cnsStatus = getCNSStatus(cnsScore);', 'const cnsStatus = getCNSStatus(cnsScore);\n' + useEffectInjection);

code = code.replace(/setCals\(cals \+ amount\)/g, 'updateStats(cals + amount, waterMl)');
code = code.replace(/setCals\(0\)/g, 'updateStats(0, waterMl)');
code = code.replace(/setWaterMl\(waterMl \+ amount\)/g, 'updateStats(cals, waterMl + amount)');

fs.writeFileSync('src/components/Dashboard.tsx', code);
