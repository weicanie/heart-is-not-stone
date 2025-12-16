import { registformSchema } from '@not_stone/shared';
import { createZodDto } from 'nestjs-zod';

export class RegisterUserDto extends createZodDto(registformSchema) {}
