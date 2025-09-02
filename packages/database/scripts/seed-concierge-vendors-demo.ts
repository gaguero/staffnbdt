import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface DemoProperty {
  id: string;
  organizationId: string;
  name: string;
}

// Demo data for Concierge and Vendors modules
const OBJECT_TYPES = [
  {
    name: 'Guest Request',
    fieldsSchema: {
      fields: [
        { key: 'priority', type: 'string', required: true },
        { key: 'category', type: 'string', required: true },
        { key: 'description', type: 'string', required: true },
        { key: 'requestedBy', type: 'string', required: false },
        { key: 'specialInstructions', type: 'string', required: false },
        { key: 'estimatedCost', type: 'number', required: false },
      ],
    },
    validations: {
      priority: ['High', 'Medium', 'Low'],
      category: ['Transportation', 'Restaurant', 'Activities', 'Shopping', 'Other'],
    },
    uiHints: {
      priority: { component: 'select', options: ['High', 'Medium', 'Low'] },
      category: { component: 'select', options: ['Transportation', 'Restaurant', 'Activities', 'Shopping', 'Other'] },
      description: { component: 'textarea', rows: 3 },
      estimatedCost: { component: 'currency', currency: 'USD' },
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
        { key: 'allergies', type: 'string', required: false },
      ],
    },
    validations: {},
    uiHints: {
      items: { component: 'json-editor', label: 'Order Items' },
      totalAmount: { component: 'currency', currency: 'USD' },
      deliveryTime: { component: 'datetime-picker' },
      specialRequests: { component: 'textarea', rows: 2 },
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
        { key: 'reportedBy', type: 'string', required: false },
      ],
    },
    validations: {
      issueType: ['Plumbing', 'Electrical', 'HVAC', 'Furniture', 'Other'],
      urgency: ['Emergency', 'High', 'Medium', 'Low'],
    },
    uiHints: {
      issueType: { component: 'select' },
      urgency: { component: 'select' },
      location: { component: 'text', placeholder: 'e.g., Room 101, Lobby, Pool Area' },
    },
  },
  {
    name: 'Concierge Service',
    fieldsSchema: {
      fields: [
        { key: 'serviceType', type: 'string', required: true },
        { key: 'guestPreferences', type: 'json', required: false },
        { key: 'budget', type: 'number', required: false },
        { key: 'timeframe', type: 'string', required: false },
        { key: 'notes', type: 'string', required: false },
      ],
    },
    validations: {
      serviceType: ['Tour Booking', 'Restaurant Reservation', 'Event Tickets', 'Spa Appointment', 'Transportation'],
    },
    uiHints: {
      serviceType: { component: 'select' },
      guestPreferences: { component: 'json-editor', label: 'Guest Preferences' },
      budget: { component: 'currency', currency: 'USD' },
      timeframe: { component: 'text', placeholder: 'e.g., Tomorrow evening, This weekend' },
    },
  },
];

const VENDOR_CATEGORIES = [
  'Transportation',
  'Tours & Activities',
  'Restaurants',
  'Spa & Wellness',
  'Entertainment',
  'Shopping',
  'Emergency Services',
  'Maintenance',
  'Laundry & Dry Cleaning',
  'Floral Services',
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
      minimumBooking: '$50 USD',
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
      weatherPolicy: 'Tours cancelled in severe weather with full refund',
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
      groupDiscounts: '10% for parties of 8 or more',
    },
    performance: {
      responseTimeHours: 1,
      confirmationRate: 0.98,
      rating: 4.7,
      totalBookings: 432,
    },
  },
  {
    name: 'Tranquil Spa & Wellness',
    email: 'appointments@tranquilspa.cr',
    phone: '+506-2567-8901',
    category: 'Spa & Wellness',
    policies: {
      cancellationPolicy: '4 hours advance notice required',
      paymentTerms: 'Payment at service',
      serviceHours: '9:00 AM - 8:00 PM',
      packages: 'Couple packages available with 15% discount',
    },
    performance: {
      responseTimeHours: 3,
      confirmationRate: 0.94,
      rating: 4.6,
      totalBookings: 156,
    },
  },
  {
    name: 'Guanacaste Emergency Medical',
    email: 'dispatch@emergencymed.cr',
    phone: '+506-911-2345',
    category: 'Emergency Services',
    policies: {
      cancellationPolicy: 'No cancellation fee for genuine emergencies',
      paymentTerms: 'Direct insurance billing available',
      serviceHours: '24/7 emergency response',
      responseTime: 'Average 15 minutes in Guanacaste area',
    },
    performance: {
      responseTimeHours: 0.25,
      confirmationRate: 1.0,
      rating: 4.9,
      totalBookings: 23,
    },
  },
  {
    name: 'Tropical Maintenance Solutions',
    email: 'service@tropicalmaint.cr',
    phone: '+506-2678-9012',
    category: 'Maintenance',
    policies: {
      cancellationPolicy: '1 hour advance notice for non-emergency calls',
      paymentTerms: 'Net 30 days',
      serviceHours: '8:00 AM - 6:00 PM (emergency 24/7)',
      warranty: '90-day warranty on all repairs',
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
    name: 'Guest Check-in Concierge Setup',
    trigger: 'reservation.checkedin',
    conditions: {
      type: 'all',
      rules: [
        { field: 'guest.vipStatus', operator: 'in', value: ['GOLD', 'PLATINUM', 'DIAMOND'] },
        { field: 'reservation.nights', operator: 'gte', value: 3 },
      ],
    },
    actions: [
      {
        type: 'createConciergeObject',
        params: {
          type: 'Guest Request',
          status: 'open',
          dueAt: '+2h',
          attributes: [
            { fieldKey: 'priority', fieldType: 'string', stringValue: 'High' },
            { fieldKey: 'category', fieldType: 'string', stringValue: 'Welcome Setup' },
            { fieldKey: 'description', fieldType: 'string', stringValue: 'VIP guest welcome setup and preferences collection' },
          ],
        },
      },
    ],
    enforcements: {
      slaHours: 2,
      escalation: {
        manager: true,
        emailAlert: true,
      },
    },
  },
  {
    name: 'Maintenance Request Auto-Assignment',
    trigger: 'concierge.object.created',
    conditions: {
      type: 'all',
      rules: [
        { field: 'object.type', operator: 'eq', value: 'Maintenance Request' },
        { field: 'object.attributes.urgency', operator: 'in', value: ['Emergency', 'High'] },
      ],
    },
    actions: [
      {
        type: 'createVendorLink',
        params: {
          vendorCategory: 'Maintenance',
          objectType: 'ConciergeObject',
          policyRef: 'emergency-response',
          autoNotify: true,
        },
      },
    ],
    enforcements: {
      slaHours: 0.5,
      escalation: {
        manager: true,
        sms: true,
      },
    },
  },
  {
    name: 'Restaurant Reservation Follow-up',
    trigger: 'vendors.link.confirmed',
    conditions: {
      type: 'all',
      rules: [
        { field: 'vendor.category', operator: 'eq', value: 'Restaurants' },
        { field: 'link.status', operator: 'eq', value: 'confirmed' },
      ],
    },
    actions: [
      {
        type: 'createConciergeObject',
        params: {
          type: 'Concierge Service',
          status: 'open',
          dueAt: '+1h',
          attributes: [
            { fieldKey: 'serviceType', fieldType: 'string', stringValue: 'Restaurant Reservation' },
            { fieldKey: 'notes', fieldType: 'string', stringValue: 'Follow up with guest about confirmed reservation details' },
          ],
        },
      },
    ],
    enforcements: {
      slaHours: 1,
      escalation: {
        reminder: true,
      },
    },
  },
];

async function seedConciergeAndVendorsDemo() {
  console.log('🏨 Starting Concierge and Vendors demo data seeding...');

  try {
    // Get existing properties to seed data for
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
      console.log('❌ No active properties found. Please ensure properties exist before seeding demo data.');
      return;
    }

    console.log(`📍 Found ${properties.length} properties to seed demo data for:`);
    properties.forEach(p => console.log(`  - ${p.name} (${p.id})`));

    // Enable Concierge and Vendors modules for all properties
    console.log('\n🔧 Enabling Concierge and Vendors modules...');
    for (const property of properties) {
      // Enable Concierge module
      await prisma.moduleSubscription.upsert({
        where: {
          organizationId_moduleName_propertyId: {
            organizationId: property.organizationId,
            moduleName: 'concierge',
            propertyId: property.id,
          },
        },
        update: {
          isEnabled: true,
          enabledAt: new Date(),
          disabledAt: null,
        },
        create: {
          organizationId: property.organizationId,
          propertyId: property.id,
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
          organizationId_moduleName_propertyId: {
            organizationId: property.organizationId,
            moduleName: 'vendors',
            propertyId: property.id,
          },
        },
        update: {
          isEnabled: true,
          enabledAt: new Date(),
          disabledAt: null,
        },
        create: {
          organizationId: property.organizationId,
          propertyId: property.id,
          moduleName: 'vendors',
          isEnabled: true,
          enabledAt: new Date(),
          settings: {
            autoNotifyVendors: true,
            portalTokenExpiryHours: 48,
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
    const vendorIds: { [key: string]: string[] } = {};
    
    for (const property of properties) {
      vendorIds[property.id] = [];
      
      for (const vendorData of VENDORS_DATA) {
        const vendor = await prisma.vendor.create({
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
        vendorIds[property.id].push(vendor.id);
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
    
    // Get some existing guests and reservations for realistic data
    const guests = await prisma.guest.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
    });

    const reservations = await prisma.reservation.findMany({
      where: {
        status: 'CHECKED_IN',
      },
      take: 5,
      orderBy: { checkedInAt: 'desc' },
    });

    for (const property of properties) {
      const propertyGuests = guests.filter(g => g.propertyId === property.id);
      const propertyReservations = reservations.filter(r => r.propertyId === property.id);

      // Create some sample objects with different statuses and types
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
          dueAt: new Date(Date.now() + 30 * 60 * 1000), // 30 minutes from now
          guestId: propertyGuests[1]?.id || null,
          reservationId: propertyReservations[1]?.id || null,
          attributes: [
            { fieldKey: 'items', fieldType: 'json', jsonValue: [{ item: 'Club Sandwich', qty: 1, price: 18 }, { item: 'Fresh Fruit Bowl', qty: 1, price: 12 }] },
            { fieldKey: 'totalAmount', fieldType: 'number', numberValue: 30.00 },
            { fieldKey: 'deliveryTime', fieldType: 'date', dateValue: new Date(Date.now() + 30 * 60 * 1000) },
            { fieldKey: 'specialRequests', fieldType: 'string', stringValue: 'No mayo on sandwich, extra napkins' },
          ],
        },
        {
          type: 'Concierge Service',
          status: 'completed',
          dueAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago (completed)
          guestId: propertyGuests[2]?.id || null,
          attributes: [
            { fieldKey: 'serviceType', fieldType: 'string', stringValue: 'Restaurant Reservation' },
            { fieldKey: 'budget', fieldType: 'number', numberValue: 150.00 },
            { fieldKey: 'timeframe', fieldType: 'string', stringValue: 'Tonight 7:00 PM' },
            { fieldKey: 'notes', fieldType: 'string', stringValue: 'Confirmed reservation at Pura Vida Cuisine for 2 guests, 7:00 PM tonight' },
          ],
        },
        {
          type: 'Maintenance Request',
          status: 'open',
          dueAt: new Date(Date.now() + 4 * 60 * 60 * 1000), // 4 hours from now
          attributes: [
            { fieldKey: 'issueType', fieldType: 'string', stringValue: 'HVAC' },
            { fieldKey: 'urgency', fieldType: 'string', stringValue: 'Medium' },
            { fieldKey: 'location', fieldType: 'string', stringValue: 'Room 205' },
            { fieldKey: 'description', fieldType: 'string', stringValue: 'Air conditioning not cooling properly, guest complaint' },
            { fieldKey: 'reportedBy', fieldType: 'string', stringValue: 'Housekeeping Staff' },
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

    // Create some sample Vendor Links
    console.log('\n🔗 Creating sample vendor links...');
    let vendorLinksCreated = 0;
    
    for (const property of properties) {
      const propertyVendorIds = vendorIds[property.id] || [];
      const conciergeObjects = await prisma.conciergeObject.findMany({
        where: {
          propertyId: property.id,
          type: { in: ['Guest Request', 'Maintenance Request'] },
        },
        take: 3,
      });

      for (let i = 0; i < Math.min(3, conciergeObjects.length, propertyVendorIds.length); i++) {
        const vendorLink = await prisma.vendorLink.create({
          data: {
            vendorId: propertyVendorIds[i],
            objectId: conciergeObjects[i].id,
            objectType: 'ConciergeObject',
            policyRef: 'standard-service',
            status: i === 0 ? 'confirmed' : 'pending',
            confirmationAt: i === 0 ? new Date() : null,
            expiresAt: new Date(Date.now() + 48 * 60 * 60 * 1000), // 48 hours from now
          },
        });

        // Create a portal token for pending links
        if (vendorLink.status === 'pending') {
          await prisma.vendorPortalToken.create({
            data: {
              vendorId: propertyVendorIds[i],
              organizationId: property.organizationId,
              propertyId: property.id,
              linkId: vendorLink.id,
              tokenHash: `demo-token-${vendorLink.id}-${Date.now()}`,
              expiresAt: new Date(Date.now() + 48 * 60 * 60 * 1000),
              metadata: {
                channel: 'email',
                sentAt: new Date().toISOString(),
              },
            },
          });
        }

        vendorLinksCreated++;
      }
    }

    // Display summary
    console.log('\n📊 Concierge & Vendors Demo Data Summary:');
    console.log(`  - Properties seeded: ${properties.length}`);
    console.log(`  - Module subscriptions: ${properties.length * 2} (Concierge + Vendors per property)`);
    console.log(`  - Object types created: ${objectTypesCreated}`);
    console.log(`  - Vendors created: ${vendorsCreated}`);
    console.log(`  - Playbooks created: ${playbooksCreated}`);
    console.log(`  - Concierge objects created: ${conciergeObjectsCreated}`);
    console.log(`  - Vendor links created: ${vendorLinksCreated}`);
    console.log('\n🎯 Demo Features Available:');
    console.log('  - Guest request management with EAV attributes');
    console.log('  - Room service orders with JSON item lists');
    console.log('  - Maintenance requests with urgency levels');
    console.log('  - Vendor directory with performance tracking');
    console.log('  - Automated playbooks with SLA enforcement');
    console.log('  - Vendor portal tokens for external confirmations');
    console.log('  - Multi-status object workflows (open, in_progress, completed)');
    console.log('\n✅ Concierge and Vendors demo data seeding completed successfully!');
    console.log('\n🔍 Test the APIs:');
    console.log('  GET /api/concierge/object-types - View object types');
    console.log('  GET /api/concierge/objects - View concierge objects');
    console.log('  GET /api/vendors - View vendor directory');
    console.log('  POST /api/concierge/objects - Create new requests');
    console.log('  POST /api/vendors/links - Link vendors to requests');

  } catch (error) {
    console.error('❌ Demo data seeding failed:', error);
    throw error;
  }
}

async function main() {
  await seedConciergeAndVendorsDemo();
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