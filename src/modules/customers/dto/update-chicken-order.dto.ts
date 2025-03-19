import { PartialType } from '@nestjs/swagger';
import { CreateChickenOrderDto } from './create-chicken-order.dto';

export class UpdateChickenOrderDto extends PartialType(CreateChickenOrderDto) {} 