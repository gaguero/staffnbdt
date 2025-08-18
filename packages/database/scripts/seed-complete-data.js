#!/usr/bin/env node
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function seedCompleteData() {
  console.log('🌱 Starting comprehensive database seeding...');
  
  try {
    // Clear existing data (for clean seeding)
    console.log('🧹 Clearing existing data...');
    await prisma.notification.deleteMany({});
    await prisma.vacation.deleteMany({});
    await prisma.payslip.deleteMany({});
    await prisma.document.deleteMany({});
    await prisma.commercialBenefit.deleteMany({});
    await prisma.enrollment.deleteMany({});
    await prisma.trainingSession.deleteMany({});
    await prisma.invitation.deleteMany({});
    await prisma.auditLog.deleteMany({});
    await prisma.user.deleteMany({});
    await prisma.department.deleteMany({});
    await prisma.moduleSubscription.deleteMany({});
    await prisma.property.deleteMany({});
    await prisma.organization.deleteMany({});
    console.log('✅ Existing data cleared');

    // Create Organizations
    console.log('\n🏢 Creating Organizations...');
    
    const nayaraResorts = await prisma.organization.create({
      data: {
        name: 'Nayara Resorts',
        slug: 'nayara-resorts',
        description: 'Luxury resort chain specializing in sustainable tourism and exceptional guest experiences',
        logoUrl: '/logos/nayara-logo.png',
        website: 'https://www.nayararesorts.com',
        contactEmail: 'info@nayararesorts.com',
        contactPhone: '+506 2479-1000',
        address: {
          street: 'Arenal Volcano National Park',
          city: 'La Fortuna',
          state: 'Alajuela',
          country: 'Costa Rica',
          postalCode: '21007'
        },
        timezone: 'America/Costa_Rica',
        settings: {
          defaultLanguage: 'en',
          supportedLanguages: ['en', 'es'],
          theme: 'nayara',
          currency: 'USD',
          dateFormat: 'MM/dd/yyyy'
        },
        branding: {
          primaryColor: '#AA8E67',
          secondaryColor: '#F5EBD7',
          accentColor: '#4A4A4A',
          logoUrl: '/logos/nayara-logo.png',
          favicon: '/logos/nayara-favicon.ico'
        },
        isActive: true
      }
    });

    const tasoGroup = await prisma.organization.create({
      data: {
        name: 'Taso Group',
        slug: 'taso-group',
        description: 'Boutique hospitality management company focused on personalized service and local experiences',
        logoUrl: '/logos/taso-logo.png',
        website: 'https://www.tasogroup.com',
        contactEmail: 'contact@tasogroup.com',
        contactPhone: '+507 317-1200',
        address: {
          street: 'Casco Viejo',
          city: 'Panama City',
          state: 'Panama',
          country: 'Panama',
          postalCode: '0816-07761'
        },
        timezone: 'America/Panama',
        settings: {
          defaultLanguage: 'es',
          supportedLanguages: ['es', 'en'],
          theme: 'taso',
          currency: 'USD',
          dateFormat: 'dd/MM/yyyy'
        },
        branding: {
          primaryColor: '#2E7D32',
          secondaryColor: '#E8F5E8',
          accentColor: '#1B5E20',
          logoUrl: '/logos/taso-logo.png',
          favicon: '/logos/taso-favicon.ico'
        },
        isActive: true
      }
    });

    console.log(`✅ Created organization: ${nayaraResorts.name} (${nayaraResorts.id})`);
    console.log(`✅ Created organization: ${tasoGroup.name} (${tasoGroup.id})`);

    // Create Properties
    console.log('\n🏨 Creating Properties...');
    
    const nayaraBocas = await prisma.property.create({
      data: {
        organizationId: nayaraResorts.id,
        name: 'Nayara Bocas del Toro',
        slug: 'nayara-bocas-del-toro',
        description: 'Overwater bungalows and beachfront villas in the pristine Caribbean waters of Bocas del Toro',
        propertyType: 'RESORT',
        address: {
          street: 'Isla Colon, Archipelago Bocas del Toro',
          city: 'Bocas del Toro',
          state: 'Bocas del Toro',
          country: 'Panama',
          postalCode: '0000'
        },
        timezone: 'America/Panama',
        phoneNumber: '+507 757-9800',
        email: 'reservations@nayarabocas.com',
        website: 'https://www.nayararesorts.com/bocas-del-toro',
        settings: {
          modules: ['HR', 'DOCUMENTS', 'TRAINING', 'BENEFITS', 'FRONT_DESK', 'HOUSEKEEPING', 'MAINTENANCE', 'INVENTORY'],
          checkInTime: '15:00',
          checkOutTime: '12:00',
          totalRooms: 48,
          maxOccupancy: 144
        },
        branding: {
          inherit: true,
          customElements: {
            welcomeMessage: 'Welcome to Paradise in Bocas del Toro',
            signature: 'Pura Vida from Panama'
          }
        },
        isActive: true
      }
    });

    const elPalmar = await prisma.property.create({
      data: {
        organizationId: tasoGroup.id,
        name: 'El Palmar Beach Resort',
        slug: 'el-palmar-beach-resort',
        description: 'Intimate beachfront resort featuring authentic local cuisine and personalized service',
        propertyType: 'BOUTIQUE_HOTEL',
        address: {
          street: 'Playa El Palmar, Pedasi',
          city: 'Pedasi',
          state: 'Los Santos',
          country: 'Panama',
          postalCode: '0000'
        },
        timezone: 'America/Panama',
        phoneNumber: '+507 995-2775',
        email: 'info@elpalmarresort.com',
        website: 'https://www.tasogroup.com/el-palmar',
        settings: {
          modules: ['HR', 'DOCUMENTS', 'TRAINING', 'BENEFITS'],
          checkInTime: '14:00',
          checkOutTime: '11:00',
          totalRooms: 24,
          maxOccupancy: 60
        },
        branding: {
          inherit: true,
          customElements: {
            welcomeMessage: 'Bienvenidos a El Palmar',
            signature: 'Experiencias Auténticas'
          }
        },
        isActive: true
      }
    });

    console.log(`✅ Created property: ${nayaraBocas.name} (${nayaraBocas.id})`);
    console.log(`✅ Created property: ${elPalmar.name} (${elPalmar.id})`);

    // Create Module Subscriptions
    console.log('\n📦 Creating Module Subscriptions...');
    
    const allModules = ['HR', 'DOCUMENTS', 'TRAINING', 'BENEFITS', 'FRONT_DESK', 'HOUSEKEEPING', 'MAINTENANCE', 'INVENTORY'];
    const coreModules = ['HR', 'DOCUMENTS', 'TRAINING', 'BENEFITS'];

    // Nayara Resorts - All modules
    for (const moduleName of allModules) {
      await prisma.moduleSubscription.create({
        data: {
          organizationId: nayaraResorts.id,
          moduleName,
          isEnabled: true,
          enabledAt: new Date(),
          settings: {
            permissions: moduleName === 'HR' ? ['CREATE', 'READ', 'UPDATE', 'DELETE'] : ['READ'],
            features: {
              advanced: moduleName === 'FRONT_DESK',
              analytics: true
            }
          }
        }
      });
    }

    // Taso Group - Core modules only
    for (const moduleName of coreModules) {
      await prisma.moduleSubscription.create({
        data: {
          organizationId: tasoGroup.id,
          moduleName,
          isEnabled: true,
          enabledAt: new Date(),
          settings: {
            permissions: ['READ', 'CREATE'],
            features: {
              basic: true
            }
          }
        }
      });
    }

    console.log(`✅ Created ${allModules.length} module subscriptions for Nayara Resorts`);
    console.log(`✅ Created ${coreModules.length} module subscriptions for Taso Group`);

    // Store department references for user assignment
    const departments = {};

    // Create Department Hierarchies
    console.log('\n🏢 Creating Department Hierarchies...');
    
    // === NAYARA BOCAS DEL TORO DEPARTMENTS ===
    console.log('   📋 Nayara Bocas del Toro departments...');
    
    // Level 0 - General Management
    const nayaraGenMgmt = await prisma.department.create({
      data: {
        name: 'General Management',
        description: 'Executive leadership and strategic oversight',
        propertyId: nayaraBocas.id,
        level: 0,
        budget: 250000.00
      }
    });
    departments.nayaraGenMgmt = nayaraGenMgmt;

    // Level 1 - Main Divisions
    const nayaraAdmin = await prisma.department.create({
      data: {
        name: 'Administration',
        description: 'Corporate administration and support functions',
        propertyId: nayaraBocas.id,
        parentId: nayaraGenMgmt.id,
        level: 1,
        budget: 180000.00
      }
    });
    departments.nayaraAdmin = nayaraAdmin;

    const nayaraOps = await prisma.department.create({
      data: {
        name: 'Operations',
        description: 'Daily hotel operations and guest services',
        propertyId: nayaraBocas.id,
        parentId: nayaraGenMgmt.id,
        level: 1,
        budget: 320000.00
      }
    });
    departments.nayaraOps = nayaraOps;

    const nayaraFnB = await prisma.department.create({
      data: {
        name: 'Food & Beverage',
        description: 'Restaurant, bar, and culinary operations',
        propertyId: nayaraBocas.id,
        parentId: nayaraGenMgmt.id,
        level: 1,
        budget: 280000.00
      }
    });
    departments.nayaraFnB = nayaraFnB;

    const nayaraGuest = await prisma.department.create({
      data: {
        name: 'Guest Services',
        description: 'Guest relations and experience management',
        propertyId: nayaraBocas.id,
        parentId: nayaraGenMgmt.id,
        level: 1,
        budget: 150000.00
      }
    });
    departments.nayaraGuest = nayaraGuest;

    // Level 2 - Administration Subdepartments
    const nayaraHR = await prisma.department.create({
      data: {
        name: 'Human Resources',
        description: 'Talent management and employee relations',
        propertyId: nayaraBocas.id,
        parentId: nayaraAdmin.id,
        level: 2,
        budget: 75000.00
      }
    });
    departments.nayaraHR = nayaraHR;

    const nayaraFinance = await prisma.department.create({
      data: {
        name: 'Accounting & Finance',
        description: 'Financial management and accounting operations',
        propertyId: nayaraBocas.id,
        parentId: nayaraAdmin.id,
        level: 2,
        budget: 85000.00
      }
    });
    departments.nayaraFinance = nayaraFinance;

    const nayaraIT = await prisma.department.create({
      data: {
        name: 'IT Support',
        description: 'Technology infrastructure and support',
        propertyId: nayaraBocas.id,
        parentId: nayaraAdmin.id,
        level: 2,
        budget: 45000.00
      }
    });
    departments.nayaraIT = nayaraIT;

    // Level 2 - Operations Subdepartments
    const nayaraFrontDesk = await prisma.department.create({
      data: {
        name: 'Front Desk',
        description: 'Guest check-in, check-out, and reception services',
        propertyId: nayaraBocas.id,
        parentId: nayaraOps.id,
        level: 2,
        budget: 95000.00
      }
    });
    departments.nayaraFrontDesk = nayaraFrontDesk;

    const nayaraHousekeeping = await prisma.department.create({
      data: {
        name: 'Housekeeping',
        description: 'Room cleaning and maintenance services',
        propertyId: nayaraBocas.id,
        parentId: nayaraOps.id,
        level: 2,
        budget: 120000.00
      }
    });
    departments.nayaraHousekeeping = nayaraHousekeeping;

    const nayaraMaintenance = await prisma.department.create({
      data: {
        name: 'Maintenance & Engineering',
        description: 'Property maintenance and engineering services',
        propertyId: nayaraBocas.id,
        parentId: nayaraOps.id,
        level: 2,
        budget: 85000.00
      }
    });
    departments.nayaraMaintenance = nayaraMaintenance;

    // Level 3 - Front Desk Subdepartments
    const nayaraConcierge = await prisma.department.create({
      data: {
        name: 'Concierge',
        description: 'Guest assistance and local experience coordination',
        propertyId: nayaraBocas.id,
        parentId: nayaraFrontDesk.id,
        level: 3,
        budget: 25000.00
      }
    });
    departments.nayaraConcierge = nayaraConcierge;

    // Level 3 - Housekeeping Subdepartments
    const nayaraRoomAttendants = await prisma.department.create({
      data: {
        name: 'Room Attendants',
        description: 'Guest room cleaning and preparation',
        propertyId: nayaraBocas.id,
        parentId: nayaraHousekeeping.id,
        level: 3,
        budget: 65000.00
      }
    });
    departments.nayaraRoomAttendants = nayaraRoomAttendants;

    const nayaraLaundry = await prisma.department.create({
      data: {
        name: 'Laundry',
        description: 'Linen and laundry services',
        propertyId: nayaraBocas.id,
        parentId: nayaraHousekeeping.id,
        level: 3,
        budget: 35000.00
      }
    });
    departments.nayaraLaundry = nayaraLaundry;

    // Level 2 - Food & Beverage Subdepartments
    const nayaraRestaurant = await prisma.department.create({
      data: {
        name: 'Restaurant',
        description: 'Main dining restaurant operations',
        propertyId: nayaraBocas.id,
        parentId: nayaraFnB.id,
        level: 2,
        budget: 140000.00
      }
    });
    departments.nayaraRestaurant = nayaraRestaurant;

    const nayaraBar = await prisma.department.create({
      data: {
        name: 'Bar & Lounge',
        description: 'Bar service and beverage operations',
        propertyId: nayaraBocas.id,
        parentId: nayaraFnB.id,
        level: 2,
        budget: 95000.00
      }
    });
    departments.nayaraBar = nayaraBar;

    const nayaraRoomService = await prisma.department.create({
      data: {
        name: 'Room Service',
        description: 'In-room dining and beverage service',
        propertyId: nayaraBocas.id,
        parentId: nayaraFnB.id,
        level: 2,
        budget: 55000.00
      }
    });
    departments.nayaraRoomService = nayaraRoomService;

    // Level 3 - Restaurant Subdepartments
    const nayaraKitchen = await prisma.department.create({
      data: {
        name: 'Kitchen',
        description: 'Culinary operations and food preparation',
        propertyId: nayaraBocas.id,
        parentId: nayaraRestaurant.id,
        level: 3,
        budget: 75000.00
      }
    });
    departments.nayaraKitchen = nayaraKitchen;

    // Level 2 - Guest Services Subdepartments
    const nayaraGuestRelations = await prisma.department.create({
      data: {
        name: 'Guest Relations',
        description: 'Guest satisfaction and relationship management',
        propertyId: nayaraBocas.id,
        parentId: nayaraGuest.id,
        level: 2,
        budget: 45000.00
      }
    });
    departments.nayaraGuestRelations = nayaraGuestRelations;

    const nayaraActivities = await prisma.department.create({
      data: {
        name: 'Activities & Recreation',
        description: 'Guest activities and recreational programs',
        propertyId: nayaraBocas.id,
        parentId: nayaraGuest.id,
        level: 2,
        budget: 65000.00
      }
    });
    departments.nayaraActivities = nayaraActivities;

    const nayaraSpa = await prisma.department.create({
      data: {
        name: 'Spa & Wellness',
        description: 'Spa services and wellness programs',
        propertyId: nayaraBocas.id,
        parentId: nayaraGuest.id,
        level: 2,
        budget: 85000.00
      }
    });
    departments.nayaraSpa = nayaraSpa;

    // === EL PALMAR BEACH RESORT DEPARTMENTS ===
    console.log('   📋 El Palmar Beach Resort departments...');
    
    // Level 0 - Management
    const palmarMgmt = await prisma.department.create({
      data: {
        name: 'Management',
        description: 'Property management and leadership',
        propertyId: elPalmar.id,
        level: 0,
        budget: 120000.00
      }
    });
    departments.palmarMgmt = palmarMgmt;

    // Level 1 - Main Divisions
    const palmarAdmin = await prisma.department.create({
      data: {
        name: 'Administration',
        description: 'Administrative support and operations',
        propertyId: elPalmar.id,
        parentId: palmarMgmt.id,
        level: 1,
        budget: 75000.00
      }
    });
    departments.palmarAdmin = palmarAdmin;

    const palmarHotelOps = await prisma.department.create({
      data: {
        name: 'Hotel Operations',
        description: 'Daily hotel operations and guest services',
        propertyId: elPalmar.id,
        parentId: palmarMgmt.id,
        level: 1,
        budget: 95000.00
      }
    });
    departments.palmarHotelOps = palmarHotelOps;

    const palmarFoodServices = await prisma.department.create({
      data: {
        name: 'Food Services',
        description: 'Restaurant and culinary operations',
        propertyId: elPalmar.id,
        parentId: palmarMgmt.id,
        level: 1,
        budget: 85000.00
      }
    });
    departments.palmarFoodServices = palmarFoodServices;

    // Level 2 - Administration Subdepartments
    const palmarHR = await prisma.department.create({
      data: {
        name: 'Human Resources',
        description: 'Staff management and HR services',
        propertyId: elPalmar.id,
        parentId: palmarAdmin.id,
        level: 2,
        budget: 35000.00
      }
    });
    departments.palmarHR = palmarHR;

    const palmarFinance = await prisma.department.create({
      data: {
        name: 'Finance',
        description: 'Financial operations and accounting',
        propertyId: elPalmar.id,
        parentId: palmarAdmin.id,
        level: 2,
        budget: 28000.00
      }
    });
    departments.palmarFinance = palmarFinance;

    // Level 2 - Hotel Operations Subdepartments
    const palmarReception = await prisma.department.create({
      data: {
        name: 'Reception',
        description: 'Front desk and guest reception services',
        propertyId: elPalmar.id,
        parentId: palmarHotelOps.id,
        level: 2,
        budget: 45000.00
      }
    });
    departments.palmarReception = palmarReception;

    const palmarHousekeeping = await prisma.department.create({
      data: {
        name: 'Housekeeping',
        description: 'Room cleaning and housekeeping services',
        propertyId: elPalmar.id,
        parentId: palmarHotelOps.id,
        level: 2,
        budget: 38000.00
      }
    });
    departments.palmarHousekeeping = palmarHousekeeping;

    const palmarMaintenance = await prisma.department.create({
      data: {
        name: 'Maintenance',
        description: 'Property maintenance and repairs',
        propertyId: elPalmar.id,
        parentId: palmarHotelOps.id,
        level: 2,
        budget: 25000.00
      }
    });
    departments.palmarMaintenance = palmarMaintenance;

    // Level 2 - Food Services Subdepartments
    const palmarRestaurant = await prisma.department.create({
      data: {
        name: 'Restaurant',
        description: 'Restaurant dining and service',
        propertyId: elPalmar.id,
        parentId: palmarFoodServices.id,
        level: 2,
        budget: 55000.00
      }
    });
    departments.palmarRestaurant = palmarRestaurant;

    const palmarBar = await prisma.department.create({
      data: {
        name: 'Bar',
        description: 'Bar service and beverages',
        propertyId: elPalmar.id,
        parentId: palmarFoodServices.id,
        level: 2,
        budget: 32000.00
      }
    });
    departments.palmarBar = palmarBar;

    console.log(`✅ Created 19 departments for Nayara Bocas del Toro`);
    console.log(`✅ Created 10 departments for El Palmar Beach Resort`);

    // Create Users
    console.log('\n👥 Creating Users...');
    
    // === NAYARA BOCAS DEL TORO USERS ===
    console.log('   🏝️ Nayara Bocas del Toro staff...');
    
    const nayaraUsers = [];

    // General Management
    const robertoMartinez = await prisma.user.create({
      data: {
        email: 'roberto.martinez@nayararesorts.com',
        firstName: 'Roberto',
        lastName: 'Martinez',
        role: 'PROPERTY_MANAGER',
        organizationId: nayaraResorts.id,
        propertyId: nayaraBocas.id,
        departmentId: nayaraGenMgmt.id,
        position: 'General Manager',
        hireDate: new Date('2019-03-15'),
        phoneNumber: '+507 6789-1234',
        emergencyContact: {
          name: 'Maria Martinez',
          relationship: 'Spouse',
          phone: '+507 6789-5678',
          email: 'maria.martinez@gmail.com'
        }
      }
    });
    nayaraUsers.push(robertoMartinez);

    const sofiaRodriguez = await prisma.user.create({
      data: {
        email: 'sofia.rodriguez@nayararesorts.com',
        firstName: 'Sofia',
        lastName: 'Rodriguez',
        role: 'DEPARTMENT_ADMIN',
        organizationId: nayaraResorts.id,
        propertyId: nayaraBocas.id,
        departmentId: nayaraOps.id,
        position: 'Operations Director',
        hireDate: new Date('2020-01-10'),
        phoneNumber: '+507 6789-2345',
        emergencyContact: {
          name: 'Carlos Rodriguez',
          relationship: 'Brother',
          phone: '+507 6789-6789'
        }
      }
    });
    nayaraUsers.push(sofiaRodriguez);

    // Update manager assignments
    await prisma.department.update({
      where: { id: nayaraOps.id },
      data: { managerId: sofiaRodriguez.id }
    });

    // Administration Department
    const carmenJimenez = await prisma.user.create({
      data: {
        email: 'carmen.jimenez@nayararesorts.com',
        firstName: 'Carmen',
        lastName: 'Jiménez',
        role: 'DEPARTMENT_ADMIN',
        organizationId: nayaraResorts.id,
        propertyId: nayaraBocas.id,
        departmentId: nayaraHR.id,
        position: 'HR Manager',
        hireDate: new Date('2020-06-01'),
        phoneNumber: '+507 6789-3456',
        emergencyContact: {
          name: 'Luis Jiménez',
          relationship: 'Husband',
          phone: '+507 6789-7890'
        }
      }
    });
    nayaraUsers.push(carmenJimenez);

    await prisma.department.update({
      where: { id: nayaraHR.id },
      data: { managerId: carmenJimenez.id }
    });

    const luisFernando = await prisma.user.create({
      data: {
        email: 'luis.fernando@nayararesorts.com',
        firstName: 'Luis Fernando',
        lastName: 'Castillo',
        role: 'DEPARTMENT_ADMIN',
        organizationId: nayaraResorts.id,
        propertyId: nayaraBocas.id,
        departmentId: nayaraFinance.id,
        position: 'Finance Manager',
        hireDate: new Date('2019-09-15'),
        phoneNumber: '+507 6789-4567',
        emergencyContact: {
          name: 'Ana Castillo',
          relationship: 'Wife',
          phone: '+507 6789-8901'
        }
      }
    });
    nayaraUsers.push(luisFernando);

    await prisma.department.update({
      where: { id: nayaraFinance.id },
      data: { managerId: luisFernando.id }
    });

    const diegoVargas = await prisma.user.create({
      data: {
        email: 'diego.vargas@nayararesorts.com',
        firstName: 'Diego',
        lastName: 'Vargas',
        role: 'STAFF',
        organizationId: nayaraResorts.id,
        propertyId: nayaraBocas.id,
        departmentId: nayaraIT.id,
        position: 'IT Coordinator',
        hireDate: new Date('2021-02-01'),
        phoneNumber: '+507 6789-5678',
        emergencyContact: {
          name: 'Elena Vargas',
          relationship: 'Mother',
          phone: '+507 6789-9012'
        }
      }
    });
    nayaraUsers.push(diegoVargas);

    // Front Desk Department
    const mariaGonzalez = await prisma.user.create({
      data: {
        email: 'maria.gonzalez@nayararesorts.com',
        firstName: 'María',
        lastName: 'González',
        role: 'DEPARTMENT_ADMIN',
        organizationId: nayaraResorts.id,
        propertyId: nayaraBocas.id,
        departmentId: nayaraFrontDesk.id,
        position: 'Front Desk Manager',
        hireDate: new Date('2020-04-20'),
        phoneNumber: '+507 6789-6789',
        emergencyContact: {
          name: 'Pedro González',
          relationship: 'Father',
          phone: '+507 6789-0123'
        }
      }
    });
    nayaraUsers.push(mariaGonzalez);

    await prisma.department.update({
      where: { id: nayaraFrontDesk.id },
      data: { managerId: mariaGonzalez.id }
    });

    const juanCarlos = await prisma.user.create({
      data: {
        email: 'juan.carlos@nayararesorts.com',
        firstName: 'Juan Carlos',
        lastName: 'Mendez',
        role: 'STAFF',
        organizationId: nayaraResorts.id,
        propertyId: nayaraBocas.id,
        departmentId: nayaraFrontDesk.id,
        position: 'Receptionist',
        hireDate: new Date('2021-07-01'),
        phoneNumber: '+507 6789-7890',
        emergencyContact: {
          name: 'Rosa Mendez',
          relationship: 'Sister',
          phone: '+507 6789-1234'
        }
      }
    });
    nayaraUsers.push(juanCarlos);

    const anaSilva = await prisma.user.create({
      data: {
        email: 'ana.silva@nayararesorts.com',
        firstName: 'Ana',
        lastName: 'Silva',
        role: 'STAFF',
        organizationId: nayaraResorts.id,
        propertyId: nayaraBocas.id,
        departmentId: nayaraFrontDesk.id,
        position: 'Night Auditor',
        hireDate: new Date('2021-03-15'),
        phoneNumber: '+507 6789-8901',
        emergencyContact: {
          name: 'Miguel Silva',
          relationship: 'Brother',
          phone: '+507 6789-2345'
        }
      }
    });
    nayaraUsers.push(anaSilva);

    const pedroMorales = await prisma.user.create({
      data: {
        email: 'pedro.morales@nayararesorts.com',
        firstName: 'Pedro',
        lastName: 'Morales',
        role: 'STAFF',
        organizationId: nayaraResorts.id,
        propertyId: nayaraBocas.id,
        departmentId: nayaraConcierge.id,
        position: 'Concierge',
        hireDate: new Date('2020-11-01'),
        phoneNumber: '+507 6789-9012',
        emergencyContact: {
          name: 'Laura Morales',
          relationship: 'Wife',
          phone: '+507 6789-3456'
        }
      }
    });
    nayaraUsers.push(pedroMorales);

    // Housekeeping Department
    const isabellaChen = await prisma.user.create({
      data: {
        email: 'isabella.chen@nayararesorts.com',
        firstName: 'Isabella',
        lastName: 'Chen',
        role: 'DEPARTMENT_ADMIN',
        organizationId: nayaraResorts.id,
        propertyId: nayaraBocas.id,
        departmentId: nayaraHousekeeping.id,
        position: 'Housekeeping Manager',
        hireDate: new Date('2019-12-01'),
        phoneNumber: '+507 6789-0123',
        emergencyContact: {
          name: 'David Chen',
          relationship: 'Husband',
          phone: '+507 6789-4567'
        }
      }
    });
    nayaraUsers.push(isabellaChen);

    await prisma.department.update({
      where: { id: nayaraHousekeeping.id },
      data: { managerId: isabellaChen.id }
    });

    const rosaMartinez = await prisma.user.create({
      data: {
        email: 'rosa.martinez@nayararesorts.com',
        firstName: 'Rosa',
        lastName: 'Martinez',
        role: 'STAFF',
        organizationId: nayaraResorts.id,
        propertyId: nayaraBocas.id,
        departmentId: nayaraRoomAttendants.id,
        position: 'Room Attendant',
        hireDate: new Date('2021-01-15'),
        phoneNumber: '+507 6789-1234',
        emergencyContact: {
          name: 'José Martinez',
          relationship: 'Husband',
          phone: '+507 6789-5678'
        }
      }
    });
    nayaraUsers.push(rosaMartinez);

    const miguelSantos = await prisma.user.create({
      data: {
        email: 'miguel.santos@nayararesorts.com',
        firstName: 'Miguel',
        lastName: 'Santos',
        role: 'STAFF',
        organizationId: nayaraResorts.id,
        propertyId: nayaraBocas.id,
        departmentId: nayaraLaundry.id,
        position: 'Laundry Supervisor',
        hireDate: new Date('2020-08-01'),
        phoneNumber: '+507 6789-2345',
        emergencyContact: {
          name: 'Carmen Santos',
          relationship: 'Mother',
          phone: '+507 6789-6789'
        }
      }
    });
    nayaraUsers.push(miguelSantos);

    // Food & Beverage Department
    const chefThomas = await prisma.user.create({
      data: {
        email: 'thomas.laurent@nayararesorts.com',
        firstName: 'Thomas',
        lastName: 'Laurent',
        role: 'DEPARTMENT_ADMIN',
        organizationId: nayaraResorts.id,
        propertyId: nayaraBocas.id,
        departmentId: nayaraFnB.id,
        position: 'Executive Chef',
        hireDate: new Date('2018-11-01'),
        phoneNumber: '+507 6789-3456',
        emergencyContact: {
          name: 'Sophie Laurent',
          relationship: 'Wife',
          phone: '+33 6 12 34 56 78'
        }
      }
    });
    nayaraUsers.push(chefThomas);

    await prisma.department.update({
      where: { id: nayaraFnB.id },
      data: { managerId: chefThomas.id }
    });

    const carlosMendez = await prisma.user.create({
      data: {
        email: 'carlos.mendez@nayararesorts.com',
        firstName: 'Carlos',
        lastName: 'Méndez',
        role: 'STAFF',
        organizationId: nayaraResorts.id,
        propertyId: nayaraBocas.id,
        departmentId: nayaraRestaurant.id,
        position: 'Restaurant Manager',
        hireDate: new Date('2020-02-15'),
        phoneNumber: '+507 6789-4567',
        emergencyContact: {
          name: 'Patricia Méndez',
          relationship: 'Sister',
          phone: '+507 6789-7890'
        }
      }
    });
    nayaraUsers.push(carlosMendez);

    const juliaTorres = await prisma.user.create({
      data: {
        email: 'julia.torres@nayararesorts.com',
        firstName: 'Julia',
        lastName: 'Torres',
        role: 'STAFF',
        organizationId: nayaraResorts.id,
        propertyId: nayaraBocas.id,
        departmentId: nayaraBar.id,
        position: 'Head Bartender',
        hireDate: new Date('2019-07-20'),
        phoneNumber: '+507 6789-5678',
        emergencyContact: {
          name: 'Roberto Torres',
          relationship: 'Father',
          phone: '+507 6789-8901'
        }
      }
    });
    nayaraUsers.push(juliaTorres);

    const antonioRivera = await prisma.user.create({
      data: {
        email: 'antonio.rivera@nayararesorts.com',
        firstName: 'Antonio',
        lastName: 'Rivera',
        role: 'STAFF',
        organizationId: nayaraResorts.id,
        propertyId: nayaraBocas.id,
        departmentId: nayaraRestaurant.id,
        position: 'Server',
        hireDate: new Date('2021-05-01'),
        phoneNumber: '+507 6789-6789',
        emergencyContact: {
          name: 'Isabel Rivera',
          relationship: 'Mother',
          phone: '+507 6789-9012'
        }
      }
    });
    nayaraUsers.push(antonioRivera);

    // === EL PALMAR BEACH RESORT USERS ===
    console.log('   🏖️ El Palmar Beach Resort staff...');
    
    const palmarUsers = [];

    // Management
    const alexandraTaso = await prisma.user.create({
      data: {
        email: 'alexandra.taso@tasogroup.com',
        firstName: 'Alexandra',
        lastName: 'Taso',
        role: 'PROPERTY_MANAGER',
        organizationId: tasoGroup.id,
        propertyId: elPalmar.id,
        departmentId: palmarMgmt.id,
        position: 'Property Manager',
        hireDate: new Date('2018-01-15'),
        phoneNumber: '+507 995-2001',
        emergencyContact: {
          name: 'Marco Taso',
          relationship: 'Brother',
          phone: '+507 995-2002',
          email: 'marco.taso@gmail.com'
        }
      }
    });
    palmarUsers.push(alexandraTaso);

    const michaelBrown = await prisma.user.create({
      data: {
        email: 'michael.brown@tasogroup.com',
        firstName: 'Michael',
        lastName: 'Brown',
        role: 'DEPARTMENT_ADMIN',
        organizationId: tasoGroup.id,
        propertyId: elPalmar.id,
        departmentId: palmarHotelOps.id,
        position: 'Operations Manager',
        hireDate: new Date('2019-03-01'),
        phoneNumber: '+507 995-2003',
        emergencyContact: {
          name: 'Susan Brown',
          relationship: 'Wife',
          phone: '+507 995-2004'
        }
      }
    });
    palmarUsers.push(michaelBrown);

    await prisma.department.update({
      where: { id: palmarHotelOps.id },
      data: { managerId: michaelBrown.id }
    });

    // Human Resources
    const jenniferDavis = await prisma.user.create({
      data: {
        email: 'jennifer.davis@tasogroup.com',
        firstName: 'Jennifer',
        lastName: 'Davis',
        role: 'DEPARTMENT_ADMIN',
        organizationId: tasoGroup.id,
        propertyId: elPalmar.id,
        departmentId: palmarHR.id,
        position: 'HR Supervisor',
        hireDate: new Date('2020-01-20'),
        phoneNumber: '+507 995-2005',
        emergencyContact: {
          name: 'Robert Davis',
          relationship: 'Husband',
          phone: '+507 995-2006'
        }
      }
    });
    palmarUsers.push(jenniferDavis);

    await prisma.department.update({
      where: { id: palmarHR.id },
      data: { managerId: jenniferDavis.id }
    });

    // Operations Staff
    const robertWilson = await prisma.user.create({
      data: {
        email: 'robert.wilson@tasogroup.com',
        firstName: 'Robert',
        lastName: 'Wilson',
        role: 'STAFF',
        organizationId: tasoGroup.id,
        propertyId: elPalmar.id,
        departmentId: palmarMaintenance.id,
        position: 'Maintenance Technician',
        hireDate: new Date('2020-06-15'),
        phoneNumber: '+507 995-2007',
        emergencyContact: {
          name: 'Mary Wilson',
          relationship: 'Mother',
          phone: '+507 995-2008'
        }
      }
    });
    palmarUsers.push(robertWilson);

    const patriciaLopez = await prisma.user.create({
      data: {
        email: 'patricia.lopez@tasogroup.com',
        firstName: 'Patricia',
        lastName: 'López',
        role: 'STAFF',
        organizationId: tasoGroup.id,
        propertyId: elPalmar.id,
        departmentId: palmarHousekeeping.id,
        position: 'Head Housekeeper',
        hireDate: new Date('2019-11-01'),
        phoneNumber: '+507 995-2009',
        emergencyContact: {
          name: 'Carlos López',
          relationship: 'Husband',
          phone: '+507 995-2010'
        }
      }
    });
    palmarUsers.push(patriciaLopez);

    const jenniferReception = await prisma.user.create({
      data: {
        email: 'jennifer.reception@tasogroup.com',
        firstName: 'Jennifer',
        lastName: 'Martinez',
        role: 'STAFF',
        organizationId: tasoGroup.id,
        propertyId: elPalmar.id,
        departmentId: palmarReception.id,
        position: 'Front Desk Supervisor',
        hireDate: new Date('2020-09-01'),
        phoneNumber: '+507 995-2011',
        emergencyContact: {
          name: 'Luis Martinez',
          relationship: 'Father',
          phone: '+507 995-2012'
        }
      }
    });
    palmarUsers.push(jenniferReception);

    // Food & Beverage Staff
    const davidKim = await prisma.user.create({
      data: {
        email: 'david.kim@tasogroup.com',
        firstName: 'David',
        lastName: 'Kim',
        role: 'DEPARTMENT_ADMIN',
        organizationId: tasoGroup.id,
        propertyId: elPalmar.id,
        departmentId: palmarFoodServices.id,
        position: 'F&B Manager',
        hireDate: new Date('2019-05-15'),
        phoneNumber: '+507 995-2013',
        emergencyContact: {
          name: 'Grace Kim',
          relationship: 'Wife',
          phone: '+507 995-2014'
        }
      }
    });
    palmarUsers.push(davidKim);

    await prisma.department.update({
      where: { id: palmarFoodServices.id },
      data: { managerId: davidKim.id }
    });

    const sarahJohnson = await prisma.user.create({
      data: {
        email: 'sarah.johnson@tasogroup.com',
        firstName: 'Sarah',
        lastName: 'Johnson',
        role: 'STAFF',
        organizationId: tasoGroup.id,
        propertyId: elPalmar.id,
        departmentId: palmarRestaurant.id,
        position: 'Head Chef',
        hireDate: new Date('2020-02-01'),
        phoneNumber: '+507 995-2015',
        emergencyContact: {
          name: 'James Johnson',
          relationship: 'Brother',
          phone: '+507 995-2016'
        }
      }
    });
    palmarUsers.push(sarahJohnson);

    const emilyAnderson = await prisma.user.create({
      data: {
        email: 'emily.anderson@tasogroup.com',
        firstName: 'Emily',
        lastName: 'Anderson',
        role: 'STAFF',
        organizationId: tasoGroup.id,
        propertyId: elPalmar.id,
        departmentId: palmarRestaurant.id,
        position: 'Server',
        hireDate: new Date('2021-04-01'),
        phoneNumber: '+507 995-2017',
        emergencyContact: {
          name: 'Tom Anderson',
          relationship: 'Father',
          phone: '+507 995-2018'
        }
      }
    });
    palmarUsers.push(emilyAnderson);

    console.log(`✅ Created ${nayaraUsers.length} users for Nayara Bocas del Toro`);
    console.log(`✅ Created ${palmarUsers.length} users for El Palmar Beach Resort`);

    const allUsers = [...nayaraUsers, ...palmarUsers];

    // Create Documents
    console.log('\n📄 Creating Documents...');
    
    const documents = [];
    
    // General Documents (accessible to all)
    const generalDocs = [
      {
        title: 'Employee Handbook 2024',
        description: 'Comprehensive guide covering company policies, procedures, and employee benefits',
        fileKey: '/documents/general/employee-handbook-2024.pdf',
        fileSize: 2458624,
        mimeType: 'application/pdf',
        tags: ['handbook', 'policies', 'hr', '2024']
      },
      {
        title: 'Safety and Emergency Protocols',
        description: 'Critical safety procedures and emergency response protocols for all staff',
        fileKey: '/documents/general/safety-emergency-protocols.pdf',
        fileSize: 1845320,
        mimeType: 'application/pdf',
        tags: ['safety', 'emergency', 'protocols', 'mandatory']
      },
      {
        title: 'Code of Conduct',
        description: 'Professional standards and behavioral guidelines for all employees',
        fileKey: '/documents/general/code-of-conduct.pdf',
        fileSize: 892456,
        mimeType: 'application/pdf',
        tags: ['conduct', 'ethics', 'guidelines', 'mandatory']
      }
    ];

    for (const doc of generalDocs) {
      // Create for Nayara
      const nayaraDoc = await prisma.document.create({
        data: {
          ...doc,
          scope: 'GENERAL',
          propertyId: nayaraBocas.id,
          uploadedBy: carmenJimenez.id
        }
      });
      documents.push(nayaraDoc);

      // Create for El Palmar
      const palmarDoc = await prisma.document.create({
        data: {
          ...doc,
          scope: 'GENERAL',
          propertyId: elPalmar.id,
          uploadedBy: jenniferDavis.id
        }
      });
      documents.push(palmarDoc);
    }

    // Department-specific Documents
    const deptDocs = [
      {
        title: 'Front Desk Operations Manual',
        description: 'Standard operating procedures for front desk operations',
        fileKey: '/documents/department/front-desk-operations-manual.pdf',
        fileSize: 1567890,
        mimeType: 'application/pdf',
        tags: ['front-desk', 'operations', 'manual', 'sop'],
        departmentId: nayaraFrontDesk.id,
        propertyId: nayaraBocas.id,
        uploadedBy: mariaGonzalez.id
      },
      {
        title: 'Housekeeping Standards and Procedures',
        description: 'Room cleaning standards and housekeeping procedures',
        fileKey: '/documents/department/housekeeping-standards.pdf',
        fileSize: 2234567,
        mimeType: 'application/pdf',
        tags: ['housekeeping', 'cleaning', 'standards'],
        departmentId: nayaraHousekeeping.id,
        propertyId: nayaraBocas.id,
        uploadedBy: isabellaChen.id
      },
      {
        title: 'Food Safety and Hygiene Guidelines',
        description: 'HACCP compliance and food safety procedures for F&B operations',
        fileKey: '/documents/department/food-safety-guidelines.pdf',
        fileSize: 1897432,
        mimeType: 'application/pdf',
        tags: ['food-safety', 'haccp', 'hygiene', 'fnb'],
        departmentId: nayaraFnB.id,
        propertyId: nayaraBocas.id,
        uploadedBy: chefThomas.id
      }
    ];

    for (const doc of deptDocs) {
      const deptDoc = await prisma.document.create({
        data: {
          ...doc,
          scope: 'DEPARTMENT'
        }
      });
      documents.push(deptDoc);
    }

    console.log(`✅ Created ${documents.length} documents`);

    // Create Training Sessions
    console.log('\n🎓 Creating Training Sessions...');
    
    const trainingSessions = [];

    const trainings = [
      {
        title: 'Safety and Emergency Procedures',
        description: 'Mandatory safety training covering fire safety, first aid, and emergency evacuation procedures',
        category: 'Safety',
        duration: 120,
        passingScore: 80,
        contentBlocks: [
          {
            type: 'TEXT',
            title: 'Welcome to Safety Training',
            content: 'This training will cover essential safety procedures that every employee must know to ensure a safe working environment.',
            order: 1
          },
          {
            type: 'FILE',
            title: 'Safety Protocols Document',
            fileUrl: '/documents/general/safety-emergency-protocols.pdf',
            order: 2
          },
          {
            type: 'VIDEO',
            title: 'Emergency Evacuation Procedures',
            videoUrl: 'https://training.example.com/videos/emergency-evacuation.mp4',
            duration: 15,
            order: 3
          },
          {
            type: 'FORM',
            title: 'Safety Knowledge Check',
            questions: [
              {
                question: 'What is the first step in case of a fire emergency?',
                type: 'multiple_choice',
                options: ['Call 911', 'Alert guests and staff', 'Use fire extinguisher', 'Evacuate immediately'],
                correct_answer: 1
              },
              {
                question: 'Where are the fire extinguishers located in your work area?',
                type: 'text',
                required: true
              }
            ],
            order: 4
          }
        ],
        propertyId: nayaraBocas.id,
        createdBy: carmenJimenez.id
      },
      {
        title: 'Customer Service Excellence',
        description: 'Comprehensive training on delivering exceptional customer service and handling guest complaints',
        category: 'Customer Service',
        duration: 90,
        passingScore: 85,
        contentBlocks: [
          {
            type: 'TEXT',
            title: 'Service Philosophy',
            content: 'Our commitment to excellence begins with understanding that every guest interaction is an opportunity to exceed expectations.',
            order: 1
          },
          {
            type: 'LINK',
            title: 'Guest Service Guidelines',
            url: 'https://intranet.nayara.com/service-guidelines',
            order: 2
          },
          {
            type: 'FORM',
            title: 'Scenario-Based Assessment',
            questions: [
              {
                question: 'A guest complains about noise from the adjacent room. What is your first response?',
                type: 'multiple_choice',
                options: ['Apologize and offer a room change', 'Explain hotel policies', 'Contact security', 'Take no action'],
                correct_answer: 0
              }
            ],
            order: 3
          }
        ],
        propertyId: nayaraBocas.id,
        createdBy: sofiaRodriguez.id
      },
      {
        title: 'Food Safety and HACCP Certification',
        description: 'Mandatory food safety training for all F&B staff covering HACCP principles and food handling',
        category: 'Food Safety',
        duration: 180,
        passingScore: 90,
        contentBlocks: [
          {
            type: 'TEXT',
            title: 'Introduction to Food Safety',
            content: 'Food safety is critical in our industry. This training covers the seven HACCP principles and proper food handling procedures.',
            order: 1
          },
          {
            type: 'FILE',
            title: 'HACCP Guidelines',
            fileUrl: '/documents/department/food-safety-guidelines.pdf',
            order: 2
          }
        ],
        propertyId: nayaraBocas.id,
        departmentId: nayaraFnB.id,
        createdBy: chefThomas.id
      }
    ];

    for (const training of trainings) {
      const session = await prisma.trainingSession.create({
        data: {
          ...training,
          contentBlocks: JSON.stringify(training.contentBlocks)
        }
      });
      trainingSessions.push(session);
    }

    console.log(`✅ Created ${trainingSessions.length} training sessions`);

    // Create Commercial Benefits
    console.log('\n🎁 Creating Commercial Benefits...');
    
    const benefits = [];

    const benefitData = [
      {
        partnerName: 'Restaurante Vista Mar',
        category: 'Dining',
        description: 'Enjoy authentic Caribbean cuisine with stunning ocean views. Perfect for family dinners and special occasions.',
        discount: '30% off total bill',
        imageUrl: '/images/partners/vista-mar-logo.jpg',
        websiteUrl: 'https://restaurantevistamar.com',
        contactInfo: 'Reservations: +507 757-9001 | Mention employee discount',
        validFrom: new Date('2024-01-01'),
        validUntil: new Date('2024-12-31'),
        terms: 'Valid for employee and immediate family. Cannot be combined with other offers. Maximum party size of 6.'
      },
      {
        partnerName: 'Asemedicos Health Insurance',
        category: 'Healthcare',
        description: 'Comprehensive health insurance coverage for employees and their families with nationwide network.',
        discount: '25% off premium rates',
        imageUrl: '/images/partners/asemedicos-logo.jpg',
        websiteUrl: 'https://asemedicos.com',
        contactInfo: 'Corporate Benefits: +507 264-9500 | Use company code: NAYARA2024',
        validFrom: new Date('2024-01-01'),
        validUntil: new Date('2024-12-31'),
        terms: 'Available for full-time employees after 90-day probation period. Family coverage available at additional cost.'
      },
      {
        partnerName: 'PowerFit Gym',
        category: 'Fitness',
        description: 'State-of-the-art fitness facility with personal training, group classes, and 24/7 access.',
        discount: 'Free membership + 50% off personal training',
        imageUrl: '/images/partners/powerfit-logo.jpg',
        websiteUrl: 'https://powerfitgym.pa',
        contactInfo: 'Corporate Membership: +507 317-8900 | Present employee ID',
        validFrom: new Date('2024-01-01'),
        validUntil: new Date('2024-12-31'),
        terms: 'Valid for active employees only. Membership suspended during extended leave. Includes guest passes (2 per month).'
      }
    ];

    for (const benefit of benefitData) {
      // Create for Nayara
      const nayaraBenefit = await prisma.commercialBenefit.create({
        data: {
          ...benefit,
          propertyId: nayaraBocas.id
        }
      });
      benefits.push(nayaraBenefit);

      // Create for El Palmar (with slight variations)
      const palmarBenefit = await prisma.commercialBenefit.create({
        data: {
          ...benefit,
          propertyId: elPalmar.id,
          contactInfo: benefit.contactInfo.replace('NAYARA2024', 'ELPALMAR2024')
        }
      });
      benefits.push(palmarBenefit);
    }

    console.log(`✅ Created ${benefits.length} commercial benefits`);

    // Create Vacation Requests
    console.log('\n🏖️ Creating Vacation Requests...');
    
    const vacations = [];

    // Sample vacation requests for different users
    const vacationData = [
      {
        userId: juanCarlos.id,
        type: 'ANNUAL',
        startDate: new Date('2024-03-15'),
        endDate: new Date('2024-03-22'),
        reason: 'Family vacation to visit relatives in Costa Rica',
        status: 'APPROVED',
        approvedBy: mariaGonzalez.id,
        approvedAt: new Date('2024-02-20'),
        propertyId: nayaraBocas.id
      },
      {
        userId: rosaMartinez.id,
        type: 'SICK',
        startDate: new Date('2024-08-10'),
        endDate: new Date('2024-08-12'),
        reason: 'Medical appointment and recovery',
        status: 'APPROVED',
        approvedBy: isabellaChen.id,
        approvedAt: new Date('2024-08-09'),
        propertyId: nayaraBocas.id
      },
      {
        userId: antonioRivera.id,
        type: 'PERSONAL',
        startDate: new Date('2024-09-05'),
        endDate: new Date('2024-09-07'),
        reason: 'Wedding celebration',
        status: 'PENDING',
        propertyId: nayaraBocas.id
      },
      {
        userId: emilyAnderson.id,
        type: 'ANNUAL',
        startDate: new Date('2024-07-01'),
        endDate: new Date('2024-07-08'),
        reason: 'Summer vacation with family',
        status: 'REJECTED',
        rejectedReason: 'Requested dates conflict with peak season staffing requirements. Please consider alternative dates.',
        propertyId: elPalmar.id
      }
    ];

    for (const vacation of vacationData) {
      const vacationRequest = await prisma.vacation.create({
        data: vacation
      });
      vacations.push(vacationRequest);
    }

    console.log(`✅ Created ${vacations.length} vacation requests`);

    // Create Sample Payslips
    console.log('\n💰 Creating Sample Payslips...');
    
    const payslips = [];

    // Generate payslips for last 3 months for key users
    const months = ['2024-06', '2024-07', '2024-08'];
    
    const payrollData = [
      {
        user: robertoMartinez,
        grossSalary: 5500.00,
        deductions: {
          'Social Security': 357.50,
          'Income Tax': 825.00,
          'Health Insurance': 165.00
        }
      },
      {
        user: chefThomas,
        grossSalary: 4200.00,
        deductions: {
          'Social Security': 273.00,
          'Income Tax': 504.00,
          'Health Insurance': 126.00
        }
      },
      {
        user: mariaGonzalez,
        grossSalary: 2800.00,
        deductions: {
          'Social Security': 182.00,
          'Income Tax': 252.00,
          'Health Insurance': 84.00
        }
      },
      {
        user: juanCarlos,
        grossSalary: 1800.00,
        deductions: {
          'Social Security': 117.00,
          'Income Tax': 90.00,
          'Health Insurance': 54.00
        }
      }
    ];

    for (const payroll of payrollData) {
      for (const period of months) {
        const netSalary = payroll.grossSalary - Object.values(payroll.deductions).reduce((sum, deduction) => sum + deduction, 0);
        
        const payslip = await prisma.payslip.create({
          data: {
            userId: payroll.user.id,
            propertyId: payroll.user.propertyId,
            period,
            grossSalary: payroll.grossSalary,
            deductions: payroll.deductions,
            netSalary,
            currency: 'USD',
            fileKey: `/payslips/${payroll.user.id}/${period}-payslip.pdf`
          }
        });
        payslips.push(payslip);
      }
    }

    console.log(`✅ Created ${payslips.length} payslips`);

    // Create Notifications
    console.log('\n🔔 Creating Notifications...');
    
    const notifications = [];

    // Welcome notifications for new users
    const welcomeNotifications = [
      {
        userId: juanCarlos.id,
        propertyId: nayaraBocas.id,
        type: 'WELCOME',
        title: 'Welcome to Nayara Bocas del Toro!',
        message: 'Welcome to our team! Please complete your profile and mandatory safety training within your first week.',
        read: true,
        readAt: new Date('2021-07-02')
      },
      {
        userId: emilyAnderson.id,
        propertyId: elPalmar.id,
        type: 'WELCOME',
        title: 'Bienvenido al Equipo de El Palmar',
        message: 'Welcome to El Palmar Beach Resort! We are excited to have you join our family.',
        read: false
      }
    ];

    // Training reminders
    const trainingNotifications = [
      {
        userId: rosaMartinez.id,
        propertyId: nayaraBocas.id,
        type: 'TRAINING_REMINDER',
        title: 'Safety Training Due',
        message: 'Your mandatory safety training is due by the end of this week. Please complete it in the Training module.',
        read: false,
        data: { trainingId: trainingSessions[0].id }
      },
      {
        userId: antonioRivera.id,
        propertyId: nayaraBocas.id,
        type: 'TRAINING_REMINDER',
        title: 'Customer Service Training Available',
        message: 'New customer service training is now available. Completing it will improve your service skills.',
        read: true,
        readAt: new Date('2024-08-15'),
        data: { trainingId: trainingSessions[1].id }
      }
    ];

    // Policy updates
    const policyNotifications = [
      {
        userId: mariaGonzalez.id,
        propertyId: nayaraBocas.id,
        type: 'POLICY_UPDATE',
        title: 'Updated Vacation Policy',
        message: 'The vacation request policy has been updated. Please review the new guidelines in the Employee Handbook.',
        read: false
      }
    ];

    const allNotifications = [...welcomeNotifications, ...trainingNotifications, ...policyNotifications];

    for (const notification of allNotifications) {
      const notif = await prisma.notification.create({
        data: notification
      });
      notifications.push(notif);
    }

    console.log(`✅ Created ${notifications.length} notifications`);

    // Create Sample Audit Logs
    console.log('\n📊 Creating Audit Logs...');
    
    const auditLogs = [];

    const auditData = [
      {
        userId: carmenJimenez.id,
        propertyId: nayaraBocas.id,
        action: 'USER_CREATED',
        entity: 'User',
        entityId: juanCarlos.id,
        newData: {
          email: 'juan.carlos@nayararesorts.com',
          role: 'STAFF',
          department: 'Front Desk'
        },
        createdAt: new Date('2021-07-01T10:30:00Z')
      },
      {
        userId: robertoMartinez.id,
        propertyId: nayaraBocas.id,
        action: 'DOCUMENT_UPLOADED',
        entity: 'Document',
        entityId: documents[0].id,
        newData: {
          title: 'Employee Handbook 2024',
          scope: 'GENERAL'
        },
        createdAt: new Date('2024-01-15T14:20:00Z')
      },
      {
        userId: mariaGonzalez.id,
        propertyId: nayaraBocas.id,
        action: 'VACATION_APPROVED',
        entity: 'Vacation',
        entityId: vacations[0].id,
        oldData: { status: 'PENDING' },
        newData: { status: 'APPROVED', approvedBy: mariaGonzalez.id },
        createdAt: new Date('2024-02-20T09:15:00Z')
      }
    ];

    for (const audit of auditData) {
      const log = await prisma.auditLog.create({
        data: audit
      });
      auditLogs.push(log);
    }

    console.log(`✅ Created ${auditLogs.length} audit log entries`);

    console.log('\n🎉 Database seeding completed successfully!');
    console.log('\n📊 Summary:');
    console.log(`   Organizations: 2`);
    console.log(`   Properties: 2`);
    console.log(`   Departments: 29 total (19 Nayara + 10 El Palmar)`);
    console.log(`   Users: ${allUsers.length} total (${nayaraUsers.length} Nayara + ${palmarUsers.length} El Palmar)`);
    console.log(`   Module Subscriptions: ${allModules.length + coreModules.length}`);
    console.log(`   Documents: ${documents.length}`);
    console.log(`   Training Sessions: ${trainingSessions.length}`);
    console.log(`   Commercial Benefits: ${benefits.length}`);
    console.log(`   Vacation Requests: ${vacations.length}`);
    console.log(`   Payslips: ${payslips.length}`);
    console.log(`   Notifications: ${notifications.length}`);
    console.log(`   Audit Logs: ${auditLogs.length}`);

    return {
      organizations: [nayaraResorts, tasoGroup],
      properties: [nayaraBocas, elPalmar],
      users: allUsers,
      departments,
      documents,
      trainingSessions,
      benefits,
      vacations,
      payslips,
      notifications,
      auditLogs
    };

  } catch (error) {
    console.error('❌ Error seeding complete data:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run if called directly
if (require.main === module) {
  seedCompleteData()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

module.exports = { seedCompleteData };