import { DataSource } from 'typeorm';
import { AppDataSource } from '../config/data-source';
import * as bcrypt from 'bcrypt';

async function updatePassword() {
  try {
    await AppDataSource.initialize();
    
    const userRepository = AppDataSource.getRepository('users');
    const user = await userRepository.findOne({
      where: { email: 'belinda@gmail.com' }
    });

    if (!user) {
      console.log('User not found');
      return;
    }

    console.log('Found user:', user);
    const hashedPassword = await bcrypt.hash('1234', 10);
    console.log('Generated hash:', hashedPassword);
    
    await userRepository.update(user.id, { password: hashedPassword });
    console.log('Password updated successfully');
  } catch (error) {
    console.error('Error updating password:', error);
  } finally {
    await AppDataSource.destroy();
  }
}

updatePassword(); 