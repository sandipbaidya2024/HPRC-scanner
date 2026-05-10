const fs = require('fs');
const path = require('path');

function printTree(dir, prefix = '') {
  // এই ফোল্ডারগুলো লিস্টে দেখাবে না, কারণ এগুলো অনেক বড় এবং আমাদের দরকার নেই
  const ignoredFolders = ['node_modules', '.git', '.expo', 'android', 'ios', 'assets'];
  
  let files;
  try {
    files = fs.readdirSync(dir);
  } catch (e) {
    return;
  }

  // অপ্রয়োজনীয় ফোল্ডারগুলো ফিল্টার করে বাদ দেওয়া
  files = files.filter(file => !ignoredFolders.includes(file));

  files.forEach((file, index) => {
    const isLast = index === files.length - 1;
    const filePath = path.join(dir, file);
    let stats;
    
    try {
      stats = fs.statSync(filePath);
    } catch (e) {
      return;
    }

    console.log(prefix + (isLast ? '└── ' : '├── ') + file);

    // যদি এটা ফোল্ডার হয়, তবে তার ভেতরের ফাইলগুলোও খুঁজবে
    if (stats.isDirectory()) {
      printTree(filePath, prefix + (isLast ? '    ' : '│   '));
    }
  });
}

console.log('📁 SchoolSmartApp');
printTree(__dirname);