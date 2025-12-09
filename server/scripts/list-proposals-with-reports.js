import mongoose from 'mongoose';
import Proposal from '../models/Proposal.js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env') });

/**
 * Script to list all proposals with AI reports
 * Usage: node scripts/list-proposals-with-reports.js
 */

async function listProposalsWithReports() {
  try {
    // Connect to MongoDB
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/coal-research');
    console.log('✓ Connected to MongoDB\n');

    // Find all proposals with AI reports
    const proposals = await Proposal.find({
      'aiReports.0': { $exists: true }
    }).select('_id proposalCode title status aiReports');

    console.log('='.repeat(100));
    console.log('PROPOSALS WITH AI REPORTS');
    console.log('='.repeat(100));
    console.log(`Total proposals with AI reports: ${proposals.length}\n`);

    if (proposals.length === 0) {
      console.log('No proposals found with AI reports.');
      console.log('You may need to add sample data first.\n');
      return;
    }

    proposals.forEach((proposal, index) => {
      console.log(`${index + 1}. Proposal: ${proposal.proposalCode}`);
      console.log(`   ID: ${proposal._id}`);
      console.log(`   Title: ${proposal.title || 'N/A'}`);
      console.log(`   Status: ${proposal.status}`);
      console.log(`   AI Reports: ${proposal.aiReports.length}`);
      
      if (proposal.aiReports.length > 0) {
        const reportTypes = proposal.aiReports.reduce((acc, report) => {
          acc[report.reportType] = (acc[report.reportType] || 0) + 1;
          return acc;
        }, {});
        
        Object.entries(reportTypes).forEach(([type, count]) => {
          console.log(`     - ${type}: ${count} report(s)`);
        });
      }
      console.log('');
    });

    console.log('='.repeat(100));
    console.log('USAGE INSTRUCTIONS');
    console.log('='.repeat(100));
    console.log('To fetch validation report for a proposal, run:');
    console.log('node scripts/test-validation-fetch.js <proposalId>');
    console.log('\nExample with ID:');
    if (proposals.length > 0) {
      console.log(`node scripts/test-validation-fetch.js ${proposals[0]._id}`);
    }
    console.log('\nExample with code:');
    if (proposals.length > 0) {
      console.log(`node scripts/test-validation-fetch.js ${proposals[0].proposalCode}`);
    }
    console.log('');

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
  } finally {
    await mongoose.connection.close();
    console.log('\n✓ MongoDB connection closed');
  }
}

listProposalsWithReports();
