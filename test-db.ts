import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  // Test the connection
  await prisma.$connect()
  console.log('Database connection successful!')
  await prisma.$disconnect()
}

main()
