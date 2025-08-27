# Hotel Core Backend Architecture

## Executive Summary

This document provides the complete technical blueprint for implementing the core hotel operations backend, covering Guests, Units (Rooms), and Reservations. The architecture follows the established multi-tenant patterns of the Hotel Operations Hub platform, ensuring seamless integration with the existing HR, User Management, and Organization systems.

**Key Deliverables:**
- Complete API specifications for Guest, Unit, and Reservation management
- Multi-tenant data isolation and security implementation
- Advanced permission system integration with granular hotel-specific permissions
- Business logic patterns for availability checking and conflict prevention
- Production-ready service layer architecture

## Database Models Analysis

### Existing Schema Foundation

The database schema already includes comprehensive models for hotel operations:

```prisma
model Unit {
  id           String        @id @default(cuid())
  propertyId   String
  unitNumber   String
  unitType     UnitType      @default(STANDARD)
  building     String?
  floor        Int?
  bedrooms     Int           @default(1)
  bathrooms    Int           @default(1)
  maxOccupancy Int           @default(2)
  size         Decimal?      @db.Decimal(8, 2)
  amenities    String[]
  status       UnitStatus    @default(AVAILABLE)
  isActive     Boolean       @default(true)
  description  String?
  notes        String?
  dailyRate    Decimal?      @db.Decimal(10, 2)
  createdAt    DateTime      @default(now())
  updatedAt    DateTime      @updatedAt
  deletedAt    DateTime?
  reservations Reservation[]
  tasks        Task[]        @relation("UnitTasks")
  property     Property      @relation(fields: [propertyId], references: [id])
}

model Guest {
  id              String        @id @default(cuid())
  propertyId      String
  firstName       String
  lastName        String
  email           String?
  phoneNumber     String?
  nationality     String?
  dateOfBirth     DateTime?
  passportNumber  String?
  idNumber        String?
  address         Json?
  preferences     Json?
  vipStatus       VipStatus     @default(STANDARD)
  notes           String?
  blacklisted     Boolean       @default(false)
  blacklistReason String?
  createdAt       DateTime      @default(now())
  updatedAt       DateTime      @updatedAt
  deletedAt       DateTime?
  property        Property      @relation(fields: [propertyId], references: [id])
  reservations    Reservation[]
}

model Reservation {
  id                 String            @id @default(cuid())
  propertyId         String
  unitId             String
  guestId            String
  reservationNumber  String            @unique
  checkInDate        DateTime
  checkOutDate       DateTime
  adults             Int               @default(1)
  children           Int               @default(0)
  status             ReservationStatus @default(CONFIRMED)
  totalAmount        Decimal           @db.Decimal(10, 2)
  paidAmount         Decimal           @default(0) @db.Decimal(10, 2)
  currency           String            @default("USD")
  paymentStatus      PaymentStatus     @default(PENDING)
  paymentMethod      String?
  specialRequests    String?
  notes              String?
  source             String?
  confirmationCode   String?
  checkedInAt        DateTime?
  checkedOutAt       DateTime?
  checkedInBy        String?
  checkedOutBy       String?
  cancelledAt        DateTime?
  cancelledBy        String?
  cancellationReason String?
  createdAt          DateTime          @default(now())
  updatedAt          DateTime          @updatedAt
  guest              Guest             @relation(fields: [guestId], references: [id])
  property           Property          @relation(fields: [propertyId], references: [id])
  unit               Unit              @relation(fields: [unitId], references: [id])
  tasks              Task[]            @relation("ReservationTasks")
}
```

### Enums and Status Types

```prisma
enum UnitType {
  STANDARD, DELUXE, SUITE, PRESIDENTIAL, FAMILY, 
  ACCESSIBLE, STUDIO, APARTMENT, VILLA, OTHER
}

enum UnitStatus {
  AVAILABLE, OCCUPIED, MAINTENANCE, CLEANING, 
  OUT_OF_ORDER, RESERVED
}

enum VipStatus {
  STANDARD, BRONZE, SILVER, GOLD, PLATINUM, DIAMOND
}

enum ReservationStatus {
  CONFIRMED, CHECKED_IN, CHECKED_OUT, CANCELLED, NO_SHOW
}

enum PaymentStatus {
  PENDING, PARTIAL, PAID, REFUNDED, CANCELLED
}
```

## API Endpoint Specifications

### Guest Management API

#### GuestsController (`/api/guests`)

```typescript
@Controller('guests')
@UseGuards(JwtAuthGuard, PermissionGuard, TenantInterceptor)
@ApiBearerAuth()
export class GuestsController {

  @Post()
  @RequirePermission('guest.create.property', 'guest.create.department')
  @Audit({ action: 'CREATE', entity: 'Guest' })
  async create(@Body() createGuestDto: CreateGuestDto, @CurrentUser() currentUser: User)

  @Get()
  @RequirePermission('guest.read.property', 'guest.read.department')
  @PermissionScope('property')
  async findAll(@Query() filterDto: GuestFilterDto, @CurrentUser() currentUser: User)

  @Get('search')
  @RequirePermission('guest.read.property', 'guest.read.department')
  async search(@Query() searchDto: GuestSearchDto, @CurrentUser() currentUser: User)

  @Get(':id')
  @RequirePermission('guest.read.property', 'guest.read.department')
  @Audit({ action: 'VIEW', entity: 'Guest' })
  async findOne(@Param('id') id: string, @CurrentUser() currentUser: User)

  @Patch(':id')
  @RequirePermission('guest.update.property', 'guest.update.department')
  @Audit({ action: 'UPDATE', entity: 'Guest' })
  async update(@Param('id') id: string, @Body() updateGuestDto: UpdateGuestDto, @CurrentUser() currentUser: User)

  @Delete(':id')
  @RequirePermission('guest.delete.property')
  @Audit({ action: 'DELETE', entity: 'Guest' })
  async remove(@Param('id') id: string, @CurrentUser() currentUser: User)

  @Patch(':id/vip-status')
  @RequirePermission('guest.update_vip.property', 'guest.update_vip.department')
  @Audit({ action: 'UPDATE_VIP_STATUS', entity: 'Guest' })
  async updateVipStatus(@Param('id') id: string, @Body() updateVipDto: UpdateVipStatusDto, @CurrentUser() currentUser: User)

  @Patch(':id/blacklist')
  @RequirePermission('guest.blacklist.property')
  @Audit({ action: 'BLACKLIST', entity: 'Guest' })
  async toggleBlacklist(@Param('id') id: string, @Body() blacklistDto: BlacklistGuestDto, @CurrentUser() currentUser: User)

  @Get(':id/reservations')
  @RequirePermission('guest.read.property', 'reservation.read.property')
  async getGuestReservations(@Param('id') id: string, @Query() filterDto: ReservationFilterDto, @CurrentUser() currentUser: User)

  @Get(':id/history')
  @RequirePermission('guest.read.property')
  async getGuestHistory(@Param('id') id: string, @CurrentUser() currentUser: User)

  @Post('merge')
  @RequirePermission('guest.merge.property')
  @Audit({ action: 'MERGE', entity: 'Guest' })
  async mergeGuests(@Body() mergeDto: MergeGuestsDto, @CurrentUser() currentUser: User)
}
```

### Unit Management API

#### UnitsController (`/api/units`)

```typescript
@Controller('units')
@UseGuards(JwtAuthGuard, PermissionGuard, TenantInterceptor)
@ApiBearerAuth()
export class UnitsController {

  @Post()
  @RequirePermission('unit.create.property')
  @Audit({ action: 'CREATE', entity: 'Unit' })
  async create(@Body() createUnitDto: CreateUnitDto, @CurrentUser() currentUser: User)

  @Get()
  @RequirePermission('unit.read.property', 'unit.read.department')
  @PermissionScope('property')
  async findAll(@Query() filterDto: UnitFilterDto, @CurrentUser() currentUser: User)

  @Get('availability')
  @RequirePermission('unit.read.property', 'reservation.read.property')
  async checkAvailability(@Query() availabilityDto: CheckAvailabilityDto, @CurrentUser() currentUser: User)

  @Get('types')
  @RequirePermission('unit.read.property')
  async getUnitTypes(@CurrentUser() currentUser: User)

  @Get('amenities')
  @RequirePermission('unit.read.property')
  async getAvailableAmenities(@CurrentUser() currentUser: User)

  @Get(':id')
  @RequirePermission('unit.read.property', 'unit.read.department')
  @Audit({ action: 'VIEW', entity: 'Unit' })
  async findOne(@Param('id') id: string, @CurrentUser() currentUser: User)

  @Patch(':id')
  @RequirePermission('unit.update.property', 'unit.update.department')
  @Audit({ action: 'UPDATE', entity: 'Unit' })
  async update(@Param('id') id: string, @Body() updateUnitDto: UpdateUnitDto, @CurrentUser() currentUser: User)

  @Patch(':id/status')
  @RequirePermission('unit.update_status.property', 'unit.update_status.department')
  @Audit({ action: 'UPDATE_STATUS', entity: 'Unit' })
  async updateStatus(@Param('id') id: string, @Body() statusDto: UpdateUnitStatusDto, @CurrentUser() currentUser: User)

  @Delete(':id')
  @RequirePermission('unit.delete.property')
  @Audit({ action: 'DELETE', entity: 'Unit' })
  async remove(@Param('id') id: string, @CurrentUser() currentUser: User)

  @Get(':id/reservations')
  @RequirePermission('unit.read.property', 'reservation.read.property')
  async getUnitReservations(@Param('id') id: string, @Query() filterDto: ReservationFilterDto, @CurrentUser() currentUser: User)

  @Get(':id/maintenance-history')
  @RequirePermission('unit.read.property', 'maintenance.read.property')
  async getMaintenanceHistory(@Param('id') id: string, @CurrentUser() currentUser: User)

  @Post('bulk-update')
  @RequirePermission('unit.bulk_update.property')
  @Audit({ action: 'BULK_UPDATE', entity: 'Unit' })
  async bulkUpdate(@Body() bulkUpdateDto: BulkUpdateUnitsDto, @CurrentUser() currentUser: User)
}
```

### Reservation Management API

#### ReservationsController (`/api/reservations`)

```typescript
@Controller('reservations')
@UseGuards(JwtAuthGuard, PermissionGuard, TenantInterceptor)
@ApiBearerAuth()
export class ReservationsController {

  @Post()
  @RequirePermission('reservation.create.property', 'reservation.create.department')
  @Audit({ action: 'CREATE', entity: 'Reservation' })
  async create(@Body() createReservationDto: CreateReservationDto, @CurrentUser() currentUser: User)

  @Get()
  @RequirePermission('reservation.read.property', 'reservation.read.department')
  @PermissionScope('property')
  async findAll(@Query() filterDto: ReservationFilterDto, @CurrentUser() currentUser: User)

  @Get('calendar')
  @RequirePermission('reservation.read.property', 'reservation.read.department')
  async getCalendarView(@Query() calendarDto: CalendarViewDto, @CurrentUser() currentUser: User)

  @Get('arrivals')
  @RequirePermission('reservation.read.property', 'reservation.read.department')
  async getTodayArrivals(@Query() dateDto: DateFilterDto, @CurrentUser() currentUser: User)

  @Get('departures')
  @RequirePermission('reservation.read.property', 'reservation.read.department')
  async getTodayDepartures(@Query() dateDto: DateFilterDto, @CurrentUser() currentUser: User)

  @Get('stats')
  @RequirePermission('reservation.read.property', 'analytics.read.property')
  async getReservationStats(@Query() statsDto: ReservationStatsDto, @CurrentUser() currentUser: User)

  @Get(':id')
  @RequirePermission('reservation.read.property', 'reservation.read.department')
  @Audit({ action: 'VIEW', entity: 'Reservation' })
  async findOne(@Param('id') id: string, @CurrentUser() currentUser: User)

  @Patch(':id')
  @RequirePermission('reservation.update.property', 'reservation.update.department')
  @Audit({ action: 'UPDATE', entity: 'Reservation' })
  async update(@Param('id') id: string, @Body() updateReservationDto: UpdateReservationDto, @CurrentUser() currentUser: User)

  @Post(':id/check-in')
  @RequirePermission('reservation.checkin.property', 'reservation.checkin.department')
  @Audit({ action: 'CHECK_IN', entity: 'Reservation' })
  async checkIn(@Param('id') id: string, @Body() checkInDto: CheckInDto, @CurrentUser() currentUser: User)

  @Post(':id/check-out')
  @RequirePermission('reservation.checkout.property', 'reservation.checkout.department')
  @Audit({ action: 'CHECK_OUT', entity: 'Reservation' })
  async checkOut(@Param('id') id: string, @Body() checkOutDto: CheckOutDto, @CurrentUser() currentUser: User)

  @Post(':id/cancel')
  @RequirePermission('reservation.cancel.property', 'reservation.cancel.department')
  @Audit({ action: 'CANCEL', entity: 'Reservation' })
  async cancel(@Param('id') id: string, @Body() cancelDto: CancelReservationDto, @CurrentUser() currentUser: User)

  @Post(':id/no-show')
  @RequirePermission('reservation.mark_no_show.property', 'reservation.mark_no_show.department')
  @Audit({ action: 'MARK_NO_SHOW', entity: 'Reservation' })
  async markNoShow(@Param('id') id: string, @Body() noShowDto: NoShowDto, @CurrentUser() currentUser: User)

  @Patch(':id/payment-status')
  @RequirePermission('reservation.update_payment.property', 'reservation.update_payment.department')
  @Audit({ action: 'UPDATE_PAYMENT', entity: 'Reservation' })
  async updatePaymentStatus(@Param('id') id: string, @Body() paymentDto: UpdatePaymentStatusDto, @CurrentUser() currentUser: User)

  @Post('validate-availability')
  @RequirePermission('reservation.create.property', 'reservation.create.department', 'unit.read.property')
  async validateAvailability(@Body() availabilityDto: ValidateAvailabilityDto, @CurrentUser() currentUser: User)
}
```

## DTOs and Validation

### Guest DTOs

#### CreateGuestDto
```typescript
export class CreateGuestDto {
  @ApiProperty({ example: 'John' })
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  firstName: string;

  @ApiProperty({ example: 'Doe' })
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  lastName: string;

  @ApiPropertyOptional({ example: 'john.doe@email.com' })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({ example: '+1234567890' })
  @IsOptional()
  @IsPhoneNumber()
  phoneNumber?: string;

  @ApiPropertyOptional({ example: 'US' })
  @IsOptional()
  @IsString()
  @Length(2, 3)
  nationality?: string;

  @ApiPropertyOptional({ example: '1985-06-15' })
  @IsOptional()
  @IsDateString()
  @Transform(({ value }) => value ? new Date(value).toISOString() : value)
  dateOfBirth?: string;

  @ApiPropertyOptional({ example: 'P123456789' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  passportNumber?: string;

  @ApiPropertyOptional({ example: '123456789' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  idNumber?: string;

  @ApiPropertyOptional({
    example: {
      street: '123 Main St',
      city: 'New York',
      state: 'NY',
      postalCode: '10001',
      country: 'US'
    }
  })
  @IsOptional()
  @IsObject()
  @ValidateNested()
  address?: GuestAddressDto;

  @ApiPropertyOptional({
    example: {
      roomPreference: 'Non-smoking',
      bedType: 'King',
      floorPreference: 'High',
      dietaryRestrictions: ['Vegetarian']
    }
  })
  @IsOptional()
  @IsObject()
  preferences?: Record<string, any>;

  @ApiPropertyOptional({ enum: VipStatus, example: VipStatus.STANDARD })
  @IsOptional()
  @IsEnum(VipStatus)
  vipStatus?: VipStatus;

  @ApiPropertyOptional({ example: 'Frequent guest, prefers quiet rooms' })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  notes?: string;
}
```

#### GuestFilterDto
```typescript
export class GuestFilterDto extends PaginationDto {
  @ApiPropertyOptional({ example: 'john doe' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  search?: string;

  @ApiPropertyOptional({ enum: VipStatus })
  @IsOptional()
  @IsEnum(VipStatus)
  vipStatus?: VipStatus;

  @ApiPropertyOptional({ example: 'US' })
  @IsOptional()
  @IsString()
  nationality?: string;

  @ApiPropertyOptional({ example: false })
  @IsOptional()
  @Transform(({ value }) => value === 'true')
  @IsBoolean()
  blacklisted?: boolean;

  @ApiPropertyOptional({ example: '2024-01-01' })
  @IsOptional()
  @IsDateString()
  createdAfter?: string;

  @ApiPropertyOptional({ example: '2024-12-31' })
  @IsOptional()
  @IsDateString()
  createdBefore?: string;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @Transform(({ value }) => value === 'true')
  @IsBoolean()
  hasActiveReservations?: boolean;
}
```

### Unit DTOs

#### CreateUnitDto
```typescript
export class CreateUnitDto {
  @ApiProperty({ example: '101' })
  @IsString()
  @MinLength(1)
  @MaxLength(20)
  unitNumber: string;

  @ApiProperty({ enum: UnitType, example: UnitType.STANDARD })
  @IsEnum(UnitType)
  unitType: UnitType;

  @ApiPropertyOptional({ example: 'Building A' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  building?: string;

  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(200)
  floor?: number;

  @ApiProperty({ example: 1 })
  @IsInt()
  @Min(1)
  @Max(10)
  bedrooms: number;

  @ApiProperty({ example: 1 })
  @IsInt()
  @Min(1)
  @Max(10)
  bathrooms: number;

  @ApiProperty({ example: 2 })
  @IsInt()
  @Min(1)
  @Max(20)
  maxOccupancy: number;

  @ApiPropertyOptional({ example: 450.5 })
  @IsOptional()
  @IsDecimal({ decimal_digits: '0,2' })
  @Min(0)
  size?: number;

  @ApiPropertyOptional({
    example: ['WiFi', 'Air Conditioning', 'Mini Bar', 'Balcony'],
    type: [String]
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @MaxLength(100, { each: true })
  amenities?: string[];

  @ApiPropertyOptional({ example: 'Ocean view room with king bed' })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;

  @ApiPropertyOptional({ example: 'Recently renovated' })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  notes?: string;

  @ApiPropertyOptional({ example: 150.00 })
  @IsOptional()
  @IsDecimal({ decimal_digits: '0,2' })
  @Min(0)
  dailyRate?: number;
}
```

#### CheckAvailabilityDto
```typescript
export class CheckAvailabilityDto {
  @ApiProperty({ example: '2024-03-15' })
  @IsDateString()
  @Transform(({ value }) => new Date(value).toISOString())
  checkInDate: string;

  @ApiProperty({ example: '2024-03-18' })
  @IsDateString()
  @Transform(({ value }) => new Date(value).toISOString())
  @ValidateIf((o) => new Date(o.checkOutDate) > new Date(o.checkInDate))
  checkOutDate: string;

  @ApiPropertyOptional({ example: 2 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(20)
  adults?: number;

  @ApiPropertyOptional({ example: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(10)
  children?: number;

  @ApiPropertyOptional({ enum: UnitType })
  @IsOptional()
  @IsEnum(UnitType)
  unitType?: UnitType;

  @ApiPropertyOptional({
    example: ['WiFi', 'Air Conditioning'],
    type: [String]
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  requiredAmenities?: string[];

  @ApiPropertyOptional({ example: 200.00 })
  @IsOptional()
  @IsDecimal({ decimal_digits: '0,2' })
  @Min(0)
  maxRate?: number;

  @ApiPropertyOptional({ example: 'Building A' })
  @IsOptional()
  @IsString()
  building?: string;

  @ApiPropertyOptional({ example: 3 })
  @IsOptional()
  @IsInt()
  @Min(0)
  minFloor?: number;

  @ApiPropertyOptional({ example: 10 })
  @IsOptional()
  @IsInt()
  @Min(0)
  maxFloor?: number;
}
```

### Reservation DTOs

#### CreateReservationDto
```typescript
export class CreateReservationDto {
  @ApiProperty({ example: 'cuid-guest-id' })
  @IsString()
  @IsUUID()
  guestId: string;

  @ApiProperty({ example: 'cuid-unit-id' })
  @IsString()
  @IsUUID()
  unitId: string;

  @ApiProperty({ example: '2024-03-15' })
  @IsDateString()
  @Transform(({ value }) => new Date(value).toISOString())
  checkInDate: string;

  @ApiProperty({ example: '2024-03-18' })
  @IsDateString()
  @Transform(({ value }) => new Date(value).toISOString())
  @ValidateIf((o) => new Date(o.checkOutDate) > new Date(o.checkInDate))
  checkOutDate: string;

  @ApiProperty({ example: 2 })
  @IsInt()
  @Min(1)
  @Max(20)
  adults: number;

  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(10)
  children?: number;

  @ApiProperty({ example: 450.00 })
  @IsDecimal({ decimal_digits: '0,2' })
  @Min(0)
  totalAmount: number;

  @ApiPropertyOptional({ example: 150.00 })
  @IsOptional()
  @IsDecimal({ decimal_digits: '0,2' })
  @Min(0)
  paidAmount?: number;

  @ApiPropertyOptional({ example: 'USD' })
  @IsOptional()
  @IsString()
  @Length(3, 3)
  currency?: string;

  @ApiPropertyOptional({ enum: PaymentStatus, example: PaymentStatus.PENDING })
  @IsOptional()
  @IsEnum(PaymentStatus)
  paymentStatus?: PaymentStatus;

  @ApiPropertyOptional({ example: 'Credit Card' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  paymentMethod?: string;

  @ApiPropertyOptional({ example: 'Late check-in, quiet room preferred' })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  specialRequests?: string;

  @ApiPropertyOptional({ example: 'Booking notes' })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  notes?: string;

  @ApiPropertyOptional({ example: 'Direct' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  source?: string;

  @ApiPropertyOptional({ example: 'ABC123' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  confirmationCode?: string;
}
```

## Service Layer Architecture

### GuestService Implementation

```typescript
@Injectable()
export class GuestService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
    private readonly tenantContextService: TenantContextService,
  ) {}

  async create(createGuestDto: CreateGuestDto, currentUser: User): Promise<Guest> {
    // Get tenant context
    const tenantContext = this.tenantContextService.getTenantContext();
    
    // Check for duplicate guests by email or phone
    if (createGuestDto.email || createGuestDto.phoneNumber) {
      const existingGuest = await this.findDuplicateGuest(
        createGuestDto.email,
        createGuestDto.phoneNumber,
        tenantContext.propertyId
      );
      
      if (existingGuest) {
        throw new BadRequestException('Guest with this email or phone number already exists');
      }
    }

    const guest = await this.prisma.guest.create({
      data: {
        ...createGuestDto,
        propertyId: tenantContext.propertyId,
        dateOfBirth: createGuestDto.dateOfBirth ? new Date(createGuestDto.dateOfBirth) : null,
        address: createGuestDto.address || null,
        preferences: createGuestDto.preferences || null,
      },
      include: {
        property: true,
        reservations: {
          include: {
            unit: true,
          },
          orderBy: {
            createdAt: 'desc',
          },
          take: 5, // Recent reservations
        },
      },
    });

    await this.auditService.logCreate(currentUser.id, 'Guest', guest.id, guest);
    return guest;
  }

  async findAll(
    filterDto: GuestFilterDto,
    currentUser: User
  ): Promise<PaginatedResponse<GuestWithReservations>> {
    const tenantContext = this.tenantContextService.getTenantContext();
    const { limit, offset, search, vipStatus, nationality, blacklisted, createdAfter, createdBefore, hasActiveReservations } = filterDto;

    let whereClause: any = {
      propertyId: tenantContext.propertyId,
      deletedAt: null,
    };

    // Apply filters
    if (search) {
      whereClause.OR = [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { phoneNumber: { contains: search, mode: 'insensitive' } },
        { passportNumber: { contains: search, mode: 'insensitive' } },
        { idNumber: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (vipStatus) whereClause.vipStatus = vipStatus;
    if (nationality) whereClause.nationality = nationality;
    if (typeof blacklisted === 'boolean') whereClause.blacklisted = blacklisted;
    if (createdAfter) whereClause.createdAt = { gte: new Date(createdAfter) };
    if (createdBefore) {
      whereClause.createdAt = {
        ...whereClause.createdAt,
        lte: new Date(createdBefore),
      };
    }

    // Filter by active reservations
    if (typeof hasActiveReservations === 'boolean') {
      if (hasActiveReservations) {
        whereClause.reservations = {
          some: {
            status: {
              in: [ReservationStatus.CONFIRMED, ReservationStatus.CHECKED_IN],
            },
            checkOutDate: {
              gte: new Date(),
            },
          },
        };
      } else {
        whereClause.reservations = {
          none: {
            status: {
              in: [ReservationStatus.CONFIRMED, ReservationStatus.CHECKED_IN],
            },
            checkOutDate: {
              gte: new Date(),
            },
          },
        };
      }
    }

    const [guests, total] = await Promise.all([
      this.prisma.guest.findMany({
        where: whereClause,
        include: {
          reservations: {
            include: {
              unit: true,
            },
            orderBy: {
              createdAt: 'desc',
            },
            take: 3, // Latest 3 reservations for list view
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        skip: offset,
        take: limit,
      }),
      this.prisma.guest.count({ where: whereClause }),
    ]);

    return new PaginatedResponse(guests, total, limit, offset);
  }

  private async findDuplicateGuest(
    email?: string,
    phoneNumber?: string,
    propertyId?: string
  ): Promise<Guest | null> {
    if (!email && !phoneNumber) return null;

    const whereConditions: any[] = [];
    
    if (email) whereConditions.push({ email });
    if (phoneNumber) whereConditions.push({ phoneNumber });

    return this.prisma.guest.findFirst({
      where: {
        propertyId,
        deletedAt: null,
        OR: whereConditions,
      },
    });
  }

  async mergeGuests(mergeDto: MergeGuestsDto, currentUser: User): Promise<Guest> {
    const tenantContext = this.tenantContextService.getTenantContext();
    
    const [primaryGuest, duplicateGuest] = await Promise.all([
      this.prisma.guest.findFirst({
        where: { id: mergeDto.primaryGuestId, propertyId: tenantContext.propertyId },
        include: { reservations: true },
      }),
      this.prisma.guest.findFirst({
        where: { id: mergeDto.duplicateGuestId, propertyId: tenantContext.propertyId },
        include: { reservations: true },
      }),
    ]);

    if (!primaryGuest || !duplicateGuest) {
      throw new NotFoundException('One or both guests not found');
    }

    return this.prisma.$transaction(async (tx) => {
      // Transfer reservations from duplicate to primary
      await tx.reservation.updateMany({
        where: { guestId: duplicateGuest.id },
        data: { guestId: primaryGuest.id },
      });

      // Merge guest data (keep primary, supplement with duplicate data where primary is null)
      const mergedData: any = {
        email: primaryGuest.email || duplicateGuest.email,
        phoneNumber: primaryGuest.phoneNumber || duplicateGuest.phoneNumber,
        nationality: primaryGuest.nationality || duplicateGuest.nationality,
        dateOfBirth: primaryGuest.dateOfBirth || duplicateGuest.dateOfBirth,
        passportNumber: primaryGuest.passportNumber || duplicateGuest.passportNumber,
        idNumber: primaryGuest.idNumber || duplicateGuest.idNumber,
        address: primaryGuest.address || duplicateGuest.address,
        preferences: {
          ...(duplicateGuest.preferences as object || {}),
          ...(primaryGuest.preferences as object || {}),
        },
        vipStatus: primaryGuest.vipStatus !== 'STANDARD' ? primaryGuest.vipStatus : duplicateGuest.vipStatus,
        notes: [primaryGuest.notes, duplicateGuest.notes].filter(Boolean).join('\n---\n'),
      };

      // Update primary guest
      const updatedGuest = await tx.guest.update({
        where: { id: primaryGuest.id },
        data: mergedData,
        include: {
          reservations: {
            include: { unit: true },
            orderBy: { createdAt: 'desc' },
          },
        },
      });

      // Soft delete duplicate guest
      await tx.guest.update({
        where: { id: duplicateGuest.id },
        data: { deletedAt: new Date() },
      });

      await this.auditService.logCreate(currentUser.id, 'GuestMerge', updatedGuest.id, {
        primaryGuestId: primaryGuest.id,
        duplicateGuestId: duplicateGuest.id,
        mergedData,
      });

      return updatedGuest;
    });
  }
}
```

### UnitService Implementation

```typescript
@Injectable()
export class UnitService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
    private readonly tenantContextService: TenantContextService,
  ) {}

  async create(createUnitDto: CreateUnitDto, currentUser: User): Promise<Unit> {
    const tenantContext = this.tenantContextService.getTenantContext();
    
    // Check for duplicate unit number in property
    const existingUnit = await this.prisma.unit.findFirst({
      where: {
        propertyId: tenantContext.propertyId,
        unitNumber: createUnitDto.unitNumber,
        deletedAt: null,
      },
    });

    if (existingUnit) {
      throw new BadRequestException(`Unit number ${createUnitDto.unitNumber} already exists in this property`);
    }

    const unit = await this.prisma.unit.create({
      data: {
        ...createUnitDto,
        propertyId: tenantContext.propertyId,
        amenities: createUnitDto.amenities || [],
        size: createUnitDto.size ? new Decimal(createUnitDto.size) : null,
        dailyRate: createUnitDto.dailyRate ? new Decimal(createUnitDto.dailyRate) : null,
      },
      include: {
        property: true,
        reservations: {
          where: {
            status: {
              in: [ReservationStatus.CONFIRMED, ReservationStatus.CHECKED_IN],
            },
          },
          include: {
            guest: true,
          },
        },
      },
    });

    await this.auditService.logCreate(currentUser.id, 'Unit', unit.id, unit);
    return unit;
  }

  async checkAvailability(
    availabilityDto: CheckAvailabilityDto,
    currentUser: User
  ): Promise<AvailabilityResult> {
    const tenantContext = this.tenantContextService.getTenantContext();
    const { checkInDate, checkOutDate, adults, children, unitType, requiredAmenities, maxRate, building, minFloor, maxFloor } = availabilityDto;

    const checkIn = new Date(checkInDate);
    const checkOut = new Date(checkOutDate);
    const totalGuests = (adults || 1) + (children || 0);

    // Build unit filter
    let unitWhere: any = {
      propertyId: tenantContext.propertyId,
      isActive: true,
      deletedAt: null,
      maxOccupancy: { gte: totalGuests },
      status: {
        in: [UnitStatus.AVAILABLE, UnitStatus.OCCUPIED], // OCCUPIED units might be available if no overlapping reservations
      },
    };

    if (unitType) unitWhere.unitType = unitType;
    if (building) unitWhere.building = building;
    if (minFloor !== undefined) unitWhere.floor = { ...unitWhere.floor, gte: minFloor };
    if (maxFloor !== undefined) unitWhere.floor = { ...unitWhere.floor, lte: maxFloor };
    if (maxRate) unitWhere.dailyRate = { lte: new Decimal(maxRate) };
    if (requiredAmenities?.length) {
      unitWhere.amenities = { hasEvery: requiredAmenities };
    }

    // Get all potentially available units
    const units = await this.prisma.unit.findMany({
      where: unitWhere,
      include: {
        reservations: {
          where: {
            status: {
              in: [ReservationStatus.CONFIRMED, ReservationStatus.CHECKED_IN],
            },
            OR: [
              {
                checkInDate: { lte: checkOut },
                checkOutDate: { gte: checkIn },
              },
            ],
          },
        },
      },
    });

    // Filter out units with conflicting reservations
    const availableUnits = units.filter(unit => {
      // If unit is OUT_OF_ORDER or MAINTENANCE, it's not available
      if ([UnitStatus.OUT_OF_ORDER, UnitStatus.MAINTENANCE, UnitStatus.CLEANING].includes(unit.status)) {
        return false;
      }

      // Check for reservation conflicts
      const hasConflict = unit.reservations.some(reservation => {
        const resCheckIn = new Date(reservation.checkInDate);
        const resCheckOut = new Date(reservation.checkOutDate);
        
        // Check for overlap
        return (resCheckIn < checkOut && resCheckOut > checkIn);
      });

      return !hasConflict;
    });

    // Calculate rates and group by unit type
    const availabilityByType = availableUnits.reduce((acc, unit) => {
      const unitType = unit.unitType;
      if (!acc[unitType]) {
        acc[unitType] = {
          unitType,
          availableCount: 0,
          units: [],
          minRate: null,
          maxRate: null,
          averageRate: null,
        };
      }
      
      acc[unitType].availableCount++;
      acc[unitType].units.push({
        id: unit.id,
        unitNumber: unit.unitNumber,
        building: unit.building,
        floor: unit.floor,
        dailyRate: unit.dailyRate?.toNumber(),
        amenities: unit.amenities,
        description: unit.description,
      });

      // Update rate statistics
      if (unit.dailyRate) {
        const rate = unit.dailyRate.toNumber();
        if (!acc[unitType].minRate || rate < acc[unitType].minRate) {
          acc[unitType].minRate = rate;
        }
        if (!acc[unitType].maxRate || rate > acc[unitType].maxRate) {
          acc[unitType].maxRate = rate;
        }
      }

      return acc;
    }, {} as Record<string, any>);

    // Calculate average rates
    Object.values(availabilityByType).forEach((typeData: any) => {
      const rates = typeData.units
        .map((u: any) => u.dailyRate)
        .filter((rate: any) => rate !== null && rate !== undefined);
      
      if (rates.length > 0) {
        typeData.averageRate = rates.reduce((sum: number, rate: number) => sum + rate, 0) / rates.length;
      }
    });

    return {
      checkInDate: checkIn,
      checkOutDate: checkOut,
      nights: Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24)),
      totalAvailableUnits: availableUnits.length,
      availabilityByType: Object.values(availabilityByType),
      searchCriteria: availabilityDto,
    };
  }

  async updateStatus(
    id: string,
    statusDto: UpdateUnitStatusDto,
    currentUser: User
  ): Promise<Unit> {
    const tenantContext = this.tenantContextService.getTenantContext();
    
    const unit = await this.prisma.unit.findFirst({
      where: {
        id,
        propertyId: tenantContext.propertyId,
        deletedAt: null,
      },
      include: {
        reservations: {
          where: {
            status: ReservationStatus.CHECKED_IN,
          },
        },
      },
    });

    if (!unit) {
      throw new NotFoundException('Unit not found');
    }

    // Prevent status changes that conflict with active reservations
    if (statusDto.status === UnitStatus.MAINTENANCE || statusDto.status === UnitStatus.OUT_OF_ORDER) {
      if (unit.reservations.length > 0) {
        throw new BadRequestException('Cannot change status while guests are checked in');
      }
    }

    const updatedUnit = await this.prisma.unit.update({
      where: { id },
      data: {
        status: statusDto.status,
        notes: statusDto.notes ? `${unit.notes || ''}\n${new Date().toISOString()}: ${statusDto.notes}` : unit.notes,
      },
      include: {
        reservations: {
          where: {
            status: {
              in: [ReservationStatus.CONFIRMED, ReservationStatus.CHECKED_IN],
            },
          },
          include: {
            guest: true,
          },
        },
      },
    });

    await this.auditService.logUpdate(currentUser.id, 'Unit', id, { status: unit.status }, { status: statusDto.status });
    return updatedUnit;
  }
}
```

### ReservationService Implementation

```typescript
@Injectable()
export class ReservationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
    private readonly tenantContextService: TenantContextService,
    private readonly unitService: UnitService,
  ) {}

  async create(createReservationDto: CreateReservationDto, currentUser: User): Promise<Reservation> {
    const tenantContext = this.tenantContextService.getTenantContext();
    
    // Validate availability before creating
    await this.validateReservationAvailability(createReservationDto, tenantContext.propertyId);

    // Validate guest exists and belongs to property
    const guest = await this.prisma.guest.findFirst({
      where: {
        id: createReservationDto.guestId,
        propertyId: tenantContext.propertyId,
        deletedAt: null,
      },
    });

    if (!guest) {
      throw new NotFoundException('Guest not found');
    }

    // Validate unit exists and belongs to property
    const unit = await this.prisma.unit.findFirst({
      where: {
        id: createReservationDto.unitId,
        propertyId: tenantContext.propertyId,
        deletedAt: null,
        isActive: true,
      },
    });

    if (!unit) {
      throw new NotFoundException('Unit not found or inactive');
    }

    // Validate occupancy
    const totalGuests = createReservationDto.adults + (createReservationDto.children || 0);
    if (totalGuests > unit.maxOccupancy) {
      throw new BadRequestException(`Unit maximum occupancy is ${unit.maxOccupancy} guests`);
    }

    // Generate unique reservation number
    const reservationNumber = await this.generateReservationNumber(tenantContext.propertyId);

    const reservation = await this.prisma.reservation.create({
      data: {
        ...createReservationDto,
        propertyId: tenantContext.propertyId,
        reservationNumber,
        checkInDate: new Date(createReservationDto.checkInDate),
        checkOutDate: new Date(createReservationDto.checkOutDate),
        totalAmount: new Decimal(createReservationDto.totalAmount),
        paidAmount: createReservationDto.paidAmount ? new Decimal(createReservationDto.paidAmount) : new Decimal(0),
        currency: createReservationDto.currency || 'USD',
        paymentStatus: createReservationDto.paymentStatus || PaymentStatus.PENDING,
      },
      include: {
        guest: true,
        unit: true,
        property: true,
      },
    });

    // Update unit status if it's currently available
    if (unit.status === UnitStatus.AVAILABLE) {
      await this.prisma.unit.update({
        where: { id: unit.id },
        data: { status: UnitStatus.RESERVED },
      });
    }

    await this.auditService.logCreate(currentUser.id, 'Reservation', reservation.id, reservation);
    return reservation;
  }

  async checkIn(id: string, checkInDto: CheckInDto, currentUser: User): Promise<Reservation> {
    const tenantContext = this.tenantContextService.getTenantContext();
    
    const reservation = await this.prisma.reservation.findFirst({
      where: {
        id,
        propertyId: tenantContext.propertyId,
        status: ReservationStatus.CONFIRMED,
      },
      include: {
        guest: true,
        unit: true,
      },
    });

    if (!reservation) {
      throw new NotFoundException('Reservation not found or already checked in');
    }

    // Check if check-in date is valid
    const today = new Date();
    const checkInDate = new Date(reservation.checkInDate);
    const maxEarlyCheckIn = new Date(checkInDate.getTime() - (24 * 60 * 60 * 1000)); // 1 day early

    if (today < maxEarlyCheckIn) {
      throw new BadRequestException('Check-in date is too early');
    }

    // Ensure unit is available for check-in
    if (reservation.unit.status === UnitStatus.MAINTENANCE || reservation.unit.status === UnitStatus.OUT_OF_ORDER) {
      throw new BadRequestException('Unit is not available for check-in');
    }

    const updatedReservation = await this.prisma.$transaction(async (tx) => {
      // Update reservation status
      const reservation = await tx.reservation.update({
        where: { id },
        data: {
          status: ReservationStatus.CHECKED_IN,
          checkedInAt: new Date(),
          checkedInBy: currentUser.id,
          notes: checkInDto.notes 
            ? `${reservation.notes || ''}\nCheck-in: ${checkInDto.notes}`
            : reservation.notes,
        },
        include: {
          guest: true,
          unit: true,
          property: true,
        },
      });

      // Update unit status
      await tx.unit.update({
        where: { id: reservation.unitId },
        data: { status: UnitStatus.OCCUPIED },
      });

      // Create housekeeping tasks if needed
      if (checkInDto.createTasks) {
        await tx.task.create({
          data: {
            propertyId: tenantContext.propertyId,
            title: `Post Check-in Inspection - Unit ${reservation.unit.unitNumber}`,
            description: 'Verify unit condition after guest check-in',
            taskType: TaskType.INSPECTION,
            priority: TaskPriority.MEDIUM,
            status: TaskStatus.PENDING,
            unitId: reservation.unitId,
            reservationId: reservation.id,
            createdBy: currentUser.id,
            dueDate: new Date(Date.now() + (2 * 60 * 60 * 1000)), // 2 hours from now
          },
        });
      }

      return reservation;
    });

    await this.auditService.logUpdate(currentUser.id, 'Reservation', id, 
      { status: ReservationStatus.CONFIRMED }, 
      { status: ReservationStatus.CHECKED_IN }
    );

    return updatedReservation;
  }

  async checkOut(id: string, checkOutDto: CheckOutDto, currentUser: User): Promise<Reservation> {
    const tenantContext = this.tenantContextService.getTenantContext();
    
    const reservation = await this.prisma.reservation.findFirst({
      where: {
        id,
        propertyId: tenantContext.propertyId,
        status: ReservationStatus.CHECKED_IN,
      },
      include: {
        guest: true,
        unit: true,
      },
    });

    if (!reservation) {
      throw new NotFoundException('Reservation not found or not checked in');
    }

    const updatedReservation = await this.prisma.$transaction(async (tx) => {
      // Update reservation status
      const reservation = await tx.reservation.update({
        where: { id },
        data: {
          status: ReservationStatus.CHECKED_OUT,
          checkedOutAt: new Date(),
          checkedOutBy: currentUser.id,
          notes: checkOutDto.notes 
            ? `${reservation.notes || ''}\nCheck-out: ${checkOutDto.notes}`
            : reservation.notes,
        },
        include: {
          guest: true,
          unit: true,
          property: true,
        },
      });

      // Update unit status and create cleaning task
      await tx.unit.update({
        where: { id: reservation.unitId },
        data: { status: UnitStatus.CLEANING },
      });

      // Create cleaning task
      await tx.task.create({
        data: {
          propertyId: tenantContext.propertyId,
          title: `Clean Unit ${reservation.unit.unitNumber}`,
          description: 'Clean unit after guest checkout',
          taskType: TaskType.CLEANING,
          priority: TaskPriority.HIGH,
          status: TaskStatus.PENDING,
          unitId: reservation.unitId,
          reservationId: reservation.id,
          createdBy: currentUser.id,
          dueDate: new Date(Date.now() + (2 * 60 * 60 * 1000)), // 2 hours
        },
      });

      return reservation;
    });

    await this.auditService.logUpdate(currentUser.id, 'Reservation', id,
      { status: ReservationStatus.CHECKED_IN },
      { status: ReservationStatus.CHECKED_OUT }
    );

    return updatedReservation;
  }

  private async validateReservationAvailability(
    createReservationDto: CreateReservationDto,
    propertyId: string
  ): Promise<void> {
    const { unitId, checkInDate, checkOutDate } = createReservationDto;
    
    const checkIn = new Date(checkInDate);
    const checkOut = new Date(checkOutDate);

    // Check for overlapping reservations
    const conflictingReservation = await this.prisma.reservation.findFirst({
      where: {
        unitId,
        propertyId,
        status: {
          in: [ReservationStatus.CONFIRMED, ReservationStatus.CHECKED_IN],
        },
        OR: [
          {
            checkInDate: { lte: checkOut },
            checkOutDate: { gte: checkIn },
          },
        ],
      },
    });

    if (conflictingReservation) {
      throw new BadRequestException('Unit is not available for the selected dates');
    }
  }

  private async generateReservationNumber(propertyId: string): Promise<string> {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    
    // Get property code (first 2 letters of property name or fallback)
    const property = await this.prisma.property.findUnique({
      where: { id: propertyId },
      select: { name: true },
    });
    
    const propertyCode = property?.name.substring(0, 2).toUpperCase() || 'HT';
    
    // Find next sequence number for today
    const lastReservation = await this.prisma.reservation.findFirst({
      where: {
        propertyId,
        reservationNumber: {
          startsWith: `${propertyCode}${year}${month}`,
        },
      },
      orderBy: {
        reservationNumber: 'desc',
      },
    });

    let sequence = 1;
    if (lastReservation) {
      const lastSequence = parseInt(lastReservation.reservationNumber.slice(-4));
      sequence = lastSequence + 1;
    }

    return `${propertyCode}${year}${month}${String(sequence).padStart(4, '0')}`;
  }
}
```

## Permission System Integration

### Hotel-Specific Permissions

Add these permissions to the existing permission system:

```typescript
// Guest Management Permissions
export const HOTEL_PERMISSIONS = {
  GUEST: {
    CREATE_PROPERTY: 'guest.create.property',
    CREATE_DEPARTMENT: 'guest.create.department',
    READ_PROPERTY: 'guest.read.property',
    READ_DEPARTMENT: 'guest.read.department',
    UPDATE_PROPERTY: 'guest.update.property',
    UPDATE_DEPARTMENT: 'guest.update.department',
    DELETE_PROPERTY: 'guest.delete.property',
    UPDATE_VIP_PROPERTY: 'guest.update_vip.property',
    UPDATE_VIP_DEPARTMENT: 'guest.update_vip.department',
    BLACKLIST_PROPERTY: 'guest.blacklist.property',
    MERGE_PROPERTY: 'guest.merge.property',
  },

  UNIT: {
    CREATE_PROPERTY: 'unit.create.property',
    READ_PROPERTY: 'unit.read.property',
    READ_DEPARTMENT: 'unit.read.department',
    UPDATE_PROPERTY: 'unit.update.property',
    UPDATE_DEPARTMENT: 'unit.update.department',
    DELETE_PROPERTY: 'unit.delete.property',
    UPDATE_STATUS_PROPERTY: 'unit.update_status.property',
    UPDATE_STATUS_DEPARTMENT: 'unit.update_status.department',
    BULK_UPDATE_PROPERTY: 'unit.bulk_update.property',
  },

  RESERVATION: {
    CREATE_PROPERTY: 'reservation.create.property',
    CREATE_DEPARTMENT: 'reservation.create.department',
    READ_PROPERTY: 'reservation.read.property',
    READ_DEPARTMENT: 'reservation.read.department',
    UPDATE_PROPERTY: 'reservation.update.property',
    UPDATE_DEPARTMENT: 'reservation.update.department',
    DELETE_PROPERTY: 'reservation.delete.property',
    CHECKIN_PROPERTY: 'reservation.checkin.property',
    CHECKIN_DEPARTMENT: 'reservation.checkin.department',
    CHECKOUT_PROPERTY: 'reservation.checkout.property',
    CHECKOUT_DEPARTMENT: 'reservation.checkout.department',
    CANCEL_PROPERTY: 'reservation.cancel.property',
    CANCEL_DEPARTMENT: 'reservation.cancel.department',
    MARK_NO_SHOW_PROPERTY: 'reservation.mark_no_show.property',
    MARK_NO_SHOW_DEPARTMENT: 'reservation.mark_no_show.department',
    UPDATE_PAYMENT_PROPERTY: 'reservation.update_payment.property',
    UPDATE_PAYMENT_DEPARTMENT: 'reservation.update_payment.department',
  },

  ANALYTICS: {
    READ_PROPERTY: 'analytics.read.property',
    READ_DEPARTMENT: 'analytics.read.department',
  },
} as const;
```

### Permission Seeding

```typescript
// Add to permission seed script
const hotelPermissions = [
  // Guest permissions
  { resource: 'guest', action: 'create', scope: 'property', description: 'Create guests at property level' },
  { resource: 'guest', action: 'create', scope: 'department', description: 'Create guests at department level' },
  { resource: 'guest', action: 'read', scope: 'property', description: 'Read guests at property level' },
  { resource: 'guest', action: 'read', scope: 'department', description: 'Read guests at department level' },
  { resource: 'guest', action: 'update', scope: 'property', description: 'Update guests at property level' },
  { resource: 'guest', action: 'update', scope: 'department', description: 'Update guests at department level' },
  { resource: 'guest', action: 'delete', scope: 'property', description: 'Delete guests at property level' },
  { resource: 'guest', action: 'update_vip', scope: 'property', description: 'Update guest VIP status at property level' },
  { resource: 'guest', action: 'update_vip', scope: 'department', description: 'Update guest VIP status at department level' },
  { resource: 'guest', action: 'blacklist', scope: 'property', description: 'Blacklist guests at property level' },
  { resource: 'guest', action: 'merge', scope: 'property', description: 'Merge duplicate guests at property level' },

  // Unit permissions
  { resource: 'unit', action: 'create', scope: 'property', description: 'Create units at property level' },
  { resource: 'unit', action: 'read', scope: 'property', description: 'Read units at property level' },
  { resource: 'unit', action: 'read', scope: 'department', description: 'Read units at department level' },
  { resource: 'unit', action: 'update', scope: 'property', description: 'Update units at property level' },
  { resource: 'unit', action: 'update', scope: 'department', description: 'Update units at department level' },
  { resource: 'unit', action: 'delete', scope: 'property', description: 'Delete units at property level' },
  { resource: 'unit', action: 'update_status', scope: 'property', description: 'Update unit status at property level' },
  { resource: 'unit', action: 'update_status', scope: 'department', description: 'Update unit status at department level' },
  { resource: 'unit', action: 'bulk_update', scope: 'property', description: 'Bulk update units at property level' },

  // Reservation permissions
  { resource: 'reservation', action: 'create', scope: 'property', description: 'Create reservations at property level' },
  { resource: 'reservation', action: 'create', scope: 'department', description: 'Create reservations at department level' },
  { resource: 'reservation', action: 'read', scope: 'property', description: 'Read reservations at property level' },
  { resource: 'reservation', action: 'read', scope: 'department', description: 'Read reservations at department level' },
  { resource: 'reservation', action: 'update', scope: 'property', description: 'Update reservations at property level' },
  { resource: 'reservation', action: 'update', scope: 'department', description: 'Update reservations at department level' },
  { resource: 'reservation', action: 'delete', scope: 'property', description: 'Delete reservations at property level' },
  { resource: 'reservation', action: 'checkin', scope: 'property', description: 'Check-in guests at property level' },
  { resource: 'reservation', action: 'checkin', scope: 'department', description: 'Check-in guests at department level' },
  { resource: 'reservation', action: 'checkout', scope: 'property', description: 'Check-out guests at property level' },
  { resource: 'reservation', action: 'checkout', scope: 'department', description: 'Check-out guests at department level' },
  { resource: 'reservation', action: 'cancel', scope: 'property', description: 'Cancel reservations at property level' },
  { resource: 'reservation', action: 'cancel', scope: 'department', description: 'Cancel reservations at department level' },
  { resource: 'reservation', action: 'mark_no_show', scope: 'property', description: 'Mark no-show at property level' },
  { resource: 'reservation', action: 'mark_no_show', scope: 'department', description: 'Mark no-show at department level' },
  { resource: 'reservation', action: 'update_payment', scope: 'property', description: 'Update payment status at property level' },
  { resource: 'reservation', action: 'update_payment', scope: 'department', description: 'Update payment status at department level' },

  // Analytics permissions
  { resource: 'analytics', action: 'read', scope: 'property', description: 'Read analytics at property level' },
  { resource: 'analytics', action: 'read', scope: 'department', description: 'Read analytics at department level' },
];
```

## Multi-Tenant Implementation

### Automatic Tenant Filtering

All services automatically inherit tenant context through the `TenantInterceptor` and `TenantContextService`. Key patterns:

```typescript
// In service methods - always use tenant context
const tenantContext = this.tenantContextService.getTenantContext();

// All database queries automatically filtered by propertyId
const whereClause = {
  propertyId: tenantContext.propertyId,
  // ... other filters
};
```

### Cross-Property Operations

For hotel chains with multiple properties, use organization-level permissions:

```typescript
// Allow cross-property access for organization admins
@RequirePermission('guest.read.organization', 'guest.read.property')
async findAllGuestsInOrganization() {
  const tenantContext = this.tenantContextService.getTenantContext();
  
  return this.prisma.guest.findMany({
    where: {
      property: {
        organizationId: tenantContext.organizationId
      }
    },
    include: { property: true }
  });
}
```

## Business Logic Patterns

### Availability Checking

```typescript
interface AvailabilityChecker {
  checkUnitAvailability(
    unitId: string, 
    checkIn: Date, 
    checkOut: Date
  ): Promise<boolean>;
  
  getAvailableUnits(
    checkIn: Date, 
    checkOut: Date, 
    criteria: AvailabilityCriteria
  ): Promise<Unit[]>;
  
  calculateRateForPeriod(
    unitId: string, 
    checkIn: Date, 
    checkOut: Date
  ): Promise<RateCalculation>;
}
```

### Conflict Prevention

```typescript
// Prevent double bookings
private async validateNoConflictingReservations(
  unitId: string,
  checkIn: Date,
  checkOut: Date,
  excludeReservationId?: string
): Promise<void> {
  const conflictingReservation = await this.prisma.reservation.findFirst({
    where: {
      unitId,
      status: { in: [ReservationStatus.CONFIRMED, ReservationStatus.CHECKED_IN] },
      AND: [
        { checkInDate: { lte: checkOut } },
        { checkOutDate: { gte: checkIn } }
      ],
      ...(excludeReservationId && { id: { not: excludeReservationId } })
    }
  });

  if (conflictingReservation) {
    throw new BadRequestException('Unit is not available for the selected dates');
  }
}
```

### State Transitions

```typescript
// Reservation status transitions
const VALID_TRANSITIONS: Record<ReservationStatus, ReservationStatus[]> = {
  [ReservationStatus.CONFIRMED]: [ReservationStatus.CHECKED_IN, ReservationStatus.CANCELLED, ReservationStatus.NO_SHOW],
  [ReservationStatus.CHECKED_IN]: [ReservationStatus.CHECKED_OUT],
  [ReservationStatus.CHECKED_OUT]: [], // Terminal state
  [ReservationStatus.CANCELLED]: [], // Terminal state
  [ReservationStatus.NO_SHOW]: [ReservationStatus.CHECKED_IN], // Can still check in late
};

private validateStatusTransition(from: ReservationStatus, to: ReservationStatus): void {
  if (!VALID_TRANSITIONS[from].includes(to)) {
    throw new BadRequestException(`Cannot change status from ${from} to ${to}`);
  }
}
```

## Error Handling Strategy

### HTTP Error Responses

```typescript
export class HotelErrorHandler {
  static handleNotFound(entity: string, id?: string): never {
    throw new NotFoundException(`${entity}${id ? ` with ID ${id}` : ''} not found`);
  }

  static handleConflict(message: string): never {
    throw new ConflictException(message);
  }

  static handleValidation(message: string): never {
    throw new BadRequestException(message);
  }

  static handlePermissionDenied(action: string, resource: string): never {
    throw new ForbiddenException(`Insufficient permissions to ${action} ${resource}`);
  }
}

// Usage in services
if (!guest) {
  HotelErrorHandler.handleNotFound('Guest', guestId);
}

if (hasConflictingReservation) {
  HotelErrorHandler.handleConflict('Unit is not available for the selected dates');
}
```

### Validation Error Format

```typescript
{
  "success": false,
  "error": {
    "code": "VALIDATION_FAILED",
    "message": "Validation failed",
    "details": [
      {
        "field": "checkOutDate",
        "message": "Check-out date must be after check-in date",
        "value": "2024-03-10"
      }
    ]
  }
}
```

## Integration Points

### Task System Integration

```typescript
// Create housekeeping tasks automatically
async createHousekeepingTask(
  reservationId: string,
  unitId: string,
  taskType: TaskType,
  dueDate: Date
): Promise<void> {
  await this.prisma.task.create({
    data: {
      propertyId: this.tenantContextService.getTenantContext().propertyId,
      title: `${taskType} - Unit ${unitNumber}`,
      taskType,
      priority: TaskPriority.MEDIUM,
      status: TaskStatus.PENDING,
      unitId,
      reservationId,
      dueDate,
      createdBy: this.currentUser.id,
    }
  });
}
```

### User System Integration

```typescript
// Link staff to reservations for check-in/check-out
interface StaffAssignment {
  reservationId: string;
  staffId: string;
  role: 'front_desk' | 'housekeeping' | 'maintenance';
  assignedAt: Date;
}
```

### Audit System Integration

```typescript
// All hotel operations are automatically audited
await this.auditService.logUpdate(
  currentUser.id,
  'Reservation',
  reservationId,
  { status: oldStatus },
  { status: newStatus, checkedInAt: new Date() }
);
```

## Testing Approach

### Unit Testing

```typescript
describe('ReservationService', () => {
  describe('create', () => {
    it('should create reservation with valid data', async () => {
      const createDto: CreateReservationDto = {
        guestId: 'guest-id',
        unitId: 'unit-id',
        checkInDate: '2024-03-15',
        checkOutDate: '2024-03-18',
        adults: 2,
        totalAmount: 450.00,
      };

      const result = await service.create(createDto, mockUser);

      expect(result.reservationNumber).toBeDefined();
      expect(result.status).toBe(ReservationStatus.CONFIRMED);
    });

    it('should prevent double bookings', async () => {
      // Mock existing reservation
      mockPrismaService.reservation.findFirst.mockResolvedValue(mockExistingReservation);

      await expect(
        service.create(createDto, mockUser)
      ).rejects.toThrow('Unit is not available for the selected dates');
    });
  });
});
```

### Integration Testing

```typescript
describe('Reservation API Integration', () => {
  it('should create and check-in reservation end-to-end', async () => {
    // Create guest
    const guestResponse = await request(app.getHttpServer())
      .post('/guests')
      .send(createGuestDto)
      .expect(201);

    // Create reservation
    const reservationResponse = await request(app.getHttpServer())
      .post('/reservations')
      .send({
        ...createReservationDto,
        guestId: guestResponse.body.data.id
      })
      .expect(201);

    // Check-in
    await request(app.getHttpServer())
      .post(`/reservations/${reservationResponse.body.data.id}/check-in`)
      .send({ notes: 'Guest arrived early' })
      .expect(200);

    // Verify unit status changed
    const unit = await prismaService.unit.findUnique({
      where: { id: createReservationDto.unitId }
    });
    expect(unit.status).toBe(UnitStatus.OCCUPIED);
  });
});
```

### Load Testing

```typescript
describe('Availability Checking Performance', () => {
  it('should handle 100 concurrent availability checks', async () => {
    const promises = Array.from({ length: 100 }, () =>
      service.checkAvailability(availabilityDto, mockUser)
    );

    const startTime = Date.now();
    await Promise.all(promises);
    const duration = Date.now() - startTime;

    expect(duration).toBeLessThan(5000); // 5 seconds max
  });
});
```

## Implementation Timeline

### Week 1: Foundation Setup
- [ ] Create Guest, Unit, Reservation modules with basic structure
- [ ] Implement DTOs with comprehensive validation
- [ ] Set up basic CRUD controllers with permission guards
- [ ] Create service skeletons with tenant context integration

### Week 2: Core Business Logic
- [ ] Implement Guest service with search and merge functionality
- [ ] Build Unit service with availability checking
- [ ] Create Reservation service with conflict prevention
- [ ] Add comprehensive business rule validation

### Week 3: Advanced Features
- [ ] Implement check-in/check-out workflows
- [ ] Add automated task creation for housekeeping
- [ ] Build calendar and reporting endpoints
- [ ] Create bulk operations for units and reservations

### Week 4: Integration and Testing
- [ ] Integration testing with existing User/Property systems
- [ ] Performance optimization for availability queries
- [ ] End-to-end testing of complete guest journey
- [ ] Load testing for concurrent operations

### Week 5: Deployment and Monitoring
- [ ] Deploy to Railway with proper environment variables
- [ ] Set up monitoring and alerting for hotel operations
- [ ] Performance benchmarking and optimization
- [ ] Documentation and handover

## Production Considerations

### Database Optimization

```sql
-- Indexes for high-performance queries
CREATE INDEX CONCURRENTLY idx_reservations_availability 
ON reservations (unit_id, check_in_date, check_out_date, status)
WHERE status IN ('CONFIRMED', 'CHECKED_IN');

CREATE INDEX CONCURRENTLY idx_guests_search 
ON guests USING gin (to_tsvector('english', first_name || ' ' || last_name || ' ' || COALESCE(email, '')));

CREATE INDEX CONCURRENTLY idx_units_availability 
ON units (property_id, unit_type, status, is_active)
WHERE is_active = true AND deleted_at IS NULL;
```

### Caching Strategy

```typescript
@Injectable()
export class CacheService {
  // Cache unit availability for 5 minutes
  @Cache('unit-availability', 300)
  async getUnitAvailability(propertyId: string, date: string) {
    // Implementation
  }

  // Cache guest search results for 1 minute
  @Cache('guest-search', 60)
  async searchGuests(propertyId: string, searchTerm: string) {
    // Implementation
  }
}
```

### Rate Limiting

```typescript
// Protect availability checking from abuse
@Throttle(100, 60) // 100 requests per minute
@Get('availability')
async checkAvailability() {
  // Implementation
}
```

This comprehensive backend architecture provides a production-ready foundation for hotel core operations, with complete API specifications, multi-tenant security, advanced permission system integration, and robust business logic patterns. The implementation follows established patterns from the existing codebase while introducing hotel-specific functionality and optimizations.

---

**File Location**: `C:\Users\jovy2\Documents\VTF\staffnbdt\HOTEL_CORE_BACKEND_ARCHITECTURE.md`

This document serves as the complete implementation blueprint for the hotel operations backend, covering all technical requirements for Guests, Units, and Reservations management in a multi-tenant environment.