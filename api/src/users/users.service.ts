import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User, UserRole } from './users.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
  ) {}

  async findAll(): Promise<Omit<User, 'password'>[]> {
    const users = await this.userRepo.find({
      where: { isActive: true },
      order: { createdAt: 'DESC' },
    });
    return users.map(({ password, ...user }) => user);
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.userRepo.findOne({ where: { email } });
  }

  async findById(id: number): Promise<User | null> {
    return this.userRepo.findOne({ where: { id } });
  }

  async create(data: {
    name: string;
    email: string;
    password: string;
    role: UserRole;
  }): Promise<Omit<User, 'password'>> {
    const existing = await this.findByEmail(data.email);
    if (existing) {
      throw new ConflictException('Ya existe un usuario con ese email');
    }

    const hashedPassword = await bcrypt.hash(data.password, 10);
    const avatar = `https://api.dicebear.com/9.x/initials/svg?seed=${encodeURIComponent(data.name)}`;

    const user = this.userRepo.create({
      ...data,
      password: hashedPassword,
      avatar,
    });

    const saved = await this.userRepo.save(user);
    const { password, ...result } = saved;
    return result;
  }

  async update(
    id: number,
    data: Partial<{ name: string; email: string; role: UserRole; password: string }>,
  ): Promise<Omit<User, 'password'>> {
    const user = await this.findById(id);
    if (!user) throw new NotFoundException('Usuario no encontrado');

    if (data.password) {
      data.password = await bcrypt.hash(data.password, 10);
    }

    if (data.name) {
      (data as any).avatar = `https://api.dicebear.com/9.x/initials/svg?seed=${encodeURIComponent(data.name)}`;
    }

    await this.userRepo.update(id, data);
    const updated = await this.findById(id);
    const { password, ...result } = updated!;
    return result;
  }

  async remove(id: number): Promise<void> {
    await this.userRepo.update(id, { isActive: false });
  }

  async validatePassword(user: User, plainPassword: string): Promise<boolean> {
    return bcrypt.compare(plainPassword, user.password);
  }
}
