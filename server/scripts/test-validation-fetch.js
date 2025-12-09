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
 * Test script to fetch and display validation report data
 * Usage: node scripts/test-validation-fetch.js <proposalId>
 */

async function fetchValidationReport(proposalId) {
  try {
    // Connect to MongoDB
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/coal-research');
    console.log('✓ Connected to MongoDB\n');

    // Find proposal
    let proposal;
    if (mongoose.Types.ObjectId.isValid(proposalId) && proposalId.length === 24) {
      proposal = await Proposal.findById(proposalId);
    } else {
      proposal = await Proposal.findOne({ proposalCode: proposalId });
    }

    if (!proposal) {
      console.error('❌ Proposal not found');
      return;
    }

    console.log('='.repeat(80));
    console.log('PROPOSAL INFORMATION');
    console.log('='.repeat(80));
    console.log(`ID: ${proposal._id}`);
    console.log(`Code: ${proposal.proposalCode}`);
    console.log(`Title: ${proposal.title || 'N/A'}`);
    console.log(`Status: ${proposal.status}`);
    console.log('\n');

    // Check aiReports array
    if (!proposal.aiReports || proposal.aiReports.length === 0) {
      console.log('❌ No AI reports found in this proposal');
      console.log('The aiReports array is empty\n');
      return;
    }

    console.log('='.repeat(80));
    console.log('ALL AI REPORTS');
    console.log('='.repeat(80));
    console.log(`Total reports: ${proposal.aiReports.length}\n`);

    proposal.aiReports.forEach((report, index) => {
      console.log(`Report #${index + 1}:`);
      console.log(`  Type: ${report.reportType}`);
      console.log(`  Version: ${report.version || 'N/A'}`);
      console.log(`  Generated At: ${report.generatedAt}`);
      console.log(`  Has Data: ${report.reportData ? 'Yes' : 'No'}`);
      console.log('');
    });

    // Filter validation reports
    const validationReports = proposal.aiReports.filter(
      report => report.reportType === 'validation'
    );

    if (validationReports.length === 0) {
      console.log('❌ No validation reports found');
      console.log('Available report types:', 
        [...new Set(proposal.aiReports.map(r => r.reportType))].join(', ')
      );
      console.log('\n');
      return;
    }

    console.log('='.repeat(80));
    console.log('VALIDATION REPORTS');
    console.log('='.repeat(80));
    console.log(`Total validation reports: ${validationReports.length}\n`);

    // Get latest validation report
    const latestReport = validationReports[validationReports.length - 1];

    console.log('='.repeat(80));
    console.log('LATEST VALIDATION REPORT');
    console.log('='.repeat(80));
    console.log(`Version: ${latestReport.version || 'N/A'}`);
    console.log(`Generated At: ${latestReport.generatedAt}`);
    console.log(`Report Type: ${latestReport.reportType}`);
    console.log('\n');

    console.log('='.repeat(80));
    console.log('VALIDATION REPORT DATA (JSON)');
    console.log('='.repeat(80));
    console.log(JSON.stringify(latestReport.reportData, null, 2));
    console.log('\n');

    console.log('='.repeat(80));
    console.log('API RESPONSE FORMAT (as returned by backend)');
    console.log('='.repeat(80));
    const apiResponse = {
      success: true,
      data: {
        proposalId: proposal._id,
        proposalCode: proposal.proposalCode,
        version: latestReport.version,
        reportType: latestReport.reportType,
        reportData: latestReport.reportData,
        generatedAt: latestReport.generatedAt
      }
    };
    console.log(JSON.stringify(apiResponse, null, 2));
    console.log('\n');

    console.log('✓ Test completed successfully');

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
  } finally {
    await mongoose.connection.close();
    console.log('\n✓ MongoDB connection closed');
  }
}

// Get proposalId from command line arguments
const proposalId = process.argv[2];

if (!proposalId) {
  console.error('Usage: node scripts/test-validation-fetch.js <proposalId>');
  console.error('Example: node scripts/test-validation-fetch.js 507f1f77bcf86cd799439011');
  console.error('Example: node scripts/test-validation-fetch.js PROP-2024-001');
  process.exit(1);
}

console.log(`\nFetching validation report for proposal: ${proposalId}\n`);
fetchValidationReport(proposalId);
