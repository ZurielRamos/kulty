import {
  IsString,
  IsOptional,
  IsBoolean,
  IsEnum,
  IsArray,
  IsIn,
  ArrayMinSize,
} from 'class-validator';
import { Category } from '../enums/category.enum';
import { Style } from '../enums/style.enum';

export class CreateProductDto {
  @IsString()
  title: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsEnum(Category)
  category: Category;

  @IsEnum(Style)
  style: Style;

  @IsIn(['vertical', 'horizontal'])
  orientation: 'vertical' | 'horizontal';

  @IsArray()
  @IsString({ each: true })
  @ArrayMinSize(1)
  gallery: string[];

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
