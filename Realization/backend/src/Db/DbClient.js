const {PrismaClient} = require("@prisma/client");
const DbClient = new PrismaClient();
module.exports = { DbClient };