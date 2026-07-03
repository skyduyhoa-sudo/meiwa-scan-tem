const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function updateName() {
  try {
    await prisma.user.update({
      where: { username: 'admin' },
      data: {
        firstName: 'Việt Nam Miewa',
        lastName: 'Duy Hoà'
      }
    });
    console.log('Update success');
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}
updateName();
