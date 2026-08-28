const fs = require('fs');
let code = fs.readFileSync('src/screens/Home.tsx', 'utf8');

const target = '<ChevronRight size={16} className="text-[#D4FF00]" />      </motion.div>    </motion.div>  )}';
const replacement = '<ChevronRight size={16} className="text-[#D4FF00]" />\n      </div>\n    </motion.div>\n  );\n}';

if (code.includes(target)) {
    code = code.replace(target, replacement);
    fs.writeFileSync('src/screens/Home.tsx', code);
    console.log("Replaced!");
} else {
    console.log("Target not found!");
}
