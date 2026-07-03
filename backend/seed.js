const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function seed() {
  try {
    const role = await prisma.role.upsert({
      where: { name: 'Admin' },
      update: {},
      create: { name: 'Admin', status: 'Đang hoạt động' }
    });

    const hashedPassword = await bcrypt.hash('123456', 10);

    const user = await prisma.user.upsert({
      where: { username: 'admin' },
      update: { password: hashedPassword, roleId: role.id },
      create: {
        username: 'admin',
        password: hashedPassword,
        firstName: 'System',
        lastName: 'Admin',
        roleId: role.id,
        status: 'Đang hoạt động'
      }
    });

    console.log('Seed success:', user.username);
  } catch (error) {
    console.error('Seed error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

seed();
