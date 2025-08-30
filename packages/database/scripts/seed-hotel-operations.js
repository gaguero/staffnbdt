#!/usr/bin/env node
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL || 'postgresql://postgres:FKoqzYFizlVtabOdDgfxykAwAZuExGbW@shuttle.proxy.rlwy.net:43481/railway'
    }
  }
});

async function seedHotelOperations() {
  console.log('🏨 Starting Hotel Operations Data Seeding...');
  
  try {
    // Step 1: Find or create Nayara Gardens property
    console.log('\n🔍 Finding Nayara Gardens property...');
    
    let property = await prisma.property.findFirst({
      where: {
        name: {
          contains: 'Nayara Gardens',
          mode: 'insensitive'
        }
      }
    });

    if (!property) {
      console.log('   Property not found, checking for Nayara organization...');
      
      let organization = await prisma.organization.findFirst({
        where: {
          name: {
            contains: 'Nayara',
            mode: 'insensitive'
          }
        }
      });

      if (!organization) {
        console.log('   Creating Nayara organization...');
        organization = await prisma.organization.create({
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
            isActive: true
          }
        });
      }

      console.log('   Creating Nayara Gardens property...');
      property = await prisma.property.create({
        data: {
          organizationId: organization.id,
          name: 'Nayara Gardens',
          slug: 'nayara-gardens',
          description: 'Luxury jungle resort featuring overwater bungalows and treetop villas in the heart of Costa Rica\'s rainforest',
          propertyType: 'RESORT',
          address: {
            street: 'Arenal Volcano National Park',
            city: 'La Fortuna',
            state: 'Alajuela',
            country: 'Costa Rica',
            postalCode: '21007'
          },
          timezone: 'America/Costa_Rica',
          phoneNumber: '+506 2479-1200',
          email: 'reservations@nayaragardens.com',
          website: 'https://www.nayararesorts.com/nayara-gardens',
          settings: {
            modules: ['HR', 'DOCUMENTS', 'TRAINING', 'BENEFITS', 'FRONT_DESK', 'HOUSEKEEPING', 'MAINTENANCE', 'INVENTORY'],
            checkInTime: '15:00',
            checkOutTime: '12:00',
            totalRooms: 28,
            maxOccupancy: 84
          },
          isActive: true
        }
      });
    }

    console.log(`✅ Using property: ${property.name} (${property.id})`);

    // Step 2: Clear existing hotel operations data safely
    console.log('\n🧹 Clearing existing hotel operations data...');
    
    console.log('   Clearing reservations...');
    await prisma.reservation.deleteMany({
      where: { propertyId: property.id }
    });

    console.log('   Clearing guests...');
    await prisma.guest.deleteMany({
      where: { propertyId: property.id }
    });

    console.log('   Clearing units/rooms...');
    await prisma.unit.deleteMany({
      where: { propertyId: property.id }
    });

    console.log('✅ Existing hotel operations data cleared');

    // Step 3: Create Units/Rooms (28 total)
    console.log('\n🏠 Creating hotel units/rooms...');
    
    const units = [];

    // Standard rooms (101-112): Garden view, $180/night, 1 king bed, 2 max occupancy
    console.log('   Creating Standard rooms (101-112)...');
    for (let i = 1; i <= 12; i++) {
      const roomNumber = `${100 + i}`;
      const unit = await prisma.unit.create({
        data: {
          propertyId: property.id,
          unitNumber: roomNumber,
          unitType: 'STANDARD',
          building: 'Garden Wing',
          floor: 1,
          bedrooms: 1,
          bathrooms: 1,
          maxOccupancy: 2,
          size: 45.0,
          amenities: ['King Bed', 'Garden View', 'Air Conditioning', 'Mini Fridge', 'Safe', 'Wi-Fi'],
          status: 'AVAILABLE',
          isActive: true,
          description: 'Comfortable garden view room with modern amenities and tropical forest views',
          dailyRate: 180.00
        }
      });
      units.push(unit);
    }

    // Deluxe rooms (201-208): Pool view, $250/night, 1 queen bed, 2 max occupancy
    console.log('   Creating Deluxe rooms (201-208)...');
    for (let i = 1; i <= 8; i++) {
      const roomNumber = `${200 + i}`;
      const unit = await prisma.unit.create({
        data: {
          propertyId: property.id,
          unitNumber: roomNumber,
          unitType: 'DELUXE',
          building: 'Pool Wing',
          floor: 2,
          bedrooms: 1,
          bathrooms: 1,
          maxOccupancy: 2,
          size: 55.0,
          amenities: ['Queen Bed', 'Pool View', 'Balcony', 'Air Conditioning', 'Mini Bar', 'Safe', 'Wi-Fi', 'Coffee Machine'],
          status: 'AVAILABLE',
          isActive: true,
          description: 'Spacious deluxe room with pool view and private balcony overlooking tropical gardens',
          dailyRate: 250.00
        }
      });
      units.push(unit);
    }

    // Suite rooms (301-306): Ocean view, $400/night, 1 king + sofa bed, 4 max occupancy
    console.log('   Creating Suite rooms (301-306)...');
    for (let i = 1; i <= 6; i++) {
      const roomNumber = `${300 + i}`;
      const unit = await prisma.unit.create({
        data: {
          propertyId: property.id,
          unitNumber: roomNumber,
          unitType: 'SUITE',
          building: 'Ocean Wing',
          floor: 3,
          bedrooms: 1,
          bathrooms: 2,
          maxOccupancy: 4,
          size: 85.0,
          amenities: ['King Bed', 'Sofa Bed', 'Ocean View', 'Large Balcony', 'Separate Living Area', 'Mini Bar', 'Safe', 'Wi-Fi', 'Coffee Machine', 'Bathtub'],
          status: 'AVAILABLE',
          isActive: true,
          description: 'Luxurious suite with panoramic ocean view, separate living area, and premium amenities',
          dailyRate: 400.00
        }
      });
      units.push(unit);
    }

    // Presidential suites (401-402): Panoramic view, $800/night, 2 bedrooms, 6 max occupancy
    console.log('   Creating Presidential suites (401-402)...');
    for (let i = 1; i <= 2; i++) {
      const roomNumber = `${400 + i}`;
      const unit = await prisma.unit.create({
        data: {
          propertyId: property.id,
          unitNumber: roomNumber,
          unitType: 'PRESIDENTIAL',
          building: 'Presidential Wing',
          floor: 4,
          bedrooms: 2,
          bathrooms: 3,
          maxOccupancy: 6,
          size: 150.0,
          amenities: ['Master King Bed', 'Second King Bed', 'Panoramic View', 'Private Terrace', 'Full Kitchen', 'Dining Area', 'Living Room', 'Jacuzzi', 'Mini Bar', 'Safe', 'Wi-Fi', 'Butler Service'],
          status: 'AVAILABLE',
          isActive: true,
          description: 'Ultimate luxury presidential suite with panoramic views, full kitchen, private terrace, and dedicated butler service',
          dailyRate: 800.00
        }
      });
      units.push(unit);
    }

    console.log(`✅ Created ${units.length} hotel units/rooms`);

    // Step 4: Create Guest profiles (18 total)
    console.log('\n👥 Creating guest profiles...');
    
    const guests = [];
    
    const guestData = [
      // USA guests
      {
        firstName: 'John',
        lastName: 'Smith',
        email: 'john.smith@gmail.com',
        phoneNumber: '+1-555-0101',
        nationality: 'USA',
        dateOfBirth: new Date('1985-03-15'),
        passportNumber: 'US123456789',
        address: { street: '123 Main St', city: 'New York', state: 'NY', country: 'USA', postalCode: '10001' },
        preferences: { roomType: 'Ocean view preferred', dietary: 'No restrictions', notes: 'Anniversary celebration' },
        vipStatus: 'GOLD'
      },
      {
        firstName: 'Sarah',
        lastName: 'Johnson',
        email: 'sarah.johnson@yahoo.com',
        phoneNumber: '+1-555-0102',
        nationality: 'USA',
        dateOfBirth: new Date('1990-07-22'),
        passportNumber: 'US987654321',
        address: { street: '456 Oak Ave', city: 'Los Angeles', state: 'CA', country: 'USA', postalCode: '90210' },
        preferences: { roomType: 'Pool view', dietary: 'Vegetarian', notes: 'Yoga enthusiast' },
        vipStatus: 'STANDARD'
      },
      {
        firstName: 'Michael',
        lastName: 'Brown',
        email: 'michael.brown@hotmail.com',
        phoneNumber: '+1-555-0103',
        nationality: 'USA',
        dateOfBirth: new Date('1978-11-08'),
        passportNumber: 'US456789123',
        address: { street: '789 Pine St', city: 'Chicago', state: 'IL', country: 'USA', postalCode: '60601' },
        preferences: { roomType: 'Garden view', dietary: 'No seafood', notes: 'Business traveler' },
        vipStatus: 'PLATINUM'
      },
      {
        firstName: 'Emily',
        lastName: 'Davis',
        email: 'emily.davis@gmail.com',
        phoneNumber: '+1-555-0104',
        nationality: 'USA',
        dateOfBirth: new Date('1992-05-30'),
        passportNumber: 'US654321987',
        address: { street: '321 Elm St', city: 'Miami', state: 'FL', country: 'USA', postalCode: '33101' },
        preferences: { roomType: 'Ocean view', dietary: 'Gluten-free', notes: 'Honeymoon' },
        vipStatus: 'STANDARD'
      },
      // Canadian guests
      {
        firstName: 'David',
        lastName: 'Wilson',
        email: 'david.wilson@gmail.ca',
        phoneNumber: '+1-416-555-0201',
        nationality: 'Canada',
        dateOfBirth: new Date('1983-09-12'),
        passportNumber: 'CA123456789',
        address: { street: '100 Queen St', city: 'Toronto', state: 'ON', country: 'Canada', postalCode: 'M5H 2N2' },
        preferences: { roomType: 'Suite preferred', dietary: 'No restrictions', notes: 'Family vacation' },
        vipStatus: 'STANDARD'
      },
      {
        firstName: 'Jennifer',
        lastName: 'Taylor',
        email: 'jen.taylor@outlook.ca',
        phoneNumber: '+1-604-555-0202',
        nationality: 'Canada',
        dateOfBirth: new Date('1987-12-03'),
        passportNumber: 'CA987654321',
        address: { street: '200 Granville St', city: 'Vancouver', state: 'BC', country: 'Canada', postalCode: 'V6C 1S4' },
        preferences: { roomType: 'Pool view', dietary: 'Vegan', notes: 'Nature lover' },
        vipStatus: 'GOLD'
      },
      // German guests
      {
        firstName: 'Klaus',
        lastName: 'Mueller',
        email: 'klaus.mueller@gmail.com',
        phoneNumber: '+49-30-12345678',
        nationality: 'Germany',
        dateOfBirth: new Date('1975-04-20'),
        passportNumber: 'DE123456789',
        address: { street: 'Unter den Linden 1', city: 'Berlin', state: 'Berlin', country: 'Germany', postalCode: '10117' },
        preferences: { roomType: 'Garden view', dietary: 'No restrictions', notes: 'Photography enthusiast' },
        vipStatus: 'STANDARD'
      },
      {
        firstName: 'Ingrid',
        lastName: 'Schmidt',
        email: 'ingrid.schmidt@web.de',
        phoneNumber: '+49-89-87654321',
        nationality: 'Germany',
        dateOfBirth: new Date('1982-08-14'),
        passportNumber: 'DE987654321',
        address: { street: 'Marienplatz 8', city: 'Munich', state: 'Bayern', country: 'Germany', postalCode: '80331' },
        preferences: { roomType: 'Ocean view', dietary: 'Low sodium', notes: 'Wellness retreat' },
        vipStatus: 'PLATINUM'
      },
      {
        firstName: 'Hans',
        lastName: 'Weber',
        email: 'hans.weber@gmx.de',
        phoneNumber: '+49-40-11111111',
        nationality: 'Germany',
        dateOfBirth: new Date('1969-01-25'),
        passportNumber: 'DE456789123',
        address: { street: 'Reeperbahn 50', city: 'Hamburg', state: 'Hamburg', country: 'Germany', postalCode: '20359' },
        preferences: { roomType: 'Suite', dietary: 'No restrictions', notes: 'Frequent traveler' },
        vipStatus: 'GOLD'
      },
      // UK guests
      {
        firstName: 'James',
        lastName: 'Thompson',
        email: 'james.thompson@btinternet.com',
        phoneNumber: '+44-20-71234567',
        nationality: 'United Kingdom',
        dateOfBirth: new Date('1980-06-10'),
        passportNumber: 'GB123456789',
        address: { street: '10 Downing Street', city: 'London', state: 'England', country: 'United Kingdom', postalCode: 'SW1A 2AA' },
        preferences: { roomType: 'Presidential suite', dietary: 'No restrictions', notes: 'Business executive' },
        vipStatus: 'PLATINUM'
      },
      {
        firstName: 'Emma',
        lastName: 'Williams',
        email: 'emma.williams@gmail.com',
        phoneNumber: '+44-161-2345678',
        nationality: 'United Kingdom',
        dateOfBirth: new Date('1988-10-18'),
        passportNumber: 'GB987654321',
        address: { street: '25 Oxford Street', city: 'Manchester', state: 'England', country: 'United Kingdom', postalCode: 'M1 1AA' },
        preferences: { roomType: 'Deluxe room', dietary: 'Pescatarian', notes: 'Art enthusiast' },
        vipStatus: 'STANDARD'
      },
      {
        firstName: 'Oliver',
        lastName: 'Jones',
        email: 'oliver.jones@hotmail.co.uk',
        phoneNumber: '+44-131-3456789',
        nationality: 'United Kingdom',
        dateOfBirth: new Date('1993-02-28'),
        passportNumber: 'GB456789123',
        address: { street: '1 Princes Street', city: 'Edinburgh', state: 'Scotland', country: 'United Kingdom', postalCode: 'EH2 2AN' },
        preferences: { roomType: 'Garden view', dietary: 'No restrictions', notes: 'Adventure seeker' },
        vipStatus: 'STANDARD'
      },
      // Costa Rican guests
      {
        firstName: 'Carlos',
        lastName: 'Rodriguez',
        email: 'carlos.rodriguez@gmail.com',
        phoneNumber: '+506-8888-1234',
        nationality: 'Costa Rica',
        dateOfBirth: new Date('1984-07-05'),
        idNumber: '1-1234-5678',
        address: { street: 'Avenida Central 100', city: 'San José', state: 'San José', country: 'Costa Rica', postalCode: '10101' },
        preferences: { roomType: 'Pool view', dietary: 'No restrictions', notes: 'Local staycation' },
        vipStatus: 'GOLD'
      },
      {
        firstName: 'Maria',
        lastName: 'Gonzalez',
        email: 'maria.gonzalez@hotmail.com',
        phoneNumber: '+506-7777-5678',
        nationality: 'Costa Rica',
        dateOfBirth: new Date('1991-11-15'),
        idNumber: '2-2345-6789',
        address: { street: 'Calle 5, Avenida 2', city: 'Cartago', state: 'Cartago', country: 'Costa Rica', postalCode: '30101' },
        preferences: { roomType: 'Garden view', dietary: 'Vegetarian', notes: 'Eco-tourism' },
        vipStatus: 'STANDARD'
      },
      {
        firstName: 'Roberto',
        lastName: 'Jimenez',
        email: 'roberto.jimenez@yahoo.com',
        phoneNumber: '+506-6666-9012',
        nationality: 'Costa Rica',
        dateOfBirth: new Date('1976-12-20'),
        idNumber: '1-3456-7890',
        address: { street: 'Boulevard Los Yoses', city: 'San Pedro', state: 'San José', country: 'Costa Rica', postalCode: '11501' },
        preferences: { roomType: 'Ocean view', dietary: 'No restrictions', notes: 'Weekend getaway' },
        vipStatus: 'STANDARD'
      },
      // Additional international guests
      {
        firstName: 'Pierre',
        lastName: 'Dubois',
        email: 'pierre.dubois@gmail.com',
        phoneNumber: '+33-1-23456789',
        nationality: 'France',
        dateOfBirth: new Date('1979-03-08'),
        passportNumber: 'FR123456789',
        address: { street: '1 Rue de la Paix', city: 'Paris', state: 'Île-de-France', country: 'France', postalCode: '75001' },
        preferences: { roomType: 'Suite', dietary: 'No restrictions', notes: 'Culinary enthusiast' },
        vipStatus: 'GOLD'
      },
      {
        firstName: 'Yuki',
        lastName: 'Tanaka',
        email: 'yuki.tanaka@gmail.com',
        phoneNumber: '+81-3-12345678',
        nationality: 'Japan',
        dateOfBirth: new Date('1986-09-25'),
        passportNumber: 'JP123456789',
        address: { street: '1-1-1 Shibuya', city: 'Tokyo', state: 'Tokyo', country: 'Japan', postalCode: '150-0002' },
        preferences: { roomType: 'Deluxe room', dietary: 'No beef', notes: 'Photography tour' },
        vipStatus: 'STANDARD'
      },
      {
        firstName: 'Isabella',
        lastName: 'Martinez',
        email: 'isabella.martinez@gmail.com',
        phoneNumber: '+34-91-1234567',
        nationality: 'Spain',
        dateOfBirth: new Date('1989-05-12'),
        passportNumber: 'ES123456789',
        address: { street: 'Gran Vía 1', city: 'Madrid', state: 'Madrid', country: 'Spain', postalCode: '28013' },
        preferences: { roomType: 'Pool view', dietary: 'No restrictions', notes: 'Cultural explorer' },
        vipStatus: 'STANDARD'
      }
    ];

    for (const [index, guestInfo] of guestData.entries()) {
      console.log(`   Creating guest ${index + 1}/18: ${guestInfo.firstName} ${guestInfo.lastName}`);
      const guest = await prisma.guest.create({
        data: {
          propertyId: property.id,
          ...guestInfo
        }
      });
      guests.push(guest);
    }

    console.log(`✅ Created ${guests.length} guest profiles`);

    // Step 5: Create Reservations (27 bookings)
    console.log('\n📅 Creating reservations...');
    
    const reservations = [];

    // Helper function to generate reservation number
    function generateReservationNumber() {
      return `NG${Date.now().toString().slice(-6)}${Math.floor(Math.random() * 100).toString().padStart(2, '0')}`;
    }

    // Helper function to calculate nights and total
    function calculateReservation(checkIn, checkOut, dailyRate) {
      const nights = Math.ceil((checkOut - checkIn) / (1000 * 60 * 60 * 24));
      return { nights, totalAmount: nights * dailyRate };
    }

    // 8 CHECKED_OUT reservations (June-July 2024): Completed stays
    console.log('   Creating CHECKED_OUT reservations (June-July 2024)...');
    
    const checkedOutReservations = [
      {
        guest: guests[0], // John Smith
        unit: units[20], // Suite 301
        checkInDate: new Date('2024-06-15'),
        checkOutDate: new Date('2024-06-20'),
        adults: 2,
        children: 0,
        status: 'CHECKED_OUT',
        paymentStatus: 'PAID',
        paymentMethod: 'Credit Card',
        specialRequests: 'Anniversary celebration setup, champagne on arrival',
        notes: 'VIP guest, excellent feedback',
        source: 'Direct booking',
        confirmationCode: 'NG240615001',
        checkedInAt: new Date('2024-06-15T15:30:00Z'),
        checkedOutAt: new Date('2024-06-20T11:45:00Z')
      },
      {
        guest: guests[2], // Michael Brown
        unit: units[5], // Deluxe 206
        checkInDate: new Date('2024-06-22'),
        checkOutDate: new Date('2024-06-25'),
        adults: 1,
        children: 0,
        status: 'CHECKED_OUT',
        paymentStatus: 'PAID',
        paymentMethod: 'Corporate Card',
        specialRequests: 'Late check-in, business center access',
        notes: 'Business traveler, extended stay member',
        source: 'Corporate booking',
        confirmationCode: 'NG240622002',
        checkedInAt: new Date('2024-06-22T18:15:00Z'),
        checkedOutAt: new Date('2024-06-25T10:30:00Z')
      },
      {
        guest: guests[6], // Klaus Mueller
        unit: units[8], // Standard 109
        checkInDate: new Date('2024-07-01'),
        checkOutDate: new Date('2024-07-08'),
        adults: 2,
        children: 1,
        status: 'CHECKED_OUT',
        paymentStatus: 'PAID',
        paymentMethod: 'Debit Card',
        specialRequests: 'Extra bed for child, photography equipment storage',
        notes: 'Photography tour group, nature enthusiast',
        source: 'Travel agent',
        confirmationCode: 'NG240701003',
        checkedInAt: new Date('2024-07-01T16:00:00Z'),
        checkedOutAt: new Date('2024-07-08T12:00:00Z')
      },
      {
        guest: guests[9], // James Thompson
        unit: units[27], // Presidential 402
        checkInDate: new Date('2024-07-10'),
        checkOutDate: new Date('2024-07-17'),
        adults: 4,
        children: 2,
        status: 'CHECKED_OUT',
        paymentStatus: 'PAID',
        paymentMethod: 'American Express',
        specialRequests: 'Butler service, private dining arrangements',
        notes: 'High-value guest, executive level service',
        source: 'Direct booking',
        confirmationCode: 'NG240710004',
        checkedInAt: new Date('2024-07-10T15:00:00Z'),
        checkedOutAt: new Date('2024-07-17T11:00:00Z')
      },
      {
        guest: guests[4], // David Wilson
        unit: units[15], // Deluxe 203
        checkInDate: new Date('2024-07-20'),
        checkOutDate: new Date('2024-07-27'),
        adults: 2,
        children: 2,
        status: 'CHECKED_OUT',
        paymentStatus: 'PAID',
        paymentMethod: 'Visa',
        specialRequests: 'Connecting rooms, kids activities program',
        notes: 'Family vacation, repeat customers',
        source: 'Online booking',
        confirmationCode: 'NG240720005',
        checkedInAt: new Date('2024-07-20T14:30:00Z'),
        checkedOutAt: new Date('2024-07-27T11:30:00Z')
      },
      {
        guest: guests[12], // Carlos Rodriguez
        unit: units[3], // Standard 104
        checkInDate: new Date('2024-07-25'),
        checkOutDate: new Date('2024-07-28'),
        adults: 2,
        children: 0,
        status: 'CHECKED_OUT',
        paymentStatus: 'PAID',
        paymentMethod: 'Cash',
        specialRequests: 'Pool access, local tour recommendations',
        notes: 'Local staycation, positive experience',
        source: 'Direct booking',
        confirmationCode: 'NG240725006',
        checkedInAt: new Date('2024-07-25T15:45:00Z'),
        checkedOutAt: new Date('2024-07-28T10:45:00Z')
      },
      {
        guest: guests[7], // Ingrid Schmidt
        unit: units[22], // Suite 303
        checkInDate: new Date('2024-07-28'),
        checkOutDate: new Date('2024-08-04'),
        adults: 1,
        children: 0,
        status: 'CHECKED_OUT',
        paymentStatus: 'PAID',
        paymentMethod: 'Mastercard',
        specialRequests: 'Wellness package, spa treatments',
        notes: 'Wellness retreat guest, extended spa services',
        source: 'Wellness partner',
        confirmationCode: 'NG240728007',
        checkedInAt: new Date('2024-07-28T15:00:00Z'),
        checkedOutAt: new Date('2024-08-04T12:00:00Z')
      },
      {
        guest: guests[15], // Pierre Dubois
        unit: units[18], // Deluxe 207
        checkInDate: new Date('2024-08-05'),
        checkOutDate: new Date('2024-08-10'),
        adults: 2,
        children: 0,
        status: 'CHECKED_OUT',
        paymentStatus: 'PAID',
        paymentMethod: 'Credit Card',
        specialRequests: 'Culinary experience, chef interaction',
        notes: 'Culinary tour, exceptional dining feedback',
        source: 'Culinary tour operator',
        confirmationCode: 'NG240805008',
        checkedInAt: new Date('2024-08-05T16:30:00Z'),
        checkedOutAt: new Date('2024-08-10T11:15:00Z')
      }
    ];

    for (const [index, reservationData] of checkedOutReservations.entries()) {
      const { nights, totalAmount } = calculateReservation(
        reservationData.checkInDate,
        reservationData.checkOutDate,
        reservationData.unit.dailyRate
      );
      
      console.log(`     Creating CHECKED_OUT reservation ${index + 1}/8`);
      const reservation = await prisma.reservation.create({
        data: {
          propertyId: property.id,
          unitId: reservationData.unit.id,
          guestId: reservationData.guest.id,
          reservationNumber: generateReservationNumber(),
          checkInDate: reservationData.checkInDate,
          checkOutDate: reservationData.checkOutDate,
          adults: reservationData.adults,
          children: reservationData.children,
          status: reservationData.status,
          totalAmount: totalAmount,
          paidAmount: totalAmount,
          paymentStatus: reservationData.paymentStatus,
          paymentMethod: reservationData.paymentMethod,
          specialRequests: reservationData.specialRequests,
          notes: reservationData.notes,
          source: reservationData.source,
          confirmationCode: reservationData.confirmationCode,
          checkedInAt: reservationData.checkedInAt,
          checkedOutAt: reservationData.checkedOutAt
        }
      });
      reservations.push(reservation);
    }

    // 5 CHECKED_IN reservations (August 2024): Current guests
    console.log('   Creating CHECKED_IN reservations (current guests)...');
    
    const checkedInReservations = [
      {
        guest: guests[1], // Sarah Johnson
        unit: units[14], // Deluxe 202
        checkInDate: new Date('2024-08-25'),
        checkOutDate: new Date('2024-08-30'),
        adults: 1,
        children: 0,
        status: 'CHECKED_IN',
        paymentStatus: 'PAID',
        paymentMethod: 'Credit Card',
        specialRequests: 'Yoga mat in room, vegetarian meal preferences',
        notes: 'Wellness-focused guest, yoga enthusiast',
        source: 'Online booking',
        confirmationCode: 'NG240825009',
        checkedInAt: new Date('2024-08-25T15:15:00Z')
      },
      {
        guest: guests[5], // Jennifer Taylor
        unit: units[21], // Suite 302
        checkInDate: new Date('2024-08-27'),
        checkOutDate: new Date('2024-09-03'),
        adults: 2,
        children: 0,
        status: 'CHECKED_IN',
        paymentStatus: 'PARTIAL',
        paymentMethod: 'Credit Card',
        specialRequests: 'Vegan meal options, nature tour bookings',
        notes: 'Nature lover, interested in conservation programs',
        source: 'Eco-tour operator',
        confirmationCode: 'NG240827010',
        checkedInAt: new Date('2024-08-27T16:00:00Z')
      },
      {
        guest: guests[11], // Oliver Jones
        unit: units[7], // Standard 108
        checkInDate: new Date('2024-08-28'),
        checkOutDate: new Date('2024-09-01'),
        adults: 1,
        children: 0,
        status: 'CHECKED_IN',
        paymentStatus: 'PAID',
        paymentMethod: 'Debit Card',
        specialRequests: 'Adventure activity bookings, equipment rental',
        notes: 'Adventure seeker, zip-line and hiking tours',
        source: 'Adventure tour operator',
        confirmationCode: 'NG240828011',
        checkedInAt: new Date('2024-08-28T14:45:00Z')
      },
      {
        guest: guests[13], // Maria Gonzalez
        unit: units[6], // Standard 107
        checkInDate: new Date('2024-08-29'),
        checkOutDate: new Date('2024-09-02'),
        adults: 2,
        children: 1,
        status: 'CHECKED_IN',
        paymentStatus: 'PAID',
        paymentMethod: 'Cash',
        specialRequests: 'Extra bed, vegetarian options, local eco-tours',
        notes: 'Local eco-tourism family, environmental education focus',
        source: 'Direct booking',
        confirmationCode: 'NG240829012',
        checkedInAt: new Date('2024-08-29T15:30:00Z')
      },
      {
        guest: guests[16], // Yuki Tanaka
        unit: units[16], // Deluxe 204
        checkInDate: new Date('2024-08-30'),
        checkOutDate: new Date('2024-09-05'),
        adults: 1,
        children: 0,
        status: 'CHECKED_IN',
        paymentStatus: 'PAID',
        paymentMethod: 'Credit Card',
        specialRequests: 'Photography equipment storage, early morning tours',
        notes: 'Photography tour participant, wildlife focus',
        source: 'Photography tour group',
        confirmationCode: 'NG240830013',
        checkedInAt: new Date('2024-08-30T15:00:00Z')
      }
    ];

    for (const [index, reservationData] of checkedInReservations.entries()) {
      const { nights, totalAmount } = calculateReservation(
        reservationData.checkInDate,
        reservationData.checkOutDate,
        reservationData.unit.dailyRate
      );
      
      const paidAmount = reservationData.paymentStatus === 'PARTIAL' ? totalAmount * 0.5 : totalAmount;
      
      console.log(`     Creating CHECKED_IN reservation ${index + 1}/5`);
      const reservation = await prisma.reservation.create({
        data: {
          propertyId: property.id,
          unitId: reservationData.unit.id,
          guestId: reservationData.guest.id,
          reservationNumber: generateReservationNumber(),
          checkInDate: reservationData.checkInDate,
          checkOutDate: reservationData.checkOutDate,
          adults: reservationData.adults,
          children: reservationData.children,
          status: reservationData.status,
          totalAmount: totalAmount,
          paidAmount: paidAmount,
          paymentStatus: reservationData.paymentStatus,
          paymentMethod: reservationData.paymentMethod,
          specialRequests: reservationData.specialRequests,
          notes: reservationData.notes,
          source: reservationData.source,
          confirmationCode: reservationData.confirmationCode,
          checkedInAt: reservationData.checkedInAt
        }
      });
      reservations.push(reservation);
    }

    // 12 CONFIRMED reservations (Sept-Dec 2024): Future bookings
    console.log('   Creating CONFIRMED reservations (future bookings)...');
    
    const confirmedReservations = [
      {
        guest: guests[3], // Emily Davis
        unit: units[23], // Suite 304
        checkInDate: new Date('2024-09-15'),
        checkOutDate: new Date('2024-09-22'),
        adults: 2,
        children: 0,
        status: 'CONFIRMED',
        paymentStatus: 'PARTIAL',
        paymentMethod: 'Credit Card',
        specialRequests: 'Honeymoon package, romantic dinner setup, gluten-free options',
        notes: 'Honeymoon couple, special occasion services',
        source: 'Direct booking'
      },
      {
        guest: guests[8], // Hans Weber
        unit: units[24], // Suite 305
        checkInDate: new Date('2024-09-20'),
        checkOutDate: new Date('2024-09-25'),
        adults: 1,
        children: 0,
        status: 'CONFIRMED',
        paymentStatus: 'PAID',
        paymentMethod: 'Credit Card',
        specialRequests: 'Executive level service, business center access',
        notes: 'Frequent traveler, loyalty program member',
        source: 'Corporate booking'
      },
      {
        guest: guests[10], // Emma Williams
        unit: units[17], // Deluxe 205
        checkInDate: new Date('2024-10-05'),
        checkOutDate: new Date('2024-10-10'),
        adults: 2,
        children: 0,
        status: 'CONFIRMED',
        paymentStatus: 'PENDING',
        paymentMethod: null,
        specialRequests: 'Art gallery tours, cultural experiences, pescatarian meals',
        notes: 'Art enthusiast, cultural activities focus',
        source: 'Cultural tour operator'
      },
      {
        guest: guests[14], // Roberto Jimenez
        unit: units[12], // Standard 101
        checkInDate: new Date('2024-10-12'),
        checkOutDate: new Date('2024-10-14'),
        adults: 2,
        children: 0,
        status: 'CONFIRMED',
        paymentStatus: 'PAID',
        paymentMethod: 'Cash',
        specialRequests: 'Weekend package, local attractions information',
        notes: 'Weekend getaway, local guest',
        source: 'Direct booking'
      },
      {
        guest: guests[17], // Isabella Martinez
        unit: units[19], // Deluxe 208
        checkInDate: new Date('2024-10-18'),
        checkOutDate: new Date('2024-10-25'),
        adults: 1,
        children: 0,
        status: 'CONFIRMED',
        paymentStatus: 'PARTIAL',
        paymentMethod: 'Credit Card',
        specialRequests: 'Cultural exploration tours, historical site visits',
        notes: 'Cultural explorer, solo traveler',
        source: 'Cultural heritage tours'
      },
      {
        guest: guests[0], // John Smith (return visit)
        unit: units[26], // Presidential 401
        checkInDate: new Date('2024-11-01'),
        checkOutDate: new Date('2024-11-08'),
        adults: 4,
        children: 0,
        status: 'CONFIRMED',
        paymentStatus: 'PAID',
        paymentMethod: 'American Express',
        specialRequests: 'VIP service, butler arrangements, special dining experiences',
        notes: 'Return VIP guest, premium service level',
        source: 'Direct booking'
      },
      {
        guest: guests[6], // Klaus Mueller (return visit)
        unit: units[25], // Suite 306
        checkInDate: new Date('2024-11-10'),
        checkOutDate: new Date('2024-11-17'),
        adults: 2,
        children: 1,
        status: 'CONFIRMED',
        paymentStatus: 'PARTIAL',
        paymentMethod: 'Debit Card',
        specialRequests: 'Photography workshop, equipment access, family activities',
        notes: 'Return photography enthusiast, family trip',
        source: 'Photography workshop'
      },
      {
        guest: guests[9], // James Thompson (return visit)
        unit: units[27], // Presidential 402
        checkInDate: new Date('2024-11-20'),
        checkOutDate: new Date('2024-11-25'),
        adults: 2,
        children: 0,
        status: 'CONFIRMED',
        paymentStatus: 'PAID',
        paymentMethod: 'Corporate Card',
        specialRequests: 'Executive retreat setup, conference room access, premium dining',
        notes: 'Corporate retreat, executive level accommodations',
        source: 'Corporate booking'
      },
      {
        guest: guests[4], // David Wilson (return visit)
        unit: units[20], // Suite 301
        checkInDate: new Date('2024-12-01'),
        checkOutDate: new Date('2024-12-08'),
        adults: 3,
        children: 2,
        status: 'CONFIRMED',
        paymentStatus: 'PENDING',
        paymentMethod: null,
        specialRequests: 'Holiday decorations, family activities, kids program',
        notes: 'Holiday family vacation, repeat customers',
        source: 'Direct booking'
      },
      {
        guest: guests[2], // Michael Brown (return visit)
        unit: units[13], // Deluxe 201
        checkInDate: new Date('2024-12-10'),
        checkOutDate: new Date('2024-12-15'),
        adults: 1,
        children: 0,
        status: 'CONFIRMED',
        paymentStatus: 'PAID',
        paymentMethod: 'Corporate Card',
        specialRequests: 'Business amenities, late check-out, airport transfer',
        notes: 'Business traveler, year-end meetings',
        source: 'Corporate booking'
      },
      {
        guest: guests[5], // Jennifer Taylor (return visit)
        unit: units[22], // Suite 303
        checkInDate: new Date('2024-12-18'),
        checkOutDate: new Date('2024-12-25'),
        adults: 2,
        children: 0,
        status: 'CONFIRMED',
        paymentStatus: 'PARTIAL',
        paymentMethod: 'Credit Card',
        specialRequests: 'Holiday celebration package, vegan Christmas menu, nature experiences',
        notes: 'Holiday celebration, eco-friendly requests',
        source: 'Holiday package booking'
      },
      {
        guest: guests[15], // Pierre Dubois (return visit)
        unit: units[21], // Suite 302
        checkInDate: new Date('2024-12-26'),
        checkOutDate: new Date('2024-12-31'),
        adults: 2,
        children: 0,
        status: 'CONFIRMED',
        paymentStatus: 'PAID',
        paymentMethod: 'Credit Card',
        specialRequests: 'New Year celebration, gourmet dining experiences, wine pairings',
        notes: 'New Year celebration, culinary focus',
        source: 'New Year package'
      }
    ];

    for (const [index, reservationData] of confirmedReservations.entries()) {
      const { nights, totalAmount } = calculateReservation(
        reservationData.checkInDate,
        reservationData.checkOutDate,
        reservationData.unit.dailyRate
      );
      
      let paidAmount = 0;
      if (reservationData.paymentStatus === 'PAID') {
        paidAmount = totalAmount;
      } else if (reservationData.paymentStatus === 'PARTIAL') {
        paidAmount = totalAmount * 0.3; // 30% deposit
      }
      
      console.log(`     Creating CONFIRMED reservation ${index + 1}/12`);
      const reservation = await prisma.reservation.create({
        data: {
          propertyId: property.id,
          unitId: reservationData.unit.id,
          guestId: reservationData.guest.id,
          reservationNumber: generateReservationNumber(),
          checkInDate: reservationData.checkInDate,
          checkOutDate: reservationData.checkOutDate,
          adults: reservationData.adults,
          children: reservationData.children,
          status: reservationData.status,
          totalAmount: totalAmount,
          paidAmount: paidAmount,
          paymentStatus: reservationData.paymentStatus,
          paymentMethod: reservationData.paymentMethod,
          specialRequests: reservationData.specialRequests,
          notes: reservationData.notes,
          source: reservationData.source,
          confirmationCode: generateReservationNumber()
        }
      });
      reservations.push(reservation);
    }

    // 2 CANCELLED reservations
    console.log('   Creating CANCELLED reservations...');
    
    const cancelledReservations = [
      {
        guest: guests[7], // Ingrid Schmidt
        unit: units[18], // Deluxe 207
        checkInDate: new Date('2024-09-10'),
        checkOutDate: new Date('2024-09-15'),
        adults: 1,
        children: 0,
        status: 'CANCELLED',
        paymentStatus: 'REFUNDED',
        paymentMethod: 'Credit Card',
        specialRequests: 'Wellness package, spa treatments',
        notes: 'Cancelled due to personal emergency',
        source: 'Direct booking',
        cancelledAt: new Date('2024-09-05T10:30:00Z'),
        cancellationReason: 'Personal emergency - family illness. Full refund processed.'
      },
      {
        guest: guests[11], // Oliver Jones
        unit: units[11], // Standard 112
        checkInDate: new Date('2024-11-05'),
        checkOutDate: new Date('2024-11-08'),
        adults: 1,
        children: 0,
        status: 'CANCELLED',
        paymentStatus: 'PARTIAL',
        paymentMethod: 'Debit Card',
        specialRequests: 'Adventure activities, equipment rental',
        notes: 'Cancelled due to weather concerns',
        source: 'Adventure tour operator',
        cancelledAt: new Date('2024-10-25T14:20:00Z'),
        cancellationReason: 'Weather conditions unsuitable for planned adventure activities. Partial refund applied per cancellation policy.'
      }
    ];

    for (const [index, reservationData] of cancelledReservations.entries()) {
      const { nights, totalAmount } = calculateReservation(
        reservationData.checkInDate,
        reservationData.checkOutDate,
        reservationData.unit.dailyRate
      );
      
      const paidAmount = reservationData.paymentStatus === 'REFUNDED' ? 0 : totalAmount * 0.2; // Cancellation fee
      
      console.log(`     Creating CANCELLED reservation ${index + 1}/2`);
      const reservation = await prisma.reservation.create({
        data: {
          propertyId: property.id,
          unitId: reservationData.unit.id,
          guestId: reservationData.guest.id,
          reservationNumber: generateReservationNumber(),
          checkInDate: reservationData.checkInDate,
          checkOutDate: reservationData.checkOutDate,
          adults: reservationData.adults,
          children: reservationData.children,
          status: reservationData.status,
          totalAmount: totalAmount,
          paidAmount: paidAmount,
          paymentStatus: reservationData.paymentStatus,
          paymentMethod: reservationData.paymentMethod,
          specialRequests: reservationData.specialRequests,
          notes: reservationData.notes,
          source: reservationData.source,
          confirmationCode: generateReservationNumber(),
          cancelledAt: reservationData.cancelledAt,
          cancellationReason: reservationData.cancellationReason
        }
      });
      reservations.push(reservation);
    }

    console.log(`✅ Created ${reservations.length} reservations`);

    // Summary statistics
    const checkedOutCount = reservations.filter(r => r.status === 'CHECKED_OUT').length;
    const checkedInCount = reservations.filter(r => r.status === 'CHECKED_IN').length;
    const confirmedCount = reservations.filter(r => r.status === 'CONFIRMED').length;
    const cancelledCount = reservations.filter(r => r.status === 'CANCELLED').length;

    const totalRevenue = reservations
      .filter(r => r.status !== 'CANCELLED')
      .reduce((sum, r) => sum + parseFloat(r.totalAmount), 0);

    const totalPaid = reservations
      .reduce((sum, r) => sum + parseFloat(r.paidAmount), 0);

    console.log('\n🎉 Hotel Operations Data Seeding Completed Successfully!');
    console.log('\n📊 Summary:');
    console.log(`   Property: ${property.name}`);
    console.log(`   Units/Rooms: ${units.length} total`);
    console.log(`     - Standard rooms (101-112): 12 rooms @ $180/night`);
    console.log(`     - Deluxe rooms (201-208): 8 rooms @ $250/night`);
    console.log(`     - Suite rooms (301-306): 6 rooms @ $400/night`);
    console.log(`     - Presidential suites (401-402): 2 rooms @ $800/night`);
    console.log(`   Guest Profiles: ${guests.length} total`);
    console.log(`     - USA: 4 guests`);
    console.log(`     - Canada: 2 guests`);
    console.log(`     - Germany: 3 guests`);
    console.log(`     - United Kingdom: 3 guests`);
    console.log(`     - Costa Rica: 3 guests`);
    console.log(`     - Other countries: 3 guests`);
    console.log(`   Reservations: ${reservations.length} total`);
    console.log(`     - CHECKED_OUT: ${checkedOutCount} completed stays`);
    console.log(`     - CHECKED_IN: ${checkedInCount} current guests`);
    console.log(`     - CONFIRMED: ${confirmedCount} future bookings`);
    console.log(`     - CANCELLED: ${cancelledCount} cancelled bookings`);
    console.log(`   Revenue Metrics:`);
    console.log(`     - Total Revenue: $${totalRevenue.toFixed(2)}`);
    console.log(`     - Total Paid: $${totalPaid.toFixed(2)}`);
    console.log(`     - Outstanding: $${(totalRevenue - totalPaid).toFixed(2)}`);

    return {
      property,
      units,
      guests,
      reservations,
      summary: {
        property: property.name,
        totalUnits: units.length,
        totalGuests: guests.length,
        totalReservations: reservations.length,
        reservationsByStatus: {
          checkedOut: checkedOutCount,
          checkedIn: checkedInCount,
          confirmed: confirmedCount,
          cancelled: cancelledCount
        },
        revenue: {
          total: totalRevenue,
          paid: totalPaid,
          outstanding: totalRevenue - totalPaid
        }
      }
    };

  } catch (error) {
    console.error('❌ Error seeding hotel operations data:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run if called directly
if (require.main === module) {
  seedHotelOperations()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

module.exports = { seedHotelOperations };