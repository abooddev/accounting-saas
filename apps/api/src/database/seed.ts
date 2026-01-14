import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as bcrypt from 'bcrypt';
import * as schema from './schema';

const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/accounting_dev';

async function seed() {
  console.log('🌱 Starting database seed...');

  const client = postgres(DATABASE_URL);
  const db = drizzle(client, { schema });

  try {
    // Create demo tenant
    console.log('Creating demo tenant...');
    const [tenant] = await db.insert(schema.tenants).values({
      name: 'Demo Minimarket',
      slug: 'demo-minimarket',
      settings: {
        defaultCurrency: 'USD',
        exchangeRate: 89500,
        timezone: 'Asia/Beirut',
        dateFormat: 'DD/MM/YYYY',
      },
    }).returning();
    console.log(`✓ Tenant created: ${tenant.name} (${tenant.id})`);

    // Create demo user (password: demo123)
    console.log('Creating demo user...');
    const passwordHash = await bcrypt.hash('demo123', 10);
    const [user] = await db.insert(schema.users).values({
      tenantId: tenant.id,
      email: 'demo@example.com',
      passwordHash,
      name: 'Demo User',
      role: 'owner',
    }).returning();
    console.log(`✓ User created: ${user.email}`);

    // Create categories
    console.log('Creating categories...');
    const categoriesData = [
      { name: 'Beverages', nameAr: 'مشروبات', sortOrder: 1 },
      { name: 'Snacks', nameAr: 'وجبات خفيفة', sortOrder: 2 },
      { name: 'Dairy', nameAr: 'منتجات الألبان', sortOrder: 3 },
      { name: 'Bread & Bakery', nameAr: 'خبز ومخبوزات', sortOrder: 4 },
      { name: 'Canned Goods', nameAr: 'معلبات', sortOrder: 5 },
      { name: 'Household', nameAr: 'منزلية', sortOrder: 6 },
      { name: 'Personal Care', nameAr: 'عناية شخصية', sortOrder: 7 },
      { name: 'Frozen Foods', nameAr: 'أطعمة مجمدة', sortOrder: 8 },
    ];

    const categories = await db.insert(schema.categories).values(
      categoriesData.map(cat => ({ ...cat, tenantId: tenant.id }))
    ).returning();
    console.log(`✓ ${categories.length} categories created`);

    const catMap = new Map(categories.map(c => [c.name, c.id]));

    // Create products with barcodes for POS testing
    console.log('Creating products...');
    const productsData = [
      // Beverages
      { categoryId: catMap.get('Beverages'), name: 'Coca-Cola 330ml', nameAr: 'كوكا كولا 330مل', barcode: '5449000000996', sku: 'BEV-001', costPrice: '0.35', sellingPrice: '0.50', currentStock: '100' },
      { categoryId: catMap.get('Beverages'), name: 'Pepsi 330ml', nameAr: 'بيبسي 330مل', barcode: '012000001556', sku: 'BEV-002', costPrice: '0.35', sellingPrice: '0.50', currentStock: '100' },
      { categoryId: catMap.get('Beverages'), name: 'Sprite 330ml', nameAr: 'سبرايت 330مل', barcode: '5449000014535', sku: 'BEV-003', costPrice: '0.35', sellingPrice: '0.50', currentStock: '80' },
      { categoryId: catMap.get('Beverages'), name: 'Fanta Orange 330ml', nameAr: 'فانتا برتقال 330مل', barcode: '5449000006332', sku: 'BEV-004', costPrice: '0.35', sellingPrice: '0.50', currentStock: '60' },
      { categoryId: catMap.get('Beverages'), name: 'Water Sohat 500ml', nameAr: 'مياه سوحات 500مل', barcode: '6224000000012', sku: 'BEV-005', costPrice: '0.10', sellingPrice: '0.25', currentStock: '200' },
      { categoryId: catMap.get('Beverages'), name: 'Water Sohat 1.5L', nameAr: 'مياه سوحات 1.5لتر', barcode: '6224000000029', sku: 'BEV-006', costPrice: '0.20', sellingPrice: '0.50', currentStock: '150' },
      { categoryId: catMap.get('Beverages'), name: 'Red Bull 250ml', nameAr: 'ريد بول 250مل', barcode: '9002490100070', sku: 'BEV-007', costPrice: '1.50', sellingPrice: '2.50', currentStock: '50' },
      { categoryId: catMap.get('Beverages'), name: 'Nescafe Classic 200g', nameAr: 'نسكافيه كلاسيك 200غ', barcode: '7613035988699', sku: 'BEV-008', costPrice: '5.00', sellingPrice: '7.50', currentStock: '30' },

      // Snacks
      { categoryId: catMap.get('Snacks'), name: 'Lay\'s Classic 160g', nameAr: 'ليز كلاسيك 160غ', barcode: '6281006203341', sku: 'SNK-001', costPrice: '1.00', sellingPrice: '1.75', currentStock: '50' },
      { categoryId: catMap.get('Snacks'), name: 'Doritos Nacho 180g', nameAr: 'دوريتوس ناتشو 180غ', barcode: '6281006204355', sku: 'SNK-002', costPrice: '1.20', sellingPrice: '2.00', currentStock: '40' },
      { categoryId: catMap.get('Snacks'), name: 'Oreo Original 137g', nameAr: 'اوريو اصلي 137غ', barcode: '7622210049780', sku: 'SNK-003', costPrice: '1.00', sellingPrice: '1.50', currentStock: '60' },
      { categoryId: catMap.get('Snacks'), name: 'Kit Kat 4 Finger', nameAr: 'كيت كات 4 أصابع', barcode: '3800020418246', sku: 'SNK-004', costPrice: '0.50', sellingPrice: '1.00', currentStock: '100' },
      { categoryId: catMap.get('Snacks'), name: 'Mars Bar 51g', nameAr: 'مارس 51غ', barcode: '5000159407236', sku: 'SNK-005', costPrice: '0.50', sellingPrice: '1.00', currentStock: '80' },
      { categoryId: catMap.get('Snacks'), name: 'Snickers 52g', nameAr: 'سنيكرز 52غ', barcode: '5000159461122', sku: 'SNK-006', costPrice: '0.50', sellingPrice: '1.00', currentStock: '80' },

      // Dairy
      { categoryId: catMap.get('Dairy'), name: 'Laban Taanayel 1L', nameAr: 'لبن تعنايل 1لتر', barcode: '5284000000012', sku: 'DRY-001', costPrice: '1.50', sellingPrice: '2.25', currentStock: '40' },
      { categoryId: catMap.get('Dairy'), name: 'Milk Full Fat 1L', nameAr: 'حليب كامل الدسم 1لتر', barcode: '5284000000029', sku: 'DRY-002', costPrice: '1.75', sellingPrice: '2.50', currentStock: '50' },
      { categoryId: catMap.get('Dairy'), name: 'Labneh Taanayel 500g', nameAr: 'لبنة تعنايل 500غ', barcode: '5284000000036', sku: 'DRY-003', costPrice: '2.00', sellingPrice: '3.00', currentStock: '30' },
      { categoryId: catMap.get('Dairy'), name: 'Cheese Picon 8 portions', nameAr: 'جبنة بيكون 8 حبات', barcode: '3073780847308', sku: 'DRY-004', costPrice: '1.50', sellingPrice: '2.50', currentStock: '40' },
      { categoryId: catMap.get('Dairy'), name: 'Butter President 200g', nameAr: 'زبدة برزيدنت 200غ', barcode: '3228020484588', sku: 'DRY-005', costPrice: '3.00', sellingPrice: '4.50', currentStock: '25' },

      // Bread & Bakery
      { categoryId: catMap.get('Bread & Bakery'), name: 'Arabic Bread Pack', nameAr: 'ربطة خبز عربي', barcode: '6224000100001', sku: 'BRD-001', costPrice: '0.30', sellingPrice: '0.50', currentStock: '100' },
      { categoryId: catMap.get('Bread & Bakery'), name: 'Toast Bread White', nameAr: 'خبز توست أبيض', barcode: '6224000100002', sku: 'BRD-002', costPrice: '1.00', sellingPrice: '1.75', currentStock: '50' },
      { categoryId: catMap.get('Bread & Bakery'), name: 'Croissant Plain', nameAr: 'كرواسون سادة', barcode: '6224000100003', sku: 'BRD-003', costPrice: '0.40', sellingPrice: '0.75', currentStock: '30' },

      // Canned Goods
      { categoryId: catMap.get('Canned Goods'), name: 'Tuna California 185g', nameAr: 'تونا كاليفورنيا 185غ', barcode: '6224000200001', sku: 'CAN-001', costPrice: '1.50', sellingPrice: '2.50', currentStock: '60' },
      { categoryId: catMap.get('Canned Goods'), name: 'Chickpeas 400g', nameAr: 'حمص 400غ', barcode: '6224000200002', sku: 'CAN-002', costPrice: '0.75', sellingPrice: '1.25', currentStock: '80' },
      { categoryId: catMap.get('Canned Goods'), name: 'Foul 400g', nameAr: 'فول 400غ', barcode: '6224000200003', sku: 'CAN-003', costPrice: '0.60', sellingPrice: '1.00', currentStock: '80' },
      { categoryId: catMap.get('Canned Goods'), name: 'Corn Sweet 340g', nameAr: 'ذرة حلوة 340غ', barcode: '6224000200004', sku: 'CAN-004', costPrice: '1.00', sellingPrice: '1.75', currentStock: '50' },

      // Household
      { categoryId: catMap.get('Household'), name: 'Persil Powder 3kg', nameAr: 'برسيل مسحوق 3كغ', barcode: '6224000300001', sku: 'HOU-001', costPrice: '8.00', sellingPrice: '12.00', currentStock: '20' },
      { categoryId: catMap.get('Household'), name: 'Fairy Dish Soap 500ml', nameAr: 'فيري صابون جلي 500مل', barcode: '8001090206817', sku: 'HOU-002', costPrice: '2.00', sellingPrice: '3.50', currentStock: '40' },
      { categoryId: catMap.get('Household'), name: 'Toilet Paper 12 Rolls', nameAr: 'ورق تواليت 12 رول', barcode: '6224000300003', sku: 'HOU-003', costPrice: '3.00', sellingPrice: '5.00', currentStock: '30' },

      // Personal Care
      { categoryId: catMap.get('Personal Care'), name: 'Colgate Toothpaste 100ml', nameAr: 'كولجيت معجون أسنان 100مل', barcode: '8714789731018', sku: 'PER-001', costPrice: '1.50', sellingPrice: '2.50', currentStock: '50' },
      { categoryId: catMap.get('Personal Care'), name: 'Head & Shoulders 400ml', nameAr: 'هيد أند شولدرز 400مل', barcode: '4015400916536', sku: 'PER-002', costPrice: '4.00', sellingPrice: '6.50', currentStock: '30' },
      { categoryId: catMap.get('Personal Care'), name: 'Dove Soap 135g', nameAr: 'صابون دوف 135غ', barcode: '8710908304507', sku: 'PER-003', costPrice: '1.00', sellingPrice: '1.75', currentStock: '60' },

      // Frozen Foods
      { categoryId: catMap.get('Frozen Foods'), name: 'French Fries 1kg', nameAr: 'بطاطا مقلية 1كغ', barcode: '6224000400001', sku: 'FRZ-001', costPrice: '2.50', sellingPrice: '4.00', currentStock: '40' },
      { categoryId: catMap.get('Frozen Foods'), name: 'Pizza Pepperoni', nameAr: 'بيتزا بيبروني', barcode: '6224000400002', sku: 'FRZ-002', costPrice: '4.00', sellingPrice: '6.50', currentStock: '25' },
      { categoryId: catMap.get('Frozen Foods'), name: 'Ice Cream Vanilla 500ml', nameAr: 'ايس كريم فانيلا 500مل', barcode: '6224000400003', sku: 'FRZ-003', costPrice: '3.00', sellingPrice: '5.00', currentStock: '30' },
    ];

    const products = await db.insert(schema.products).values(
      productsData.map(prod => ({
        ...prod,
        tenantId: tenant.id,
        costCurrency: 'USD' as const,
        sellingCurrency: 'USD' as const,
        unit: 'piece' as const,
      }))
    ).returning();
    console.log(`✓ ${products.length} products created`);

    // Create money accounts
    console.log('Creating money accounts...');
    const accounts = await db.insert(schema.moneyAccounts).values([
      { tenantId: tenant.id, name: 'Cash Register USD', nameAr: 'صندوق نقدي دولار', type: 'cash', currency: 'USD', currentBalance: '500.00', isDefault: true },
      { tenantId: tenant.id, name: 'Cash Register LBP', nameAr: 'صندوق نقدي ليرة', type: 'cash', currency: 'LBP', currentBalance: '50000000.00', isDefault: false },
      { tenantId: tenant.id, name: 'Bank Account USD', nameAr: 'حساب بنك دولار', type: 'bank', currency: 'USD', currentBalance: '10000.00', isDefault: false },
    ]).returning();
    console.log(`✓ ${accounts.length} money accounts created`);

    // Create exchange rate
    console.log('Creating exchange rate...');
    await db.insert(schema.exchangeRates).values({
      tenantId: tenant.id,
      fromCurrency: 'USD',
      toCurrency: 'LBP',
      rate: '89500',
      effectiveDate: new Date().toISOString().split('T')[0],
      source: 'manual',
    });
    console.log('✓ Exchange rate created: 1 USD = 89,500 LBP');

    // Create some contacts
    console.log('Creating contacts...');
    const contacts = await db.insert(schema.contacts).values([
      { tenantId: tenant.id, type: 'supplier', name: 'Pepsi Distribution', nameAr: 'موزع بيبسي', phone: '+961 1 234567', paymentTermsDays: 30 },
      { tenantId: tenant.id, type: 'supplier', name: 'Coca-Cola Distribution', nameAr: 'موزع كوكا كولا', phone: '+961 1 234568', paymentTermsDays: 30 },
      { tenantId: tenant.id, type: 'supplier', name: 'Taanayel Dairy', nameAr: 'ألبان تعنايل', phone: '+961 1 234569', paymentTermsDays: 15 },
      { tenantId: tenant.id, type: 'customer', name: 'Walk-in Customer', nameAr: 'زبون عابر', phone: '' },
    ]).returning();
    console.log(`✓ ${contacts.length} contacts created`);

    console.log('\n✅ Seed completed successfully!');
    console.log('\n📝 Demo credentials:');
    console.log('   Email: demo@example.com');
    console.log('   Password: demo123');
    console.log(`   Tenant: ${tenant.name}`);

  } catch (error) {
    console.error('❌ Seed failed:', error);
    throw error;
  } finally {
    await client.end();
  }
}

seed().catch(console.error);
