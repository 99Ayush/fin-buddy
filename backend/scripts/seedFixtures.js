/**
 * Seed Script - Populate Report Store with Day-Zero Fixtures
 * Run with: npm run seed
 */

import reportStore from '../src/shared/reportStore/index.js';

const USER_ID = 'demo-user';

async function seed() {
  console.log('🌱 Seeding day-zero fixtures...\n');

  try {
    const results = await reportStore.seedFixtures(USER_ID);

    console.log('✅ Fixtures seeded successfully:\n');
    for (const { docId, documentType } of results) {
      console.log(`   📄 ${documentType}: ${docId}`);
    }

    // Verify by listing
    const reports = await reportStore.listReports(USER_ID);
    console.log(`\n📊 Total reports for ${USER_ID}: ${reports.length}`);

    const stats = reportStore.getStats();
    console.log('\n📈 Storage stats:');
    console.log(`   Total reports: ${stats.totalReports}`);
    console.log(`   Total users: ${stats.totalUsers}`);
    console.log(`   By type:`, stats.reportsByType);

    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  }
}

seed();