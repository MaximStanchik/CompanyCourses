const { PrismaClient } = require("@prisma/client");
const DbClient = new PrismaClient();

async function generateUniqueNickname() {
  let nickname;
  let exists = true;

  while (exists) {
    const randomNumber = Math.floor(Math.random() * 1_000_000_000); 
    nickname = `Anonymous#${randomNumber}`;
    const existingUser = await DbClient.profile.findUnique({
      where: { nickname },
    });
    exists = !!existingUser;
  }

  return nickname;
}

module.exports = generateUniqueNickname;
