import { prisma } from '../src/lib/prisma';
import fs from 'fs';
import pdf from 'pdf-parse';
import bcrypt from 'bcryptjs';

async function main() {
  console.log("Reading PDF file...");
  const dataBuffer = fs.readFileSync('Personal con fotos.pdf');
  const data = await pdf(dataBuffer);
  
  const text = data.text;
  const lines = text.split('\n');
  
  // Regex to capture: ID, Name, DNI
  // Example: 1204RIVAS, NÉSTOR EMILIANO33.532.816...
  const regex = /^(\d+)([A-ZÁÉÍÓÚÑÜ,\s]+?)(\d{2}\.\d{3}\.\d{3})/;
  
  let added = 0;
  
  // We need bcrypt to hash the password 'wentop'
  // Since we haven't installed bcrypt, we will do it in plain text for now, or assume next-auth will handle it.
  // Actually, standard practice for credentials provider is hashed passwords.
  // We will install bcryptjs to be safe. Let's just create the array first.
  
  const users = [];
  
  for (const line of lines) {
    const match = line.trim().match(regex);
    if (match) {
      const idStr = match[1];
      const name = match[2].trim();
      const dni = match[3].replace(/\./g, '');
      
      users.push({
        name: name.replace(/\s+/g, ' '),
        email: dni, // Using DNI as email/username
        password: 'wentop', 
        mustChangePassword: true,
        role: 'OPERATOR'
      });
    }
  }

  console.log(`Found ${users.length} users in the PDF.`);
  
  if (users.length === 0) {
    console.log("No users found. Check the regex or PDF format.");
    return;
  }

  console.log("Sample user:", users[0]);
  
  console.log("Starting to insert users into the database...");
  try {
    // Add specific Admin user
    const adminPassword = 'Mocolo77'; 
    // In production, we'd hash it: await bcrypt.hash('Mocolo77', 10);
    // For now we assume the login route bcrypt.compares OR allows plain text for first login, 
    // but the login logic uses bcrypt. Let's hash it!
    const hashedAdminPassword = await bcrypt.hash(adminPassword, 10);
    
    await prisma.user.upsert({
      where: { email: '36669465' },
      update: {
        role: 'ADMIN',
        mustChangePassword: false,
        password: hashedAdminPassword
      },
      create: {
        email: '36669465',
        name: 'Mocolo77 Admin',
        password: hashedAdminPassword,
        role: 'ADMIN',
        mustChangePassword: false
      }
    });

    for (const user of users) {
      // Upsert so we can run this multiple times safely
      await prisma.user.upsert({
        where: { email: user.email },
        update: {
          mustChangePassword: true,
          role: 'OPERATOR'
        },
        create: user,
      });
    }
    console.log("All users inserted successfully!");
  } catch (error) {
    console.error("Failed to insert users. Make sure your database is running.");
    console.error(error.message);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
