import { DataSource } from 'typeorm';
import { AppDataSource } from '../config/data-source';
import * as bcrypt from 'bcrypt';

async function createAdminUser() {
  try {
    await AppDataSource.initialize();
    
    const userRepository = AppDataSource.getRepository('users');
    
    // Check if user already exists
    const existingUser = await userRepository.findOne({
      where: { email: 'belinda@gmail.com' }
    });

    if (existingUser) {
      console.log('User already exists, updating password...');
      const hashedPassword = await bcrypt.hash('1234', 10);
      await userRepository.update(existingUser.id, { password: hashedPassword });
      console.log('Password updated successfully');
      return;
    }

    // Create new user
    const hashedPassword = await bcrypt.hash('1234', 10);
    const newUser = userRepository.create({
      email: 'belinda@gmail.com',
      password: hashedPassword,
      name: 'belinda',
      role: 'ADMIN',
      isActive: true
    });

    await userRepository.save(newUser);
    console.log('Admin user created successfully');
  } catch (error) {
    console.error('Error creating admin user:', error);
  } finally {
    await AppDataSource.destroy();
  }
}

createAdminUser(); 