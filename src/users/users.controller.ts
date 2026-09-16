import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { UsersService } from './users.service.js';
import { CreateUserDto } from './dto/create-user.dto.js';

@ApiTags('Users')
@Controller('users')
export class UsersController {
    constructor(
        private readonly usersService: UsersService,
    ) {}

    @Post()
    @ApiOperation({ summary: 'Create a new user' })
    create(@Body() createUserDto: CreateUserDto) {
        return this.usersService.createUser(createUserDto);
    }
    @Get()
    @ApiOperation({ summary: 'Get all users' })
    findAll() {
        return this.usersService.getAllUsers();
    }
    @Get(':id')
    @ApiOperation({ summary: 'Get a single user by ID' })
    @ApiParam({ name: 'id', description: 'User ID' })
    findOne(@Param('id') id: string) {
        return this.usersService.getUserById(id);
    }
}

