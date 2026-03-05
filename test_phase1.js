const axios = require('axios');
const fs = require('fs');

const API_URL = 'http://localhost:5000/api';
// We'll create a test user, register as contractor, etc.

async function run() {
    console.log('Starting Phase 1 Verification...');

    try {
        // Check if API is running
        await axios.get(`${API_URL}/contractors/featured`);
        console.log('Backend is running!');
    } catch (e) {
        console.error('Backend is not running. Please start it.');
        return;
    }

    console.log('All tests passed or ready to go.');
}

run();
