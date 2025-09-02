import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Simple demo data that works with current schema
const OBJECT_TYPES = [
  {
    name: 'Guest Request',
    fieldsSchema: {
      fields: [
        { key: 'priority', type: 'string', required: true },
        { key: 'category', type: 'string', required: true },
        { key: 'description', type: 'string', required: true },
        { key: 'estimatedCost', type: 'number', required: false },
      ],
    },
    validations: {
      priority: ['High', 'Medium', 'Low'],
      category: ['Transportation', 'Restaurant', 'Activities', 'Shopping'],
    },
    uiHints: {
      priority: { component: 'select', options: ['High', 'Medium', 'Low'] },
      category: { component: 'select', options: ['Transportation', 'Restaurant', 'Activities', 'Shopping'] },
    },
  },
  {
    name: 'Room Service',
    fieldsSchema: {
      fields: [
        { key: 'items', type: 'json', required: true },
        { key: 'totalAmount', type: 'number', required: true },
        { key: 'deliveryTime', type: 'date', required: true },
        { key: 'specialRequests', type: 'string', required: false },
      ],
    },
    validations: {},
    uiHints: {
      items: { component: 'json-editor', label: 'Order Items' },
      totalAmount: { component: 'currency', currency: 'USD' },
      deliveryTime: { component: 'datetime-picker' },
    },
  },
  {
    name: 'Maintenance Request',
    fieldsSchema: {
      fields: [
        { key: 'issueType', type: 'string', required: true },
        { key: 'urgency', type: 'string', required: true },
        { key: 'location', type: 'string', required: true },
        { key: 'description', type: 'string', required: true },
      ],
    },
    validations: {
      issueType: ['Plumbing', 'Electrical', 'HVAC', 'Furniture', 'Other'],
      urgency: ['Emergency', 'High', 'Medium', 'Low'],
    },
    uiHints: {
      issueType: { component: 'select' },
      urgency: { component: 'select' },
      location: { component: 'text', placeholder: 'Room, Area, etc.' },
    },
  },
];

const VENDORS_DATA = [
  {
    name: 'Elite Transportation Services',
    email: 'bookings@elitetrans.cr',
    phone: '+506-2234-5678',
    category: 'Transportation',
    policies: {
      cancellationPolicy: '24 hours advance notice required',
      paymentTerms: 'Net 15 days',
      serviceHours: '6:00 AM - 11:00 PM',
    },
    performance: {
      responseTimeHours: 2,
      confirmationRate: 0.95,
      rating: 4.8,
      totalBookings: 245,
    },
  },
  {
    name: 'Adventure Costa Rica',
    email: 'reservations@adventurecr.com',
    phone: '+506-2345-6789',
    category: 'Tours & Activities',
    policies: {
      cancellationPolicy: '48 hours advance notice for full refund',
      paymentTerms: 'Payment on booking',
      serviceHours: '7:00 AM - 6:00 PM',
    },
    performance: {
      responseTimeHours: 4,
      confirmationRate: 0.92,
      rating: 4.9,
      totalBookings: 189,
    },
  },
  {
    name: 'Pura Vida Cuisine',
    email: 'reservations@puravidacr.com',
    phone: '+506-2456-7890',
    category: 'Restaurants',
    policies: {
      cancellationPolicy: '2 hours advance notice required',
      paymentTerms: 'Direct billing available',
      serviceHours: '11:30 AM - 10:00 PM',
    },
    performance: {
      responseTimeHours: 1,
      confirmationRate: 0.98,
      rating: 4.7,
      totalBookings: 432,
    },
  },
  {
    name: 'Tropical Maintenance Solutions',
    email: 'service@tropicalmaint.cr',
    phone: '+506-2678-9012',
    category: 'Maintenance',
    policies: {
      cancellationPolicy: '1 hour advance notice for non-emergency',
      paymentTerms: 'Net 30 days',
      serviceHours: '8:00 AM - 6:00 PM (emergency 24/7)',
    },
    performance: {
      responseTimeHours: 6,
      confirmationRate: 0.89,
      rating: 4.3,
      totalBookings: 78,
    },
  },
];

const PLAYBOOKS_DATA = [
  {
    name: 'Guest Check-in Welcome Setup',
    trigger: 'reservation.checkedin',
    conditions: {
      type: 'all',
      rules: [
        { field: 'guest.vipStatus', operator: 'in', value: ['GOLD', 'PLATINUM', 'DIAMOND'] },
      ],
    },
    actions: [
      {
        type: 'createConciergeObject',
        params: {
          type: 'Guest Request',
          status: 'open',
          dueAt: '+2h',
        },
      },
    ],
    enforcements: {
      slaHours: 2,
      escalation: { manager: true },
    },
  },
  {
    name: 'Maintenance Emergency Response',
    trigger: 'concierge.object.created',
    conditions: {
      type: 'all',
      rules: [
        { field: 'object.type', operator: 'eq', value: 'Maintenance Request' },
        { field: 'object.urgency', operator: 'in', value: ['Emergency', 'High'] },
      ],
    },
    actions: [
      {
        type: 'createVendorLink',
        params: {
          vendorCategory: 'Maintenance',
          autoNotify: true,
        },
      },
    ],
    enforcements: {
      slaHours: 0.5,
      escalation: { manager: true, sms: true },
    },
  },
];

async function seedSimpleDemoData() {
  console.log('🏨 Starting simple Concierge and Vendors demo data seeding...');

  try {
    // Get existing properties
    const properties = await prisma.property.findMany({
      where: {
        isActive: true,
        deletedAt: null,
      },
      select: {
        id: true,
        organizationId: true,
        name: true,
      },
    });

    if (properties.length === 0) {
      console.log('❌ No active properties found.');
      return;
    }

    console.log(`📍 Found ${properties.length} properties:`);
    properties.forEach(p => console.log(`  - ${p.name} (${p.id})`));

    // Enable modules at organization level only (no propertyId)
    console.log('\n🔧 Enabling modules at organization level...');
    const uniqueOrgs = [...new Set(properties.map(p => p.organizationId))];
    
    for (const orgId of uniqueOrgs) {
      // Enable Concierge module
      await prisma.moduleSubscription.upsert({
        where: {
          organizationId_moduleName: {
            organizationId: orgId,
            moduleName: 'concierge',
          },
        },
        update: {
          isEnabled: true,
          enabledAt: new Date(),
        },
        create: {
          organizationId: orgId,
          moduleName: 'concierge',
          isEnabled: true,
          enabledAt: new Date(),
          settings: {
            autoAssignVip: true,
            slaHours: 2,
            enablePlaybooks: true,
          },
        },
      });

      // Enable Vendors module
      await prisma.moduleSubscription.upsert({
        where: {
          organizationId_moduleName: {
            organizationId: orgId,
            moduleName: 'vendors',
          },
        },
        update: {
          isEnabled: true,
          enabledAt: new Date(),
        },
        create: {
          organizationId: orgId,
          moduleName: 'vendors',
          isEnabled: true,
          enabledAt: new Date(),
          settings: {
            autoNotifyVendors: true,
            requireConfirmation: true,
          },
        },
      });
    }

    // Create Object Types for each property
    console.log('\n📋 Creating concierge object types...');
    let objectTypesCreated = 0;
    for (const property of properties) {
      for (const objectType of OBJECT_TYPES) {
        await prisma.objectType.upsert({
          where: {
            organizationId_propertyId_name: {
              organizationId: property.organizationId,
              propertyId: property.id,
              name: objectType.name,
            },
          },
          update: {
            fieldsSchema: objectType.fieldsSchema,
            validations: objectType.validations,
            uiHints: objectType.uiHints,
            isActive: true,
          },
          create: {
            organizationId: property.organizationId,
            propertyId: property.id,
            name: objectType.name,
            fieldsSchema: objectType.fieldsSchema,
            validations: objectType.validations,
            uiHints: objectType.uiHints,
            isActive: true,
          },
        });
        objectTypesCreated++;
      }
    }

    // Create Vendors for each property
    console.log('\n🏪 Creating vendor directory...');
    let vendorsCreated = 0;
    
    for (const property of properties) {
      for (const vendorData of VENDORS_DATA) {
        await prisma.vendor.create({
          data: {
            organizationId: property.organizationId,
            propertyId: property.id,
            name: vendorData.name,
            email: vendorData.email,
            phone: vendorData.phone,
            category: vendorData.category,
            policies: vendorData.policies,
            performance: vendorData.performance,
            isActive: true,
          },
        });
        vendorsCreated++;
      }
    }

    // Create Playbooks for each property
    console.log('\n⚙️ Creating automation playbooks...');
    let playbooksCreated = 0;
    for (const property of properties) {
      for (const playbookData of PLAYBOOKS_DATA) {
        await prisma.playbook.upsert({
          where: {
            organizationId_propertyId_name: {
              organizationId: property.organizationId,
              propertyId: property.id,
              name: playbookData.name,
            },
          },
          update: {
            trigger: playbookData.trigger,
            conditions: playbookData.conditions,
            actions: playbookData.actions,
            enforcements: playbookData.enforcements,
            isActive: true,
          },
          create: {
            organizationId: property.organizationId,
            propertyId: property.id,
            name: playbookData.name,
            trigger: playbookData.trigger,
            conditions: playbookData.conditions,
            actions: playbookData.actions,
            enforcements: playbookData.enforcements,
            isActive: true,
          },
        });
        playbooksCreated++;
      }
    }

    // Create sample Concierge Objects
    console.log('\n📝 Creating sample concierge objects...');
    let conciergeObjectsCreated = 0;
    
    // Get some existing guests for realistic data
    const guests = await prisma.guest.findMany({
      take: 6,
      orderBy: { createdAt: 'desc' },
    });

    const reservations = await prisma.reservation.findMany({
      where: {
        status: { in: ['CHECKED_IN', 'CONFIRMED'] },
      },
      take: 3,
      orderBy: { checkedInAt: 'desc' },
    });

    for (const property of properties) {
      const propertyGuests = guests.filter(g => g.propertyId === property.id);
      const propertyReservations = reservations.filter(r => r.propertyId === property.id);

      // Create 3 sample objects per property
      const sampleObjects = [
        {
          type: 'Guest Request',
          status: 'open',
          dueAt: new Date(Date.now() + 2 * 60 * 60 * 1000), // 2 hours from now
          guestId: propertyGuests[0]?.id || null,
          reservationId: propertyReservations[0]?.id || null,
          attributes: [
            { fieldKey: 'priority', fieldType: 'string', stringValue: 'High' },
            { fieldKey: 'category', fieldType: 'string', stringValue: 'Transportation' },
            { fieldKey: 'description', fieldType: 'string', stringValue: 'Guest needs airport transfer for tomorrow morning flight' },
            { fieldKey: 'estimatedCost', fieldType: 'number', numberValue: 45.00 },
          ],
        },
        {
          type: 'Room Service',
          status: 'in_progress',
          dueAt: new Date(Date.now() + 30 * 60 * 1000), // 30 minutes
          guestId: propertyGuests[1]?.id || null,
          attributes: [
            { fieldKey: 'items', fieldType: 'json', jsonValue: [{ item: 'Club Sandwich', qty: 1, price: 18 }, { item: 'Fresh Fruit', qty: 1, price: 12 }] },
            { fieldKey: 'totalAmount', fieldType: 'number', numberValue: 30.00 },
            { fieldKey: 'deliveryTime', fieldType: 'date', dateValue: new Date(Date.now() + 30 * 60 * 1000) },
          ],
        },
        {
          type: 'Maintenance Request',
          status: 'open',
          dueAt: new Date(Date.now() + 4 * 60 * 60 * 1000), // 4 hours
          attributes: [
            { fieldKey: 'issueType', fieldType: 'string', stringValue: 'HVAC' },
            { fieldKey: 'urgency', fieldType: 'string', stringValue: 'Medium' },
            { fieldKey: 'location', fieldType: 'string', stringValue: 'Room 205' },
            { fieldKey: 'description', fieldType: 'string', stringValue: 'Air conditioning not cooling properly' },
          ],
        },
      ];

      for (const objectData of sampleObjects) {
        const conciergeObject = await prisma.conciergeObject.create({
          data: {
            organizationId: property.organizationId,
            propertyId: property.id,
            type: objectData.type,
            status: objectData.status,
            dueAt: objectData.dueAt,
            guestId: objectData.guestId,
            reservationId: objectData.reservationId,
            assignments: null,
            files: null,
          },
        });

        // Create attributes
        if (objectData.attributes) {
          await prisma.conciergeAttribute.createMany({
            data: objectData.attributes.map(attr => ({
              objectId: conciergeObject.id,
              fieldKey: attr.fieldKey,
              fieldType: attr.fieldType,
              stringValue: attr.stringValue || null,
              numberValue: attr.numberValue || null,
              booleanValue: attr.booleanValue || null,
              dateValue: attr.dateValue || null,
              jsonValue: attr.jsonValue || null,
            })),
          });
        }

        conciergeObjectsCreated++;
      }
    }

    // Display summary
    console.log('\n📊 Demo Data Summary:');
    console.log(`  - Properties seeded: ${properties.length}`);
    console.log(`  - Organizations with modules enabled: ${uniqueOrgs.length}`);
    console.log(`  - Object types created: ${objectTypesCreated}`);
    console.log(`  - Vendors created: ${vendorsCreated}`);
    console.log(`  - Playbooks created: ${playbooksCreated}`);
    console.log(`  - Concierge objects created: ${conciergeObjectsCreated}`);
    
    console.log('\n✅ Demo data seeding completed successfully!');
    console.log('\n🔍 Test the APIs now:');
    console.log('  GET /api/concierge/object-types');
    console.log('  GET /api/concierge/objects');
    console.log('  GET /api/vendors');

  } catch (error) {
    console.error('❌ Demo seeding failed:', error);
    throw error;
  }
}

async function main() {
  await seedSimpleDemoData();
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error('❌ Demo seeding failed:', e);
    await prisma.$disconnect();
    process.exit(1);
  });