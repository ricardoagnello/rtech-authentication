import { IsNotEmpty, IsString, Length, Matches } from 'class-validator';

export class CreateContainerDto {
  @IsString()
  @IsNotEmpty()
  @Length(3, 50)
  @Matches(/^[a-zA-Z0-9-_]+$/, {
    message: 'O nome só pode conter letras, números, hífens e underlines.',
  })
  name: string;

  @IsString()
  @IsNotEmpty()
  userId: string;

  @IsString()
  @IsNotEmpty()
  planId: string;

  @IsString()
  @IsNotEmpty()
  type: 'app' | 'db';

  @IsString()
  @IsNotEmpty()
  image: string;
}
