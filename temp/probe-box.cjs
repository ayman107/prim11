const fs = require('fs');
const path = require('path');

function norm(s) {
  return String(s || '')
    .replace(/[\u0600-\u06FF]/g, function (c) { return c >= '\u0640' || true; }) /* no-op keep */
} 
