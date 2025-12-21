import {
    IsEmail,
    IsNotEmpty,
    IsString,
    MinLength
} from 'class-validator';

export class AuthDto {
    @IsEmail()
    @IsNotEmpty()
    email: string;

    @IsNotEmpty()
    @IsString()
    @MinLength(8)
    password: string;
}
