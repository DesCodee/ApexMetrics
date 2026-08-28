const fs = require('fs');
let code = fs.readFileSync('src/screens/Home.tsx', 'utf8');

const lastStr = code.substring(code.length - 200);
console.log(JSON.stringify(lastStr));

// Just slice off the end and replace it.
const searchIndex = code.lastIndexOf('<ChevronRight');
if (searchIndex !== -1) {
    code = code.substring(0, searchIndex) + '<ChevronRight size={16} className="text-[#D4FF00]" />\n      </div>\n    </motion.div>\n  );\n}';
    fs.writeFileSync('src/screens/Home.tsx', code);
    console.log("Replaced via slice!");
}
