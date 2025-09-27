import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { AuthRepository } from '../auth.repository';

@Injectable()
export class CleanupService {
  constructor(private readonly authRepository: AuthRepository) {}

  /**
   * Limpia códigos de reset expirados cada hora
   */
  @Cron(CronExpression.EVERY_HOUR)
  async cleanExpiredResetCodes() {
    try {
      console.log('Iniciando limpieza de códigos de reset expirados...');
      await this.authRepository.cleanExpiredResetCodes();
      console.log('Limpieza de códigos expirados completada');
    } catch (error) {
      console.error('Error durante la limpieza de códigos expirados:', error);
    }
  }

  /**
   * Método manual para limpiar códigos expirados
   */
  async manualCleanup(): Promise<void> {
    await this.authRepository.cleanExpiredResetCodes();
  }
}
