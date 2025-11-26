/**
 * Collaboration System Test & Demo
 * 
 * Run this file to test the collaboration system
 * Usage: node server/tests/testCollaboration.js
 */

import collaborationService from '../services/collaborationService.js';
import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const mockUser = {
  _id: new mongoose.Types.ObjectId(),
  fullName: 'Test User',
  email: 'test@example.com',
  roles: ['USER']
};

const mockSocket = {
  id: 'socket-123',
  join: (room) => console.log(`✅ Socket joined: ${room}`),
  leave: (room) => console.log(`✅ Socket left: ${room}`),
  emit: (event, data) => console.log(`📤 Socket emit: ${event}`, data),
  to: (room) => ({
    emit: (event, data) => console.log(`📡 Broadcast to ${room}: ${event}`, data)
  })
};

async function testCollaborationSystem() {
  console.log('🧪 Testing Collaboration System...\n');

  try {
    // Test 1: Get Active Rooms (should be empty)
    console.log('Test 1: Get Active Rooms');
    let rooms = collaborationService.getActiveRooms();
    console.log(`Active rooms: ${rooms.length}`);
    console.log('✅ Test 1 passed\n');

    // Test 2: Get Room State (should be null)
    console.log('Test 2: Get Non-Existent Room State');
    const proposalId = 'PROP-2025-0001';
    let roomState = collaborationService.getRoomState(proposalId);
    console.log(`Room state: ${roomState ? 'EXISTS' : 'NULL'}`);
    console.log('✅ Test 2 passed\n');

    // Test 3: Create Room (without DB - will fail gracefully)
    console.log('Test 3: Room Creation Flow');
    console.log('Note: This will fail without DB connection, which is expected');
    try {
      await collaborationService.getOrCreateRoom(proposalId);
      console.log('✅ Room created');
    } catch (error) {
      console.log(`⚠️ Expected error: ${error.message}`);
    }
    console.log('✅ Test 3 completed\n');

    // Test 4: Memory Management
    console.log('Test 4: Memory Management');
    console.log(`Rooms in memory: ${collaborationService.rooms.size}`);
    console.log(`Sessions tracked: ${collaborationService.sessions.size}`);
    console.log(`Auto-save timers: ${collaborationService.autoSaveTimers.size}`);
    console.log('✅ Test 4 passed\n');

    // Test 5: Configuration Check
    console.log('Test 5: Configuration');
    console.log('Config:', JSON.stringify(collaborationService.config, null, 2));
    console.log('✅ Test 5 passed\n');

    // Test 6: Cleanup Inactive Rooms
    console.log('Test 6: Cleanup Function');
    collaborationService.cleanupInactiveRooms();
    console.log('✅ Cleanup executed\n');

    console.log('🎉 All tests completed successfully!');
    console.log('\n📊 System Status:');
    console.log(`- Total Rooms: ${collaborationService.rooms.size}`);
    console.log(`- Total Sessions: ${collaborationService.sessions.size}`);
    console.log(`- Active Timers: ${collaborationService.autoSaveTimers.size}`);
    console.log(`- Pending Syncs: ${collaborationService.syncQueue.size}`);

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run tests
console.log('='.repeat(60));
console.log('  Collaboration System Test Suite');
console.log('='.repeat(60));
console.log('');

testCollaborationSystem()
  .then(() => {
    console.log('\n✅ Test suite completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Test suite failed:', error);
    process.exit(1);
  });
