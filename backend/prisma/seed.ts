import { PrismaClient, UserRole } from '@prisma/client'; // Import Prisma client and UserRole enum for seeding database records
import bcrypt from 'bcryptjs'; // Import bcrypt to hash passwords before storing seed users

const prisma = new PrismaClient(); // Create a Prisma client instance for this seed script

async function main() { // Main seed function — creates all default users, branches, and menu items
  const password = await bcrypt.hash('password123', 10); // Hash the shared seed password once and reuse it for all seed users

  // ── Users (upsert by email — safe to run repeatedly) ──────────────────────
  await prisma.user.upsert({ // Create or update the admin user — upsert ensures the seed is idempotent
    where:  { email: 'admin@steakz.com' }, // Look up by unique email to decide create vs update
    update: { password_hash: password, role: UserRole.ADMIN, firstName: 'Admin', lastName: 'User' }, // Refresh password and role if the user already exists
    create: { email: 'admin@steakz.com', password_hash: password, role: UserRole.ADMIN, firstName: 'Admin', lastName: 'User' }, // Create the admin record if it doesn't exist yet
  });

  await prisma.user.upsert({ // Create or update the HQ manager seed user
    where:  { email: 'hq@steakz.com' }, // Look up by unique email
    update: { password_hash: password, role: UserRole.HQ_MANAGER, firstName: 'HQ', lastName: 'Manager' }, // Refresh if exists
    create: { email: 'hq@steakz.com', password_hash: password, role: UserRole.HQ_MANAGER, firstName: 'HQ', lastName: 'Manager' }, // Create if not exists
  });

  await prisma.user.upsert({ // Create or update the test customer seed user
    where:  { email: 'customer@steakz.com' }, // Look up by unique email
    update: { password_hash: password, role: UserRole.CUSTOMER, firstName: 'Test', lastName: 'Customer' }, // Refresh if exists
    create: { email: 'customer@steakz.com', password_hash: password, role: UserRole.CUSTOMER, firstName: 'Test', lastName: 'Customer' }, // Create if not exists
  });

  // ── Branches (upsert by name) ──────────────────────────────────────────────
  const mainBranch = await prisma.branch.upsert({ // Create or retrieve the London branch
    where:  { name: 'Steakz London Branch' }, // Look up by unique name
    update: {}, // No fields to update — just retrieve the existing record if it exists
    create: { name: 'Steakz London Branch', location_address: '123 Steakhouse Ave, London' }, // Create with name and address if not exists
  });

  const uptownBranch = await prisma.branch.upsert({ // Create or retrieve the Uptown branch
    where:  { name: 'Steakz Uptown Branch' }, // Look up by unique name
    update: {}, // No fields to update — just retrieve the existing record
    create: { name: 'Steakz Uptown Branch', location_address: '456 Grill Street, Manchester' }, // Create with name and address if not exists
  });

  // ── Branch staff (upsert after branches exist) ────────────────────────────
  await prisma.user.upsert({ // Create or update the branch manager — seeded after branches so branch_id is available
    where:  { email: 'branch_manager@steakz.com' }, // Look up by unique email
    update: { password_hash: password, role: UserRole.BRANCH_MANAGER, firstName: 'Branch', lastName: 'Manager', branch_id: mainBranch.id }, // Refresh and assign to London branch
    create: { email: 'branch_manager@steakz.com', password_hash: password, role: UserRole.BRANCH_MANAGER, firstName: 'Branch', lastName: 'Manager', branch_id: mainBranch.id }, // Create and assign to London branch
  });

  await prisma.user.upsert({ // Create or update the test waiter — assigned to the London branch
    where:  { email: 'waiter@steakz.com' }, // Look up by unique email
    update: { password_hash: password, role: UserRole.WAITER, firstName: 'Test', lastName: 'Waiter', branch_id: mainBranch.id }, // Refresh and assign to London branch
    create: { email: 'waiter@steakz.com', password_hash: password, role: UserRole.WAITER, firstName: 'Test', lastName: 'Waiter', branch_id: mainBranch.id }, // Create and assign to London branch
  });

  await prisma.user.upsert({ // Create or update the test chef — assigned to the London branch
    where:  { email: 'testchef@steakz.com' },
    update: { password_hash: password, role: UserRole.CHEF, firstName: 'Test', lastName: 'Chef', branch_id: mainBranch.id },
    create: { email: 'testchef@steakz.com', password_hash: password, role: UserRole.CHEF, firstName: 'Test', lastName: 'Chef', branch_id: mainBranch.id },
  });

  // ── Menu items (only seed if branch has none yet) ─────────────────────────
  const mainMenuCount = await prisma.menuItem.count({ where: { branch_id: mainBranch.id } }); // Check how many menu items the London branch already has
  if (mainMenuCount === 0) { // Only seed menu items if the branch has none — prevents duplicate items on re-run
    await prisma.menuItem.createMany({ // Bulk-create all menu items for the London branch in one database call
      data: [
        { item_name: 'Grilled Ribeye',   description: 'Juicy ribeye steak with garlic butter',                  price: 35.99, category: 'Main Course', availability_status: true,  viewCount: 125, branch_id: mainBranch.id }, // Signature steak item, currently available
        { item_name: 'Classic Cheeseburger', description: 'Beef burger with cheese, lettuce, and tomato',       price: 18.50, category: 'Main Course', availability_status: false, viewCount:  98, branch_id: mainBranch.id }, // Currently unavailable (sold out)
        { item_name: 'Caesar Salad',     description: 'Crisp romaine with parmesan and croutons',               price: 12.25, category: 'Appetizer',   availability_status: false, viewCount:  72, branch_id: mainBranch.id }, // Currently unavailable
        { item_name: 'BBQ Beef Ribs',    description: 'Slow-smoked ribs glazed in smoky BBQ sauce',             price: 32.50, category: 'Main Course', availability_status: true,  viewCount:  89, branch_id: mainBranch.id }, // Available slow-smoked ribs
        { item_name: 'Chicken Tikka',    description: 'Tender chicken marinated in spiced yoghurt, char-grilled', price: 22.00, category: 'Main Course', availability_status: true, viewCount: 74, branch_id: mainBranch.id }, // Available char-grilled chicken
        { item_name: 'Garlic Bread',     description: 'Toasted baguette with herb garlic butter',               price:  6.50, category: 'Appetizer',   availability_status: false, viewCount: 110, branch_id: mainBranch.id }, // Currently unavailable despite high view count
        { item_name: 'Mango Sorbet',     description: 'Refreshing tropical sorbet made from real mango',        price:  8.00, category: 'Dessert',     availability_status: true,  viewCount:  45, branch_id: mainBranch.id }, // Available dessert option
        { item_name: 'Iced Lemonade',    description: 'Freshly squeezed lemonade over crushed ice',             price:  4.50, category: 'Beverage',    availability_status: true,  viewCount: 130, branch_id: mainBranch.id }, // Most viewed item on the London menu
        { item_name: 'sadza',            description: 'carbohydrates',                                          price:  5.00, category: 'Main Course', availability_status: true,  viewCount:   0, branch_id: mainBranch.id }, // Test item with no views yet
      ],
    });
  }

  const uptownMenuCount = await prisma.menuItem.count({ where: { branch_id: uptownBranch.id } }); // Check how many menu items the Uptown branch already has
  if (uptownMenuCount === 0) { // Only seed if the branch has no items — prevents duplicates on re-run
    await prisma.menuItem.createMany({ // Bulk-create all menu items for the Uptown branch in one database call
      data: [
        { item_name: 'Steak Frites',      description: 'Sirloin steak with fries and herb butter',                               price: 29.00, category: 'Main Course', availability_status: true, viewCount: 118, branch_id: uptownBranch.id }, // Popular main course
        { item_name: 'Truffle Fries',     description: 'Crispy fries tossed in truffle oil',                                     price:  9.99, category: 'Side',        availability_status: true, viewCount:  84, branch_id: uptownBranch.id }, // Popular side dish
        { item_name: 'Chocolate Lava Cake', description: 'Warm chocolate cake with molten center',                               price: 11.50, category: 'Dessert',     availability_status: true, viewCount:  60, branch_id: uptownBranch.id }, // Popular dessert
        { item_name: 'Surf & Turf',       description: 'Filet mignon paired with grilled tiger prawns',                          price: 45.00, category: 'Main Course', availability_status: true, viewCount:  95, branch_id: uptownBranch.id }, // Premium main course at highest price
        { item_name: 'Greek Salad',       description: 'Tomatoes, cucumber, olives, and feta with oregano dressing',             price: 11.00, category: 'Salad',       availability_status: true, viewCount:  55, branch_id: uptownBranch.id }, // Light salad option
        { item_name: 'French Onion Soup', description: 'Rich caramelised onion broth topped with gruyère crouton',               price: 10.50, category: 'Appetizer',   availability_status: true, viewCount:  67, branch_id: uptownBranch.id }, // Classic French appetiser
        { item_name: 'Tiramisu',          description: 'Classic Italian dessert with espresso-soaked ladyfingers and mascarpone', price: 10.00, category: 'Dessert',     availability_status: true, viewCount:  78, branch_id: uptownBranch.id }, // Most viewed dessert on the Uptown menu
      ],
    });
  }

  console.log('✅ Seed complete'); // Confirm seed ran successfully
  console.log(`   Admin  → admin@steakz.com  / password123`); // Print admin login credentials for reference
  console.log(`   HQ     → hq@steakz.com     / password123`); // Print HQ manager credentials
  console.log(`   Manager→ branch_manager@steakz.com / password123  (${mainBranch.name})`); // Print branch manager credentials and their assigned branch
  console.log(`   Waiter → waiter@steakz.com / password123  (${mainBranch.name})`); // Print waiter credentials and their assigned branch
  console.log(`   Chef   → testchef@steakz.com / password123  (${mainBranch.name})`); // Print chef credentials and their assigned branch
  console.log(`   Customer→ customer@steakz.com / password123`); // Print customer credentials
}

main() // Run the seed function
  .then(() => prisma.$disconnect()) // Disconnect from the database after a successful seed
  .catch(async (e) => { // Handle any errors during seeding
    console.error(e); // Log the error to the console for debugging
    await prisma.$disconnect(); // Disconnect from the database even if the seed failed
    throw e; // Re-throw the error so the process exits with a non-zero code, signalling failure
  });
