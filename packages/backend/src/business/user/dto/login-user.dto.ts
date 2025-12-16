import { loginformSchema } from '@not_stone/shared';
import { createZodDto } from 'nestjs-zod';

export class LoginUserDto extends createZodDto(loginformSchema) {}
