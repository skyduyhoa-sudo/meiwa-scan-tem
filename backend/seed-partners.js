const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function seedPartners() {
  const partners = [
    { name: 'GEM', fullName: 'Đối tác GEM' },
    { name: 'KOA MALAY-TAISOU', fullName: 'Đối tác KOA MALAY-TAISOU' },
    { name: 'NAGOYA', fullName: 'Đối tác NAGOYA' },
    { name: 'ROHM', fullName: 'Đối tác ROHM' },
    { name: 'TAIYOSHA', fullName: 'Đối tác TAIYOSHA' },
    { name: 'VISHAY', fullName: 'Đối tác VISHAY' }
  ];

  try {
    for (const p of partners) {
      const exists = await prisma.partner.findFirst({ where: { name: p.name } });
      if (!exists) {
        await prisma.partner.create({ data: p });
        console.log(`Added partner: ${p.name}`);
      }
    }
    console.log('Seed partners success');
  } catch (error) {
    console.error('Error seeding partners:', error);
  } finally {
    await prisma.$disconnect();
  }
}
seedPartners();
