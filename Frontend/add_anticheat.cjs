const fs = require('fs');

// ST_AiInterview.jsx
const aiFile = 'src/pages/Student/Components/ST_AiInterview.jsx';
let aiCode = fs.readFileSync(aiFile, 'utf8');

const aiCheatHook = `
  // Anti-cheat & Auto-Submit
  useEffect(() => {
    const handleVisibility = () => {
      if (document.hidden && phaseRef.current === "live" && !endRequestedRef.current) {
        if (endInterviewRef.current) endInterviewRef.current();
      }
    };
    const preventCopy = (e) => {
      e.preventDefault();
      alert("Copying and pasting is disabled during the interview.");
    };

    document.addEventListener("visibilitychange", handleVisibility);
    document.addEventListener("copy", preventCopy);
    document.addEventListener("cut", preventCopy);
    document.addEventListener("paste", preventCopy);
    document.addEventListener("contextmenu", preventCopy);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibility);
      document.removeEventListener("copy", preventCopy);
      document.removeEventListener("cut", preventCopy);
      document.removeEventListener("paste", preventCopy);
      document.removeEventListener("contextmenu", preventCopy);
    };
  }, []);
`;

if (!aiCode.includes('Anti-cheat')) {
  aiCode = aiCode.replace('// ─── Finish interview', aiCheatHook + '\n  // ─── Finish interview');
  fs.writeFileSync(aiFile, aiCode);
}

// ST_CodingPlatform.jsx
const codeFile = 'src/pages/Student/Components/ST_CodingPlatform.jsx';
let codingCode = fs.readFileSync(codeFile, 'utf8');

const codeCheatHook = `
  const submitRef = useRef(null);
  useEffect(() => {
    submitRef.current = handleSubmitCode;
  });

  useEffect(() => {
    const handleVisibility = () => {
      if (document.hidden && taskData) {
        if (submitRef.current && !isSubmitting) submitRef.current();
      }
    };
    const preventCopy = (e) => {
      e.preventDefault();
      alert("Copying and pasting is disabled in the coding platform.");
    };

    document.addEventListener("visibilitychange", handleVisibility);
    document.addEventListener("copy", preventCopy);
    document.addEventListener("cut", preventCopy);
    document.addEventListener("paste", preventCopy);
    document.addEventListener("contextmenu", preventCopy);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibility);
      document.removeEventListener("copy", preventCopy);
      document.removeEventListener("cut", preventCopy);
      document.removeEventListener("paste", preventCopy);
      document.removeEventListener("contextmenu", preventCopy);
    };
  }, [taskData, isSubmitting]);
`;

if (!codingCode.includes('preventCopy')) {
  codingCode = codingCode.replace('const testCasesList = taskData?.testCases || taskData?.test_cases || [];', codeCheatHook + '\n  const testCasesList = taskData?.testCases || taskData?.test_cases || [];');
  // Wait, I need useRef imported in ST_CodingPlatform.jsx
  codingCode = codingCode.replace('import React, { useState, useEffect } from "react";', 'import React, { useState, useEffect, useRef } from "react";');
  fs.writeFileSync(codeFile, codingCode);
}
console.log('done');
