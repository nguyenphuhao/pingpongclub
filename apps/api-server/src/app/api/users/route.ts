import { NextRequest } from 'next/server';
import { userService } from '@/server/modules/users/application/user.service';
import { CreateUserDtoSchema, QueryUsersDtoSchema } from '@/shared/dtos';
import { successResponse, errorResponse } from '@/server/http/utils/response.helper';
import { validateBody, validateQuery } from '@/server/http/utils/validation.helper';

/**
 * @swagger
 * /api/users:
 *   get:
 *     tags:
 *       - Users
 *     summary: List users with pagination
 *     description: Get a paginated list of users with optional filters
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 10
 *         description: Items per page
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search by email or name
 *       - in: query
 *         name: role
 *         schema:
 *           type: string
 *           enum: [USER, ADMIN, MODERATOR]
 *         description: Filter by role
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [ACTIVE, INACTIVE, SUSPENDED, DELETED]
 *         description: Filter by status
 *     responses:
 *       200:
 *         description: Success
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PaginatedUserResponse'
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 * 
 * ✅ Trong NestJS:
 * 
 * @Get()
 * @ApiOperation({ summary: 'List users with pagination' })
 * @ApiQuery({ name: 'page', required: false, type: Number })
 * @ApiQuery({ name: 'limit', required: false, type: Number })
 * @ApiResponse({ status: 200, type: PaginatedUserResponse })
 * async findAll(@Query() query: QueryUsersDto) {
 *   return this.userService.listUsers(query);
 * }
 */
export async function GET(request: NextRequest) {
  try {
    // Parse query params
    const searchParams = request.nextUrl.searchParams;
    const queryData: any = {};
    
    // Only include params that exist
    const page = searchParams.get('page');
    const limit = searchParams.get('limit');
    const search = searchParams.get('search');
    const role = searchParams.get('role');
    const status = searchParams.get('status');
    const orderBy = searchParams.get('orderBy');
    const order = searchParams.get('order');
    
    if (page) queryData.page = page;
    if (limit) queryData.limit = limit;
    if (search) queryData.search = search;
    if (role) queryData.role = role;
    if (status) queryData.status = status;
    if (orderBy) queryData.orderBy = orderBy;
    if (order) queryData.order = order;

    // Validate query
    const query = validateQuery(QueryUsersDtoSchema, queryData);

    // Call service
    const result = await userService.listUsers(query);

    return successResponse(result.data, 200, result.meta);
  } catch (error: any) {
    return errorResponse(error);
  }
}

/**
 * @swagger
 * /api/users:
 *   post:
 *     tags:
 *       - Users
 *     summary: Create new user
 *     description: Create a new user account
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateUserDto'
 *     responses:
 *       201:
 *         description: User created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UserResponse'
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       409:
 *         description: User already exists
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 * 
 * ✅ Trong NestJS:
 * 
 * @Post()
 * @ApiOperation({ summary: 'Create new user' })
 * @ApiBody({ type: CreateUserDto })
 * @ApiResponse({ status: 201, type: UserResponse })
 * async create(@Body() dto: CreateUserDto) {
 *   return this.userService.createUser(dto);
 * }
 */
export async function POST(request: NextRequest) {
  try {
    // Parse and validate body
    const body = await request.json();
    const dto = await validateBody(CreateUserDtoSchema, body);

    // Call service
    const user = await userService.createUser(dto);

    return successResponse(user, 201);
  } catch (error: any) {
    return errorResponse(error);
  }
}

