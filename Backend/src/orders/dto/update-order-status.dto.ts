import { IsString, IsIn } from 'class-validator';

const ORDER_STATUSES = ['PLACED', 'PREPARING', 'READY', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED'];

export class UpdateOrderStatusDto {
  @IsString()
  @IsIn(ORDER_STATUSES, {
    message: `status must be one of: ${ORDER_STATUSES.join(', ')}`,
  })
  status: string;
}
