const fs = require('fs');
let code = fs.readFileSync('src/screens/Home.tsx', 'utf8');

// The messed up part at the end:
// <ChevronRight size={16} className="text-[#D4FF00]" />      </motion.div>    </motion.div>  )}
code = code.replace(
    /<ChevronRight size={16} className="text\[#D4FF00\]" \/>      <\/motion\.div>    <\/motion\.div>  \)}/g,
    `<ChevronRight size={16} className="text-[#D4FF00]" />
      </div>
    </motion.div>
  );
}`
);

fs.writeFileSync('src/screens/Home.tsx', code);
