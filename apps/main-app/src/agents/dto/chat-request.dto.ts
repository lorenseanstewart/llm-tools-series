import { IsString, IsNotEmpty, MinLength } from "class-validator";

export class ChatRequestDto {
  @IsString()
  @IsNotEmpty({ message: "User ID cannot be empty" })
  userId: string;

  @IsString()
  @IsNotEmpty({ message: "Message cannot be empty" })
  @MinLength(2, { message: "Message must be at least 2 characters long" })
  userMessage: string;
}