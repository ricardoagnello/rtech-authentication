import { Expose } from 'class-transformer';

export class ContainerResponseDto {
  @Expose()
  id: string;

  @Expose()
  name: string;

  @Expose()
  status: string;

  @Expose()
  image: string;

  @Expose()
  createdAt: Date;
}
