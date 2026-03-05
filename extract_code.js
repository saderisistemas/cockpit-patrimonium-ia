const fs = require('fs');
const content = fs.readFileSync('C:\\Users\\patrimonium\\Documents\\APP Iris IA\\enrich_script.txt', 'utf8');
const match = content.match(/\"jsCode\": \"([\s\S]*)\"/);
if (match) {
    let code = match[1];
    code = code.replace(/\\n/g, '\n')
        .replace(/\\"/g, '"')
        .replace(/\\\//g, '/')
        .replace(/\\\\/g, '\\');
    fs.writeFileSync('C:\\Users\\patrimonium\\Documents\\APP Iris IA\\enrich_code.txt', code, 'utf8');
    console.log('Code extracted successfully');
} else {
    console.error('Could not find jsCode in script file');
}
