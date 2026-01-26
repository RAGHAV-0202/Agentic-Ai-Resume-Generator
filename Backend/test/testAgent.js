// testAgenticSystem.js - Complete Testing Script
// Run with: node testAgenticSystem.js

import fetch from 'node-fetch';

const API_BASE_URL = 'http://localhost:8000/api';
let authToken = '';
let resumeId = '';

// ANSI color codes for pretty output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

const log = (color, message) => {
  console.log(`${colors[color]}${message}${colors.reset}`);
};

const logSection = (title) => {
  console.log('\n' + '='.repeat(60));
  log('cyan', `  ${title}`);
  console.log('='.repeat(60) + '\n');
};

const logTest = (testName, passed, details = '') => {
  const status = passed ? '✅ PASS' : '❌ FAIL';
  log(passed ? 'green' : 'red', `${status} - ${testName}`);
  if (details) log('yellow', `    ${details}`);
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

async function apiCall(endpoint, method = 'GET', body = null) {
  const options = {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(authToken && { 'Authorization': `Bearer ${authToken}` }),
    },
  };

  if (body) {
    options.body = JSON.stringify(body);
  }

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, options);
    const data = await response.json();
    return { success: response.ok, data, status: response.status };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// ============================================================================
// TEST SUITE
// ============================================================================

async function testAuthentication() {
  logSection('TEST 1: AUTHENTICATION');

  // Register test user
  const registerResult = await apiCall('/auth/register', 'POST', {
    name: 'Test User',
    email: `test${Date.now()}@example.com`,
    password: 'Test123!@#',
  });

  logTest(
    'User Registration',
    registerResult.success,
    registerResult.success ? 'User created successfully' : registerResult.error
  );

  if (registerResult.success) {
    authToken = registerResult.data.data.accessToken;
    log('green', `    Token: ${authToken.substring(0, 20)}...`);
  }

  return registerResult.success;
}

async function testResumeCreation() {
  logSection('TEST 2: RESUME CREATION');

  const createResult = await apiCall('/resumes', 'POST', {});

  logTest(
    'Create Resume',
    createResult.success,
    createResult.success ? `Resume ID: ${createResult.data.data.resumeId}` : createResult.error
  );

  if (createResult.success) {
    resumeId = createResult.data.data.resumeId;
  }

  return createResult.success;
}

async function testAgenticConversationStart() {
  logSection('TEST 3: START AGENTIC CONVERSATION');

  const startResult = await apiCall('/agent/start', 'POST', { resumeId });

  logTest(
    'Start Conversation',
    startResult.success,
    startResult.success ? 'Conversation started' : startResult.error
  );

  if (startResult.success) {
    log('blue', '\n    AI: ' + startResult.data.data.aiMessage);
  }

  return startResult.success;
}

async function testMultiFieldExtraction() {
  logSection('TEST 4: MULTI-FIELD EXTRACTION');

  // Send message with multiple fields
  const message = "I'm Raghav Kumar, email raghav@gmail.com, phone +91 98765 43210, from Panipat, Haryana";
  
  const messageResult = await apiCall('/agent/message', 'POST', {
    resumeId,
    message,
  });

  logTest(
    'Multi-Field Extraction',
    messageResult.success && messageResult.data.data.extractedFields.length >= 4,
    messageResult.success
      ? `Extracted ${messageResult.data.data.extractedFields.length} fields: ${messageResult.data.data.extractedFields.map(f => f.field).join(', ')}`
      : messageResult.error
  );

  if (messageResult.success) {
    log('blue', '\n    AI: ' + messageResult.data.data.aiMessage);
    log('yellow', '\n    Extracted Fields:');
    messageResult.data.data.extractedFields.forEach(field => {
      log('yellow', `      - ${field.section}.${field.field}: ${field.value}`);
    });
  }

  return messageResult.success;
}

async function testOutOfOrderInput() {
  logSection('TEST 5: OUT-OF-ORDER INPUT');

  // AI is asking for LinkedIn, but user provides experience data
  const message = "I worked at Google as Software Engineer from 2020 to 2023";
  
  const messageResult = await apiCall('/agent/message', 'POST', {
    resumeId,
    message,
  });

  logTest(
    'Out-of-Order Input Handling',
    messageResult.success && messageResult.data.data.extractedFields.length > 0,
    messageResult.success
      ? `Captured: ${messageResult.data.data.extractedFields.map(f => f.field).join(', ')}`
      : messageResult.error
  );

  if (messageResult.success) {
    log('blue', '\n    AI: ' + messageResult.data.data.aiMessage);
  }

  return messageResult.success;
}

async function testUpdateData() {
  logSection('TEST 6: UPDATE EXISTING DATA');

  const updateResult = await apiCall('/agent/update', 'POST', {
    resumeId,
    updateRequest: 'Update my email to raghav.new@gmail.com',
  });

  logTest(
    'Update Request',
    updateResult.success,
    updateResult.success
      ? `Updated: ${updateResult.data.data.extractedFields.map(f => `${f.field} → ${f.value}`).join(', ')}`
      : updateResult.error
  );

  return updateResult.success;
}

async function testConversationStatus() {
  logSection('TEST 7: CONVERSATION STATUS');

  const statusResult = await apiCall(`/agent/status/${resumeId}`, 'GET');

  logTest(
    'Get Status',
    statusResult.success,
    statusResult.success
      ? `Progress: ${statusResult.data.data.completionPercentage}%, Missing: ${statusResult.data.data.missingFields.length} fields`
      : statusResult.error
  );

  if (statusResult.success) {
    log('yellow', '\n    Status Details:');
    log('yellow', `      Current Section: ${statusResult.data.data.currentSection}`);
    log('yellow', `      Current Field: ${statusResult.data.data.currentField}`);
    log('yellow', `      Completion: ${statusResult.data.data.completionPercentage}%`);
    log('yellow', `      Missing Fields: ${statusResult.data.data.missingFields.length}`);
  }

  return statusResult.success;
}

async function testCompleteConversation() {
  logSection('TEST 8: COMPLETE CONVERSATION FLOW');

  const testMessages = [
    "linkedin.com/in/raghavkumar",
    "github.com/raghavkumar",
    "skip website",
    "University of Delhi",
    "B.Tech in Computer Science",
    "2018",
    "2022",
    "3.8/4.0",
    "Data Structures, Algorithms, Machine Learning",
    "yes", // Add more education? No
    "no",
    "TCS", // Company
    "Software Developer",
    "Bangalore",
    "June 2022",
    "Present",
    "Developed web apps, improved performance by 30%, led team of 3",
    "no", // More experience? No
    "E-Commerce Platform",
    "github.com/raghav/ecommerce",
    "2021",
    "Built scalable platform with payment integration",
    "React, Node.js, MongoDB, Stripe",
    "no", // More projects? No
    "JavaScript, Python, Java",
    "React, Node.js, Express, MongoDB, Docker",
  ];

  let successCount = 0;

  for (const message of testMessages) {
    const result = await apiCall('/agent/message', 'POST', {
      resumeId,
      message,
    });

    if (result.success) {
      successCount++;
      log('green', `  ✅ Message ${successCount}/${testMessages.length}: "${message.substring(0, 30)}..."`);
    } else {
      log('red', `  ❌ Message failed: "${message}"`);
    }

    // Small delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  logTest(
    'Complete Conversation',
    successCount === testMessages.length,
    `${successCount}/${testMessages.length} messages processed successfully`
  );

  return successCount === testMessages.length;
}

async function testATSOptimization() {
  logSection('TEST 9: ATS OPTIMIZATION');

  // Send a poorly written highlight
  const message = "I made things faster and helped people";
  
  const messageResult = await apiCall('/agent/message', 'POST', {
    resumeId,
    message,
  });

  // Check if response contains optimized content (should have action verbs, metrics, etc.)
  const hasActionVerb = /^(Developed|Led|Implemented|Achieved|Improved|Created|Designed|Built|Managed)/i.test(
    messageResult.data.data.resumeData.experience?.[0]?.highlights?.[0] || ''
  );

  logTest(
    'ATS Optimization',
    messageResult.success && hasActionVerb,
    hasActionVerb
      ? 'Content optimized with action verbs'
      : 'Optimization may not have applied'
  );

  return messageResult.success;
}

async function testResetConversation() {
  logSection('TEST 10: RESET CONVERSATION');

  const resetResult = await apiCall(`/agent/reset/${resumeId}`, 'POST');

  logTest(
    'Reset Conversation',
    resetResult.success,
    resetResult.success ? 'Conversation reset successfully' : resetResult.error
  );

  return resetResult.success;
}

// ============================================================================
// MAIN TEST RUNNER
// ============================================================================

async function runAllTests() {
  console.clear();
  log('cyan', '\n╔════════════════════════════════════════════════════════════╗');
  log('cyan', '║                                                            ║');
  log('cyan', '║         🤖 AGENTIC RESUME BUILDER TEST SUITE 🤖         ║');
  log('cyan', '║                                                            ║');
  log('cyan', '╚════════════════════════════════════════════════════════════╝\n');

  const results = {
    total: 0,
    passed: 0,
    failed: 0,
  };

  const tests = [
    { name: 'Authentication', fn: testAuthentication },
    { name: 'Resume Creation', fn: testResumeCreation },
    { name: 'Start Conversation', fn: testAgenticConversationStart },
    { name: 'Multi-Field Extraction', fn: testMultiFieldExtraction },
    { name: 'Out-of-Order Input', fn: testOutOfOrderInput },
    { name: 'Update Data', fn: testUpdateData },
    { name: 'Conversation Status', fn: testConversationStatus },
    // { name: 'Complete Conversation', fn: testCompleteConversation }, // Uncomment for full test
    // { name: 'ATS Optimization', fn: testATSOptimization }, // Uncomment for optimization test
    { name: 'Reset Conversation', fn: testResetConversation },
  ];

  for (const test of tests) {
    results.total++;
    try {
      const passed = await test.fn();
      if (passed) {
        results.passed++;
      } else {
        results.failed++;
      }
    } catch (error) {
      log('red', `\n❌ ${test.name} threw an error: ${error.message}`);
      results.failed++;
    }
  }

  // Summary
  logSection('TEST SUMMARY');
  log('cyan', `Total Tests: ${results.total}`);
  log('green', `Passed: ${results.passed}`);
  log('red', `Failed: ${results.failed}`);
  
  const percentage = Math.round((results.passed / results.total) * 100);
  log(
    percentage === 100 ? 'green' : percentage >= 80 ? 'yellow' : 'red',
    `\nSuccess Rate: ${percentage}%\n`
  );

  if (percentage === 100) {
    log('green', '🎉 ALL TESTS PASSED! 🎉\n');
  } else {
    log('yellow', '⚠️  Some tests failed. Review the output above.\n');
  }
}

// Run tests
runAllTests().catch((error) => {
  log('red', `\n❌ Fatal Error: ${error.message}\n`);
  process.exit(1);
});