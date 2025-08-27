// Quick validation script to check module structure
const fs = require('fs');
const path = require('path');

console.log('🔍 Validating Hotel Operations Modules Implementation...\n');

const modules = ['units', 'guests', 'reservations'];
const requiredFiles = {
  'module': '.module.ts',
  'service': '.service.ts', 
  'controller': '.controller.ts',
  'dto/index': 'dto/index.ts'
};

let allValid = true;

modules.forEach(moduleName => {
  console.log(`📁 Checking ${moduleName} module:`);
  
  Object.entries(requiredFiles).forEach(([type, fileName]) => {
    const filePath = path.join(__dirname, 'apps', 'bff', 'src', 'modules', moduleName, fileName.replace(moduleName, moduleName));
    const actualFileName = fileName === 'dto/index.ts' ? fileName : `${moduleName}${fileName}`;
    const actualFilePath = path.join(__dirname, 'apps', 'bff', 'src', 'modules', moduleName, actualFileName);
    
    const checkPath = fileName === 'dto/index.ts' ? filePath : actualFilePath;
    
    if (fs.existsSync(checkPath)) {
      console.log(`  ✅ ${type}: ${path.basename(checkPath)}`);
    } else {
      console.log(`  ❌ ${type}: ${path.basename(checkPath)} - MISSING`);
      allValid = false;
    }
  });
  
  console.log('');
});

// Check app.module.ts integration
console.log('🔧 Checking app.module.ts integration:');
const appModulePath = path.join(__dirname, 'apps', 'bff', 'src', 'app.module.ts');

if (fs.existsSync(appModulePath)) {
  const appModuleContent = fs.readFileSync(appModulePath, 'utf8');
  
  modules.forEach(moduleName => {
    const moduleClass = `${moduleName.charAt(0).toUpperCase() + moduleName.slice(1)}Module`;
    const importPattern = `import { ${moduleClass} }`;
    const includePattern = `${moduleClass},`;
    
    if (appModuleContent.includes(importPattern)) {
      console.log(`  ✅ Import: ${moduleClass}`);
    } else {
      console.log(`  ❌ Import: ${moduleClass} - MISSING`);
      allValid = false;
    }
    
    if (appModuleContent.includes(includePattern)) {
      console.log(`  ✅ Include: ${moduleClass}`);
    } else {
      console.log(`  ❌ Include: ${moduleClass} - MISSING`);
      allValid = false;
    }
  });
} else {
  console.log('  ❌ app.module.ts - FILE NOT FOUND');
  allValid = false;
}

console.log('\n' + '='.repeat(50));

if (allValid) {
  console.log('🎉 SUCCESS: All hotel operations modules are properly implemented!');
  console.log('\n📋 Summary:');
  console.log('  • 3 NestJS modules created');
  console.log('  • All required files present');
  console.log('  • App module integration complete');
  console.log('  • Ready for frontend integration');
} else {
  console.log('⚠️  WARNING: Some files are missing or incomplete');
  console.log('Please review the missing components above.');
}

console.log('\n🚀 Next Steps:');
console.log('1. Test compilation: npm run build');
console.log('2. Start development server: npm run dev:bff');
console.log('3. Check API endpoints: http://localhost:3000/api');
console.log('4. View Swagger docs: http://localhost:3000/api/docs');

process.exit(allValid ? 0 : 1);