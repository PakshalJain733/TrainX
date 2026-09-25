const fs = require('fs');
const path = require('path');

const dir = 'c:/Users/Siri/CAMPUS-TRAINING-PORTAL/Frontend/src/pages/Coordinator/Components';
const files = [
  'CO_StudentsNeedImprovement.jsx',
  'CO_QuizPerformance.jsx',
  'CO_InterviewPerformance.jsx',
  'CO_CodingPerformance.jsx',
  'CO_CodingPractice.jsx',
  'CO_Batches.jsx',
  'CO_Attendance.jsx',
  'CO_Assessments.jsx'
];

files.forEach(file => {
  const filepath = path.join(dir, file);
  let content = fs.readFileSync(filepath, 'utf8');

  // ensure import
  if (!content.includes('CustomSelect')) {
    if (content.includes('import React')) {
      content = content.replace(/(import React.*?;\n)/, '$1import CustomSelect from "../../../components/ui/CustomSelect";\n');
    } else {
      content = 'import CustomSelect from "../../../components/ui/CustomSelect";\n' + content;
    }
  }

  // Regex to match <select ...> ... </select>
  const selectRegex = /<select([\s\S]*?)>([\s\S]*?)<\/select>/g;
  
  content = content.replace(selectRegex, (match, attrs, inner) => {
    // extract value
    const valueMatch = attrs.match(/value=\{([^}]+)\}/);
    const valueProp = valueMatch ? valueMatch[1] : '';

    // extract onChange
    const onChangeMatch = attrs.match(/onChange=\{\(e\)\s*=>\s*([^}]+)\(e\.target\.value\)\}/) 
                       || attrs.match(/onChange=\{\(e\)\s*=>\s*([^}]+)\(e\.target\.value\)\}/)
                       || attrs.match(/onChange=\{([^}]+)\}/);
                       
    let onChangeProp = '';
    if (attrs.includes('e.target.value')) {
       let m = attrs.match(/onChange=\{\(e\)\s*=>\s*([^(]+)\(e\.target\.value\)\}/);
       if (m) {
          onChangeProp = `(val) => ${m[1]}(val)`;
       } else {
          // fallback
          let m2 = attrs.match(/onChange=\{([^\}]+)\}/);
          if (m2) {
             let fnBody = m2[1];
             fnBody = fnBody.replace('e.target.value', 'val');
             onChangeProp = `(val) => { const e = { target: { value: val } }; return (${fnBody})(e); }`;
          }
       }
    } else {
       // if no e.target.value, it's probably complex
       onChangeProp = `(val) => { /* TODO check */ }`;
    }

    // extract options
    const options = [];
    let optionMatch;
    const optionRegex = /<option[^>]*?value=(["'])(.*?)\1[^>]*>([\s\S]*?)<\/option>|<option[^>]*?value=\{([^}]+)\}[^>]*>([\s\S]*?)<\/option>/g;
    
    // Also we might have dynamic options like {batchesList.map(...)}
    const dynamicMapRegex = /\{([a-zA-Z0-9_]+)\.map\(([^)]+)\)\s*=>\s*\(\s*<option[^>]*value=\{([^}]+)\}[^>]*>([\s\S]*?)<\/option>\s*\)\s*\}/g;
    
    // Check if there's a dynamic map
    let hasDynamic = false;
    let dynamicVar = '';
    let dynamicVal = '';
    let dynamicLabel = '';
    
    const dMatch = dynamicMapRegex.exec(inner);
    if (dMatch) {
      hasDynamic = true;
      dynamicVar = dMatch[1];
      dynamicVal = dMatch[3];
      dynamicLabel = dMatch[4];
      // strip dynamic part from inner to parse static options
      inner = inner.replace(dMatch[0], '');
    }

    // Parse static options
    let optRegex2 = /<option[^>]*value=(["'])(.*?)\1[^>]*>([\s\S]*?)<\/option>/g;
    let m;
    while ((m = optRegex2.exec(inner)) !== null) {
      options.push(`{ value: "${m[2]}", label: "${m[3].trim()}" }`);
    }
    
    let optRegex3 = /<option[^>]*value=\{([^}]+)\}[^>]*>([\s\S]*?)<\/option>/g;
    while ((m = optRegex3.exec(inner)) !== null) {
      options.push(`{ value: ${m[1]}, label: ${m[2].trim().startsWith('{') ? m[2].trim() : '"'+m[2].trim()+'"'} }`);
    }

    // Build the replacement
    let replacement = `<CustomSelect\n`;
    if (valueProp) replacement += `  value={${valueProp}}\n`;
    if (onChangeProp) replacement += `  onChange={${onChangeProp}}\n`;
    
    if (hasDynamic) {
       if (options.length > 0) {
          replacement += `  options={[\n    ${options.join(',\n    ')},\n    ...${dynamicVar}.map(${dMatch[2]} => ({ value: ${dynamicVal}, label: ${dynamicLabel} }))\n  ]}\n`;
       } else {
          replacement += `  options={${dynamicVar}.map(${dMatch[2]} => ({ value: ${dynamicVal}, label: ${dynamicLabel} }))}\n`;
       }
    } else {
       replacement += `  options={[\n    ${options.join(',\n    ')}\n  ]}\n`;
    }
    
    // Extract placeholder if first option has empty value
    if (options.length > 0 && options[0].includes('value: ""')) {
       // It's a placeholder
    }
    
    replacement += `/>`;
    return replacement;
  });

  fs.writeFileSync(filepath, content, 'utf8');
});

console.log("Done");
